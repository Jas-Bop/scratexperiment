import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES } from '../site/games.js';
import { buildInStaging } from './build-tools.js';
import { buildGames } from './site/build-games.js';
import { assembleSite } from './site/assemble-site.js';

const root = fileURLToPath(new URL('../', import.meta.url));

try {
  buildGames(root, GAMES);
  await buildInStaging(
    { staging: path.join(root, '.site-build'), output: path.join(root, 'dist') },
    (staging) => assembleSite(root, staging, GAMES),
  );
  console.log(`Game Hub built: dist/ — ${GAMES.map((game) => game.title).join(', ')} + Account`);
} catch (error) {
  console.error(`Game Hub build failed: ${error.message}`);
  process.exitCode = 1;
}
