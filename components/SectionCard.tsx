import React from "react";

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
  return (
    <section className={`bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />}
            {title}
          </h2>
        </div>
      )}
      {children}
    </section>
  );
}
