import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, foodEntriesTable, usersTable } from "@workspace/db";
import { GetDailySummaryQueryParams, GetDailySummaryResponse, GetWeeklyStatsResponse } from "@workspace/api-zod";
import { format, subDays } from "date-fns";
import { calculateDailyGoal } from "../lib/calorie-calc.js";

const router: IRouter = Router();

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

async function getUserGoal(userId: number): Promise<number> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user ? calculateDailyGoal(user) : 2000;
}

router.get("/summary", async (req, res): Promise<void> => {
  const parsed = GetDailySummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const date = parsed.data.date ?? todayStr();
  const userId = req.session.userId!;
  const dailyGoal = await getUserGoal(userId);

  const entries = await db
    .select()
    .from(foodEntriesTable)
    .where(and(eq(foodEntriesTable.date, date), eq(foodEntriesTable.userId, userId)));

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
  const userId = req.session.userId!;
  const dailyGoal = await getUserGoal(userId);
  const today = new Date();

  const stats = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const entries = await db
      .select()
      .from(foodEntriesTable)
      .where(and(eq(foodEntriesTable.date, dateStr), eq(foodEntriesTable.userId, userId)));
    const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
    stats.push({ date: dateStr, totalCalories, dailyGoal });
  }

  res.json(GetWeeklyStatsResponse.parse(stats));
});

export default router;
