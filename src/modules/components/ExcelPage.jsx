import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import LibraryModal from "../LibraryModal/LibraryModal";
// import LibraryModal from "./LibraryModal";

// ── Config ────────────────────────────────────────────────
const DROPDOWNS = {
  "نوع المكاتبة": ["بريد وارد", "بريد صادر", "داخلي", "تعميم"],
  الحالة: ["جديد", "قيد المعالجة", "مكتمل", "مؤرشف"],
  الأولوية: ["عاجل", "عالي", "عادي"],
  التصنيف: ["إداري", "مالي", "قانوني", "تقني", "أخرى"],
};

const DEFAULT_HEADERS = [
  "نوع المكاتبة",
  "رقم المكاتبة",
  "تاريخ المكاتبة",
  "تاريخ الاستلام",
  "الموضوع",
  "الجهة الرئيسية",
  "الجهة الفرعية",
  "رقم الحفظ",
  "الأولوية",
  "الحالة",
  "التصنيف",
  "المسؤول",
  "عدد المرفقات",
  "ملاحظات",
];

const BADGES = {
  الحالة: {
    جديد: "bg-blue-100 text-blue-700",
    "قيد المعالجة": "bg-amber-100 text-amber-700",
    مكتمل: "bg-green-100 text-green-700",
    مؤرشف: "bg-gray-100 text-gray-500",
  },
  الأولوية: {
    عاجل: "bg-red-100 text-red-600",
    عالي: "bg-orange-100 text-orange-600",
    عادي: "bg-gray-100 text-gray-500",
  },
  "نوع المكاتبة": {
    "بريد وارد": "bg-blue-50 text-blue-600",
    "بريد صادر": "bg-purple-50 text-purple-600",
    داخلي: "bg-teal-50 text-teal-600",
    تعميم: "bg-yellow-50 text-yellow-700",
  },
};

