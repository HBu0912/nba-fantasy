import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 3600;

// ESPN category name → our stat key
const STAT_MAP: Record<string, string> = {
  pointsPerGame:               "pts",
  reboundsPerGame:             "reb",
  assistsPerGame:              "ast",
  stealsPerGame:               "stl",
  blocksPerGame:               "blk",
  threePointFieldGoalsPerGame: "tpm",
  turnoversPerGame:            "tov",
  fieldGoalsMadePerGame:       "fgm",
  fieldGoalsAttemptedPerGame:  "fga",
  freeThrowsMadePerGame:       "ftm",
  freeThrowsAttemptedPerGame:  "fta",
};

export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?limit=100",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ players: [] });
    const json = await res.json();

    const map = new Map<string, any>();

    for (const cat of json.categories ?? []) {
      const statKey = STAT_MAP[cat.name];
      if (!statKey) continue;

      for (const leader of cat.leaders ?? []) {
        const athlete = leader.athlete ?? {};
        const team    = leader.team    ?? {};
        const id      = String(athlete.id ?? "");
        if (!id) continue;

        if (!map.has(id)) {
          const gpStat = (leader.statistics ?? []).find((s: any) => s.name === "gamesPlayed");
          const gp = gpStat ? Math.round(Number(gpStat.value) || 0) : 0;
          map.set(id, {
            id:   parseInt(id) || 0,
            name: athlete.displayName ?? athlete.shortName ?? "",
            team: team.abbreviation ?? "",
            pos:  athlete.position?.abbreviation ?? "",
            gp,
            pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
            fgm: 0, fga: 0, tpm: 0, ftm: 0, fta: 0,
          });
        }

        const entry = map.get(id)!;
        entry[statKey] = parseFloat((Number(leader.value) || 0).toFixed(1));
      }
    }

    const players = Array.from(map.values()).filter(p => p.name);
    return NextResponse.json({ players });
  } catch {
    return NextResponse.json({ players: [] });
  }
}
