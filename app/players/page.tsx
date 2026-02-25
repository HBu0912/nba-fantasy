"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const NBA_PLAYERS = [
  { id: 1, name: "LeBron James", team: "LAL", pos: "SF", pts: 23.2, reb: 8.4, ast: 9.0, stl: 1.1, blk: 0.5, tov: 3.5, fgm: 8.4, fga: 15.5, tpm: 1.5, ftm: 4.9, fta: 6.5, fg: 54.1 },
  { id: 2, name: "Stephen Curry", team: "GSW", pos: "PG", pts: 22.5, reb: 3.8, ast: 6.1, stl: 1.2, blk: 0.3, tov: 3.1, fgm: 8.1, fga: 17.0, tpm: 4.8, ftm: 3.9, fta: 4.3, fg: 45.0 },
  { id: 3, name: "Kevin Durant", team: "PHX", pos: "SF", pts: 26.9, reb: 6.9, ast: 4.0, stl: 0.9, blk: 1.0, tov: 3.3, fgm: 10.2, fga: 18.6, tpm: 1.8, ftm: 6.1, fta: 7.0, fg: 53.5 },
  { id: 4, name: "Giannis Antetokounmpo", team: "MIL", pos: "PF", pts: 32.7, reb: 11.5, ast: 5.8, stl: 1.2, blk: 1.1, tov: 3.8, fgm: 12.4, fga: 20.1, tpm: 0.5, ftm: 7.3, fta: 11.2, fg: 61.2 },
  { id: 5, name: "Nikola Jokic", team: "DEN", pos: "C", pts: 29.6, reb: 12.7, ast: 10.2, stl: 1.8, blk: 0.8, tov: 3.6, fgm: 11.3, fga: 18.4, tpm: 0.6, ftm: 6.4, fta: 7.8, fg: 57.6 },
  { id: 6, name: "Luka Doncic", team: "DAL", pos: "PG", pts: 28.6, reb: 9.2, ast: 8.0, stl: 1.4, blk: 0.5, tov: 4.0, fgm: 10.1, fga: 21.2, tpm: 3.2, ftm: 7.8, fta: 9.5, fg: 47.3 },
  { id: 7, name: "Joel Embiid", team: "PHI", pos: "C", pts: 24.7, reb: 8.4, ast: 4.4, stl: 0.8, blk: 1.4, tov: 3.2, fgm: 9.1, fga: 17.0, tpm: 0.4, ftm: 7.5, fta: 9.8, fg: 52.4 },
  { id: 8, name: "Jayson Tatum", team: "BOS", pos: "SF", pts: 26.0, reb: 8.5, ast: 5.3, stl: 1.1, blk: 0.5, tov: 2.9, fgm: 9.5, fga: 20.4, tpm: 3.1, ftm: 5.4, fta: 6.6, fg: 45.2 },
  { id: 9, name: "Devin Booker", team: "PHX", pos: "SG", pts: 25.8, reb: 4.4, ast: 6.5, stl: 1.1, blk: 0.3, tov: 3.0, fgm: 9.3, fga: 19.1, tpm: 2.6, ftm: 6.3, fta: 7.4, fg: 49.5 },
  { id: 10, name: "Anthony Edwards", team: "MIN", pos: "SG", pts: 25.6, reb: 5.3, ast: 5.0, stl: 1.3, blk: 0.5, tov: 2.8, fgm: 9.2, fga: 20.3, tpm: 3.4, ftm: 4.8, fta: 5.9, fg: 45.9 },
  { id: 11, name: "Shai Gilgeous-Alexander", team: "OKC", pos: "PG", pts: 32.7, reb: 5.5, ast: 6.4, stl: 2.1, blk: 1.0, tov: 2.5, fgm: 11.5, fga: 20.8, tpm: 1.9, ftm: 9.8, fta: 11.4, fg: 53.5 },
  { id: 12, name: "Damian Lillard", team: "MIL", pos: "PG", pts: 24.3, reb: 4.4, ast: 7.1, stl: 0.9, blk: 0.3, tov: 2.9, fgm: 8.2, fga: 18.9, tpm: 4.1, ftm: 5.8, fta: 6.7, fg: 43.2 },
  { id: 13, name: "Donovan Mitchell", team: "CLE", pos: "SG", pts: 24.5, reb: 4.5, ast: 6.1, stl: 1.5, blk: 0.3, tov: 2.7, fgm: 8.9, fga: 19.4, tpm: 2.8, ftm: 5.5, fta: 6.8, fg: 46.8 },
  { id: 14, name: "Kawhi Leonard", team: "LAC", pos: "SF", pts: 23.7, reb: 6.3, ast: 3.6, stl: 1.6, blk: 0.8, tov: 1.9, fgm: 8.8, fga: 17.1, tpm: 1.7, ftm: 5.1, fta: 6.2, fg: 52.1 },
  { id: 15, name: "Tyrese Haliburton", team: "IND", pos: "PG", pts: 20.1, reb: 3.9, ast: 10.9, stl: 1.5, blk: 0.4, tov: 3.3, fgm: 7.1, fga: 15.8, tpm: 3.2, ftm: 2.6, fta: 3.1, fg: 47.4 },
  { id: 16, name: "Bam Adebayo", team: "MIA", pos: "C", pts: 19.3, reb: 10.4, ast: 3.6, stl: 1.1, blk: 0.9, tov: 2.4, fgm: 7.8, fga: 13.9, tpm: 0.1, ftm: 3.6, fta: 5.1, fg: 55.2 },
  { id: 17, name: "Karl-Anthony Towns", team: "NYK", pos: "C", pts: 24.3, reb: 13.2, ast: 3.1, stl: 0.8, blk: 0.9, tov: 2.6, fgm: 9.0, fga: 17.5, tpm: 2.3, ftm: 4.0, fta: 4.9, fg: 50.5 },
  { id: 18, name: "Trae Young", team: "ATL", pos: "PG", pts: 23.5, reb: 3.2, ast: 11.5, stl: 1.1, blk: 0.1, tov: 4.1, fgm: 7.9, fga: 18.2, tpm: 2.9, ftm: 6.8, fta: 8.3, fg: 43.8 },
  { id: 19, name: "Zion Williamson", team: "NOP", pos: "PF", pts: 22.9, reb: 5.8, ast: 5.0, stl: 1.1, blk: 0.6, tov: 2.8, fgm: 9.5, fga: 16.5, tpm: 0.2, ftm: 3.7, fta: 5.8, fg: 57.8 },
  { id: 20, name: "Ja Morant", team: "MEM", pos: "PG", pts: 22.8, reb: 5.8, ast: 9.5, stl: 1.4, blk: 0.5, tov: 3.1, fgm: 8.6, fga: 17.9, tpm: 1.4, ftm: 5.2, fta: 6.8, fg: 47.0 },
];

