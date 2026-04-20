## Group Contributions

Each group member took ownership of a specific part of the project while contributing to shared decisions throughout.

**Sanoop** was responsible for designing and implementing the Users resource, including the `/users` router, email validation, duplicate email handling, and the search filter on the list endpoint. Sanoop also led the overall project structure and set up the Elysia application in `main.js`, including the global error handler and Swagger integration.

**Abhishek** was responsible for designing and implementing the Projects resource, including the `/projects` router, owner validation, status filtering, and the cross-resource check that ensures `owner_id` references a real user before a project is created. Abhishek also set up the GitHub repository and managed version control for the group.

**Aayush** was responsible for designing and implementing the Tasks resource, including the `/tasks` router, all task filters (project, assignee, status, min_priority), due date validation, and the cross-resource checks for `project_id` and `assignee_id`. Aayush also wrote the shared `errors.js` module and the `pagination.js` helper used across all three routers.

**Yusif** was responsible for the database layer, including writing `db/schema.sql` with all table definitions, constraints, foreign keys, and indexes, as well as `db/seed.sql` with the sample data. Yusif also wrote the full `test.js` smoke test suite covering all 24 test cases, set up the `openapi/openapi.json` export, and built the Postman collection in `postman/collection.json`.
