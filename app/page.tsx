"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Category, AdItem, INITIAL_ADS, BATAM_DISTRICTS } from "./data";
import { supabase } from "../supabase";

export default function BatamGoApp() {
  const [activeTab, setActiveTab] = useState<"home" | "nearby" | "sell" | "ads" | "account">("home");
  const [ads, setAds] = useState<AdItem[]>(INITIAL_ADS);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        const dbAds: AdItem[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: String(row.title),
          price: Number(row.price),
          priceUnit: row.price_unit ? String(row.price_unit) : undefined,
          category: row.category as Exclude<Category, "semua">,
          district: String(row.district),
          distanceKm: Number(row.distance_km ?? 0.5),
          badge: row.badge ? String(row.badge) : undefined,
          isPriority: Boolean(row.is_priority),
          sellerName: String(row.seller_name),
          isVerified: Boolean(row.is_verified),
          whatsapp: String(row.whatsapp),
          description: String(row.description),
          image: String(row.image),
          views: Number(row.views ?? 1),
          waClicks: Number(row.wa_clicks ?? 0),
        }));
        setAds([...dbAds, ...INITIAL_ADS]);
      }
    };
    fetchAds();
  }, []);

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

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

     const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.7);
      };
    });

  const handlePublishAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newDesc || isUploading) return;
    setIsUploading(true);
    let imageUrl = "/kost.jpg";
    try {
      if (photoFile) {
        const compressed = await compressImage(photoFile);
        const fileName = `${Date.now()}.jpg`;
        const sbUrl = "https://supabase.co";
        const sbKey = "sb_publishable_llzVd0-Do_mq7ahXiiSABA_QSxdSvEu";
        const res = await fetch(`${sbUrl}/storage/v1/object/ad-images/${fileName}`, {
          method: "POST",
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            "Content-Type": "image/jpeg",
          },
          body: compressed,
        });
        if (!res.ok) {
          const errText = await res.text();
          alert("Gagal upload foto: " + errText);
          setIsUploading(false);
          return;
        }
        imageUrl = `${sbUrl}/storage/v1/object/public/ad-images/${fileName}`;
      }
      const priceUnit = newCategory === "properti" && newTitle.toLowerCase().includes("kost") ? "/ bln" : undefined;
      const badge = newCategory === "otomotif" ? "FTZ BATAM" : "BARU";
      const sellerWa = waNumber ? `62${waNumber.replace(/^0/, "")}` : "6281270009999";
      const { data: inserted, error: dbErr } = await supabase.from("ads").insert([{
        title: newTitle, price: Number(newPrice), price_unit: priceUnit ?? null, category: newCategory,
        district: newDistrict, distance_km: 0.5, badge, seller_name: "Penjual Batam", is_verified: true,
        whatsapp: sellerWa, description: newDesc, image: imageUrl,
      }]).select().single();
      setIsUploading(false);
      if (dbErr) {
        alert("Gagal menyimpan iklan: " + dbErr.message);
        return;
      }
      const created: AdItem = {
        id: inserted ? String(inserted.id) : Date.now().toString(), title: newTitle, price: Number(newPrice),
        priceUnit, category: newCategory, district: newDistrict, distanceKm: 0.5, badge,
        sellerName: "Penjual Batam", isVerified: true, whatsapp: sellerWa, description: newDesc,
        image: imageUrl, views: 1, waClicks: 0,
      };
      setAds([created, ...ads]);
      setNewTitle(""); setNewPrice(""); setNewDesc(""); setPhotoFile(null);
      setActiveTab("home");
    } catch (err) {
      setIsUploading(false);
      alert("Koneksi terputus: " + String(err));
    }
  };

  const openWhatsApp = (ad: AdItem, customOffer?: string) => {
    const text = customOffer
      ? `Halo, saya lihat iklan *${ad.title}* di BATAM GO. Apakah boleh nego di harga *Rp ${Number(customOffer).toLocaleString("id-ID")}*?`
      : `Halo, saya tertarik dengan iklan *${ad.title}* (${formatRupiah(ad.price)}) di BATAM GO. Apakah masih tersedia?`;
    window.open(`https://wa.me/${ad.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center select-none">
      <div className="w-full max-w-md bg-[#F4F6F9] min-h-screen pb-24 relative shadow-xl overflow-x-hidden">
        {selectedAd ? (
          <div className="bg-white min-h-screen pb-24">
            <div className="relative">
              <img src={selectedAd.image} alt={selectedAd.title} className="w-full h-72 object-cover" />
              <button onClick={() => setSelectedAd(null)} className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-sm font-bold shadow text-gray-800">← Kembali</button>
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">1/5 Foto</span>
            </div>
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
                <button onClick={() => { setNegoOffer(Math.floor(selectedAd.price * 0.9).toString()); setShowNegoSheet(true); }} className="flex-1 py-3 rounded-xl border border-[#FF5722] text-[#FF5722] font-bold text-sm">🤝 Tawar / Nego</button>
              )}
              <button onClick={() => openWhatsApp(selectedAd)} className="flex-[1.5] py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm shadow-sm">💬 Chat WhatsApp</button>
            </div>
            {showNegoSheet && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <div className="bg-white w-full max-w-md rounded-t-2xl p-5">
                  <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-gray-800">Ajukan Penawaran</h3><button onClick={() => setShowNegoSheet(false)} className="text-gray-400 text-sm">Tutup</button></div>
                  <p className="text-xs text-gray-500 mb-3">Harga penjual: {formatRupiah(selectedAd.price)}</p>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setNegoOffer(Math.floor(selectedAd.price * 0.95).toString())} className="flex-1 py-2 text-xs font-semibold bg-orange-50 text-[#FF5722] rounded-lg border border-orange-200">{formatRupiah(Math.floor(selectedAd.price * 0.95))}</button>
                    <button onClick={() => setNegoOffer(Math.floor(selectedAd.price * 0.9).toString())} className="flex-1 py-2 text-xs font-semibold bg-orange-50 text-[#FF5722] rounded-lg border border-orange-200">{formatRupiah(Math.floor(selectedAd.price * 0.9))}</button>
                    <button onClick={() => setNegoOffer(Math.floor(selectedAd.price * 0.85).toString())} className="flex-1 py-2 text-xs font-semibold bg-orange-50 text-[#FF5722] rounded-lg border border-orange-200">{formatRupiah(Math.floor(selectedAd.price * 0.85))}</button>
                  </div>
                  <input type="number" value={negoOffer} onChange={(e) => setNegoOffer(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold mb-4 text-gray-900" placeholder="Masukkan harga tawaran..." />
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
                      <div key={ad.id} onClick={() => setSelectedAd(ad)} className={`bg-white rounded-xl overflow-hidden shadow-sm border cursor-pointer flex flex-col justify-between ${ad.isPriority ? "border-amber-400 ring-1 ring-amber-300" : "border-gray-100"}`}>
                        <div>
                          <div className="relative aspect-square bg-gray-200">
                            <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                            {ad.isPriority ? <span className="absolute top-1.5 left-1.5 bg-amber-400 text-gray-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded">⚡ PRIORITAS</span> : ad.badge && <span className="absolute top-1.5 left-1.5 bg-[#0194F3] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{ad.badge}</span>}
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
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp Aktif</label>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-gray-100 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600">+62</span>
                      <input type="tel" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="8127000XXXX" className="flex-1 border border-gray-300 rounded-xl px-3 text-sm text-gray-900" />
                    </div>
                    {!otpSent ? (
                      <button onClick={() => waNumber.length >= 9 && setOtpSent(true)} className="w-full py-3 rounded-xl bg-[#0194F3] text-white font-bold text-sm">Kirim Kode OTP WhatsApp</button>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Masukkan 4 Digit Kode OTP</label>
                        <input type="text" maxLength={4} value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Contoh: 1234" className="w-full border border-gray-300 rounded-xl p-3 text-center font-bold tracking-widest mb-3 text-gray-900" />
                        <button onClick={() => otpInput.length === 4 && setIsSellerVerified(true)} className="w-full py-3 rounded-xl bg-[#FF5722] text-white font-bold text-sm">Verifikasi & Lanjut Pasang Iklan</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handlePublishAd} className="bg-white p-5 rounded-2xl shadow-sm space-y-3">
                    <h2 className="text-lg font-extrabold text-gray-800">Pasang Iklan Baru</h2>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Foto Produk (Maks. 500 KB)</label><input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white text-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label><select value={newCategory} onChange={(e) => setNewCategory(e.target.value as Exclude<Category, "semua">)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white text-gray-900"><option value="properti">Properti & Kost</option><option value="otomotif">Otomotif</option><option value="elektronik">Elektronik</option><option value="perkakas">Perkakas Rumah Tangga</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Judul Iklan</label><input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Contoh: Kost AC Sukajadi Dekat Kepri Mall" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Harga (Rp)</label><input type="number" required min={1000} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Contoh: 1200000" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Lokasi Kecamatan</label><select value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white text-gray-900">{BATAM_DISTRICTS.filter((d) => d !== "Semua Batam").map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Iklan</label><textarea rows={4} required value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Jelaskan kondisi barang, fasilitas kost, status surat FTZ/SHM, dll..." className="w-full border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900" /></div>
                    <button type="submit" disabled={isUploading} className="w-full py-3.5 rounded-xl bg-[#FF5722] text-white font-bold text-sm shadow">{isUploading ? "Mengunggah Foto & Menyimpan..." : "Tayangkan Iklan Sekarang"}</button>
                  </form>
                )}
              </div>
            )}

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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
