/**
 * Haptic feedback + subtle audio cues.
 * Silently no-ops on unsupported devices / SSR.
 */
export type HapticStrength = "light" | "medium" | "heavy" | "success" | "error";

const patterns: Record<HapticStrength, number | number[]> = {
  light: 8,
  medium: 18,
  heavy: 32,
  success: [10, 40, 20],
  error: [40, 30, 40],
};

export function haptic(kind: HapticStrength = "light"): void {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(patterns[kind]);
  } catch {
    /* ignore */
  }
}

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    _ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return _ctx;
  } catch {
    return null;
  }
}

/** Play a short, tasteful success chime (two-note). */
export function playSuccess(): void {
  const ac = ctx();
  if (!ac) return;
  const now = ac.currentTime;
  [880, 1320].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setValueAtTime(0, now + i * 0.12);
    g.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
    o.connect(g).connect(ac.destination);
    o.start(now + i * 0.12);
    o.stop(now + i * 0.12 + 0.4);
  });
}

/** Subtle "tap" click for interactions. */
export function playTap(): void {
  const ac = ctx();
  if (!ac) return;
  const now = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "triangle";
  o.frequency.value = 600;
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  o.connect(g).connect(ac.destination);
  o.start(now);
  o.stop(now + 0.09);
}
