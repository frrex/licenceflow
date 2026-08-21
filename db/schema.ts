import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const licenses = sqliteTable("licenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productName: text("product_name").notNull(), vendor: text("vendor").notNull(), category: text("category").notNull(),
  startDate: text("start_date").notNull(), expirationDate: text("expiration_date").notNull(), cost: real("cost").notNull(),
  currency: text("currency").notNull(), description: text("description").notNull().default(""),
  responsible: text("responsible").notNull().default(""), department: text("department").notNull().default(""),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const importLogs = sqliteTable("import_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull(),
  importedCount: integer("imported_count").notNull(),
  products: text("products").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
});
