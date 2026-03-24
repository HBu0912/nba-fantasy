"use client";
import NBANav from "../components/NBANav";
import { useState, useEffect, useMemo } from "react";
import { useScoring, DEFAULT_SCORING } from "../ScoringContext";
import PlayerHoverCard from "../components/PlayerHoverCard";

type Player = {
  id: number;
  name: string;
  team: string;
  pos: string;
  gp: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  ftm: number;
  fta: number;
  fantasy?: number;
};

type StatKey = "pts" | "reb" | "ast" | "stl" | "blk" | "tov" | "fgm" | "fga" | "tpm" | "ftm" | "fta" | "gp" | "fantasy";

const REQUIRED_STATS = ["pts", "reb", "ast", "stl", "blk", "tov"];
const OPTIONAL_STATS = ["fgm", "fga", "tpm", "ftm", "fta", "dd", "td"];

const STAT_LABELS: Record<string, string> = {
  pts: "Points", reb: "Rebounds", ast: "Assists",
  stl: "Steals", blk: "Blocks", tov: "Turnovers",
  fgm: "FGM", fga: "FGA", tpm: "3PM", ftm: "FTM", fta: "FTA",
  dd: "Double-Double", td: "Triple-Double",
};

const COLUMNS: { key: StatKey; label: string }[] = [
  { key: "gp",      label: "GP" },
  { key: "pts",     label: "PTS" },
  { key: "reb",     label: "REB" },
  { key: "ast",     label: "AST" },
  { key: "stl",     label: "STL" },
  { key: "blk",     label: "BLK" },
  { key: "tov",     label: "TOV" },
  { key: "fgm",     label: "FGM" },
  { key: "fga",     label: "FGA" },
  { key: "tpm",     label: "3PM" },
  { key: "ftm",     label: "FTM" },
  { key: "fta",     label: "FTA" },
  { key: "fantasy", label: "⭐ Fantasy" },
];

function calcFantasy(player: Player, scoring: typeof DEFAULT_SCORING) {
  return Object.keys(scoring).reduce((total, key) => {
    return total + ((player as any)[key] ?? 0) * (scoring as any)[key];
  }, 0);
}

function truncateName(name: string, max = 18): string {
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}

export default function LeadersPage() {
  const [sortKey, setSortKey] = useState<StatKey>("pts");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [panelOpen, setPanelOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { scoring, setScoring } = useScoring();

  // Filters
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [nameSearch, setNameSearch] = useState("");

  useEffect(() => {
    fetch("/api/nba/league-stats")
      .then(r => r.json())
      .then(d => { setPlayers(d.players ?? []); })
      .catch(() => { setPlayers([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: StatKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const teams = useMemo(() =>
    ["ALL", ...Array.from(new Set(players.map(p => p.team))).sort()],
    [players]
  );

  const withFantasy = players.map(p => ({
    ...p,
    fantasy: parseFloat(calcFantasy(p, scoring).toFixed(1)),
  }));

  const filtered = withFantasy.filter(p => {
    if (teamFilter !== "ALL" && p.team !== teamFilter) return false;
    if (nameSearch.trim() && !p.name.toLowerCase().includes(nameSearch.trim().toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    return sortDir === "desc"
      ? (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
      : (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
  });

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NBANav />
      <div className="px-8 py-10 max-w-full mx-auto">

        <div className="flex items-start justify-between mb-6">
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

        {/* Filters */}
        {!loading && players.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-5 items-center">
            <input
              type="text"
              placeholder="Search player..."
              value={nameSearch}
              onChange={e => setNameSearch(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-500 w-44"
            />
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-500"
            >
              {teams.map(t => (
                <option key={t} value={t}>{t === "ALL" ? "All Teams" : t}</option>
              ))}
            </select>
            <span className="text-gray-600 text-sm">{sorted.length} players</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-gray-400">Loading stats…</span>
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl mb-2">Stats temporarily unavailable.</p>
            <p className="text-sm">The NBA stats API may be blocked.</p>
          </div>
        )}

        {!loading && players.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  <th className="text-left px-4 py-4 text-gray-400 font-semibold w-8">#</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-semibold" style={{ minWidth: 160 }}>Player</th>
                  <th className="text-left px-2 py-4 text-gray-400 font-semibold text-xs">POS</th>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{ minWidth: col.key === "fantasy" ? 88 : undefined }}
                      className={`px-3 py-4 text-center font-semibold cursor-pointer select-none transition-colors whitespace-nowrap ${
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
                    <td className="px-4 py-3 text-gray-600 font-semibold">{index + 1}</td>
                    <td className="px-4 py-3" style={{ maxWidth: 160 }}>
                      <div className="truncate" title={player.name}>
                        <PlayerHoverCard
                          player={{ ...player }}
                          nbaId={player.id}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-500">{player.pos || "—"}</td>
                    {COLUMNS.map(col => (
                      <td
                        key={col.key}
                        className={`px-3 py-3 text-center font-semibold whitespace-nowrap ${
                          sortKey === col.key
                            ? "text-orange-400 bg-gray-800/50"
                            : col.key === "fantasy"
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        {(player as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
