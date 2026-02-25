"use client";
import Nav from "../components/Nav";
import { useState } from "react";
import { useScoring } from "../ScoringContext";
import PlayerHoverCard from "../components/PlayerHoverCard";

const NBA_PLAYERS = [
  { id: 1, name: "LeBron James", team: "LAL", pos: "SF", pts: 23.2, reb: 8.4, ast: 9.0, stl: 1.1, blk: 0.5, tov: 3.5, fgm: 8.4, fga: 15.5, tpm: 1.5, ftm: 4.9, fta: 6.5 },
  { id: 2, name: "Stephen Curry", team: "GSW", pos: "PG", pts: 22.5, reb: 3.8, ast: 6.1, stl: 1.2, blk: 0.3, tov: 3.1, fgm: 8.1, fga: 17.0, tpm: 4.8, ftm: 3.9, fta: 4.3 },
  { id: 3, name: "Kevin Durant", team: "PHX", pos: "SF", pts: 26.9, reb: 6.9, ast: 4.0, stl: 0.9, blk: 1.0, tov: 3.3, fgm: 10.2, fga: 18.6, tpm: 1.8, ftm: 6.1, fta: 7.0 },
  { id: 4, name: "Giannis Antetokounmpo", team: "MIL", pos: "PF", pts: 32.7, reb: 11.5, ast: 5.8, stl: 1.2, blk: 1.1, tov: 3.8, fgm: 12.4, fga: 20.1, tpm: 0.5, ftm: 7.3, fta: 11.2 },
  { id: 5, name: "Nikola Jokic", team: "DEN", pos: "C", pts: 29.6, reb: 12.7, ast: 10.2, stl: 1.8, blk: 0.8, tov: 3.6, fgm: 11.3, fga: 18.4, tpm: 0.6, ftm: 6.4, fta: 7.8 },
  { id: 6, name: "Luka Doncic", team: "DAL", pos: "PG", pts: 28.6, reb: 9.2, ast: 8.0, stl: 1.4, blk: 0.5, tov: 4.0, fgm: 10.1, fga: 21.2, tpm: 3.2, ftm: 7.8, fta: 9.5 },
  { id: 7, name: "Joel Embiid", team: "PHI", pos: "C", pts: 24.7, reb: 8.4, ast: 4.4, stl: 0.8, blk: 1.4, tov: 3.2, fgm: 9.1, fga: 17.0, tpm: 0.4, ftm: 7.5, fta: 9.8 },
  { id: 8, name: "Jayson Tatum", team: "BOS", pos: "SF", pts: 26.0, reb: 8.5, ast: 5.3, stl: 1.1, blk: 0.5, tov: 2.9, fgm: 9.5, fga: 20.4, tpm: 3.1, ftm: 5.4, fta: 6.6 },
  { id: 9, name: "Devin Booker", team: "PHX", pos: "SG", pts: 25.8, reb: 4.4, ast: 6.5, stl: 1.1, blk: 0.3, tov: 3.0, fgm: 9.3, fga: 19.1, tpm: 2.6, ftm: 6.3, fta: 7.4 },
  { id: 10, name: "Anthony Edwards", team: "MIN", pos: "SG", pts: 25.6, reb: 5.3, ast: 5.0, stl: 1.3, blk: 0.5, tov: 2.8, fgm: 9.2, fga: 20.3, tpm: 3.4, ftm: 4.8, fta: 5.9 },
  { id: 11, name: "Shai Gilgeous-Alexander", team: "OKC", pos: "PG", pts: 32.7, reb: 5.5, ast: 6.4, stl: 2.1, blk: 1.0, tov: 2.5, fgm: 11.5, fga: 20.8, tpm: 1.9, ftm: 9.8, fta: 11.4 },
  { id: 12, name: "Damian Lillard", team: "MIL", pos: "PG", pts: 24.3, reb: 4.4, ast: 7.1, stl: 0.9, blk: 0.3, tov: 2.9, fgm: 8.2, fga: 18.9, tpm: 4.1, ftm: 5.8, fta: 6.7 },
  { id: 13, name: "Donovan Mitchell", team: "CLE", pos: "SG", pts: 24.5, reb: 4.5, ast: 6.1, stl: 1.5, blk: 0.3, tov: 2.7, fgm: 8.9, fga: 19.4, tpm: 2.8, ftm: 5.5, fta: 6.8 },
  { id: 14, name: "Kawhi Leonard", team: "LAC", pos: "SF", pts: 23.7, reb: 6.3, ast: 3.6, stl: 1.6, blk: 0.8, tov: 1.9, fgm: 8.8, fga: 17.1, tpm: 1.7, ftm: 5.1, fta: 6.2 },
  { id: 15, name: "Tyrese Haliburton", team: "IND", pos: "PG", pts: 20.1, reb: 3.9, ast: 10.9, stl: 1.5, blk: 0.4, tov: 3.3, fgm: 7.1, fga: 15.8, tpm: 3.2, ftm: 2.6, fta: 3.1 },
  { id: 16, name: "Bam Adebayo", team: "MIA", pos: "C", pts: 19.3, reb: 10.4, ast: 3.6, stl: 1.1, blk: 0.9, tov: 2.4, fgm: 7.8, fga: 13.9, tpm: 0.1, ftm: 3.6, fta: 5.1 },
  { id: 17, name: "Karl-Anthony Towns", team: "NYK", pos: "C", pts: 24.3, reb: 13.2, ast: 3.1, stl: 0.8, blk: 0.9, tov: 2.6, fgm: 9.0, fga: 17.5, tpm: 2.3, ftm: 4.0, fta: 4.9 },
  { id: 18, name: "Trae Young", team: "ATL", pos: "PG", pts: 23.5, reb: 3.2, ast: 11.5, stl: 1.1, blk: 0.1, tov: 4.1, fgm: 7.9, fga: 18.2, tpm: 2.9, ftm: 6.8, fta: 8.3 },
  { id: 19, name: "Zion Williamson", team: "NOP", pos: "PF", pts: 22.9, reb: 5.8, ast: 5.0, stl: 1.1, blk: 0.6, tov: 2.8, fgm: 9.5, fga: 16.5, tpm: 0.2, ftm: 3.7, fta: 5.8 },
  { id: 20, name: "Ja Morant", team: "MEM", pos: "PG", pts: 22.8, reb: 5.8, ast: 9.5, stl: 1.4, blk: 0.5, tov: 3.1, fgm: 8.6, fga: 17.9, tpm: 1.4, ftm: 5.2, fta: 6.8 },
];

