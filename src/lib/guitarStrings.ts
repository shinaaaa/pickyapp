export interface GuitarString {
  name: string;
  frequency: number;
}

// 표준 튜닝 (E A D G B E), 낮은 줄부터
export const STANDARD_TUNING: GuitarString[] = [
  { name: "E2", frequency: 82.41 },
  { name: "A2", frequency: 110.0 },
  { name: "D3", frequency: 146.83 },
  { name: "G3", frequency: 196.0 },
  { name: "B3", frequency: 246.94 },
  { name: "E4", frequency: 329.63 },
];

export function closestString(frequency: number): GuitarString {
  return STANDARD_TUNING.reduce((closest, s) =>
    Math.abs(Math.log2(s.frequency / frequency)) < Math.abs(Math.log2(closest.frequency / frequency))
      ? s
      : closest
  );
}
