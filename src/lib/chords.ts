// 프렛 배열은 6번(낮은 E)부터 1번(높은 e) 줄 순서. null = 뮤트(X), 0 = 개방현(O)
export interface ChordShape {
  name: string;
  frets: (number | null)[];
  fingers?: (number | null)[];
  barre?: { fret: number; fromString: number; toString: number };
  // 다이어그램이 넛(1프렛)이 아닌 위치에서 시작할 때 표시할 시작 프렛 번호
  baseFret?: number;
}

export const CHORDS: ChordShape[] = [
  { name: "A", frets: [null, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: "Am", frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { name: "A7", frets: [null, 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  { name: "Asus2", frets: [null, 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },
  { name: "Asus4", frets: [null, 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },

  {
    name: "B",
    frets: [null, 2, 4, 4, 4, 2],
    fingers: [null, 1, 3, 3, 3, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  {
    name: "Bm",
    frets: [null, 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
  },
  { name: "B7", frets: [null, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },

  { name: "C", frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { name: "C7", frets: [null, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  { name: "Cmaj7", frets: [null, 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },

  { name: "D", frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { name: "Dm", frets: [null, null, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  { name: "D7", frets: [null, null, 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  { name: "Dmaj7", frets: [null, null, 0, 2, 2, 2], fingers: [null, null, null, 1, 1, 1] },
  { name: "Dsus2", frets: [null, null, 0, 2, 3, 0], fingers: [null, null, null, 1, 2, null] },
  { name: "Dsus4", frets: [null, null, 0, 2, 3, 3], fingers: [null, null, null, 1, 2, 3] },

  { name: "E", frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  { name: "Esus4", frets: [0, 2, 2, 2, 0, 0], fingers: [null, 2, 3, 4, null, null] },

  {
    name: "F",
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },

  { name: "G", frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  { name: "G7", frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  { name: "Gmaj7", frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, null, null, null, 1] },
];

// 6번줄(낮은 E) 기준, E음까지의 반음 거리 — E 셰이프 바레 코드의 시작 프렛 계산용
const SEMITONES_FROM_E: Record<string, number> = {
  E: 0,
  F: 1,
  "F#": 2,
  G: 3,
  "G#": 4,
  A: 5,
  "A#": 6,
  B: 7,
  C: 8,
  "C#": 9,
  D: 10,
  "D#": 11,
};

type BarreableQuality = "major" | "minor" | "major7" | "minor7" | "dominant7";

// E 셰이프 오픈 코드([0,2,2,1,0,0] 형태) 기준 각 코드 타입의 상대 프렛/손가락
const BARRE_SHAPE: Record<BarreableQuality, { relativeFrets: number[]; fingers: (number | null)[] }> = {
  major: { relativeFrets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] },
  minor: { relativeFrets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] },
  major7: { relativeFrets: [0, 2, 1, 1, 0, 0], fingers: [1, 3, 2, 2, 1, 1] },
  minor7: { relativeFrets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] },
  dominant7: { relativeFrets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] },
};

// 오픈 코드 표에 없는 루트는 E 셰이프를 옮겨 잡는 무브어블 바레 코드로 생성.
// 루트가 E(barreFret===0)면 바레 없이 그대로 개방현 위치의 셰이프가 된다.
function generateBarreShape(root: string, quality: BarreableQuality): ChordShape | null {
  const barreFret = SEMITONES_FROM_E[root];
  if (barreFret === undefined) return null;

  const shape = BARRE_SHAPE[quality];
  const suffix = quality === "major" ? "" : quality === "minor" ? "m" : quality === "major7" ? "maj7" : quality === "minor7" ? "m7" : "7";
  const frets = shape.relativeFrets.map((f) => f + barreFret);

  if (barreFret === 0) {
    return { name: `${root}${suffix}`, frets, fingers: shape.fingers, baseFret: 1 };
  }

  return {
    name: `${root}${suffix} (바레)`,
    frets,
    fingers: shape.fingers,
    barre: { fret: barreFret, fromString: 0, toString: 5 },
    baseFret: barreFret,
  };
}

const QUALITY_SUFFIX: Partial<Record<string, string>> = {
  minor: "m",
  major7: "maj7",
  minor7: "m7",
  dominant7: "7",
};

export function getChordShape(
  root: string,
  quality: "major" | "minor" | "diminished" | "major7" | "minor7" | "dominant7" | "halfDiminished7" | "diminished7"
): ChordShape | null {
  if (quality === "diminished" || quality === "halfDiminished7" || quality === "diminished7") return null;

  const lookupName = `${root}${QUALITY_SUFFIX[quality] ?? ""}`;
  const found = CHORDS.find((c) => c.name === lookupName);
  if (found) return found;

  return generateBarreShape(root, quality);
}
