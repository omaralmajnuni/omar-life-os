import React from "react";

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-3 py-3 md:px-8 md:py-8 pt-20 md:pt-28 pb-28 md:pb-16">
      <div className="max-w-4xl mx-auto space-y-5 md:space-y-10">
        {children}
      </div>
    </main>
  );
}
