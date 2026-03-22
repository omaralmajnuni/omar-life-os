"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Target } from "lucide-react";

export default function Nav() {
  const pathname = usePathname();

  const navItems = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "الأهداف", href: "/goals", icon: Target },
    { name: "التحليلات", href: "/analytics", icon: BarChart2 },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-5 md:bottom-auto md:top-5 md:gap-10 transition-all">
      {navItems.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 text-sm md:text-base font-bold transition-all ${
              isActive ? "text-emerald-400 scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="w-[18px] h-[18px] md:w-5 md:h-5 shrink-0" />
            <span className="hidden sm:inline">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
