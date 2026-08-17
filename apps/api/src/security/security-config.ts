export type SecurityConfig = {
  allowedOrigins: string[];
  bodyLimit: string;
  swaggerEnabled: boolean;
  trustProxy: false | number | "loopback" | "linklocal" | "uniquelocal";
};

function parseOrigins(value: string | undefined, production: boolean) {
  const origins = (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (origins.length === 0) {
    if (production) throw new Error("CORS_ORIGIN wajib dikonfigurasi pada production.");
    return ["http://localhost:3000"];
  }
  for (const origin of origins) {
    const url = new URL(origin);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.origin !== origin) {
      throw new Error(`CORS origin tidak valid: ${origin}`);
    }
  }
  return [...new Set(origins)];
}

function parseBodyLimit(value: string | undefined) {
  const limit = (value ?? "1mb").toLowerCase();
  if (!/^[1-9]\d*(kb|mb)$/.test(limit)) throw new Error("REQUEST_BODY_LIMIT harus menggunakan format seperti 512kb atau 1mb.");
  return limit;
}

function parseTrustProxy(value: string | undefined): SecurityConfig["trustProxy"] {
  if (!value || value === "false") return false;
  if (value === "loopback" || value === "linklocal" || value === "uniquelocal") return value;
  if (/^[1-3]$/.test(value)) return Number(value);
  throw new Error("TRUST_PROXY hanya menerima false, loopback, linklocal, uniquelocal, atau jumlah hop 1-3.");
}

export function getSecurityConfig(env: NodeJS.ProcessEnv = process.env): SecurityConfig {
  const production = env.NODE_ENV === "production";
  return {
    allowedOrigins: parseOrigins(env.CORS_ORIGIN, production),
    bodyLimit: parseBodyLimit(env.REQUEST_BODY_LIMIT),
    swaggerEnabled: env.SWAGGER_ENABLED === "true" || (!production && env.SWAGGER_ENABLED !== "false"),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  };
}

export function positiveInteger(value: unknown, fallback: number, name: string, maximum: number) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${name} harus berupa bilangan bulat antara 1 dan ${maximum}.`);
  }
  return parsed;
}
