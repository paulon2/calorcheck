import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody, GetSettingsResponse, UpdateSettingsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureSettings() {
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (!existing) {
    const [created] = await db.insert(settingsTable).values({ dailyGoal: 2000 }).returning();
    return created;
  }
  return existing;
}

router.get("/settings", async (req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(GetSettingsResponse.parse(settings));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await ensureSettings();
  const [updated] = await db
    .update(settingsTable)
    .set({ dailyGoal: parsed.data.dailyGoal })
    .where(eq(settingsTable.id, existing.id))
    .returning();

  res.json(UpdateSettingsResponse.parse(updated));
});

export default router;
