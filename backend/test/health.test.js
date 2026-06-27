import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

test("GET /health/live returns live service status", async () => {
  const app = createApp({
    readinessCheck: async () => ({ ok: true, checks: { database: { ok: true, state: "connected" } } }),
  });

  const res = await request(app).get("/health/live");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.service, "mpbs-backend");
  assert.ok(res.headers["x-request-id"]);
});

test("GET /health/ready returns 503 when dependency check fails", async () => {
  const app = createApp({
    readinessCheck: async () => ({
      ok: false,
      checks: {
        database: { ok: false, state: "disconnected" },
      },
    }),
  });

  const res = await request(app).get("/health/ready");

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.checks.database.ok, false);
});

test("GET /health returns readiness payload for backwards compatibility", async () => {
  const app = createApp({
    readinessCheck: async () => ({
      ok: true,
      checks: {
        database: { ok: true, state: "connected" },
      },
    }),
  });

  const res = await request(app).get("/health");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.checks.database.ok, true);
});