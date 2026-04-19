// app/routers/users.js
import Elysia, { t } from "elysia";
import db from "../database.js";
import { pagingMeta } from "../pagination.js";
import { notFound, conflict, AppError, errorResponse } from "../errors.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const usersRouter = new Elysia({ prefix: "/users" })

  // List all users, with optional search and pagination
  .get(
    "/",
    ({ query }) => {
      try {
        const page = Math.max(1, parseInt(query.page ?? "1"));
        const pageSize = Math.min(
          100,
          Math.max(1, parseInt(query.page_size ?? "20")),
        );
        const search = query.search?.trim() ?? null;

        let where = "";
        let params = [];

        if (search) {
          where = " WHERE name LIKE ? OR email LIKE ?";
          params = [`%${search}%`, `%${search}%`];
        }

        const total = db
          .query(`SELECT COUNT(*) as c FROM users${where}`)
          .get(...params).c;
        const offset = (page - 1) * pageSize;
        const rows = db
          .query(
            `SELECT id, email, name, created_at FROM users${where} ORDER BY id LIMIT ? OFFSET ?`,
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
        search: t.Optional(t.String()),
      }),
      detail: { summary: "List users", tags: ["users"] },
    },
  )

  // Create a new user
  .post(
    "/",
    ({ body }) => {
      try {
        const { email, name } = body;

        if (!email || !EMAIL_RE.test(email))
          throw new AppError(422, "validation_error", "Invalid email address.");
        if (!name || name.trim().length === 0 || name.length > 200)
          throw new AppError(
            422,
            "validation_error",
            "name must be between 1 and 200 characters.",
          );

        let rid;
        try {
          rid = db
            .query("INSERT INTO users (email, name) VALUES (?, ?) RETURNING id")
            .get(email.toLowerCase(), name.trim()).id;
        } catch (e) {
          if (e.message?.includes("UNIQUE"))
            throw conflict(
              "duplicate_email",
              "A user with this email already exists.",
            );
          throw e;
        }

        const row = db
          .query("SELECT id, email, name, created_at FROM users WHERE id = ?")
          .get(rid);
        return Response.json(row, { status: 201 });
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      body: t.Object({ email: t.String(), name: t.String() }),
      detail: { summary: "Create user", tags: ["users"] },
    },
  )

  // Get one user by ID
  .get(
    "/:id",
    ({ params }) => {
      try {
        const row = db
          .query("SELECT id, email, name, created_at FROM users WHERE id = ?")
          .get(params.id);
        if (!row) throw notFound("User");
        return Response.json(row);
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: { summary: "Get user by ID", tags: ["users"] },
    },
  )

  // Update a user's name or email
  .patch(
    "/:id",
    ({ params, body }) => {
      try {
        if (!db.query("SELECT id FROM users WHERE id = ?").get(params.id))
          throw notFound("User");

        const fields = {};

        if (body.email !== undefined) {
          if (!EMAIL_RE.test(body.email))
            throw new AppError(
              422,
              "validation_error",
              "Invalid email address.",
            );
          fields.email = body.email.toLowerCase();
        }
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

        if (Object.keys(fields).length > 0) {
          const sets = Object.keys(fields)
            .map((k) => `${k} = ?`)
            .join(", ");
          try {
            db.query(`UPDATE users SET ${sets} WHERE id = ?`).run(
              ...Object.values(fields),
              params.id,
            );
          } catch (e) {
            if (e.message?.includes("UNIQUE"))
              throw conflict(
                "duplicate_email",
                "A user with this email already exists.",
              );
            throw e;
          }
        }

        const row = db
          .query("SELECT id, email, name, created_at FROM users WHERE id = ?")
          .get(params.id);
        return Response.json(row);
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        email: t.Optional(t.String()),
        name: t.Optional(t.String()),
      }),
      detail: { summary: "Update user", tags: ["users"] },
    },
  )

  // Delete a user
  .delete(
    "/:id",
    ({ params }) => {
      try {
        const result = db
          .query("DELETE FROM users WHERE id = ? RETURNING id")
          .get(params.id);
        if (!result) throw notFound("User");
        return new Response(null, { status: 204 });
      } catch (err) {
        return errorResponse(err);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: { summary: "Delete user", tags: ["users"] },
    },
  );
