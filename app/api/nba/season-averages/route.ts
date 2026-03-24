import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const bdlId = request.nextUrl.searchParams.get("bdlId") ?? "";
  const key   = process.env.BALLDONTLIE_API_KEY;

  if (!key || !bdlId) return NextResponse.json({ data: null });

  // Try seasons in order: 2026 (end-year), 2025 (start-year or end-year), 2024 (prev season)
  for (const season of [2026, 2025, 2024]) {
    try {
      const res = await fetch(
        `https://api.balldontlie.io/v1/season_averages?season=${season}&player_ids[]=${bdlId}`,
        { headers: { Authorization: key }, next: { revalidate: 3600 } }
      );
      if (!res.ok) continue;
      const json = await res.json();
      const avg = json.data?.[0];
      if (avg && (avg.pts ?? 0) > 0) {
        return NextResponse.json({ data: avg, season });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ data: null });
}
