import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ESPN_TEAMS: { abbr: string; id: number }[] = [
  {abbr:"ATL",id:1}, {abbr:"BOS",id:2},  {abbr:"BKN",id:17},{abbr:"CHA",id:30},{abbr:"CHI",id:4},
  {abbr:"CLE",id:5}, {abbr:"DAL",id:6},  {abbr:"DEN",id:7}, {abbr:"DET",id:8}, {abbr:"GSW",id:9},
  {abbr:"HOU",id:10},{abbr:"IND",id:11}, {abbr:"LAC",id:12},{abbr:"LAL",id:13},{abbr:"MEM",id:29},
  {abbr:"MIA",id:14},{abbr:"MIL",id:15}, {abbr:"MIN",id:16},{abbr:"NOP",id:3}, {abbr:"NYK",id:18},
  {abbr:"OKC",id:25},{abbr:"ORL",id:19}, {abbr:"PHI",id:20},{abbr:"PHX",id:21},{abbr:"POR",id:22},
  {abbr:"SAC",id:23},{abbr:"SAS",id:24}, {abbr:"TOR",id:28},{abbr:"UTA",id:26},{abbr:"WAS",id:27},
];

export async function GET() {
  try {
    // 1. Fetch all 30 team rosters in parallel to collect ESPN athlete IDs
    const rosterResults = await Promise.all(
      ESPN_TEAMS.map(({ abbr, id }) =>
        fetch(
          `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}/roster`,
          { next: { revalidate: 86400 } }
        )
          .then(r => r.ok ? r.json().then((d: any) => ({ abbr, athletes: d.athletes ?? [] })) : { abbr, athletes: [] })
          .catch(() => ({ abbr, athletes: [] }))
      )
    );

    // 2. Collect athlete metadata
    type AthleteMeta = { id: string; name: string; team: string; pos: string };
    const allAthletes: AthleteMeta[] = [];
    for (const { abbr, athletes } of rosterResults) {
      for (const a of athletes) {
        if (a.id && a.displayName) {
          allAthletes.push({ id: String(a.id), name: a.displayName, team: abbr, pos: a.position?.abbreviation ?? "" });
        }
      }
    }

    // 3. Fetch per-game averages for each athlete in parallel chunks
    const CHUNK = 50;
    const players: any[] = [];

    for (let i = 0; i < allAthletes.length; i += CHUNK) {
      const chunk = allAthletes.slice(i, i + CHUNK);
      const results = await Promise.all(
        chunk.map(({ id, name, team, pos }) =>
          fetch(
            `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}/stats`,
            { next: { revalidate: 3600 } }
          )
            .then(r => r.ok ? r.json() : null)
            .then((json: any) => {
              if (!json) return null;
              const athleteData = json.athletes?.[0];
              if (!athleteData) return null;

              // Find "averages" category from top-level definitions (labels) and athlete data (stats)
              const topCats: any[] = json.categories ?? [];
              const athCats: any[] = athleteData.categories ?? [];
              const topAvg = topCats.find((c: any) => c.name === "averages");
              const athAvg = athCats.find((c: any) => c.name === "averages");
              if (!topAvg || !athAvg) return null;

              const labels: string[] = topAvg.labels ?? [];
              const stats: string[]  = athAvg.stats  ?? [];
              const at = (label: string) => { const i = labels.indexOf(label); return i >= 0 ? (stats[i] ?? "0") : "0"; };
              const num = (v: string) => parseFloat(v) || 0;
              const frc = (v: string): number => parseFloat(v.split("-")[0]) || 0;

              const gp = num(at("GP"));
              if (gp < 10) return null;

              return {
                id:   parseInt(id) || 0,
                name, team, pos, gp,
                pts:  num(at("PTS")),
                reb:  num(at("REB")),
                ast:  num(at("AST")),
                stl:  num(at("STL")),
                blk:  num(at("BLK")),
                tov:  num(at("TO")),
                fgm:  frc(at("FG")),
                fga:  parseFloat((at("FG").split("-")[1]) || "0"),
                tpm:  frc(at("3PT")),
                ftm:  frc(at("FT")),
                fta:  parseFloat((at("FT").split("-")[1]) || "0"),
              };
            })
            .catch(() => null)
        )
      );
      players.push(...results.filter(Boolean));
    }

    return NextResponse.json({ players });
  } catch {
    return NextResponse.json({ players: [] });
  }
}
