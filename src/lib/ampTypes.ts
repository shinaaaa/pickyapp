export interface AmpType {
  id: string;
  name: string;
  // 드라이브 노브(0~10)를 웨이브셰이퍼 곡선 강도로 변환하는 배율
  driveMultiplier: number;
  cabHighpassHz: number;
  cabLowpassHz: number;
}

export const AMP_TYPES: AmpType[] = [
  { id: "clean", name: "클린", driveMultiplier: 3, cabHighpassHz: 60, cabLowpassHz: 7000 },
  { id: "crunch", name: "크런치", driveMultiplier: 18, cabHighpassHz: 80, cabLowpassHz: 5500 },
  { id: "high-gain", name: "하이게인", driveMultiplier: 55, cabHighpassHz: 100, cabLowpassHz: 4500 },
];

// 소프트 클리핑 왜곡 곡선 — amount가 클수록 더 강하게 찌그러진다
export function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const k = Math.max(amount, 0.0001);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}
