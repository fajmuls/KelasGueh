# Implementation Plan - Kelas Gue v4.3.3

## 1. Overview & Objectives
This plan covers the comprehensive enhancements requested by the owner for **Kelas Gue v4.3.3**:
1. **Master Admin & Security:** Hide Super Admin menu from non-admin roles; update Hamburger menu to "Pengaturan Pengurus" with sub-options; add Sekretaris role assignment & distinct icons; fix overlapping title text layer on "Ranah Master Admin" banner; add Whitelist table mobile horizontal scroll; unify student management & gender configuration with active/inactive status and database persistence.
2. **Secretary Module & Group Generation:** Replace WhatsApp copy buttons with direct `kirim WA` buttons for staff; upgrade Group Division to connect with Master Admin student DB (respecting active/inactive status and L/P gender); place shuffle button below distribution mode; support 3 to 10 groups; screen-first generation with permanent lock after first generate + reset button.
3. **Kas & Financials:** Minimize top banner padding/spacing across Kas and Secretary views; unify year dropdown in Kas Recap with `DoodleSelect`; ensure monthly/semester dues edits correctly save to database; fix sound effect spamming on Kas Checklist "All" button (play once with unique sound); ensure loading screen waits until database sync is fully complete; compress receipt images for long-term persistence and print binder recap visibility.
4. **Interactive Guided Tour (Onboarding):** Implement a step-by-step interactive onboarding tour with a welcome dialog on first login, guiding users from Hub to Kas to Secretary with skip/start options.
5. **Super Admin Settings & Volume Control:** Add configurable settings (e.g., activity points default = 1 instead of 5, student active status toggle, highlight styling for Audit Log, BGM & SFX volume slider from 0% to 100% stored in localStorage).
6. **UI/Typography Alignment:** Improve font consistency across Hub KPI boxes and headers.

---

## 2. Proposed Changes & File Modifications

### A. Version & Audio Configuration (`src/version.ts`, `src/utils/soundEffects.ts`)
- Bump version to **v4.3.3**.
- Add volume control settings (BGM volume & SFX volume) persisted in `localStorage` and applied to Web Audio API gain nodes.

### B. Navigation & Auth (`src/context/AuthContext.tsx`, `src/components/Doodle/DoodleNavbar.tsx`, `src/App.tsx`)
- Ensure Super Admin view/menu is strictly restricted to Super Admin (`isSuperAdmin`).
- Update Hamburger menu ("Pengaturan Pengurus") with clear links to Bendahara, Sekretaris, and Master Admin settings.
- Update Role Switcher and Account Popover icons and role options.

### C. Master Admin & Student DB (`src/components/Doodle/AdminSettingsView.tsx`, `src/types/kas.ts`)
- Fix CSS layer overlap on "Ranah Master Admin" banner (`relative z-10`).
- Make Whitelist table scrollable horizontally on mobile (`overflow-x-auto`).
- Unify Student Management & Gender settings with active/inactive toggle and database persistence (`isActive` boolean on `KasMember`).
- Expand Super Admin settings: default point value (1 point), audit log color-coding/highlighting, and volume controls.

### D. Secretary & Group Generation (`src/components/Doodle/Secretary/KelompokTab.tsx`, `src/components/Doodle/Secretary/SecretaryHub.tsx`)
- Connect Group Division directly with Master Admin student database (`members`), filtering out inactive students.
- Support group count from 3 to 10.
- Place shuffle button below distribution mode.
- Implement screen-first generation with a permanent lock after first generate and a dedicated reset button.
- Replace WhatsApp copy buttons with direct `kirim WA` action links.

### E. Kas & Financial Modules (`src/components/Doodle/KasOverview.tsx`, `src/components/Doodle/KasBook.tsx`, `src/components/Doodle/KasChecklist.tsx`, `src/components/Doodle/KasRecapView.tsx`, `src/utils/receiptOcr.ts`)
- Reduce top spacing/padding in banner boxes across Kas and Secretary views.
- Unify year dropdown in Kas Recap with `DoodleSelect`.
- Ensure monthly/semester dues updates correctly save to database (`LocalKasRepository.saveSettings`).
- Fix sound effect spamming on Kas Checklist "All" button (play once with unique sound) and ensure loading screen awaits full database sync before closing.
- Compress receipt images (`canvas` downscaling to max 800px width/height, JPEG quality 0.7) for long-term database storage and print binder visibility.

### F. Interactive Guided Tour (`src/components/Doodle/DoodleWalkthrough.tsx`, `src/App.tsx`)
- Implement welcome dialog on first login with option to start interactive tour or skip.
- Step-by-step guidance highlighting Hub, Kas, and Secretary modules.

---

## 3. Verification Plan
1. **Compilation & Linting:** Run `compile_applet` and `lint_applet` to ensure zero TypeScript or syntax errors.
2. **Behavioral Checks:**
   - Verify Super Admin menu restriction.
   - Verify group generation locking and 3-10 group count.
   - Verify receipt compression and long-term storage.
   - Verify BGM & SFX volume slider persistence.
