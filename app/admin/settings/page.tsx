"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, LogOut, Save, Eye, EyeOff, Shield, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Logout all
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutMsg, setLogoutMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-600 font-sans";
  const labelClass = "block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider";

  // --- Password Change ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdMsg({ type: "error", text: "الرجاء تعبئة جميع الحقول." });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "كلمات المرور غير متطابقة." });
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPwdMsg({ type: "error", text: "كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل." });
      return;
    }

    setPwdLoading(true);
    try {
      // Verify current password by re-signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("لم يتم العثور على المستخدم.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        setPwdMsg({ type: "error", text: "كلمة المرور الحالية غير صحيحة." });
        setPwdLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPwdMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdMsg({ type: "error", text: err.message || "حدث خطأ أثناء تغيير كلمة المرور." });
    } finally {
      setPwdLoading(false);
    }
  };

  // --- Email Change ---
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);

    if (!newEmail) {
      setEmailMsg({ type: "error", text: "الرجاء إدخال البريد الإلكتروني الجديد." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailMsg({ type: "error", text: "صيغة البريد الإلكتروني غير صحيحة." });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMsg({ type: "success", text: "تم إرسال رابط التأكيد إلى البريد الجديد. يرجى التحقق من بريدك." });
      setNewEmail("");
    } catch (err: any) {
      setEmailMsg({ type: "error", text: err.message || "حدث خطأ أثناء تحديث البريد." });
    } finally {
      setEmailLoading(false);
    }
  };

  // --- Logout All Sessions ---
  const handleLogoutAll = async () => {
    setLogoutMsg(null);
    setLogoutLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      setLogoutMsg({ type: "success", text: "تم تسجيل الخروج من جميع الأجهزة. سيتم إعادة توجيهك..." });
      setTimeout(() => {
        localStorage.removeItem("admin_auth");
        window.location.href = "/admin/login";
      }, 2000);
    } catch (err: any) {
      setLogoutMsg({ type: "error", text: err.message || "حدث خطأ." });
      setLogoutLoading(false);
    }
  };

  const MsgBox = ({ msg }: { msg: { type: "success" | "error"; text: string } }) => (
    <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border mt-4 ${
      msg.type === "success"
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
    }`}>
      {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {msg.text}
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-400" />
          الإعدادات
        </h1>
        <p className="text-zinc-500 text-sm">إدارة الحساب والأمان</p>
      </div>

      {/* Password Change Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">تغيير كلمة المرور</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className={labelClass}>كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>كلمة المرور الجديدة</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              dir="ltr"
            />
          </div>

          <div>
            <label className={labelClass}>تأكيد كلمة المرور الجديدة</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              dir="ltr"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPasswords ? "إخفاء كلمات المرور" : "إظهار كلمات المرور"}
          </button>

          <button
            type="submit"
            disabled={pwdLoading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-60"
          >
            {pwdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            تحديث كلمة المرور
          </button>

          {pwdMsg && <MsgBox msg={pwdMsg} />}
        </form>
      </div>

      {/* Email Change Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">تغيير البريد الإلكتروني</h2>
        </div>

        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className={labelClass}>البريد الإلكتروني الجديد</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className={inputClass}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={emailLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60"
          >
            {emailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
            تحديث البريد الإلكتروني
          </button>

          {emailMsg && <MsgBox msg={emailMsg} />}
        </form>
      </div>

      {/* Logout All Sessions Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <LogOut className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-bold text-white">تسجيل الخروج من جميع الأجهزة</h2>
        </div>
        <p className="text-zinc-500 text-sm">سيتم تسجيل خروجك من جميع الأجهزة والمتصفحات المتصلة بحسابك.</p>

        <button
          onClick={handleLogoutAll}
          disabled={logoutLoading}
          className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-3 rounded-xl border border-rose-500/20 transition-all disabled:opacity-60"
        >
          {logoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          تسجيل الخروج من الكل
        </button>

        {logoutMsg && <MsgBox msg={logoutMsg} />}
      </div>
    </div>
  );
}
