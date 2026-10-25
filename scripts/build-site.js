import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { GAMES } from '../site/games.js';
import { renderLibrary, renderGame } from './site-templates.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const staging = path.join(root, '.site-build');
const output = path.join(root, 'dist');

try {
  // Each game keeps its own build and dependencies. Only this script assembles the shared site.
  for (const game of GAMES) {
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: path.join(root, game.projectDirectory),
      stdio: 'inherit',
    });
    if (result.status !== 0)
      throw new Error(
        `${game.title} failed to build. Run npm run setup if dependencies are missing.`,
      );
  }
  await rm(staging, { recursive: true, force: true });
  await mkdir(path.join(staging, 'assets'), { recursive: true });
  await cp(path.join(root, 'site/styles.css'), path.join(staging, 'assets/hub.css'));
  await cp(path.join(root, 'site/player.js'), path.join(staging, 'assets/player.js'));
  const libraryTemplate = await readFile(path.join(root, 'site/index.html'), 'utf8');
  const playerTemplate = await readFile(path.join(root, 'site/play.html'), 'utf8');
  await writeFile(path.join(staging, 'index.html'), renderLibrary(libraryTemplate));
  for (const game of GAMES) {
    const gamePage = path.join(staging, game.id);
    await mkdir(gamePage, { recursive: true });
    await writeFile(path.join(gamePage, 'index.html'), renderGame(playerTemplate, game));
    await cp(path.join(root, game.projectDirectory, 'dist'), path.join(staging, 'games', game.id), {
      recursive: true,
    });
    await cp(
      path.join(root, game.preview),
      path.join(staging, 'assets', path.basename(game.preview)),
    );
  }
  await writeFile(path.join(staging, '.nojekyll'), '');
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
  console.log(
    '\nGame Hub built: dist/index.html + ' + GAMES.map((game) => `/${game.id}/`).join(' + '),
  );
} catch (error) {
  console.error(`Game Hub build failed: ${error.message}`);
  process.exitCode = 1;
}
