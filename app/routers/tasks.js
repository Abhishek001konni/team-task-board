import Elysia, { t } from "elysia";
import db from "../database.js";
import { pagingMeta } from "../pagination.js";
import {
  notFound,
  unprocessable,
  badRequest,
  AppError,
  errorResponse,
} from "../errors.js";

const VALID_STATUSES = ["todo", "doing", "done"];
const COLS =
  "id, project_id, assignee_id, title, description, status, priority, due_date, created_at";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getTask(id) {
  return db.query(`SELECT ${COLS} FROM tasks WHERE id = ?`).get(id);
}

export const tasksRouter = new Elysia({ prefix: "/tasks" })

  // List all tasks, with optional filters
  .get(
    "/",
    ({ query }) => {
      try {
        const page = Math.max(1, parseInt(query.page ?? "1"));
        const pageSize = Math.min(
          100,
          Math.max(1, parseInt(query.page_size ?? "20")),
        );

        const clauses = [];
        const params = [];

        if (query.project_id) {
          clauses.push("project_id = ?");
          params.push(parseInt(query.project_id));
        }
        if (query.assignee_id) {
          clauses.push("assignee_id = ?");
          params.push(parseInt(query.assignee_id));
        }
        if (query.status) {
          if (!VALID_STATUSES.includes(query.status))
            throw badRequest(
              "invalid_filter",
              "status must be 'todo', 'doing', or 'done'.",
            );
          clauses.push("status = ?");
          params.push(query.status);
        }
        if (query.min_priority) {
          const p = parseInt(query.min_priority);
          if (p < 1 || p > 3)
            throw badRequest(
              "invalid_filter",
              "min_priority must be between 1 and 3.",
            );
          clauses.push("priority >= ?");
          params.push(p);
        }

        const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
        const total = db
          .query(`SELECT COUNT(*) as c FROM tasks${where}`)
          .get(...params).c;
        const offset = (page - 1) * pageSize;
        const rows = db
          .query(
            `SELECT ${COLS} FROM tasks${where} ORDER BY id LIMIT ? OFFSET ?`,
          )
          .all(...params, pageSize, offset);

        return Response.json({
          items: rows,
          total,
          page,
          page_size: pageSize,
          ...pagingMeta(total, page, pageSize),
        });
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        page_size: t.Optional(t.String()),
        project_id: t.Optional(t.String()),
        assignee_id: t.Optional(t.String()),
        status: t.Optional(t.String()),
        min_priority: t.Optional(t.String()),
      }),
      detail: { summary: "List tasks", tags: ["tasks"] },
    },
  )

  // Create a new task
  .post(
    "/",
    ({ body }) => {
      try {
        const {
          project_id,
          assignee_id = null,
          title,
          description = null,
          status = "todo",
          priority = 2,
          due_date = null,
        } = body;

        if (!db.query("SELECT 1 FROM projects WHERE id = ?").get(project_id))
          throw unprocessable(
            "invalid_project",
            "project_id must reference an existing project.",
          );
        if (
          assignee_id !== null &&
          !db.query("SELECT 1 FROM users WHERE id = ?").get(assignee_id)
        )
          throw unprocessable(
            "invalid_assignee",
            "assignee_id must reference an existing user.",
          );
        if (!VALID_STATUSES.includes(status))
          throw badRequest(
            "invalid_status",
            "status must be 'todo', 'doing', or 'done'.",
          );
        if (priority < 1 || priority > 3)
          throw badRequest(
            "invalid_priority",
            "priority must be between 1 and 3.",
          );
        if (!title || title.trim().length === 0 || title.length > 300)
          throw new AppError(
            422,
            "validation_error",
            "title must be between 1 and 300 characters.",
          );
        if (due_date !== null && !DATE_RE.test(due_date))
          throw new AppError(
            422,
            "validation_error",
            "due_date must be in YYYY-MM-DD format.",
          );

        const rid = db
          .query(
            "INSERT INTO tasks (project_id, assignee_id, title, description, status, priority, due_date) " +
              "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
          )
          .get(
            project_id,
            assignee_id,
            title.trim(),
            description,
            status,
            priority,
            due_date,
          ).id;

        return Response.json(getTask(rid), { status: 201 });
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      body: t.Object({
        project_id: t.Number(),
        assignee_id: t.Optional(t.Nullable(t.Number())),
        title: t.String(),
        description: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.String()),
        priority: t.Optional(t.Number()),
        due_date: t.Optional(t.Nullable(t.String())),
      }),
      detail: { summary: "Create task", tags: ["tasks"] },
    },
  )

  // Get one task by ID
  .get(
    "/:id",
    ({ params }) => {
      try {
        const row = getTask(params.id);
        if (!row) throw notFound("Task");
        return Response.json(row);
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: { summary: "Get task by ID", tags: ["tasks"] },
    },
  )

  // Update a task
  .patch(
    "/:id",
    ({ params, body }) => {
      try {
        if (!getTask(params.id)) throw notFound("Task");

        const fields = {};

        if (body.title !== undefined) {
          if (
            !body.title ||
            body.title.trim().length === 0 ||
            body.title.length > 300
          )
            throw new AppError(
              422,
              "validation_error",
              "title must be between 1 and 300 characters.",
            );
          fields.title = body.title.trim();
        }
        if (body.description !== undefined)
          fields.description = body.description;
        if (body.status !== undefined) {
          if (!VALID_STATUSES.includes(body.status))
            throw badRequest(
              "invalid_status",
              "status must be 'todo', 'doing', or 'done'.",
            );
          fields.status = body.status;
        }
        if (body.priority !== undefined) {
          if (body.priority < 1 || body.priority > 3)
            throw badRequest(
              "invalid_priority",
              "priority must be between 1 and 3.",
            );
          fields.priority = body.priority;
        }
        if (body.assignee_id !== undefined) {
          if (
            body.assignee_id !== null &&
            !db.query("SELECT 1 FROM users WHERE id = ?").get(body.assignee_id)
          )
            throw unprocessable(
              "invalid_assignee",
              "assignee_id must reference an existing user.",
            );
          fields.assignee_id = body.assignee_id;
        }
        if (body.due_date !== undefined) {
          if (body.due_date !== null && !DATE_RE.test(body.due_date))
            throw new AppError(
              422,
              "validation_error",
              "due_date must be in YYYY-MM-DD format.",
            );
          fields.due_date = body.due_date;
        }

        if (Object.keys(fields).length > 0) {
          const sets = Object.keys(fields)
            .map((k) => `${k} = ?`)
            .join(", ");
          db.query(`UPDATE tasks SET ${sets} WHERE id = ?`).run(
            ...Object.values(fields),
            params.id,
          );
        }

        return Response.json(getTask(params.id));
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        assignee_id: t.Optional(t.Nullable(t.Number())),
        title: t.Optional(t.String()),
        description: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.String()),
        priority: t.Optional(t.Number()),
        due_date: t.Optional(t.Nullable(t.String())),
      }),
      detail: { summary: "Update task", tags: ["tasks"] },
    },
  )

  // Delete a task
  .delete(
    "/:id",
    ({ params }) => {
      try {
        const result = db
          .query("DELETE FROM tasks WHERE id = ? RETURNING id")
          .get(params.id);
        if (!result) throw notFound("Task");
        return new Response(null, { status: 204 });
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: { summary: "Delete task", tags: ["tasks"] },
    },
  );
