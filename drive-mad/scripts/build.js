import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { bundleJavaScript, buildInStaging } from '../../scripts/build-tools.js';
import { deflateSync } from 'node:zlib';
import { completeAllLevels } from '../game/progression.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const baseSave = JSON.parse(await readFile(path.join(root, 'game/base-save.json'), 'utf8'));
const masterSave = deflateSync(JSON.stringify(completeAllLevels(baseSave))).toString('base64');
const adapter = await bundleJavaScript({
  stdin: {
    contents: `import { installProfileStorage } from './src/profile-storage.js'; installProfileStorage(window, ${JSON.stringify(masterSave)});`,
    resolveDir: root,
    sourcefile: 'profile-entry.js',
  },
  write: false,
  format: 'iife',
});
let html = await readFile(path.join(root, 'index.html'), 'utf8');
const runtime = '<script type="text/javascript" src="webapp/index.js"></script>';
if (!html.includes(runtime)) throw new Error('The supplied Drive Mad runtime tag has changed.');
html = html.replace(
  runtime,
  `<script>${adapter.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script>\n${runtime}`,
);
await buildInStaging({ staging: path.join(root, '.build'), output }, async (staging) => {
  await writeFile(path.join(staging, 'index.html'), html);
});
console.log('Drive Mad built with account-specific level saves.');
