import { NOTE_NAMES } from "@/lib/musicTheory";
import { Tuning } from "@/lib/guitarStrings";

const NUM_FRETS = 12;
const FRET_WIDTH = 50;
const LEFT_MARGIN = 34;
const TOP_MARGIN = 16;
const STRING_GAP = 24;
const WIDTH = LEFT_MARGIN + NUM_FRETS * FRET_WIDTH + 16;
const HEIGHT = TOP_MARGIN + 5 * STRING_GAP + 24;

const SINGLE_INLAY_FRETS = [3, 5, 7, 9];
const DOUBLE_INLAY_FRET = 12;

const fretLineX = (f: number) => LEFT_MARGIN + f * FRET_WIDTH;
const noteX = (f: number) => (f === 0 ? LEFT_MARGIN - 16 : LEFT_MARGIN + (f - 0.5) * FRET_WIDTH);
const stringY = (i: number) => TOP_MARGIN + i * STRING_GAP;

interface FretboardProps {
  tuning: Tuning;
  scaleNoteNames: string[];
  root: string;
}

export default function Fretboard({ tuning, scaleNoteNames, root }: FretboardProps) {
  // tuning.midiNotes는 6번(낮은음)~1번(높은음) 순서 — 다이어그램은 6번줄을 위에 그린다
  const strings = tuning.midiNotes;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="text-zinc-900 dark:text-zinc-50"
        style={{ minWidth: WIDTH }}
        role="img"
        aria-label="프렛보드 스케일 다이어그램"
      >
        {/* 프렛 위치 인레이 */}
        {SINGLE_INLAY_FRETS.map((f) => (
          <circle
            key={f}
            cx={noteX(f)}
            cy={stringY(2.5)}
            r={3}
            fill="currentColor"
            opacity={0.15}
          />
        ))}
        <circle cx={noteX(DOUBLE_INLAY_FRET)} cy={stringY(1.5)} r={3} fill="currentColor" opacity={0.15} />
        <circle cx={noteX(DOUBLE_INLAY_FRET)} cy={stringY(3.5)} r={3} fill="currentColor" opacity={0.15} />

        {/* 프렛 라인 */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, f) => (
          <line
            key={f}
            x1={fretLineX(f)}
            y1={stringY(0)}
            x2={fretLineX(f)}
            y2={stringY(5)}
            stroke="currentColor"
            strokeOpacity={f === 0 ? 0.9 : 0.35}
            strokeWidth={f === 0 ? 3 : 1}
          />
        ))}

        {/* 줄 라인 */}
        {strings.map((_, i) => (
          <line
            key={i}
            x1={LEFT_MARGIN}
            y1={stringY(i)}
            x2={fretLineX(NUM_FRETS)}
            y2={stringY(i)}
            stroke="currentColor"
            strokeOpacity={0.4}
            strokeWidth={0.75}
          />
        ))}

        {/* 프렛 번호 */}
        {[...SINGLE_INLAY_FRETS, DOUBLE_INLAY_FRET].map((f) => (
          <text
            key={f}
            x={noteX(f)}
            y={stringY(5) + 12}
            textAnchor="middle"
            fontSize={8}
            fill="currentColor"
            opacity={0.5}
          >
            {f}
          </text>
        ))}

        {/* 스케일 음 표시 */}
        {strings.map((openMidi, stringIndex) =>
          Array.from({ length: NUM_FRETS + 1 }).map((_, fret) => {
            const noteName = NOTE_NAMES[((openMidi + fret) % 12 + 12) % 12];
            if (!scaleNoteNames.includes(noteName)) return null;
            const isRoot = noteName === root;
            return (
              <g key={`${stringIndex}-${fret}`}>
                <circle
                  cx={noteX(fret)}
                  cy={stringY(stringIndex)}
                  r={8}
                  fill={isRoot ? "#f97316" : "currentColor"}
                />
                <text
                  x={noteX(fret)}
                  y={stringY(stringIndex) + 3}
                  textAnchor="middle"
                  fontSize={8}
                  className={isRoot ? "fill-white" : "fill-white dark:fill-black"}
                >
                  {noteName}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
