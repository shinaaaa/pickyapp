import { NOTE_NAMES, midiToFrequency } from "@/lib/musicTheory";

export interface GuitarString {
  name: string;
  frequency: number;
}

export interface Tuning {
  id: string;
  label: string;
  // MIDI 노트 번호, 6번(가장 낮은) 줄부터 1번(가장 높은) 줄 순서
  midiNotes: number[];
}

export const TUNINGS: Tuning[] = [
  { id: "standard", label: "표준 (E A D G B E)", midiNotes: [40, 45, 50, 55, 59, 64] },
  { id: "drop-d", label: "드롭 D (D A D G B E)", midiNotes: [38, 45, 50, 55, 59, 64] },
  { id: "half-step-down", label: "반음 다운 (Eb Ab Db Gb Bb Eb)", midiNotes: [39, 44, 49, 54, 58, 63] },
  { id: "full-step-down", label: "온음 다운 (D G C F A D)", midiNotes: [38, 43, 48, 53, 57, 62] },
  { id: "open-g", label: "오픈 G (D G D G B D)", midiNotes: [38, 43, 50, 55, 59, 62] },
  { id: "open-d", label: "오픈 D (D A D F# A D)", midiNotes: [38, 45, 50, 54, 57, 62] },
  { id: "open-c", label: "오픈 C (C G C G C E)", midiNotes: [36, 43, 48, 55, 60, 64] },
  { id: "dadgad", label: "DADGAD (D A D G A D)", midiNotes: [38, 45, 50, 55, 57, 62] },
];

function midiToStringName(midi: number): string {
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName}${octave}`;
}

export function getStrings(tuning: Tuning): GuitarString[] {
  return tuning.midiNotes.map((midi) => ({
    name: midiToStringName(midi),
    frequency: midiToFrequency(midi),
  }));
}

export function closestString(frequency: number, strings: GuitarString[]): GuitarString {
  return strings.reduce((closest, s) =>
    Math.abs(Math.log2(s.frequency / frequency)) < Math.abs(Math.log2(closest.frequency / frequency))
      ? s
      : closest
  );
}
