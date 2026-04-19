import { Database } from "bun:sqlite";
import { readFileSync, mkdirSync } from "fs";

mkdirSync("data", { recursive: true });

const db = new Database("data/app.db", { create: true });
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

export function initDb() {
  db.exec(readFileSync("db/schema.sql", "utf8"));
  db.exec(readFileSync("db/seed.sql", "utf8"));
}

export default db;