import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import JSZip from '@turbowarp/jszip';
import { CHARACTERS, resolveAttackStat } from '../game/characters/index.js';
import { applyCharacterSettings } from '../scripts/game/apply-character-settings.js';
import { prepareGame } from '../scripts/game/prepare-game.js';

const source = await readFile(new URL('../game/project.sb3', import.meta.url));
const originalArchive = await JSZip.loadAsync(source);
const original = JSON.parse(await originalArchive.file('project.json').async('string'));
const sprite = (project, name) => project.targets.find((target) => target.name === name);
const powerBlock = (project, name) =>
  Object.values(sprite(project, name).blocks).find(
    (block) => block.opcode === 'data_changevariableby' && block.fields.VARIABLE[0] === 'power X',
  );

function normalizeLiterals(value) {
  if (Array.isArray(value)) {
    // Scratch's string and number literal tags both hold the same scalar value in these inputs.
    if (value.length === 2 && value[0] >= 4 && value[0] <= 10 && typeof value[1] === 'string')
      return ['literal', value[1]];
    return value.map(normalizeLiterals);
  }
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalizeLiterals(child)]),
    );
  return value;
}

async function unpackPrepared(characters) {
  const archive = await JSZip.loadAsync(await prepareGame(source, characters));
  return { archive, project: JSON.parse(await archive.file('project.json').async('string')) };
}

test('the catalog covers every roster character and all six upgraded forms', () => {
  assert.deepEqual(
    CHARACTERS.map((character) => character.id),
    [
      'grey',
      'luffy',
      'ichigo',
      'goku',
      'naruto',
      'tanjiro',
      'itadori',
      'deku',
      'levi',
      'asta',
      'saitama',
      'gojo',
      'shadow',
      'nami',
    ],
  );
  assert.deepEqual(
    CHARACTERS.flatMap((character) => character.upgradedForm?.id ?? []),
    ['luffy2', 'ichigo2', 'goku2', 'naruto2', 'tanjiro2', 'itadori2'],
  );
});

test('default character settings preserve every imported native block’s behavior', () => {
  const project = structuredClone(original);
  applyCharacterSettings(project);
  for (const target of original.targets) {
    for (const [id, block] of Object.entries(target.blocks)) {
      assert.deepEqual(
        normalizeLiterals(sprite(project, target.name).blocks[id]),
        normalizeLiterals(block),
        `${target.name}/${id}`,
      );
    }
  }
});

test('changing each character’s power changes the actual packaged project', async () => {
  const characters = structuredClone(CHARACTERS);
  for (const [index, character] of characters.entries()) {
    if (character.id === 'nami') continue;
    const attack = Object.values(character.attacks).find((entry) => entry.power !== undefined);
    attack.power += (index + 1) * 11;
  }
  const { project } = await unpackPrepared(characters);
  for (const character of characters) {
    const attackId = Object.keys(character.attacks).find(
      (id) => character.attacks[id].power !== undefined,
    );
    assert.equal(
      Number(powerBlock(project, character.id).inputs.VALUE[1][1]),
      resolveAttackStat(character.id, attackId, 'power', characters),
      character.id,
    );
  }
  const saitama = characters.find((character) => character.id === 'saitama');
  assert.equal(
    Number(powerBlock(project, 'nami').inputs.VALUE[1][1]),
    saitama.attacks.seriousPunch.power * 2,
  );
});

test('one character edit updates combat, cooldown, ammo, unlock threshold, and tooltip together', async () => {
  const characters = structuredClone(CHARACTERS);
  const luffy = characters.find((character) => character.id === 'luffy');
  luffy.attacks.normal.power = 75;
  luffy.attacks.normal.cooldownSeconds = 6;
  luffy.ammunition.maximum = 5;
  luffy.unlock.minimumDistance = 333;
  luffy.description = 'Pirate <captain> & crew';
  const { project, archive } = await unpackPrepared(characters);
  assert.equal(Number(powerBlock(project, 'luffy').inputs.VALUE[1][1]), 75);
  const blocks = Object.values(sprite(project, 'luffy').blocks);
  assert.ok(
    blocks.some((block) => block.opcode === 'operator_add' && block.inputs.NUM2?.[1]?.[1] === '6'),
  );
  assert.ok(
    blocks.some(
      (block) =>
        block.opcode === 'data_setvariableto' &&
        block.fields.VARIABLE[0] === 'ammo_luffy' &&
        block.inputs.VALUE[1][1] === '5',
    ),
  );
  const tasks = Object.values(sprite(project, 'tasks').blocks);
  assert.ok(
    tasks.some(
      (block) =>
        block.opcode === 'operator_lt' &&
        block.inputs.OPERAND1?.[1]?.[1] === '332' &&
        block.inputs.OPERAND2?.[1]?.[1] === 'Distance:',
    ),
  );
  const costume = sprite(project, 'info').costumes.find((entry) => entry.name === 'luffy');
  const card = await archive.file(costume.md5ext).async('string');
  assert.match(card, /Power: 75/);
  assert.match(card, /CD: 6s/);
  assert.match(card, /Pirate &lt;captain&gt; &amp; crew/);
  const locked = sprite(project, 'info').costumes.find((entry) => entry.name === 'luffy_locked');
  assert.match(await archive.file(locked.md5ext).async('string'), /Reach 333/);
});

test('invalid settings fail clearly instead of producing mismatched gameplay', () => {
  const duplicates = structuredClone(CHARACTERS);
  duplicates[1].roster.slot = duplicates[0].roster.slot;
  assert.throws(
    () => applyCharacterSettings(structuredClone(original), duplicates),
    /Duplicate roster slot/,
  );
  const unsupported = structuredClone(CHARACTERS);
  unsupported[1].unlock.kind = 'starter';
  assert.throws(
    () => applyCharacterSettings(structuredClone(original), unsupported),
    /requires an engine adapter change/,
  );
  const circular = structuredClone(CHARACTERS);
  circular.find((character) => character.id === 'saitama').attacks.seriousPunch.power = {
    character: 'nami',
    attack: 'staff',
    multiplier: 1,
  };
  assert.throws(
    () => applyCharacterSettings(structuredClone(original), circular),
    /Circular attack-stat reference/,
  );
});
