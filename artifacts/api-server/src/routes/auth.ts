import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod/v4";
import { calculateDailyGoal } from "../lib/calorie-calc.js";
import { requireAuth } from "../middlewares/require-auth.js";
import crypto from "crypto";

const router: IRouter = Router();

// ─── In-memory token store for password reset ────────────────────────────────
// Tokens expire in 30 minutes. Lost on server restart (acceptable for small apps).
interface ResetToken {
  userId: number;
  email: string;
  expiry: number;
}
const resetTokens = new Map<string, ResetToken>();

function pruneExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of resetTokens) {
    if (data.expiry < now) resetTokens.delete(token);
  }
}

// ─── Schemas ─────────────────────────────────────────────────────────────────
const RegisterBody = z.object({
  email: z.string().email("E-mail invalido"),
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  sex: z.enum(["M", "F"]).optional(),
  birthYear: z.number().int().min(1920).max(new Date().getFullYear() - 10).optional(),
  weightKg: z.number().int().min(20).max(300).optional(),
  heightCm: z.number().int().min(100).max(250).optional(),
  goalType: z.enum(["lose_strong", "lose_moderate", "lose_light", "maintain", "gain_light", "gain"]).optional(),
  customGoal: z.number().int().min(500).max(10000).optional(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    sex: user.sex,
    birthYear: user.birthYear,
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    goalType: user.goalType,
    customGoal: user.customGoal,
    dailyGoal: calculateDailyGoal(user),
    createdAt: user.createdAt.toISOString(),
  };
}

function getAppUrl(req: { headers: { host?: string; "x-forwarded-proto"?: string } }): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const protocol = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers.host ?? "localhost";
  return `${protocol}://${host}`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Dados invalidos" });
    return;
  }

  const { email, name, password, sex, birthYear, weightKg, heightCm, goalType, customGoal } = parsed.data;

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "E-mail ja cadastrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      sex: sex ?? null,
      birthYear: birthYear ?? null,
      weightKg: weightKg ?? null,
      heightCm: heightCm ?? null,
      goalType: goalType ?? null,
      customGoal: customGoal ?? null,
    })
    .returning();

  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));

  res.status(201).json(serializeUser(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados invalidos" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
    return;
  }

  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));

  res.json(serializeUser(user));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.sendStatus(204);
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "Sessao invalida" });
    return;
  }
  res.json(serializeUser(user));
});

router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const UpdateProfileBody = z.object({
    name: z.string().min(2).optional(),
    sex: z.enum(["M", "F"]).nullable().optional(),
    birthYear: z.number().int().min(1920).max(new Date().getFullYear() - 10).nullable().optional(),
    weightKg: z.number().int().min(20).max(300).nullable().optional(),
    heightCm: z.number().int().min(100).max(250).nullable().optional(),
    goalType: z.enum(["lose_strong", "lose_moderate", "lose_light", "maintain", "gain_light", "gain"]).nullable().optional(),
    customGoal: z.number().int().min(500).max(10000).nullable().optional(),
  });

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Dados invalidos" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.session.userId!))
    .returning();

  res.json(serializeUser(updated));
});

// ─── Password Reset ───────────────────────────────────────────────────────────

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const body = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "E-mail invalido" });
    return;
  }

  pruneExpiredTokens();

  const email = body.data.email.toLowerCase();
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    // Don't reveal whether email exists
    res.json({ ok: true });
    return;
  }

  const token = crypto.randomUUID();
  resetTokens.set(token, {
    userId: user.id,
    email: user.email,
    expiry: Date.now() + 30 * 60 * 1000, // 30 minutes
  });

  const appUrl = getAppUrl(req);
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  // Log to server console so admin can retrieve it from Render/server logs
  console.log(`[Password Reset] ${email} → ${resetUrl}`);

  // Return the reset URL directly so the frontend can show it
  // (acceptable for small personal apps without email configuration)
  res.json({ ok: true, resetUrl });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const body = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  }).safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: body.data ? "Senha deve ter ao menos 6 caracteres" : "Dados invalidos" });
    return;
  }

  pruneExpiredTokens();

  const tokenData = resetTokens.get(body.data.token);
  if (!tokenData || tokenData.expiry < Date.now()) {
    res.status(400).json({ error: "Link de recuperacao invalido ou expirado. Solicite um novo." });
    return;
  }

  const passwordHash = await bcrypt.hash(body.data.newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, tokenData.userId));

  resetTokens.delete(body.data.token);

  res.json({ ok: true });
});

export default router;
