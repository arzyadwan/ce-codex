import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../.env.example", import.meta.url), "utf8");
const assignments = source
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => {
    const separator = line.indexOf("=");
    return separator < 0 ? [line, ""] : [line.slice(0, separator), line.slice(separator + 1)];
  });

const sensitiveName = /(SECRET|TOKEN|PASSWORD|PRIVATE|SERVICE_ROLE|ACCESS_KEY)/i;
const violations = assignments.filter(([name, value]) => sensitiveName.test(name) && value.trim() !== "");

if (violations.length > 0) {
  console.error(`.env.example memuat nilai pada variabel sensitif: ${violations.map(([name]) => name).join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(".env.example aman: variabel sensitif tidak memiliki nilai.");
}