type Player = typeof NBA_PLAYERS[0];
type PlayerWithFantasy = Player & { fantasy: number };
type StatKey = "pts" | "reb" | "ast" | "stl" | "blk" | "tov" | "fgm" | "fga" | "tpm" | "ftm" | "fta" | "fantasy";

const DEFAULT_SCORING = {
  pts: 1.0, reb: 1.2, ast: 1.5, stl: 3.0, blk: 3.0, tov: -1.0,
  fgm: 0.0, fga: 0.0, tpm: 0.0, ftm: 0.0, fta: 0.0,
};

const REQUIRED_STATS = ["pts", "reb", "ast", "stl", "blk", "tov"];
const OPTIONAL_STATS = ["fgm", "fga", "tpm", "ftm", "fta"];

const STAT_LABELS: Record<string, string> = {
  pts: "Points", reb: "Rebounds", ast: "Assists",
  stl: "Steals", blk: "Blocks", tov: "Turnovers",
  fgm: "FGM", fga: "FGA", tpm: "3PM", ftm: "FTM", fta: "FTA",
};

const COLUMNS: { key: StatKey; label: string }[] = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tov", label: "TOV" },
  { key: "fgm", label: "FGM" },
  { key: "fga", label: "FGA" },
  { key: "tpm", label: "3PM" },
  { key: "ftm", label: "FTM" },
  { key: "fta", label: "FTA" },
  { key: "fantasy", label: "⭐ Fantasy" },
];

function calcFantasy(player: Player, scoring: typeof DEFAULT_SCORING) {
  return Object.keys(scoring).reduce((total, key) => {
    return total + ((player as any)[key] ?? 0) * (scoring as any)[key];
  }, 0);
}

export default function LeadersPage() {
  const [sortKey, setSortKey] = useState<StatKey>("pts");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [panelOpen, setPanelOpen] = useState(false);
  const { scoring, setScoring } = useScoring();

  const handleSort = (key: StatKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const withFantasy: PlayerWithFantasy[] = NBA_PLAYERS.map(p => ({
    ...p,
    fantasy: parseFloat(calcFantasy(p, scoring).toFixed(1)),
  }));

  const sorted = [...withFantasy].sort((a, b) => {
    return sortDir === "desc"
      ? b[sortKey] - a[sortKey]
      : a[sortKey] - b[sortKey];
  });

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <div className="px-8 py-10 max-w-7xl mx-auto">

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Category Leaders</h1>
            <p className="text-gray-400">Click any stat column to sort. Click a player name for details.</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-900 border border-gray-700 rounded-xl hover:border-orange-500 text-sm font-semibold transition-colors"
            >
              ⭐ Fantasy Scoring
              <span className="text-xs">{panelOpen ? "▲" : "▼"}</span>
            </button>

            {panelOpen && (
              <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 rounded-2xl p-5 z-50 w-80 shadow-2xl">
                <p className="text-xs text-orange-400 uppercase tracking-widest mb-3">Required Stats</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {REQUIRED_STATS.map(key => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 block mb-1">{STAT_LABELS[key]}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={(scoring as any)[key]}
                        onChange={e => setScoring({ ...scoring, [key]: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Optional Stats</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {OPTIONAL_STATS.map(key => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 block mb-1">{STAT_LABELS[key]}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={(scoring as any)[key]}
                        onChange={e => setScoring({ ...scoring, [key]: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setScoring(DEFAULT_SCORING)}
                  className="w-full text-xs text-gray-500 border border-gray-700 rounded-lg py-2 hover:border-orange-500 hover:text-orange-500"
                >
                  Reset to Defaults
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="text-left px-5 py-4 text-gray-400 font-semibold w-8">#</th>
                <th className="text-left px-5 py-4 text-gray-400 font-semibold min-w-48">Player</th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 py-4 text-center font-semibold cursor-pointer select-none transition-colors whitespace-nowrap ${
                      sortKey === col.key
                        ? "text-orange-400 bg-gray-800"
                        : col.key === "fantasy"
                        ? "text-yellow-500 hover:text-yellow-300"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {col.label}
                      {sortKey === col.key ? (
                        <span className="text-xs">{sortDir === "desc" ? "▼" : "▲"}</span>
                      ) : (
                        <span className="text-xs text-gray-700">▼</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, index) => (
                <tr
                  key={player.id}
                  className={`border-b border-gray-800 transition-colors hover:bg-gray-900 ${
                    index === 0 ? "bg-orange-500/5" : ""
                  }`}
                >
                  <td className="px-5 py-4 text-gray-600 font-semibold">{index + 1}</td>
                  <td className="px-5 py-4">
                    <PlayerHoverCard player={player} />
                  </td>
                  {COLUMNS.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-4 text-center font-semibold ${
                        sortKey === col.key
                          ? "text-orange-400 bg-gray-800/50"
                          : col.key === "fantasy"
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      {player[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}