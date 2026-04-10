"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";

export function SectionCard({ 
  children, 
  title, 
  icon: Icon, 
  className = "" 
}: { 
  children: React.ReactNode, 
  title?: string, 
  icon?: any, 
  className?: string 
}) {
  const { classes, theme } = useTheme();

  return (
    <section className={`${classes.card} border rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-sm relative overflow-hidden group transition-all ${theme === 'dark' ? 'hover:border-zinc-700' : 'hover:border-zinc-300'} ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />}
            {title}
          </h2>
        </div>
      )}
      {children}
    </section>
  );
}
