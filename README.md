# Team Task Board API

A RESTful web API for managing users, projects, and tasks - built with Bun, Elysia, and SQLite.

---

## Prerequisites

- [Bun](https://bun.sh) installed on your machine

---

## Setup

Install dependencies:

```bash
bun install
```

---

## Running the Server

```bash
bun run start
```

The server starts at `http://localhost:3000`.

> **Note:** The database is wiped and re-seeded every time the server starts, so always restart the server before running tests to get a clean state.

---

## API Docs

Once the server is running, open your browser and go to:

```
http://localhost:3000/swagger
```

This shows an interactive list of all available endpoints where you can also send test requests directly from the browser.

---

## Running the Tests

Always restart the server before running tests to reset the database.

### Recommended (Windows / Mac / Linux)

```bash
bun test.js
```

> **Why do 2 tests fail on a second run?** Running tests twice without restarting the server will cause 2 expected failures - `POST /users` returns 409 (email already exists) and `DELETE /tasks/3` returns 404 (already deleted). This is normal. Just restart the server to get a clean slate.

---

## Project Structure

```
team-task-board/
├── main.js              # Entry point, Elysia app setup
├── database.js          # DB connection and init
├── pagination.js        # Pagination helper
├── errors.js            # Error classes and response helpers
├── routers/
│   ├── users.js         # User CRUD endpoints
│   ├── projects.js      # Project CRUD endpoints
│   └── tasks.js         # Task CRUD endpoints
├── db/
│   ├── schema.sql       # Table definitions
│   └── seed.sql         # Sample data
├── test.js              # Smoke tests (cross-platform, recommended)
```

---

## Resources

| Resource | Endpoints |
|----------|-----------|
| Users | `GET /users` `POST /users` `GET /users/:id` `PATCH /users/:id` `DELETE /users/:id` |
| Projects | `GET /projects` `POST /projects` `GET /projects/:id` `PATCH /projects/:id` `DELETE /projects/:id` |
| Tasks | `GET /tasks` `POST /tasks` `GET /tasks/:id` `PATCH /tasks/:id` `DELETE /tasks/:id` |

All list endpoints support **pagination** (`page`, `page_size`) and **filtering** (by status, owner, assignee, etc.).