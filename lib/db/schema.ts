import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const points = pgTable("points", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  note: text("note"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  pointId: integer("point_id").notNull(),
  category: text("category").notNull(),
  product: text("product").notNull(),
  detail: text("detail"),
  // status: 'pending' | 'reserved' | 'delivered'
  status: text("status").notNull().default("pending"),
  reservedBy: text("reserved_by"),
  reservedAt: timestamp("reserved_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Point = typeof points.$inferSelect
export type Item = typeof items.$inferSelect
