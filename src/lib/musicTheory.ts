export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type ChordQuality = "major" | "minor" | "diminished";
export type ScaleMode = "major" | "minor";

export interface Chord {
  root: string;
  quality: ChordQuality;
  noteNames: string[];
  frequencies: number[];
}

const QUALITY_INTERVALS: Record<ChordQuality, [number, number, number]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
};

// 스케일 디그리(0~6)에서 근음까지의 반음 거리
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_QUALITIES: ChordQuality[] = ["major", "minor", "minor", "major", "major", "minor", "diminished"];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const MINOR_QUALITIES: ChordQuality[] = ["minor", "diminished", "major", "minor", "minor", "major", "major"];

const BASE_MIDI = 48; // C3 — 코드 반주로 쓰기 적당한 낮은 옥타브

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function buildChord(rootMidi: number, quality: ChordQuality): Chord {
  const midiNotes = QUALITY_INTERVALS[quality].map((interval) => rootMidi + interval);
  return {
    root: NOTE_NAMES[((rootMidi % 12) + 12) % 12],
    quality,
    noteNames: midiNotes.map((m) => NOTE_NAMES[((m % 12) + 12) % 12]),
    frequencies: midiNotes.map(midiToFrequency),
  };
}

export function buildProgression(keyRoot: string, mode: ScaleMode, degrees: number[]): Chord[] {
  const rootOffset = NOTE_NAMES.indexOf(keyRoot);
  const scale = mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const qualities = mode === "major" ? MAJOR_QUALITIES : MINOR_QUALITIES;
  return degrees.map((d) => buildChord(BASE_MIDI + rootOffset + scale[d], qualities[d]));
}

export interface ProgressionPreset {
  name: string;
  degrees: number[];
}

export const MAJOR_PROGRESSION_PRESETS: ProgressionPreset[] = [
  { name: "I - IV - V - I", degrees: [0, 3, 4, 0] },
  { name: "I - V - vi - IV", degrees: [0, 4, 5, 3] },
  { name: "I - vi - IV - V", degrees: [0, 5, 3, 4] },
  { name: "ii - V - I - I", degrees: [1, 4, 0, 0] },
];

export const MINOR_PROGRESSION_PRESETS: ProgressionPreset[] = [
  { name: "i - iv - v - i", degrees: [0, 3, 4, 0] },
  { name: "i - VI - III - VII", degrees: [0, 5, 2, 6] },
  { name: "i - iv - VII - III", degrees: [0, 3, 6, 2] },
];
