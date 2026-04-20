import { useState } from "react";

const DROPDOWNS = {
  "نوع المكاتبة": ["بريد وارد", "بريد صادر", "داخلي", "تعميم"],
  "الحالة":       ["جديد", "قيد المعالجة", "مكتمل", "مؤرشف"],
  "الأولوية":     ["عاجل", "عالي", "عادي"],
  "التصنيف":      ["إداري", "مالي", "قانوني", "تقني", "أخرى"],
};

const FIELDS = [
  { key: "نوع المكاتبة",   label: "نوع المكاتبة",   required: true  },
  { key: "رقم المكاتبة",   label: "رقم المكاتبة",   required: true  },
  { key: "تاريخ المكاتبة", label: "تاريخ المكاتبة", type: "date", required: true },
  { key: "تاريخ الاستلام", label: "تاريخ الاستلام", type: "date" },
  { key: "الموضوع",        label: "الموضوع",         required: true, wide: true },
  { key: "الجهة الرئيسية", label: "الجهة الرئيسية", required: true },
  { key: "الجهة الفرعية",  label: "الجهة الفرعية"  },
  { key: "رقم الحفظ",      label: "رقم الحفظ"       },
  { key: "الأولوية",       label: "الأولوية"        },
  { key: "الحالة",         label: "الحالة"          },
  { key: "التصنيف",        label: "التصنيف"         },
  { key: "المسؤول",        label: "المسؤول"         },
  { key: "عدد المرفقات",   label: "عدد المرفقات",   type: "number" },
  { key: "ملاحظات",        label: "ملاحظات",         type: "textarea", wide: true },
];

export default function LibraryModal({ onConfirm, onClose, currentUser }) {
  const today = new Date().toLocaleDateString("en-CA");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    "نوع المكاتبة":   "بريد وارد",
    "رقم المكاتبة":   "",
    "تاريخ المكاتبة": today,
    "تاريخ الاستلام": today,
    "الموضوع":        "",
    "الجهة الرئيسية": "",
    "الجهة الفرعية":  "",
    "رقم الحفظ":      "",
    "الأولوية":       "عادي",
    "الحالة":         "جديد",
    "التصنيف":        "إداري",
    "المسؤول":        currentUser?.full_name || currentUser?.username || "",
    "عدد المرفقات":   "0",
    "ملاحظات":        "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form["الموضوع"].trim()) { alert("الموضوع مطلوب"); return; }
    if (!form["الجهة الرئيسية"].trim()) { alert("الجهة الرئيسية مطلوبة"); return; }
    setSaving(true);
    await onConfirm(form);
    setSaving(false);
  }

  const base = "w-full h-9 px-3 text-sm text-gray-700 border border-[#d0d0d0] rounded outline-none focus:border-[#1d6f42] focus:ring-1 focus:ring-[#1d6f42]/20 bg-white text-right transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3" dir="rtl"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1d6f42]">
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none">×</button>
          <span className="text-white font-semibold text-sm">📋 مكاتبة جديدة</span>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(f => (
              <div key={f.key} className={f.wide ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {f.required && <span className="text-red-400 ml-0.5">*</span>}
                  {f.label}
                </label>

                {DROPDOWNS[f.key] ? (
                  <select value={form[f.key]} onChange={e => set(f.key, e.target.value)} className={base}>
                    {DROPDOWNS[f.key].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                    rows={3} placeholder={`أدخل ${f.label}...`}
                    className={base + " h-auto py-2 resize-none"} />
                ) : (
                  <input type={f.type || "text"} value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.type === "date" ? "" : `أدخل ${f.label}...`}
                    className={base + (f.type === "date" ? " [color-scheme:light]" : "")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 text-sm font-semibold text-white bg-[#1d6f42] hover:bg-[#155233] rounded transition-all disabled:opacity-60">
            {saving ? "جاري الحفظ..." : "✓ حفظ"}
          </button>
          <button onClick={onClose}
            className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-all">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}