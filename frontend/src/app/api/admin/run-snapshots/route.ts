/**
 * Server-side proxy for POST /api/admin/snapshots/run-monthly.
 * Sends ADMIN_API_KEY from env so the key is never exposed to the client.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { detail: "Admin API key not configured (ADMIN_API_KEY)" },
      { status: 503 }
    );
  }
  let body: { enterprise_id?: number; cohort_id?: number; portfolio_id?: number } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // empty body is ok
  }
  const res = await fetch(`${BACKEND_URL}/api/admin/snapshots/run-monthly`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Admin-Api-Key": adminKey,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
