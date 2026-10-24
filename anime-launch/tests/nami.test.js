import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import JSZip from '@turbowarp/jszip';
import { prepareGame } from '../scripts/game/prepare-game.js';

const source = await readFile(new URL('../game/project.sb3', import.meta.url));
const archive = await JSZip.loadAsync(await prepareGame(source));
const project = JSON.parse(await archive.file('project.json').async('string'));
const target = (name) => project.targets.find((item) => item.name === name);
const blocks = (name) => Object.values(target(name).blocks);

// Check the generated playable project, rather than only the character settings.
test('Nami has an independent summon and twice Saitama’s hit power', () => {
  const hats = blocks('nami').filter((block) => block.opcode === 'event_whenbroadcastreceived');
  assert.ok(hats.some((block) => block.fields.BROADCAST_OPTION[0] === 'summon_nami'));
  assert.ok(hats.every((block) => block.fields.BROADCAST_OPTION[0] !== 'summon_itadori'));
  const power = blocks('nami').find(
    (block) => block.opcode === 'data_changevariableby' && block.fields.VARIABLE[0] === 'power X',
  );
  assert.equal(Number(power.inputs.VALUE[1][1]), 1200);
  const vertical = blocks('nami').find(
    (block) => block.opcode === 'data_setvariableto' && block.fields.VARIABLE[0] === 'power Y',
  );
  assert.equal(Number(vertical.inputs.VALUE[1][1]), 100);
});

test('all generated blocks retain valid next, input, and parent links', () => {
  for (const sprite of project.targets) {
    for (const [id, block] of Object.entries(sprite.blocks)) {
      if (!id.startsWith('nami:')) continue;
      if (block.next) {
        assert.ok(sprite.blocks[block.next], `${sprite.name}: missing next block`);
        assert.equal(sprite.blocks[block.next].parent, id);
      }
      if (block.parent) assert.ok(sprite.blocks[block.parent], `${sprite.name}: missing parent`);
      for (const input of Object.values(block.inputs)) {
        for (const reference of input.slice(1)) {
          if (typeof reference !== 'string') continue;
          assert.ok(sprite.blocks[reference], `${sprite.name}: missing input ${reference}`);
          assert.equal(sprite.blocks[reference].parent, id);
        }
      }
    }
  }
});

test('locked and unlocked cards plus the reward include the requested text and valid assets', async () => {
  const locked = target('info').costumes.find((costume) => costume.name === 'nami_locked');
  const unlocked = target('info').costumes.find((costume) => costume.name === 'nami');
  const reward = target('anime').costumes.find((costume) => costume.name === 'nami');
  for (const costume of [locked, unlocked, reward]) {
    const bytes = await archive.file(costume.md5ext).async('nodebuffer');
    assert.equal(createHash('md5').update(bytes).digest('hex'), costume.assetId);
  }
  assert.match(await archive.file(locked.md5ext).async('string'), /Get past 600 using Luffy/);
  assert.match(await archive.file(unlocked.md5ext).async('string'), /Money is life/);
  assert.match(await archive.file(reward.md5ext).async('string'), /Money is life/);
});
