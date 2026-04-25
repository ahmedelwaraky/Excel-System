// ExcelTable.jsx — مكوّن العرض فقط (UI only) — Responsive
import { useState, useRef } from "react";
import LibraryModal  from "../LibraryModal/LibraryModal";
import DetailsModal  from "../DetailsModal/DetailsModal";

// ─── ألوان الـ badges ─────────────────────────────────────
const BADGE_STYLES = {
  "الحالة": {
    "جديد":          "bg-blue-100 text-blue-700",
    "قيد المعالجة": "bg-amber-100 text-amber-700",
    "مكتمل":         "bg-green-100 text-green-700",
    "مؤرشف":         "bg-gray-100 text-gray-500",
  },
  "الأولوية": {
    "عاجل": "bg-red-100 text-red-600",
    "عالي": "bg-orange-100 text-orange-600",
    "عادي": "bg-gray-100 text-gray-500",
  },
  "نوع المكاتبة": {
    "بريد وارد": "bg-blue-50 text-blue-600",
    "بريد صادر": "bg-purple-50 text-purple-600",
    "داخلي":     "bg-teal-50 text-teal-600",
    "تعميم":     "bg-yellow-50 text-yellow-700",
  },
};

const BADGE_COLS = new Set(["نوع المكاتبة", "الحالة", "الأولوية"]);

function safeStr(v) {
  if (v == null) return "";
  if (typeof v === "object") return "";
  return String(v).trim();
}

function AddColModal({ onConfirm, onClose }) {
  const [val, setVal] = useState("");
  const ref = useRef(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-72 p-5 flex flex-col gap-4" dir="rtl">
        <p className="text-sm font-bold text-gray-700">اسم العمود الجديد</p>
        <input
          ref={ref}
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && val.trim()) onConfirm(val.trim());
            if (e.key === "Escape") onClose();
          }}
          placeholder="مثال: الهاتف"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1d6f42] text-right"
        />
        <div className="flex gap-2">
          <button
            onClick={() => val.trim() && onConfirm(val.trim())}
            className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#1d6f42] hover:bg-[#155233] rounded-lg transition-all"
          >
            إضافة
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({ colKey, value }) {
  const str = safeStr(value);
  if (!str) return <span className="text-gray-200 text-xs select-none">—</span>;

  if (BADGE_COLS.has(colKey)) {
    const cls = BADGE_STYLES[colKey]?.[str] || "bg-gray-100 text-gray-500";
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${cls}`}>
        {str}
      </span>
    );
  }
  if (colKey === "رقم المكاتبة") {
    return <span className="text-xs font-mono font-semibold text-gray-700 truncate block">{str}</span>;
  }
  if (colKey === "تاريخ المكاتبة") {
    return <span className="text-[11px] text-gray-500 whitespace-nowrap">{str}</span>;
  }
  return <span className="text-xs text-gray-700 truncate block" title={str}>{str}</span>;
}

// ─── Mobile Card ─────────────────────────────────────────
function MobileCard({ row, index, onClick }) {
  const d = row.row_data || {};

  const typeStyle = BADGE_STYLES["نوع المكاتبة"]?.[safeStr(d["نوع المكاتبة"])] || "bg-gray-100 text-gray-500";
  const statusStyle = BADGE_STYLES["الحالة"]?.[safeStr(d["الحالة"])] || "bg-gray-100 text-gray-500";
  const priorityStyle = BADGE_STYLES["الأولوية"]?.[safeStr(d["الأولوية"])] || "";

  return (
    <div
      onClick={() => onClick(row)}
      className="bg-white border-b border-[#f0f0f0] px-4 py-3 active:bg-[#f6fdf7] transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {safeStr(d["نوع المكاتبة"]) && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeStyle}`}>
              {safeStr(d["نوع المكاتبة"])}
            </span>
          )}
          {safeStr(d["الأولوية"]) && priorityStyle && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityStyle}`}>
              {safeStr(d["الأولوية"])}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {safeStr(d["الحالة"]) && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle}`}>
              {safeStr(d["الحالة"])}
            </span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <path d="M9 18l-6-6 6-6"/>
          </svg>
        </div>
      </div>

      {safeStr(d["الموضوع"]) && (
        <p className="text-sm font-semibold text-gray-800 leading-snug mb-1 line-clamp-2">
          {safeStr(d["الموضوع"])}
        </p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
        {safeStr(d["رقم المكاتبة"]) && (
          <span className="font-mono font-medium text-gray-600">{safeStr(d["رقم المكاتبة"])}</span>
        )}
        {safeStr(d["الجهة الرئيسية"]) && (
          <span>🏢 {safeStr(d["الجهة الرئيسية"])}</span>
        )}
        {safeStr(d["تاريخ المكاتبة"]) && (
          <span>📅 {safeStr(d["تاريخ المكاتبة"])}</span>
        )}
      </div>
    </div>
  );
}

