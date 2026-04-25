// LoginPage.jsx — صفحة تسجيل الدخول (مصلّحة)
// ✅ FIX: معالجة أفضل للأخطاء + التحقق من البيانات قبل الإرسال

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    const user = username.trim();
    const pass = password.trim();

    if (!user || !pass) {
      setError("من فضلك أدخل جميع البيانات");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: err } = await supabase
        .from("users")
        .select("*")
        .eq("username", user)
        .eq("password", pass)
        .maybeSingle();

      if (err) {
        // ✅ FIX: طباعة الخطأ الكامل للـ console لتسهيل الـ debugging
        console.error("Supabase error:", err);
        setError("خطأ في الاتصال بالسيرفر: " + err.message);
        return;
      }

      if (!data) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      // ✅ حفظ بيانات المستخدم
      localStorage.setItem("excel_user", JSON.stringify(data));
      onLogin(data);

    } catch (e) {
      console.error("Login error:", e);
      setError("حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1f14] to-[#0f2a1a]"
      dir="rtl"
    >
      {/* خلفية دوائر */}
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute border border-white rounded-full"
            style={{
              width:     `${(i + 1) * 120}px`,
              height:    `${(i + 1) * 120}px`,
              top:       "50%",
              left:      "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-[360px] px-4">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 bg-[#1d6f42] rounded-2xl flex items-center justify-center shadow-2xl shadow-green-900/50">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect x="2"  y="2"  width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
              <rect x="19" y="2"  width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
              <rect x="2"  y="19" width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
              <rect x="19" y="19" width="13" height="13" rx="2.5" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-white text-xl font-bold tracking-tight">نظام المكاتبات</h1>
            <p className="text-green-400/70 text-xs mt-1">سجّل دخولك للمتابعة</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col gap-4">

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs text-red-400">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-green-300/70 font-medium">اسم المستخدم</label>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="أدخل اسم المستخدم"
              autoComplete="username"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#1d6f42] focus:ring-2 focus:ring-[#1d6f42]/30 transition-all text-right"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-green-300/70 font-medium">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#1d6f42] focus:ring-2 focus:ring-[#1d6f42]/30 transition-all text-right"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-1 py-2.5 bg-[#1d6f42] hover:bg-[#25915a] text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-900/40"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                جاري التحقق...
              </>
            ) : (
              <>
                دخول
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-1.5">
          <p className="text-green-400/70 text-xs font-semibold text-center mb-1">بيانات تجريبية</p>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">اسم المستخدم</span>
            <span className="text-white/80 font-mono">admin</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">كلمة المرور</span>
            <span className="text-white/80 font-mono">admin123</span>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          تواصل مع المدير لاستعادة كلمة المرور
        </p>
      </div>
    </div>
  );
}