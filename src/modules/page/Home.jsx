import React, { useState } from "react";
import ExcelTable from "../components/ExcelPage";
import { useSheets } from "../../hooks/useSheets";

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
          <span className="text-white font-semibold text-sm">
            جدول البيانات
          </span>
        </div>
        <div className="mr-auto flex items-center gap-1.5 text-xs text-green-200 bg-green-800/40 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
          متزامن
        </div>
      </div>

      {/* Ribbon */}
      <div className="bg-[#f8faf8] border-b border-[#c6d9c6] px-6 py-1.5 flex items-center gap-1 flex-shrink-0">
        {["ملف", "تعديل", "عرض", "إدراج"].map((item) => (
          <button
            key={item}
            className="px-3 py-1 text-xs text-gray-600 hover:bg-[#d9ead3] rounded transition-colors"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Table area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden border-x border-[#c6d9c6] bg-white">
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
                  onBlur={(e) => {
                    renameSheet(sheet.id, e.target.value);
                    setEditingSheetId(null);
                  }}
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
                    activeSheetId === sheet.id
                      ? "text-[#1d6f42]"
                      : "text-gray-500"
                  }`}
                >
                  {sheet.name}
                </button>
              )}

              {/* حذف الورقة — بيظهر عند hover */}
              {sheets.length > 1 && (
                <button
                  onClick={() => deleteSheet(sheet.id)}
                  className="opacity-0 group-hover:opacity-100 pl-0 pr-2 py-1.5 text-gray-300 hover:text-red-400 text-xs transition-all"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* إضافة ورقة */}
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
