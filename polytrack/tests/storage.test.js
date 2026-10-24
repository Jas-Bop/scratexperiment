import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore } from '../src/storage/save.js';
import { createCustomTrack } from '../src/tracks/track.js';

const memory = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('only faster records replace the saved ghost and survive reload', () => {
  const storage = memory(),
    store = new SaveStore(storage);
  assert.equal(
    store.finish('alpine-sprint', 40, [
      [0, 0, 0, 0, 0],
      [40, 1000, 0, 0, 0],
    ]),
    true,
  );
  assert.equal(store.finish('alpine-sprint', 45, []), false);
  assert.equal(new SaveStore(storage).record('alpine-sprint').time, 40);
  assert.equal(store.finish('alpine-sprint', 35, [[35, 1000, 0, 0, 0]]), true);
  assert.equal(new SaveStore(storage).record('alpine-sprint').time, 35);
});

test('custom circuit saves replace the existing track and invalidate its old record', () => {
  const store = new SaveStore(memory()),
    track = createCustomTrack();
  store.saveTrack(track);
  store.finish(track.id, 30, []);
  track.name = 'Updated circuit';
  store.saveTrack(track);
  assert.equal(store.tracks.length, 1);
  assert.equal(store.tracks[0].name, 'Updated circuit');
  assert.equal(store.record(track.id), null);
});

test('blocked storage still allows a playable in-memory session', () => {
  const storage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  const store = new SaveStore(storage);
  assert.equal(store.settings.camera, 'chase');
  assert.equal(store.persist(), false);
  assert.equal(store.finish('alpine-sprint', 30, []), true);
  assert.equal(store.record('alpine-sprint').time, 30);
});
