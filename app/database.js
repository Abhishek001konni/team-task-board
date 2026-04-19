import { Database } from "bun:sqlite";
import { readFileSync, mkdirSync } from "fs";

mkdirSync("data", { recursive: true });

const db = new Database("data/app.db", { create: true });
db.run("PRAGMA foreign_keys = ON;");
db.run("PRAGMA journal_mode = WAL;");

export function initDb() {
  db.run(readFileSync("db/schema.sql", "utf8"));
  db.run(readFileSync("db/seed.sql", "utf8"));
}

export default db;