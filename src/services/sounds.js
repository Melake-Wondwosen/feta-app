/* Every sound the wheel makes, synthesized rather than loaded, so the
   app works offline and ships no audio files.

   Shared by the spin screen and the admin preview so what you test is
   exactly what consumers hear. */

let ctx = null;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
  return ctx;
}

/* One segment passing the pointer. */
export function playTick() {
  const c = ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.value = 1400;
  gain.gain.setValueAtTime(0.05, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.045);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.05);
}

/* Glass clink — bright partials with a fast decay, which reads as
   bottles touching rather than a bell. */
export function playClink() {
  const c = ensureAudio();
  if (!c) return;
  [2340, 3150, 4600].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const start = c.currentTime + i * 0.006;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14 / (i + 1), start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.45);
  });
}

export function playWinChime() {
  const c = ensureAudio();
  if (!c) return;
  [660, 880, 1100].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = c.currentTime + i * 0.09;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

export function playNoWinTone() {
  const c = ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(420, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.35);
  gain.gain.setValueAtTime(0.08, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.4);
}
