"use client";
import { useState } from "react";
import Link from "next/link";

export default function Nav() {
  const [playersOpen, setPlayersOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800 bg-gray-950">
      <Link href="/" className="text-2xl font-bold text-orange-500">🏀 HoopDraft</Link>

      <div className="flex gap-6 text-gray-300 items-center">
        <Link href="/" className="hover:text-white">Home</Link>

        {/* Players Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPlayersOpen(!playersOpen)}
            className="hover:text-white flex items-center gap-1"
          >
            Players
            <span className="text-xs">{playersOpen ? "▲" : "▼"}</span>
          </button>
          {playersOpen && (
            <div className="absolute top-full left-0 mt-3 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden w-52 z-50">
              <Link
                href="/players"
                onClick={() => setPlayersOpen(false)}
                className="block px-5 py-3 hover:bg-gray-800 text-sm"
              >
                🆚 Player Comparison
              </Link>
              <Link
  href="/injuries"
  onClick={() => setPlayersOpen(false)}
  className="block px-5 py-3 hover:bg-gray-800 text-sm border-t border-gray-800"
>
  🩹 Injury Tracker
</Link>
<Link
  href="/leaders"
  onClick={() => setPlayersOpen(false)}
  className="block px-5 py-3 hover:bg-gray-800 text-sm border-t border-gray-800"
>
  📊 Category Leaders
</Link>
            </div>
          )}
        </div>

        <Link href="/trade" className="hover:text-white">Trade Analyzer</Link>
        <Link href="/standings" className="hover:text-white">Standings</Link>
        <Link href="#" className="hover:text-white">Leaderboard</Link>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 text-sm text-gray-300 hover:text-white">Log In</button>
        <button className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold">Sign Up</button>
      </div>
    </nav>
  );
}