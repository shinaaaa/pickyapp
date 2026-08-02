// 샘플 파일 없이 오실레이터/노이즈로 합성하는 드럼 사운드

export function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 1;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function playKick(ctx: AudioContext, destination: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(gain).connect(destination);
  osc.start(time);
  osc.stop(time + 0.3);
}

export function playSnare(
  ctx: AudioContext,
  noiseBuffer: AudioBuffer,
  destination: AudioNode,
  time: number
) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1800;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  noise.connect(noiseFilter).connect(noiseGain).connect(destination);
  noise.start(time);
  noise.stop(time + 0.15);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 180;
  oscGain.gain.setValueAtTime(0.5, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(oscGain).connect(destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

export function playHihat(
  ctx: AudioContext,
  noiseBuffer: AudioBuffer,
  destination: AudioNode,
  time: number,
  open = false
) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 7000;
  const gain = ctx.createGain();
  const duration = open ? 0.3 : 0.05;
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  noise.connect(filter).connect(gain).connect(destination);
  noise.start(time);
  noise.stop(time + duration);
}

// 8분음표 8스텝(한 마디) 기준 베이직 팝/락 비트
export const KICK_STEPS = [0, 4];
export const SNARE_STEPS = [2, 6];
export const STEPS_PER_BAR = 8;
