import { DEFAULT_SETTINGS } from '../game/config.js';
import { validateTrack } from '../tracks/track.js';
const KEY = 'polytrack-local-v1';

/** Storage failure never prevents playing. No remote accounts or invented online records. */
export class SaveStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.data = { settings: { ...DEFAULT_SETTINGS }, records: {}, tracks: [] };
    try {
      const stored = JSON.parse(storage.getItem(KEY));
      if (stored && typeof stored === 'object') {
        this.data.settings = { ...DEFAULT_SETTINGS, ...stored.settings };
        if (stored.records && typeof stored.records === 'object')
          this.data.records = stored.records;
        this.data.tracks = (Array.isArray(stored.tracks) ? stored.tracks : []).filter((track) => {
          try {
            validateTrack(track);
            return true;
          } catch {
            return false;
          }
        });
      }
    } catch {
      /* A corrupt save starts clean; gameplay remains available. */
    }
  }
  persist() {
    try {
      this.storage.setItem(KEY, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }
  get settings() {
    return this.data.settings;
  }
  get tracks() {
    return this.data.tracks;
  }
  record(id) {
    const record = this.data.records[id];
    if (
      !record ||
      !Number.isFinite(record.time) ||
      record.time <= 0 ||
      !Array.isArray(record.frames)
    )
      return null;
    const frames = record.frames.filter(
      (frame) => Array.isArray(frame) && frame.length === 5 && frame.every(Number.isFinite),
    );
    return { time: record.time, frames };
  }
  finish(id, time, frames) {
    const previous = this.record(id);
    if (previous && previous.time <= time) return false;
    this.data.records[id] = { time, frames };
    this.persist();
    return true;
  }
  saveTrack(track) {
    validateTrack(track);
    const index = this.data.tracks.findIndex((item) => item.id === track.id);
    if (index === -1) this.data.tracks.push(structuredClone(track));
    else this.data.tracks[index] = structuredClone(track);
    // Edited geometry invalidates a ghost recorded on the old course.
    delete this.data.records[track.id];
    return this.persist();
  }
}
