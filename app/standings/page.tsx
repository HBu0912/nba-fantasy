"use client";
import NBANav from "../components/NBANav";
import { useState } from "react";
import TeamHoverCard from "../components/TeamHoverCard";
import PlayerHoverCard from "../components/PlayerHoverCard";

const NBA_TEAM_IDS: Record<string, number> = {
  ATL: 1610612737, BOS: 1610612738, BKN: 1610612751,
  CHA: 1610612766, CHI: 1610612741, CLE: 1610612739,
  DAL: 1610612742, DEN: 1610612743, DET: 1610612765,
  GSW: 1610612744, HOU: 1610612745, IND: 1610612754,
  LAC: 1610612746, LAL: 1610612747, MEM: 1610612763,
  MIA: 1610612748, MIL: 1610612749, MIN: 1610612750,
  NOP: 1610612740, NYK: 1610612752, OKC: 1610612760,
  ORL: 1610612753, PHI: 1610612755, PHX: 1610612756,
  POR: 1610612757, SAC: 1610612758, SAS: 1610612759,
  TOR: 1610612761, UTA: 1610612762, WAS: 1610612764,
};

const EAST_TEAMS = [
  { seed: 1, name: "Cleveland Cavaliers", abbr: "CLE", wins: 46, losses: 11, last10: "8-2", homeRecord: "24-4", awayRecord: "22-7", nextGame: "vs BOS — Feb 26", leaders: { pts: { name: "Mitchell", val: 24.5 }, reb: { name: "Mobley", val: 9.2 }, ast: { name: "Garland", val: 6.8 } }, roster: ["Mitchell", "Garland", "Mobley", "Allen", "Strus", "Osman", "Niang"] },
  { seed: 2, name: "Boston Celtics", abbr: "BOS", wins: 42, losses: 16, last10: "6-4", homeRecord: "22-7", awayRecord: "20-9", nextGame: "@ CLE — Feb 26", leaders: { pts: { name: "Tatum", val: 26.0 }, reb: { name: "Tatum", val: 8.5 }, ast: { name: "White", val: 5.3 } }, roster: ["Tatum", "Brown", "White", "Holiday", "Porzingis", "Hauser", "Kornet"] },
  { seed: 3, name: "New York Knicks", abbr: "NYK", wins: 37, losses: 21, last10: "6-4", homeRecord: "20-9", awayRecord: "17-12", nextGame: "vs MIL — Feb 27", leaders: { pts: { name: "Towns", val: 24.3 }, reb: { name: "Towns", val: 13.2 }, ast: { name: "Brunson", val: 7.4 } }, roster: ["Brunson", "Towns", "Hart", "Bridges", "Anunoby", "McBride", "Robinson"] },
  { seed: 4, name: "Milwaukee Bucks", abbr: "MIL", wins: 33, losses: 25, last10: "5-5", homeRecord: "18-11", awayRecord: "15-14", nextGame: "@ NYK — Feb 27", leaders: { pts: { name: "Giannis", val: 32.7 }, reb: { name: "Giannis", val: 11.5 }, ast: { name: "Lillard", val: 7.1 } }, roster: ["Giannis", "Lillard", "Khris", "Brook", "Taurean", "Malik", "Bobby"] },
  { seed: 5, name: "Indiana Pacers", abbr: "IND", wins: 32, losses: 26, last10: "5-5", homeRecord: "18-11", awayRecord: "14-15", nextGame: "vs ATL — Feb 25", leaders: { pts: { name: "Haliburton", val: 20.1 }, reb: { name: "Turner", val: 6.8 }, ast: { name: "Haliburton", val: 10.9 } }, roster: ["Haliburton", "Turner", "Siakam", "Nembhard", "Mathurin", "Toppin", "Sheppard"] },
  { seed: 6, name: "Miami Heat", abbr: "MIA", wins: 28, losses: 30, last10: "4-6", homeRecord: "16-13", awayRecord: "12-17", nextGame: "@ CHI — Feb 25", leaders: { pts: { name: "Adebayo", val: 19.3 }, reb: { name: "Adebayo", val: 10.4 }, ast: { name: "Terry", val: 5.1 } }, roster: ["Adebayo", "Butler", "Terry", "Love", "Highsmith", "Rozier", "Herro"] },
  { seed: 7, name: "Atlanta Hawks", abbr: "ATL", wins: 26, losses: 32, last10: "4-6", homeRecord: "14-15", awayRecord: "12-17", nextGame: "@ IND — Feb 25", leaders: { pts: { name: "Young", val: 23.5 }, reb: { name: "Okongwu", val: 8.1 }, ast: { name: "Young", val: 11.5 } }, roster: ["Young", "Murray", "Okongwu", "Hunter", "Johnson", "Bogdanovic", "Paschall"] },
  { seed: 8, name: "Chicago Bulls", abbr: "CHI", wins: 24, losses: 33, last10: "3-7", homeRecord: "13-15", awayRecord: "11-18", nextGame: "vs MIA — Feb 25", leaders: { pts: { name: "DeRozan", val: 22.1 }, reb: { name: "Vucevic", val: 9.8 }, ast: { name: "Ball", val: 8.2 } }, roster: ["DeRozan", "LaVine", "Vucevic", "Ball", "Patrick", "Drummond", "Caruso"] },
  { seed: 9, name: "Orlando Magic", abbr: "ORL", wins: 24, losses: 34, last10: "3-7", homeRecord: "14-14", awayRecord: "10-20", nextGame: "vs TOR — Feb 26", leaders: { pts: { name: "Banchero", val: 24.6 }, reb: { name: "Wagner", val: 7.3 }, ast: { name: "Suggs", val: 5.9 } }, roster: ["Banchero", "Wagner", "Suggs", "Anthony", "Harris", "Carter", "Fultz"] },
  { seed: 10, name: "Philadelphia 76ers", abbr: "PHI", wins: 21, losses: 36, last10: "3-7", homeRecord: "13-16", awayRecord: "8-20", nextGame: "@ BKN — Feb 26", leaders: { pts: { name: "Embiid", val: 24.7 }, reb: { name: "Embiid", val: 8.4 }, ast: { name: "Maxey", val: 6.1 } }, roster: ["Embiid", "Maxey", "Oubre", "Covington", "Drummond", "Melton", "Tucker"] },
  { seed: 11, name: "Brooklyn Nets", abbr: "BKN", wins: 18, losses: 40, last10: "2-8", homeRecord: "10-19", awayRecord: "8-21", nextGame: "vs PHI — Feb 26", leaders: { pts: { name: "Bridges", val: 19.4 }, reb: { name: "Claxton", val: 8.6 }, ast: { name: "Thomas", val: 7.1 } }, roster: ["Bridges", "Claxton", "Thomas", "Finney-Smith", "Johnson", "Curry", "Watanabe"] },
  { seed: 12, name: "Toronto Raptors", abbr: "TOR", wins: 17, losses: 41, last10: "2-8", homeRecord: "10-19", awayRecord: "7-22", nextGame: "@ ORL — Feb 26", leaders: { pts: { name: "Barrett", val: 21.8 }, reb: { name: "Poeltl", val: 9.1 }, ast: { name: "Barrett", val: 4.9 } }, roster: ["Barrett", "Poeltl", "Quickley", "Shead", "Boucher", "Mogbo", "Springer"] },
  { seed: 13, name: "Charlotte Hornets", abbr: "CHA", wins: 14, losses: 44, last10: "2-8", homeRecord: "9-20", awayRecord: "5-24", nextGame: "vs WAS — Feb 27", leaders: { pts: { name: "LaMelo", val: 23.8 }, reb: { name: "Richards", val: 7.4 }, ast: { name: "LaMelo", val: 8.6 } }, roster: ["LaMelo", "Richards", "Martin", "Plumlee", "Rozier", "Bouknight", "Lewis"] },
  { seed: 14, name: "Washington Wizards", abbr: "WAS", wins: 10, losses: 47, last10: "1-9", homeRecord: "6-22", awayRecord: "4-25", nextGame: "@ CHA — Feb 27", leaders: { pts: { name: "Sarr", val: 14.9 }, reb: { name: "Sarr", val: 7.2 }, ast: { name: "Coulibaly", val: 3.8 } }, roster: ["Sarr", "Coulibaly", "Kispert", "Porziņģis", "Tyus", "Beal", "Avdija"] },
  { seed: 15, name: "Detroit Pistons", abbr: "DET", wins: 16, losses: 42, last10: "3-7", homeRecord: "9-20", awayRecord: "7-22", nextGame: "vs IND — Feb 28", leaders: { pts: { name: "Cunningham", val: 24.4 }, reb: { name: "Stewart", val: 7.9 }, ast: { name: "Cunningham", val: 9.2 } }, roster: ["Cunningham", "Stewart", "Duren", "Ivey", "Bogdanovic", "Bey", "Wiseman"] },
];

