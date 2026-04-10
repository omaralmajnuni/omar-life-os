"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Loader2, Shield } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!data.session) throw new Error('فشل تسجيل الدخول');

      // 2. Check admin role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        // Sign out if not admin
        await supabase.auth.signOut();
        setError('ليس لديك صلاحية الوصول إلى لوحة الإدارة.');
        setLoading(false);
        return;
      }

      // 3. Log the action & redirect
      const { logAdminAction } = await import('@/lib/adminLog');
      await logAdminAction('admin_login', 'auth', data.session.user.id, `تسجيل دخول: ${email}`);

      localStorage.setItem("admin_auth", "true");
      localStorage.setItem("admin_user_id", data.session.user.id);
      router.push('/admin');

    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 rtl" dir="rtl">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">تسجيل دخول الإدارة</h1>
          <p className="text-zinc-500 text-sm">أدخل بيانات حساب الأدمن للمتابعة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium px-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                placeholder="admin@example.com"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium px-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                placeholder="••••••••"
                dir="ltr"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl py-3.5 transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
