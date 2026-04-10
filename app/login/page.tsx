"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, Loader2, UserPlus, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { classes, theme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    if (!forgotEmail) {
      setForgotMsg({ type: 'error', text: 'الرجاء إدخال البريد الإلكتروني.' });
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotMsg({ type: 'success', text: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' });
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: err.message || 'حدث خطأ.' });
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
    if (!/[a-zA-Z]/.test(pass)) return "كلمة المرور يجب أن تحتوي على حرف إنجليزي واحد على الأقل.";
    if (!/\d/.test(pass)) return "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.";
    if (/[\u0600-\u06FF]/.test(pass)) return "عذراً، كلمة المرور يجب أن تكون باللغة الإنجليزية ولا تقبل الأحرف العربية.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('الرجاء تعبئة جميع الحقول المطلوبة.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMsg('كلمات المرور غير متطابقة.');
        return;
      }
      const pwdError = validatePassword(password);
      if (pwdError) {
        setErrorMsg(pwdError);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMsg('تم تسجيل الدخول بنجاح! جاري التوجيه...');
          router.push('/');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          if (data.session) {
            setSuccessMsg('تم إنشاء الحساب بنجاح! جاري التوجيه...');
            router.push('/profile');
          } else {
            setSuccessMsg('تم إنشاء الحساب، يرجى التحقق من بريدك الإلكتروني ثم تسجيل الدخول');
          }
        }
      }
    } catch (error: any) {
      if (mode === 'login') {
        setErrorMsg('فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
      } else {
        setErrorMsg(error.message || 'حدث خطأ أثناء إنشاء الحساب.');
      }
    } finally {
      if (!(mode === 'login' && !errorMsg && successMsg)) {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const inputClass = `w-full ${classes.inputBg} border rounded-xl py-3 pr-4 pl-10 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans`;

  return (
    <div className={`min-h-screen ${classes.bg} flex flex-col justify-center items-center p-4 rtl`} dir="rtl">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10 transition-colors">
            {mode === 'login' ? (
              <Lock className="w-8 h-8 text-emerald-500" />
            ) : (
              <UserPlus className="w-8 h-8 text-emerald-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <p className={classes.muted}>
            {mode === 'login' 
              ? 'مرحباً بعودتك! أدخل بياناتك للمتابعة.' 
              : 'ابدأ رحلتك معنا وسجل بياناتك أدناه.'}
          </p>
        </div>

        {/* Card */}
        <div className={`${classes.card} border rounded-3xl p-8 shadow-xl transition-all duration-300`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Messages */}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm px-4 py-3 rounded-xl animate-in fade-in">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm px-4 py-3 rounded-xl animate-in fade-in">
                {successMsg}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${classes.muted} ml-1 block`}>البريد الإلكتروني</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputClass}
                  dir="ltr"
                  required
                />
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${classes.muted}`} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${classes.muted} ml-1 block`}>كلمة المرور</label>
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
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotMsg(null); setForgotEmail(email); }}
                  className={`text-xs ${classes.muted} hover:text-emerald-500 transition-colors mt-1`}
                >
                  نسيت كلمة المرور؟
                </button>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
            )}

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === 'login' ? (
                  <ArrowRight className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
              </button>

              {/* Mode Toggle */}
              <button 
                type="button"
                onClick={toggleMode}
                className={`text-sm ${classes.muted} hover:text-emerald-500 transition-colors py-2 text-center`}
              >
                {mode === 'login' 
                  ? 'ليس لديك حساب؟ قم بإنشاء حساب جديد' 
                  : 'لديك حساب بالفعل؟ قم بتسجيل الدخول'}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`${classes.card} border rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">استعادة كلمة المرور</h3>
              </div>
              <button onClick={() => setShowForgot(false)} className={`p-1.5 rounded-lg ${classes.muted} hover:text-rose-500 transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-sm ${classes.muted} mb-5`}>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.</p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputClass}
                  dir="ltr"
                  required
                />
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${classes.muted}`} />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                إرسال رابط الاستعادة
              </button>

              {forgotMsg && (
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
                  forgotMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                }`}>
                  {forgotMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : null}
                  {forgotMsg.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
