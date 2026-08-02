import { Chord } from "@/lib/musicTheory";

export function playChordPad(
  ctx: BaseAudioContext,
  destination: AudioNode,
  chord: Chord,
  time: number,
  durationSec: number,
  peakGain = 0.12
) {
  chord.frequencies.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.05);
    gain.gain.setValueAtTime(peakGain, Math.max(time + 0.05, time + durationSec - 0.1));
    gain.gain.linearRampToValueAtTime(0, time + durationSec);
    osc.connect(gain).connect(destination);
    osc.start(time);
    osc.stop(time + durationSec + 0.05);
  });
}
