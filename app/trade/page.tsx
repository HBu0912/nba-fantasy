"use client";
import NBANav from "../components/NBANav";
import { useState, useEffect, useRef } from "react";
import { useScoring, DEFAULT_SCORING } from "../ScoringContext";

type SearchResult = {
  id: number;
  first_name: string;
  last_name: string;
  team?: { abbreviation: string };
  position?: string;
};

type Player = {
  id: number;      // bdlId
  name: string;
  team: string;
  pos: string;
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
  loading: boolean;
};

const STAT_LABELS: Record<string, string> = {
  pts: "Points", reb: "Rebounds", ast: "Assists",
  stl: "Steals", blk: "Blocks", tov: "Turnovers",
  fgm: "FGM", fga: "FGA", tpm: "3PM", ftm: "FTM", fta: "FTA",
  dd: "Double-Double", td: "Triple-Double",
};

const REQUIRED_STATS = ["pts", "reb", "ast", "stl", "blk", "tov"];
const OPTIONAL_STATS = ["fgm", "fga", "tpm", "ftm", "fta", "dd", "td"];

function calcFantasy(player: Player, scoring: typeof DEFAULT_SCORING) {
  return Object.keys(scoring).reduce((total, key) => {
    return total + ((player as any)[key] ?? 0) * (scoring as any)[key];
  }, 0);
}

