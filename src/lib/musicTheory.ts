export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type ChordQuality =
  | "major"
  | "minor"
  | "diminished"
  | "major7"
  | "minor7"
  | "dominant7"
  | "halfDiminished7"
  | "diminished7";
export type ScaleMode = "major" | "minor";
export type ChordType = "triad" | "seventh";

export interface Chord {
  root: string;
  quality: ChordQuality;
  noteNames: string[];
  frequencies: number[];
}

const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
  halfDiminished7: [0, 3, 6, 10],
  diminished7: [0, 3, 6, 9],
};

// 스케일 디그리(0~6)에서 근음까지의 반음 거리
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_QUALITIES: ChordQuality[] = ["major", "minor", "minor", "major", "major", "minor", "diminished"];
const MAJOR_SEVENTH_QUALITIES: ChordQuality[] = [
  "major7",
  "minor7",
  "minor7",
  "major7",
  "dominant7",
  "minor7",
  "halfDiminished7",
];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const MINOR_QUALITIES: ChordQuality[] = ["minor", "diminished", "major", "minor", "minor", "major", "major"];
const MINOR_SEVENTH_QUALITIES: ChordQuality[] = [
  "minor7",
  "halfDiminished7",
  "major7",
  "minor7",
  "minor7",
  "major7",
  "dominant7",
];

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

export function buildProgression(
  keyRoot: string,
  mode: ScaleMode,
  degrees: number[],
  chordType: ChordType = "triad"
): Chord[] {
  const rootOffset = NOTE_NAMES.indexOf(keyRoot);
  const scale = mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const qualities =
    chordType === "seventh"
      ? mode === "major"
        ? MAJOR_SEVENTH_QUALITIES
        : MINOR_SEVENTH_QUALITIES
      : mode === "major"
        ? MAJOR_QUALITIES
        : MINOR_QUALITIES;
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

const MAJOR_ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const MINOR_ROMAN = ["i", "ii°", "III", "iv", "v", "VI", "VII"];

// 한 키의 7개 다이어토닉 코드 (스케일 디그리 0~6 순서)
export function getDiatonicChords(keyRoot: string, mode: ScaleMode, chordType: ChordType = "triad"): Chord[] {
  return buildProgression(keyRoot, mode, [0, 1, 2, 3, 4, 5, 6], chordType);
}

export function getRomanNumerals(mode: ScaleMode): string[] {
  return mode === "major" ? MAJOR_ROMAN : MINOR_ROMAN;
}

export function qualitySuffix(quality: ChordQuality): string {
  switch (quality) {
    case "major":
      return "";
    case "minor":
      return "m";
    case "diminished":
      return "dim";
    case "major7":
      return "maj7";
    case "minor7":
      return "m7";
    case "dominant7":
      return "7";
    case "halfDiminished7":
      return "m7b5";
    case "diminished7":
      return "dim7";
  }
}
