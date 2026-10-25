import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildInStaging } from '../scripts/build-tools.js';

test('failed staging preserves the previous playable build; a successful build replaces it', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'game-hub-build-'));
  const output = path.join(root, 'dist');
  const staging = path.join(root, 'staging');
  try {
    await mkdir(output);
    await writeFile(path.join(output, 'index.html'), 'previous working game');
    await assert.rejects(
      buildInStaging({ output, staging }, async (directory) => {
        await writeFile(path.join(directory, 'index.html'), 'unfinished game');
        throw new Error('Packaging failed');
      }),
      /Packaging failed/,
    );
    assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), 'previous working game');
    await buildInStaging({ output, staging }, (directory) =>
      writeFile(path.join(directory, 'index.html'), 'new working game'),
    );
    assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), 'new working game');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
