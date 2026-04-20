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

const VALID_STATUSES = ["active", "archived"];
const COLS = "id, owner_id, name, description, status, created_at";

export const projectsRouter = new Elysia({ prefix: "/projects" })

  // List all projects
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

        if (query.owner_id) {
          clauses.push("owner_id = ?");
          params.push(parseInt(query.owner_id));
        }
        if (query.status) {
          if (!VALID_STATUSES.includes(query.status))
            throw badRequest(
              "invalid_filter",
              "status must be 'active' or 'archived'.",
            );
          clauses.push("status = ?");
          params.push(query.status);
        }

        const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
        const total = db
          .query(`SELECT COUNT(*) as c FROM projects${where}`)
          .get(...params).c;
        const offset = (page - 1) * pageSize;
        const rows = db
          .query(
            `SELECT ${COLS} FROM projects${where} ORDER BY id LIMIT ? OFFSET ?`,
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
        owner_id: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
      detail: { summary: "List projects", tags: ["projects"] },
    },
  )

  // Create a new project
  .post(
    "/",
    ({ body }) => {
      try {
        const { owner_id, name, description = null, status = "active" } = body;

        if (!db.query("SELECT 1 FROM users WHERE id = ?").get(owner_id))
          throw unprocessable(
            "invalid_owner",
            "owner_id must reference an existing user.",
          );
        if (!VALID_STATUSES.includes(status))
          throw badRequest(
            "invalid_status",
            "status must be 'active' or 'archived'.",
          );
        if (!name || name.trim().length === 0 || name.length > 200)
          throw new AppError(
            422,
            "validation_error",
            "name must be between 1 and 200 characters.",
          );

        const rid = db
          .query(
            "INSERT INTO projects (owner_id, name, description, status) VALUES (?, ?, ?, ?) RETURNING id",
          )
          .get(owner_id, name.trim(), description ?? null, status).id;

        const row = db
          .query(`SELECT ${COLS} FROM projects WHERE id = ?`)
          .get(rid);
        return Response.json(row, { status: 201 });
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      body: t.Object({
        owner_id: t.Number(),
        name: t.String(),
        description: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.String()),
      }),
      detail: { summary: "Create project", tags: ["projects"] },
    },
  )

  // Get one project by ID
  .get(
    "/:id",
    ({ params }) => {
      try {
        const row = db
          .query(`SELECT ${COLS} FROM projects WHERE id = ?`)
          .get(params.id);
        if (!row) throw notFound("Project");
        return Response.json(row);
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: { summary: "Get project by ID", tags: ["projects"] },
    },
  )

  // Update a project
  .patch(
    "/:id",
    ({ params, body }) => {
      try {
        if (!db.query("SELECT 1 FROM projects WHERE id = ?").get(params.id))
          throw notFound("Project");

        const fields = {};

        if (body.name !== undefined) {
          if (
            !body.name ||
            body.name.trim().length === 0 ||
            body.name.length > 200
          )
            throw new AppError(
              422,
              "validation_error",
              "name must be between 1 and 200 characters.",
            );
          fields.name = body.name.trim();
        }
        if (body.description !== undefined)
          fields.description = body.description;
        if (body.status !== undefined) {
          if (!VALID_STATUSES.includes(body.status))
            throw badRequest(
              "invalid_status",
              "status must be 'active' or 'archived'.",
            );
          fields.status = body.status;
        }

        if (Object.keys(fields).length > 0) {
          const sets = Object.keys(fields)
            .map((k) => `${k} = ?`)
            .join(", ");
          db.query(`UPDATE projects SET ${sets} WHERE id = ?`).run(
            ...Object.values(fields),
            params.id,
          );
        }

        const row = db
          .query(`SELECT ${COLS} FROM projects WHERE id = ?`)
          .get(params.id);
        return Response.json(row);
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.String()),
      }),
      detail: { summary: "Update project", tags: ["projects"] },
    },
  )

  // Delete a project 
  .delete(
    "/:id",
    ({ params }) => {
      try {
        const result = db
          .query("DELETE FROM projects WHERE id = ? RETURNING id")
          .get(params.id);
        if (!result) throw notFound("Project");
        return Response.json({
          message: `Project ${params.id} deleted successfully.`,
        });
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: { summary: "Delete project", tags: ["projects"] },
    },
  );
