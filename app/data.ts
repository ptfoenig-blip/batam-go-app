export type Category = "semua" | "properti" | "otomotif" | "elektronik" | "perkakas";

export interface AdItem {
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
  image: string;   images?: string[];
  views: number;
  waClicks: number;
}

export const INITIAL_ADS: AdItem[] = [
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
    description: "Kamar mandi dalam, AC, kasur, lemari, meja kerja, WiFi, parkir motor aman. Dekat Kepri Mall & Batamindo.",
    image: "/kost.jpg",
    views: 890,
    waClicks: 45,
  },
  {
    id: "2",
    title: "Honda Scoopy Prestige Hijau 2023 Mulus Pajak Hidup",
    price: 16800000,
    category: "otomotif",
    district: "Batam Center",
    distanceKm: 1.1,
    badge: "FTZ BATAM",
    sellerName: "Budi Motor Batam",
    isVerified: true,
    whatsapp: "6281270002222",
    description: "Surat lengkap FTZ Batam, pajak hidup panjang, mesin halus terawat, ban tebal, siap pakai harian.",
    image: "/motor.jfif",
    views: 412,
    waClicks: 24,
  },
  {
    id: "3",
    title: "Mobil Listrik BYD Atto 1 / Dolphin Mulus Siap Pakai",
    price: 235000000,
    category: "otomotif",
    district: "Sukajadi, Batam Center",
    distanceKm: 1.5,
    badge: "FTZ BATAM",
    sellerName: "Rizky Auto Batam",
    isVerified: true,
    whatsapp: "6281270003333",
    description: "Kondisi istimewa seperti baru, baterai sehat, interior bersih, surat lengkap FTZ Batam. Siap cek unit.",
    image: "/mobil.jfif",
    views: 620,
    waClicks: 31,
  },
  {
    id: "4",
    title: "HP Oppo A5s RAM 3/32GB Normal Mulus Siap Pakai",
    price: 750000,
    category: "elektronik",
    district: "Lubuk Baja / Nagoya",
    distanceKm: 1.9,
    badge: "NORMAL 100%",
    sellerName: "Andi Cell Nagoya",
    isVerified: true,
    whatsapp: "6281270004444",
    description: "Layar jernih, baterai awet, sidik jari dan kamera normal semua, kelengkapan unit + charger.",
    image: "/handphone.jfif",
    views: 285,
    waClicks: 19,
  },
  {
    id: "5",
    title: "Kulkas 1 Pintu Hisense 151L Dingin Cepat Hemat Listrik",
    price: 1150000,
    category: "elektronik",
    district: "Bengkong",
    distanceKm: 2.6,
    badge: "BU / PINDAHAN",
    sellerName: "Dina Pratama",
    isVerified: false,
    whatsapp: "6281270005555",
    description: "Jual cepat edisi pindahan kerja. Dingin normal, freezer cepat beku, karet pintu rapat, bersih terawat.",
    image: "/kulkas.jfif",
    views: 215,
    waClicks: 12,
  },
  {
    id: "6",
    title: "Rumah Minimalis Modern Siap Huni Tiban Indah",
    price: 465000000,
    category: "properti",
    district: "Tiban, Sekupang",
    distanceKm: 3.4,
    badge: "SHM",
    sellerName: "Rian Property Batam",
    isVerified: true,
    whatsapp: "6281270006666",
    description: "Desain modern plafon tinggi, carport luas, bebas banjir, dekat pasar Tiban Center & akses mudah ke Nagoya.",
    image: "/rumah.jfif",
    views: 540,
    waClicks: 33,
  },
];

export const BATAM_DISTRICTS = [
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