function PlayerSearch({
  side,
  players,
  onAdd,
}: {
  side: string;
  players: Player[];
  onAdd: (result: SearchResult) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/nba/players?search=${encodeURIComponent(search)}`);
        const json = await res.json();
        const alreadyIds = new Set(players.map(p => p.id));
        setResults((json.data ?? []).filter((p: SearchResult) => !alreadyIds.has(p.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search, players]);

  return (
    <div className="relative mb-3">
      <input
        type="text"
        placeholder={players.length >= 5 ? `${side} is full` : `Add player to ${side}...`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        disabled={players.length >= 5}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 disabled:opacity-40"
      />
      {search && (
        <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-1 z-50 overflow-hidden shadow-2xl">
          {searching && <div className="px-4 py-3 text-gray-500 text-sm">Searching...</div>}
          {!searching && results.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-sm">No players found</div>
          )}
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => { onAdd(r); setSearch(""); setResults([]); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-800 flex justify-between items-center text-sm border-b border-gray-800 last:border-0"
            >
              <span className="font-semibold">{r.first_name} {r.last_name}</span>
              <span className="text-orange-500 text-xs">{r.team?.abbreviation ?? "—"} · {r.position ?? "—"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TradePage() {
  const { scoring, setScoring } = useScoring();
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const addPlayer = async (
    result: SearchResult,
    setTeam: React.Dispatch<React.SetStateAction<Player[]>>
  ) => {
    const name = `${result.first_name} ${result.last_name}`;
    const placeholder: Player = {
      id: result.id,
      name,
      team: result.team?.abbreviation ?? "—",
      pos: result.position ?? "—",
      pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
      fgm: 0, fga: 0, tpm: 0, ftm: 0, fta: 0,
      loading: true,
    };
    setTeam(prev => [...prev, placeholder]);

    try {
      const teamAbbr = result.team?.abbreviation ?? "";
      const glRes = await fetch(
        `/api/nba/gamelog?playerName=${encodeURIComponent(name)}&teamAbbr=${encodeURIComponent(teamAbbr)}`
      );
      const glJson = await glRes.json();
      const allGames: any[] = glJson.games ?? [];

      const seasonStart = new Date("2025-10-01").getTime();
      const currentGames = allGames.filter(g => {
        const d = new Date(g.date ?? "").getTime();
        return !isNaN(d) && d >= seasonStart;
      });
      const games = currentGames.length > 0 ? currentGames : allGames;

      if (games.length > 0) {
        const avg = (key: string) =>
          parseFloat((games.reduce((s: number, g: any) => s + (g[key] ?? 0), 0) / games.length).toFixed(1));
        setTeam(prev => prev.map(p => p.id === result.id ? {
          ...p,
          pts: avg("pts"), reb: avg("reb"), ast: avg("ast"),
          stl: avg("stl"), blk: avg("blk"), tov: avg("tov"),
          fgm: avg("fgm"), fga: avg("fga"), tpm: avg("tpm"),
          ftm: avg("ftm"), fta: avg("fta"),
          loading: false,
        } : p));
        return;
      }

      // Fallback: season averages
      const saRes = await fetch(`/api/nba/season-averages?bdlId=${result.id}`);
      const saJson = await saRes.json();
      const avg = saJson.data;

      if (avg && (avg.pts ?? 0) > 0) {
        setTeam(prev => prev.map(p => p.id === result.id ? {
          ...p,
          pts:  parseFloat((avg.pts      ?? 0).toFixed(1)),
          reb:  parseFloat((avg.reb      ?? 0).toFixed(1)),
          ast:  parseFloat((avg.ast      ?? 0).toFixed(1)),
          stl:  parseFloat((avg.stl      ?? 0).toFixed(1)),
          blk:  parseFloat((avg.blk      ?? 0).toFixed(1)),
          tov:  parseFloat((avg.turnover ?? 0).toFixed(1)),
          fgm:  parseFloat((avg.fgm      ?? 0).toFixed(1)),
          fga:  parseFloat((avg.fga      ?? 0).toFixed(1)),
          tpm:  parseFloat((avg.fg3m     ?? 0).toFixed(1)),
          ftm:  parseFloat((avg.ftm      ?? 0).toFixed(1)),
          fta:  parseFloat((avg.fta      ?? 0).toFixed(1)),
          loading: false,
        } : p));
        return;
      }
    } catch { /* fall through */ }

    setTeam(prev => prev.map(p => p.id === result.id ? { ...p, loading: false } : p));
  };

  const totalA = teamA.reduce((sum, p) => sum + calcFantasy(p, scoring), 0);
  const totalB = teamB.reduce((sum, p) => sum + calcFantasy(p, scoring), 0);
  const hasPlayers = teamA.length > 0 || teamB.length > 0;
  const aWins = totalA > totalB;
  const bWins = totalB > totalA;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NBANav />

      <div className="px-8 py-10 max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2">Trade Analyzer</h1>
        <p className="text-gray-400 mb-10">Set your league's scoring rules, add players to each side, and see who wins the trade.</p>

        {/* Scoring Settings */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold mb-1">⚙️ Scoring Settings</h2>
          <p className="text-gray-400 text-sm mb-6">Set how many fantasy points each stat is worth. Optional stats default to 0.</p>

          <div className="mb-4">
            <p className="text-xs text-orange-400 uppercase tracking-widest mb-3">Required Stats</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {REQUIRED_STATS.map(key => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{STAT_LABELS[key]}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={scoring[key as keyof typeof scoring]}
                    onChange={e => setScoring({ ...scoring, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Optional Stats</p>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
              {OPTIONAL_STATS.map(key => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{STAT_LABELS[key]}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={scoring[key as keyof typeof scoring]}
                    onChange={e => setScoring({ ...scoring, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Builder */}
        <div className="grid grid-cols-2 gap-6 mb-8">

          {/* Team A */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-orange-400 mb-4">Team A Gives</h2>
            <PlayerSearch
              side="Team A"
              players={teamA}
              onAdd={r => addPlayer(r, setTeamA)}
            />
            <div className="space-y-2 mt-3">
              {teamA.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.team} · {p.pos}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.loading ? (
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-orange-400 text-sm font-bold">{calcFantasy(p, scoring).toFixed(1)} pts</span>
                    )}
                    <button onClick={() => setTeamA(teamA.filter(x => x.id !== p.id))} className="text-gray-600 hover:text-red-400">✕</button>
                  </div>
                </div>
              ))}
              {teamA.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No players added yet</p>}
            </div>
          </div>

          {/* Team B */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-blue-400 mb-4">Team B Gives</h2>
            <PlayerSearch
              side="Team B"
              players={teamB}
              onAdd={r => addPlayer(r, setTeamB)}
            />
            <div className="space-y-2 mt-3">
              {teamB.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.team} · {p.pos}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.loading ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-blue-400 text-sm font-bold">{calcFantasy(p, scoring).toFixed(1)} pts</span>
                    )}
                    <button onClick={() => setTeamB(teamB.filter(x => x.id !== p.id))} className="text-gray-600 hover:text-red-400">✕</button>
                  </div>
                </div>
              ))}
              {teamB.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No players added yet</p>}
            </div>
          </div>
        </div>

        {/* Result */}
        {hasPlayers && (
          <div className="bg-gray-900 rounded-2xl p-8">
            <h2 className="text-lg font-bold text-center mb-6">Trade Result</h2>
            <div className="flex justify-around items-center">

              {/* Team A Total */}
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Team A Receives</p>
                <p className={`text-5xl font-extrabold ${aWins ? "text-orange-400" : "text-gray-600"}`}>
                  {totalA.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs mt-1">fantasy pts</p>
                {aWins && teamB.length > 0 && (
                  <p className="text-orange-400 font-bold mt-2">🏆 Winning Trade</p>
                )}
              </div>

              <div className="text-3xl font-black text-gray-700">VS</div>

              {/* Team B Total */}
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Team B Receives</p>
                <p className={`text-5xl font-extrabold ${bWins ? "text-blue-400" : "text-gray-600"}`}>
                  {totalB.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs mt-1">fantasy pts</p>
                {bWins && teamA.length > 0 && (
                  <p className="text-blue-400 font-bold mt-2">🏆 Winning Trade</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Reset */}
        {hasPlayers && (
          <div className="text-center mt-6">
            <button
              onClick={() => { setTeamA([]); setTeamB([]); }}
              className="px-6 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-orange-500 hover:text-orange-500"
            >
              Reset Trade
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
