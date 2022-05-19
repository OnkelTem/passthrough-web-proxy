import fs from 'fs';
import { F_OK } from 'constants';
import { dirname } from 'path';
import { getLocal, generateCACertificate, generateSPKIFingerprint, Headers } from 'mockttp';

async function proxy(port: number) {
  const keys = await getSslKeys();

  const server = getLocal({ https: keys, http2: false, debug: true });

  server.forUnmatchedRequest().thenPassThrough();

  await server.start(port);

  const caFingerprint = generateSPKIFingerprint(keys.cert);
  // Print out the server details for manual configuration:
  log(`Server running on port ${server.port}`);
  log(`CA cert fingerprint ${caFingerprint}`);

  return server;
}

// Run
(() => proxy(8000))();

// Helpers

async function getSslKeys() {
  const keyPemPath = 'cert/key.pem';
  const certPemPath = 'cert/cert.pem';

  if (!fileExists(keyPemPath) || !fileExists(certPemPath)) {
    const { key, cert } = await generateCACertificate();
    saveFile(keyPemPath, key);
    saveFile(certPemPath, cert);
    log(`A CA cert file has been generated and saved to ${certPemPath}. Please install it into your browser.`);
  }
  return { key: readFile(keyPemPath), cert: readFile(certPemPath) };
}

function fileExists(path: string) {
  try {
    fs.accessSync(path, F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function saveFile(path: string, data: string) {
  const dir = dirname(path);
  if (dir !== '') {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path, data);
  console.log(`Saved: ${path}`);
}

function readFile(path: string) {
  return fs.readFileSync(path).toString();
}

function log(...params: any[]) {
  console.log(...params);
}
