import { NextResponse } from "next/server";

const sbUrl = "https://supabase.co";
const sbKey = "sb_publishable_llzVd0-Do_mq7ahXiiSABA_QSxdSvEu";

export async function GET() {
  try {
    const res = await fetch(`${sbUrl}/rest/v1/ads?select=*&order=created_at.desc`, {
      headers: { apikey: sbKey },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${sbUrl}/rest/v1/ads`, {
      method: "POST",
      headers: {
        apikey: sbKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    return NextResponse.json(Array.isArray(data) ? data : data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
