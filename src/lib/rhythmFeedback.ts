export interface RhythmFeedback {
  offsetMs: number;
  label: string;
}

export function classifyOffset(offsetMs: number): string {
  const abs = Math.abs(offsetMs);
  if (abs <= 60) return "정확해요";
  if (abs <= 150) return offsetMs > 0 ? "약간 느려요" : "약간 빨라요";
  return offsetMs > 0 ? "많이 느려요" : "많이 빨라요";
}

// now(초)와 가장 가까운 기준 시각(초) 사이의 오차를 ms로 반환
export function nearestOffsetMs(now: number, times: number[]): number | null {
  if (times.length === 0) return null;
  let nearest = times[0];
  let minDiff = Math.abs(now - nearest);
  for (const t of times) {
    const diff = Math.abs(now - t);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = t;
    }
  }
  return (now - nearest) * 1000;
}
