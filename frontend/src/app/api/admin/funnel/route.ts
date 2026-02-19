/** Server-side proxy for GET /api/admin/funnel. */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { detail: "Admin API key not configured (ADMIN_API_KEY)" },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "30";
  const res = await fetch(
    `${BACKEND_URL}/api/admin/funnel?days=${encodeURIComponent(days)}`,
    {
      headers: { "Admin-Api-Key": adminKey },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
