export type Strum = "down" | "up" | "rest";

export interface StrummingPreset {
  name: string;
  pattern: Strum[];
}

// 8분음표 8스텝(한 마디) 기준 스트러밍 패턴
export const STRUMMING_PRESETS: StrummingPreset[] = [
  {
    name: "다운스트로크 (D D D D)",
    pattern: ["down", "rest", "down", "rest", "down", "rest", "down", "rest"],
  },
  {
    name: "포크 팝 (D DU UDU)",
    pattern: ["down", "rest", "down", "up", "rest", "up", "down", "up"],
  },
  {
    name: "발라드 (D D DU DU)",
    pattern: ["down", "rest", "down", "rest", "down", "up", "down", "up"],
  },
  {
    name: "레게/스카 (업스트로크)",
    pattern: ["rest", "up", "rest", "up", "rest", "up", "rest", "up"],
  },
  {
    name: "온다운업 (전체 8비트)",
    pattern: ["down", "up", "down", "up", "down", "up", "down", "up"],
  },
];

export function nextStrum(current: Strum): Strum {
  if (current === "rest") return "down";
  if (current === "down") return "up";
  return "rest";
}
