import { pgTable, integer, serial, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foodEntriesTable = pgTable("food_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  quantity: text("quantity").notNull(),
  meal: text("meal").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFoodEntrySchema = createInsertSchema(foodEntriesTable).omit({ id: true, createdAt: true });
export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;
export type FoodEntry = typeof foodEntriesTable.$inferSelect;
