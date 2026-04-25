// LoadingScreen.jsx — شاشة التحميل بعد تسجيل الدخول
import { useEffect, useState } from "react";

const STEPS = [
  { label: "جاري التحقق من الصلاحيات...", duration: 700 },
  { label: "تحميل بيانات المكاتبات...",    duration: 900 },
  { label: "تجهيز لوحة التحكم...",          duration: 600 },
];

export default function LoadingScreen({ user, onDone }) {
  const [stepIndex, setStepIndex]   = useState(0);
  const [progress,  setProgress]    = useState(0);
  const [fadeOut,   setFadeOut]     = useState(false);

  // ─── Drive through steps ──────────────────────────────
  useEffect(() => {
    let elapsed  = 0;
    const total  = STEPS.reduce((s, x) => s + x.duration, 0);
    const timers = [];

    STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => setStepIndex(i), elapsed));
      elapsed += step.duration;
    });

    // Animate progress bar smoothly
    const tick = 30; // ms per frame
    let t = 0;
    const interval = setInterval(() => {
      t += tick;
      setProgress(Math.min(100, Math.round((t / total) * 100)));
      if (t >= total) clearInterval(interval);
    }, tick);

    // Fade out then call onDone
    timers.push(setTimeout(() => setFadeOut(true), total + 100));
    timers.push(setTimeout(() => onDone(), total + 600));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [onDone]);

  const initials = user?.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2)
    || user?.username?.slice(0, 2).toUpperCase()
    || "U";

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0d1f14 0%, #0f2a1a 50%, #0d1f14 100%)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: fadeOut ? "none" : "all",
      }}
    >
      {/* Background grid lines */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#1d6f42 1px, transparent 1px), linear-gradient(90deg, #1d6f42 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glowing orb */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(29,111,66,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Card */}
      <div className="relative flex flex-col items-center gap-8 px-10 py-12 w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #1d6f42, #25915a)",
              boxShadow: "0 0 40px rgba(29,111,66,0.5)",
            }}
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect x="2"  y="2"  width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
              <rect x="19" y="2"  width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
              <rect x="2"  y="19" width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
              <rect x="19" y="19" width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <p className="text-white font-bold text-lg tracking-tight">نظام المكاتبات</p>
        </div>

        {/* User greeting */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 w-full">
          <div className="w-9 h-9 rounded-full bg-[#1d6f42] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.full_name || user?.username}
            </p>
            <p className="text-green-400/60 text-[10px]">مرحباً بعودتك 👋</p>
          </div>
          <div className="mr-auto flex-shrink-0">
            <span className="text-[10px] bg-[#1d6f42]/40 text-green-300 px-2 py-0.5 rounded-full border border-green-700/30">
              {user?.role || "مستخدم"}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="w-full space-y-2">
          {STEPS.map((step, i) => {
            const done    = i < stepIndex;
            const current = i === stepIndex;
            return (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-300"
                style={{ opacity: i > stepIndex ? 0.25 : 1 }}
              >
                {/* Icon */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background: done ? "#1d6f42" : current ? "rgba(29,111,66,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${done ? "#1d6f42" : current ? "#1d6f42" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : current ? (
                    <span
                      className="w-2 h-2 rounded-full bg-[#1d6f42]"
                      style={{ animation: "pulse 1s ease-in-out infinite" }}
                    />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  )}
                </div>

                <p
                  className="text-xs transition-colors duration-300"
                  style={{ color: done ? "#4ade80" : current ? "white" : "rgba(255,255,255,0.3)" }}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/30">جاري التحميل</span>
            <span className="text-[10px] text-green-400 font-mono">{progress}%</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #1d6f42, #4ade80)",
                boxShadow: "0 0 8px rgba(74,222,128,0.5)",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}