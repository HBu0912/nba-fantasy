"use client";
import NBANav from "../components/NBANav";
import { useState, useEffect, useRef } from "react";

type Standing = {
  teamId: number;
  abbr: string;
  name: string;
  conference: string;
  confRank: number;
  wins: number;
  losses: number;
  pct: number;
  home: string;
  road: string;
  last10: string;
  streak: string;
  ptsPG: number;
  oppPtsPG: number;
};

type RecentGame = {
  date: string;
  wl: "W" | "L";
  oppAbbr: string;
  oppNbaId: number | null;
  myScore: number;
  oppScore: number;
};

function TeamHoverCard({ team }: { team: Standing }) {
  const [open, setOpen] = useState(false);
  const [games, setGames] = useState<RecentGame[] | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    setOpen(true);
    if (games === null && !loading) {
      setLoading(true);
      fetch(`/api/nba/team-games?abbr=${team.abbr}`)
        .then(r => r.json())
        .then(d => setGames(d.games ?? []))
        .catch(() => setGames([]))
        .finally(() => setLoading(false));
    }
  };

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center gap-3 cursor-pointer"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
    >
      <img
        src={`https://cdn.nba.com/logos/nba/${team.teamId}/global/L/logo.svg`}
        alt={team.abbr}
        className="w-8 h-8 object-contain"
      />
      <span className="font-semibold hover:text-orange-400 transition-colors">{team.name}</span>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-visible" style={{ minWidth: 260 }}>
          {/* Header */}
          <div className="bg-gray-800 p-4 flex items-center gap-3">
            <img
              src={`https://cdn.nba.com/logos/nba/${team.teamId}/global/L/logo.svg`}
              alt={team.abbr}
              className="w-12 h-12 object-contain"
            />
            <div>
              <h3 className="font-extrabold text-base leading-tight">{team.name}</h3>
              <p className="text-gray-400 text-xs">{team.conference}ern Conference</p>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 text-center">Last 5 Games</p>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Loading…</span>
              </div>
            )}
            {!loading && games !== null && games.length === 0 && (
              <p className="text-xs text-gray-600 text-center">No recent game data</p>
            )}
            {!loading && games && games.length > 0 && (
              <div className="flex justify-center gap-3">
                {games.map((g, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    {g.oppNbaId ? (
                      <img
                        src={`https://cdn.nba.com/logos/nba/${g.oppNbaId}/global/L/logo.svg`}
                        alt={g.oppAbbr}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs text-gray-400">
                        {g.oppAbbr.slice(0, 2)}
                      </div>
                    )}
                    <span className={`text-xs font-bold ${g.wl === "W" ? "text-green-400" : "text-red-400"}`}>
                      {g.wl} {g.myScore}-{g.oppScore}
                    </span>
                    <span className="text-xs text-gray-600">{g.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StandingsPage() {
  const [conference, setConference] = useState<"East" | "West">("East");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/nba/standings")
      .then(r => r.json())
      .then(d => {
        if (!d.standings || d.standings.length === 0) {
          setError(true);
        } else {
          setStandings(d.standings);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const teams = standings.filter(t => t.conference === conference);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NBANav />
      <div className="px-8 py-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Conference Standings</h1>
            <p className="text-gray-400">Live standings. Hover a team for detailed stats and recent results.</p>
          </div>
          <div className="flex bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setConference("East")}
              className={`px-6 py-3 text-sm font-bold transition-colors ${conference === "East" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Eastern
            </button>
            <button
              onClick={() => setConference("West")}
              className={`px-6 py-3 text-sm font-bold transition-colors ${conference === "West" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Western
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-gray-400">Loading standings…</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl mb-2">Standings temporarily unavailable.</p>
            <p className="text-sm">The NBA stats API may be blocked. Please try again later.</p>
          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <>
            <div className="rounded-2xl border border-gray-800 overflow-visible">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-800">
                    <th className="text-left px-5 py-4 text-gray-400 font-semibold w-8">#</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-semibold">Team</th>
                    <th className="text-center px-3 py-4 text-gray-400 font-semibold">W</th>
                    <th className="text-center px-3 py-4 text-gray-400 font-semibold">L</th>
                    <th className="text-center px-3 py-4 text-gray-400 font-semibold">PCT</th>
                    <th className="text-center px-3 py-4 text-gray-400 font-semibold">Home</th>
                    <th className="text-center px-3 py-4 text-gray-400 font-semibold">Away</th>
                    <th className="text-center px-3 py-4 text-gray-400 font-semibold">L10</th>
                    <th className="text-center px-3 py-4 text-gray-400 font-semibold">Streak</th>
                    <th className="text-center px-3 py-4 text-orange-400 font-semibold">PPG</th>
                    <th className="text-center px-3 py-4 text-blue-400 font-semibold">OPP PPG</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => {
                    const isPlayoff = team.confRank <= 6;
                    const isPlayIn  = team.confRank >= 7 && team.confRank <= 10;
                    const rankColor = isPlayoff
                      ? "text-orange-400"
                      : isPlayIn
                      ? "text-yellow-500"
                      : "text-gray-600";

                    return (
                      <tr
                        key={team.teamId}
                        className={`border-b border-gray-800 hover:bg-gray-900/50 transition-colors ${index === 0 ? "bg-orange-500/5" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <span className={`font-bold ${rankColor}`}>{team.confRank}</span>
                        </td>
                        <td className="px-5 py-4">
                          <TeamHoverCard team={team} />
                        </td>
                        <td className="px-3 py-4 text-center font-semibold text-green-400">{team.wins}</td>
                        <td className="px-3 py-4 text-center font-semibold text-red-400">{team.losses}</td>
                        <td className="px-3 py-4 text-center text-gray-300">{team.pct.toFixed(3)}</td>
                        <td className="px-3 py-4 text-center text-gray-300">{team.home}</td>
                        <td className="px-3 py-4 text-center text-gray-300">{team.road}</td>
                        <td className="px-3 py-4 text-center text-gray-300">{team.last10}</td>
                        <td className="px-3 py-4 text-center text-gray-300">{team.streak}</td>
                        <td className="px-3 py-4 text-center text-orange-400 font-semibold">{team.ptsPG}</td>
                        <td className="px-3 py-4 text-center text-blue-400 font-semibold">{team.oppPtsPG}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2"><span className="text-orange-400 font-bold">1–6</span><span>Playoff Berth</span></div>
              <div className="flex items-center gap-2"><span className="text-yellow-500 font-bold">7–10</span><span>Play-In Tournament</span></div>
              <div className="flex items-center gap-2"><span className="text-gray-600 font-bold">11+</span><span>Lottery</span></div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
