import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GAMES } from '../site/games.js';
import { renderGame, renderLibrary } from '../scripts/site-templates.js';

const library = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
const player = await readFile(new URL('../site/play.html', import.meta.url), 'utf8');
const prefix = 'https://example.github.io/scratexperiment/';

test('the dashboard links to every registered game and contains no unresolved placeholders', () => {
  const html = renderLibrary(library);
  for (const game of GAMES) {
    assert.ok(html.includes(`href="./${game.id}/"`));
    assert.ok(html.includes(`aria-label="Play ${game.title}"`));
  }
  assert.equal(html.includes('{{'), false);
  assert.equal((html.match(/class="game-card"/g) ?? []).length, GAMES.length);
});

test('game frames and all navigation links stay within a GitHub Pages project path', () => {
  for (const game of GAMES) {
    const html = renderGame(player, game);
    const pageUrl = new URL(`${game.id}/`, prefix);
    const source = html.match(/<iframe[^>]+src="([^"]+)"/s)[1];
    assert.equal(new URL(source, pageUrl).href, `${prefix}games/${game.id}/`);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      assert.ok(new URL(href, pageUrl).href.startsWith(prefix));
    }
    assert.equal(html.includes('{{'), false);
  }
});

test('each page highlights only its active dashboard tab', () => {
  const home = renderLibrary(library);
  assert.equal((home.match(/aria-current="page"/g) ?? []).length, 1);
  for (const game of GAMES) {
    const html = renderGame(player, game);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    assert.ok(html.includes(`href="../${game.id}/" aria-current="page"`));
  }
});
