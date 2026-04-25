// ExcelPage.jsx — Data layer فقط (state + supabase + logic)
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import ExcelJS from "exceljs";
import { supabase } from "../../lib/supabase";
import ExcelTable from "./ExcelTable";

const DEFAULT_HEADERS = [
  "نوع المكاتبة", "رقم المكاتبة", "تاريخ المكاتبة", "تاريخ الاستلام",
  "الموضوع", "الجهة الرئيسية", "الجهة الفرعية", "رقم الحفظ",
  "الأولوية", "الحالة", "التصنيف", "المسؤول", "عدد المرفقات", "ملاحظات",
];

function safeStr(v) {
  if (v == null) return "";
  if (typeof v === "object") return "";
  return String(v).trim();
}

export default function ExcelPage({ sheetId, filters = {}, currentUser, onStatsUpdate }) {
  const [headers,   setHeaders]   = useState([]);
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saved,     setSaved]     = useState("");
  const [uploading, setUploading] = useState(false);

  const channelRef = useRef(null);

  // ─── تحميل البيانات ────────────────────────────────────
  useEffect(() => {
    if (!sheetId) return;
    setLoading(true);
    setRows([]);
    setHeaders([]);

    (async () => {
      const { data: hData } = await supabase
        .from("excel_headers").select("*")
        .eq("sheet_id", sheetId).limit(1).maybeSingle();

      if (hData?.headers?.length) {
        setHeaders(hData.headers);
      } else {
        await supabase.from("excel_headers").insert({ headers: DEFAULT_HEADERS, sheet_id: sheetId });
        setHeaders(DEFAULT_HEADERS);
      }

      const { data: rData, error: rErr } = await supabase
        .from("excel_rows").select("*")
        .eq("sheet_id", sheetId).order("row_order", { ascending: true });

      if (rErr) { console.error(rErr); alert("خطأ في تحميل البيانات: " + rErr.message); }
      else       { setRows(rData || []); }

      setLoading(false);
    })();
  }, [sheetId]);

  // ─── Realtime ──────────────────────────────────────────
  useEffect(() => {
    if (!sheetId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`sheet-${sheetId}-${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "excel_rows", filter: `sheet_id=eq.${sheetId}` },
        p => setRows(prev => prev.find(r => r.id === p.new.id) ? prev : [...prev, p.new]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "excel_rows", filter: `sheet_id=eq.${sheetId}` },
        p => setRows(prev => prev.map(r => r.id === p.new.id ? p.new : r)))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "excel_rows", filter: `sheet_id=eq.${sheetId}` },
        p => setRows(prev => prev.filter(r => r.id !== p.old.id)))
      .subscribe();

    return () => { supabase.removeChannel(channelRef.current); };
  }, [sheetId]);

  // ─── إحصائيات ──────────────────────────────────────────
  useEffect(() => {
    if (!onStatsUpdate) return;
    const s = { total: rows.length, "جديد": 0, "قيد المعالجة": 0, "مكتمل": 0, "مؤرشف": 0, "عاجل": 0, "بريد وارد": 0, "بريد صادر": 0 };
    rows.forEach(r => {
      const d = r.row_data || {};
      const status = safeStr(d["الحالة"]), priority = safeStr(d["الأولوية"]), type = safeStr(d["نوع المكاتبة"]);
      if (status in s) s[status]++;
      if (priority === "عاجل") s["عاجل"]++;
      if (type in s) s[type]++;
    });
    onStatsUpdate(s);
  }, [rows, onStatsUpdate]);

  // ─── الفلترة ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = rows;
    const { search, status, priority, rowType, myRows } = filters;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(x => Object.values(x.row_data || {}).some(v => safeStr(v).toLowerCase().includes(q)));
    }
    if (status)   result = result.filter(x => safeStr(x.row_data?.["الحالة"])       === status);
    if (priority) result = result.filter(x => safeStr(x.row_data?.["الأولوية"])     === priority);
    if (rowType)  result = result.filter(x => safeStr(x.row_data?.["نوع المكاتبة"]) === rowType);
    if (myRows)   result = result.filter(x => x.created_by === currentUser?.username);
    return result;
  }, [rows, filters, currentUser]);

  // ─── حفظ الأعمدة ──────────────────────────────────────
  const saveHeaders = useCallback(async (h) => {
    setSaved("saving");
    await supabase.from("excel_headers").update({ headers: h }).eq("sheet_id", sheetId);
    setSaved("saved");
    setTimeout(() => setSaved(""), 2000);
  }, [sheetId]);

  // ─── إضافة مكاتبة ──────────────────────────────────────
  async function handleAddRow(formData) {
    if (!sheetId) return;
    const safeData = {};
    for (const [k, v] of Object.entries(formData)) {
      if (k === "files") continue;
      if (v === null || v === undefined) { safeData[k] = ""; continue; }
      if (typeof v === "object") continue;
      safeData[k] = String(v);
    }
    const newKeys = Object.keys(safeData).filter(k => !headers.includes(k));
    let h = headers;
    if (newKeys.length) {
      h = [...headers, ...newKeys];
      setHeaders(h);
      await supabase.from("excel_headers").update({ headers: h }).eq("sheet_id", sheetId);
    }
    const rowData = {};
    h.forEach(k => { rowData[k] = safeData[k] != null ? String(safeData[k]) : ""; });
    if (safeData.refNumberFull)  rowData["رقم المكاتبة"]  = safeData.refNumberFull;
    else if (safeData.refNumber) rowData["رقم المكاتبة"]  = safeData.refNumber;
    if (safeData.type)           rowData["نوع المكاتبة"]  = safeData.type;
    if (safeData.date)           rowData["تاريخ المكاتبة"] = safeData.date;
    if (safeData.receiveDate)    rowData["تاريخ الاستلام"] = safeData.receiveDate;
    if (safeData.subject)        rowData["الموضوع"]        = safeData.subject;
    if (safeData.mainEntity)     rowData["الجهة الرئيسية"] = safeData.mainEntity;
    if (safeData.subEntity)      rowData["الجهة الفرعية"]  = safeData.subEntity;
    if (safeData.archiveNumber)  rowData["رقم الحفظ"]      = safeData.archiveNumber;
    if (safeData.priority)       rowData["الأولوية"]       = safeData.priority;
    if (safeData.status)         rowData["الحالة"]         = safeData.status;
    if (safeData.classification) rowData["التصنيف"]        = safeData.classification;
    if (safeData.assignee)       rowData["المسؤول"]        = safeData.assignee;
    if (safeData.attachCount)    rowData["عدد المرفقات"]   = safeData.attachCount;
    if (safeData.notes)          rowData["ملاحظات"]        = safeData.notes;

    const { data: row, error } = await supabase
      .from("excel_rows")
      .insert({ row_data: rowData, row_order: rows.length, sheet_id: sheetId, created_by: currentUser?.username || null })
      .select().single();
    if (error) { alert("خطأ في الحفظ:\n" + error.message); return; }
    if (row) setRows(prev => [...prev, row]);
  }

  // ─── حذف صف ───────────────────────────────────────────
  async function handleDeleteRow(id) {
    setRows(prev => prev.filter(r => r.id !== id));
    await supabase.from("excel_rows").delete().eq("id", id);
  }

  // ─── إضافة عمود ───────────────────────────────────────
  async function handleAddColumn(name) {
    if (headers.includes(name)) { alert("العمود موجود بالفعل"); return; }
    const h = [...headers, name];
    setHeaders(h);
    await saveHeaders(h);
    await Promise.all(rows.map(r =>
      supabase.from("excel_rows").update({ row_data: { ...r.row_data, [name]: "" } }).eq("id", r.id)
    ));
    setRows(prev => prev.map(r => ({ ...r, row_data: { ...r.row_data, [name]: "" } })));
  }

  // ─── تنزيل Excel ──────────────────────────────────────
  async function handleDownload() {
    if (!rows.length) { alert("لا توجد بيانات للتنزيل"); return; }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("المكاتبات", { views: [{ rightToLeft: true }] });

    // Header row
    ws.addRow(headers);
    const headerRow = ws.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell(cell => {
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D6F42" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border    = { bottom: { style: "thin", color: { argb: "FF155233" } }, right: { style: "thin", color: { argb: "FF155233" } } };
    });

    // Data rows
    rows.forEach((r, i) => {
      const dataRow = ws.addRow(headers.map(h => safeStr(r.row_data?.[h])));
      dataRow.height = 18;
      dataRow.eachCell(cell => {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF6FDF7" } };
        cell.border    = { bottom: { style: "hair", color: { argb: "FFE0E0E0" } } };
      });
    });

    // Column widths
    ws.columns = headers.map(h => ({ width: Math.min(40, Math.max(14, h.length * 2.2)) }));

    // Download
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href       = url;
    a.download   = `مكاتبات_${new Date().toLocaleDateString("en-CA")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── رفع Excel ────────────────────────────────────────
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());

      const ws = wb.worksheets[0];
      if (!ws) { alert("الملف فاضي"); return; }

      // Headers من أول صف — exceljs row.values بيبدأ من index 1
      const h = (ws.getRow(1).values || []).slice(1).map(v => safeStr(v)).filter(Boolean);
      if (!h.length) { alert("مفيش headers في الملف"); return; }

      // Data rows
      const rawData = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj = {};
        h.forEach((key, i) => { obj[key] = safeStr(row.getCell(i + 1).text || row.getCell(i + 1).value); });
        rawData.push(obj);
      });

      if (!rawData.length) { alert("الملف فاضي"); return; }

      setHeaders(h);
      await supabase.from("excel_headers").update({ headers: h }).eq("sheet_id", sheetId);
      await supabase.from("excel_rows").delete().eq("sheet_id", sheetId);
      setRows([]);

      const CHUNK = 20;
      let all = [];
      for (let i = 0; i < rawData.length; i += CHUNK) {
        const chunk = rawData.slice(i, i + CHUNK);
        const { data } = await supabase.from("excel_rows").insert(
          chunk.map((r, j) => ({
            sheet_id: sheetId, row_order: i + j,
            created_by: currentUser?.username || null,
            row_data: Object.fromEntries(h.map(k => [k, r[k] ?? ""])),
          }))
        ).select();
        if (data) { all = [...all, ...data]; setRows([...all]); }
      }
    } catch (err) {
      alert("خطأ في رفع الملف: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  // ─── Render ────────────────────────────────────────────
  const hasFilter = !!(filters.search || filters.status || filters.priority || filters.rowType || filters.myRows);

  return (
    <ExcelTable
      headers={headers}
      rows={filtered}
      totalRows={rows.length}
      loading={loading}
      saved={saved}
      uploading={uploading}
      hasFilter={hasFilter}
      currentUser={currentUser}
      onAddRow={handleAddRow}
      onAddColumn={handleAddColumn}
      onDeleteRow={handleDeleteRow}
      onUpload={handleUpload}
      onDownload={handleDownload}
    />
  );
}