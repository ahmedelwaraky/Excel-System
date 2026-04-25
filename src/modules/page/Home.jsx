import React, { useState, useEffect } from "react";
import ExcelTable from "../components/ExcelPage";
import { useSheets } from "../../hooks/useSheets";

function StatCard({ label, value, color, icon }) {
  const colors = {
    green:  "bg-[#e8f5e9] text-[#1d6f42] border-[#c6d9c6]",
    blue:   "bg-blue-50   text-blue-700   border-blue-200",
    amber:  "bg-amber-50  text-amber-700  border-amber-200",
    red:    "bg-red-50    text-red-600    border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    gray:   "bg-gray-50   text-gray-600   border-gray-200",
  };
  return (
    <div className={`flex flex-col gap-1 px-3 py-2.5 rounded-xl border ${colors[color]} flex-shrink-0 w-[100px] sm:flex-1 sm:min-w-[90px] sm:w-auto`}>
      <div className="flex items-center justify-between">
        <span className="text-base sm:text-lg font-bold">{value}</span>
        {icon && <span className="text-sm sm:text-base">{icon}</span>}
      </div>
      <span className="text-[10px] sm:text-xs opacity-70 font-medium">{label}</span>
    </div>
  );
}

function FilterItem({ label, count, active, onClick, dot }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-right ${
        active ? "bg-[#1d6f42] text-white font-semibold" : "text-gray-600 hover:bg-[#e8f5e9] hover:text-[#1d6f42]"
      }`}>
      {dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />}
      <span className="flex-1 text-right">{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function SectionTitle({ children }) {
  return <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">{children}</p>;
}

export default function Home({ currentUser, onLogout }) {
  const { sheets, activeSheetId, setActiveSheetId, addSheet, renameSheet, deleteSheet } = useSheets();
  const [editingSheetId, setEditingSheetId] = useState(null);

  // Default sidebar closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  const [filters, setFilters] = useState({
    status: null, priority: null, rowType: null, myRows: false, search: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    "جديد": 0, "قيد المعالجة": 0, "مكتمل": 0, "مؤرشف": 0,
    "عاجل": 0, "بريد وارد": 0, "بريد صادر": 0,
  });

  const isMobile = () => window.innerWidth < 768;

  // Close sidebar on mobile when resizing down
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));
    // Close sidebar on mobile after selecting filter
    if (isMobile()) setSidebarOpen(false);
  }

  function resetFilters() {
    setFilters({ status: null, priority: null, rowType: null, myRows: false, search: "" });
    if (isMobile()) setSidebarOpen(false);
  }

  const initials = currentUser.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2)
    || currentUser.username.slice(0, 2).toUpperCase();

  const hasActiveFilters = filters.status || filters.priority || filters.rowType || filters.myRows || filters.search;

  const SidebarContent = () => (
    <>
      <div className="px-3 pt-3 pb-1">
        <button onClick={resetFilters}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !hasActiveFilters ? "bg-[#1d6f42] text-white" : "text-gray-500 hover:bg-[#e8f5e9] hover:text-[#1d6f42]"
          }`}>
          كل المكاتبات
          <span className={`mr-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${!hasActiveFilters ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
            {stats.total}
          </span>
        </button>
      </div>

      <div className="px-3 pb-1">
        <button onClick={() => { setFilters(p => ({ ...p, myRows: !p.myRows })); if (isMobile()) setSidebarOpen(false); }}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
            filters.myRows ? "bg-[#1d6f42] text-white font-semibold" : "text-gray-600 hover:bg-[#e8f5e9] hover:text-[#1d6f42]"
          }`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M1 11c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          إدخالاتي فقط
        </button>
      </div>

      <div className="mx-3 border-t border-[#e8f0e8]"/>

      <SectionTitle>الحالة</SectionTitle>
      <div className="px-3 flex flex-col gap-0.5">
        {[
          { label: "جديد",         dot: "#3b82f6", key: "جديد" },
          { label: "قيد المعالجة", dot: "#f59e0b", key: "قيد المعالجة" },
          { label: "مكتمل",        dot: "#22c55e", key: "مكتمل" },
          { label: "مؤرشف",        dot: "#9ca3af", key: "مؤرشف" },
        ].map(({ label, dot, key }) => (
          <FilterItem key={key} label={label} dot={dot} count={stats[key]}
            active={filters.status === key} onClick={() => setFilter("status", key)} />
        ))}
      </div>

      <div className="mx-3 border-t border-[#e8f0e8] mt-2"/>

      <SectionTitle>الأولوية</SectionTitle>
      <div className="px-3 flex flex-col gap-0.5">
        {[
          { label: "عاجل", key: "عاجل", count: stats["عاجل"] },
          { label: "عادي", key: "عادي" },
        ].map(({ label, key, count }) => (
          <FilterItem key={key} label={label} count={count}
            active={filters.priority === key} onClick={() => setFilter("priority", key)} />
        ))}
      </div>

      <div className="mx-3 border-t border-[#e8f0e8] mt-2"/>

      <SectionTitle>نوع المكاتبة</SectionTitle>
      <div className="px-3 flex flex-col gap-0.5">
        {[
          { label: "بريد وارد", key: "بريد وارد", count: stats["بريد وارد"] },
          { label: "بريد صادر", key: "بريد صادر", count: stats["بريد صادر"] },
        ].map(({ label, key, count }) => (
          <FilterItem key={key} label={label} count={count}
            active={filters.rowType === key} onClick={() => setFilter("rowType", key)} />
        ))}
      </div>

      <div className="mx-3 border-t border-[#e8f0e8]"/>

      <SectionTitle>الأوراق</SectionTitle>
      <div className="px-3 flex flex-col gap-0.5 pb-3">
        {sheets.map(sheet => (
          <button key={sheet.id} onClick={() => { setActiveSheetId(sheet.id); if (isMobile()) setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-right ${
              activeSheetId === sheet.id ? "bg-[#1d6f42] text-white font-semibold" : "text-gray-600 hover:bg-[#e8f5e9] hover:text-[#1d6f42]"
            }`}>
            {sheet.name}
          </button>
        ))}
        <button onClick={addSheet}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-[#e8f5e9] hover:text-[#1d6f42] transition-all">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          ورقة جديدة
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-[#f0f4f0]" dir="rtl">

      {/* Top Bar */}
      <div className="bg-[#1d6f42] px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 flex-shrink-0 z-20">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-7 h-7 flex flex-col items-center justify-center gap-1 text-white/70 hover:text-white transition-colors flex-shrink-0">
          <span className="block w-4 h-0.5 bg-current rounded"/>
          <span className="block w-4 h-0.5 bg-current rounded"/>
          <span className="block w-4 h-0.5 bg-current rounded"/>
        </button>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5.5" height="5.5" fill="#1d6f42"/>
              <rect x="7.5" y="1" width="5.5" height="5.5" fill="#1d6f42"/>
              <rect x="1" y="7.5" width="5.5" height="5.5" fill="#1d6f42"/>
              <rect x="7.5" y="7.5" width="5.5" height="5.5" fill="#1d6f42"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-xs sm:text-sm hidden xs:block">نظام المكاتبات</span>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              placeholder="🔍 بحث..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/40 transition-all text-right"
            />
            {filters.search && (
              <button onClick={() => setFilters(p => ({ ...p, search: "" }))}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-sm">
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {initials}
            </div>
            <span className="text-white text-xs font-medium hidden md:block">
              {currentUser.full_name || currentUser.username}
            </span>
          </div>
          <button onClick={onLogout} title="تسجيل الخروج"
            className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">

        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — fixed drawer on mobile, inline on desktop */}
        <aside className={`
          flex-shrink-0 bg-white border-l border-[#c6d9c6] flex flex-col overflow-y-auto z-30
          transition-all duration-200
          md:relative md:z-10
          ${sidebarOpen
            ? "fixed top-0 right-0 h-full w-64 pt-14 md:pt-0 md:w-52 md:static"
            : "hidden md:hidden"
          }
        `}>
          <SidebarContent />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Stats — horizontal scroll on mobile */}
          <div className="flex-shrink-0 px-3 sm:px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            <StatCard label="الإجمالي"     value={stats.total}           color="green"  />
            <StatCard label="وارد"          value={stats["بريد وارد"]}    color="blue"   />
            <StatCard label="صادر"          value={stats["بريد صادر"]}    color="purple" />
            <StatCard label="عاجل"          value={stats["عاجل"]}         color="red"    />
            <StatCard label="قيد المعالجة"  value={stats["قيد المعالجة"]} color="amber"  />
            <StatCard label="مكتمل"         value={stats["مكتمل"]}        color="green"  />
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex-shrink-0 px-3 sm:px-4 pb-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#1d6f42] font-medium">فلاتر نشطة:</span>
              {filters.status   && <span className="text-xs bg-[#e8f5e9] text-[#1d6f42] px-2 py-0.5 rounded-full border border-[#c6d9c6]">{filters.status}</span>}
              {filters.priority && <span className="text-xs bg-[#e8f5e9] text-[#1d6f42] px-2 py-0.5 rounded-full border border-[#c6d9c6]">{filters.priority}</span>}
              {filters.rowType  && <span className="text-xs bg-[#e8f5e9] text-[#1d6f42] px-2 py-0.5 rounded-full border border-[#c6d9c6]">{filters.rowType}</span>}
              {filters.myRows   && <span className="text-xs bg-[#e8f5e9] text-[#1d6f42] px-2 py-0.5 rounded-full border border-[#c6d9c6]">إدخالاتي</span>}
              {filters.search   && <span className="text-xs bg-[#e8f5e9] text-[#1d6f42] px-2 py-0.5 rounded-full border border-[#c6d9c6]">"{filters.search}"</span>}
              <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-red-500 transition-colors">مسح الكل ×</button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 flex flex-col overflow-hidden border border-[#c6d9c6] rounded-tl-xl bg-white mx-3 sm:mx-4 mb-0">
            {activeSheetId && (
              <ExcelTable
                sheetId={activeSheetId}
                filters={filters}
                currentUser={currentUser}
                onStatsUpdate={setStats}
              />
            )}
          </div>

          {/* Sheet Tabs */}
          <div className="flex-shrink-0 flex items-center border-t border-[#c6d9c6] bg-[#f0f4f0] overflow-x-auto mx-3 sm:mx-4">
            {sheets.map(sheet => (
              <div key={sheet.id}
                className={`group flex items-center gap-1 border-l border-[#c6d9c6] flex-shrink-0 ${
                  activeSheetId === sheet.id ? "bg-white border-t-2 border-t-[#1d6f42]" : "hover:bg-white/60"
                }`}>
                {editingSheetId === sheet.id ? (
                  <input autoFocus defaultValue={sheet.name}
                    onBlur={e => { renameSheet(sheet.id, e.target.value); setEditingSheetId(null); }}
                    onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setEditingSheetId(null); }}
                    className="px-3 py-1.5 text-xs w-24 bg-white border-none outline-none text-[#1d6f42] font-medium"
                  />
                ) : (
                  <button onClick={() => setActiveSheetId(sheet.id)} onDoubleClick={() => setEditingSheetId(sheet.id)}
                    className={`px-3 sm:px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${activeSheetId === sheet.id ? "text-[#1d6f42]" : "text-gray-500"}`}>
                    {sheet.name}
                  </button>
                )}
                {sheets.length > 1 && (
                  <button onClick={() => deleteSheet(sheet.id)}
                    className="pl-0 pr-2 py-1.5 text-gray-300 hover:text-red-400 text-xs transition-all sm:opacity-0 sm:group-hover:opacity-100">
                    ×
                  </button>
                )}
              </div>
            ))}
            <button onClick={addSheet}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-[#1d6f42] hover:bg-white/60 border-l border-[#c6d9c6] transition-colors flex-shrink-0">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}