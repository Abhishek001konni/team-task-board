const BASE = "http://localhost:3000";
let pass = 0,
  fail = 0;

async function checkUrl(
  label,
  url,
  expectedStatus,
  method = "GET",
  body = null,
) {
  const options = { method, headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(`${BASE}${url}`, options);
    if (res.status === expectedStatus) {
      console.log(`  ✅  ${label} (HTTP ${res.status})`);
      pass++;
    } else {
      const text = await res.text().catch(() => "");
      console.log(
        `  ❌  ${label} — expected ${expectedStatus}, got ${res.status}`,
      );
      console.log(`      ${text}`);
      fail++;
    }
  } catch (err) {
    console.log(`  ❌  ${label} — fetch failed: ${err.message}`);
    fail++;
  }
}

console.log("\n=== Team Task Board API — Smoke Tests ===");

console.log("\n[ Meta ]");
await checkUrl("GET /", "/", 200);
await checkUrl("GET /health", "/health", 200);

console.log("\n[ Users ]");
await checkUrl("GET /users", "/users", 200);
await checkUrl("GET /users?search=Alex", "/users?search=Alex", 200);
await checkUrl("POST /users", "/users", 201, "POST", {
  email: "new@example.com",
  name: "New User",
});
await checkUrl("GET /users/1", "/users/1", 200);
await checkUrl("PATCH /users/1", "/users/1", 200, "PATCH", {
  name: "Updated Name",
});
await checkUrl("GET /users/9999 → 404", "/users/9999", 404);
await checkUrl("POST dup email → 409", "/users", 409, "POST", {
  email: "new@example.com",
  name: "Dupe",
});

console.log("\n[ Projects ]");
await checkUrl("GET /projects", "/projects", 200);
await checkUrl("GET /projects?status=active", "/projects?status=active", 200);
await checkUrl("POST /projects", "/projects", 201, "POST", {
  owner_id: 1,
  name: "New Project",
});
await checkUrl("GET /projects/1", "/projects/1", 200);
await checkUrl("PATCH /projects/1", "/projects/1", 200, "PATCH", {
  status: "archived",
});
await checkUrl("POST bad owner → 422", "/projects", 422, "POST", {
  owner_id: 9999,
  name: "Bad",
});

console.log("\n[ Tasks ]");
await checkUrl("GET /tasks", "/tasks", 200);
await checkUrl("GET /tasks?status=todo", "/tasks?status=todo", 200);
await checkUrl("GET /tasks?min_priority=2", "/tasks?min_priority=2", 200);
await checkUrl("POST /tasks", "/tasks", 201, "POST", {
  project_id: 1,
  title: "New Task",
  priority: 1,
});
await checkUrl("GET /tasks/1", "/tasks/1", 200);
await checkUrl("PATCH /tasks/1", "/tasks/1", 200, "PATCH", { status: "done" });
await checkUrl("DELETE /tasks/3", "/tasks/3", 200, "DELETE");
await checkUrl("DELETE /tasks/3 → 404", "/tasks/3", 404, "DELETE");
await checkUrl("POST bad project → 422", "/tasks", 422, "POST", {
  project_id: 9999,
  title: "Ghost",
});

console.log(`\n=== Results: ${pass}/${pass + fail} passed ===`);
if (fail === 0) console.log("🎉 All tests passed!");
else console.log(`⚠️  ${fail} failed.`);
