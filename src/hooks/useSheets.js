import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useSheets() {
  const [sheets, setSheets] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSheets() {
      const { data } = await supabase
        .from("excel_sheets")
        .select("*")
        .order("sheet_order", { ascending: true });

      if (data && data.length > 0) {
        setSheets(data);
        setActiveSheetId(data[0].id);
      } else {
        // أول مرة — ننشئ ورقة افتراضية
        const { data: newSheet } = await supabase
          .from("excel_sheets")
          .insert({ name: "ورقة 1", sheet_order: 0 })
          .select()
          .single();
        if (newSheet) {
          setSheets([newSheet]);
          setActiveSheetId(newSheet.id);
        }
      }
      setLoading(false);
    }
    fetchSheets();
  }, []);

  async function addSheet() {
    const name = `ورقة ${sheets.length + 1}`;
    const { data } = await supabase
      .from("excel_sheets")
      .insert({ name, sheet_order: sheets.length })
      .select()
      .single();
    if (data) {
      setSheets((prev) => [...prev, data]);
      setActiveSheetId(data.id);
    }
  }

  async function renameSheet(id, newName) {
    if (!newName.trim()) return;
    await supabase.from("excel_sheets").update({ name: newName }).eq("id", id);
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)));
  }

  async function deleteSheet(id) {
    if (sheets.length <= 1) return alert("لازم يكون فيه ورقة واحدة على الأقل");
    await supabase.from("excel_sheets").delete().eq("id", id);
    const remaining = sheets.filter((s) => s.id !== id);
    setSheets(remaining);
    if (activeSheetId === id) setActiveSheetId(remaining[0].id);
  }

  return { sheets, activeSheetId, setActiveSheetId, addSheet, renameSheet, deleteSheet, loading };
}