"use client";
import NBANav from "../components/NBANav";
import { useState, useEffect } from "react";

type TeamInfo = {
  abbr: string;
  name: string;
  score: number | null;
  nbaId: number | null;
};

type GameEntry = {
  id: number;
  date: string;
  status: string;
  time: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
};

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function convertToLocalTime(timeStr: string): string {
  if (!timeStr) return "";

  let d: Date | null = null;

  // Handle ISO datetime (e.g. "2026-03-25T00:00:00Z")
  if (/^\d{4}-\d{2}-\d{2}T/.test(timeStr)) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) d = parsed;
  }

  // Handle "7:30 pm ET" string
  if (!d) {
    const match = timeStr.match(/(\d+):?(\d*)\s*(am|pm)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const ampm = match[3].toLowerCase();
      if (ampm === "pm" && hours !== 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      // ET = UTC-5 (approximation for NBA season)
      const utcHours = (hours + 5) % 24;
      const now = new Date();
      d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), utcHours, minutes, 0));
    }
  }

  if (!d) return timeStr;

  // Always display in Eastern Time (NBA broadcasts are ET)
  const etStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
  return `${etStr} EST`;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function TeamLogo({ nbaId, abbr }: { nbaId: number | null; abbr: string }) {
  const [err, setErr] = useState(false);
  if (nbaId && !err) {
    return (
      <img
        src={`https://cdn.nba.com/logos/nba/${nbaId}/global/L/logo.svg`}
        alt={abbr}
        className="w-12 h-12 object-contain"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
      {abbr}
    </div>
  );
}

function GameCard({ game, prevDayGames, nextDayGames }: {
  game: GameEntry;
  prevDayGames: GameEntry[];
  nextDayGames: GameEntry[];
}) {
  const isFinished = game.status === "Final" || game.status === "Final/OT";
  const isLive = !isFinished && game.status !== "Scheduled" && game.time === "";

  const homeWon = isFinished && game.homeTeam.score !== null && game.awayTeam.score !== null
    ? game.homeTeam.score > game.awayTeam.score
    : null;

  const playedYesterday = (abbr: string) =>
    prevDayGames.some(g => g.homeTeam.abbr === abbr || g.awayTeam.abbr === abbr);
  const playsTomorrow = (abbr: string) =>
    nextDayGames.some(g => g.homeTeam.abbr === abbr || g.awayTeam.abbr === abbr);
  const getBTB = (abbr: string) => {
    if (playedYesterday(abbr)) return "BTB 2L";
    if (playsTomorrow(abbr)) return "BTB 1L";
    return null;
  };
  const homeBTB = getBTB(game.homeTeam.abbr);
  const awayBTB = getBTB(game.awayTeam.abbr);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      {/* Status */}
      <div className="text-center">
        {isLive ? (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-900/50 text-red-400 border border-red-800">
            LIVE — {game.status}
          </span>
        ) : isFinished ? (
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
            {game.status}
          </span>
        ) : (
          <span className="text-xs text-blue-400 font-semibold">
            {game.time ? convertToLocalTime(game.time) : "TBD"}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamLogo nbaId={game.awayTeam.nbaId} abbr={game.awayTeam.abbr} />
          <span className="text-sm font-bold text-white text-center leading-tight">
            {game.awayTeam.abbr}
          </span>
          {awayBTB && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${awayBTB === "BTB 2L" ? "bg-orange-900/50 text-orange-400" : "bg-blue-900/50 text-blue-400"}`}>
              {awayBTB}
            </span>
          )}
          {isFinished && game.awayTeam.score !== null && (
            <span
              className={`text-2xl font-black ${
                homeWon === false ? "text-white" : "text-gray-500"
              }`}
            >
              {game.awayTeam.score}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-600 text-lg font-bold">@</span>
          {!isFinished && game.awayTeam.score !== null && (
            <div className="flex gap-2 text-sm font-bold text-white">
              <span>{game.awayTeam.score}</span>
              <span className="text-gray-600">-</span>
              <span>{game.homeTeam.score}</span>
            </div>
          )}
        </div>

        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamLogo nbaId={game.homeTeam.nbaId} abbr={game.homeTeam.abbr} />
          <span className="text-sm font-bold text-white text-center leading-tight">
            {game.homeTeam.abbr}
          </span>
          {homeBTB && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${homeBTB === "BTB 2L" ? "bg-orange-900/50 text-orange-400" : "bg-blue-900/50 text-blue-400"}`}>
              {homeBTB}
            </span>
          )}
          {isFinished && game.homeTeam.score !== null && (
            <span
              className={`text-2xl font-black ${
                homeWon === true ? "text-white" : "text-gray-500"
              }`}
            >
              {game.homeTeam.score}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}

export default function SchedulePage() {
  const [date, setDate] = useState(todayStr());
  const [games, setGames] = useState<GameEntry[]>([]);
  const [prevDayGames, setPrevDayGames] = useState<GameEntry[]>([]);
  const [nextDayGames, setNextDayGames] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const prevDate = addDays(date, -1);
    const nextDate = addDays(date, 1);
    Promise.all([
      fetch(`/api/nba/schedule?date=${date}`).then(r => r.json()),
      fetch(`/api/nba/schedule?date=${prevDate}`).then(r => r.json()),
      fetch(`/api/nba/schedule?date=${nextDate}`).then(r => r.json()),
    ])
      .then(([today, prev, next]) => {
        setGames(today.games ?? []);
        setPrevDayGames(prev.games ?? []);
        setNextDayGames(next.games ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [date]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NBANav />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">NBA Schedule</h1>
            <p className="text-gray-400 mt-1 text-sm">{formatDisplayDate(date)}</p>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDate((d) => addDays(d, -1))}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setDate(todayStr())}
              className="px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-semibold transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setDate((d) => addDays(d, 1))}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Next →
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-gray-500">
            Failed to load schedule. Please try again.
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            No games scheduled for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} prevDayGames={prevDayGames} nextDayGames={nextDayGames} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
