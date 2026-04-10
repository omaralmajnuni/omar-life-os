"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Target, User } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function Nav() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const navItems = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "الداشبورد", href: "/dashboard", icon: LayoutDashboard },
    { name: "الأهداف", href: "/goals", icon: Target },
    { name: "بياناتي", href: "/profile", icon: User },
  ];

  // Hide nav on login and all admin pages
  if (pathname === '/login' || pathname === '/reset-password' || pathname.startsWith('/admin')) return null;

  const navBg = theme === 'dark' 
    ? 'bg-zinc-900/90 border-zinc-800 shadow-2xl' 
    : 'bg-white/95 border-slate-200/80 shadow-lg shadow-slate-200/50';

  return (
    <>
      <style>{`
        #app-main-layout {
          padding-bottom: calc(85px + env(safe-area-inset-bottom)) !important;
        }
        @media (min-width: 768px) {
          #app-main-layout {
            padding-bottom: calc(90px + env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
      <nav className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl border px-2 py-1.5 md:py-2.5 rounded-[2rem] md:rounded-2xl ${navBg}`}>
        <div className="flex items-center gap-2 md:gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center gap-1.5 p-3.5 sm:p-2 sm:px-3 rounded-2xl text-sm md:text-base font-bold transition-all ${
                  isActive 
                    ? "text-emerald-500 bg-emerald-500/10 scale-105" 
                    : theme === 'dark' 
                      ? "text-zinc-400 hover:text-white hover:bg-zinc-800/50" 
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <Icon className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}