"use client";
import Logo from "./Logo";
import { useState } from "react";
import Link from "next/link";

export default function NBANav() {
  const [playersOpen, setPlayersOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800 bg-gray-950">
      <div className="flex items-center gap-3">
  <Link href="/" className="text-gray-500 hover:text-white text-sm">Home</Link>
  <span className="text-gray-700">/</span>
  <Link href="/nba">
    <Logo size={40} />
  </Link>
</div>

      <div className="flex gap-6 text-gray-300 items-center">
        <Link href="/nba" className="hover:text-white">Home</Link>

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
              <Link href="/players" onClick={() => setPlayersOpen(false)} className="block px-5 py-3 hover:bg-gray-800 text-sm">
                🆚 Player Comparison
              </Link>
              <Link href="/injuries" onClick={() => setPlayersOpen(false)} className="block px-5 py-3 hover:bg-gray-800 text-sm border-t border-gray-800">
                🩹 Injury Tracker
              </Link>
              <Link href="/leaders" onClick={() => setPlayersOpen(false)} className="block px-5 py-3 hover:bg-gray-800 text-sm border-t border-gray-800">
                📊 Category Leaders
              </Link>
              <Link href="/player-charts" onClick={() => setPlayersOpen(false)} className="block px-5 py-3 hover:bg-gray-800 text-sm border-t border-gray-800">
                📈 Player Charts
              </Link>
            </div>
          )}
        </div>

        <Link href="/trade" className="hover:text-white">Trade Analyzer</Link>

        <div className="relative">
          <button
            onClick={() => setTeamOpen(!teamOpen)}
            className="hover:text-white flex items-center gap-1"
          >
            Team
            <span className="text-xs">{teamOpen ? "▲" : "▼"}</span>
          </button>
          {teamOpen && (
            <div className="absolute top-full left-0 mt-3 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden w-44 z-50">
              <Link href="/standings" onClick={() => setTeamOpen(false)} className="block px-5 py-3 hover:bg-gray-800 text-sm">
                🏆 Standings
              </Link>
              <Link href="/schedule" onClick={() => setTeamOpen(false)} className="block px-5 py-3 hover:bg-gray-800 text-sm border-t border-gray-800">
                📅 Schedule
              </Link>
            </div>
          )}
        </div>

        <Link href="#" className="hover:text-white">Leaderboard</Link>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 text-sm text-gray-300 hover:text-white">Log In</button>
        <button className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold">Sign Up</button>
      </div>
    </nav>
  );
}