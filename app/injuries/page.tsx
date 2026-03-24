"use client";

import NBANav from "../components/NBANav";
import { useState, useEffect, useRef } from "react";

type SearchResult = {
  id: number;
  first_name: string;
  last_name: string;
  team?: { abbreviation: string };
  position?: string;
};

type SelectedPlayer = {
  bdlId: number;
  name: string;
  team: string;
  pos: string;
};

type PlayerStats = {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
};

type InjuryEntry = {
  playerId: string;
  name: string;
  team: string;
  status: string;
  type: string;
  details: string;
  date: string;
};

const STATUS_COLORS: Record<string, string> = {
  "Day-To-Day":  "bg-yellow-500",
  "Questionable":"bg-orange-500",
  "Doubtful":    "bg-red-500",
  "Out":         "bg-red-600",
  "Injured Reserve": "bg-red-800",
  "Healthy":     "bg-green-600",
};

export default function InjuriesPage() {
  const [search, setSearch]           = useState("");
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [selected, setSelected]       = useState<SelectedPlayer | null>(null);
  const [stats, setStats]             = useState<PlayerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [allInjuries, setAllInjuries] = useState<InjuryEntry[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all current injury reports on mount
  useEffect(() => {
    fetch("/api/nba/injuries")
      .then(r => r.json())
      .then(d => setAllInjuries(d.injuries ?? []))
      .catch(() => {});
  }, []);

  // Debounced player search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim() || selected) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/nba/players?search=${encodeURIComponent(search)}`);
        const json = await res.json();
        setResults(json.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search, selected]);

  const selectPlayer = async (r: SearchResult) => {
    const name = `${r.first_name} ${r.last_name}`;
    const player: SelectedPlayer = {
      bdlId: r.id,
      name,
      team: r.team?.abbreviation ?? "—",
      pos: r.position ?? "—",
    };
    setSelected(player);
    setSearch(name);
    setResults([]);
    setStats(null);
    setStatsLoading(true);

    try {
      const res = await fetch(`/api/nba/season-averages?bdlId=${r.id}`);
      const json = await res.json();
      const avg = json.data;
      if (avg && (avg.pts ?? 0) > 0) {
        setStats({
          pts: parseFloat((avg.pts ?? 0).toFixed(1)),
          reb: parseFloat((avg.reb ?? 0).toFixed(1)),
          ast: parseFloat((avg.ast ?? 0).toFixed(1)),
          stl: parseFloat((avg.stl ?? 0).toFixed(1)),
          blk: parseFloat((avg.blk ?? 0).toFixed(1)),
        });
      }
    } catch { /* ignore */ }

    setStatsLoading(false);
  };

  const injuryInfo = selected
    ? allInjuries.find(i => i.name.toLowerCase() === selected.name.toLowerCase()) ?? null
    : null;

  const status  = injuryInfo?.status ?? "Healthy";
  const injury  = injuryInfo?.type   ?? "No active injury report on file.";
  const details = injuryInfo?.details ?? "";
  const updated = injuryInfo?.date
    ? new Date(injuryInfo.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Current";

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NBANav />

      <div className="px-8 py-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2">Injury Tracker</h1>
        <p className="text-gray-400 mb-8">
          Search any current NBA player. Data is pulled from the latest official team injury reports.
          Players not on an injury report are listed as Healthy.
        </p>

        {/* Search */}
        <div className="relative max-w-md mb-10">
          <input
            type="text"
            placeholder="Search any NBA player..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); setStats(null); }}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          {search && !selected && (
            <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-2 z-10 overflow-hidden">
              {searching && (
                <div className="px-5 py-4 text-gray-500">Searching...</div>
              )}
              {!searching && results.length === 0 && (
                <div className="px-5 py-4 text-gray-500">No players found</div>
              )}
              {results.map(r => {
                const name = `${r.first_name} ${r.last_name}`;
                const injData = allInjuries.find(i => i.name.toLowerCase() === name.toLowerCase());
                const badgeStatus = injData?.status ?? "Healthy";
                return (
                  <button
                    key={r.id}
                    onClick={() => selectPlayer(r)}
                    className="w-full text-left px-5 py-3 hover:bg-gray-800 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold">{name}</span>
                      {r.team?.abbreviation && (
                        <span className="text-xs text-gray-500 ml-2">{r.team.abbreviation}</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${STATUS_COLORS[badgeStatus] ?? "bg-green-600"}`}>
                      {badgeStatus}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!selected && !search && (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-4">🩹</div>
            <p className="text-xl">Search for a player to see their injury status</p>
          </div>
        )}

        {/* Injury Card */}
        {selected && (
          <div className="bg-gray-900 rounded-2xl p-8">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-extrabold">{selected.name}</h2>
                <p className="text-gray-400">{selected.team} · {selected.pos}</p>
              </div>
              <span className={`text-sm px-4 py-2 rounded-full text-white font-semibold ${STATUS_COLORS[status] ?? "bg-gray-600"}`}>
                {status}
              </span>
            </div>

            {/* Injury Info */}
            <div className="bg-gray-800 rounded-xl p-5 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Injury / Status</p>
              <p className="text-xl font-bold">{injury}</p>
              {injuryInfo && (
                <p className="text-xs text-gray-500 mt-2">Last updated: {updated}</p>
              )}
            </div>

            {/* Details from injury report */}
            {details ? (
              <div className="bg-gray-800 rounded-xl p-5 border border-orange-500/20 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-500 text-lg">📋</span>
                  <p className="text-xs text-orange-400 uppercase tracking-widest font-semibold">Injury Report Details</p>
                </div>
                <p className="text-gray-300 leading-relaxed">{details}</p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-5 border border-green-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-500 text-lg">✅</span>
                  <p className="text-xs text-green-400 uppercase tracking-widest font-semibold">Status</p>
                </div>
                <p className="text-gray-300">
                  {selected.name} does not appear on any current team injury report and is expected to be available.
                </p>
              </div>
            )}

            {/* Stats Row */}
            {statsLoading && (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Loading stats…</span>
              </div>
            )}
            {!statsLoading && stats && (
              <div className="grid grid-cols-5 gap-3 mb-6">
                {[
                  { label: "PTS", val: stats.pts },
                  { label: "REB", val: stats.reb },
                  { label: "AST", val: stats.ast },
                  { label: "STL", val: stats.stl },
                  { label: "BLK", val: stats.blk },
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-lg font-extrabold text-white">{s.val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reset */}
            <div className="text-center mt-2">
              <button
                onClick={() => { setSelected(null); setSearch(""); setStats(null); }}
                className="px-6 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-orange-500 hover:text-orange-500"
              >
                Search Another Player
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
