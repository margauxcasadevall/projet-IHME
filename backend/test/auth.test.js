import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { initializeSessionSecret } from "../src/auth.js";

const originalJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

test("uses a configured JWT secret without database changes", async () => {
  process.env.JWT_SECRET = "a".repeat(32);
  const database = {
    query() {
      assert.fail("A configured secret should not require database storage.");
    }
  };

  await initializeSessionSecret(database);
  assert.equal(process.env.JWT_SECRET, "a".repeat(32));
});

test("rejects a configured JWT secret shorter than 32 characters", async () => {
  process.env.JWT_SECRET = "too-short";

  await assert.rejects(
    initializeSessionSecret({ query: () => assert.fail("Unexpected database access.") }),
    /JWT_SECRET doit contenir au moins 32 caractères/
  );
});

test("creates and reuses a random secret stored in PostgreSQL", async () => {
  delete process.env.JWT_SECRET;
  const stored = new Map();
  const database = {
    async query(sql, values = []) {
      if (sql.includes("CREATE TABLE")) return { rows: [] };
      if (sql.includes("INSERT INTO app_secrets")) {
        if (!stored.has(values[0])) stored.set(values[0], values[1]);
        return { rows: [] };
      }
      if (sql.includes("SELECT value FROM app_secrets")) {
        return { rows: stored.has(values[0]) ? [{ value: stored.get(values[0]) }] : [] };
      }
      assert.fail(`Unexpected database query: ${sql}`);
    }
  };

  await initializeSessionSecret(database);
  const firstSecret = process.env.JWT_SECRET;
  assert.match(firstSecret, /^[A-Za-z0-9_-]{43}$/);

  delete process.env.JWT_SECRET;
  await initializeSessionSecret(database);
  assert.equal(process.env.JWT_SECRET, firstSecret);
});