const WEST_TEAMS = [
  { seed: 1, name: "Oklahoma City Thunder", abbr: "OKC", wins: 48, losses: 9, last10: "9-1", homeRecord: "25-2", awayRecord: "23-7", nextGame: "vs HOU — Feb 25", leaders: { pts: { name: "SGA", val: 32.7 }, reb: { name: "Holmgren", val: 7.1 }, ast: { name: "SGA", val: 6.4 } }, roster: ["SGA", "Holmgren", "Williams", "Wallace", "Dort", "Wiggins", "Joe"] },
  { seed: 2, name: "Houston Rockets", abbr: "HOU", wins: 38, losses: 20, last10: "7-3", homeRecord: "21-8", awayRecord: "17-12", nextGame: "@ OKC — Feb 25", leaders: { pts: { name: "Green", val: 22.6 }, reb: { name: "Sengun", val: 9.4 }, ast: { name: "Green", val: 8.9 } }, roster: ["Green", "Sengun", "Edwards", "Dillon", "Brooks", "Tari", "Thompson"] },
  { seed: 3, name: "Los Angeles Lakers", abbr: "LAL", wins: 34, losses: 24, last10: "6-4", homeRecord: "18-11", awayRecord: "16-13", nextGame: "vs GSW — Feb 26", leaders: { pts: { name: "LeBron", val: 23.2 }, reb: { name: "LeBron", val: 8.4 }, ast: { name: "LeBron", val: 9.0 } }, roster: ["LeBron", "AD", "Reaves", "Russell", "Hachimura", "Vincent", "Christie"] },
  { seed: 4, name: "Golden State Warriors", abbr: "GSW", wins: 33, losses: 25, last10: "5-5", homeRecord: "18-11", awayRecord: "15-14", nextGame: "@ LAL — Feb 26", leaders: { pts: { name: "Curry", val: 22.5 }, reb: { name: "Draymond", val: 6.2 }, ast: { name: "Curry", val: 6.1 } }, roster: ["Curry", "Thompson", "Draymond", "Wiggins", "Kuminga", "Poole", "Looney"] },
  { seed: 5, name: "Denver Nuggets", abbr: "DEN", wins: 34, losses: 24, last10: "6-4", homeRecord: "19-10", awayRecord: "15-14", nextGame: "vs SAC — Feb 27", leaders: { pts: { name: "Jokic", val: 29.6 }, reb: { name: "Jokic", val: 12.7 }, ast: { name: "Jokic", val: 10.2 } }, roster: ["Jokic", "Murray", "Porter", "Gordon", "KCP", "Braun", "DeAndre"] },
  { seed: 6, name: "Los Angeles Clippers", abbr: "LAC", wins: 30, losses: 28, last10: "4-6", homeRecord: "17-12", awayRecord: "13-16", nextGame: "vs PHX — Feb 26", leaders: { pts: { name: "Leonard", val: 23.7 }, reb: { name: "Zubac", val: 11.2 }, ast: { name: "Harden", val: 8.4 } }, roster: ["Leonard", "Harden", "Zubac", "Powell", "George", "Mann", "Batum"] },
  { seed: 7, name: "Minnesota Timberwolves", abbr: "MIN", wins: 29, losses: 29, last10: "4-6", homeRecord: "16-13", awayRecord: "13-16", nextGame: "@ MEM — Feb 26", leaders: { pts: { name: "Edwards", val: 25.6 }, reb: { name: "Gobert", val: 12.1 }, ast: { name: "Edwards", val: 5.0 } }, roster: ["Edwards", "Gobert", "Towns", "Conley", "McDaniels", "Reid", "Alexander-Walker"] },
  { seed: 8, name: "Memphis Grizzlies", abbr: "MEM", wins: 27, losses: 31, last10: "4-6", homeRecord: "15-14", awayRecord: "12-17", nextGame: "vs MIN — Feb 26", leaders: { pts: { name: "Morant", val: 22.8 }, reb: { name: "Bane", val: 5.9 }, ast: { name: "Morant", val: 9.5 } }, roster: ["Morant", "Bane", "Jackson", "Aldama", "Smart", "Kennard", "Clarke"] },
  { seed: 9, name: "Phoenix Suns", abbr: "PHX", wins: 24, losses: 34, last10: "3-7", homeRecord: "14-15", awayRecord: "10-19", nextGame: "@ LAC — Feb 26", leaders: { pts: { name: "Durant", val: 26.9 }, reb: { name: "Durant", val: 6.9 }, ast: { name: "Booker", val: 6.5 } }, roster: ["Durant", "Booker", "Bradley", "Nurkic", "Biyombo", "Okogie", "Goodwin"] },
  { seed: 10, name: "Dallas Mavericks", abbr: "DAL", wins: 24, losses: 34, last10: "3-7", homeRecord: "14-15", awayRecord: "10-19", nextGame: "vs SAS — Feb 27", leaders: { pts: { name: "Doncic", val: 28.6 }, reb: { name: "Doncic", val: 9.2 }, ast: { name: "Doncic", val: 8.0 } }, roster: ["Doncic", "Irving", "Hardy", "Gafford", "Dinwiddie", "Kleber", "Green"] },
  { seed: 11, name: "Sacramento Kings", abbr: "SAC", wins: 23, losses: 35, last10: "3-7", homeRecord: "13-16", awayRecord: "10-19", nextGame: "@ DEN — Feb 27", leaders: { pts: { name: "Sabonis", val: 20.3 }, reb: { name: "Sabonis", val: 13.8 }, ast: { name: "Fox", val: 6.1 } }, roster: ["Fox", "Sabonis", "Monk", "Murray", "Huerter", "Barnes", "Keegan"] },
  { seed: 12, name: "New Orleans Pelicans", abbr: "NOP", wins: 19, losses: 39, last10: "2-8", homeRecord: "11-18", awayRecord: "8-21", nextGame: "vs UTA — Feb 25", leaders: { pts: { name: "Zion", val: 22.9 }, reb: { name: "Zion", val: 5.8 }, ast: { name: "Zion", val: 5.0 } }, roster: ["Zion", "Ingram", "McCollum", "Valanciunas", "Murphy", "Daniels", "Nance"] },
  { seed: 13, name: "San Antonio Spurs", abbr: "SAS", wins: 18, losses: 40, last10: "2-8", homeRecord: "11-18", awayRecord: "7-22", nextGame: "@ DAL — Feb 27", leaders: { pts: { name: "Wembanyama", val: 24.3 }, reb: { name: "Wembanyama", val: 10.6 }, ast: { name: "Wembanyama", val: 3.9 } }, roster: ["Wembanyama", "Vassell", "Johnson", "Poeltl", "Collins", "Champagnie", "Wesley"] },
  { seed: 14, name: "Utah Jazz", abbr: "UTA", wins: 16, losses: 42, last10: "2-8", homeRecord: "10-19", awayRecord: "6-23", nextGame: "@ NOP — Feb 25", leaders: { pts: { name: "Markkanen", val: 23.2 }, reb: { name: "Markkanen", val: 8.1 }, ast: { name: "Sexton", val: 5.8 } }, roster: ["Markkanen", "Sexton", "Filipowski", "Olynyk", "Kessler", "Sensabaugh", "Fontecchio"] },
  { seed: 15, name: "Portland Trail Blazers", abbr: "POR", wins: 15, losses: 43, last10: "1-9", homeRecord: "9-20", awayRecord: "6-23", nextGame: "vs GSW — Feb 28", leaders: { pts: { name: "Simons", val: 18.7 }, reb: { name: "Ayton", val: 9.3 }, ast: { name: "Simons", val: 5.2 } }, roster: ["Simons", "Ayton", "Camara", "Sharpe", "Thybulle", "Little", "Winslow"] },
];

