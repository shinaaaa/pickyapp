// 카플러스-스트롱 현 합성을 AudioWorklet 안에서 샘플 단위로 직접 구현한다.
// 일반 AudioNode 그래프에서 피드백 루프(delay.connect(gain).connect(delay))를 만들면
// Web Audio 스펙상 사이클마다 최소 1 렌더 쿼텀(128샘플)의 지연이 강제로 추가되어
// 344Hz 이상의 음은 정확한 음정을 낼 수 없었다. 이 방식은 노드 그래프의 사이클을 전혀
// 쓰지 않고 워클릿 내부 배열로 직접 딜레이 라인을 구현하므로 그 제약이 적용되지 않는다.
class KarplusStrongProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { frequency, gain, durationSec, startTime, decayTargetSec } = options.processorOptions;

    this.gain = gain;
    this.startTime = startTime;

    const period = sampleRate / frequency; // 분수 샘플 단위의 정확한 주기
    // 1영점 평균 필터(현재+한 샘플 전)가 루프에 약 0.5샘플의 그룹 딜레이를 더하므로
    // 읽기 위치를 그만큼 앞당겨 실제 사운딩 피치가 목표 주파수와 맞도록 보정한다
    this.period = Math.max(period - 0.5, 1);
    this.bufferLength = Math.ceil(period) + 2;
    this.buffer = new Float32Array(this.bufferLength);
    this.writeIndex = 0;

    // decayTargetSec 후 대략 -60dB까지 감쇠하도록 사이클당 곱해지는 값을 역산
    this.decay = Math.pow(0.001, 1 / (frequency * decayTargetSec));

    this.excitationSamplesRemaining = Math.round(period);
    this.totalSamplesRemaining = Math.round(durationSec * sampleRate) + Math.round(0.3 * sampleRate);
  }

  process(_inputs, outputs) {
    const output = outputs[0][0];
    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const now = currentTime + i / sampleRate;
      if (now < this.startTime || this.totalSamplesRemaining <= 0) {
        output[i] = 0;
        continue;
      }

      let excitation = 0;
      if (this.excitationSamplesRemaining > 0) {
        excitation = Math.random() * 2 - 1;
        this.excitationSamplesRemaining--;
      }

      // 분수 딜레이: writeIndex보다 period 샘플만큼 이전 위치를 선형보간으로 읽는다
      const readPos = (this.writeIndex - this.period + this.bufferLength * 2) % this.bufferLength;
      const i0 = Math.floor(readPos);
      const i1 = (i0 + 1) % this.bufferLength;
      const frac = readPos - i0;
      const delayed = this.buffer[i0] * (1 - frac) + this.buffer[i1] * frac;

      // 1샘플 이전 위치도 같은 방식으로 읽어 평균 — 고전적 1영점 감쇠 필터
      const i0prev = (i0 - 1 + this.bufferLength) % this.bufferLength;
      const delayedPrev = this.buffer[i0prev] * (1 - frac) + this.buffer[i0] * frac;
      const damped = 0.5 * (delayed + delayedPrev) * this.decay;

      const newSample = excitation + damped;
      this.buffer[this.writeIndex] = newSample;
      this.writeIndex = (this.writeIndex + 1) % this.bufferLength;

      output[i] = newSample * this.gain;
      this.totalSamplesRemaining--;
    }

    // 재생이 끝난 뒤에도 잠깐은 살려두었다가(정리 타이밍 여유) 이후엔 정리 가능하다고 알려준다
    return this.totalSamplesRemaining > -sampleRate;
  }
}

registerProcessor("karplus-strong-processor", KarplusStrongProcessor);
