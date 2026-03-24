import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const key = process.env.BALLDONTLIE_API_KEY;

  if (!key || search.length < 2) return NextResponse.json({ data: [] });

  const term = search.toLowerCase().trim();

  try {
    // Run balldontlie search + NBA roster fetch in parallel
    const [bdlRes, rosterRes] = await Promise.all([
      fetch(
        `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(search)}&per_page=25`,
        { headers: { Authorization: key }, next: { revalidate: 3600 } }
      ),
      fetch(
        "https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=2025-26&IsOnlyCurrentSeason=1",
        { headers: NBA_HEADERS, next: { revalidate: 86400 } }
      ),
    ]);

    const bdlJson = bdlRes.ok ? await bdlRes.json() : { data: [] };
    // Include all players found, not just those with a team (injured players still have teams but
    // balldontlie may not reflect that; filtering by team.abbreviation excludes valid current players)
    const bdlPlayers = (bdlJson.data ?? []) as any[];

    // Build set of IDs already covered by bdl results
    const bdlIds = new Set(bdlPlayers.map((p: any) => p.id));
    const bdlLastNamesLower = new Set(
      bdlPlayers.map((p: any) => (p.last_name ?? "").toLowerCase())
    );

    // Find first-name matches from NBA roster not already in bdl results
    const extraLastNames: string[] = [];
    if (rosterRes.ok) {
      const raw = await rosterRes.json();
      const rs = raw?.resultSets?.[0];
      if (rs) {
        const h: string[] = rs.headers;
        const rows: any[][] = rs.rowSet;
        const nameIdx = h.indexOf("DISPLAY_FIRST_LAST");
        const teamIdx = h.indexOf("TEAM_ABBREVIATION");

        for (const row of rows) {
          if (!row[teamIdx]) continue;
          const fullName: string = (row[nameIdx] ?? "").toLowerCase();
          if (!fullName.includes(term)) continue;

          const parts = fullName.split(" ");
          const lastName = parts.slice(1).join(" ");
          if (!bdlLastNamesLower.has(lastName) && !extraLastNames.includes(lastName)) {
            extraLastNames.push(lastName);
          }
        }
      }
    }

    // Fetch bdl results for first-name matched players (by last name), capped at 5 extra lookups
    const extraPlayers: any[] = [];
    await Promise.all(
      extraLastNames.slice(0, 8).map(async (lastName) => {
        try {
          const r = await fetch(
            `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(lastName)}&per_page=5`,
            { headers: { Authorization: key }, next: { revalidate: 3600 } }
          );
          if (!r.ok) return;
          const j = await r.json();
          const matched = (j.data ?? []).filter(
            (p: any) =>
              (p.last_name ?? "").toLowerCase() === lastName &&
              !bdlIds.has(p.id)
          );
          extraPlayers.push(...matched);
        } catch {}
      })
    );

    // Merge and deduplicate
    const seen = new Set(bdlIds);
    const merged = [...bdlPlayers];
    for (const p of extraPlayers) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
    }

    return NextResponse.json({ data: merged.slice(0, 15) });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
