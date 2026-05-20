// Copy themes/*.toml, themes/index.json, schemas/*.json, _headers into
// web/public/ so they're served from the same URL paths after Astro build.
// Run as `prebuild` so it's idempotent against `pnpm build` / `npm run build`.
import { rm, mkdir, cp, copyFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const repoRoot = resolve(webRoot, '..');
const publicDir = join(webRoot, 'public');

const items = [
  { from: join(repoRoot, 'themes'), to: join(publicDir, 'themes') },
  { from: join(repoRoot, 'schemas'), to: join(publicDir, 'schemas') },
  { from: join(repoRoot, '_headers'), to: join(publicDir, '_headers'), file: true },
];

for (const item of items) {
  if (!existsSync(item.from)) {
    console.warn(`skip ${item.from} (does not exist)`);
    continue;
  }
  if (item.file) {
    await copyFile(item.from, item.to);
    console.log(`copy ${item.from} -> ${item.to}`);
  } else {
    await rm(item.to, { recursive: true, force: true });
    await mkdir(item.to, { recursive: true });
    await cp(item.from, item.to, { recursive: true });
    const count = (await readdir(item.to)).length;
    console.log(`copy ${count} file(s) ${item.from} -> ${item.to}`);
  }
}
console.log('catalog copy complete');
