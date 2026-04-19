PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO users (id, email, name) VALUES
  (1, 'alex@example.com', 'Alex Kim'),
  (2, 'sam@example.com', 'Sam Patel'),
  (3, 'jordan@example.com', 'Jordan Lee');

INSERT OR IGNORE INTO projects (id, owner_id, name, description, status) VALUES
  (1, 1, 'COMP 74 API', 'Group REST API project', 'active'),
  (2, 2, 'Website Redesign', 'Marketing site refresh', 'active'),
  (3, 1, 'Old Internship Notes', 'Archived reference', 'archived');

INSERT OR IGNORE INTO tasks (id, project_id, assignee_id, title, description, status, priority, due_date) VALUES
  (1, 1, 2, 'Design OpenAPI spec', 'Model all resources', 'doing', 1, '2026-04-15'),
  (2, 1, 1, 'Implement CRUD', 'Users, projects, tasks', 'todo', 1, '2026-04-18'),
  (3, 1, NULL, 'Write tests', 'Pytest + httpx', 'todo', 2, NULL),
  (4, 2, 3, 'Pick color palette', NULL, 'done', 3, '2026-04-01'),
  (5, 2, 2, 'Homepage wireframe', NULL, 'doing', 2, '2026-04-12');