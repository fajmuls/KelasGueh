import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased animate-pulse">
      {/* Skeleton Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200" />
            <div className="space-y-1.5 hidden sm:block">
              <div className="h-3.5 w-36 bg-slate-200 rounded-md" />
              <div className="h-2.5 w-48 bg-slate-100 rounded-md" />
            </div>
          </div>

          {/* Quick Search & Actions Right */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-44 sm:w-64 bg-slate-100 rounded-full border border-slate-200/60 hidden sm:block" />
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200/60" />
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="h-8 w-28 bg-slate-200 rounded-xl hidden md:block" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Skeleton Sidebar (Desktop) */}
        <aside className="w-64 shrink-0 hidden lg:block space-y-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-9 w-full bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
        </aside>

        {/* Skeleton Main Dashboard Area */}
        <main className="flex-1 space-y-6">
          {/* Perspective / Greeting Banner */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-72 bg-slate-100 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-slate-100 rounded-lg" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>

          {/* 4 Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { color: 'bg-emerald-100/60' },
              { color: 'bg-indigo-100/60' },
              { color: 'bg-blue-100/60' },
              { color: 'bg-amber-100/60' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
                  <div className={`w-8 h-8 rounded-xl ${item.color}`} />
                </div>
                <div className="h-6 w-32 bg-slate-200 rounded-md" />
                <div className="h-3 w-24 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>

          {/* Content Grid: Left Table & Right Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section: Agenda / Tugas Skeleton (2 cols) */}
            <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="h-4 w-36 bg-slate-200 rounded-md" />
                <div className="h-7 w-20 bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-40 bg-slate-200 rounded-md" />
                        <div className="h-2.5 w-24 bg-slate-100 rounded-md" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-slate-200 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Section: Kas & Pengumuman Skeleton (1 col) */}
            <div className="space-y-6">
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="h-20 w-full bg-slate-100 rounded-xl" />
                <div className="h-8 w-full bg-slate-200 rounded-xl" />
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="h-4 w-32 bg-slate-200 rounded-md" />
                <div className="space-y-2">
                  <div className="h-12 w-full bg-slate-50 rounded-xl border border-slate-100" />
                  <div className="h-12 w-full bg-slate-50 rounded-xl border border-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
