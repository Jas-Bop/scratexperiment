import './ui/styles.css';
import { Track, BUILTIN_TRACKS } from './tracks/track.js';
import { Race } from './game/race.js';
import { Input } from './game/input.js';
import { PHYSICS, PALETTE } from './game/config.js';
import { formatTime, clamp } from './game/math.js';
import { World } from './render/world.js';
import { SaveStore } from './storage/save.js';
import { TrackEditor } from './editor/editor.js';
import { trackThumbnail, Minimap } from './ui/maps.js';
import { EngineAudio } from './audio/engine.js';

const $ = (id) => document.getElementById(id);
const store = new SaveStore(),
  audio = new EngineAudio();
let world,
  race,
  track,
  record,
  selected = 0,
  screen = 'menu',
  testingEditor = false;
let lastTime = 0,
  accumulator = 0,
  toastTimer;
const minimap = new Minimap($('minimap'));
const input = new Input(handleAction);
const touchHint = matchMedia('(pointer: coarse), (max-width: 600px)');
function updateStartHint() {
  $('start-hint').querySelector('span').textContent = touchHint.matches
    ? 'Hold ▲ to accelerate. Use ◀ and ▶ to steer.'
    : 'Press W or ↑ to drive. Beat the clock.';
}
touchHint.addEventListener('change', updateStartHint);
updateStartHint();
input.bindTouch($('touch-controls'));
const allTracks = () => [...BUILTIN_TRACKS, ...store.tracks];

const editor = new TrackEditor($('editor'), {
  onClose: () => {
    editor.close();
    showMenu();
  },
  onSave: (definition) => {
    const persisted = store.saveTrack(definition);
    selected = allTracks().findIndex((item) => item.id === definition.id);
    renderTracks();
    toast(
      persisted
        ? 'Circuit saved to your garage.'
        : 'Circuit ready for this session. Browser storage is full.',
    );
  },
  onTest: (definition) => {
    testingEditor = true;
    editor.close();
    loadTrack(definition);
    startRace();
  },
});

try {
  world = new World($('world'), store.settings);
  world.applySettings();
  loadTrack(allTracks()[0]);
  renderTracks();
  renderSettings();
  $('loading').hidden = true;
  $('menu').hidden = false;
  requestAnimationFrame(frame);
} catch (error) {
  $('loading').hidden = true;
  const fatal = document.createElement('section');
  fatal.className = 'fatal';
  const title = document.createElement('h1');
  title.textContent = 'THE GRID COULD NOT LOAD.';
  const message = document.createElement('p');
  message.textContent =
    'This game needs WebGL. Enable hardware acceleration in your browser, then reload. ' +
    error.message;
  fatal.append(title, message);
  document.body.appendChild(fatal);
  console.error(error);
}

function loadTrack(definition) {
  track = new Track(definition);
  race = new Race(track);
  record = testingEditor ? null : store.record(definition.id);
  world.load(track);
  minimap.load(track);
  bindRace();
  updateTrackLabels();
}

function updateTrackLabels() {
  $('selected-number').textContent = String(selected + 1).padStart(2, '0');
  $('selected-name').textContent = track.definition.name;
  $('selected-subtitle').textContent = track.definition.subtitle || 'Your custom circuit.';
  $('scene-name').textContent = track.definition.name.toUpperCase();
  $('scene-length').textContent =
    `${(track.length / 1000).toFixed(2)} KM · ${track.checkpoints.length} CHECKPOINTS`;
  $('hud-track').textContent = track.definition.name;
  $('hud-record').textContent = record
    ? `PERSONAL BEST ${formatTime(record.time)}`
    : 'NO RECORD — MAKE YOUR MARK';
  $('best-time').textContent = record ? formatTime(record.time) : '—';
  $('ghost-status').textContent = record && store.settings.ghost ? 'ACTIVE' : '—';
  $('ghost-status').style.color = record && store.settings.ghost ? '#c9ff37' : '';
}

