"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tuner", label: "튜너" },
  { href: "/amp", label: "앰프" },
  { href: "/backing-tracks", label: "백킹 트랙" },
  { href: "/metronome", label: "메트로놈" },
  { href: "/strumming", label: "스트러밍" },
  { href: "/chords", label: "코드 다이어그램" },
  { href: "/capo", label: "카포 계산기" },
  { href: "/practice-timer", label: "연습 타이머" },
  { href: "/scales", label: "스케일" },
  { href: "/harmony", label: "화성학" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <Link
        href="/"
        className="mr-2 shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
      >
        기타 연습장
      </Link>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
