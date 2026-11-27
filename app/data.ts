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

const makeCardImg = (bg: string, emoji: string, label: string) =>
  `data:image/svg+xml;utf8,<svg xmlns="http://w3.org" width="400" height="400"><rect width="400" height="400" fill="${encodeURIComponent(bg)}"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" font-size="90">${emoji}</text><text x="50%" y="68%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="22" fill="%23334155">${encodeURIComponent(label)}</text></svg>`;

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
    image: makeCardImg("#DBEAFE", "🏠", "KOST AC SUKAJADI"),
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
    image: makeCardImg("#FFEDD5", "🏍️", "VARIO 160 FTZ"),
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
    image: makeCardImg("#E0F2FE", "❄️", "KULKAS LG 2 PINTU"),
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
    image: makeCardImg("#DCFCE7", "🏡", "RUMAH TIBAN SHM"),
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
    image: makeCardImg("#FEF3C7", "🛠️", "SET BOR BOSCH"),
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
