import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "Foto kosong" }, { status: 400 });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const sbUrl = "https://supabase.co";
    const sbKey = "sb_publishable_llzVd0-Do_mq7ahXiiSABA_QSxdSvEu";
    const fileName = `${Date.now()}.jpg`;

    const uploadRes = await fetch(`${sbUrl}/storage/v1/object/ad-images/${fileName}`, {
      method: "POST",
      headers: {
        apikey: sbKey,
        "Content-Type": "image/jpeg",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    const publicUrl = `${sbUrl}/storage/v1/object/public/ad-images/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
