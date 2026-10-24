import { createHash } from 'node:crypto';
import { describeUnlock, resolveAttackStat } from '../../game/characters/index.js';
import { targetNamed } from './scratch-blocks.js';

/** Derive every character tooltip from the same values used by the engine. */
export async function renderCharacterCards(archive, project, characters) {
  for (const character of characters) {
    const attackIds = character.attackIds ?? Object.keys(character.attacks);
    writeCard(
      archive,
      project,
      character.id,
      infoLines(character, character, attackIds, characters),
    );
    if (character.unlock.kind !== 'starter') {
      writeCard(archive, project, `${character.id}_locked`, [
        character.name.toUpperCase(),
        '',
        'Task:',
        describeUnlock(character.unlock, characters),
      ]);
    }
    if (character.upgradedForm) {
      const form = character.upgradedForm;
      writeCard(archive, project, form.id, infoLines(character, form, form.attackIds, characters));
    }
  }
  await addNamiRewardQuote(
    archive,
    project,
    characters.find((character) => character.id === 'nami'),
  );
}

function infoLines(character, form, attackIds, characters) {
  const lines = [form.name.toUpperCase(), '', form.description, ''];
  for (const [stat, label] of [
    ['power', 'Power'],
    ['vertical', 'Vertical'],
    ['cooldownSeconds', 'CD'],
  ]) {
    const values = [
      ...new Set(
        attackIds
          .filter((id) => character.attacks[id][stat] !== undefined)
          .map((id) => resolveAttackStat(character.id, id, stat, characters)),
      ),
    ];
    if (values.length)
      lines.push(`${label}: ${values.join(' / ')}${stat === 'cooldownSeconds' ? 's' : ''}`);
  }
  if (form === character && character.upgradedForm) {
    lines.push(
      `Upgrade: ${character.upgradedForm.name}`,
      describeUnlock(character.upgradedForm.unlock, characters),
    );
  }
  return lines;
}

function writeCard(archive, project, name, lines) {
  const wrapped = lines.flatMap((line) => wrapText(line));
  // Match the imported Shadow cards: square gray panel, white Pixel text,
  // 10px lettering, and 12px line spacing. Pixel is supplied by Scratch's SVG renderer.
  const width = Math.max(140.05825, ...wrapped.map((line) => line.length * 5.75 + 6.875));
  const height = 4.675 + wrapped.length * 12;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#7f7f7f"/>
    <text x="3.4375" y="12.625" fill="#ffffff" font-family="Pixel" font-size="10" font-weight="normal" xml:space="preserve">${wrapped
      .map(
        (line, index) =>
          `<tspan x="3.4375" dy="${index === 0 ? 0 : 12}">${escapeXml(line) || ' '}</tspan>`,
      )
      .join('')}</text></svg>`;
  const assetId = createHash('md5').update(svg).digest('hex');
  const md5ext = `${assetId}.svg`;
  archive.file(md5ext, svg);
  const costumes = targetNamed(project, 'info').costumes;
  const costume = {
    name,
    assetId,
    md5ext,
    dataFormat: 'svg',
    bitmapResolution: 1,
    rotationCenterX: 0,
    rotationCenterY: 0,
  };
  const index = costumes.findIndex((item) => item.name === name);
  if (index === -1) costumes.push(costume);
  else costumes[index] = costume;
}

function wrapText(text, length = 27) {
  if (!text.trim()) return [''];
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && line.length + word.length + 1 > length) {
      lines.push(line);
      line = '';
    }
    line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines;
}

function escapeXml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function addNamiRewardQuote(archive, project, nami) {
  const costume = targetNamed(project, 'anime').costumes.find((item) => item.name === nami.id);
  const svg = await archive.file(costume.md5ext).async('string');
  const updated = svg.replace(
    '</svg>',
    `<text x="237" y="436" text-anchor="middle" font-family="Pixel" font-size="22" font-weight="normal" fill="#ffffff">${escapeXml(nami.description)}</text></svg>`,
  );
  const assetId = createHash('md5').update(updated).digest('hex');
  archive.file(`${assetId}.svg`, updated);
  Object.assign(costume, { assetId, md5ext: `${assetId}.svg` });
}
