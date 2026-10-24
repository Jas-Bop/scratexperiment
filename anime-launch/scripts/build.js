import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import JSZip from '@turbowarp/jszip';
import { GAME_CONFIG } from '../config/game.js';
import { prepareGame } from './game/apply-nami.js';

const require = createRequire(import.meta.url);
const { Packager, loadProject } = require('@turbowarp/packager');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const staging = path.join(root, '.build');

// Build in a temporary folder so a failed package never replaces the working site.
try {
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  await cp(path.join(root, 'src/index.html'), path.join(staging, 'index.html'));
  for (const folder of ['app', 'player', 'shared', 'styles']) {
    await cp(path.join(root, 'src', folder), path.join(staging, folder), { recursive: true });
  }
  await cp(path.join(root, 'public'), staging, { recursive: true });

  const adapter = await build({
    entryPoints: [path.join(root, 'src/runtime/entry.js')],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2020',
    minify: false,
  });

  const packager = new Packager();
  const projectBytes = await readFile(path.join(root, GAME_CONFIG.projectFile));
  packager.project = await loadProject(await prepareGame(projectBytes));
  configurePackager(packager.options, adapter.outputFiles[0].text);
  const result = await packager.package();
  const archive = await JSZip.loadAsync(result.data);

  // Only these known static outputs are needed; never extract arbitrary archive paths.
  for (const filename of ['index.html', 'script.js', 'project.zip']) {
    const entry = archive.file(filename);
    if (!entry) throw new Error(`Game package is missing ${filename}`);
    await mkdir(path.join(staging, 'game'), { recursive: true });
    await writeFile(path.join(staging, 'game', filename), await entry.async('nodebuffer'));
  }

  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
  console.log('Built dist/: website source, runtime adapter, and original game.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exitCode = 1;
}

function configurePackager(options, adapterCode) {
  options.target = 'zip-one-asset';
  options.app.windowTitle = GAME_CONFIG.title;
  options.app.packageName = GAME_CONFIG.packageName;
  options.projectId = GAME_CONFIG.storageId;
  options.username = GAME_CONFIG.username;
  options.framerate = GAME_CONFIG.frameRate;
  options.stageWidth = GAME_CONFIG.stage.width;
  options.stageHeight = GAME_CONFIG.stage.height;
  options.cloudVariables.mode = 'local';
  options.loadingScreen.text = `Loading ${GAME_CONFIG.title}…`;
  options.appearance.background = GAME_CONFIG.appearance.background;
  options.appearance.accent = GAME_CONFIG.appearance.accent;
  options.autoplay = true;
  options.custom.js = adapterCode;
}
