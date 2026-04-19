import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { initDb } from "./database.js";
import { usersRouter } from "./routers/users.js";
import { projectsRouter } from "./routers/projects.js";
import { tasksRouter } from "./routers/tasks.js";

// Set up tables and seed data when server starts
initDb();

const app = new Elysia()

  .use(
    swagger({
      documentation: {
        info: {
          title: "Team Task Board API",
          version: "1.0.0",
          description:
            "REST API for users, projects, and tasks (SQLite + Bun).",
        },
        tags: [
          { name: "meta", description: "Health and discovery" },
          { name: "users", description: "User management" },
          { name: "projects", description: "Project management" },
          { name: "tasks", description: "Task management" },
        ],
      },
    }),
  )

  .get(
    "/",
    () => ({
      service: "Team Task Board API",
      health: "/health",
      docs: "/swagger",
      resources: ["/users", "/projects", "/tasks"],
    }),
    { detail: { summary: "API root", tags: ["meta"] } },
  )

  .get("/health", () => ({ status: "ok" }), {
    detail: { summary: "Health check", tags: ["meta"] },
  })

  .use(usersRouter)
  .use(projectsRouter)
  .use(tasksRouter)

  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: { code: "validation_error", message: error.message } };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: { code: "not_found", message: "Route not found." } };
    }
    console.error(error);
    set.status = 500;
    return {
      error: { code: "internal_error", message: "Something went wrong." },
    };
  })

  .listen(3000);

console.log(` Server running at http://localhost:${app.server?.port}`);
console.log(` Swagger docs at   http://localhost:${app.server?.port}/swagger`);
