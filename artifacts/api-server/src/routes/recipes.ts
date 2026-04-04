import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, recipesTable } from "@workspace/db";
import {
  ListRecipesQueryParams,
  ListRecipesResponse,
  CreateRecipeBody,
  GetRecipeParams,
  GetRecipeResponse,
  DeleteRecipeParams,
  ToggleRecipeFavoriteBody,
  ToggleRecipeFavoriteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeRecipe(r: typeof recipesTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    calories: r.calories ?? null,
    photoPath: r.photoPath ?? null,
  };
}

router.get("/recipes", async (req, res): Promise<void> => {
  const parsed = ListRecipesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const conditions = [eq(recipesTable.userId, userId)];
  if (parsed.data.favoritesOnly === "true") {
    conditions.push(eq(recipesTable.isFavorite, true));
  }

  const recipes = await db
    .select()
    .from(recipesTable)
    .where(and(...conditions))
    .orderBy(recipesTable.createdAt);

  res.json(ListRecipesResponse.parse(recipes.map(serializeRecipe)));
});

router.post("/recipes", async (req, res): Promise<void> => {
  const parsed = CreateRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;

  const [recipe] = await db
    .insert(recipesTable)
    .values({
      userId,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      ingredients: parsed.data.ingredients,
      instructions: parsed.data.instructions,
      calories: parsed.data.calories ?? null,
      photoPath: parsed.data.photoPath ?? null,
      isFavorite: false,
    })
    .returning();

  res.status(201).json(GetRecipeResponse.parse(serializeRecipe(recipe)));
});

router.get("/recipes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRecipeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [recipe] = await db
    .select()
    .from(recipesTable)
    .where(and(eq(recipesTable.id, params.data.id), eq(recipesTable.userId, userId)));

  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.json(GetRecipeResponse.parse(serializeRecipe(recipe)));
});

router.delete("/recipes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteRecipeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [deleted] = await db
    .delete(recipesTable)
    .where(and(eq(recipesTable.id, params.data.id), eq(recipesTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/recipes/:id/favorite", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ToggleRecipeFavoriteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ToggleRecipeFavoriteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [updated] = await db
    .update(recipesTable)
    .set({ isFavorite: body.data.isFavorite })
    .where(and(eq(recipesTable.id, params.data.id), eq(recipesTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.json(GetRecipeResponse.parse(serializeRecipe(updated)));
});

export default router;
