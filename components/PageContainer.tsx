"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";

export function PageContainer({ children }: { children: React.ReactNode }) {
  const { classes } = useTheme();
  
  return (
    <main className={`min-h-screen ${classes.bg} px-3 py-3 md:px-8 md:py-8 pt-20 md:pt-28 pb-28 md:pb-16 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto space-y-5 md:space-y-10">
        {children}
      </div>
    </main>
  );
}
