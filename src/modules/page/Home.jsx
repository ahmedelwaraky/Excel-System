import React, { useState, useRef, useEffect } from "react";
import ExcelTable from "../components/ExcelPage";
import { useSheets } from "../../hooks/useSheets";
import * as XLSX from "xlsx";

// ── Dropdown Menu Component ───────────────────────────────
function DropdownMenu({ label, items, isOpen, onToggle }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onToggle(false);
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onToggle(!isOpen)}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          isOpen
            ? "bg-[#1d6f42] text-white"
            : "text-gray-600 hover:bg-[#d9ead3]"
        }`}
      >
        {label}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-[#c6d9c6] rounded-lg shadow-lg z-50 min-w-[180px] py-1 overflow-hidden">
          {items.map((item, i) =>
            item === "divider" ? (
              <div key={i} className="my-1 border-t border-[#e8f0e8]" />
            ) : (
              <button
                key={i}
                onClick={() => { item.action(); onToggle(false); }}
                disabled={item.disabled}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-right text-gray-700 hover:bg-[#f0faf0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {item.icon && (
                  <span className="text-[#1d6f42] flex-shrink-0">{item.icon}</span>
                )}
                <span className="flex-1 text-right">{item.label}</span>
                {item.shortcut && (
                  <span className="text-gray-300 text-[10px]">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────
const icons = {
  download: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v7M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  upload: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 8V1M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  print: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="2" y="4" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 4V2h4v2M4 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  row: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  col: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  sheet: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 5h10M5 5v6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  zoom: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 3.5v3M3.5 5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  freeze: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 4h10M1 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
};

// ── Main Component ─────────────────────────────────────────
export default function Home() {
  const {
    sheets,
    activeSheetId,
    setActiveSheetId,
    addSheet,
    renameSheet,
    deleteSheet,
  } = useSheets();

  const [editingSheetId, setEditingSheetId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef(null);
  const tableRef = useRef(null);

  // ── تصدير Excel ──────────────────────────────────────────
  function exportToExcel() {
    const table = document.querySelector("table");
    if (!table) return alert("مفيش بيانات للتصدير");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
    XLSX.writeFile(wb, "export.xlsx");
  }

  // ── طباعة ────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  // ── تكبير / تصغير ────────────────────────────────────────
  function changeZoom(val) {
    const next = Math.min(200, Math.max(50, zoom + val));
    setZoom(next);
    const area = document.querySelector(".table-zoom-area");
    if (area) area.style.zoom = `${next}%`;
  }

  // ── إدراج صف / عمود ──────────────────────────────────────
  // هنبعت event للـ ExcelTable عن طريق custom events
  function dispatchTableEvent(type) {
    window.dispatchEvent(new CustomEvent("excel-action", { detail: { type } }));
  }

  // ── القوائم ───────────────────────────────────────────────
  const menus = [
    {
      label: "ملف",
      items: [
        { label: "تصدير Excel", icon: icons.download, action: exportToExcel, shortcut: "Ctrl+E" },
        { label: "طباعة", icon: icons.print, action: handlePrint, shortcut: "Ctrl+P" },
      ],
    },
    {
      label: "تعديل",
      items: [
        { label: "تحديد الكل", icon: icons.freeze, action: () => {}, shortcut: "Ctrl+A" },
      ],
    },
    {
      label: "عرض",
      items: [
        { label: "تكبير +10%", icon: icons.zoom, action: () => changeZoom(10) },
        { label: "تصغير -10%", icon: icons.zoom, action: () => changeZoom(-10) },
        { label: `إعادة للافتراضي (${zoom}%)`, icon: icons.zoom, action: () => { setZoom(100); const a = document.querySelector(".table-zoom-area"); if (a) a.style.zoom = "100%"; } },
      ],
    },
    {
      label: "إدراج",
      items: [
        { label: "إضافة صف", icon: icons.row, action: () => dispatchTableEvent("addRow") },
        { label: "إضافة عمود", icon: icons.col, action: () => dispatchTableEvent("addColumn") },
        "divider",
        { label: "إضافة ورقة جديدة", icon: icons.sheet, action: addSheet },
      ],
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#f0f4f0]" dir="rtl">
      {/* Top bar */}
      <div className="bg-[#1d6f42] px-6 py-2 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5.5" height="5.5" fill="#1d6f42" />
              <rect x="7.5" y="1" width="5.5" height="5.5" fill="#1d6f42" />
              <rect x="1" y="7.5" width="5.5" height="5.5" fill="#1d6f42" />
              <rect x="7.5" y="7.5" width="5.5" height="5.5" fill="#1d6f42" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">جدول البيانات</span>
        </div>
        <div className="mr-auto flex items-center gap-1.5 text-xs text-green-200 bg-green-800/40 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
          متزامن
        </div>
      </div>

      {/* Ribbon */}
      <div className="bg-[#f8faf8] border-b border-[#c6d9c6] px-6 py-1.5 flex items-center gap-1 flex-shrink-0">
        {menus.map((menu) => (
          <DropdownMenu
            key={menu.label}
            label={menu.label}
            items={menu.items}
            isOpen={openMenu === menu.label}
            onToggle={(val) => setOpenMenu(val ? menu.label : null)}
          />
        ))}

        {/* مؤشر الزووم */}
        {zoom !== 100 && (
          <span className="mr-2 text-xs text-[#1d6f42] font-medium bg-[#d9ead3] px-2 py-0.5 rounded-full">
            {zoom}%
          </span>
        )}
      </div>

      {/* Table area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden border-x border-[#c6d9c6] bg-white table-zoom-area">
          {activeSheetId && <ExcelTable sheetId={activeSheetId} />}
        </div>

        {/* Sheet tabs */}
        <div className="flex items-center border-t border-[#c6d9c6] bg-[#f0f4f0] flex-shrink-0 overflow-x-auto">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`group flex items-center gap-1 border-l border-[#c6d9c6] flex-shrink-0 ${
                activeSheetId === sheet.id
                  ? "bg-white border-t-2 border-t-[#1d6f42]"
                  : "hover:bg-white/60"
              }`}
            >
              {editingSheetId === sheet.id ? (
                <input
                  autoFocus
                  defaultValue={sheet.name}
                  onBlur={(e) => { renameSheet(sheet.id, e.target.value); setEditingSheetId(null); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.target.blur();
                    if (e.key === "Escape") setEditingSheetId(null);
                  }}
                  className="px-3 py-1.5 text-xs w-24 bg-white border-none outline-none text-[#1d6f42] font-medium"
                />
              ) : (
                <button
                  onClick={() => setActiveSheetId(sheet.id)}
                  onDoubleClick={() => setEditingSheetId(sheet.id)}
                  className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                    activeSheetId === sheet.id ? "text-[#1d6f42]" : "text-gray-500"
                  }`}
                >
                  {sheet.name}
                </button>
              )}

              {sheets.length > 1 && (
                <button
                  onClick={() => deleteSheet(sheet.id)}
                  className="pl-0 pr-2 py-1.5 text-gray-300 hover:text-red-400 text-xs transition-all sm:opacity-0 sm:group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addSheet}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-[#1d6f42] hover:bg-white/60 border-l border-[#c6d9c6] transition-colors flex-shrink-0"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}