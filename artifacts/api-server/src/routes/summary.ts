import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, foodEntriesTable, settingsTable } from "@workspace/db";
import { GetDailySummaryQueryParams, GetDailySummaryResponse, GetWeeklyStatsResponse } from "@workspace/api-zod";
import { format, subDays } from "date-fns";

const router: IRouter = Router();

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

async function getGoal(): Promise<number> {
  const [settings] = await db.select().from(settingsTable).limit(1);
  return settings?.dailyGoal ?? 2000;
}

router.get("/summary", async (req, res): Promise<void> => {
  const parsed = GetDailySummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const date = parsed.data.date ?? todayStr();
  const dailyGoal = await getGoal();

  const entries = await db
    .select()
    .from(foodEntriesTable)
    .where(eq(foodEntriesTable.date, date));

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  const breakdownByMeal = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };
  for (const e of entries) {
    const meal = e.meal as keyof typeof breakdownByMeal;
    if (meal in breakdownByMeal) {
      breakdownByMeal[meal] += e.calories;
    }
  }

  const remaining = dailyGoal - totalCalories;
  const percentUsed = dailyGoal > 0 ? (totalCalories / dailyGoal) * 100 : 0;

  let status: "on_track" | "warning" | "over_goal" = "on_track";
  if (totalCalories > dailyGoal) status = "over_goal";
  else if (percentUsed >= 80) status = "warning";

  const summary = {
    date,
    totalCalories,
    dailyGoal,
    remaining,
    percentUsed: Math.round(percentUsed * 10) / 10,
    breakdownByMeal,
    status,
  };

  res.json(GetDailySummaryResponse.parse(summary));
});

router.get("/weekly-stats", async (req, res): Promise<void> => {
  const dailyGoal = await getGoal();
  const today = new Date();

  const stats = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const entries = await db
      .select()
      .from(foodEntriesTable)
      .where(eq(foodEntriesTable.date, dateStr));
    const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
    stats.push({ date: dateStr, totalCalories, dailyGoal });
  }

  res.json(GetWeeklyStatsResponse.parse(stats));
});

export default router;
