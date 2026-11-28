import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "OK",
    app: "BATAM GO",
    operator: "PT. Mandiri Wahana Makmur",
    environment: process.env.VERCEL_ENV || "development",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
