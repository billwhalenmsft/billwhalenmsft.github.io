import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildOutputs, ROOT } from "./site.mjs";

const checkOnly = process.argv.includes("--check");
const { outputs } = await buildOutputs();
const mismatches = [];

for (const [relativePath, expected] of outputs) {
  const absolutePath = resolve(ROOT, relativePath);
  if (checkOnly) {
    let actual = null;
    try {
      actual = await readFile(absolutePath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (actual !== expected) mismatches.push(relativePath);
    continue;
  }

  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, expected, "utf8");
}

if (checkOnly && mismatches.length > 0) {
  console.error(`Generated output is stale or missing:\n${mismatches.map((path) => `- ${path}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(checkOnly
    ? `Generation check passed for ${outputs.size} files.`
    : `Generated ${outputs.size} deterministic files.`);
}
