import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod/v4";
import { calculateDailyGoal } from "../lib/calorie-calc.js";
import { requireAuth } from "../middlewares/require-auth.js";

const router: IRouter = Router();

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

export default router;
