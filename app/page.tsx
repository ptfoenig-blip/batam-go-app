"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Category, AdItem, INITIAL_ADS, BATAM_DISTRICTS } from "./data";

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
  const [showNegoSheet, setShowNegoSheet] = useState(false);
  const [negoOffer, setNegoOffer] = useState<string>("");
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
      const saved = localStorage.getItem("batamgo_ads_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setAds(parsed);
      }
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
      image: finalImages[0],
      images: finalImages,
      views: 1,
      waClicks: 0,
    };
    const updatedAds = [created, ...ads];
    setAds(updatedAds);
    try {
      localStorage.setItem("batamgo_ads_v2", JSON.stringify(updatedAds));
    } catch {}
    setIsUploading(false);
    setNewTitle("");
    setNewPrice("");
    setNewDesc("");
    setPhotoPreviews([]);
    setActiveTab("home");
  };

  const openWhatsApp = (ad: AdItem, customOffer?: string) => {
    const offerNum = customOffer ? parseDigits(customOffer) : 0;
    const text = offerNum > 0
      ? `Halo, saya lihat iklan *${ad.title}* di BATAM GO. Apakah boleh nego di harga *Rp ${offerNum.toLocaleString("id-ID")}*?`
      : `Halo, saya tertarik dengan iklan *${ad.title}* (${formatRupiah(ad.price)}) di BATAM GO. Apakah masih tersedia?`;
    window.open(`https://wa.me{ad.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const detailPhotos = selectedAd ? (selectedAd.images && selectedAd.images.length > 0 ? selectedAd.images : [selectedAd.image]) : [];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center select-none">
      <div className="w-full max-w-md bg-[#F4F6F9] min-h-screen pb-24 relative shadow-xl overflow-x-hidden">
        {selectedAd ? (
          <div className="bg-white min-h-screen pb-24">
            <div className="relative">
              <img src={detailPhotos[activePhotoIdx] || selectedAd.image} alt={selectedAd.title} className="w-full h-72 object-cover" />
              <button onClick={() => { setSelectedAd(null); setActivePhotoIdx(0); }} className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-sm font-bold shadow text-gray-800">← Kembali</button>
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">{activePhotoIdx + 1}/{detailPhotos.length} Foto</span>
            </div>
            {detailPhotos.length > 1 && (
              <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
                {detailPhotos.map((src, idx) => (
                  <img key={idx} src={src} alt={`Foto ${idx + 1}`} onClick={() => setActivePhotoIdx(idx)} className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 ${activePhotoIdx === idx ? "border-[#0194F3]" : "border-transparent opacity-70"}`} />
                ))}
              </div>
            )}
            <div className="p-4">
              {selectedAd.badge && <span className="inline-block bg-orange-100 text-[#FF5722] text-[11px] font-bold px-2 py-0.5 rounded mb-1">{selectedAd.badge}</span>}
              <div className="text-2xl font-extrabold text-gray-900">{formatRupiah(selectedAd.price)} {selectedAd.priceUnit && <span className="text-sm font-normal text-gray-500">{selectedAd.priceUnit}</span>}</div>
              <h1 className="text-lg font-semibold text-gray-800 mt-1">{selectedAd.title}</h1>
              <p className="text-xs text-gray-500 mt-2">📍 {selectedAd.district} • <span className="text-[#0194F3] font-semibold">{selectedAd.distanceKm} km dari Anda</span></p>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0194F3] text-white flex items-center justify-center font-bold">{selectedAd.sellerName.charAt(0)}</div>
                <div>
                  <div className="text-sm font-bold text-gray-800">{selectedAd.sellerName} {selectedAd.isVerified && <span className="text-xs text-[#0194F3]">✔️</span>}</div>
                  <div className="text-[11px] text-gray-500">Nomor WhatsApp Terverifikasi</div>
                </div>
              </div>
              <div className="mt-5"><h2 className="text-sm font-bold text-gray-800 mb-1.5">Deskripsi</h2><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line select-text">{selectedAd.description}</p></div>
            </div>
            <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 p-3 flex gap-2.5 z-30">
              {selectedAd.category === "properti" ? (
                <a href={`tel:+${selectedAd.whatsapp}`} className="flex-1 py-3 rounded-xl border border-[#0194F3] text-[#0194F3] font-bold text-sm text-center">📞 Telepon</a>
              ) : (
                <button onClick={() => { setNegoOffer(Math.floor(selectedAd.price * 0.9).toLocaleString("id-ID")); setShowNegoSheet(true); }} className="flex-1 py-3 rounded-xl border border-[#FF5722] text-[#FF5722] font-bold text-sm">🤝 Tawar / Nego</button>
              )}
              <button onClick={() => openWhatsApp(selectedAd)} className="flex-[1.5] py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm shadow-sm">💬 Chat WhatsApp</button>
            </div>
            {showNegoSheet && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <div className="bg-white w-full max-w-md rounded-t-2xl p-5">
                  <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-gray-800">Ajukan Penawaran</h3><button onClick={() => setShowNegoSheet(false)} className="text-gray-400 text-sm">Tutup</button></div>
                  <p className="text-xs text-gray-500 mb-3">Harga penjual: {formatRupiah(selectedAd.price)}</p>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setNegoOffer(Math.floor(selectedAd.price * 0.95).toLocaleString("id-ID"))} className="flex-1 py-2 text-xs font-semibold bg-orange-50 text-[#FF5722] rounded-lg border border-orange-200">{formatRupiah(Math.floor(selectedAd.price * 0.95))}</button>
                    <button onClick={() => setNegoOffer(Math.floor(selectedAd.price * 0.9).toLocaleString("id-ID"))} className="flex-1 py-2 text-xs font-semibold bg-orange-50 text-[#FF5722] rounded-lg border border-orange-200">{formatRupiah(Math.floor(selectedAd.price * 0.9))}</button>
                    <button onClick={() => setNegoOffer(Math.floor(selectedAd.price * 0.85).toLocaleString("id-ID"))} className="flex-1 py-2 text-xs font-semibold bg-orange-50 text-[#FF5722] rounded-lg border border-orange-200">{formatRupiah(Math.floor(selectedAd.price * 0.85))}</button>
                  </div>
                  <input type="text" inputMode="numeric" value={negoOffer} onChange={(e) => setNegoOffer(formatThousands(e.target.value))} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold mb-4 text-gray-900" placeholder="Contoh: 12.280.000" />
                  <button onClick={() => { setShowNegoSheet(false); openWhatsApp(selectedAd, negoOffer); }} className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm">Kirim Tawaran via WhatsApp</button>
                </div>
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
                <div className="bg-white mx-3 mt-3 p-3 rounded-xl shadow-sm grid grid-cols-4 gap-2 text-center">
                  <button onClick={() => setSelectedCategory(selectedCategory === "properti" ? "semua" : "properti")} className={`flex flex-col items-center p-2 rounded-xl ${selectedCategory === "properti" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-2xl mb-1">🏠</span><span className="text-[11px] font-semibold text-gray-700 leading-tight">Properti & Kost</span></button>
                  <button onClick={() => setSelectedCategory(selectedCategory === "otomotif" ? "semua" : "otomotif")} className={`flex flex-col items-center p-2 rounded-xl ${selectedCategory === "otomotif" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-2xl mb-1">🏍️</span><span className="text-[11px] font-semibold text-gray-700 leading-tight">Otomotif</span></button>
                  <button onClick={() => setSelectedCategory(selectedCategory === "elektronik" ? "semua" : "elektronik")} className={`flex flex-col items-center p-2 rounded-xl ${selectedCategory === "elektronik" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-2xl mb-1">📺</span><span className="text-[11px] font-semibold text-gray-700 leading-tight">Elektronik</span></button>
                  <button onClick={() => setSelectedCategory(selectedCategory === "perkakas" ? "semua" : "perkakas")} className={`flex flex-col items-center p-2 rounded-xl ${selectedCategory === "perkakas" ? "bg-blue-50 ring-1 ring-[#0194F3]" : ""}`}><span className="text-2xl mb-1">🛠️</span><span className="text-[11px] font-semibold text-gray-700 leading-tight">Perkakas</span></button>
                </div>
                <div className="flex gap-2 px-3 mt-3 overflow-x-auto">
                  <button onClick={() => setShowFilterSheet(true)} className="bg-white border border-blue-200 text-[#0194F3] text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">📍 Radius &lt; {maxRadius} km ▾</button>
                  <button onClick={() => setShowFilterSheet(true)} className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">💰 {minPrice || maxPrice ? "Harga Difilter" : "Range Harga"} ▾</button>
                  {selectedCategory !== "semua" && <button onClick={() => setSelectedCategory("semua")} className="bg-orange-100 text-[#FF5722] text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">✕ Reset</button>}
                </div>
                <div className="px-3 mt-3">
                  <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">⚡ Terdekat di Sekitarmu ({filteredAds.length})</h2>
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredAds.map((ad) => (
                      <div key={ad.id} onClick={() => { setSelectedAd(ad); setActivePhotoIdx(0); }} className={`bg-white rounded-xl overflow-hidden shadow-sm border cursor-pointer flex flex-col justify-between ${ad.isPriority ? "border-amber-400 ring-1 ring-amber-300" : "border-gray-100"}`}>
                        <div>
                          <div className="relative aspect-square bg-gray-200">
                            <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                            {ad.isPriority ? <span className="absolute top-1.5 left-1.5 bg-amber-400 text-gray-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded">⚡ PRIORITAS</span> : ad.badge && <span className="absolute top-1.5 left-1.5 bg-[#0194F3] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{ad.badge}</span>}
                            {ad.images && ad.images.length > 1 && <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">📷 {ad.images.length}</span>}
                          </div>
                          <div className="p-2.5">
                            <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{ad.title}</h3>
                            <div className="text-sm font-extrabold text-gray-900 mt-1">{formatRupiah(ad.price)}{ad.priceUnit && <span className="text-[10px] font-normal text-gray-500">{ad.priceUnit}</span>}</div>
                          </div>
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
                {!isSellerVerified ? (
                  <div className="bg-white p-5 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-extrabold text-gray-800 mb-1">Verifikasi Penjual</h2>
                    <p className="text-xs text-gray-500 mb-4">Untuk mencegah akun palsu di Batam, wajib verifikasi nomor WhatsApp aktif Anda satu kali.</p>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold mb-4">✔️ Akun Google Terhubung</div>
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
                      <div className="flex-1"><h3 className="text-xs font-bold text-gray-800 line-clamp-1">{ad.title}</h3><div className="text-sm font-extrabold text-gray-900">{formatRupiah(ad.price)}</div><div className="text-[11px] text-gray-500 mt-1">👁️ {ad.views} Dilihat • 💬 {ad.waClicks} Klik WA</div></div>
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
                  <p className="text-xs text-gray-500 mb-4">{isSellerVerified ? "✔️ Penjual Terverifikasi WhatsApp" : "Belum Verifikasi WhatsApp"}</p>
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
            343 |         </div>
           </div>
         </div>
        )}
      </div>
      </div>
