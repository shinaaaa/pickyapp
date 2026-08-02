import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          기타 연습장
        </h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">
          오디오 인터페이스로 기타 신호를 입력받아 연습할 수 있는 도구 모음입니다.
        </p>
      </div>

      <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        <Link
          href="/tuner"
          className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">튜너</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            실시간으로 음정을 확인하고 조율하세요
          </span>
        </Link>

        <Link
          href="/amp"
          className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">앰프 시뮬레이터</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            클린·크런치·하이게인 톤으로 실시간 연주하세요
          </span>
        </Link>

        <Link
          href="/backing-tracks"
          className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">백킹 트랙</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            템포 조절과 구간 반복으로 연습하세요
          </span>
        </Link>

        <Link
          href="/metronome"
          className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">메트로놈</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            박자를 맞추며 연습하세요
          </span>
        </Link>

        <Link
          href="/chords"
          className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">코드 다이어그램</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            자주 쓰는 코드 운지법을 찾아보세요
          </span>
        </Link>

        <Link
          href="/scales"
          className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">스케일 트레이너</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            프렛보드 위에서 스케일 운지법을 익히세요
          </span>
        </Link>

        <Link
          href="/harmony"
          className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">화성학</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            다이어토닉 코드로 나만의 진행을 만들어보세요
          </span>
        </Link>
      </div>
    </div>
  );
}
