"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, Loader2, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { classes } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase will automatically pick up the recovery token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if we already have a session (user clicked the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!password) {
      setMsg({ type: "error", text: "الرجاء إدخال كلمة المرور الجديدة." });
      return;
    }
    if (password.length < 8) {
      setMsg({ type: "error", text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." });
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setMsg({ type: "error", text: "كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل." });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "كلمات المرور غير متطابقة." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح! جاري التوجيه..." });
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "حدث خطأ أثناء تحديث كلمة المرور." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full ${classes.inputBg} border rounded-xl py-3 pr-4 pl-10 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans`;

  if (!ready) {
    return (
      <div className={`min-h-screen ${classes.bg} flex flex-col justify-center items-center p-4 rtl`} dir="rtl">
        <div className="w-full max-w-md text-center space-y-6 animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">جاري التحقق...</h1>
          <p className={classes.muted}>
            إذا لم يتم التحقق تلقائياً، تأكد من فتح الرابط المرسل إلى بريدك الإلكتروني.
          </p>
          <button
            onClick={() => router.push("/login")}
            className={`text-sm ${classes.muted} hover:text-emerald-500 transition-colors`}
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${classes.bg} flex flex-col justify-center items-center p-4 rtl`} dir="rtl">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
            <KeyRound className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">إعادة تعيين كلمة المرور</h1>
          <p className={classes.muted}>أدخل كلمة مرور جديدة لحسابك.</p>
        </div>

        {/* Card */}
        <div className={`${classes.card} border rounded-3xl p-8 shadow-xl transition-all duration-300`}>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <label className={`text-sm font-medium ${classes.muted} ml-1 block`}>كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  dir="ltr"
                  required
                />
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${classes.muted}`} />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${classes.muted} ml-1 block`}>تأكيد كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  dir="ltr"
                  required
                />
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${classes.muted}`} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              تحديث كلمة المرور
            </button>

            {msg && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
                msg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-500"
              }`}>
                {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {msg.text}
              </div>
            )}

          </form>
        </div>

      </div>
    </div>
  );
}
