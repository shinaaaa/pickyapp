import { NOTE_NAMES } from "@/lib/musicTheory";

export interface ScaleType {
  id: string;
  name: string;
  intervals: number[];
}

export const SCALE_TYPES: ScaleType[] = [
  { id: "major", name: "메이저", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "minor", name: "마이너 (내추럴)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "major-pentatonic", name: "메이저 펜타토닉", intervals: [0, 2, 4, 7, 9] },
  { id: "minor-pentatonic", name: "마이너 펜타토닉", intervals: [0, 3, 5, 7, 10] },
  { id: "blues", name: "블루스", intervals: [0, 3, 5, 6, 7, 10] },
];

export function getScaleNoteNames(root: string, scaleType: ScaleType): string[] {
  const rootIndex = NOTE_NAMES.indexOf(root);
  return scaleType.intervals.map((i) => NOTE_NAMES[(rootIndex + i) % 12]);
}
