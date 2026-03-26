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
  id: string;
  date: string;
  status: string;
  time: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function convertToLocalTime(timeStr: string): string {
  if (!timeStr) return "";
  if (/^\d{4}-\d{2}-\d{2}T/.test(timeStr)) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York",
      }) + " ET";
    }
  }
  return timeStr;
}

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
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

function GameCard({ game, prevDayGames, nextDayGames, onSelect }: {
  game: GameEntry;
  prevDayGames: GameEntry[];
  nextDayGames: GameEntry[];
  onSelect: (g: GameEntry) => void;
}) {
  const isFinished = game.status === "Final" || game.status === "Final/OT";
  const isLive = !isFinished && game.status !== "Scheduled" && game.time === "";

  const homeWon = isFinished && game.homeTeam.score !== null && game.awayTeam.score !== null
    ? game.homeTeam.score > game.awayTeam.score : null;

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
    <div
      className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 ${isFinished ? "cursor-pointer hover:border-gray-600 transition-colors" : ""}`}
      onClick={() => isFinished && onSelect(game)}
    >
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

      {/* Teams — fixed-height rows so both sides always align */}
      <div className="flex items-start justify-between gap-4">

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <TeamLogo nbaId={game.awayTeam.nbaId} abbr={game.awayTeam.abbr} />
          <span className="text-sm font-bold text-white text-center leading-tight">
            {game.awayTeam.abbr}
          </span>
          {/* Fixed-height BTB row — always occupies same space */}
          <div className="h-5 flex items-center justify-center">
            {awayBTB && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${awayBTB === "BTB 2L" ? "bg-orange-900/50 text-orange-400" : "bg-blue-900/50 text-blue-400"}`}>
                {awayBTB}
              </span>
            )}
          </div>
          {/* Fixed-height score row */}
          <div className="h-9 flex items-center justify-center">
            {isFinished && game.awayTeam.score !== null && (
              <span className={`text-2xl font-black ${homeWon === false ? "text-white" : "text-gray-500"}`}>
                {game.awayTeam.score}
              </span>
            )}
          </div>
        </div>

        {/* Center divider */}
        <div className="flex flex-col items-center pt-14 gap-1">
          <span className="text-gray-600 text-lg font-bold">@</span>
          {!isFinished && game.awayTeam.score !== null && (
            <div className="flex gap-2 text-sm font-bold text-white mt-1">
              <span>{game.awayTeam.score}</span>
              <span className="text-gray-600">-</span>
              <span>{game.homeTeam.score}</span>
            </div>
          )}
        </div>

        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <TeamLogo nbaId={game.homeTeam.nbaId} abbr={game.homeTeam.abbr} />
          <span className="text-sm font-bold text-white text-center leading-tight">
            {game.homeTeam.abbr}
          </span>
          <div className="h-5 flex items-center justify-center">
            {homeBTB && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${homeBTB === "BTB 2L" ? "bg-orange-900/50 text-orange-400" : "bg-blue-900/50 text-blue-400"}`}>
                {homeBTB}
              </span>
            )}
          </div>
          <div className="h-9 flex items-center justify-center">
            {isFinished && game.homeTeam.score !== null && (
              <span className={`text-2xl font-black ${homeWon === true ? "text-white" : "text-gray-500"}`}>
                {game.homeTeam.score}
              </span>
            )}
          </div>
        </div>
      </div>

      {isFinished && (
        <p className="text-center text-xs text-gray-600 mt-1">Click for box score</p>
      )}
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

  // Box score popup
  const [selectedGame, setSelectedGame] = useState<GameEntry | null>(null);
  const [popupData, setPopupData] = useState<any | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);

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
      .catch(() => { setError(true); setLoading(false); });
  }, [date]);

  const handleSelectGame = (game: GameEntry) => {
    setSelectedGame(game);
    setPopupData(null);
    setPopupLoading(true);
    fetch(`/api/nba/game-summary?eventId=${game.id}`)
      .then(r => r.json())
      .then(d => setPopupData(d))
      .catch(() => setPopupData(null))
      .finally(() => setPopupLoading(false));
  };

  const closePopup = () => { setSelectedGame(null); setPopupData(null); };

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
          <div className="flex items-center gap-3">
            <button onClick={() => setDate(d => addDays(d, -1))} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">← Prev</button>
            <button onClick={() => setDate(todayStr())} className="px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-semibold transition-colors">Today</button>
            <button onClick={() => setDate(d => addDays(d, 1))} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">Next →</button>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-gray-500">Failed to load schedule. Please try again.</div>
        ) : games.length === 0 ? (
          <div className="text-center py-24 text-gray-500">No games scheduled for this date.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map(game => (
              <GameCard key={game.id} game={game} prevDayGames={prevDayGames} nextDayGames={nextDayGames} onSelect={handleSelectGame} />
            ))}
          </div>
        )}
      </div>

      {/* Box score popup */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={closePopup}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">{selectedGame.awayTeam.abbr}</p>
                  <p className={`text-3xl font-black ${selectedGame.awayTeam.score !== null && selectedGame.homeTeam.score !== null && selectedGame.awayTeam.score < selectedGame.homeTeam.score ? "text-gray-500" : "text-white"}`}>
                    {selectedGame.awayTeam.score ?? "—"}
                  </p>
                </div>
                <span className="text-gray-600 font-bold text-lg">@</span>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">{selectedGame.homeTeam.abbr}</p>
                  <p className={`text-3xl font-black ${selectedGame.homeTeam.score !== null && selectedGame.awayTeam.score !== null && selectedGame.homeTeam.score < selectedGame.awayTeam.score ? "text-gray-500" : "text-white"}`}>
                    {selectedGame.homeTeam.score ?? "—"}
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-1">{selectedGame.status}</span>
              </div>
              <button onClick={closePopup} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-lg font-bold">✕</button>
            </div>

            {/* Body */}
            {popupLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : popupData?.playerStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                {(popupData.playerStats as any[]).map((teamData: any, ti: number) => {
                  const activePlayers = (teamData.players ?? []).filter((p: any) => {
                    if (!p.active) return false;
                    const mins = p.stats?.["MIN"] ?? "";
                    return mins && mins !== "0:00" && mins !== "0";
                  });
                  return (
                    <div key={ti} className="p-4">
                      <h3 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wide">{teamData.abbr}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-800">
                              <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Player</th>
                              <th className="text-center pb-2 px-1 font-semibold">MIN</th>
                              <th className="text-center pb-2 px-1 font-semibold text-orange-400">PTS</th>
                              <th className="text-center pb-2 px-1 font-semibold text-blue-400">REB</th>
                              <th className="text-center pb-2 px-1 font-semibold text-green-400">AST</th>
                              <th className="text-center pb-2 px-1 font-semibold text-yellow-400">STL</th>
                              <th className="text-center pb-2 px-1 font-semibold text-cyan-400">BLK</th>
                              <th className="text-center pb-2 px-1 font-semibold text-red-400">TO</th>
                              <th className="text-center pb-2 px-1 font-semibold">FG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activePlayers.map((p: any) => (
                              <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                                <td className="py-2 pr-3 font-semibold text-white whitespace-nowrap">
                                  {p.name}
                                  {p.starter && <span className="ml-1 text-gray-600 text-xs">★</span>}
                                </td>
                                <td className="py-2 px-1 text-center text-gray-400">{p.stats?.["MIN"] ?? "—"}</td>
                                <td className="py-2 px-1 text-center text-orange-400 font-bold">{p.stats?.["PTS"] ?? "—"}</td>
                                <td className="py-2 px-1 text-center text-blue-400">{p.stats?.["REB"] ?? "—"}</td>
                                <td className="py-2 px-1 text-center text-green-400">{p.stats?.["AST"] ?? "—"}</td>
                                <td className="py-2 px-1 text-center text-yellow-400">{p.stats?.["STL"] ?? "—"}</td>
                                <td className="py-2 px-1 text-center text-cyan-400">{p.stats?.["BLK"] ?? "—"}</td>
                                <td className="py-2 px-1 text-center text-red-400">{p.stats?.["TO"] ?? "—"}</td>
                                <td className="py-2 px-1 text-center text-gray-400">{p.stats?.["FG"] ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No box score data available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
