// 자기상관(autocorrelation) 기반 피치 검출. 시간 도메인 버퍼에서 기본 주파수를 추정한다.
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;

  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // 신호가 너무 약함 (노이즈/무음)

  // 앞뒤 무음 구간을 잘라내 유효 신호 범위만 사용
  let start = 0;
  let end = SIZE - 1;
  const threshold = 0.2;
  while (start < SIZE / 2 && Math.abs(buffer[start]) < threshold) start++;
  while (end > SIZE / 2 && Math.abs(buffer[end]) < threshold) end--;

  const trimmed = buffer.slice(start, end);
  const n = trimmed.length;
  if (n < 2) return -1;

  const c = new Array<number>(n).fill(0);
  for (let lag = 0; lag < n; lag++) {
    for (let i = 0; i < n - lag; i++) {
      c[lag] += trimmed[i] * trimmed[i + lag];
    }
  }

  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  if (maxPos <= 0) return -1;

  let T0 = maxPos;
  // 포물선 보간으로 정밀도 향상
  const x1 = c[T0 - 1] ?? c[T0];
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? c[T0];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  if (T0 <= 0) return -1;
  return sampleRate / T0;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const A4 = 440;

export interface NoteInfo {
  name: string;
  octave: number;
  frequency: number;
  cents: number;
}

export function frequencyToNote(frequency: number): NoteInfo {
  const noteNum = 12 * (Math.log(frequency / A4) / Math.log(2));
  const rounded = Math.round(noteNum) + 69; // MIDI note number (A4 = 69)
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  const exactFrequency = A4 * Math.pow(2, (rounded - 69) / 12);
  const cents = Math.floor((1200 * Math.log(frequency / exactFrequency)) / Math.log(2));
  return { name, octave, frequency, cents };
}
