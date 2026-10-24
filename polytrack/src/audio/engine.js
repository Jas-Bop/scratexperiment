/** Synthesised engine and checkpoint sounds; no downloaded audio assets. */
export class EngineAudio {
  constructor() {
    this.enabled = true;
  }
  start() {
    if (this.context) {
      this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.gain = this.context.createGain();
    this.gain.gain.value = 0;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 620;
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = 'sawtooth';
    this.oscillator.connect(filter);
    filter.connect(this.gain);
    this.gain.connect(this.context.destination);
    this.oscillator.start();
  }
  update(speed, active) {
    if (!this.context) return;
    this.oscillator.frequency.setTargetAtTime(
      35 + Math.abs(speed) * 2.1,
      this.context.currentTime,
      0.1,
    );
    this.gain.gain.setTargetAtTime(
      this.enabled && active ? 0.035 : 0,
      this.context.currentTime,
      0.08,
    );
  }
  checkpoint() {
    if (!this.context || !this.enabled) return;
    const oscillator = this.context.createOscillator(),
      gain = this.context.createGain();
    oscillator.frequency.setValueAtTime(660, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1100, this.context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.075, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.25);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.26);
  }
}
