import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migration for stock and item_reservations...");
  try {
    await db.execute(sql`
      ALTER TABLE items ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS quantity_reserved integer NOT NULL DEFAULT 0;
    `);
    console.log("Updated items table columns.");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS item_reservations (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'reserved',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Created item_reservations table.");
    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
