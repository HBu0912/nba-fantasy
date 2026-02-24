"use client";

import Nav from "../components/Nav";

import { useState } from "react";

const INJURY_DATA = [
  {
    id: 1,
    name: "LeBron James",
    team: "LAL",
    pos: "SF",
    injury: "Left Ankle Sprain",
    status: "Day-To-Day",
    updated: "Feb 22, 2025",
    digest: "LeBron is dealing with a mild left ankle sprain suffered in the second quarter against the Suns. Ankle sprains of this grade typically resolve in 5–10 days with rest and treatment. Given his history of managing this type of injury mid-season, expect him to be a game-time decision for the next 1–2 games. Low risk of long-term impact.",
  },
  {
    id: 2,
    name: "Joel Embiid",
    team: "PHI",
    pos: "C",
    injury: "Left Knee Inflammation",
    status: "Out",
    updated: "Feb 20, 2025",
    digest: "Embiid has been ruled out with recurring left knee inflammation, a persistent issue throughout this season. Knee inflammation without structural damage typically requires 2–4 weeks of rest depending on severity. Given his injury history this season, a conservative return timeline of 3 weeks is realistic. Fantasy managers should plan for an extended absence.",
  },
  {
    id: 3,
    name: "Ja Morant",
    team: "MEM",
    pos: "PG",
    injury: "Right Shoulder Soreness",
    status: "Questionable",
    updated: "Feb 23, 2025",
    digest: "Morant is listed as questionable with right shoulder soreness after a hard fall in practice. Shoulder soreness without structural damage typically clears in 3–7 days. He has been a full participant in light practice, which is an encouraging sign. Likely to play through it barring any setback.",
  },
  {
    id: 4,
    name: "Kawhi Leonard",
    team: "LAC",
    pos: "SF",
    injury: "Right Knee Load Management",
    status: "Out",
    updated: "Feb 23, 2025",
    digest: "Leonard is being rested for load management purposes on the second night of a back-to-back. This is a planned absence and not injury-related. He is expected back in the next game. No fantasy concern beyond the immediate missed game.",
  },
  {
    id: 5,
    name: "Zion Williamson",
    team: "NOP",
    pos: "PF",
    injury: "Hamstring Strain",
    status: "Out 2-3 Weeks",
    updated: "Feb 19, 2025",
    digest: "Williamson suffered a grade 1 hamstring strain in the fourth quarter against Memphis. Grade 1 strains typically require 2–4 weeks of rest and rehabilitation. The Pelicans have confirmed the 2–3 week timeline. Fantasy managers should stash him on the IR slot and target his return around mid-March.",
  },
  {
    id: 6,
    name: "Damian Lillard",
    team: "MIL",
    pos: "PG",
    injury: "Achilles Tendon Soreness",
    status: "Questionable",
    updated: "Feb 22, 2025",
    digest: "Lillard is dealing with Achilles tendon soreness that has been monitored throughout the season. Achilles soreness is a cautionary flag — while not structurally serious at this stage, it can escalate if not managed properly. The Bucks are being conservative. Expect him to be a game-time decision with a 50/50 chance of playing.",
  },
  {
    id: 7,
    name: "Anthony Edwards",
    team: "MIN",
    pos: "SG",
    injury: "Ankle Contusion",
    status: "Day-To-Day",
    updated: "Feb 23, 2025",
    digest: "Edwards took a hard hit to his ankle late in the game but X-rays came back negative. Ankle contusions typically resolve within 3–5 days. He was seen moving well in shootaround and is expected to play in the next game barring any swelling.",
  },
  {
    id: 8,
    name: "Karl-Anthony Towns",
    team: "NYK",
    pos: "C",
    injury: "Knee Soreness",
    status: "Day-To-Day",
    updated: "Feb 21, 2025",
    digest: "Towns is managing knee soreness that flared up after a heavy minutes load last week. No structural damage has been reported. With proper rest this should clear within a few days. The Knicks are being cautious given the playoff push. Expect him back within 1–2 games.",
  },
];

type InjuryPlayer = typeof INJURY_DATA[0];

const STATUS_COLORS: Record<string, string> = {
  "Day-To-Day": "bg-yellow-500",
  "Questionable": "bg-orange-500",
  "Out": "bg-red-600",
  "Out 2-3 Weeks": "bg-red-800",
};

export default function InjuriesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InjuryPlayer | null>(null);

  const filtered = INJURY_DATA.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Nav />

      <div className="px-8 py-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2">Injury Tracker</h1>
        <p className="text-gray-400 mb-8">Search for a player to see their latest injury status and AI return timeline estimate.</p>

        {/* Search */}
        <div className="relative max-w-md mb-10">
          <input
            type="text"
            placeholder="Search injured players..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); }}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          {search && !selected && (
            <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-2 z-10 overflow-hidden">
              {filtered.length === 0 && (
                <div className="px-5 py-4 text-gray-500">No injured players found</div>
              )}
              {filtered.map(player => (
                <button
                  key={player.id}
                  onClick={() => { setSelected(player); setSearch(player.name); }}
                  className="w-full text-left px-5 py-3 hover:bg-gray-800 flex justify-between items-center"
                >
                  <span className="font-semibold">{player.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${STATUS_COLORS[player.status]}`}>
                    {player.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!selected && !search && (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-4">🩹</div>
            <p className="text-xl">Search for a player to see their injury report</p>
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
              <span className={`text-sm px-4 py-2 rounded-full text-white font-semibold ${STATUS_COLORS[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            {/* Injury Info */}
            <div className="bg-gray-800 rounded-xl p-5 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Injury</p>
              <p className="text-xl font-bold">{selected.injury}</p>
              <p className="text-xs text-gray-500 mt-2">Last updated: {selected.updated}</p>
            </div>

            {/* AI Digest */}
            <div className="bg-gray-800 rounded-xl p-5 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-500 text-lg">🤖</span>
                <p className="text-xs text-orange-400 uppercase tracking-widest font-semibold">AI Return Timeline Estimate</p>
              </div>
              <p className="text-gray-300 leading-relaxed">{selected.digest}</p>
            </div>

            {/* Reset */}
            <div className="text-center mt-8">
              <button
                onClick={() => { setSelected(null); setSearch(""); }}
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