function renderTracks() {
  const list = $('track-list');
  list.replaceChildren();
  allTracks().forEach((definition, index) => {
    const course = new Track(definition),
      best = store.record(definition.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `track-card${index === selected ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', String(index === selected));
    button.innerHTML = `${trackThumbnail(course)}<div><small></small><strong></strong><span class="record"></span></div>`;
    button.querySelector('small').textContent = definition.difficulty || 'CUSTOM / LOCAL';
    button.querySelector('strong').textContent = definition.name;
    button.querySelector('.record').textContent = best
      ? `PB ${formatTime(best.time)}`
      : 'NO RECORD YET';
    button.addEventListener('click', () => {
      selected = index;
      testingEditor = false;
      loadTrack(definition);
      renderTracks();
    });
    list.appendChild(button);
  });
  $('track-count').textContent = `${String(allTracks().length).padStart(2, '0')} CIRCUITS`;
}

function setScreen(next) {
  screen = next;
  document.body.dataset.screen = next;
  $('menu').hidden = next !== 'menu';
  $('hud').hidden = next !== 'race';
  $('pause-modal').hidden = true;
  $('finish-modal').hidden = true;
  $('settings-modal').hidden = true;
  input.clear();
  accumulator = 0;
}

function startRace() {
  audio.enabled = store.settings.sound;
  audio.start();
  setScreen('race');
  race.restart();
  world.cameraReady = false;
  $('start-hint').hidden = false;
  updateTrackLabels();
}

function showMenu() {
  if (testingEditor) {
    testingEditor = false;
    editor.open(editor.draft);
    setScreen('editor');
    return;
  }
  editor.close();
  setScreen('menu');
  race.restart();
  const definition = allTracks()[selected] || allTracks()[0];
  loadTrack(definition);
  renderTracks();
}

function bindRace() {
  race.addEventListener('start', () => {
    $('start-hint').hidden = true;
  });
  race.addEventListener('checkpoint', () => {
    audio.checkpoint();
    toast(`CHECKPOINT ${race.checkpoint} / ${track.checkpoints.length}`);
  });
  race.addEventListener('respawn', () => {
    world.cameraReady = false;
    toast('BACK ON TRACK — clock keeps running');
  });
  race.addEventListener('finish', () => {
    const previous = record?.time ?? Infinity;
    // Test drives are not mixed with the saved version of a custom circuit.
    const newBest = testingEditor
      ? false
      : store.finish(track.definition.id, race.elapsed, race.recording);
    audio.checkpoint();
    $('finish-label').textContent = newBest
      ? 'NEW PERSONAL BEST'
      : testingEditor
        ? 'TEST DRIVE COMPLETE'
        : 'FINISH LINE';
    $('result-time').textContent = formatTime(race.elapsed);
    $('previous-best').textContent = formatTime(previous);
    const medal =
      race.elapsed <= track.definition.goldTime
        ? 'GOLD'
        : race.elapsed <= track.definition.silverTime
          ? 'SILVER'
          : race.elapsed <= track.definition.bronzeTime
            ? 'BRONZE'
            : 'FINISHER';
    $('medal').textContent = medal === 'FINISHER' ? '⚑' : '★';
    $('medal').style.color =
      { GOLD: '#f8d36c', SILVER: '#cfdeec', BRONZE: '#d9a075' }[medal] || '#c9ff37';
    $('result-copy').textContent =
      `${medal} · ${newBest ? 'Your ghost is saved. Go chase it.' : previous < Infinity ? `${race.elapsed < previous ? 'Faster than' : `${(race.elapsed - previous).toFixed(3)}s off`} your previous best.` : 'Keep finding your racing line.'}`;
    $('finish-modal').hidden = false;
    input.clear();
  });
}

function pauseRace() {
  if (screen !== 'race' || !['ready', 'running', 'paused'].includes(race.mode)) return;
  if (race.mode === 'paused') {
    race.resume();
    $('pause-modal').hidden = true;
  } else {
    race.pause();
    $('pause-modal').hidden = false;
  }
  input.clear();
}
function restartRace() {
  if (screen === 'race') {
    record = testingEditor ? null : store.record(track.definition.id);
    race.restart();
    $('pause-modal').hidden = true;
    $('finish-modal').hidden = true;
    $('start-hint').hidden = false;
    world.cameraReady = false;
    input.clear();
    updateTrackLabels();
  }
}
function nextTrack() {
  testingEditor = false;
  selected = (selected + 1) % allTracks().length;
  loadTrack(allTracks()[selected]);
  startRace();
}
function handleAction(code) {
  if (code === 'Escape') {
    if (!$('settings-modal').hidden) {
      $('settings-modal').hidden = true;
      return;
    }
    if (screen === 'race') pauseRace();
    else if (screen === 'editor') {
      editor.close();
      showMenu();
    }
    return;
  }
  if (code === 'Enter' && screen === 'menu' && $('settings-modal').hidden) {
    startRace();
    return;
  }
  if (screen !== 'race') return;
  if (code === 'KeyR') restartRace();
  if (code === 'Backspace' && race.mode === 'running') {
    race.respawn();
    input.clear();
  }
  if (code === 'KeyC') {
    store.settings.camera = store.settings.camera === 'chase' ? 'hood' : 'chase';
    store.persist();
    world.cameraReady = false;
    toast(store.settings.camera === 'chase' ? 'CHASE CAMERA' : 'COCKPIT CAMERA');
  }
  if (code === 'KeyM') {
    store.settings.sound = !store.settings.sound;
    audio.enabled = store.settings.sound;
    store.persist();
    toast(audio.enabled ? 'SOUND ON' : 'SOUND OFF');
  }
}

function frame(timestamp) {
  const time = timestamp / 1000,
    dt = Math.min(0.05, lastTime ? time - lastTime : 0);
  lastTime = time;
  if (screen === 'race') {
    accumulator += dt;
    const controls = input.read();
    while (accumulator >= PHYSICS.step) {
      race.update(controls, PHYSICS.step);
      accumulator -= PHYSICS.step;
    }
    renderHud();
  }
  audio.update(race.car.speed, screen === 'race' && race.mode === 'running');
  world.render(race, record, screen !== 'race', dt, time);
  requestAnimationFrame(frame);
}

function renderHud() {
  $('current-time').textContent = formatTime(race.elapsed);
  $('speed').textContent = Math.round(Math.abs(race.car.speed) * 3.6);
  $('checkpoint-count').textContent = `${race.checkpoint} / ${track.checkpoints.length}`;
  $('progress').firstElementChild.style.width =
    `${clamp(race.car.distance / track.length, 0, 1) * 100}%`;
  const status = race.car.falling
    ? 'OFF TRACK'
    : race.car.boost
      ? 'BOOST'
      : race.car.airHeight > 0.3
        ? 'AIRBORNE'
        : race.car.wallHit
          ? 'BARRIER'
          : race.mode === 'ready'
            ? 'READY'
            : race.car.speed < 0
              ? 'REVERSE'
              : 'TIME ATTACK';
  $('drive-status').textContent = status;
  $('drive-status').style.color = race.car.boost ? '#c9ff37' : '';
  for (const [index, bar] of [...$('speed-bars').children].entries())
    bar.classList.toggle('active', Math.abs(race.car.speed) / 80 > index / 12);
  minimap.draw(race);
}

function renderSettings() {
  $('palette').replaceChildren();
  for (const color of PALETTE) {
    const button = document.createElement('button');
    button.style.background = color;
    button.setAttribute('aria-label', `Car color ${color}`);
    button.classList.toggle('selected', store.settings.color === color);
    button.addEventListener('click', () => {
      store.settings.color = color;
      store.persist();
      world.applySettings();
      renderSettings();
    });
    $('palette').appendChild(button);
  }
  $('camera-setting').value = store.settings.camera;
  $('quality-setting').value = store.settings.quality;
  $('sound-setting').checked = store.settings.sound;
  $('ghost-setting').checked = store.settings.ghost;
}
function saveSettings() {
  store.settings.camera = $('camera-setting').value;
  store.settings.quality = $('quality-setting').value;
  store.settings.sound = $('sound-setting').checked;
  store.settings.ghost = $('ghost-setting').checked;
  audio.enabled = store.settings.sound;
  store.persist();
  world.applySettings();
  updateTrackLabels();
}
function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => ($('toast').hidden = true), 2300);
}

for (let i = 0; i < 12; i++) $('speed-bars').appendChild(document.createElement('i'));
$('race-button').addEventListener('click', () => {
  testingEditor = false;
  startRace();
});
$('editor-button').addEventListener('click', () => {
  setScreen('editor');
  editor.open(allTracks()[selected]);
});
$('settings-button').addEventListener('click', () => {
  renderSettings();
  $('settings-modal').hidden = false;
});
for (const id of ['settings-close', 'settings-done'])
  $(id).addEventListener('click', () => {
    $('settings-modal').hidden = true;
  });
for (const id of ['camera-setting', 'quality-setting', 'sound-setting', 'ghost-setting'])
  $(id).addEventListener('change', saveSettings);
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    toast('Fullscreen is unavailable in this browser.');
  }
});
for (const id of ['pause-race', 'resume']) $(id).addEventListener('click', pauseRace);
for (const id of ['restart-race', 'pause-restart', 'retry'])
  $(id).addEventListener('click', restartRace);
for (const id of ['exit-race', 'pause-menu', 'finish-menu'])
  $(id).addEventListener('click', showMenu);
$('next-track').addEventListener('click', nextTrack);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'race' && race.mode === 'running') pauseRace();
});

// Read-only inspection hook for local development and browser verification; omitted in production.
if (import.meta.env.DEV)
  window.__racer = {
    get race() {
      return race;
    },
    get track() {
      return track;
    },
    get screen() {
      return screen;
    },
    get store() {
      return store;
    },
  };
