import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { bundleJavaScript } from '../../scripts/build-tools.js';
import JSZip from '@turbowarp/jszip';
import { GAME_CONFIG } from '../config/game.js';
import { prepareGame } from './game/prepare-game.js';

const require = createRequire(import.meta.url);
const { Packager, loadProject } = require('@turbowarp/packager');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const staging = path.join(root, '.build');

// Build in a temporary folder so a failed package never replaces the working site.
try {
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  const page = await readFile(path.join(root, 'src/index.html'), 'utf8');
  const accountPanel = await readFile(path.join(root, '../shared/accounts/panel.html'), 'utf8');
  await writeFile(
    path.join(staging, 'index.html'),
    page.replace('{{ACCOUNT_PANEL}}', accountPanel),
  );
  for (const folder of ['styles']) {
    await cp(path.join(root, 'src', folder), path.join(staging, folder), { recursive: true });
  }
  await cp(
    path.join(root, '../shared/accounts/panel.css'),
    path.join(staging, 'styles/accounts.css'),
  );
  await cp(path.join(root, 'public'), staging, { recursive: true });

  await bundleJavaScript({
    entryPoints: [path.join(root, 'src/app/main.js')],
    format: 'esm',
    outfile: path.join(staging, 'app/main.js'),
  });

  const adapter = await bundleJavaScript({
    entryPoints: [path.join(root, 'src/runtime/entry.js')],
    write: false,
    format: 'iife',
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
