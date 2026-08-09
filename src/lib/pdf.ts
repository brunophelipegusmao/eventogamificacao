import fs from "node:fs";
import path from "node:path";

/**
 * O pdfkit resolve as fontes padrão (.afm) via `__dirname + '/data/...'`
 * internamente. Bundlers como o Turbopack reescrevem esse `__dirname` (e o
 * valor retornado por `require.resolve` em runtime) para referências
 * inválidas, quebrando a geração do PDF. `pdfkit` é dependência direta do
 * projeto, então `node_modules/pdfkit` sempre existe na raiz (symlink no
 * pnpm, pasta real no npm/yarn) — usamos esse caminho estático a partir de
 * `process.cwd()` e redirecionamos qualquer leitura de arquivo `.afm` para
 * lá.
 */
function findPdfkitDataDir(): string {
  const dataDir = path.join(
    process.cwd(),
    "node_modules",
    "pdfkit",
    "js",
    "data"
  );
  if (!fs.existsSync(dataDir)) {
    throw new Error("Diretório de dados do pdfkit não encontrado");
  }
  return dataDir;
}

const pdfkitDataDir = findPdfkitDataDir();

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function patchedReadFileSync(
  ...args: Parameters<typeof fs.readFileSync>
) {
  const [filePath] = args;
  if (typeof filePath === "string" && filePath.endsWith(".afm")) {
    args[0] = path.join(pdfkitDataDir, path.basename(filePath));
  }
  return (originalReadFileSync as (...a: unknown[]) => unknown).apply(
    fs,
    args
  );
} as typeof fs.readFileSync;
