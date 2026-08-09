import fs from "node:fs";
import path from "node:path";

/**
 * O pdfkit resolve as fontes padrão (.afm) via `__dirname + '/data/...'`.
 * Bundlers como o Turbopack reescrevem `__dirname` (e `require.resolve`)
 * para caminhos virtuais inválidos (ex.: `/ROOT/...`, `[project]/...`),
 * quebrando a geração do PDF. Aqui localizamos o diretório real de dados do
 * pdfkit a partir de `process.cwd()` e redirecionamos qualquer leitura de
 * arquivo `.afm` para ele.
 */
function findPdfkitDataDir(): string {
  const pnpmDir = path.join(process.cwd(), "node_modules", ".pnpm");
  if (fs.existsSync(pnpmDir)) {
    const entry = fs
      .readdirSync(pnpmDir)
      .find((e) => e.startsWith("pdfkit@"));
    if (entry) {
      const candidate = path.join(
        pnpmDir,
        entry,
        "node_modules",
        "pdfkit",
        "js",
        "data"
      );
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  const fallback = path.join(
    process.cwd(),
    "node_modules",
    "pdfkit",
    "js",
    "data"
  );
  if (fs.existsSync(fallback)) return fallback;
  throw new Error("Diretório de dados do pdfkit não encontrado");
}

const pdfkitDataDir = findPdfkitDataDir();

const originalReadFileSync = fs.readFileSync.bind(fs);
fs.readFileSync = ((filePath: fs.PathOrFileDescriptor, ...args: unknown[]) => {
  if (typeof filePath === "string" && filePath.endsWith(".afm")) {
    return originalReadFileSync(
      path.join(pdfkitDataDir, path.basename(filePath)),
      ...(args as [BufferEncoding, ...unknown[]])
    );
  }
  return originalReadFileSync(filePath, ...(args as [BufferEncoding, ...unknown[]]));
}) as typeof fs.readFileSync;
