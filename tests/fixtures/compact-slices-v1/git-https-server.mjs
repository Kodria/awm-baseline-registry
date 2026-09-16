import https from 'node:https';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const [root, key, cert] = process.argv.slice(2);
const server = https.createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (request, response) => {
  const pathname = new URL(request.url, 'https://localhost').pathname;
  const file = path.resolve(root, `.${decodeURIComponent(pathname)}`);
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) { response.writeHead(403).end(); return; }
  try {
    if (!statSync(file).isFile()) throw new Error('not regular');
    response.writeHead(200, { 'Content-Type': 'application/octet-stream' }); response.end(readFileSync(file));
  } catch { response.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1', () => process.stdout.write(`${server.address().port}\n`));
