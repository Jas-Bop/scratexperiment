import test from 'node:test';
import assert from 'node:assert/strict';
import { GamePlayer } from '../src/player/game-player.js';
import { MESSAGE_TYPE } from '../src/shared/protocol.js';

function createHarness() {
  const host = new EventTarget();
  const frames = [];
  const timers = new Map();
  let timerId = 0;
  host.location = { origin: 'https://game.example' };
  host.document = {
    createElement() {
      const frame = new EventTarget();
      frame.messages = [];
      frame.contentWindow = { postMessage: (message) => frame.messages.push(message) };
      frame.focus = () => {};
      frame.remove = () => {
        frame.removed = true;
      };
      return frame;
    },
  };
  host.setTimeout = (callback) => {
    timers.set(++timerId, callback);
    return timerId;
  };
  host.clearTimeout = (id) => timers.delete(id);
  const player = new GamePlayer(
    { appendChild: (frame) => frames.push(frame) },
    {
      source: 'game/index.html',
      title: 'Game',
      loadTimeoutMs: 100,
    },
    host,
  );

  function message(data, source = frames.at(-1)?.contentWindow, origin = host.location.origin) {
    const event = new Event('message');
    Object.assign(event, { data, source, origin });
    host.dispatchEvent(event);
  }
  return { player, host, frames, timers, message };
}

test('only the current same-origin game can complete loading', () => {
  const { player, frames, message, timers } = createHarness();
  player.load();
  player.load();
  assert.equal(frames.length, 1, 'Repeated clicks must not create duplicate games');
  message({ type: MESSAGE_TYPE.READY }, {}, 'https://game.example');
  message({ type: MESSAGE_TYPE.READY }, frames[0].contentWindow, 'https://other.example');
  assert.equal(player.state, 'loading');
  message({ type: MESSAGE_TYPE.READY });
  assert.equal(player.state, 'ready');
  assert.equal(timers.size, 0);
});

test('timeout permits retry and ignores late messages from the failed game', () => {
  const { player, frames, timers, message } = createHarness();
  player.load();
  const oldFrame = frames[0];
  [...timers.values()][0]();
  assert.equal(player.state, 'error');
  assert.equal(oldFrame.removed, true);
  player.load();
  message({ type: MESSAGE_TYPE.READY }, oldFrame.contentWindow);
  assert.equal(player.state, 'loading');
  message({ type: MESSAGE_TYPE.READY });
  assert.equal(player.state, 'ready');
});

test('commands are gated by readiness and mute survives restart', () => {
  const { player, frames, message } = createHarness();
  player.load();
  player.restart();
  player.setKey(' ', true);
  assert.equal(frames[0].messages.length, 0);
  message({ type: MESSAGE_TYPE.READY });
  player.toggleMute();
  player.restart();
  assert.equal(player.muted, true);
  assert.ok(frames[0].messages.some(({ action }) => action === 'restart'));
  assert.deepEqual(frames[0].messages.filter(({ action }) => action === 'mute').at(-1), {
    type: MESSAGE_TYPE.COMMAND,
    action: 'mute',
    muted: true,
  });
  const count = frames[0].messages.length;
  player.setKey('unknown', true);
  assert.equal(frames[0].messages.length, count);
});

test('destroy removes the game, timers, and message listener', () => {
  const { player, frames, message, timers } = createHarness();
  player.load();
  player.destroy();
  message({ type: MESSAGE_TYPE.READY });
  assert.equal(player.state, 'idle');
  assert.equal(timers.size, 0);
  assert.equal(frames[0].removed, true);
});

test('switching accounts removes the previous game and rejects its late progress', () => {
  const { player, frames, message } = createHarness();
  player.setProfile({ char_nami_yn: 1 });
  player.load();
  message({ type: MESSAGE_TYPE.READY });
  assert.ok(frames[0].messages.some((entry) => entry.action === 'profile' && entry.active));
  const oldFrame = frames[0];
  player.setProfile({});
  assert.equal(oldFrame.removed, true);
  player.load();
  message({ type: MESSAGE_TYPE.READY });
  message({ type: MESSAGE_TYPE.PROGRESS, progress: { char_nami_yn: 1 } }, oldFrame.contentWindow);
  assert.deepEqual(player.progress, {});
  message({ type: MESSAGE_TYPE.PROGRESS, progress: { 'power X': 999 } });
  assert.deepEqual(player.progress, {});
  message({ type: MESSAGE_TYPE.PROGRESS, progress: { char_luffy_yn: 1 } });
  assert.deepEqual(player.progress, { char_luffy_yn: 1 });
});
