import { pool } from "../lib/db";

async function main() {
  console.log("Adding column 'quantity' to 'donor_offers' table...");
  try {
    const client = await pool.connect();
    await client.query(`
      ALTER TABLE donor_offers 
      ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
    `);
    client.release();
    console.log("Migration successful! Column 'quantity' added to 'donor_offers'.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

main();
