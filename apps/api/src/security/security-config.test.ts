import assert from "node:assert/strict";
import test from "node:test";
import { getSecurityConfig, positiveInteger } from "./security-config.js";

test("development memakai default lokal yang aman", () => {
  const config = getSecurityConfig({ NODE_ENV: "development" });
  assert.deepEqual(config.allowedOrigins, ["http://localhost:3000"]);
  assert.equal(config.bodyLimit, "1mb");
  assert.equal(config.swaggerEnabled, true);
  assert.equal(config.trustProxy, false);
});

test("production mewajibkan allowlist CORS dan mematikan Swagger", () => {
  assert.throws(() => getSecurityConfig({ NODE_ENV: "production" }), /CORS_ORIGIN/);
  const config = getSecurityConfig({ NODE_ENV: "production", CORS_ORIGIN: "https://cryptoexist.id,https://www.cryptoexist.id" });
  assert.deepEqual(config.allowedOrigins, ["https://cryptoexist.id", "https://www.cryptoexist.id"]);
  assert.equal(config.swaggerEnabled, false);
});

test("origin, body limit, dan trust proxy yang ambigu ditolak", () => {
  assert.throws(() => getSecurityConfig({ CORS_ORIGIN: "*" }), /Invalid URL|tidak valid/);
  assert.throws(() => getSecurityConfig({ REQUEST_BODY_LIMIT: "unlimited" }), /REQUEST_BODY_LIMIT/);
  assert.throws(() => getSecurityConfig({ TRUST_PROXY: "true" }), /TRUST_PROXY/);
});

test("rate limit hanya menerima bilangan bulat positif dalam batas", () => {
  assert.equal(positiveInteger("25", 10, "RATE_LIMIT_BURST", 1_000), 25);
  assert.equal(positiveInteger(undefined, 10, "RATE_LIMIT_BURST", 1_000), 10);
  assert.throws(() => positiveInteger("0", 10, "RATE_LIMIT_BURST", 1_000), /RATE_LIMIT_BURST/);
  assert.throws(() => positiveInteger("banyak", 10, "RATE_LIMIT_BURST", 1_000), /RATE_LIMIT_BURST/);
});