type Player = typeof NBA_PLAYERS[0];

const STATS = [
  { key: "pts", label: "Points Per Game", max: 40 },
  { key: "reb", label: "Rebounds Per Game", max: 15 },
  { key: "ast", label: "Assists Per Game", max: 12 },
  { key: "stl", label: "Steals Per Game", max: 3 },
  { key: "blk", label: "Blocks Per Game", max: 3 },
  { key: "fg", label: "Field Goal %", max: 70 },
];

function VSStatRow({ label, valA, valB, max }: { label: string; valA: number; valB: number; max: number }) {
  const aWins = valA >= valB;
  const bWins = valB >= valA;
  const pctA = Math.min((valA / max) * 100, 100);
  const pctB = Math.min((valB / max) * 100, 100);

  return (
    <div className="mb-6">
      <div className="text-center text-sm text-gray-400 mb-2">{label}</div>
      <div className="flex items-center gap-3">
        <span className={`w-10 text-right text-sm font-bold ${aWins ? "text-orange-400" : "text-gray-600"}`}>{valA}</span>
        <div className="flex-1 flex justify-end">
          <div className="w-full bg-gray-800 rounded-full h-3 flex justify-end overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pctA}%`, backgroundColor: aWins ? "#f97316" : "#7c2d12" }} />
          </div>
        </div>
        <div className="w-px h-5 bg-gray-600 shrink-0" />
        <div className="flex-1">
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pctB}%`, backgroundColor: bWins ? "#3b82f6" : "#1e3a5f" }} />
          </div>
        </div>
        <span className={`w-10 text-sm font-bold ${bWins ? "text-blue-400" : "text-gray-600"}`}>{valB}</span>
      </div>
    </div>
  );
}

function PlayersInner() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Player[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const name = searchParams.get("compare");
    if (name) {
      const player = NBA_PLAYERS.find(p => p.name === decodeURIComponent(name));
      if (player) setSelected([player]);
    }
  }, []);

  const filtered = NBA_PLAYERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !selected.find(s => s.id === p.id)
  );

  const addPlayer = (player: Player) => {
    if (selected.length < 2) {
      setSelected([...selected, player]);
      setSearch("");
    }
  };

  const playerA = selected[0];
  const playerB = selected[1];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold text-orange-500">🏀 HoopDraft</a>
        <div className="flex gap-6 text-gray-300">
          <a href="/" className="hover:text-white">Home</a>
          <a href="/players" className="text-white font-semibold">Players</a>
          <a href="#" className="hover:text-white">Leaderboard</a>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm text-gray-300 hover:text-white">Log In</button>
          <button className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold">Sign Up</button>
        </div>
      </nav>

      <div className="px-8 py-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2">Player Comparison</h1>
        <p className="text-gray-400 mb-8">Search for up to 2 players to compare their stats head to head.</p>

        <div className="relative max-w-md mb-10">
          <input
            type="text"
            placeholder="Search NBA players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={selected.length === 2}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
          {search && (
            <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-2 z-10 overflow-hidden">
              {filtered.length === 0 && <div className="px-5 py-4 text-gray-500">No players found</div>}
              {filtered.map(player => (
                <button
                  key={player.id}
                  onClick={() => addPlayer(player)}
                  className="w-full text-left px-5 py-3 hover:bg-gray-800 flex justify-between items-center"
                >
                  <span className="font-semibold">{player.name}</span>
                  <span className="text-orange-500 text-sm">{player.team} · {player.pos}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-4">🏀</div>
            <p className="text-xl">Search and select up to 2 players to compare</p>
          </div>
        )}

        {selected.length === 1 && (
          <div className="bg-gray-900 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-orange-400">{playerA.name}</h2>
              <p className="text-gray-400">{playerA.team} · {playerA.pos}</p>
            </div>
            <div className="text-gray-600 text-lg">Search for a second player to compare</div>
            <button onClick={() => setSelected([])} className="text-gray-600 hover:text-red-400 text-xl">✕</button>
          </div>
        )}

        {selected.length === 2 && (
          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-extrabold text-orange-400">{playerA.name}</h2>
                <p className="text-gray-400">{playerA.team} · {playerA.pos}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-extrabold text-blue-400">{playerB.name}</h2>
                <p className="text-gray-400">{playerB.team} · {playerB.pos}</p>
              </div>
            </div>
            {STATS.map(stat => (
              <VSStatRow
                key={stat.key}
                label={stat.label}
                valA={(playerA as any)[stat.key]}
                valB={(playerB as any)[stat.key]}
                max={stat.max}
              />
            ))}
            <div className="text-center mt-8">
              <button
                onClick={() => setSelected([])}
                className="px-6 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-orange-500 hover:text-orange-500"
              >
                Compare Different Players
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PlayersPage() {
  return (
    <Suspense>
      <PlayersInner />
    </Suspense>
  );
}