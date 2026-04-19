#!/usr/bin/env bash
BASE="http://localhost:3000"
PASS=0; FAIL=0

check() {
  local label=$1 expected=$2 actual=$3 body=$4
  if [ "$actual" -eq "$expected" ]; then
    echo "  ✅  $label (HTTP $actual)"; ((PASS++))
  else
    echo "  ❌  $label — expected $expected, got $actual"; echo "      $body"; ((FAIL++))
  fi
}

echo; echo "=== Team Task Board API — Smoke Tests ==="

echo; echo "[ Meta ]"
check "GET /"       200 $(curl -s -o /dev/null -w "%{http_code}" $BASE/)
check "GET /health" 200 $(curl -s -o /dev/null -w "%{http_code}" $BASE/health)

echo; echo "[ Users ]"
check "GET /users"            200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/users")
check "GET /users?search=Alex" 200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/users?search=Alex")
check "POST /users"           201 $(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/users" -H "Content-Type: application/json" -d '{"email":"new@example.com","name":"New User"}')
check "GET /users/1"          200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/users/1")
check "PATCH /users/1"        200 $(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/users/1" -H "Content-Type: application/json" -d '{"name":"Updated Name"}')
check "GET /users/9999 → 404" 404 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/users/9999")
check "POST dup email → 409"  409 $(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/users" -H "Content-Type: application/json" -d '{"email":"new@example.com","name":"Dupe"}')

echo; echo "[ Projects ]"
check "GET /projects"               200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/projects")
check "GET /projects?status=active" 200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/projects?status=active")
check "POST /projects"              201 $(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/projects" -H "Content-Type: application/json" -d '{"owner_id":1,"name":"New Project"}')
check "GET /projects/1"             200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/projects/1")
check "PATCH /projects/1"           200 $(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/projects/1" -H "Content-Type: application/json" -d '{"status":"archived"}')
check "POST bad owner → 422"        422 $(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/projects" -H "Content-Type: application/json" -d '{"owner_id":9999,"name":"Bad"}')

echo; echo "[ Tasks ]"
check "GET /tasks"                200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/tasks")
check "GET /tasks?status=todo"    200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/tasks?status=todo")
check "GET /tasks?min_priority=2" 200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/tasks?min_priority=2")
check "POST /tasks"               201 $(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/tasks" -H "Content-Type: application/json" -d '{"project_id":1,"title":"New Task","priority":1}')
check "GET /tasks/1"              200 $(curl -s -o /dev/null -w "%{http_code}" "$BASE/tasks/1")
check "PATCH /tasks/1"            200 $(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/tasks/1" -H "Content-Type: application/json" -d '{"status":"done"}')
check "DELETE /tasks/3"           204 $(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/tasks/3")
check "DELETE /tasks/3 → 404"     404 $(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/tasks/3")
check "POST bad project → 422"    422 $(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/tasks" -H "Content-Type: application/json" -d '{"project_id":9999,"title":"Ghost"}')

echo; echo "=== Results: $PASS/$((PASS+FAIL)) passed ==="
[ "$FAIL" -eq 0 ] && echo "🎉 All tests passed!" || echo "⚠️  $FAIL failed."