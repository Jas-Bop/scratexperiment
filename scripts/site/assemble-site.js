import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { bundleJavaScript } from '../build-tools.js';
import { renderLibrary, renderGame, navigation } from '../site-templates.js';

/** Assemble pages and game outputs; all callers supply an unpublished staging folder. */
export async function assembleSite(root, destination, games) {
  await copySharedAssets(root, destination);
  await writeLibrary(root, destination);
  await writeAccountPage(root, destination);
  for (const game of games) await copyGame(root, destination, game);
  await writeFile(path.join(destination, '.nojekyll'), '');
}

async function copySharedAssets(root, destination) {
  const assets = path.join(destination, 'assets');
  await mkdir(assets, { recursive: true });
  await cp(path.join(root, 'site/styles.css'), path.join(assets, 'hub.css'));
  await cp(path.join(root, 'site/player.js'), path.join(assets, 'player.js'));
  await cp(path.join(root, 'shared/accounts/panel.css'), path.join(assets, 'account-panel.css'));
  await bundleJavaScript({
    entryPoints: [path.join(root, 'site/account-page.js')],
    format: 'esm',
    outfile: path.join(assets, 'accounts.js'),
  });
}

async function writeLibrary(root, destination) {
  const template = await readFile(path.join(root, 'site/index.html'), 'utf8');
  await writeFile(path.join(destination, 'index.html'), renderLibrary(template));
}

async function writeAccountPage(root, destination) {
  const template = await readFile(path.join(root, 'site/account.html'), 'utf8');
  const panel = await readFile(path.join(root, 'shared/accounts/panel.html'), 'utf8');
  const page = template
    .replace('{{NAVIGATION}}', navigation('account', '../'))
    .replace('{{ACCOUNT_PANEL}}', panel);
  await mkdir(path.join(destination, 'account'), { recursive: true });
  await writeFile(path.join(destination, 'account/index.html'), page);
}

async function copyGame(root, destination, game) {
  const template = await readFile(path.join(root, 'site/play.html'), 'utf8');
  const pageDirectory = path.join(destination, game.id);
  await mkdir(pageDirectory, { recursive: true });
  await writeFile(path.join(pageDirectory, 'index.html'), renderGame(template, game));
  await cp(
    path.join(root, game.projectDirectory, 'dist'),
    path.join(destination, 'games', game.id),
    { recursive: true },
  );
  await cp(
    path.join(root, game.preview),
    path.join(destination, 'assets', path.basename(game.preview)),
  );
}
