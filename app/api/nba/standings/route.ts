import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 3600;

const NBA_TEAM_IDS: Record<string, number> = {
  ATL:1610612737, BOS:1610612738, BKN:1610612751, CHA:1610612766, CHI:1610612741,
  CLE:1610612739, DAL:1610612742, DEN:1610612743, DET:1610612765, GSW:1610612744,
  HOU:1610612745, IND:1610612754, LAC:1610612746, LAL:1610612747, MEM:1610612763,
  MIA:1610612748, MIL:1610612749, MIN:1610612750, NOP:1610612740, NYK:1610612752,
  OKC:1610612760, ORL:1610612753, PHI:1610612755, PHX:1610612756, POR:1610612757,
  SAC:1610612758, SAS:1610612759, TOR:1610612761, UTA:1610612762, WAS:1610612764,
};
const ESPN_TO_STD: Record<string, string> = { GS:"GSW", NY:"NYK", NO:"NOP", SA:"SAS" };
const norm = (a: string) => ESPN_TO_STD[a] ?? a;

export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ standings: [] });
    const json = await res.json();

    const standings: any[] = [];

    for (const conf of json.children ?? []) {
      const confName = (conf.abbreviation ?? conf.name ?? "").toLowerCase().startsWith("e") ? "East" : "West";

      for (const entry of conf.standings?.entries ?? []) {
        const team  = entry.team ?? {};
        const abbr  = norm(team.abbreviation ?? "");
        const stats: any[] = entry.stats   ?? [];
        const recs:  any[] = entry.records ?? [];

        const getStat = (name: string) => stats.find((s: any) => s.name === name || s.shortDisplayName === name);
        const val  = (name: string) => Number(getStat(name)?.value ?? 0);
        const disp = (name: string) => String(getStat(name)?.displayValue ?? "");
        const rec  = (id: string)   => (recs.find((r: any) => r.id === id)?.summary ?? "-");

        standings.push({
          teamId:     NBA_TEAM_IDS[abbr] ?? 0,
          abbr,
          name:       team.displayName ?? "",
          conference: confName,
          confRank:   Math.round(val("playoffSeed")) || 99,
          wins:       Math.round(val("wins")),
          losses:     Math.round(val("losses")),
          pct:        parseFloat(val("winPercent").toFixed(3)),
          home:       rec("1"),
          road:       rec("2"),
          last10:     rec("9"),
          streak:     disp("streak"),
          ptsPG:      parseFloat(val("avgPointsFor").toFixed(1)),
          oppPtsPG:   parseFloat(val("avgPointsAgainst").toFixed(1)),
        });
      }
    }

    standings.sort((a, b) => a.confRank - b.confRank);
    return NextResponse.json({ standings });
  } catch {
    return NextResponse.json({ standings: [] });
  }
}
