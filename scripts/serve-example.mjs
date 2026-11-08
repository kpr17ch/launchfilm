// Minimal static server for the bundled example sites: `npm run example:serve [name] [port]`.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
};

export function serveExample(name = "orbit", port = 4173) {
  const root = fileURLToPath(new URL(`../examples/${name}/`, import.meta.url));
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const file = normalize(join(root, urlPath.endsWith("/") ? `${urlPath}index.html` : urlPath));
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [name = "orbit", port = "4173"] = process.argv.slice(2);
  await serveExample(name, Number(port));
  console.log(`Serving examples/${name} at http://127.0.0.1:${port}`);
}
