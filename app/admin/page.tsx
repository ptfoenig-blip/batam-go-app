"use client";
import React, { useState, useEffect } from "react";
import { INITIAL_ADS, AdItem } from "../data";

interface QrisTx {
  id: string;
  seller: string;
  whatsapp: string;
  adTitle: string;
  packageType: string;
  amount: number;
  status: "Menunggu Verifikasi" | "Lunas / Aktif" | "Ditolak";
  time: string;
}

interface AuditEntry {
  id: string;
  action: string;
  target: string;
  time: string;
}

export default function AdminDashboardPage() {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<"overview" | "qris" | "users" | "banners" | "logs">("overview");
  const [ads, setAds] = useState<AdItem[]>(INITIAL_ADS);
  const [bannedWa, setBannedWa] = useState<string[]>(Array.of());
  const [qrisList, setQrisList] = useState<QrisTx[]>(Array.of(
    { id: "TRX-101", seller: "Budi Properti Batam", whatsapp: "6281270001111", adTitle: "Kost Eksklusif AC Batam Center", packageType: "Highlight 30 Hari", amount: 150142, status: "Lunas / Aktif", time: "Hari ini, 14:10" },
    { id: "TRX-102", seller: "Showroom FTZ Nagoya", whatsapp: "6281270002222", adTitle: "Honda Vario 160 FTZ Batam", packageType: "Sundul 7 Hari", amount: 35289, status: "Menunggu Verifikasi", time: "Hari ini, 11:35" }
  ));
  const [logs, setLogs] = useState<AuditEntry[]>(Array.of(
    { id: "LOG-1", action: "Sistem Keamanan Aktif", target: "PT. Mandiri Wahana Makmur", time: "Hari ini, 08:00" }
  ));
  const [searchUser, setSearchUser] = useState("");
  const [priceSundul, setPriceSundul] = useState("35000");
  const [priceHighlight, setPriceHighlight] = useState("150000");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [apkVer, setApkVer] = useState("1.0.0");
  const [apkLink, setApkLink] = useState("https://vercel.app");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("batamgo_ads_v3");
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length) setAds(parsed); }
      const savedBan = localStorage.getItem("batamgo_banned_wa");
      if (savedBan) setBannedWa(JSON.parse(savedBan));
    } catch {}
  }, []);

  const addLog = (action: string, target: string) => {
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setLogs((prev) => Array.of({ id: "LOG-" + Date.now(), action, target, time }, ...prev));
  };

  const fmtRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
  const totalRevenue = qrisList.filter((q) => q.status === "Lunas / Aktif").reduce((acc, q) => acc + q.amount, 0);

  const handleApproveQris = (tx: QrisTx, approve: boolean) => {
    setQrisList((prev) => prev.map((q) => (q.id === tx.id ? { ...q, status: approve ? "Lunas / Aktif" : "Ditolak" } : q)));
    addLog(approve ? "Verifikasi Mutasi QRIS Lunas" : "Tolak Mutasi QRIS", `${tx.id} (${fmtRp(tx.amount)})`);
  };

  const handleTakeDown = (ad: AdItem) => {
    if (!confirm(`Hapus permanen iklan "${ad.title}"?`)) return;
    const next = ads.filter((a) => a.id !== ad.id);
    setAds(next);
    try { localStorage.setItem("batamgo_ads_v3", JSON.stringify(next)); } catch {}
    addLog("Take-Down Iklan Pelanggar", `${ad.title} (+${ad.whatsapp})`);
  };

  const toggleBanUser = (wa: string, sellerName: string) => {
    const isBanned = bannedWa.includes(wa);
    const next = isBanned ? bannedWa.filter((w) => w !== wa) : Array.of(wa, ...bannedWa);
    setBannedWa(next);
    try { localStorage.setItem("batamgo_banned_wa", JSON.stringify(next)); } catch {}
    addLog(isBanned ? "Buka Blokir Akun (Unban)" : "Blokir Permanen Akun (Suspend)", `${sellerName} (+${wa})`);
  };

  const toggleVerifyBadge = (ad: AdItem) => {
    const next = ads.map((a) => (a.id === ad.id ? { ...a, isVerified: !a.isVerified } : a));
    setAds(next);
    try { localStorage.setItem("batamgo_ads_v3", JSON.stringify(next)); } catch {}
    addLog("Ubah Status Centang Biru", `${ad.sellerName} -> ${!ad.isVerified ? "Verified" : "Unverified"}`);
  };

  const exportCsv = (type: "users" | "finance") => {
    const rows = type === "users"
      ? Array.of("Nama Penjual,Nomor WhatsApp,Status Blokir,Judul Iklan,Kecamatan", ...ads.map((a) => `"${a.sellerName}","${a.whatsapp}","${bannedWa.includes(a.whatsapp) ? "DIBLOKIR" : "AKTIF"}","${a.title}","${a.district}"`))
      : Array.of("ID Transaksi,Penjual,WhatsApp,Paket,Nominal,Status,Waktu", ...qrisList.map((q) => `"${q.id}","${q.seller}","${q.whatsapp}","${q.packageType}",${q.amount},"${q.status}","${q.time}"`));
    const blob = new Blob(Array.of(rows.join("\n")), { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = type === "users" ? "database-user-batamgo.csv" : "laporan-keuangan-qris-batamgo.csv";
    a.click();
    addLog("Export Laporan CSV", type === "users" ? "Database User & WA" : "Laporan Keuangan QRIS");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0194F3] text-white font-black text-xl flex items-center justify-center mx-auto">BG</div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Admin Command Center</h1>
            <p className="text-xs text-gray-500">PT. Mandiri Wahana Makmur • Batam</p>
          </div>
          <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (pin === "2026" ? setAuthenticated(true) : alert("PIN salah!"))} placeholder="Masukkan PIN Admin (2026)" className="w-full border border-gray-300 rounded-xl p-3 text-center font-bold tracking-widest text-gray-900" />
          <button onClick={() => (pin === "2026" ? setAuthenticated(true) : alert("PIN Admin salah!"))} className="w-full py-3 rounded-xl bg-[#0194F3] text-white font-bold text-sm">Masuk Dashboard Enterprise</button>
        </div>
      </div>
    );
  }

  const filteredUsers = ads.filter((a) => a.sellerName.toLowerCase().includes(searchUser.toLowerCase()) || a.whatsapp.includes(searchUser) || a.title.toLowerCase().includes(searchUser.toLowerCase()));
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <div className="bg-gray-900 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg">BATAM <span className="bg-[#FF5722] px-1.5 py-0.5 rounded text-xs">GO</span></span>
            <span className="text-xs bg-amber-400 text-gray-900 font-extrabold px-2 py-0.5 rounded">ENTERPRISE ADMIN</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">PT. Mandiri Wahana Makmur • Official WA: +62 813-6332-372</p>
        </div>
        <div className="flex gap-2">
          <a href="/" className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20">↗ Aplikasi User</a>
          <button onClick={() => setAuthenticated(false)} className="px-3 py-1.5 rounded-lg bg-red-600 text-xs font-bold">Keluar</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><div className="text-xs text-gray-500 font-semibold">Total Pengiklan / WA</div><div className="text-2xl font-black text-gray-900 mt-1">{ads.length} Akun</div></div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><div className="text-xs text-gray-500 font-semibold">Akun Diblokir (Ban)</div><div className="text-2xl font-black text-red-600 mt-1">{bannedWa.length} Akun</div></div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><div className="text-xs text-gray-500 font-semibold">Pendapatan QRIS Lunas</div><div className="text-2xl font-black text-emerald-600 mt-1">{fmtRp(totalRevenue)}</div></div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><div className="text-xs text-gray-500 font-semibold">Versi APK Aktif</div><div className="text-2xl font-black text-[#0194F3] mt-1">v{apkVer}</div></div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.of(
            { id: "overview", label: "📊 Ringkasan & Moderasi" },
            { id: "users", label: "📱 User, Verifikasi & Ban" },
            { id: "qris", label: "💳 Keuangan & Tarif QRIS" },
            { id: "banners", label: "📢 Broadcast & Update APK" },
            { id: "logs", label: "📜 Audit Log Admin" }
          ).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap ${tab === t.id ? "bg-[#0194F3] text-white shadow" : "bg-white text-gray-700 border border-gray-200"}`}>{t.label}</button>
          ))}
        </div>

        {(tab === "overview" || tab === "users") && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="font-extrabold text-sm text-gray-800">📱 Database User, Centang Biru & Sanksi Blokir</h2>
              <div className="flex gap-2">
                <input type="text" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Cari nama / WA..." className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs" />
                <button onClick={() => exportCsv("users")} className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold">⬇️ Export User CSV</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                  <tr><th className="p-2.5">Penjual & Status</th><th className="p-2.5">WhatsApp (Admin)</th><th className="p-2.5">Iklan Tayang</th><th className="p-2.5">Tindakan Sanksi & Moderasi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const isBanned = bannedWa.includes(u.whatsapp);
                    return (
                      <tr key={u.id} className={isBanned ? "bg-red-50/60" : ""}>
                        <td className="p-2.5 font-bold text-gray-800">{u.sellerName} {u.isVerified && "✔️"} {isBanned && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded ml-1">DIBLOKIR</span>}</td>
                        <td className="p-2.5 font-mono text-[#0194F3] font-bold">+{u.whatsapp}</td>
                        <td className="p-2.5 text-gray-600">{u.title} ({u.district})</td>
                        <td className="p-2.5 flex flex-wrap gap-1.5">
                          <button onClick={() => toggleVerifyBadge(u)} className="px-2 py-1 rounded bg-blue-50 text-[#0194F3] font-bold text-[10px]">{u.isVerified ? "Cabut ✔️" : "Beri ✔️"}</button>
                          <a href={`https://wa.me{u.whatsapp}?text=${encodeURIComponent(`Halo ${u.sellerName}, Admin BATAM GO (PT. Mandiri Wahana Makmur) menyampaikan teguran/informasi terkait akun Anda.`)}`} target="_blank" className="px-2 py-1 rounded bg-[#25D366] text-white font-bold text-[10px]">💬 Tegur WA</a>
                          <button onClick={() => toggleBanUser(u.whatsapp, u.sellerName)} className={`px-2 py-1 rounded font-bold text-[10px] ${isBanned ? "bg-gray-700 text-white" : "bg-amber-500 text-white"}`}>{isBanned ? "Unban" : "🚫 Blokir WA"}</button>
                          <button onClick={() => handleTakeDown(u)} className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px]">🗑️ Take-Down</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(tab === "overview" || tab === "qris") && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-sm text-gray-800">💳 Verifikasi QRIS (Toko Bang Pardede) & Tarif Layanan</h2>
              <button onClick={() => exportCsv("finance")} className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold">⬇️ Export Keuangan CSV</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              <div><label className="font-bold text-gray-700 block mb-1">Tarif Sundul 7 Hari (Rp)</label><input type="number" value={priceSundul} onChange={(e) => setPriceSundul(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 bg-white" /></div>
              <div><label className="font-bold text-gray-700 block mb-1">Tarif Highlight 30 Hari (Rp)</label><input type="number" value={priceHighlight} onChange={(e) => setPriceHighlight(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 bg-white" /></div>
            </div>
            <div className="space-y-2.5">
              {qrisList.map((tx) => (
                <div key={tx.id} className="p-3.5 rounded-xl border border-gray-200 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2"><span className="text-xs font-extrabold">{tx.id} • {tx.seller}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.status === "Lunas / Aktif" ? "bg-emerald-100 text-emerald-700" : tx.status === "Ditolak" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{tx.status}</span></div>
                    <div className="text-xs text-gray-600">{tx.packageType} — <b>{tx.adTitle}</b> (+{tx.whatsapp})</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm mr-2">{fmtRp(tx.amount)}</span>
                    {tx.status === "Menunggu Verifikasi" && (
                      <>
                        <button onClick={() => handleApproveQris(tx, true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">✅ Cocok Mutasi</button>
                        <button onClick={() => handleApproveQris(tx, false)} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold">✕ Tolak</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "banners" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 text-xs">
              <h2 className="font-extrabold text-sm text-gray-800">📣 Broadcast Pengumuman ke Semua User APK</h2>
              <textarea rows={3} value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Contoh: Waspada penipuan mengatasnamakan admin. Gunakan COD di tempat ramai..." className="w-full border border-gray-300 rounded-xl p-2.5" />
              <button onClick={() => { if (!broadcastMsg.trim()) return; addLog("Kirim Broadcast Pengumuman", broadcastMsg.trim()); alert("Pengumuman broadcast terkirim ke aplikasi pengguna!"); setBroadcastMsg(""); }} className="w-full py-2.5 rounded-xl bg-[#FF5722] text-white font-bold">Kirim Pengumuman Global</button>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 text-xs">
              <h2 className="font-extrabold text-sm text-gray-800">📲 Kontrol Rilis & Force Update APK</h2>
              <div><label className="font-bold block mb-1">Versi APK Terbaru</label><input type="text" value={apkVer} onChange={(e) => setApkVer(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2" /></div>
              <div><label className="font-bold block mb-1">URL Unduh APK / Google Play</label><input type="text" value={apkLink} onChange={(e) => setApkLink(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2" /></div>
              <button onClick={() => { addLog("Update Rilis Versi APK", `v${apkVer}`); alert(`Konfigurasi APK v${apkVer} disimpan!`); }} className="w-full py-2.5 rounded-xl bg-[#0194F3] text-white font-bold">Simpan Versi Rilis</button>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 text-xs">
            <h2 className="font-extrabold text-sm text-gray-800">📜 Audit Log Aktivitas Admin (PT. Mandiri Wahana Makmur)</h2>
            <div className="divide-y divide-gray-100">
              {logs.map((l) => (
                <div key={l.id} className="py-2.5 flex justify-between items-center">
                  <div><span className="font-bold text-gray-800">{l.action}</span> — <span className="text-gray-600">{l.target}</span></div>
                  <span className="text-gray-400 font-mono">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
