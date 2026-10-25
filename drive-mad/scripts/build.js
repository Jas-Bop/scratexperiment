import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Keep the supplied HTML intact, including the pinned CDN base URL its assets require.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'index.html'), path.join(output, 'index.html'));
console.log('Drive Mad built from the supplied HTML page.');
