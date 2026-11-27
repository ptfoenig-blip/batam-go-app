"use client";
import React, { useState, useMemo } from "react";

type Category = "semua" | "properti" | "otomotif" | "elektronik" | "perkakas";

interface AdItem {
  id: string;
  title: string;
  price: number;
  priceUnit?: string;
  category: Exclude<Category, "semua">;
  district: string;
  distanceKm: number;
  badge?: string;
  isPriority?: boolean;
  sellerName: string;
  isVerified: boolean;
  whatsapp: string;
  description: string;
  image: string;
  createdAt: string;
  views: number;
  waClicks: number;
}

const INITIAL_ADS: AdItem[] = [
  {
    id: "1",
    title: "Kost AC Eksklusif Dekat Kepri Mall & Batamindo",
    price: 1200000,
    priceUnit: "/ bln",
    category: "properti",
    district: "Sukajadi, Batam Center",
    distanceKm: 0.65,
    badge: "KOST",
    isPriority: true,
    sellerName: "Ibu Sari",
    isVerified: true,
    whatsapp: "6281270001111",
    description:
      "Kamar mandi dalam, AC, WiFi, parkir motor aman. Dekat Kepri Mall, Batamindo, Politeknik. Kamar bersih, nyaman. Minat survei langsung hubungi WA.",
    image:
      "https://unsplash.com",
    createdAt: "Hari ini",
    views: 890,
    waClicks: 45,
  },
  {
    id: "2",
    title: "Vario 160 ABS 2023 Mulus Pajak Hidup",
    price: 18500000,
    category: "otomotif",
    district: "Batam Center",
    distanceKm: 1.2,
    badge: "FTZ BATAM",
    sellerName: "Budi Motor Batam",
    isVerified: true,
    whatsapp: "6281270002222",
    description:
      "Surat lengkap FTZ Batam, pajak hidup panjang, mesin halus terawat, ban tebal. Siap pakai harian tanpa PR. Lokasi cek unit di Batam Center.",
    image:
      "https://unsplash.com",
    createdAt: "2 jam lalu",
    views: 342,
    waClicks: 18,
  },
  {
    id: "3",
    title: "Kulkas LG 2 Pintu No Frost Ex-Singapura",
    price: 1450000,
    category: "elektronik",
    district: "Lubuk Baja / Nagoya",
    distanceKm: 1.8,
    badge: "BU / PINDAHAN",
    sellerName: "Andi Pratama",
    isVerified: false,
    whatsapp: "6281270003333",
    description:
      "Jual cepat edisi pindahan kerja. Dingin normal, karet pintu rapat, tidak ada karat. Bisa bantu carikan pick-up angkut area Batam.",
    image:
      "https://unsplash.com",
    createdAt: "Kemarin",
    views: 215,
    waClicks: 12,
  },
  {
    id: "4",
    title: "Rumah Minimalis Full Renovasi Tiban Indah",
    price: 450000000,
    category: "properti",
    district: "Tiban, Sekupang",
    distanceKm: 3.4,
    badge: "SHM",
    sellerName: "Rian Property Batam",
    isVerified: true,
    whatsapp: "6281270004444",
    description:
      "Tipe 45/90, 2 kamar tidur, 1 kamar mandi, carport keramik, bebas banjir. Dekat pasar Tiban Center & akses mudah ke Nagoya.",
    image:
      "https://unsplash.com",
    createdAt: "3 hari lalu",
    views: 510,
    waClicks: 29,
  },
  {
    id: "5",
    title: "Set Bor Listrik & Gerinda Bosch Lengkap",
    price: 650000,
    category: "perkakas",
    district: "Batu Aji",
    distanceKm: 4.8,
    badge: "TERAWAT",
    sellerName: "Pak Hendra",
    isVerified: false,
    whatsapp: "6281270005555",
    description:
      "Jarang dipakai, fungsi normal 100%, lengkap dengan koper dan mata bor. Cocok untuk tukang atau keperluan rumah tangga.",
    image:
      "https://unsplash.com",
    createdAt: "4 hari lalu",
    views: 128,
    waClicks: 7,
  },
];

const BATAM_DISTRICTS = [
  "Semua Batam",
  "Sukajadi, Batam Center",
  "Batam Center",
  "Lubuk Baja / Nagoya",
  "Batu Aji",
  "Sagulung",
  "Tiban, Sekupang",
  "Bengkong",
  "Nongsa",
];

const RADIUS_OPTIONS =;

