"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Category, AdItem, INITIAL_ADS, BATAM_DISTRICTS } from "./data";

interface ChatMessage {
  sender: "buyer" | "seller";
  text: string;
  time: string;
}

export default function BatamGoApp() {
  const [activeTab, setActiveTab] = useState<"home" | "nearby" | "sell" | "ads" | "account">("home");
  const [ads, setAds] = useState<AdItem[]>(INITIAL_ADS);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("semua");
  const [selectedDistrict, setSelectedDistrict] = useState("Semua Batam");
  const [maxRadius, setMaxRadius] = useState<number>(20);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // State Chat In-App & Laporkan Iklan
  const [showChatSheet, setShowChatSheet] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportReason, setReportReason] = useState("Indikasi Penipuan / Minta Transfer DP");
  const [reportNote, setReportNote] = useState("");

  // State Verifikasi & Form Jual
  const [isSellerVerified, setIsSellerVerified] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Exclude<Category, "semua">>("properti");
  const [newPrice, setNewPrice] = useState("");
  const [newDistrict, setNewDistrict] = useState("Batam Center");
  const [newDesc, setNewDesc] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("batamgo_ads_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setAds(parsed);
      }
      const savedChats = localStorage.getItem("batamgo_chats_v1");
      if (savedChats) setChatHistory(JSON.parse(savedChats));
    } catch {}
  }, []);

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");
  const formatThousands = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    return digits ? Number(digits).toLocaleString("id-ID") : "";
  };
  const parseDigits = (formatted: string) => Number(formatted.replace(/\D/g, "") || "0");

  const filteredAds = useMemo(() => {
    return ads
      .filter((ad) => {
        if (selectedCategory !== "semua" && ad.category !== selectedCategory) return false;
        if (selectedDistrict !== "Semua Batam" && ad.district !== selectedDistrict) return false;
        if (ad.distanceKm > maxRadius) return false;
        if (minPrice && ad.price < Number(minPrice)) return false;
        if (maxPrice && ad.price > Number(maxPrice)) return false;
        if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => (a.isPriority === b.isPriority ? a.distanceKm - b.distanceKm : a.isPriority ? -1 : 1));
  }, [ads, selectedCategory, selectedDistrict, maxRadius, minPrice, maxPrice, searchQuery]);

  const compressOneFile = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 480;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("");
      };
      img.src = url;
    });

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const remainingSlots = 4 - photoPreviews.length;
    if (remainingSlots <= 0) {
      alert("Maksimal hanya 4 foto produk!");
      return;
    }
    const selected = files.slice(0, remainingSlots);
    const compressedList: string[] = [];
    for (const f of selected) {
      const res = await compressOneFile(f);
      if (res) compressedList.push(res);
    }
    setPhotoPreviews((prev) => [...prev, ...compressedList].slice(0, 4));
    e.target.value = "";
  };

  const handlePublishAd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseDigits(newPrice);
    if (!newTitle.trim() || numericPrice < 1000 || !newDesc.trim() || isUploading) return;
    setIsUploading(true);
    const priceUnit = newCategory === "properti" && newTitle.toLowerCase().includes("kost") ? "/ bln" : undefined;
    const badge = newCategory === "otomotif" ? "FTZ BATAM" : "BARU";
    const sellerWa = waNumber ? `62${waNumber.replace(/^0/, "")}` : "6281270009999";
    const finalImages = photoPreviews.length > 0 ? photoPreviews : ["/kost.jpg"];
    const created: AdItem = {
      id: Date.now().toString(),
      title: newTitle.trim().slice(0, 70),
      price: numericPrice,
      priceUnit,
      category: newCategory,
      district: newDistrict,
      distanceKm: 0.5,
      badge,
      sellerName: "Penjual Batam",
      isVerified: true,
      whatsapp: sellerWa,
      description: newDesc.trim().slice(0, 600),
      image: finalImages.at(0) || "/kost.jpg",
      images: finalImages,
      views: 1,
      waClicks: 0,
    };
    const updatedAds = [created, ...ads];
    setAds(updatedAds);
    try {
      localStorage.setItem("batamgo_ads_v3", JSON.stringify(updatedAds));
    } catch {}
    setIsUploading(false);
    setNewTitle("");
    setNewPrice("");
    setNewDesc("");
    setPhotoPreviews([]);
    setActiveTab("home");
  };

  const sendInAppMessage = (customText?: string) => {
    if (!selectedAd) return;
    const textToSend = (customText ?? chatInput).trim();
    if (!textToSend) return;
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const prevMsgs = chatHistory[selectedAd.id] || [];
    const nextMsgs: ChatMessage[] = [...prevMsgs, { sender: "buyer", text: textToSend, time: now }];
    const updated = { ...chatHistory, [selectedAd.id]: nextMsgs };
    setChatHistory(updated);
    if (!customText) setChatInput("");
    try {
      localStorage.setItem("batamgo_chats_v1", JSON.stringify(updated));
    } catch {}
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReportSheet(false);
    setReportNote("");
    alert("Terima kasih! Laporan Anda telah diteruskan ke Tim Keamanan BATAM GO untuk segera ditinjau.");
  };

  const detailPhotos = selectedAd ? (selectedAd.images && selectedAd.images.length > 0 ? selectedAd.images : [selectedAd.image]) : [];
  const currentAdMessages = selectedAd ? chatHistory[selectedAd.id] || [] : [];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center select-none">
      <div className="w-full max-w-md bg-[#F4F6F9] min-h-screen pb-24 relative shadow-xl overflow-x-hidden">
        {selectedAd ? (
          <div className="bg-white min-h-screen pb-28">
            <div className="relative">
              <img src={detailPhotos.at(activePhotoIdx) || selectedAd.image} alt={selectedAd.title} className="w-full h-72 object-cover" />
              <button onClick={() => { setSelectedAd(null); setActivePhotoIdx(0); }} className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-sm font-bold shadow text-gray-800">← Kembali</button>
              <button onClick={() => setShowReportSheet(true)} className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold shadow text-red-600">🚩 Laporkan</button>
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">{activePhotoIdx + 1}/{detailPhotos.length} Foto</span>
            </div>
            {detailPhotos.length > 1 && (
              <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
                {detailPhotos.map((src, idx) => (
                  <img key={idx} src={src} alt="Thumb" onClick={() => setActivePhotoIdx(idx)} className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 ${activePhotoIdx === idx ? "border-[#0194F3]" : "border-transparent opacity-70"}`} />
                ))}
              </div>
            )}
            <div className="p-4">
              {selectedAd.badge && <span className="inline-block bg-orange-100 text-[#FF5722] text-[11px] font-bold px-2 py-0.5 rounded mb-1">{selectedAd.badge}</span>}
              <div className="text-2xl font-extrabold text-gray-900">{formatRupiah(selectedAd.price)} {selectedAd.priceUnit && <span className="text-sm font-normal text-gray-500">{selectedAd.priceUnit}</span>}</div>
              <h1 className="text-lg font-semibold text-gray-800 mt-1">{selectedAd.title}</h1>
              <p className="text-xs text-gray-500 mt-2">📍 {selectedAd.district} • <span className="text-[#0194F3] font-semibold">{selectedAd.distanceKm} km dari Anda</span></p>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
            <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 p-3 flex gap-2.5 z-30">
              <button onClick={() => setShowReportSheet(true)} className="px-3.5 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-xs">🚩 Laporkan</button>
              <button onClick={() => setShowChatSheet(true)} className="flex-1 py-3 rounded-xl bg-[#0194F3] text-white font-bold text-sm shadow-sm">💬 Hubungi Penjual (Chat)</button>
            </div>

            {showChatSheet && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <div className="bg-white w-full max-w-md rounded-t-2xl flex flex-col max-h-[85vh]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">💬 Chat dengan {selectedAd.sellerName}</h3>
                      <p className="text-[11px] text-gray-500 truncate max-w-[240px]">{selectedAd.title}</p>
                    </div>
                    <button onClick={() => setShowChatSheet(false)} className="text-gray-400 text-sm font-bold px-2">✕</button>
                  </div>
                  <div className="bg-amber-50 px-4 py-2 text-[11px] text-amber-800 border-b border-amber-100">
                    🛡️ <b>Tips Aman:</b> Nomor WhatsApp penjual dirahasiakan demi keamanan. Gunakan chat ini & lakukan COD di tempat ramai.
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-2.5 min-h-[180px] bg-gray-50">
                    {currentAdMessages.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 my-8">Mulai obrolan dengan penjual di bawah ini...</p>
                    ) : (
                      currentAdMessages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.sender === "buyer" ? "items-end" : "items-start"}`}>
                          <div className={`px-3.5 py-2 rounded-2xl text-xs max-w-[80%] ${m.sender === "buyer" ? "bg-[#0194F3] text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"}`}>
                            {m.text}
                          </div>
                          <span className="text-[9px] text-gray-400 mt-0.5 px-1">{m.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto bg-white">
                    <button type="button" onClick={() => sendInAppMessage("Halo, apakah barang ini masih tersedia?")} className="text-[11px] bg-blue-50 text-[#0194F3] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Masih tersedia?</button>
                    <button type="button" onClick={() => sendInAppMessage("Bisa ketemuan / COD di daerah mana ya?")} className="text-[11px] bg-blue-50 text-[#0194F3] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Bisa COD di mana?</button>
                    <button type="button" onClick={() => sendInAppMessage("Apakah harganya masih bisa nego?")} className="text-[11px] bg-blue-50 text-[#0194F3] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Boleh nego?</button>
                  </div>
                  <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendInAppMessage()} placeholder="Tulis pesan ke penjual..." className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-900 outline-none" />
                    <button type="button" onClick={() => sendInAppMessage()} className="bg-[#0194F3] text-white font-bold text-xs px-4 rounded-xl">Kirim</button>
                  </div>
                </div>
              </div>
            )}

            {showReportSheet && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <form onSubmit={handleReportSubmit} className="bg-white w-full max-w-md rounded-t-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">🚩 Laporkan Iklan Mencurigakan</h3>
                    <button type="button" onClick={() => setShowReportSheet(false)} className="text-gray-400 text-sm font-bold">✕</button>
                  </div>
                  <p className="text-xs text-gray-500">Bantu jaga komunitas Batam tetap aman dari penipuan.</p>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Alasan Pelaporan</label>
                    <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white text-gray-900">
                      <option value="Indikasi Penipuan / Minta Transfer DP">Indikasi Penipuan / Minta Transfer DP</option>
                      <option value="Barang Palsu / Terlarang">Barang Palsu / Terlarang</option>
                      <option value="Harga Tidak Masuk Akal">Harga Tidak Masuk Akal</option>
                      <option value="Spam / Iklan Duplikat">Spam / Iklan Duplikat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan Tambahan (Opsional)</label>
                    <textarea rows={3} value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="Ceritakan detail kejanggalan iklan ini..." className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900" />
                  </div>
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
                    <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full outline-none max-w-[180px] truncate">
                      {BATAM_DISTRICTS.map((d) => <option key={d} value={d} className="text-gray-800">📍 {d}</option>)}
                    </select>
                  </div>
                  <div className="bg-white rounded-xl flex items-center px-3 py-2.5 shadow-sm">
                    <span className="text-gray-400 mr-2">🔍</span>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari kost, motor FTZ, kulkas di Batam..." className="w-full text-sm text-gray-800 outline-none" />
                  </div>
                </div>
                <div className="mx-3 mt-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-2.5 rounded-xl flex items-center justify-between text-xs shadow-sm">
                  <span>🚚 <b>Jasa Angkut & Pindahan Batam</b> - Mulai 100rb</span>
                  <span className="bg-white text-blue-600 font-bold px-2 py-0.5 rounded">Info</span>
                </div>
                <div className="bg-white mx-3 mt-3 p-3 rounded-xl shadow-sm grid grid-cols-5 gap-1 text-center">
                  <button onClick={() => setSelectedCategory(selectedCategory === "properti" ? "semua" : "properti")} className={`flex flex-col items-center p-1.5 rounded-xl ${selectedCategory === "properti" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-xl mb-1">🏠</span><span className="text-[10px] font-semibold text-gray-700 leading-tight">Properti</span></button>
                  <button onClick={() => setSelectedCategory(selectedCategory === "otomotif" ? "semua" : "otomotif")} className={`flex flex-col items-center p-1.5 rounded-xl ${selectedCategory === "otomotif" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-xl mb-1">🏍️</span><span className="text-[10px] font-semibold text-gray-700 leading-tight">Otomotif</span></button>
                  <button onClick={() => setSelectedCategory(selectedCategory === "elektronik" ? "semua" : "elektronik")} className={`flex flex-col items-center p-1.5 rounded-xl ${selectedCategory === "elektronik" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-xl mb-1">📺</span><span className="text-[10px] font-semibold text-gray-700 leading-tight">Elektronik</span></button>
                  <button onClick={() => setSelectedCategory(selectedCategory === "perkakas" ? "semua" : "perkakas")} className={`flex flex-col items-center p-1.5 rounded-xl ${selectedCategory === "perkakas" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-xl mb-1">🛠️</span><span className="text-[10px] font-semibold text-gray-700 leading-tight">Perkakas</span></button>
                  <button onClick={() => setSelectedCategory(selectedCategory === "lainnya" ? "semua" : "lainnya")} className={`flex flex-col items-center p-1.5 rounded-xl ${selectedCategory === "lainnya" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-xl mb-1">📦</span><span className="text-[10px] font-semibold text-gray-700 leading-tight">Lainnya</span></button>
                </div>
                <div className="flex gap-2 px-3 mt-3 overflow-x-auto">
            {activeTab === "ads" && (
              <div className="p-4 space-y-3">
                <div className="bg-[#0194F3] text-white p-4 rounded-2xl flex justify-between items-center">
                  <div><h2 className="font-extrabold text-base">Iklan Saya & Promosi</h2><p className="text-xs text-blue-100">Tingkatkan penjualan lebih cepat di Batam</p></div>
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-bold">Kuota Gratis: 2/2</span>
                </div>
                {ads.slice(0, 2).map((ad) => (
                  <div key={ad.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex gap-3">
                      <img src={ad.image} alt={ad.title} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1"><h3 className="text-xs font-bold text-gray-800 line-clamp-1">{ad.title}</h3><div className="text-sm font-extrabold text-gray-900">{formatRupiah(ad.price)}</div><div className="text-[11px] text-gray-500 mt-1">👁️ {ad.views} Dilihat • 💬 {ad.waClicks} Chat Masuk</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-gray-100">
                      <button onClick={() => alert("Membuka QRIS Pembayaran Sundul Iklan (Rp 5.000)...")} className="py-2 rounded-lg border border-[#0194F3] text-[#0194F3] text-xs font-bold">⬆️ Sundul (Rp 5rb)</button>
                      <button onClick={() => alert("Membuka QRIS Pembayaran Highlight Prioritas (Rp 15.000)...")} className="py-2 rounded-lg bg-[#FF5722] text-white text-xs font-bold">⚡ Highlight (Rp 15rb)</button>
                    </div>
                  </div>
                ))}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-2xl shadow">
                  <div className="text-xs text-amber-400 font-bold mb-1">👑 PAKET JURAGAN BATAM</div>
                  <h3 className="text-sm font-bold">30 Iklan Aktif + Lencana Centang Biru</h3>
                  <p className="text-xs text-gray-300 mt-1 mb-3">Cocok untuk Agen Properti, Pemilik Kost & Showroom Otomotif.</p>
                  <button onClick={() => alert("Membuka QRIS Paket Juragan Batam (Rp 99.000/bulan)...")} className="w-full py-2.5 rounded-xl bg-amber-400 text-gray-900 font-extrabold text-xs">Upgrade Sekarang - Rp 99rb / bln</button>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="p-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm text-center">
                  <div className="w-16 h-16 rounded-full bg-[#0194F3] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-2">B</div>
                  <h2 className="font-bold text-gray-800">Pengguna BATAM GO</h2>
                  <p className="text-xs text-gray-500 mb-4">{isSellerVerified ? "✔️ Terverifikasi Keamanan Admin" : "Belum Verifikasi Nomor Keamanan"}</p>
                  <button onClick={() => setActiveTab("ads")} className="w-full py-2.5 rounded-xl bg-blue-50 text-[#0194F3] font-bold text-xs">Kelola Iklan & Promosi Saya</button>
                </div>
              </div>
            )}

            {showFilterSheet && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <div className="bg-white w-full max-w-md rounded-t-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Filter Pencarian Batam</h3>
                    <button onClick={() => { setMaxRadius(20); setMinPrice(""); setMaxPrice(""); setSelectedDistrict("Semua Batam"); }} className="text-xs text-[#0194F3] font-bold">Reset</button>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-2"><span>Jarak Terdekat (Nearby)</span><span className="text-[#0194F3]">Maksimal {maxRadius} km</span></div>
                    <div className="grid grid-cols-5 gap-1.5">
                      <button onClick={() => setMaxRadius(1)} className={`py-2 rounded-lg text-xs font-bold border ${maxRadius === 1 ? "bg-[#0194F3] text-white border-[#0194F3]" : "bg-gray-50 text-gray-700 border-gray-200"}`}>1 km</button>
                      <button onClick={() => setMaxRadius(3)} className={`py-2 rounded-lg text-xs font-bold border ${maxRadius === 3 ? "bg-[#0194F3] text-white border-[#0194F3]" : "bg-gray-50 text-gray-700 border-gray-200"}`}>3 km</button>
                      <button onClick={() => setMaxRadius(5)} className={`py-2 rounded-lg text-xs font-bold border ${maxRadius === 5 ? "bg-[#0194F3] text-white border-[#0194F3]" : "bg-gray-50 text-gray-700 border-gray-200"}`}>5 km</button>
                      <button onClick={() => setMaxRadius(10)} className={`py-2 rounded-lg text-xs font-bold border ${maxRadius === 10 ? "bg-[#0194F3] text-white border-[#0194F3]" : "bg-gray-50 text-gray-700 border-gray-200"}`}>10 km</button>
                      <button onClick={() => setMaxRadius(20)} className={`py-2 rounded-lg text-xs font-bold border ${maxRadius === 20 ? "bg-[#0194F3] text-white border-[#0194F3]" : "bg-gray-50 text-gray-700 border-gray-200"}`}>Semua</button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Rentang Harga (Rp)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Rp Minimum" className="border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900" />
                      <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Rp Maksimum" className="border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900" />
                    </div>
                  </div>
                  <button onClick={() => setShowFilterSheet(false)} className="w-full py-3 rounded-xl bg-[#FF5722] text-white font-bold text-sm">Tampilkan {filteredAds.length} Hasil</button>
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
        </div>
        )}
      </div>
    </div>
  );
}
