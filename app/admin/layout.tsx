"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, Target, CheckSquare, Repeat, LogOut, Menu, X, Activity, CreditCard, Settings, Shield, ScrollText, MessageCircle } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      // Skip verification on login page
      if (pathname === '/admin/login') {
        setLoading(false);
        return;
      }

      try {
        // 1. Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          localStorage.removeItem("admin_auth");
          router.replace('/admin/login');
          return;
        }

        // 2. Verify admin role from profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error || !profile || profile.role !== 'admin') {
          localStorage.removeItem("admin_auth");
          await supabase.auth.signOut();
          router.replace('/');
          return;
        }

        // 3. All checks passed
        setIsAuth(true);
      } catch {
        localStorage.removeItem("admin_auth");
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [pathname, router]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  );

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuth) {
    // المستخدم غير مصرح له - الـ layout يقوم بـ redirect لكن نعرض شاشة انتظار آمنة
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">جاري إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_user_id");
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const menu = [
    { label: "الرئيسية", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "المستخدمين", path: "/admin/users", icon: <Users className="w-5 h-5" /> },
    { label: "الأهداف", path: "/admin/goals", icon: <Target className="w-5 h-5" /> },
    { label: "المهام", path: "/admin/tasks", icon: <CheckSquare className="w-5 h-5" /> },
    { label: "العادات", path: "/admin/habits", icon: <Repeat className="w-5 h-5" /> },
    { label: "التحليلات", path: "/admin/analytics", icon: <Activity className="w-5 h-5" /> },
    { label: "الاشتراكات", path: "/admin/subscriptions", icon: <CreditCard className="w-5 h-5" /> },
    { label: "طلبات الاشتراكات", path: "/admin/subscription-requests", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "الشكاوى والاقتراحات", path: "/admin/feedback", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "الإعدادات", path: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
    { label: "سجل العمليات", path: "/admin/logs", icon: <ScrollText className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row rtl whitespace-nowrap overflow-x-hidden" dir="rtl">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-30">
        <h1 className="font-bold text-lg text-emerald-400 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          لوحة الإدارة
        </h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 p-2">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 right-0 z-40 h-screen w-64 bg-zinc-950 border-l border-zinc-900 transition-transform duration-300 flex flex-col md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 flex-1">
          <h1 className="font-bold text-2xl text-emerald-400 mb-8 hidden md:flex items-center gap-2">
            <Shield className="w-6 h-6" />
            لوحة الإدارة
          </h1>
          <nav className="space-y-2">
            {menu.map(item => {
              const active = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}>
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-zinc-900 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors w-full px-4 py-3">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto min-h-screen">
         {children}
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
