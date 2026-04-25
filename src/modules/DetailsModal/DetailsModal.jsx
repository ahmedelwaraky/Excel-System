// DetailsModal.jsx — مودال تفاصيل المكاتبة (مصلّح)
// ✅ FIX: المفاتيح متطابقة الآن مع row_data المخزنة في Supabase

const BADGES = {
  "الحالة": {
    "جديد":          { bg: "#dbeafe", text: "#1d4ed8" },
    "قيد المعالجة": { bg: "#fef3c7", text: "#b45309" },
    "مكتمل":         { bg: "#dcfce7", text: "#15803d" },
    "مؤرشف":         { bg: "#f3f4f6", text: "#6b7280" },
  },
  "الأولوية": {
    "عاجل": { bg: "#fee2e2", text: "#dc2626" },
    "عالي": { bg: "#ffedd5", text: "#ea580c" },
    "عادي": { bg: "#f3f4f6", text: "#6b7280" },
  },
  "نوع المكاتبة": {
    "بريد وارد": { bg: "#eff6ff", text: "#2563eb" },
    "بريد صادر": { bg: "#f5f3ff", text: "#7c3aed" },
    "داخلي":     { bg: "#f0fdfa", text: "#0f766e" },
    "تعميم":     { bg: "#fefce8", text: "#ca8a04" },
  },
};

// ✅ FIX: المفاتيح هنا = نفس مفاتيح row_data اللي بتتخزن في قاعدة البيانات
const SECTIONS = [
  {
    title: "البيانات الأساسية",
    // icon: "📄",
    fields: [
      { key: "نوع المكاتبة",   wide: false },
      { key: "رقم المكاتبة",   wide: false },
      { key: "تاريخ المكاتبة", wide: false },
      { key: "تاريخ الاستلام", wide: false },
      { key: "الموضوع",        wide: true  },
    ],
  },
  {
    title: "الجهة المراسلة",
    // icon: "🏢",
    fields: [
      { key: "الجهة الرئيسية", wide: false },
      { key: "الجهة الفرعية",  wide: false },
    ],
  },
  {
    title: "التصنيف والحفظ",
    // icon: "🗂️",
    fields: [
{ key: "رقم الحفظ", label: "دوسية الحفظ", wide: false },
      { key: "الأولوية",     wide: false },
      { key: "الحالة",       wide: false },
      { key: "التصنيف",      wide: false },
      { key: "المسؤول",      wide: false },
      { key: "عدد المرفقات", wide: false },
    ],
  },
  {
    title: "الملاحظات",
    // icon: "📝",
    fields: [
      { key: "ملاحظات", wide: true },
    ],
  },
];

const BADGE_KEYS = new Set(["الحالة", "الأولوية", "نوع المكاتبة"]);

function safeStr(v) {
  if (v == null) return "";
  if (typeof v === "object") return "";
  return String(v).trim();
}

function Badge({ category, value }) {
  const style = BADGES[category]?.[value];
  if (!style) {
    return <span className="text-sm font-medium text-gray-800">{value || "—"}</span>;
  }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {value}
    </span>
  );
}

function FieldCell({ fieldKey, label, value, wide }) {
  const displayLabel = label || fieldKey;
  const displayValue = safeStr(value);
  const isBadge = BADGE_KEYS.has(fieldKey);

  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
        {displayLabel}
      </p>
      {isBadge && displayValue ? (
        <Badge category={fieldKey} value={displayValue} />
      ) : (
        <p className={`text-sm font-medium text-gray-800 ${wide ? "leading-relaxed whitespace-pre-wrap" : "truncate"}`}>
          {displayValue || <span className="text-gray-300 font-normal">—</span>}
        </p>
      )}
    </div>
  );
}

export default function DetailsModal({ row, headers = [], onClose, onDelete }) {
  if (!row) return null;

  const data = row.row_data || {};

  // الحقول المعروفة في SECTIONS
  const knownKeys = new Set(SECTIONS.flatMap(s => s.fields.map(f => f.key)));

  // ✅ حقول إضافية موجودة في البيانات بس مش في SECTIONS
  const extraKeys = Object.keys(data).filter(
    k => !knownKeys.has(k) && safeStr(data[k]) !== ""
  );

  function handleDelete() {
    if (window.confirm("هل تريد حذف هذه المكاتبة نهائياً؟")) {
      onDelete(row.id);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      dir="rtl"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1d6f42] shrink-0">
          <div className="flex items-center gap-3">
            {/* <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-base">📋</div> */}
            <div>
              <p className="text-white font-bold text-sm">تفاصيل المكاتبة</p>
              {safeStr(data["رقم المكاتبة"]) && (
                <p className="text-white/60 text-[11px] mt-0.5">رقم: {safeStr(data["رقم المكاتبة"])}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {safeStr(data["نوع المكاتبة"]) && (
              <Badge category="نوع المكاتبة" value={safeStr(data["نوع المكاتبة"])} />
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-white/50 hover:text-red-300 text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all"
            >
              🗑 حذف
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">

          {SECTIONS.map(section => {
            // ✅ FIX: اعرض الـ section حتى لو الحقول فاضية — بس اخفيه لو كل حقوله فعلاً فاضية
            const hasAnyValue = section.fields.some(f => safeStr(data[f.key]) !== "");
            if (!hasAnyValue) return null;

            return (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <span className="text-base">{section.icon}</span>
                  <span className="text-xs font-bold text-gray-600 tracking-wide">{section.title}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {section.fields.map(f => (
                    <FieldCell
                      key={f.key}
                      fieldKey={f.key}
                      label={f.label}
                      value={data[f.key]}
                      wide={f.wide}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* حقول إضافية */}
          {extraKeys.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                {/* <span className="text-base">➕</span> */}
                <span className="text-xs font-bold text-gray-600 tracking-wide">حقول إضافية</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {extraKeys.map(k => (
                  <FieldCell
                    key={k}
                    fieldKey={k}
                    value={data[k]}
                    wide={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex flex-col gap-0.5">
            {row.created_by && (
              <span className="text-[11px] text-gray-400">
                أضافه: <span className="font-medium text-gray-600">{row.created_by}</span>
              </span>
            )}
            {safeStr(data["تاريخ المكاتبة"]) && (
              <span className="text-[11px] text-gray-400">
                التاريخ: <span className="font-medium text-gray-600">{safeStr(data["تاريخ المكاتبة"])}</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-white bg-[#1d6f42] hover:bg-[#155233] rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}