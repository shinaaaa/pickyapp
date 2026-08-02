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

// 오픈 코드 표에 없는 루트는 E 셰이프를 옮겨 잡는 무브어블 바레 코드로 생성
function generateBarreShape(root: string, quality: "major" | "minor"): ChordShape | null {
  const barreFret = SEMITONES_FROM_E[root];
  if (barreFret === undefined || barreFret === 0) return null;

  if (quality === "major") {
    return {
      name: `${root} (바레)`,
      frets: [barreFret, barreFret + 2, barreFret + 2, barreFret + 1, barreFret, barreFret],
      fingers: [1, 3, 4, 2, 1, 1],
      barre: { fret: barreFret, fromString: 0, toString: 5 },
      baseFret: barreFret,
    };
  }
  return {
    name: `${root}m (바레)`,
    frets: [barreFret, barreFret + 2, barreFret + 2, barreFret, barreFret, barreFret],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: barreFret, fromString: 0, toString: 5 },
    baseFret: barreFret,
  };
}

export function getChordShape(root: string, quality: "major" | "minor" | "diminished"): ChordShape | null {
  if (quality === "diminished") return null;

  const lookupName = quality === "minor" ? `${root}m` : root;
  const found = CHORDS.find((c) => c.name === lookupName);
  if (found) return found;

  return generateBarreShape(root, quality);
}
