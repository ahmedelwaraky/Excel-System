import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";

export default function ExcelTable({ sheetId }) {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setSaveStatus] = useState("");
  const [editingHeader, setEditingHeader] = useState(null);

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

  // ✅ دالة واحدة بس — فيها sheet_id
  async function addRow() {
    const rowData = {};
    headers.forEach((h) => (rowData[h] = ""));
    const { data } = await supabase
      .from("excel_rows")
      .insert({ row_data: rowData, row_order: rows.length, sheet_id: sheetId })
      .select()
      .single();
    if (data) setRows((prev) => [...prev, data]);
  }

  const saveHeaders = useCallback(
    async (newHeaders) => {
      setSaveStatus("saving");
      await supabase
        .from("excel_headers")
        .update({ headers: newHeaders })
        .eq("sheet_id", sheetId);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    },
    [sheetId],
  );

  async function updateCell(id, field, value) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, row_data: { ...r.row_data, [field]: value } } : r,
      ),
    );
    const row = rows.find((r) => r.id === id);
    await supabase
      .from("excel_rows")
      .update({ row_data: { ...row.row_data, [field]: value } })
      .eq("id", id);
  }

  async function deleteRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("excel_rows").delete().eq("id", id);
  }

  async function addColumn() {
    const name = prompt("اسم العمود الجديد؟");
    if (!name?.trim()) return;
    if (headers.includes(name.trim())) return alert("العمود موجود بالفعل");
    const newHeaders = [...headers, name.trim()];
    setHeaders(newHeaders);
    await saveHeaders(newHeaders);
    const updates = rows.map((r) =>
      supabase
        .from("excel_rows")
        .update({ row_data: { ...r.row_data, [name.trim()]: "" } })
        .eq("id", r.id),
    );
    await Promise.all(updates);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        row_data: { ...r.row_data, [name.trim()]: "" },
      })),
    );
  }

  async function deleteColumn(col) {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((h) => h !== col);
    setHeaders(newHeaders);
    await saveHeaders(newHeaders);
    const updates = rows.map((r) => {
      const { [col]: _, ...rest } = r.row_data;
      return supabase
        .from("excel_rows")
        .update({ row_data: rest })
        .eq("id", r.id);
    });
    await Promise.all(updates);
    setRows((prev) =>
      prev.map((r) => {
        const { [col]: _, ...rest } = r.row_data;
        return { ...r, row_data: rest };
      }),
    );
  }

  async function renameColumn(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const newHeaders = headers.map((h) => (h === oldName ? newName.trim() : h));
    setHeaders(newHeaders);
    await saveHeaders(newHeaders);
    const updates = rows.map((r) => {
      const { [oldName]: val, ...rest } = r.row_data;
      return supabase
        .from("excel_rows")
        .update({ row_data: { ...rest, [newName.trim()]: val } })
        .eq("id", r.id);
    });
    await Promise.all(updates);
    setRows((prev) =>
      prev.map((r) => {
        const { [oldName]: val, ...rest } = r.row_data;
        return { ...r, row_data: { ...rest, [newName.trim()]: val } };
      }),
    );
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white" dir="rtl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#c6d9c6] bg-[#f8faf8]">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-7 w-24 bg-gray-200 rounded-md animate-pulse"
            />
          ))}
          <div className="mr-auto h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-[#e8f0e8]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-100 rounded animate-pulse flex-1"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── UI ────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white" dir="rtl">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#f8faf8] border-b border-[#c6d9c6] flex-shrink-0">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-[#d9ead3] border border-[#c6d9c6] rounded-lg transition-all duration-150 active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          إضافة صف
        </button>

        <button
          onClick={addColumn}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-[#d9ead3] border border-[#c6d9c6] rounded-lg transition-all duration-150 active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          إضافة عمود
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
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
                <th
                  key={h}
                  className="min-w-[140px] sticky top-0 z-10 bg-[#e8f5e9] border-l border-[#c6d9c6] p-0 group/col"
                >
                  <div className="flex items-center">
                    {editingHeader === h ? (
                      <input
                        autoFocus
                        defaultValue={h}
                        onBlur={(e) => {
                          renameColumn(h, e.target.value);
                          setEditingHeader(null);
                        }}
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
                        <rect
                          x="2"
                          y="2"
                          width="14"
                          height="14"
                          rx="2"
                          stroke="#1d6f42"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M6 9h6M9 6v6"
                          stroke="#1d6f42"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">لا توجد بيانات بعد</p>
                    <button
                      onClick={addRow}
                      className="mt-1 text-xs text-[#1d6f42] hover:text-[#155233] font-medium transition-colors"
                    >
                      أضف أول صف
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr
                  key={row.id}
                  className="group/row hover:bg-[#f0faf0] transition-colors duration-100"
                >
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