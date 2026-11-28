"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Category, AdItem, INITIAL_ADS, BATAM_DISTRICTS } from "./data";

interface ChatMsg { sender: "buyer" | "seller"; text: string; time: string; }

export default function BatamGoApp() {
  const [activeTab, setActiveTab] = useState<"home" | "nearby" | "sell" | "ads" | "account">("home");
  const [ads, setAds] = useState<AdItem[]>(INITIAL_ADS);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("semua");
  const [selectedDistrict, setSelectedDistrict] = useState("Semua Batam");
  const [maxRadius, setMaxRadius] = useState(20);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({});
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("Indikasi Penipuan / Minta Transfer DP");
  const [reportNote, setReportNote] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Exclude<Category, "semua">>("properti");
  const [newPrice, setNewPrice] = useState("");
  const [newDistrict, setNewDistrict] = useState("Batam Center");
  const [newDesc, setNewDesc] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("batamgo_ads_v3");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) setAds(p); }
      const c = localStorage.getItem("batamgo_chats_v1");
      if (c) setChats(JSON.parse(c));
    } catch {}
  }, []);

  const fmtRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
  const fmtNum = (s: string) => { const d = s.replace(/\D/g, ""); return d ? Number(d).toLocaleString("id-ID") : ""; };

  const filteredAds = useMemo(() => ads.filter((ad) => {
    if (selectedCategory !== "semua" && ad.category !== selectedCategory) return false;
    if (selectedDistrict !== "Semua Batam" && ad.district !== selectedDistrict) return false;
    if (ad.distanceKm > maxRadius) return false;
    if (minPrice && ad.price < Number(minPrice)) return false;
    if (maxPrice && ad.price > Number(maxPrice)) return false;
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (a.isPriority === b.isPriority ? a.distanceKm - b.distanceKm : a.isPriority ? -1 : 1)), [ads, selectedCategory, selectedDistrict, maxRadius, minPrice, maxPrice, searchQuery]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 4 - previews.length) : [];
    for (const f of files) {
      const dataUrl = await new Promise<string>((res) => {
        const u = URL.createObjectURL(f); const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas"); const sc = Math.min(1, 480 / img.width);
          c.width = img.width * sc; c.height = img.height * sc;
          c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", 0.65));
        };
        img.onerror = () => { URL.revokeObjectURL(u); res(""); };
        img.src = u;
      });
      if (dataUrl) setPreviews((p) => [...p, dataUrl].slice(0, 4));
    }
    e.target.value = "";
  };

  const publishAd = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newPrice.replace(/\D/g, "") || "0");
    if (!newTitle.trim() || price < 1000 || !newDesc.trim()) return;
    const imgs = previews.length ? previews : ["/kost.jpg"];
    const item: AdItem = {
      id: Date.now().toString(), title: newTitle.trim().slice(0, 70), price,
      priceUnit: newCategory === "properti" && newTitle.toLowerCase().includes("kost") ? "/ bln" : undefined,
      category: newCategory, district: newDistrict, distanceKm: 0.5,
      badge: newCategory === "otomotif" ? "FTZ BATAM" : "BARU",
      sellerName: "Penjual Batam", isVerified: true,
      whatsapp: waNumber ? `62${waNumber.replace(/^0/, "")}` : "6281270009999",
      description: newDesc.trim().slice(0, 600), image: imgs.at(0) || "/kost.jpg", images: imgs, views: 1, waClicks: 0,
    };
    const next = [item, ...ads]; setAds(next);
    try { localStorage.setItem("batamgo_ads_v3", JSON.stringify(next)); } catch {}
    setNewTitle(""); setNewPrice(""); setNewDesc(""); setPreviews([]); setActiveTab("home");
  };

  const sendMsg = (txt?: string) => {
    if (!selectedAd) return;
    const t = (txt ?? chatInput).trim(); if (!t) return;
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const next = { ...chats, [selectedAd.id]: [...(chats[selectedAd.id] || []), { sender: "buyer" as const, text: t, time }] };
    setChats(next); if (!txt) setChatInput("");
    try { localStorage.setItem("batamgo_chats_v1", JSON.stringify(next)); } catch {}
  };

  const photos = selectedAd ? (selectedAd.images?.length ? selectedAd.images : [selectedAd.image]) : [];
  const msgs = selectedAd ? chats[selectedAd.id] || [] : [];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center select-none">
      <div className="w-full max-w-md bg-[#F4F6F9] min-h-screen pb-24 relative shadow-xl overflow-x-hidden">
        {selectedAd ? (
          <div className="bg-white min-h-screen pb-28">
            <div className="relative">
              <img src={photos.at(photoIdx) || selectedAd.image} alt={selectedAd.title} className="w-full h-72 object-cover" />
              <button onClick={() => { setSelectedAd(null); setPhotoIdx(0); }} className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-sm font-bold shadow text-gray-800">← Kembali</button>
              <button onClick={() => setShowReport(true)} className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold shadow text-red-600">🚩 Laporkan</button>
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">{photoIdx + 1}/{photos.length} Foto</span>
            </div>
            {photos.length > 1 && <div className="flex gap-2 px-4 pt-3 overflow-x-auto">{photos.map((s, i) => <img key={i} src={s} alt="Thumb" onClick={() => setPhotoIdx(i)} className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 ${photoIdx === i ? "border-[#0194F3]" : "border-transparent opacity-70"}`} />)}</div>}
            <div className="p-4">
              {selectedAd.badge && <span className="inline-block bg-orange-100 text-[#FF5722] text-[11px] font-bold px-2 py-0.5 rounded mb-1">{selectedAd.badge}</span>}
              <div className="text-2xl font-extrabold text-gray-900">{fmtRp(selectedAd.price)} {selectedAd.priceUnit && <span className="text-sm font-normal text-gray-500">{selectedAd.priceUnit}</span>}</div>
              <h1 className="text-lg font-semibold text-gray-800 mt-1">{selectedAd.title}</h1>
              <p className="text-xs text-gray-500 mt-2">📍 {selectedAd.district} • <span className="text-[#0194F3] font-semibold">{selectedAd.distanceKm} km dari Anda</span></p>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0194F3] text-white flex items-center justify-center font-bold">{selectedAd.sellerName.charAt(0)}</div>
                  <div><div className="text-sm font-bold text-gray-800">{selectedAd.sellerName} {selectedAd.isVerified && <span className="text-xs text-[#0194F3]">✔️</span>}</div><div className="text-[11px] text-gray-500">Terverifikasi Keamanan Admin</div></div>
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-[#0194F3] px-2 py-1 rounded-lg">🔒 Privasi Terjaga</span>
              </div>
              <div className="mt-5"><h2 className="text-sm font-bold text-gray-800 mb-1.5">Deskripsi</h2><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line select-text">{selectedAd.description}</p></div>
              <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed"><b>⚠️ Disclaimer Keamanan BATAM GO:</b> Seluruh komunikasi dan transaksi yang dilakukan secara langsung di luar sistem maupun tanpa sepengetahuan admin sepenuhnya menjadi tanggung jawab masing-masing pihak. Hindari transfer uang muka (DP) sebelum cek fisik barang (COD).</div>
            </div>
            <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 p-3 flex gap-2.5 z-30">
              <button onClick={() => setShowReport(true)} className="px-3.5 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-xs">🚩 Laporkan</button>
              <button onClick={() => setShowChat(true)} className="flex-1 py-3 rounded-xl bg-[#0194F3] text-white font-bold text-sm shadow-sm">💬 Hubungi Penjual (Chat)</button>
            </div>
            {showChat && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <div className="bg-white w-full max-w-md rounded-t-2xl flex flex-col max-h-[85vh]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center"><div><h3 className="font-bold text-sm text-gray-800">💬 Chat dengan {selectedAd.sellerName}</h3><p className="text-[11px] text-gray-500 truncate max-w-[240px]">{selectedAd.title}</p></div><button onClick={() => setShowChat(false)} className="text-gray-400 text-sm font-bold px-2">✕</button></div>
                  <div className="bg-amber-50 px-4 py-2 text-[11px] text-amber-800 border-b border-amber-100">🛡️ <b>Tips Aman:</b> Nomor WhatsApp penjual dirahasiakan demi keamanan. Gunakan chat ini & lakukan COD di tempat ramai.</div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-2.5 min-h-[160px] bg-gray-50">
                    {msgs.length === 0 ? <p className="text-center text-xs text-gray-400 my-8">Mulai obrolan dengan penjual di bawah ini...</p> : msgs.map((m, i) => <div key={i} className={`flex flex-col ${m.sender === "buyer" ? "items-end" : "items-start"}`}><div className={`px-3.5 py-2 rounded-2xl text-xs max-w-[80%] ${m.sender === "buyer" ? "bg-[#0194F3] text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"}`}>{m.text}</div><span className="text-[9px] text-gray-400 mt-0.5 px-1">{m.time}</span></div>)}
                  </div>
                  <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto bg-white">
                    <button type="button" onClick={() => sendMsg("Halo, apakah barang ini masih tersedia?")} className="text-[11px] bg-blue-50 text-[#0194F3] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Masih tersedia?</button>
                    <button type="button" onClick={() => sendMsg("Bisa ketemuan / COD di daerah mana ya?")} className="text-[11px] bg-blue-50 text-[#0194F3] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Bisa COD di mana?</button>
                    <button type="button" onClick={() => sendMsg("Apakah harganya masih bisa nego?")} className="text-[11px] bg-blue-50 text-[#0194F3] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Boleh nego?</button>
                  </div>
                  <div className="p-3 bg-white border-t border-gray-100 flex gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} placeholder="Tulis pesan ke penjual..." className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-900 outline-none" /><button type="button" onClick={() => sendMsg()} className="bg-[#0194F3] text-white font-bold text-xs px-4 rounded-xl">Kirim</button></div>
                </div>
              </div>
            )}
            {showReport && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <form onSubmit={(e) => { e.preventDefault(); setShowReport(false); setReportNote(""); alert("Terima kasih! Laporan Anda diteruskan ke Tim Keamanan BATAM GO."); }} className="bg-white w-full max-w-md rounded-t-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-gray-800">🚩 Laporkan Iklan Mencurigakan</h3><button type="button" onClick={() => setShowReport(false)} className="text-gray-400 text-sm font-bold">✕</button></div>
                  <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white text-gray-900"><option value="Indikasi Penipuan / Minta Transfer DP">Indikasi Penipuan / Minta Transfer DP</option><option value="Barang Palsu / Terlarang">Barang Palsu / Terlarang</option><option value="Harga Tidak Masuk Akal">Harga Tidak Masuk Akal</option><option value="Spam / Iklan Duplikat">Spam / Iklan Duplikat</option></select>
                  <textarea rows={3} value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="Keterangan tambahan (opsional)..." className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900" />
                  <button type="submit" className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-xs">Kirim Laporan ke Admin</button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div>
            {(activeTab === "home" || activeTab === "nearby") && (
              <div>
                <div className="bg-[#0194F3] text-white p-4 pt-5 rounded-b-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 font-black text-xl tracking-tight"><span>BATAM</span><span className="bg-[#FF5722] text-white px-1.5 py-0.5 rounded text-sm">GO</span></div>
                    <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full outline-none max-w-[180px] truncate">{BATAM_DISTRICTS.map((d) => <option key={d} value={d} className="text-gray-800">📍 {d}</option>)}</select>
                  </div>
                  <div className="bg-white rounded-xl flex items-center px-3 py-2.5 shadow-sm"><span className="text-gray-400 mr-2">🔍</span><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari kost, motor FTZ, kulkas di Batam..." className="w-full text-sm text-gray-800 outline-none" /></div>
                </div>
                <div className="mx-3 mt-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-2.5 rounded-xl flex items-center justify-between text-xs shadow-sm"><span>🚚 <b>Jasa Angkut & Pindahan Batam</b> - Mulai 100rb</span><span className="bg-white text-blue-600 font-bold px-2 py-0.5 rounded">Info</span></div>
                <div className="bg-white mx-3 mt-3 p-3 rounded-xl shadow-sm grid grid-cols-5 gap-1 text-center">
                  {(["properti", "otomotif", "elektronik", "perkakas", "lainnya"] as const).map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? "semua" : cat)} className={`flex flex-col items-center p-1.5 rounded-xl ${selectedCategory === cat ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}>
                      <span className="text-xl mb-1">{cat === "properti" ? "🏠" : cat === "otomotif" ? "🏍️" : cat === "elektronik" ? "📺" : cat === "perkakas" ? "🛠️" : "📦"}</span>
                      <span className="text-[10px] font-semibold text-gray-700 capitalize">{cat}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 px-3 mt-3 overflow-x-auto">
                  <button onClick={() => setShowFilter(true)} className="bg-white border border-blue-200 text-[#0194F3] text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">📍 Radius &lt; {maxRadius} km ▾</button>
                  <button onClick={() => setShowFilter(true)} className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">💰 {minPrice || maxPrice ? "Harga Difilter" : "Range Harga"} ▾</button>
                  {selectedCategory !== "semua" && <button onClick={() => setSelectedCategory("semua")} className="bg-orange-100 text-[#FF5722] text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">✕ Reset</button>}
                </div>
                <div className="px-3 mt-3">
                  <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">⚡ Terdekat di Sekitarmu ({filteredAds.length})</h2>
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredAds.map((ad) => (
                      <div key={ad.id} onClick={() => { setSelectedAd(ad); setPhotoIdx(0); }} className={`bg-white rounded-xl overflow-hidden shadow-sm border cursor-pointer flex flex-col justify-between ${ad.isPriority ? "border-amber-400 ring-1 ring-amber-300" : "border-gray-100"}`}>
                        <div>
                          <div className="relative aspect-square bg-gray-200">
                            <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                            {ad.isPriority ? <span className="absolute top-1.5 left-1.5 bg-amber-400 text-gray-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded">⚡ PRIORITAS</span> : ad.badge && <span className="absolute top-1.5 left-1.5 bg-[#0194F3] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{ad.badge}</span>}
                            {ad.images && ad.images.length > 1 && <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">📷 {ad.images.length}</span>}
                          </div>
                          <div className="p-2.5"><h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{ad.title}</h3><div className="text-sm font-extrabold text-gray-900 mt-1">{fmtRp(ad.price)}{ad.priceUnit && <span className="text-[10px] font-normal text-gray-500">{ad.priceUnit}</span>}</div></div>
                        </div>
                        <div className="px-2.5 pb-2.5 pt-1 border-t border-gray-50 text-[10px] text-gray-500"><span className="truncate block">📍 {ad.distanceKm}km • {ad.district.split(",")}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "sell" && (
              <div className="p-4">
                {!isVerified ? (
                  <div className="bg-white p-5 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-extrabold text-gray-800 mb-1">Verifikasi Keamanan Penjual</h2>
                    <p className="text-xs text-gray-500 mb-4">Nomor WhatsApp hanya disimpan sebagai verifikasi keamanan oleh Admin dan tidak ditampilkan ke publik.</p>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold mb-4">✔️ Akun Google Terhubung</div>
                    <div className="flex gap-2 mb-3"><span className="bg-gray-100 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600">+62</span><input type="tel" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="8127000XXXX" className="flex-1 border border-gray-300 rounded-xl px-3 text-sm text-gray-900" /></div>
                    {!otpSent ? <button onClick={() => waNumber.length >= 9 && setOtpSent(true)} className="w-full py-3 rounded-xl bg-[#0194F3] text-white font-bold text-sm">Kirim Kode OTP Verifikasi</button> : <div><input type="text" maxLength={4} value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="4 Digit OTP (Contoh: 1234)" className="w-full border border-gray-300 rounded-xl p-3 text-center font-bold tracking-widest mb-3 text-gray-900" /><button onClick={() => otpInput.length === 4 && setIsVerified(true)} className="w-full py-3 rounded-xl bg-[#FF5722] text-white font-bold text-sm">Verifikasi & Lanjut Pasang Iklan</button></div>}
                  </div>
                ) : (
                  <form onSubmit={publishAd} className="bg-white p-5 rounded-2xl shadow-sm space-y-3">
                    <h2 className="text-lg font-extrabold text-gray-800">Pasang Iklan Baru</h2>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-700">Foto Produk (Maks. 4 Foto)</label><span className="text-[11px] font-bold text-[#0194F3]">{previews.length}/4 Foto</span></div>
                      {previews.length < 4 && <input type="file" accept="image/*" multiple onChange={handleFiles} className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white text-gray-900" />}
                      {previews.length > 0 && <div className="grid grid-cols-4 gap-2 mt-2">{previews.map((s, i) => <div key={i} className="relative aspect-square"><img src={s} alt="Prev" className="w-full h-full object-cover rounded-xl border border-gray-200" /><button type="button" onClick={() => setPreviews((p) => p.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] font-bold shadow">✕</button></div>)}</div>}
                    </div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label><select value={newCategory} onChange={(e) => setNewCategory(e.target.value as Exclude<Category, "semua">)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white text-gray-900"><option value="properti">Properti</option><option value="otomotif">Otomotif</option><option value="elektronik">Elektronik</option><option value="perkakas">Perkakas</option><option value="lainnya">Lainnya</option></select></div>
                    <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-700">Judul Iklan</label><span className="text-[11px] text-gray-400">{newTitle.length}/70</span></div><input type="text" required maxLength={70} value={newTitle} onChange={(e) => setNewTitle(e.target.value.slice(0, 70))} placeholder="Contoh: Kost AC Sukajadi Dekat Kepri Mall" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Harga (Rp)</label><div className="flex items-center border border-gray-300 rounded-xl px-3 bg-white"><span className="text-sm font-bold text-gray-500 mr-1.5">Rp</span><input type="text" inputMode="numeric" required value={newPrice} onChange={(e) => setNewPrice(fmtNum(e.target.value))} placeholder="12.280.000" className="w-full py-2.5 text-sm font-bold text-gray-900 outline-none" /></div></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Lokasi Kecamatan</label><select value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white text-gray-900">{BATAM_DISTRICTS.filter((d) => d !== "Semua Batam").map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-700">Deskripsi Iklan</label><span className="text-[11px] text-gray-400">{newDesc.length}/600</span></div><textarea rows={4} required maxLength={600} value={newDesc} onChange={(e) => setNewDesc(e.target.value.slice(0, 600))} placeholder="Jelaskan kondisi barang, fasilitas kost, status surat FTZ/SHM, dll..." className="w-full border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900" /></div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed"><b>⚠️ Disclaimer:</b> Dengan menayangkan iklan, penjual memahami bahwa <b>BATAM GO</b> hanya bertindak sebagai media perantara dan tidak bertanggung jawab atas transaksi yang dilakukan di luar sepengetahuan admin.</div>
                    <button type="submit" className="w-full py-3.5 rounded-xl bg-[#FF5722] text-white font-bold text-sm shadow">Tayangkan Iklan Sekarang</button>
                  </form>
                )}
              </div>
            )}
            {activeTab === "ads" && (
              <div className="p-4 space-y-3">
                <div className="bg-[#0194F3] text-white p-4 rounded-2xl flex justify-between items-center"><div><h2 className="font-extrabold text-base">Iklan Saya & Promosi</h2><p className="text-xs text-blue-100">Tingkatkan penjualan lebih cepat di Batam</p></div><span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-bold">Kuota Gratis: 2/2</span></div>
                {ads.slice(0, 2).map((ad) => (
                  <div key={ad.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex gap-3"><img src={ad.image} alt={ad.title} className="w-16 h-16 rounded-lg object-cover" /><div className="flex-1"><h3 className="text-xs font-bold text-gray-800 line-clamp-1">{ad.title}</h3><div className="text-sm font-extrabold text-gray-900">{fmtRp(ad.price)}</div><div className="text-[11px] text-gray-500 mt-1">👁️ {ad.views} Dilihat • 💬 {ad.waClicks} Chat Masuk</div></div></div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-gray-100"><button onClick={() => alert("Membuka QRIS Pembayaran Sundul Iklan (Rp 5.000)...")} className="py-2 rounded-lg border border-[#0194F3] text-[#0194F3] text-xs font-bold">⬆️ Sundul (Rp 5rb)</button><button onClick={() => alert("Membuka QRIS Pembayaran Highlight Prioritas (Rp 15.000)...")} className="py-2 rounded-lg bg-[#FF5722] text-white text-xs font-bold">⚡ Highlight (Rp 15rb)</button></div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "account" && (
              <div className="p-4"><div className="bg-white p-5 rounded-2xl shadow-sm text-center"><div className="w-16 h-16 rounded-full bg-[#0194F3] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-2">B</div><h2 className="font-bold text-gray-800">Pengguna BATAM GO</h2><p className="text-xs text-gray-500 mb-4">{isVerified ? "✔️ Terverifikasi Keamanan Admin" : "Belum Verifikasi Nomor Keamanan"}</p><button onClick={() => setActiveTab("ads")} className="w-full py-2.5 rounded-xl bg-blue-50 text-[#0194F3] font-bold text-xs">Kelola Iklan & Promosi Saya</button></div></div>
            )}
            {showFilter && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <div className="bg-white w-full max-w-md rounded-t-2xl p-5">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">Filter Pencarian Batam</h3><button onClick={() => { setMaxRadius(20); setMinPrice(""); setMaxPrice(""); setSelectedDistrict("Semua Batam"); }} className="text-xs text-[#0194F3] font-bold">Reset</button></div>
                  <div className="mb-4"><div className="flex justify-between text-xs font-bold text-gray-700 mb-2"><span>Jarak Terdekat</span><span className="text-[#0194F3]">Maksimal {maxRadius} km</span></div><div className="grid grid-cols-5 gap-1.5">{Array.of(1, 3, 5, 10, 20).map((r) => <button key={r} onClick={() => setMaxRadius(r)} className={`py-2 rounded-lg text-xs font-bold border ${maxRadius === r ? "bg-[#0194F3] text-white border-[#0194F3]" : "bg-gray-50 text-gray-700 border-gray-200"}`}>{r === 20 ? "Semua" : `${r} km`}</button>)}</div></div>
                  <div className="mb-4"><label className="block text-xs font-bold text-gray-700 mb-2">Rentang Harga (Rp)</label><div className="grid grid-cols-2 gap-2"><input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Rp Minimum" className="border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900" /><input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Rp Maksimum" className="border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900" /></div></div>
                  <button onClick={() => setShowFilter(false)} className="w-full py-3 rounded-xl bg-[#FF5722] text-white font-bold text-sm">Tampilkan {filteredAds.length} Hasil</button>
                </div>
              </div>
            )}
            <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 px-2 py-1.5 flex justify-around items-center z-40">
              <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center text-[10px] font-bold ${activeTab === "home" ? "text-[#0194F3]" : "text-gray-400"}`}><span className="text-lg">🏠</span>Beranda</button>
              <button onClick={() => { setActiveTab("nearby"); setMaxRadius(3); }} className={`flex flex-col items-center text-[10px] font-bold ${activeTab === "nearby" ? "text-[#0194F3]" : "text-gray-400"}`}><span className="text-lg">🧭</span>Nearby</button>
              <button onClick={() => setActiveTab("sell")} className="-mt-6 bg-[#FF5722] text-white w-14 h-14 rounded-full shadow-lg flex flex-col items-center justify-center border-4 border-white"><span className="text-lg leading-none">+</span><span className="text-[9px] font-extrabold">JUAL</span></button>
              <button onClick={() => setActiveTab("ads")} className={`flex flex-col items-center text-[10px] font-bold ${activeTab === "ads" ? "text-[#0194F3]" : "text-gray-400"}`}><span className="text-lg">📢</span>Iklan Saya</button>
              <button onClick={() => setActiveTab("account")} className={`flex flex-col items-center text-[10px] font-bold ${activeTab === "account" ? "text-[#0194F3]" : "text-gray-400"}`}><span className="text-lg">👤</span>Akun</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
