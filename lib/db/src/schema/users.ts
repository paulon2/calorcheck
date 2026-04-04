import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  sex: text("sex"),
  birthYear: integer("birth_year"),
  weightKg: integer("weight_kg"),
  heightCm: integer("height_cm"),
  goalType: text("goal_type"),
  customGoal: integer("custom_goal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
