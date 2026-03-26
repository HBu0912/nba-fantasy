import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId") ?? "";
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const json = await res.json();

    // Extract player stats per team
    const playerTeams: any[] = json.boxscore?.players ?? [];
    const playerStats = playerTeams.map((teamData: any) => {
      const teamAbbr = teamData.team?.abbreviation ?? "";
      const groups: any[] = teamData.statistics ?? [];
      const players: any[] = [];
      for (const grp of groups) {
        const names: string[] = grp.names ?? grp.labels ?? [];
        for (const athlete of grp.athletes ?? []) {
          const stats: string[] = athlete.stats ?? [];
          const row: Record<string, string> = {};
          names.forEach((n, i) => { row[n] = stats[i] ?? ""; });
          players.push({
            id:      String(athlete.athlete?.id ?? ""),
            name:    athlete.athlete?.displayName ?? "",
            pos:     athlete.athlete?.position?.abbreviation ?? "",
            starter: athlete.starter ?? false,
            active:  athlete.active !== false,
            stats:   row,
          });
        }
      }
      return { abbr: teamAbbr, players };
    });

    return NextResponse.json({ playerStats });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
