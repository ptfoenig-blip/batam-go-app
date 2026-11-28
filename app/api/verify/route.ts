import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const otpLimitMap = new Map<string, { attempts: number; resetAt: number }>();

function allowOtpRequest(identifier: string): boolean {
  const now = Date.now();
  const rec = otpLimitMap.get(identifier);
  if (!rec || now > rec.resetAt) {
    otpLimitMap.set(identifier, { attempts: 1, resetAt: now + 5 * 60_000 });
    return true;
  }
  if (rec.attempts >= 3) return false;
  rec.attempts += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, contact, docType, consent } = body;

    if (!contact || typeof contact !== "string" || contact.trim().length < 6) {
      return NextResponse.json({ error: "Nomor HP atau Email tidak valid." }, { status: 400 });
    }

    const normalized = contact.trim().toLowerCase();

    if (action === "request_otp") {
      if (!allowOtpRequest(normalized)) {
        return NextResponse.json({ error: "Batas permintaan OTP tercapai. Coba lagi dalam 5 menit." }, { status: 429 });
      }
      return NextResponse.json({ status: "otp_sent", message: "Kode OTP 6 digit telah dikirim.", demoOtp: "884210" });
    }

    if (action === "submit_kyc") {
      if (!consent) {
        return NextResponse.json({ error: "Persetujuan UU PDP wajib dicentang." }, { status: 400 });
      }
      const identityHash = crypto.createHash("sha256").update(`${normalized}:${docType || "ID"}:BATAMGO`).digest("hex");
      return NextResponse.json({
        status: "Pending",
        identityHash: identityHash.slice(0, 16),
        message: "Pengajuan verifikasi diterima (Status: Pending) untuk ditinjau Admin.",
      });
    }

    return NextResponse.json({ error: "Action tidak dikenali." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