export default function StandingsPage() {
  const [conference, setConference] = useState<"east" | "west">("east");
  const teams = conference === "east" ? EAST_TEAMS : WEST_TEAMS;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NBANav />
      <div className="px-8 py-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Conference Standings</h1>
            <p className="text-gray-400">Click any team name to see full details.</p>
          </div>
          <div className="flex bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setConference("east")} className={`px-6 py-3 text-sm font-bold transition-colors ${conference === "east" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>Eastern</button>
            <button onClick={() => setConference("west")} className={`px-6 py-3 text-sm font-bold transition-colors ${conference === "west" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>Western</button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-800 overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="text-left px-5 py-4 text-gray-400 font-semibold w-8">#</th>
                <th className="text-left px-5 py-4 text-gray-400 font-semibold">Team</th>
                <th className="text-center px-5 py-4 text-gray-400 font-semibold">W</th>
                <th className="text-center px-5 py-4 text-gray-400 font-semibold">L</th>
                <th className="text-center px-5 py-4 text-gray-400 font-semibold">PCT</th>
                <th className="text-center px-5 py-4 text-orange-400 font-semibold">PTS Leader</th>
                <th className="text-center px-5 py-4 text-blue-400 font-semibold">REBS Leader</th>
                <th className="text-center px-5 py-4 text-green-400 font-semibold">ASTS Leader</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => {
                const pct = (team.wins / (team.wins + team.losses)).toFixed(3);
                const isPlayoff = index < 6;
                const isPlayIn = index >= 6 && index < 10;
                const teamId = NBA_TEAM_IDS[team.abbr];

                return (
                  <tr key={team.abbr} className={`border-b border-gray-800 hover:bg-gray-900 transition-colors ${index === 0 ? "bg-orange-500/5" : ""}`}>
                    <td className="px-5 py-4">
                      <span className={`font-bold ${isPlayoff ? "text-orange-400" : isPlayIn ? "text-yellow-500" : "text-gray-600"}`}>
                        {team.seed}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {teamId && (
                          <img src={`https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`} alt={team.name} className="w-8 h-8 object-contain" />
                        )}
                        <TeamHoverCard team={team} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-green-400">{team.wins}</td>
                    <td className="px-5 py-4 text-center font-semibold text-red-400">{team.losses}</td>
                    <td className="px-5 py-4 text-center text-gray-300">{pct}</td>
                    <td className="px-5 py-4 text-center">
  <span className="text-orange-400 ml-1 text-xs">{team.leaders.pts.val}</span>
  <span className="ml-1 text-white font-semibold">{team.leaders.pts.name}</span>
</td>
<td className="px-5 py-4 text-center">
  <span className="text-blue-400 ml-1 text-xs">{team.leaders.reb.val}</span>
  <span className="ml-1 text-white font-semibold">{team.leaders.reb.name}</span>
</td>
<td className="px-5 py-4 text-center">
  <span className="text-green-400 ml-1 text-xs">{team.leaders.ast.val}</span>
  <span className="ml-1 text-white font-semibold">{team.leaders.ast.name}</span>
</td>
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
          <div className="flex items-center gap-2"><span className="text-gray-600 font-bold">11–15</span><span>Eliminated</span></div>
        </div>
      </div>
    </main>
  );
}