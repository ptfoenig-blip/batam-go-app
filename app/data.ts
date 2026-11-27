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
  image: string;
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
    description: "Kamar mandi dalam, AC, WiFi, parkir motor aman. Dekat Kepri Mall & Batamindo.",
    image: "/next.svg",
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
    description: "Surat lengkap FTZ Batam, pajak hidup panjang, mesin halus terawat, ban tebal.",
    image: "/vercel.svg",
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
    description: "Jual cepat edisi pindahan kerja. Dingin normal, karet pintu rapat, tidak ada karat.",
    image: "/next.svg",
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
    description: "Tipe 45/90, 2 kamar tidur, 1 kamar mandi, carport keramik, bebas banjir.",
    image: "/vercel.svg",
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
    description: "Jarang dipakai, fungsi normal 100%, lengkap dengan koper dan mata bor.",
    image: "/next.svg",
    views: 128,
    waClicks: 7,
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