// ─── المكوّن الرئيسي ──────────────────────────────────────
export default function ExcelTable({
  headers      = [],
  rows         = [],
  totalRows    = 0,
  loading      = false,
  saved        = "",
  uploading    = false,
  hasFilter    = false,
  currentUser,
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onUpload,
  onDownload,
}) {
  const [showAddCol, setShowAddCol] = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [detailRow,  setDetailRow]  = useState(null);
  const fileRef = useRef(null);

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white" dir="rtl">
        <div className="h-11 bg-[#f8faf8] border-b border-[#e0e0e0] animate-pulse" />
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#f5f5f5]">
            <div className="w-6 h-3 bg-gray-100 rounded animate-pulse" />
            <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white" dir="rtl">

      {/* Modals */}
      {showAddCol && (
        <AddColModal
          onConfirm={name => { onAddColumn(name); setShowAddCol(false); }}
          onClose={() => setShowAddCol(false)}
        />
      )}
      {showForm && (
        <LibraryModal
          currentUser={currentUser}
          onConfirm={data => { onAddRow(data); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}
      {detailRow && (
        <DetailsModal
          row={detailRow}
          headers={headers}
          onClose={() => setDetailRow(null)}
          onDelete={id => { onDeleteRow(id); setDetailRow(null); }}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f8faf8] border-b border-[#e0e0e0] flex-shrink-0 flex-wrap gap-y-2">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1d6f42] hover:bg-[#155233] rounded-lg transition-all active:scale-95"
        >
          + مكاتبة جديدة
        </button>

        {/* Hide "add column" on very small screens */}
        <button
          onClick={() => setShowAddCol(true)}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all"
        >
          + عمود
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onUpload}
        />

        <div className="flex items-center border border-[#c6d9c6] rounded-lg overflow-hidden">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#1d6f42] bg-white hover:bg-[#f0faf0] transition-all disabled:opacity-50 border-l border-[#c6d9c6]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {uploading ? "جاري الرفع..." : "رفع"}
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#1d6f42] bg-white hover:bg-[#f0faf0] transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            تنزيل
          </button>
        </div>

        <span className="mr-auto text-xs text-gray-400 flex items-center gap-2">
          {hasFilter ? `${rows.length} من ${totalRows}` : `${rows.length} صف`}
          {saved === "saving" && <span className="text-amber-500">● حفظ...</span>}
          {saved === "saved"  && <span className="text-[#1d6f42]">✓</span>}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
            <span className="text-4xl">{hasFilter ? "🔍" : "📋"}</span>
            <span className="text-sm text-gray-400">
              {hasFilter ? "لا توجد نتائج مطابقة" : "لا توجد مكاتبات بعد"}
            </span>
            {!hasFilter && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-1 px-5 py-2 text-xs font-semibold text-white bg-[#1d6f42] rounded-lg hover:bg-[#155233] transition-all"
              >
                + إضافة أول مكاتبة
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Mobile: Card List ── */}
            <div className="md:hidden">
              {rows.map((row) => (
                <MobileCard key={row.id} row={row} onClick={setDetailRow} />
              ))}
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 text-center text-xs text-gray-400 hover:text-[#1d6f42] hover:bg-[#f6fdf7] border-t border-[#f0f0f0] transition-all"
              >
                + إضافة مكاتبة جديدة
              </button>
            </div>

            {/* ── Desktop: Table ── */}
            <table className="hidden md:table w-full border-collapse text-sm" style={{ minWidth: "700px" }}>
              <thead>
                <tr className="bg-[#e8f5e9] border-b-2 border-[#c6d9c6] sticky top-0 z-10">
                  <th className="w-10 px-2 py-2.5 text-[10px] text-gray-400 font-medium border-l border-[#c6d9c6] text-center">#</th>
                  <th className="w-[115px] px-3 py-2.5 text-[11px] font-bold text-[#1d6f42] text-right border-l border-[#c6d9c6]">نوع المكاتبة</th>
                  <th className="w-[95px]  px-3 py-2.5 text-[11px] font-bold text-[#1d6f42] text-right border-l border-[#c6d9c6]">رقم المكاتبة</th>
                  <th className="w-[105px] px-3 py-2.5 text-[11px] font-bold text-[#1d6f42] text-right border-l border-[#c6d9c6]">التاريخ</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-[#1d6f42] text-right border-l border-[#c6d9c6]">الموضوع</th>
                  <th className="w-[130px] px-3 py-2.5 text-[11px] font-bold text-[#1d6f42] text-right border-l border-[#c6d9c6]">الجهة</th>
                  <th className="w-[80px]  px-3 py-2.5 text-[11px] font-bold text-[#1d6f42] text-right border-l border-[#c6d9c6]">الأولوية</th>
                  <th className="w-[105px] px-3 py-2.5 text-[11px] font-bold text-[#1d6f42] text-right border-l border-[#c6d9c6]">الحالة</th>
                  <th className="w-10 border-l border-[#c6d9c6]" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const d = row.row_data || {};
                  return (
                    <tr
                      key={row.id}
                      className="group hover:bg-[#f6fdf7] transition-colors border-b border-[#f0f0f0]"
                    >
                      <td className="text-center text-[11px] text-gray-300 select-none border-l border-[#f0f0f0] py-0 h-10 w-10">{i + 1}</td>
                      <td className="border-l border-[#f0f0f0] px-3 py-0 h-10"><Cell colKey="نوع المكاتبة"   value={d["نوع المكاتبة"]} /></td>
                      <td className="border-l border-[#f0f0f0] px-3 py-0 h-10"><Cell colKey="رقم المكاتبة"   value={d["رقم المكاتبة"]} /></td>
                      <td className="border-l border-[#f0f0f0] px-3 py-0 h-10"><Cell colKey="تاريخ المكاتبة" value={d["تاريخ المكاتبة"]} /></td>
                      <td className="border-l border-[#f0f0f0] px-3 py-0 h-10 max-w-0 overflow-hidden"><Cell colKey="الموضوع" value={d["الموضوع"]} /></td>
                      <td className="border-l border-[#f0f0f0] px-3 py-0 h-10"><Cell colKey="الجهة الرئيسية" value={d["الجهة الرئيسية"]} /></td>
                      <td className="border-l border-[#f0f0f0] px-3 py-0 h-10"><Cell colKey="الأولوية" value={d["الأولوية"]} /></td>
                      <td className="border-l border-[#f0f0f0] px-3 py-0 h-10"><Cell colKey="الحالة" value={d["الحالة"]} /></td>
                      <td className="border-l border-[#f0f0f0] text-center py-0 h-10 w-10">
                        <button
                          onClick={() => setDetailRow(row)}
                          title="عرض التفاصيل"
                          className="w-full h-10 flex items-center justify-center text-gray-300 hover:text-[#1d6f42] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Desktop add row button */}
            <button
              onClick={() => setShowForm(true)}
              className="hidden md:block w-full py-2.5 text-right pr-12 text-xs text-gray-300 hover:text-[#1d6f42] hover:bg-[#f6fdf7] border-t border-[#f0f0f0] transition-all"
            >
              + إضافة مكاتبة جديدة
            </button>
          </>
        )}
      </div>
    </div>
  );
}