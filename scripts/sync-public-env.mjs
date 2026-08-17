import fs from "node:fs";

const source = fs.readFileSync(".env", "utf8").split(/\r?\n/);
const allowed = source.filter((line) => line.startsWith("NEXT_PUBLIC_"));
const r2Public = source.find((line) => line.startsWith("R2_PUBLIC_BASE_URL="));
if (r2Public) allowed.push(`NEXT_PUBLIC_R2_PUBLIC_BASE_URL=${r2Public.slice(r2Public.indexOf("=") + 1)}`);
if (!allowed.length) throw new Error("Tidak ada NEXT_PUBLIC_* pada .env root.");
fs.writeFileSync("apps/web/.env.local", `${allowed.join("\n")}\n`, { mode: 0o600 });
console.log(`PUBLIC_ENV_SYNCED=${allowed.length}`);
