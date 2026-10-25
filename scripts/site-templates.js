import path from 'node:path';
import { GAMES } from '../site/games.js';

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** prefix is relative to the page: ./ for the library, ../ for an individual game. */
export function navigation(current, prefix) {
  const entries = [
    { id: 'home', title: 'All games', href: prefix },
    ...GAMES.map((game) => ({ id: game.id, title: game.title, href: `${prefix}${game.id}/` })),
  ];
  return `<header class="hub-bar">
    <a class="hub-brand" href="${prefix}" aria-label="Game Hub home"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M9 10h14c3 0 5 4 6 10s-4 7-7 2l-2-1h-8l-2 1c-3 5-8 4-7-2s3-10 6-10Z" stroke="currentColor" stroke-width="2"/><path d="M10 13v7m-3.5-3.5h7" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="15" r="1.4" fill="currentColor"/><circle cx="25" cy="19" r="1.4" fill="currentColor"/></svg><span>GAME HUB</span></a>
    <nav class="game-nav" aria-label="Game dashboard">${entries.map((entry) => `<a href="${escapeHtml(entry.href)}"${entry.id === current ? ' aria-current="page"' : ''}>${escapeHtml(entry.title)}</a>`).join('')}</nav>
    <a class="account-link" href="${prefix}account/"${current === 'account' ? ' aria-current="page"' : ''}>Account</a>
  </header>`;
}

export function gameCards() {
  return GAMES.map(
    (
      game,
    ) => `<a class="game-card" href="./${game.id}/" style="--game-accent:${game.accent}" aria-label="Play ${escapeHtml(game.title)}">
    <div class="card-image"><img src="./assets/${escapeHtml(path.basename(game.preview))}" alt="${escapeHtml(game.previewAlt)}"/><span class="card-genre">${escapeHtml(game.genre)}</span></div>
    <div class="card-body"><div class="card-heading"><h2>${escapeHtml(game.title)}</h2><span class="play-arrow" aria-hidden="true">↗</span></div><p class="card-description">${escapeHtml(game.description)}</p>
    <ul class="card-features">${game.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul><div class="play-label">Play game <span aria-hidden="true">→</span></div></div>
  </a>`,
  ).join('\n');
}

export function renderLibrary(template) {
  return template
    .replace('{{NAVIGATION}}', navigation('home', './'))
    .replace('{{GAME_COUNT}}', GAMES.length)
    .replace('{{GAME_CARDS}}', gameCards());
}

export function renderGame(template, game) {
  return template
    .replaceAll('{{GAME_TITLE}}', escapeHtml(game.title))
    .replace('{{NAVIGATION}}', navigation(game.id, '../'))
    .replace('{{PLAYER_PATH}}', `../games/${game.id}/`);
}
