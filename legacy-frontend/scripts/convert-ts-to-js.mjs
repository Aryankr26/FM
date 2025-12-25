import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const projectRoot = path.resolve(process.cwd());
const srcDir = path.join(projectRoot, "src");

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(fullPath);
      return fullPath;
    })
  );
  return files.flat();
}

function isConvertibleSource(filePath) {
  return (
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) &&
    !filePath.endsWith(".d.ts")
  );
}

function outPathFor(filePath) {
  if (filePath.endsWith(".tsx")) return filePath.slice(0, -4) + ".jsx";
  if (filePath.endsWith(".ts")) return filePath.slice(0, -3) + ".js";
  return filePath;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function convertFile(filePath) {
  const sourceText = await fs.readFile(filePath, "utf8");
  const isTsx = filePath.endsWith(".tsx");

  const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    esModuleInterop: true,
    sourceMap: false,
    inlineSources: false,
    isolatedModules: true,
    skipLibCheck: true,
  };

  if (isTsx) {
    compilerOptions.jsx = "preserve";
  }

  const result = ts.transpileModule(sourceText, {
    fileName: filePath,
    compilerOptions: {
      ...compilerOptions,
    },
    reportDiagnostics: true,
  });

  const diagnostics = (result.diagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error
  );

  return {
    jsText: result.outputText,
    diagnostics,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const shouldDelete = args.has("--delete");

  if (!(await fileExists(srcDir))) {
    console.error(`Missing src directory: ${srcDir}`);
    process.exit(1);
  }

  const allFiles = await listFiles(srcDir);
  const sources = allFiles.filter(isConvertibleSource);

  if (sources.length === 0) {
    console.log("No .ts/.tsx files found under src/");
    return;
  }

  const failures = [];

  for (const filePath of sources) {
    const outPath = outPathFor(filePath);
    const { jsText, diagnostics } = await convertFile(filePath);

    if (diagnostics.length > 0) {
      failures.push({ filePath, diagnostics });
      continue;
    }

    await fs.writeFile(outPath, jsText, "utf8");

    if (shouldDelete) {
      await fs.unlink(filePath);
    }

    const relIn = path.relative(projectRoot, filePath);
    const relOut = path.relative(projectRoot, outPath);
    console.log(`${relIn} -> ${relOut}`);
  }

  if (failures.length > 0) {
    console.error("\nConversion failed for some files:");
    for (const f of failures) {
      console.error(`- ${path.relative(projectRoot, f.filePath)}`);
      for (const d of f.diagnostics.slice(0, 8)) {
        const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        console.error(`  - ${msg}`);
      }
      if (f.diagnostics.length > 8) {
        console.error(`  - (+${f.diagnostics.length - 8} more)`);
      }
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
