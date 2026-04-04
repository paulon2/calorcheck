import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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

  let query = db.select().from(recipesTable);
  if (parsed.data.favoritesOnly === "true") {
    query = query.where(eq(recipesTable.isFavorite, true)) as typeof query;
  }

  const recipes = await query.orderBy(recipesTable.createdAt);
  res.json(ListRecipesResponse.parse(recipes.map(serializeRecipe)));
});

router.post("/recipes", async (req, res): Promise<void> => {
  const parsed = CreateRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [recipe] = await db
    .insert(recipesTable)
    .values({
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

  const [recipe] = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.id, params.data.id));

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

  const [deleted] = await db
    .delete(recipesTable)
    .where(eq(recipesTable.id, params.data.id))
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

  const [updated] = await db
    .update(recipesTable)
    .set({ isFavorite: body.data.isFavorite })
    .where(eq(recipesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.json(GetRecipeResponse.parse(serializeRecipe(updated)));
});

export default router;
