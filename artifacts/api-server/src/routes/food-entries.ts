import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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
  const entries = await db
    .select()
    .from(foodEntriesTable)
    .where(eq(foodEntriesTable.date, date))
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
  const [entry] = await db
    .insert(foodEntriesTable)
    .values({
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

  const [deleted] = await db
    .delete(foodEntriesTable)
    .where(eq(foodEntriesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
