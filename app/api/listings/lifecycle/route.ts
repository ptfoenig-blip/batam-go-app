import { NextRequest, NextResponse } from "next/server";

export type ModerationStatus = "pending_review" | "approved" | "rejected" | "paused" | "archived" | "deleted";
export type AvailabilityStatus = "Available" | "Negotiation" | "Reserved" | "Sold" | "Expired";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  create: ["pending_review"],
  approve: ["approved"],
  reject: ["rejected"],
  pause: ["paused"],
  renew: ["approved"],
  archive: ["archived"],
  soft_delete: ["deleted"],
  restore: ["approved"],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sellerVerified, title, price, condition, ownershipProof, quantity, availability, expiryDays } = body;

    if (!action || !ALLOWED_TRANSITIONS[action]) {
      return NextResponse.json({ error: "Transisi state tidak valid." }, { status: 400 });
    }

    if (action === "create" || action === "edit") {
      if (!sellerVerified) {
        return NextResponse.json({ error: "Penjual belum terverifikasi (KYC wajib)." }, { status: 403 });
      }
      if (!title || title.trim().length < 5 || Number(price) < 1000) {
        return NextResponse.json({ error: "Judul (min 5 karakter) dan harga (min Rp 1.000) wajib valid." }, { status: 400 });
      }
      if (!condition || !ownershipProof || ownershipProof.trim().length < 3) {
        return NextResponse.json({ error: "Kondisi barang dan bukti penguasaan objek wajib diisi." }, { status: 400 });
      }
      if (Number(quantity || 1) < 1) {
        return NextResponse.json({ error: "Quantity minimal 1 unit." }, { status: 400 });
      }
    }

    const days = Math.min(90, Math.max(7, Number(expiryDays || 30)));
    const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

    return NextResponse.json({
      status: "ok",
      moderationStatus: action === "create" ? "pending_review" : ALLOWED_TRANSITIONS[action],
      availability: availability === "Sold" ? "Sold" : (availability || "Available"),
      expiresAt,
      message: `Lifecycle '${action}' berhasil diproses server.`,
    });
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }
}
