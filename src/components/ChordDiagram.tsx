import { ChordShape } from "@/lib/chords";

const WIDTH = 100;
const MARGIN_X = 16;
const TOP_Y = 26;
const FRET_HEIGHT = 20;
const NUM_FRETS = 4;
const HEIGHT = TOP_Y + NUM_FRETS * FRET_HEIGHT + 10;

const stringX = (i: number) => MARGIN_X + (i * (WIDTH - 2 * MARGIN_X)) / 5;
const fretY = (fret: number) => TOP_Y + fret * FRET_HEIGHT;

export default function ChordDiagram({ shape }: { shape: ChordShape }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full text-zinc-900 dark:text-zinc-50"
      role="img"
      aria-label={`${shape.name} 코드 다이어그램`}
    >
      {/* 개방현/뮤트 표시 */}
      {shape.frets.map((fret, i) =>
        fret === null ? (
          <text
            key={i}
            x={stringX(i)}
            y={TOP_Y - 12}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
          >
            ×
          </text>
        ) : fret === 0 ? (
          <circle
            key={i}
            cx={stringX(i)}
            cy={TOP_Y - 14}
            r={4}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
          />
        ) : null
      )}

      {/* 넛(0프렛, 굵은 선) */}
      <rect x={MARGIN_X} y={TOP_Y - 1.5} width={WIDTH - 2 * MARGIN_X} height={3} fill="currentColor" />

      {/* 프렛 라인 */}
      {Array.from({ length: NUM_FRETS + 1 }).map((_, f) => (
        <line
          key={f}
          x1={MARGIN_X}
          y1={fretY(f)}
          x2={WIDTH - MARGIN_X}
          y2={fretY(f)}
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth={0.75}
        />
      ))}

      {/* 줄 라인 */}
      {shape.frets.map((_, i) => (
        <line
          key={i}
          x1={stringX(i)}
          y1={TOP_Y}
          x2={stringX(i)}
          y2={fretY(NUM_FRETS)}
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth={0.75}
        />
      ))}

      {/* 바레 */}
      {shape.barre && (
        <line
          x1={stringX(shape.barre.fromString)}
          y1={fretY(shape.barre.fret - 0.5)}
          x2={stringX(shape.barre.toString)}
          y2={fretY(shape.barre.fret - 0.5)}
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {/* 손가락 위치 (바레가 덮는 줄은 양 끝만 표시) */}
      {shape.frets.map((fret, i) => {
        if (!fret) return null;
        const { barre } = shape;
        const coveredByBarre =
          barre &&
          fret === barre.fret &&
          i > barre.fromString &&
          i < barre.toString;
        if (coveredByBarre) return null;

        const finger = shape.fingers?.[i];
        return (
          <g key={i}>
            <circle cx={stringX(i)} cy={fretY(fret - 0.5)} r={6} fill="currentColor" />
            {finger && (
              <text
                x={stringX(i)}
                y={fretY(fret - 0.5) + 3}
                textAnchor="middle"
                fontSize={7}
                className="fill-white dark:fill-black"
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
