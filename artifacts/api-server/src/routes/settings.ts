import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateSettingsBody, GetSettingsResponse, UpdateSettingsResponse } from "@workspace/api-zod";
import { calculateDailyGoal } from "../lib/calorie-calc.js";

const router: IRouter = Router();

router.get("/settings", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "Nao autenticado" });
    return;
  }
  const dailyGoal = calculateDailyGoal(user);
  res.json(GetSettingsResponse.parse({ id: user.id, dailyGoal }));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ customGoal: parsed.data.dailyGoal })
    .where(eq(usersTable.id, req.session.userId!))
    .returning();

  res.json(UpdateSettingsResponse.parse({ id: updated.id, dailyGoal: calculateDailyGoal(updated) }));
});

export default router;
