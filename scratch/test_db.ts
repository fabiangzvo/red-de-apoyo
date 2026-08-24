import { db } from "../lib/db";
import { items } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Testing DB query...");
  try {
    const result = await db.select().from(items).limit(3);
    console.log("DB query successful! Items sample:", result.length);
    process.exit(0);
  } catch (err) {
    console.error("DB query error:", err);
    process.exit(1);
  }
}

main();