export default function BatamGoApp() {
  const [activeTab, setActiveTab] = useState<
    "home" | "nearby" | "sell" | "ads" | "account"
  >("home");
  const [ads, setAds] = useState<AdItem[]>(INITIAL_ADS);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("semua");
  const [selectedDistrict, setSelectedDistrict] = useState("Semua Batam");
  const [maxRadius, setMaxRadius] = useState<number>(20);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Nego Modal (Otomotif, Elektronik, Perkakas)
  const [showNegoSheet, setShowNegoSheet] = useState(false);
  const [negoOffer, setNegoOffer] = useState<string>("");

  // Seller Verification & Post Ad Form
  const [isSellerVerified, setIsSellerVerified] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<Exclude<Category, "semua">>("properti");
  const [newPrice, setNewPrice] = useState("");
  const [newDistrict, setNewDistrict] = useState("Batam Center");
  const [newDesc, setNewDesc] = useState("");

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  const filteredAds = useMemo(() => {
    return ads
      .filter((ad) => {
        if (selectedCategory !== "semua" && ad.category !== selectedCategory)
          return false;
        if (
          selectedDistrict !== "Semua Batam" &&
          ad.district !== selectedDistrict
        )
          return false;
        if (ad.distanceKm > maxRadius) return false;
        if (minPrice && ad.price < Number(minPrice)) return false;
        if (maxPrice && ad.price > Number(maxPrice)) return false;
        if (
          searchQuery &&
          !ad.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return a.distanceKm - b.distanceKm;
      });
  }, [
    ads,
    selectedCategory,
    selectedDistrict,
    maxRadius,
    minPrice,
    maxPrice,
    searchQuery,
  ]);

  const handlePublishAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newDesc) return;
    const created: AdItem = {
      id: Date.now().toString(),
      title: newTitle,
      price: Number(newPrice),
      priceUnit:
        newCategory === "properti" && newTitle.toLowerCase().includes("kost")
          ? "/ bln"
          : undefined,
      category: newCategory,
      district: newDistrict,
      distanceKm: 0.5,
      badge: newCategory === "otomotif" ? "FTZ BATAM" : "BARU",
      sellerName: "Penjual Batam",
      isVerified: true,
      whatsapp: waNumber
        ? `62${waNumber.replace(/^0/, "")}`
        : "6281270009999",
      description: newDesc,
      image:
        "https://unsplash.com",
      createdAt: "Baru saja",
      views: 1,
      waClicks: 0,
    };
    setAds([created, ...ads]);
    setNewTitle("");
    setNewPrice("");
    setNewDesc("");
    setActiveTab("home");
  };

  const openWhatsApp = (ad: AdItem, customOffer?: string) => {
    const text = customOffer
      ? `Halo, saya lihat iklan *${ad.title}* di BATAM GO. Apakah boleh nego di harga *Rp ${Number(customOffer).toLocaleString("id-ID")}*?`
      : `Halo, saya tertarik dengan iklan *${ad.title}* (${formatRupiah(ad.price)}) di BATAM GO. Apakah masih tersedia?`;
    window.open(
      `https://wa.me{ad.whatsapp}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center select-none">
      {/* Mobile Container Frame */}
      <div className="w-full max-w-md bg-[#F4F6F9] min-h-screen pb-24 relative shadow-xl overflow-x-hidden">
        {/* DETAIL PRODUCT VIEW */}
        {selectedAd ? (
          <div className="bg-white min-h-screen pb-24">
            <div className="relative">
              <img
                src={selectedAd.image}
                alt={selectedAd.title}
                className="w-full h-72 object-cover"
              />
              <button
                onClick={() => setSelectedAd(null)}
                className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold shadow text-gray-800"
              >
                ← Kembali
              </button>
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                1/5 Foto
              </span>
            </div>

            <div className="p-4">
              {selectedAd.badge && (
                <span className="inline-block bg-orange-100 text-[#FF5722] text-[11px] font-bold px-2 py-0.5 rounded mb-1">
                  {selectedAd.badge}
                </span>
              )}
              <div className="text-2xl font-extrabold text-gray-900">
                {formatRupiah(selectedAd.price)}{" "}
                {selectedAd.priceUnit && (
                  <span className="text-sm font-normal text-gray-500">
                    {selectedAd.priceUnit}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-semibold text-gray-800 mt-1 leading-snug">
                {selectedAd.title}
              </h1>
              <p className="text-xs text-gray-500 mt-2">
                📍 {selectedAd.district} •{" "}
                <span className="text-[#0194F3] font-semibold">
                  {selectedAd.distanceKm} km dari Anda
                </span>
              </p>

              {/* Seller Card */}
