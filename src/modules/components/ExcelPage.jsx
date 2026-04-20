import { useEffect, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import bg from "../../assets/images/bg.png";

// ── Custom Modal ──────────────────────────────────────────
function AddColumnModal({ onConfirm, onClose }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleConfirm() {
    if (!value.trim()) {
      setError("من فضلك ادخل اسم العمود");
      return;
    }
    onConfirm(value.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[320px] p-5 flex flex-col gap-4"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e8f5e9] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1v12M1 7h12"
                  stroke="#1d6f42"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              إضافة عمود جديد
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-base"
          >
            ×
          </button>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">اسم العمود</label>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") onClose();
            }}
            placeholder="مثال: الهاتف، العنوان..."
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all text-right ${
              error
                ? "border-red-300 ring-2 ring-red-100"
                : "border-[#c6d9c6] focus:border-[#1d6f42] focus:ring-2 focus:ring-[#1d6f42]/20"
            }`}
          />
          {error && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" />
                <path d="M5 3v2.5M5 7h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {error}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 text-xs font-medium text-white bg-[#1d6f42] hover:bg-[#155233] rounded-lg transition-colors active:scale-95"
          >
            إضافة
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors active:scale-95"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function ExcelTable({ sheetId }) {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setSaveStatus] = useState("");
  const [editingHeader, setEditingHeader] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const channelRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Fetch initial data ────────────────────────────────────
  useEffect(() => {
    if (!sheetId) return;
    async function fetchData() {
      setLoading(true);

      const { data: hData } = await supabase
        .from("excel_headers")
        .select("*")
        .eq("sheet_id", sheetId)
        .limit(1)
        .single();

      if (hData) {
        setHeaders(hData.headers);
      } else {
        const defaultHeaders = ["الاسم", "العمر", "البريد الإلكتروني"];
        await supabase.from("excel_headers").insert({
          headers: defaultHeaders,
          sheet_id: sheetId,
        });
        setHeaders(defaultHeaders);
      }

      const { data: rData } = await supabase
        .from("excel_rows")
        .select("*")
        .eq("sheet_id", sheetId)
        .order("row_order", { ascending: true });

      setRows(rData || []);
      setLoading(false);
    }
    fetchData();
  }, [sheetId]);

  // ── Real-time subscriptions ───────────────────────────────
  useEffect(() => {
    if (!sheetId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`sheet-${sheetId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "excel_rows", filter: `sheet_id=eq.${sheetId}` },
        (payload) => {
          setRows((prev) => {
            if (prev.find((r) => r.id === payload.new.id)) return prev;
            return [...prev, payload.new].sort((a, b) => a.row_order - b.row_order);
          });
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "excel_rows", filter: `sheet_id=eq.${sheetId}` },
        (payload) => {
          setRows((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "excel_rows", filter: `sheet_id=eq.${sheetId}` },
        (payload) => {
          setRows((prev) => prev.filter((r) => r.id !== payload.old.id));
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "excel_headers", filter: `sheet_id=eq.${sheetId}` },
        (payload) => {
          setHeaders(payload.new.headers);
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [sheetId]);

  // ── Listen to ribbon actions ──────────────────────────────
  useEffect(() => {
    function handleAction(e) {
      if (e.detail.type === "addRow") addRow();
      if (e.detail.type === "addColumn") setShowAddColumn(true);
    }
    window.addEventListener("excel-action", handleAction);
    return () => window.removeEventListener("excel-action", handleAction);
  }, [headers, rows]);

  // ── Upload Excel ──────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadProgress(0);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rawData.length) {
        alert("الملف فاضي أو مش متعرفش قراءته");
        setUploading(false);
        return;
      }

      const newHeaders = Object.keys(rawData[0]).map(String);
      setHeaders(newHeaders);
      await supabase.from("excel_headers").update({ headers: newHeaders }).eq("sheet_id", sheetId);
      await supabase.from("excel_rows").delete().eq("sheet_id", sheetId);
      setRows([]);

      const CHUNK = 20;
      const total = rawData.length;
      let inserted = [];

      for (let i = 0; i < total; i += CHUNK) {
        const chunk = rawData.slice(i, i + CHUNK).map((r, idx) => ({
          sheet_id: sheetId,
          row_order: i + idx,
          row_data: Object.fromEntries(newHeaders.map((h) => [h, String(r[h] ?? "")])),
        }));

        const { data } = await supabase.from("excel_rows").insert(chunk).select();
        if (data) { inserted = [...inserted, ...data]; setRows([...inserted]); }
        setUploadProgress(Math.round(((i + CHUNK) / total) * 100));
      }

      setUploadProgress(100);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  // ── Actions ───────────────────────────────────────────────
  async function addRow() {
    const rowData = {};
    headers.forEach((h) => (rowData[h] = ""));
    const { data } = await supabase
      .from("excel_rows")
      .insert({ row_data: rowData, row_order: rows.length, sheet_id: sheetId })
      .select()
      .single();
    if (data) {
      setRows((prev) => {
        if (prev.find((r) => r.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  }

  const saveHeaders = useCallback(
    async (newHeaders) => {
      setSaveStatus("saving");
      await supabase.from("excel_headers").update({ headers: newHeaders }).eq("sheet_id", sheetId);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    },
    [sheetId],
  );

  async function addColumn(name) {
    if (headers.includes(name)) {
      alert("العمود موجود بالفعل");
      return;
    }
    const newHeaders = [...headers, name];
    setHeaders(newHeaders);
    await saveHeaders(newHeaders);
    const updates = rows.map((r) =>
      supabase.from("excel_rows").update({ row_data: { ...r.row_data, [name]: "" } }).eq("id", r.id),
    );
    await Promise.all(updates);
    setRows((prev) => prev.map((r) => ({ ...r, row_data: { ...r.row_data, [name]: "" } })));
  }

  async function updateCell(id, field, value) {
    setRows((prev) =>
      prev.map((r) => r.id === id ? { ...r, row_data: { ...r.row_data, [field]: value } } : r),
    );
    const row = rows.find((r) => r.id === id);
    await supabase.from("excel_rows").update({ row_data: { ...row.row_data, [field]: value } }).eq("id", id);
  }

  async function deleteRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("excel_rows").delete().eq("id", id);
  }

  async function deleteColumn(col) {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((h) => h !== col);
    setHeaders(newHeaders);
    await saveHeaders(newHeaders);
    const updates = rows.map((r) => {
      const { [col]: _, ...rest } = r.row_data;
      return supabase.from("excel_rows").update({ row_data: rest }).eq("id", r.id);
    });
    await Promise.all(updates);
    setRows((prev) => prev.map((r) => { const { [col]: _, ...rest } = r.row_data; return { ...r, row_data: rest }; }));
  }

  async function renameColumn(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const newHeaders = headers.map((h) => (h === oldName ? newName.trim() : h));
    setHeaders(newHeaders);
    await saveHeaders(newHeaders);
    const updates = rows.map((r) => {
      const { [oldName]: val, ...rest } = r.row_data;
      return supabase.from("excel_rows").update({ row_data: { ...rest, [newName.trim()]: val } }).eq("id", r.id);
    });
    await Promise.all(updates);
    setRows((prev) => prev.map((r) => {
      const { [oldName]: val, ...rest } = r.row_data;
      return { ...r, row_data: { ...rest, [newName.trim()]: val } };
    }));
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white" dir="rtl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#c6d9c6] bg-[#f8faf8]">
          {[1, 2].map((i) => <div key={i} className="h-7 w-24 bg-gray-200 rounded-md animate-pulse" />)}
          <div className="mr-auto h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-[#e8f0e8]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              {[1, 2, 3].map((j) => <div key={j} className="h-4 bg-gray-100 rounded animate-pulse flex-1" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── UI ────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white" dir="rtl">
      {/* Modal */}
      {showAddColumn && (
        <AddColumnModal
          onConfirm={(name) => { addColumn(name); setShowAddColumn(false); }}
          onClose={() => setShowAddColumn(false)}
        />
      )}

      {/* Upload progress bar */}
      {uploading && (
        <div className="w-full h-1 bg-gray-100">
          <div className="h-1 bg-[#1d6f42] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#f8faf8] border-b border-[#c6d9c6] flex-shrink-0">
        <button
          onClick={addRow}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-[#d9ead3] border border-[#c6d9c6] rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          إضافة صف
        </button>

        <button
          onClick={() => setShowAddColumn(true)}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-[#d9ead3] border border-[#c6d9c6] rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          إضافة عمود
        </button>

        {/* رفع Excel */}
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1d6f42] bg-white hover:bg-[#d9ead3] border border-[#1d6f42] rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-40"
        >
          {uploading ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-[#1d6f42] border-t-transparent animate-spin" />
              {uploadProgress}%
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 8V1M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              رفع Excel
            </>
          )}
        </button>

        <div className="mr-auto flex items-center gap-2">
          {status === "saving" && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              جاري الحفظ...
            </span>
          )}
          {status === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-[#1d6f42]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              تم الحفظ
            </span>
          )}
          {status === "" && (
            <span className="text-xs text-gray-400">
              {rows.length} {rows.length === 1 ? "صف" : "صفوف"}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#e8f5e9] border-b border-[#c6d9c6]">
              <th className="w-10 min-w-[40px] sticky top-0 z-10 bg-[#e8f5e9] border-l border-[#c6d9c6]" />

              {headers.map((h) => (
                <th key={h} className="min-w-[140px] sticky top-0 z-10 bg-[#e8f5e9] border-l border-[#c6d9c6] p-0 group/col">
                  <div className="flex items-center">
                    {editingHeader === h ? (
                      <input
                        autoFocus
                        defaultValue={h}
                        onBlur={(e) => { renameColumn(h, e.target.value); setEditingHeader(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                          if (e.key === "Escape") setEditingHeader(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-semibold bg-white text-[#1d6f42] border-none outline-none ring-2 ring-inset ring-[#1d6f42] text-right"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => setEditingHeader(h)}
                        title="اضغط مرتين للتعديل"
                        className="flex-1 px-3 py-2 text-xs font-semibold text-[#2d7a4f] cursor-pointer select-none truncate hover:text-[#1d6f42] transition-colors text-right"
                      >
                        {h}
                      </span>
                    )}
                    <button
                      onClick={() => deleteColumn(h)}
                      className="opacity-0 group-hover/col:opacity-100 px-1.5 py-2 text-gray-300 hover:text-red-400 text-sm transition-all duration-150 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}

              <th className="w-10 min-w-[40px] sticky top-0 z-10 bg-[#e8f5e9]" />
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e8f0e8]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 2} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="2" y="2" width="14" height="14" rx="2" stroke="#1d6f42" strokeWidth="1.2" />
                        <path d="M6 9h6M9 6v6" stroke="#1d6f42" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">لا توجد بيانات بعد</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={addRow} className="text-xs text-[#1d6f42] hover:text-[#155233] font-medium transition-colors">
                        أضف أول صف
                      </button>
                      <span className="text-gray-300">أو</span>
                      <button onClick={() => fileInputRef.current?.click()} className="text-xs text-[#1d6f42] hover:text-[#155233] font-medium transition-colors">
                        ارفع ملف Excel
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr key={row.id} className="group/row hover:bg-[#f0faf0] transition-colors duration-100">
                  <td className="w-10 text-center text-xs text-gray-300 bg-[#f8faf8] border-l border-[#e8f0e8] select-none py-2 group-hover/row:text-gray-400 transition-colors">
                    {ri + 1}
                  </td>

                  {headers.map((h) => (
                    <td key={h} className="border-l border-[#e8f0e8] p-0">
                      <input
                        value={row.row_data?.[h] || ""}
                        onChange={(e) => updateCell(row.id, h, e.target.value)}
                        placeholder="—"
                        className="w-full h-9 px-3 text-sm text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-200 focus:bg-[#f0faf0] focus:ring-2 focus:ring-inset focus:ring-[#1d6f42] transition-all text-right"
                      />
                    </td>
                  ))}

                  <td className="w-10 text-center">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="w-full h-9 text-gray-200 hover:text-red-400 text-base transition-colors opacity-0 group-hover/row:opacity-100"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {rows.length > 0 && (
          <button
            onClick={addRow}
            className="w-full py-2 pr-12 text-right text-xs text-gray-300 hover:text-[#1d6f42] hover:bg-[#f0faf0] border-t border-[#e8f0e8] transition-all duration-150"
          >
            + إضافة صف
          </button>
        )}
      </div>
    </div>
  );
}