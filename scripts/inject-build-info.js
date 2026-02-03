/**
 * Injects APP_VERSION and BUILD_DATE into src/utils/buildInfo.ts.
 * Reads version from config/package-solution.json.
 * Run before build/start (prebuild, prestart).
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const packageSolutionPath = path.join(rootDir, "config", "package-solution.json");
const buildInfoPath = path.join(rootDir, "src", "utils", "buildInfo.ts");

const packageSolution = JSON.parse(
  fs.readFileSync(packageSolutionPath, "utf8")
);
const version = packageSolution.solution?.version ?? "0.0.0.0";

const now = new Date();
const day = String(now.getDate()).padStart(2, "0");
const month = String(now.getMonth() + 1).padStart(2, "0");
const year = now.getFullYear();
const hours = String(now.getHours()).padStart(2, "0");
const minutes = String(now.getMinutes()).padStart(2, "0");
const seconds = String(now.getSeconds()).padStart(2, "0");
const buildDate = `${day}.${month}.${year} at ${hours}:${minutes}:${seconds}`;

const content = `/**
 * Build info - version and build date.
 * Injected at build time by scripts/inject-build-info.js.
 * Default values allow the app to run without running the inject script.
 */

/** Application version (from config/package-solution.json) */
export const APP_VERSION = "${version}";

/** Build date/time in format "DD.MM.YYYY at HH:mm:ss", empty if not injected */
export const BUILD_DATE = "${buildDate}";
`;

fs.writeFileSync(buildInfoPath, content, "utf8");
