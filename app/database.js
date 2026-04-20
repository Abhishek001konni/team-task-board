import { Database } from "bun:sqlite";
import { readFileSync, mkdirSync, rmSync } from "fs";

mkdirSync("data", { recursive: true });
rmSync("data/app.db", { force: true });

const db = new Database("data/app.db", { create: true });
db.run("PRAGMA foreign_keys = ON;");
db.run("PRAGMA journal_mode = WAL;");

export function initDb() {
  db.run(readFileSync("db/schema.sql", "utf8"));
  db.run(readFileSync("db/seed.sql", "utf8"));
}

export default db;
