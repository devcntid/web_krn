import { execSync } from "node:child_process";

const run = (cmd: "setup" | "teardown") =>
  execSync(`npx tsx --require ./tests/stubs/server-only-shim.cjs ${process.env.E2E_ENV_FILE ? `--env-file=${process.env.E2E_ENV_FILE}` : ""} tests/e2e/fixtures.ts ${cmd}`, { stdio: "inherit" });

export default function globalSetup() {
  run("setup");
  return () => run("teardown");
}
