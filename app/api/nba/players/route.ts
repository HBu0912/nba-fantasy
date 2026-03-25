import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const key = process.env.BALLDONTLIE_API_KEY;

  if (!key || search.length < 2) return NextResponse.json({ data: [] });

  try {
    const res = await fetch(
      `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(search)}&per_page=15`,
      { headers: { Authorization: key }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ data: [] });
    const json = await res.json();
    return NextResponse.json({ data: json.data ?? [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
