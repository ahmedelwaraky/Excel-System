import { useState, useRef } from "react";

/* ─── Constants ──────────────────────────────────────────── */
const TYPE_OPTIONS  = ["بريد وارد", "بريد صادر"];
const STATUS_OPTS   = ["جديد", "قيد المعالجة", "مكتمل", "مؤرشف"];
const PRIORITY_OPTS = ["عاجل", "عادي"];
const CLASS_OPTS    = ["إداري", "مالي", "قانوني", "تقني", "أخرى"];

const TYPE_PREFIX = {
  "بريد وارد": "و/",
  "بريد صادر": "ص/",
};

const TYPE_COLOR = {
  "بريد وارد": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "بريد صادر": { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
};

/* ─── Small reusable pieces ──────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <div>
        <p className="text-xs font-bold text-gray-700 leading-none">{title}</p>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 mb-1 tracking-wide">
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-9 px-3 text-sm text-gray-800 border border-gray-200 rounded-lg outline-none focus:border-[#1d6f42] focus:ring-2 focus:ring-[#1d6f42]/10 bg-white text-right transition-all placeholder:text-gray-300";
const selectCls = inputCls + " cursor-pointer";

/* ─── Main Component ─────────────────────────────────────── */
export default function CorrespondenceModal({ onConfirm, onClose, currentUser }) {
  const today   = new Date().toLocaleDateString("en-CA");
  const fileRef = useRef();
  const [saving, setSaving] = useState(false);
  const [files,  setFiles]  = useState([]);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    type:           "",
    refNumber:      "",
    date:           today,
    receiveDate:    today,
    subject:        "",
    mainEntity:     "",
    subEntity:      "",
    archiveNumber:  "",
    priority:       "",
    status:         "",
    classification: "",
    assignee:       currentUser?.full_name || currentUser?.username || "",
    attachCount:    "0",
    prevDate:       "",
    prevSubject:    "",
    settlement:     "",
    notes:          "",
  });

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: false }));
  };

  const isOutgoing       = form.type === "بريد صادر";
  const prevSectionLabel = isOutgoing
    ? "المكاتبة الواردة السابقة (الصادر بناء عليها)"
    : "المكاتبة الصادرة السابقة";

  const prefix    = TYPE_PREFIX[form.type] || "";
  const typeStyle = TYPE_COLOR[form.type]  || { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" };

  function validate() {
    const e = {};
    if (!form.type)              e.type        = true;
    if (!form.refNumber.trim())  e.refNumber   = true;
    if (!form.subject.trim())    e.subject     = true;
    if (!form.mainEntity.trim()) e.mainEntity  = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form, refNumberFull: `${prefix}${form.refNumber}`, files };
    await onConfirm(payload);
    setSaving(false);
  }

  function handleFiles(e) {
    setFiles(p => [...p, ...Array.from(e.target.files)]);
  }
  function removeFile(i) {
    setFiles(p => p.filter((_, idx) => idx !== i));
  }

  const errCls = k => errors[k] ? " border-red-300 focus:border-red-400 focus:ring-red-100" : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-3"
      dir="rtl"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-2xl bg-white sm:rounded-xl shadow-2xl flex flex-col overflow-hidden
                   rounded-t-2xl"
        style={{ maxHeight: "95vh", height: "95vh" }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-[#1d6f42] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all text-xl leading-none"
          >×</button>

          <span className="text-white font-bold text-sm">مكاتبة جديدة</span>

          {form.type ? (
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: typeStyle.bg, color: typeStyle.text }}
            >
              {prefix} {form.type}
            </span>
          ) : (
            <span className="text-[11px] text-white/30 px-2.5 py-1 hidden sm:block">— اختر النوع —</span>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 space-y-5">

          {/* §1 البيانات الأساسية */}
          <section>
            <SectionHeader title="البيانات الأساسية" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <Field label="نوع المكاتبة" required>
                <select
                  value={form.type}
                  onChange={e => set("type", e.target.value)}
                  className={selectCls + errCls("type")}
                >
                  <option value="" disabled>— اختر النوع —</option>
                  {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                {errors.type && <p className="text-[10px] text-red-400 mt-1">نوع المكاتبة مطلوب</p>}
              </Field>

              <Field label="رقم المكاتبة" required>
                <div className="flex items-center gap-1">
                  <span
                    className="h-9 px-2.5 flex items-center text-xs font-bold rounded-lg border shrink-0"
                    style={{ background: typeStyle.bg, color: typeStyle.text, borderColor: typeStyle.border }}
                  >
                    {prefix || "—"}
                  </span>
                  <input
                    type="text"
                    value={form.refNumber}
                    onChange={e => set("refNumber", e.target.value)}
                    placeholder="0001"
                    className={inputCls + errCls("refNumber") + " flex-1"}
                  />
                </div>
                {errors.refNumber && <p className="text-[10px] text-red-400 mt-1">رقم المكاتبة مطلوب</p>}
              </Field>

              <Field label="تاريخ المكاتبة" required>
                <input type="date" value={form.date}
                  onChange={e => set("date", e.target.value)}
                  className={inputCls + " [color-scheme:light]"} />
              </Field>

              <Field label="تاريخ الاستلام">
                <input type="date" value={form.receiveDate}
                  onChange={e => set("receiveDate", e.target.value)}
                  className={inputCls + " [color-scheme:light]"} />
              </Field>

              <div className="col-span-1 sm:col-span-2">
                <Field label="الموضوع" required>
                  <textarea
                    value={form.subject}
                    onChange={e => set("subject", e.target.value)}
                    rows={2}
                    placeholder="أدخل موضوع المكاتبة..."
                    className={inputCls + " h-auto py-2 resize-none" + errCls("subject")}
                  />
                  {errors.subject && <p className="text-[10px] text-red-400 mt-1">الموضوع مطلوب</p>}
                </Field>
              </div>
            </div>
          </section>

          {/* §2 الجهة المراسلة */}
          <section>
            <SectionHeader title="الجهة المراسلة" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="الجهة الرئيسية" required>
                <input type="text" value={form.mainEntity}
                  onChange={e => set("mainEntity", e.target.value)}
                  placeholder="اسم الجهة الرئيسية..."
                  className={inputCls + errCls("mainEntity")} />
                {errors.mainEntity && <p className="text-[10px] text-red-400 mt-1">الجهة الرئيسية مطلوبة</p>}
              </Field>
              <Field label="الجهة الفرعية">
                <input type="text" value={form.subEntity}
                  onChange={e => set("subEntity", e.target.value)}
                  placeholder="اسم الجهة الفرعية..."
                  className={inputCls} />
              </Field>
            </div>
          </section>

          {/* §3 التصنيف والحفظ */}
          <section>
            <SectionHeader title="التصنيف والحفظ" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="دوسية الحفظ">
                <input type="text" value={form.archiveNumber}
                  onChange={e => set("archiveNumber", e.target.value)}
                  placeholder="مثال: 2024/أ/001"
                  className={inputCls} />
              </Field>

              <Field label="الأولوية">
                <select value={form.priority} onChange={e => set("priority", e.target.value)} className={selectCls}>
                  <option value="" disabled>— اختر الأولوية —</option>
                  {PRIORITY_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>

              <Field label="الحالة">
                <select value={form.status} onChange={e => set("status", e.target.value)} className={selectCls}>
                  <option value="" disabled>— اختر الحالة —</option>
                  {STATUS_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>

              <Field label="التصنيف">
                <select value={form.classification} onChange={e => set("classification", e.target.value)} className={selectCls}>
                  <option value="" disabled>— اختر التصنيف —</option>
                  {CLASS_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>

              <Field label="المسؤول / المكلف">
                <input type="text" value={form.assignee}
                  onChange={e => set("assignee", e.target.value)}
                  placeholder="اسم المسؤول..."
                  className={inputCls} />
              </Field>

              <Field label="عدد المرفقات الورقية">
                <input type="number" min="0" value={form.attachCount}
                  onChange={e => set("attachCount", e.target.value)}
                  className={inputCls} />
              </Field>
            </div>
          </section>

          {/* §4 المكاتبة السابقة */}
          <section>
            <SectionHeader
              title={prevSectionLabel}
              subtitle="اختياري — يُملأ عند الإشارة لمكاتبة سابقة"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="تاريخ المكاتبة السابقة">
                <input type="date" value={form.prevDate}
                  onChange={e => set("prevDate", e.target.value)}
                  className={inputCls + " [color-scheme:light]"} />
              </Field>

              <Field label="التسديد">
                <input type="text" value={form.settlement}
                  onChange={e => set("settlement", e.target.value)}
                  placeholder="رقم التسديد أو الإجراء..."
                  className={inputCls} />
              </Field>

              <div className="col-span-1 sm:col-span-2">
                <Field label="موضوع المكاتبة السابقة">
                  <textarea
                    value={form.prevSubject}
                    onChange={e => set("prevSubject", e.target.value)}
                    rows={2}
                    placeholder="موضوع المكاتبة السابقة..."
                    className={inputCls + " h-auto py-2 resize-none"}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* §5 المرفقات والملاحظات */}
          <section>
            <SectionHeader title="المرفقات الإلكترونية والملاحظات" />
            <div className="space-y-3">

              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#1d6f42]/40 hover:bg-[#f0fdf4]/50 transition-all active:bg-[#f0fdf4]"
              >
                <p className="text-2xl mb-1">📁</p>
                <p className="text-xs font-semibold text-gray-500">اضغط لإضافة مرفقات</p>
                <p className="text-[10px] text-gray-400 mt-0.5">PDF · JPG · PNG — حتى 10MB لكل ملف</p>
                <input ref={fileRef} type="file" multiple accept=".pdf,image/*" onChange={handleFiles} className="hidden" />
              </div>

              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                      <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 transition-colors text-sm leading-none p-1">✕</button>
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <span className="text-sm">{f.type.includes("pdf") ? "📄" : "🖼️"}</span>
                        <span className="text-xs text-gray-600 truncate">{f.name}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Field label="ملاحظات إضافية">
                <textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات أو تعليمات إضافية..."
                  className={inputCls + " h-auto py-2 resize-none"}
                />
              </Field>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex-shrink-0 pb-safe">
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            {form.type ? (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: typeStyle.bg, color: typeStyle.text }}
              >
                {prefix}{form.refNumber || "—"}
              </span>
            ) : (
              <span className="text-[10px] text-gray-300 shrink-0 hidden sm:block">— اختر النوع أولاً —</span>
            )}
            <span className="text-[10px] text-gray-400 truncate hidden sm:block">
              {form.subject || "لم يُحدد الموضوع بعد"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#1d6f42] hover:bg-[#155233] rounded-lg transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving
              ? <><span className="animate-spin">⟳</span> جاري الحفظ...</>
              : <>✓ حفظ المكاتبة</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}