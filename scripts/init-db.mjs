import fs from "fs";
import path from "path";
import pg from "pg";

const envPath = path.join(process.cwd(), ".env");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

const sql = fs.readFileSync(path.join(process.cwd(), "supabase", "schema.sql"), "utf8");
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
const tables = await client.query(
  "select table_name from information_schema.tables where table_schema='public' order by 1"
);
console.log("OK tables:", tables.rows.map((r) => r.table_name).join(", "));
await client.end();
