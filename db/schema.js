import { integer, pgTable, text,timestamp } from "drizzle-orm/pg-core";

export const todostable = pgTable("todos", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  todo: text().notNull(),
  createdAt:timestamp('created_at').defaultNow(),
  updatedAt:timestamp('updated_at').$onUpdate(()=> new Date()),
});
