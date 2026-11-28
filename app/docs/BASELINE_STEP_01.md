# BATAM GO — SOURCE CODE AUDIT & BASELINE (STEP 01 · P0)
- **Official App Name:** BATAM GO
- **Legal Operator:** PT. Mandiri Wahana Makmur (Batam, Kepulauan Riau)
- **Repository:** `ptfoenig-blip/batam-go-app` (Branch: `main`)
- **Production URL:** `https://vercel.app`
- **Baseline Date:** 28 November 2026
- **Baseline Version:** `v1.0.0-baseline`

## 1. File & Module Inventory

| File Path | Role | Status |
| :--- | :--- | :--- |
| `app/layout.tsx` | Root Layout & Metadata | Active (Audit Branding) |
| `app/page.tsx` | User Marketplace UI (5 Tabs, Search, Chat, Sell, QRIS) | Stable (Client State) |
| `app/admin/page.tsx` | Admin Command Center (`/admin`) | Stable (Client State) |
| `app/data.ts` | Data Schema & Batam Districts | Stable |
| `public/qris.png` | Static QRIS Payment Asset | Active |

## 2. Identified Gaps (To Be Resolved in Next Steps)
1. **Persistence:** Migrate `localStorage` ads, chats, reports, and QRIS logs to centralized PostgreSQL (Supabase).
2. **Admin Auth:** Replace client-side PIN (`2026`) with server-verified authentication.
3. **One Object = One Listing:** Add Object DNA fingerprint & ownership proof per category.
4. **Proactive Matching:** Add BATAM RADAR (Smart Wanted) & availability status (`Available`, `Negotiation`, `Reserved`, `Sold`).
5. **PWA/APK Wrapper:** Add `app/manifest.ts` and `public/sw.js`.

## 3. Regression Test Matrix (Baseline PASS Criteria)
- [x] **RT-01:** Homepage loads without login (`browsing tanpa login`).
- [x] **RT-02:** Category filter (Properti, Otomotif, Elektronik, Perkakas, Lainnya) & Batam district filter work.
- [x] **RT-03:** Ad detail opens with photo gallery, safety disclaimer, report modal, and in-app chat (anti-link active).
- [x] **RT-04:** Sell form enforces character limits, Rupiah formatting, FTZ status, and legal checkbox.
- [x] **RT-05:** QRIS modal displays `/qris.png` with 3-digit unique code.
- [x] **RT-06:** `/admin` route renders Admin Command Center without breaking user UI.

## 4. Rollback Procedure
- **GitHub:** Revert commit via `git revert <commit_hash>` or GitHub Web UI -> History -> Revert.
- **Vercel:** Dashboard -> Deployments -> Select previous `Ready` deployment -> Promote to Production.
