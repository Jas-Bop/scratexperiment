import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { installScratchAdapter } from '../src/runtime/scratch-adapter.js';
import { MESSAGE_TYPE } from '../src/shared/protocol.js';
import { GAME_KEYS } from '../src/shared/controls.js';

function createHarness() {
  const host = new EventTarget();
  const notifications = [];
  host.location = { origin: 'https://game.example' };
  host.parent = { postMessage: (data) => notifications.push(data) };
  host.focus = () => {};
  const inputs = [];
  const runtime = new EventEmitter();
  runtime.audioEngine = { inputNode: { gain: { value: 1 } } };
  const vm = {
    runtime,
    postIOData: (device, input) => inputs.push({ device, ...input }),
    stopAll() {},
    greenFlag() {
      runtime.audioEngine.inputNode.gain.value = 1;
    },
  };
  const dispose = installScratchAdapter(vm, host);
  const command = (data, source = host.parent, origin = host.location.origin) => {
    const event = new Event('message');
    Object.assign(event, { data: { type: MESSAGE_TYPE.COMMAND, ...data }, source, origin });
    host.dispatchEvent(event);
  };
  return { host, vm, inputs, command, notifications, dispose };
}

test('rejects commands from other windows and malformed keyboard payloads', () => {
  const { inputs, command } = createHarness();
  command({ action: 'key', key: ' ', down: true }, {});
  command({ action: 'key', key: ' ', down: true }, undefined, 'https://other.example');
  command({ action: 'key', key: ' ', down: 'true' });
  command({ action: 'key', key: 'unknown', down: true });
  assert.equal(inputs.length, 0);
  command({ action: 'key', key: ' ', down: true });
  assert.deepEqual(inputs, [{ device: 'keyboard', key: ' ', isDown: true }]);
});

test('retains mute after the VM resets volume on restart', () => {
  const { vm, command } = createHarness();
  command({ action: 'mute', muted: true });
  command({ action: 'restart' });
  assert.equal(vm.runtime.audioEngine.inputNode.gain.value, 0);
  command({ action: 'mute', muted: false });
  assert.equal(vm.runtime.audioEngine.inputNode.gain.value, 1);
});

test('releases held inputs on blur and removes listeners on disposal', () => {
  const { host, vm, inputs, notifications, command, dispose } = createHarness();
  host.dispatchEvent(new Event('blur'));
  assert.deepEqual(
    inputs.map(({ key }) => key),
    GAME_KEYS,
  );
  assert.ok(inputs.every(({ isDown }) => !isDown));
  vm.runtime.emit('PROJECT_LOADED');
  assert.deepEqual(notifications, [{ type: MESSAGE_TYPE.READY }]);
  dispose();
  const count = inputs.length;
  command({ action: 'key', key: ' ', down: true });
  host.dispatchEvent(new Event('blur'));
  vm.runtime.emit('PROJECT_LOADED');
  assert.equal(inputs.length, count);
  assert.equal(notifications.length, 1);
});
