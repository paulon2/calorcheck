import { pgTable, integer, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ingredients: text("ingredients").notNull(),
  instructions: text("instructions").notNull(),
  calories: integer("calories"),
  photoPath: text("photo_path"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecipeSchema = createInsertSchema(recipesTable).omit({ id: true, createdAt: true });
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipesTable.$inferSelect;
