import test from "node:test";
import assert from "node:assert/strict";
import { promoteWaitingList } from "../src/waitlist.js";

test("promotes waiting members in FIFO order up to the available capacity", async () => {
  const queries = [];
  const client = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.includes("COUNT(*)::int AS count")) {
        return { rows: [{ count: 2 }] };
      }
      return {
        rowCount: 2,
        rows: [
          { id: 101, user_id: 1, outing_id: 42, message: "Une place s’est libérée.", read_at: null },
          { id: 102, user_id: 2, outing_id: 42, message: "Une place s’est libérée.", read_at: null }
        ]
      };
    }
  };

  const promoted = await promoteWaitingList(client, 42, 4);
  assert.equal(promoted.length, 2);
  assert.deepEqual(promoted.map(({ user_id }) => user_id), [1, 2]);
  assert.equal(queries.length, 2);
  assert.match(queries[1].sql, /ORDER BY joined_at ASC, user_id ASC/);
  assert.match(queries[1].sql, /INSERT INTO app_notifications/);
  assert.deepEqual(queries[1].values, [42, 2]);
});

test("does not promote anyone when the outing has no available places", async () => {
  let queryCount = 0;
  const client = {
    async query() {
      queryCount += 1;
      return { rows: [{ count: 4 }] };
    }
  };

  assert.deepEqual(await promoteWaitingList(client, 42, 4), []);
  assert.equal(queryCount, 1);
});
