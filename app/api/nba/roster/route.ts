import { NextResponse } from "next/server";

const NBA_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
  Host: "stats.nba.com",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};

export async function GET() {
  try {
    const res = await fetch(
      "https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=2025-26&IsOnlyCurrentSeason=1",
      { headers: NBA_HEADERS, next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ nameToId: {} });

    const raw = await res.json();
    const rs = raw?.resultSets?.[0];
    if (!rs) return NextResponse.json({ nameToId: {} });

    const h: string[] = rs.headers;
    const rows: any[][] = rs.rowSet;
    const col = (name: string) => h.indexOf(name);

    const nameToId: Record<string, number> = {};
    for (const row of rows) {
      const team = row[col("TEAM_ABBREVIATION")];
      if (!team) continue; // skip players not on a current roster
      const name = row[col("DISPLAY_FIRST_LAST")];
      const id   = row[col("PERSON_ID")];
      if (name && id) nameToId[name] = id;
    }

    return NextResponse.json({ nameToId });
  } catch {
    return NextResponse.json({ nameToId: {} });
  }
}
