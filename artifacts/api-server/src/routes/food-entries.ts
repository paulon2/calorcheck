import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, foodEntriesTable } from "@workspace/db";
import {
  ListFoodEntriesQueryParams,
  ListFoodEntriesResponse,
  CreateFoodEntryBody,
  DeleteFoodEntryParams,
} from "@workspace/api-zod";
import { format } from "date-fns";

const router: IRouter = Router();

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

router.get("/food-entries", async (req, res): Promise<void> => {
  const parsed = ListFoodEntriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const date = parsed.data.date ?? todayStr();
  const userId = req.session.userId!;

  const entries = await db
    .select()
    .from(foodEntriesTable)
    .where(and(eq(foodEntriesTable.date, date), eq(foodEntriesTable.userId, userId)))
    .orderBy(foodEntriesTable.createdAt);

  res.json(ListFoodEntriesResponse.parse(entries.map(e => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }))));
});

router.post("/food-entries", async (req, res): Promise<void> => {
  const parsed = CreateFoodEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const date = parsed.data.date ?? todayStr();
  const userId = req.session.userId!;

  const [entry] = await db
    .insert(foodEntriesTable)
    .values({
      userId,
      name: parsed.data.name,
      calories: parsed.data.calories,
      quantity: parsed.data.quantity,
      meal: parsed.data.meal,
      date,
    })
    .returning();

  res.status(201).json({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  });
});

router.delete("/food-entries/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFoodEntryParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;

  const [deleted] = await db
    .delete(foodEntriesTable)
    .where(and(eq(foodEntriesTable.id, params.data.id), eq(foodEntriesTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
