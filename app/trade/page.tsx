"use client";
import NBANav from "../components/NBANav";
import { useState } from "react";
import { useScoring, DEFAULT_SCORING } from "../ScoringContext";

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

const STAT_LABELS: Record<string, string> = {
  pts: "Points", reb: "Rebounds", ast: "Assists",
  stl: "Steals", blk: "Blocks", tov: "Turnovers",
  fgm: "FGM", fga: "FGA", tpm: "3PM", ftm: "FTM", fta: "FTA",
};

const REQUIRED_STATS = ["pts", "reb", "ast", "stl", "blk", "tov"];
const OPTIONAL_STATS = ["fgm", "fga", "tpm", "ftm", "fta"];

function calcFantasy(player: Player, scoring: typeof DEFAULT_SCORING) {
  return Object.keys(scoring).reduce((total, key) => {
    return total + (player[key as keyof Player] as number) * scoring[key as keyof typeof scoring];
  }, 0);
}

function PlayerSearch({
  side, players, onAdd,
}: { side: string; players: Player[]; onAdd: (p: Player) => void }) {
  const [search, setSearch] = useState("");
  const filtered = NBA_PLAYERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !players.find(s => s.id === p.id)
  );

  return (
    <div className="relative mb-3">
      <input
        type="text"
        placeholder={`Add player to ${side}...`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        disabled={players.length >= 5}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 disabled:opacity-40"
      />
      {search && (
        <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-1 z-50 overflow-hidden">
          {filtered.length === 0 && <div className="px-4 py-3 text-gray-500 text-sm">No players found</div>}
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onAdd(p); setSearch(""); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-800 flex justify-between items-center text-sm"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-orange-500 text-xs">{p.team} · {p.pos}</span>
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
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
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
            <PlayerSearch side="Team A" players={teamA} onAdd={p => setTeamA([...teamA, p])} />
            <div className="space-y-2 mt-3">
              {teamA.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.team} · {p.pos}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 text-sm font-bold">{calcFantasy(p, scoring).toFixed(1)} pts</span>
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
            <PlayerSearch side="Team B" players={teamB} onAdd={p => setTeamB([...teamB, p])} />
            <div className="space-y-2 mt-3">
              {teamB.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.team} · {p.pos}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 text-sm font-bold">{calcFantasy(p, scoring).toFixed(1)} pts</span>
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