import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";

const originalFindOne = User.findOne;

test.afterEach(() => {
  User.findOne = originalFindOne;
});

test("POST /auth/login returns 400 on invalid payload", async () => {
  const app = createApp();
  const res = await request(app).post("/auth/login").send({ username: "", password: "" });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Validation error");
});

test("POST /auth/login returns 401 for unknown user", async () => {
  const app = createApp();
  User.findOne = async () => null;

  const res = await request(app).post("/auth/login").send({ username: "missing", password: "secret" });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid credentials");
});

test("POST /auth/login returns 403 for non-approved user", async () => {
  const app = createApp();
  const passwordHash = await bcrypt.hash("secret", 8);

  User.findOne = async () => ({
    _id: "user-1",
    username: "society-1",
    passwordHash,
    role: "Society",
    authStatus: "Pending",
  });

  const res = await request(app).post("/auth/login").send({ username: "society-1", password: "secret" });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "User not approved");
});

test("POST /auth/login returns token for approved user", async () => {
  const app = createApp();
  const passwordHash = await bcrypt.hash("secret", 8);

  User.findOne = async () => ({
    _id: "user-2",
    username: "admin-1",
    passwordHash,
    role: "Admin",
    authStatus: "Approved",
  });

  const res = await request(app).post("/auth/login").send({ username: "admin-1", password: "secret" });

  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, "string");
  assert.equal(res.body.user.username, "admin-1");
  assert.ok(res.headers["x-request-id"]);
});