// ── Add Column Modal ──────────────────────────────────────
function AddColModal({ onConfirm, onClose }) {
  const [val, setVal] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-72 p-4 flex flex-col gap-3"
        dir="rtl"
      >
        <span className="text-sm font-semibold text-gray-700">
          اسم العمود الجديد
        </span>
        <input
          ref={ref}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) onConfirm(val.trim());
            if (e.key === "Escape") onClose();
          }}
          placeholder="مثال: الهاتف"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded outline-none focus:border-[#1d6f42] text-right"
        />
        <div className="flex gap-2">
          <button
            onClick={() => val.trim() && onConfirm(val.trim())}
            className="flex-1 py-1.5 text-xs font-medium text-white bg-[#1d6f42] hover:bg-[#155233] rounded"
          >
            إضافة
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function ExcelTable({
  sheetId,
  filters = {},
  currentUser,
  onStatsUpdate,
}) {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");
  const [editingHeader, setEH] = useState(null);
  const [editingCell, setEC] = useState(null);
  const [showAddCol, setAddCol] = useState(false);
  const [showForm, setForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const channelRef = useRef(null);
  const fileRef = useRef(null);

  // ── Load data ──────────────────────────────────────────
  useEffect(() => {
    if (!sheetId) return;
    setLoading(true);

    (async () => {
      // Headers
      const { data: hData, error: hErr } = await supabase
        .from("excel_headers")
        .select("*")
        .eq("sheet_id", sheetId)
        .limit(1)
        .maybeSingle();

      if (hErr) {
        alert("خطأ: " + hErr.message);
        setLoading(false);
        return;
      }

      if (hData) {
        setHeaders(hData.headers);
      } else {
        const { error } = await supabase
          .from("excel_headers")
          .insert({ headers: DEFAULT_HEADERS, sheet_id: sheetId });
        if (error) {
          alert("خطأ: " + error.message);
          setLoading(false);
          return;
        }
        setHeaders(DEFAULT_HEADERS);
      }

      // Rows
      const { data: rData, error: rErr } = await supabase
        .from("excel_rows")
        .select("*")
        .eq("sheet_id", sheetId)
        .order("row_order");
      if (rErr) alert("خطأ في تحميل البيانات: " + rErr.message);
      setRows(rData || []);
      setLoading(false);
    })();
  }, [sheetId]);

  // ── Stats ──────────────────────────────────────────────
  useEffect(() => {
    if (!onStatsUpdate) return;
    const s = {
      total: rows.length,
      جديد: 0,
      "قيد المعالجة": 0,
      مكتمل: 0,
      مؤرشف: 0,
      عاجل: 0,
      "بريد وارد": 0,
      "بريد صادر": 0,
    };
    rows.forEach((r) => {
      const d = r.row_data || {};
      if (s[d["الحالة"]] !== undefined) s[d["الحالة"]]++;
      if (d["الأولوية"] === "عاجل") s["عاجل"]++;
      if (s[d["نوع المكاتبة"]] !== undefined) s[d["نوع المكاتبة"]]++;
    });
    onStatsUpdate(s);
  }, [rows, onStatsUpdate]);

  // ── Filter ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = rows;
    if (filters.search)
      r = r.filter((x) =>
        Object.values(x.row_data || {}).some((v) =>
          String(v).toLowerCase().includes(filters.search.toLowerCase()),
        ),
      );
    if (filters.status)
      r = r.filter((x) => x.row_data?.["الحالة"] === filters.status);
    if (filters.priority)
      r = r.filter((x) => x.row_data?.["الأولوية"] === filters.priority);
    if (filters.rowType)
      r = r.filter((x) => x.row_data?.["نوع المكاتبة"] === filters.rowType);
    if (filters.myRows)
      r = r.filter((x) => x.created_by === currentUser?.username);
    return r;
  }, [rows, filters, currentUser]);

  // ── Realtime ───────────────────────────────────────────
  useEffect(() => {
    if (!sheetId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`sheet-${sheetId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "excel_rows",
          filter: `sheet_id=eq.${sheetId}`,
        },
        (p) =>
          setRows((prev) =>
            prev.find((r) => r.id === p.new.id) ? prev : [...prev, p.new],
          ),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "excel_rows",
          filter: `sheet_id=eq.${sheetId}`,
        },
        (p) =>
          setRows((prev) => prev.map((r) => (r.id === p.new.id ? p.new : r))),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "excel_rows",
          filter: `sheet_id=eq.${sheetId}`,
        },
        (p) => setRows((prev) => prev.filter((r) => r.id !== p.old.id)),
      )
      .subscribe();
    return () => supabase.removeChannel(channelRef.current);
  }, [sheetId]);

  // ── Save headers helper ────────────────────────────────
  const saveHeaders = useCallback(
    async (h) => {
      setSaved("saving");
      await supabase
        .from("excel_headers")
        .update({ headers: h })
        .eq("sheet_id", sheetId);
      setSaved("saved");
      setTimeout(() => setSaved(""), 2000);
    },
    [sheetId],
  );

  // ── Add row ────────────────────────────────────────────
  async function addRow(data = null) {
    if (!sheetId || !headers.length) return;
    const rowData = {};
    headers.forEach((h) => (rowData[h] = data?.[h] ?? ""));
    const { data: row, error } = await supabase
      .from("excel_rows")
      .insert({
        row_data: rowData,
        row_order: rows.length,
        sheet_id: sheetId,
        created_by: currentUser?.username || null,
      })
      .select()
      .single();
    if (error) {
      alert("خطأ في إضافة الصف:\n" + error.message);
      return;
    }
    if (row)
      setRows((prev) =>
        prev.find((r) => r.id === row.id) ? prev : [...prev, row],
      );
  }

  // ── Add from form ──────────────────────────────────────
  async function addFromForm(formData) {
    if (!sheetId) return;
    // Auto-add new fields to headers
    const newKeys = Object.keys(formData).filter((k) => !headers.includes(k));
    let h = headers;
    if (newKeys.length) {
      h = [...headers, ...newKeys];
      setHeaders(h);
      await supabase
        .from("excel_headers")
        .update({ headers: h })
        .eq("sheet_id", sheetId);
    }
    const rowData = {};
    h.forEach((k) => (rowData[k] = formData[k] ?? ""));
    const { data: row, error } = await supabase
      .from("excel_rows")
      .insert({
        row_data: rowData,
        row_order: rows.length,
        sheet_id: sheetId,
        created_by: currentUser?.username || null,
      })
      .select()
      .single();
    if (error) {
      alert("خطأ في الحفظ:\n" + error.message);
      return;
    }
    if (row) setRows((prev) => [...prev, row]);
    setForm(false);
  }

  // ── Update cell ────────────────────────────────────────
  async function updateCell(id, field, value) {
    const old = rows.find((r) => r.id === id);
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, row_data: { ...r.row_data, [field]: value } } : r,
      ),
    );
    const { error } = await supabase
      .from("excel_rows")
      .update({ row_data: { ...old.row_data, [field]: value } })
      .eq("id", id);
    if (error) setRows((prev) => prev.map((r) => (r.id === id ? old : r)));
  }

  // ── Delete row ─────────────────────────────────────────
  async function deleteRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("excel_rows").delete().eq("id", id);
  }

  // ── Add column ─────────────────────────────────────────
  async function addColumn(name) {
    if (headers.includes(name)) {
      alert("العمود موجود");
      return;
    }
    const h = [...headers, name];
    setHeaders(h);
    await saveHeaders(h);
    await Promise.all(
      rows.map((r) =>
        supabase
          .from("excel_rows")
          .update({ row_data: { ...r.row_data, [name]: "" } })
          .eq("id", r.id),
      ),
    );
    setRows((prev) =>
      prev.map((r) => ({ ...r, row_data: { ...r.row_data, [name]: "" } })),
    );
  }

  // ── Delete column ──────────────────────────────────────
  async function deleteColumn(col) {
    if (headers.length <= 1) return;
    const h = headers.filter((x) => x !== col);
    setHeaders(h);
    await saveHeaders(h);
    await Promise.all(
      rows.map((r) => {
        const { [col]: _, ...rest } = r.row_data;
        return supabase
          .from("excel_rows")
          .update({ row_data: rest })
          .eq("id", r.id);
      }),
    );
    setRows((prev) =>
      prev.map((r) => {
        const { [col]: _, ...rest } = r.row_data;
        return { ...r, row_data: rest };
      }),
    );
  }

  // ── Rename column ──────────────────────────────────────
  async function renameColumn(old, nn) {
    if (!nn.trim() || nn === old) return;
    const h = headers.map((x) => (x === old ? nn : x));
    setHeaders(h);
    await saveHeaders(h);
    await Promise.all(
      rows.map((r) => {
        const { [old]: val, ...rest } = r.row_data;
        return supabase
          .from("excel_rows")
          .update({ row_data: { ...rest, [nn]: val } })
          .eq("id", r.id);
      }),
    );
    setRows((prev) =>
      prev.map((r) => {
        const { [old]: val, ...rest } = r.row_data;
        return { ...r, row_data: { ...rest, [nn]: val } };
      }),
    );
  }

  // ── Upload Excel ───────────────────────────────────────
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rawData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        defval: "",
      });
      if (!rawData.length) {
        alert("الملف فاضي");
        return;
      }
      const h = Object.keys(rawData[0]).map(String);
      setHeaders(h);
      await supabase
        .from("excel_headers")
        .update({ headers: h })
        .eq("sheet_id", sheetId);
      await supabase.from("excel_rows").delete().eq("sheet_id", sheetId);
      setRows([]);
      const chunks = [];
      for (let i = 0; i < rawData.length; i += 20)
        chunks.push(rawData.slice(i, i + 20));
      let all = [];
      for (let i = 0; i < chunks.length; i++) {
        const { data } = await supabase
          .from("excel_rows")
          .insert(
            chunks[i].map((r, j) => ({
              sheet_id: sheetId,
              row_order: i * 20 + j,
              created_by: currentUser?.username || null,
              row_data: Object.fromEntries(
                h.map((k) => [k, String(r[k] ?? "")]),
              ),
            })),
          )
          .select();
        if (data) {
          all = [...all, ...data];
          setRows([...all]);
        }
      }
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  // ── Loading ────────────────────────────────────────────
  if (loading)
    return (
      <div className="h-full flex flex-col bg-white animate-pulse" dir="rtl">
        <div className="h-10 bg-[#f8faf8] border-b border-[#e0e0e0]" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 border-b border-[#f0f0f0] bg-white" />
        ))}
      </div>
    );

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white" dir="rtl">
      {/* Modals */}
      {showAddCol && (
        <AddColModal
          onConfirm={(n) => {
            addColumn(n);
            setAddCol(false);
          }}
          onClose={() => setAddCol(false)}
        />
      )}
      {showForm && (
        <LibraryModal
          currentUser={currentUser}
          onConfirm={addFromForm}
          onClose={() => setForm(false)}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f8faf8] border-b border-[#e0e0e0] flex-shrink-0 flex-wrap">
        <button
          onClick={() => setForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1d6f42] hover:bg-[#155233] rounded transition-all active:scale-95"
        >
          + مكاتبة جديدة
        </button>

        <button
          onClick={() => addRow()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded transition-all"
        >
          صف فارغ
        </button>

        <button
          onClick={() => setAddCol(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded transition-all"
        >
          + عمود
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#1d6f42] bg-white hover:bg-[#f0faf0] border border-[#c6d9c6] rounded transition-all disabled:opacity-50"
        >
          {uploading ? "جاري الرفع..." : "رفع Excel"}
        </button>

        <span className="mr-auto text-xs text-gray-400">
          {filtered.length !== rows.length
            ? `${filtered.length} / ${rows.length}`
            : `${rows.length} صف`}
          {saved === "saving" && (
            <span className="text-amber-500 mr-2">● حفظ...</span>
          )}
          {saved === "saved" && (
            <span className="text-[#1d6f42] mr-2">✓ تم</span>
          )}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#e8f5e9] border-b border-[#c6d9c6] sticky top-0 z-10">
              <th className="w-8 border-l border-[#c6d9c6]" />
              {headers.map((h) => (
                <th
                  key={h}
                  className="min-w-[120px] border-l border-[#c6d9c6] p-0 group/h"
                >
                  <div className="flex items-center">
                    {editingHeader === h ? (
                      <input
                        autoFocus
                        defaultValue={h}
                        onBlur={(e) => {
                          renameColumn(h, e.target.value);
                          setEH(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                          if (e.key === "Escape") setEH(null);
                        }}
                        className="flex-1 px-2 py-1.5 text-xs font-semibold bg-white text-[#1d6f42] outline-none ring-1 ring-inset ring-[#1d6f42] text-right"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => setEH(h)}
                        className="flex-1 px-2 py-1.5 text-xs font-semibold text-[#1d6f42] cursor-pointer select-none truncate text-right"
                      >
                        {h}
                      </span>
                    )}
                    <button
                      onClick={() => deleteColumn(h)}
                      className="opacity-0 group-hover/h:opacity-100 px-1 py-1.5 text-gray-300 hover:text-red-400 text-xs transition-all"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0f0f0]">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 2}
                  className="py-16 text-center text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">
                      {filters.search ||
                      filters.status ||
                      filters.priority ||
                      filters.rowType
                        ? "🔍"
                        : "📋"}
                    </span>
                    <span>
                      {filters.search ||
                      filters.status ||
                      filters.priority ||
                      filters.rowType
                        ? "لا توجد نتائج"
                        : "لا توجد مكاتبات"}
                    </span>
                    {!filters.search &&
                      !filters.status &&
                      !filters.priority &&
                      !filters.rowType && (
                        <button
                          onClick={() => setForm(true)}
                          className="mt-1 px-4 py-1.5 text-xs text-white bg-[#1d6f42] rounded hover:bg-[#155233]"
                        >
                          + إضافة مكاتبة
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className="group/row hover:bg-[#fafff9] transition-colors"
                >
                  <td className="w-8 text-center text-[11px] text-gray-300 select-none border-l border-[#f0f0f0] bg-[#fafafa] group-hover/row:text-gray-400">
                    {i + 1}
                  </td>
                  {headers.map((h) => {
                    const val = row.row_data?.[h] || "";
                    const badge = BADGES[h]?.[val];
                    const isDD = DROPDOWNS[h];
                    const editing =
                      editingCell?.rowId === row.id && editingCell?.h === h;
                    return (
                      <td key={h} className="border-l border-[#f0f0f0] p-0">
                        {isDD ? (
                          <div className="h-9 flex items-center px-2">
                            {badge && !editing ? (
                              <button
                                onClick={() => setEC({ rowId: row.id, h })}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge} hover:opacity-75`}
                              >
                                {val || "—"}
                              </button>
                            ) : (
                              <select
                                autoFocus={editing}
                                value={val}
                                onChange={(e) => {
                                  updateCell(row.id, h, e.target.value);
                                  setEC(null);
                                }}
                                onBlur={() => setEC(null)}
                                onClick={() => setEC({ rowId: row.id, h })}
                                className="w-full h-8 px-2 text-xs border border-[#1d6f42] rounded outline-none bg-white text-right"
                              >
                                <option value="">— اختر —</option>
                                {DROPDOWNS[h].map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <input
                            value={val}
                            onChange={(e) =>
                              updateCell(row.id, h, e.target.value)
                            }
                            placeholder="—"
                            className="w-full h-9 px-2 text-sm text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-200 focus:bg-[#f0faf0] focus:ring-1 focus:ring-inset focus:ring-[#1d6f42]/30 text-right"
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="w-8 text-center border-l border-[#f0f0f0]">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="w-full h-9 text-gray-200 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-all text-base"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <button
            onClick={() => setForm(true)}
            className="w-full py-2 text-right pr-10 text-xs text-gray-300 hover:text-[#1d6f42] hover:bg-[#f8faf8] border-t border-[#f0f0f0] transition-all"
          >
            + إضافة مكاتبة جديدة
          </button>
        )}
      </div>
    </div>
  );
}
