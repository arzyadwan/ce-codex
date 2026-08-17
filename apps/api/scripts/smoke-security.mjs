const api = "http://127.0.0.1:4000";

const allowed = await fetch(`${api}/v1/health`, { headers: { Origin: "http://localhost:3000" } });
if (!allowed.ok) throw new Error(`Health check gagal (${allowed.status}).`);
if (allowed.headers.get("access-control-allow-origin") !== "http://localhost:3000") throw new Error("Origin yang diizinkan tidak menerima header CORS.");
if (allowed.headers.get("x-content-type-options") !== "nosniff") throw new Error("Header Helmet X-Content-Type-Options tidak tersedia.");
if (allowed.headers.has("x-powered-by")) throw new Error("Header X-Powered-By masih terekspos.");
console.log("SECURITY_HEADERS_AND_CORS=SUCCESS");

const denied = await fetch(`${api}/v1/health`, { headers: { Origin: "https://attacker.invalid" } });
if (denied.headers.has("access-control-allow-origin")) throw new Error("Origin asing menerima header CORS.");
console.log("SECURITY_CORS_DENY=SUCCESS");

const oversized = await fetch(`${api}/v1/articles`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: "x".repeat(1_100_000) }),
});
if (oversized.status !== 413) throw new Error(`Payload besar seharusnya ditolak 413, diterima ${oversized.status}.`);
console.log("SECURITY_BODY_LIMIT=SUCCESS");

const burst = await Promise.all(Array.from({ length: 14 }, () => fetch(`${api}/v1/articles?limit=1`)));
if (!burst.some((response) => response.status === 429)) throw new Error("Burst request tidak menghasilkan 429.");
console.log("SECURITY_RATE_LIMIT=SUCCESS");

const healthBurst = await Promise.all(Array.from({ length: 14 }, () => fetch(`${api}/v1/health`)));
if (healthBurst.some((response) => !response.ok)) throw new Error("Health check ikut terkena rate limit.");
console.log("SECURITY_HEALTH_EXEMPTION=SUCCESS");
