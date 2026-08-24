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
  reservedByContact: text("reserved_by_contact"),
  reservedAt: timestamp("reserved_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Point = typeof points.$inferSelect
export type Item = typeof items.$inferSelect

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("donor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect

export const donorOffers = pgTable("donor_offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  donorName: text("donor_name").notNull(),
  donorContact: text("donor_contact").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  detail: text("detail"),
  locationName: text("location_name"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type DonorOffer = typeof donorOffers.$inferSelect


