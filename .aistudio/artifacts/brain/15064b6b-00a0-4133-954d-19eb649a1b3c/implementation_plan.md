# implementation_plan.md

## Guided Experience & Dark Theme Polish (v3.19.0)

Adding an interactive guide for new users, enhancing dark mode readability, and improving system stability with graceful error handling.

### User Review & Critical Decisions

> [!IMPORTANT]
> - **Walkthrough Style**: Confirmed as a **Modal Cerita Interaktif** (Story Modal) with doodle illustrations. It triggers once automatically and can be replayed from the "Menu Lainnya".
> - **Dark Mode Contrast**: We will audit and fix "tertumpuk" (clashing) text in Dark Mode by ensuring all text uses the appropriate themed CSS variables.
> - **Error Handling**: Suppressing intrusive console errors for Cloud fetch failures and showing a clear but non-obtrusive "Mode Lokal" status in the navbar.
> - **Menu Cleanup**: The "Pengaturan" button in the hamburger menu will be hidden for Anggota (members) since they have no settings to manage.

---

### 1. Overview & Core Concept

-   **Walkthrough Component**: A step-by-step modal guide that introduces the 4 main pillars: Ringkasan, Buku Kas, Checklist, and Audit Log.
-   **Stable Cloud Sync**: Refactoring fetch logic to fail silently into "Local Mode" without spamming console errors or confusing the user.
-   **Legibility First**: Ensuring the Antique Dark mode is truly usable for bendaharas in low-light environments.

---

### 2. User Experience & Visual Design

-   **Interactive Walkthrough**:
    -   *Trigger*: Automatic on first visit (persisted via `localStorage`).
    -   *UI*: A centralized modal with doodle-style illustrations and friendly "Lanjut" (Next) and "Mulai" (Start) buttons.
    -   *Content*: Concise explanations of what each menu does.
-   **Dark Mode Audit**:
    -   Update `index.css` variables to ensure `--text-main` is high contrast (krem pucat on dark background).
    -   Fix specific cards (e.g. `card-doodle-yellow`, `blue`, etc.) in dark mode to use dark-tinted backgrounds with light text.
-   **Menu Refinement**:
    -   Anggota (Member) view will no longer see "Pengaturan Kelas & Preferensi" in the Hamburger menu.

---

### 3. Key Product Decisions & Trade-Offs

-   **Decision 1: Walkthrough Triggering**
    -   *Chosen Approach*: Auto-trigger once + manual replay.
    -   *Why*: Helps onboarding without being annoying for returning users.
-   **Decision 2: Error Suppression**
    -   *Chosen Approach*: Catch fetch errors and update local state to 'offline' instead of throwing warnings.
    -   *Why*: Improves perceived reliability; the user is told they are in "Mode Lokal" which is accurate and less alarming than a "TypeError".

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────┐
│           AuthContext           │ (Manages roles & user state)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│          ThemeContext           │ (Manages theme-light/sepia/dark)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐      ┌───────────────────────────────┐
│           AppContent            │ ◄─── │      DoodleWalkthrough        │
└───────┬────────────────┬────────┘      └───────────────────────────────┘
        │                │
        ▼                ▼
┌───────────────┐  ┌───────────────┐
│ DoodleNavbar  │  │  Main Views   │ (Ringkasan, Bukukas, etc.)
└───────────────┘  └───────────────┘
```

-   **`localStorage` Key**: `kelasgue_walkthrough_completed_v1` will track if the user has seen the guide.
-   **CSS Variable Update**: Apply `transition-colors duration-300` globally to make theme switches feel premium.
-   **Role logic**: In `DoodleNavbar.tsx`, use `{canEditKas && <SettingsButton />}`.

---

### 5. Implementation Steps

1.  **Step 1**: Create `src/components/Doodle/DoodleWalkthrough.tsx` with multi-step logic.
2.  **Step 2**: Integrate `DoodleWalkthrough` in `App.tsx` and add replay button in `DoodleNavbar.tsx`.
3.  **Step 3**: Update `src/services/supabaseClient.ts` to silent catch fetch errors.
4.  **Step 4**: Update `src/index.css` with dark mode contrast fixes for themed cards.
5.  **Step 5**: Fix role-based visibility in `DoodleNavbar.tsx`.
6.  **Step 6**: Bump version to `v3.19.0` in `src/version.ts`.
