# Implementation Plan: Split Bill Event Calculator & Mobile UX / Bug Fix Overhaul

1-2 concise sentences summarizing the goal:
Integrate a dedicated Split Bill Event Calculator for class activities, streamline navigation banner redirects, add an interactive Data Export Table Preview modal, fix printable binder signature layouts, and resolve Checklist Iuran scroll locking, touch latency, and double-balance calculation bugs.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1 clarification:

- **Confirmed Decision 1 (Split Bill Calculator Placement)**: Accessible via quick trigger in both Ringkasan Kas & Buku Kas, featuring an instant option to log the calculated event expense directly into Buku Kas.
- **Confirmed Decision 2 (Data Export Preview)**: Replaces direct downloads with a clean, interactive **Export Preview Modal** showing formatted table rows, total debit/credit summaries, and final download/sheets buttons.
- **Confirmed Decision 3 (Printable Signature & Attestation Block)**:
  - Super Admin Role: Labeled as **"Mengetahui & Menyetujui: Super Admin"** with wet signature name `M. Rahman FM`.
  - Bendahara Role: Labeled as **"Dibuat dengan sebenarnya oleh: Bendahara Umum Kelas"**.
- **Confirmed Decision 4 (Checklist Iuran Bug Fixes)**:
  - Scroll Lock: Isolates touch gestures inside the table container so mobile scrolling moves only the table without shifting the page background.
  - Balance Calculation: Unifies balance logic with Ringkasan Kas (single source of truth) to eliminate double-counting.

---

## 1. Overview & Core Concept

This update elevates "Kelas Gue" with a powerful **Kalkulator Split Bill Acara Kelas** (Event Expense Split Calculator) allowing treasurers to calculate event costs per student, track contributors, and log expenses in 1 click. Furthermore, it fixes remaining mobile UX friction points: direct redirects from Ringkasan banner buttons, single-icon button cleanup, export data previewing, full responsive mobile print views, and table scroll isolation in Checklist Iuran.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ Ringkasan Kas / Buku Kas ]
      │
      ├─► Tap "Kalkulator Split Bill" ──► [ Split Bill Modal ]
      │                                       │
      │                                       ├─ Input Total Biaya & Siswa
      │                                       └─ Tap "Simpan ke Buku Kas"
      │
      ├─► Tap "Catat Transaksi" ────────► Navigates to Buku Kas & Opens Form
      │
      ├─► Tap "Ekspor CSV" ─────────────► [ Modal Pratinjau Ekspor ]
      │                                       │
      │                                       └─ Review Rows ──► Download
      │
      └─► Tap "Cetak / PDF" ────────────► [ Printable Binder Preview Modal ]
                                              │
                                              └─ Responsive Full View &
                                                 Official Signatures
```

### Visual Identity & Theme
- **Doodle Art Paper Language**: Off-white paper background (`#FAF7F2`), 2px solid slate-900 outlines, offset drop shadows (`shadow-[2px_2px_0px_#1E293B]`), tape accents (ScotchTape), and Bricolage Grotesque display headers.
- **Touch Ergonomics**: All new triggers, inputs, and list rows maintain $\ge 44 \times 44\text{px}$ hitboxes for mobile one-handed ease.

---

## 3. Key Product Decisions & Trade-Offs

- **Split Bill Direct Log Strategy**:
  - *Chosen Approach*: Allow treasurers to calculate split amounts and optionally save the total event expense directly to Buku Kas as an expense item with auto-generated item notes.
  - *Why*: Reduces manual re-entry and human error.
- **Checklist Table Scroll Isolation**:
  - *Chosen Approach*: Apply `touch-action: pan-x pan-y` on the scrollable container and lock body scroll (`overflow-hidden`) during active table touch events on mobile.
  - *Why*: Prevents page background rubber-banding and lag on 360px–390px screens.
- **Single Source Balance Calculation**:
  - *Chosen Approach*: Derive balance strictly from `transactions` array via `LocalKasRepository` rather than adding dues income twice.
  - *Why*: Ensures 100% mathematical consistency across Ringkasan, Buku Kas, and Checklist Iuran views.

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           React App & State                             │
├───────────────────────────────────────┬─────────────────────────────────┤
│           DoodleNavbar                │      DoodleDialogContainer      │
│  (Header, Tab Bar, Menu Lainnya)     │  (Toasts, Confirm, Prompt)      │
└───────────────────┬───────────────────┴─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Tab Navigation                               │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│  Ringkasan   │   Buku Kas   │  Checklist   │  Audit Log   │ Pengaturan  │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────────┴─────────────┘
       │              │              │
       ├──────────────┼──────────────┴──────────────────────────┐
       ▼              ▼                                         ▼
┌──────────────┬──────────────┐                     ┌─────────────────────┐
│ Banner Action│  Split Bill  │                     │ Checklist Iuran     │
│ Directing    │  Calculator  │                     │ • Scroll Isolated   │
│ & Modals     │  Modal       │                     │ • Single Balance    │
└──────────────┴──────────────┘                     │ • Instant Toggle    │
                                                    └─────────────────────┘
```

### Interactive Component Mapping

1. **`src/components/Doodle/SplitBillModal.tsx`**:
   - New component calculating total event expense, participating student count, per-student share, and 1-click "Simpan ke Buku Kas".
2. **`src/components/Doodle/ExportPreviewModal.tsx`**:
   - New component rendering interactive formatted table preview before downloading CSV or opening Google Sheets guide.
3. **`src/components/Doodle/KasOverview.tsx`**:
   - Redirect handler for banner buttons: `Catat Transaksi` switches tab to `bukukas` and opens modal; `Cetak / PDF` opens printable binder modal; `Rekap WA` opens WhatsApp recap modal.
4. **`src/components/Doodle/KasBook.tsx`**:
   - Remove redundant `Atur` button.
   - Clean single-icon on `Catat Transaksi` button.
   - Integrate `ExportPreviewModal` trigger.
5. **`src/components/Doodle/PrintableBinderModal.tsx`**:
   - Responsive scaling for mobile viewport previews.
   - Signature block update: "Mengetahui & Menyetujui: Super Admin" (`M. Rahman FM`) and "Dibuat dengan sebenarnya oleh: Bendahara Umum Kelas".
6. **`src/components/Doodle/KasChecklist.tsx`**:
   - Fix table scroll lock (`touch-action: pan-x pan-y`, body scroll containment).
   - Fix double-balance calculation by computing income directly from transactions.
   - Optimize checkbox click handler for zero tap latency.
