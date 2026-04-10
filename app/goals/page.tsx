"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Target, Plus, User } from "lucide-react";
import Link from "next/link";
import GoalCard from "@/components/GoalCard";
import AddGoalModal from "@/components/AddGoalModal";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { TrialExpiredScreen } from "@/components/TrialExpiredScreen";
import { useTheme } from "@/components/ThemeProvider";

export default function GoalsPage() {
  const { theme, classes } = useTheme();
  const [activeTab, setActiveTab] = useState("weekly");
  const [goals, setGoals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { isTrialExpired, isCheckingTrial } = useTrialStatus();

  const fetchGoals = async (uid: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Supabase Error fetching goals:", error);
    } else if (data) {
      setGoals(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const initGoals = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        fetchGoals(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    initGoals();
  }, []);

  const handleRefresh = () => {
    if (userId) fetchGoals(userId);
  };

  const handleOptimisticUpdate = useCallback((id: string, updates: any) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const filteredGoals = goals.filter(g => g.period === activeTab);

  if (isLoading || isCheckingTrial) return <div className={`min-h-screen ${classes.bg}`} />;
  if (isTrialExpired) return <TrialExpiredScreen />;

  return (
    <div className={`pb-12 px-4 py-8 md:px-8 md:py-12 max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8 ${classes.bg}`} dir="rtl">
      
      <header className="flex justify-between items-start w-full mb-6">
        <div className="flex flex-col space-y-0.5">
          <span className={`text-xs md:text-sm font-bold uppercase tracking-widest ${classes.muted}`}>
            {new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date())} {new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long' }).format(new Date())}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 select-none touch-none text-emerald-500">
            الأهداف
          </h1>
        </div>
        
        <div className="flex items-center gap-2.5 md:gap-3">
          <Link href="/profile" className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border overflow-hidden transition-all ${
             theme === 'dark' ? "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/50" : "bg-slate-100 hover:bg-slate-200 border-slate-200/80"
          }`}>
            <User className={`w-5 h-5 md:w-6 md:h-6 ${classes.muted}`} />
          </Link>
        </div>
      </header>

      {!userId ? (
        <div className={`${classes.card} border rounded-3xl p-8 text-center mt-10 flex flex-col items-center`}>
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 text-rose-500">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">اربط أهدافك بحسابك</h2>
          <p className={`${classes.muted} text-sm mb-6 max-w-sm`}>
            نحتاج لرقم جوالك لربط أهدافك الشخصية وحفظها بأمان ليتم عرضها لاحقاً في أي وقت.
          </p>
          <Link 
            href="/profile"
            className="w-full sm:w-auto px-8 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-lg py-3.5 rounded-2xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-[0.98]"
          >
            إكمال الملف الشخصي
          </Link>
        </div>
      ) : (
        <>
          <div className={`flex ${classes.cardInner} p-1.5 rounded-2xl border ${classes.mutedBorder} w-full mb-8`}>
            {[
              { id: 'weekly', label: 'أسبوعي' },
              { id: 'monthly', label: 'شهري' },
              { id: 'yearly', label: 'سنوي' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? (theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : `${classes.muted} hover:text-zinc-300`}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredGoals.length === 0 ? (
              <div className={`col-span-full py-16 text-center font-bold border border-dashed rounded-3xl ${classes.muted} ${classes.mutedBorder} ${classes.cardInner}`}>
                لا توجد أهداف حالياً في هذا القسم. اضغط على الزر أدناه لإضافة هدفك الأول!
              </div>
            ) : (
              filteredGoals.map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onUpdate={handleRefresh} 
                  onDelete={handleRefresh}
                  onOptimisticUpdate={handleOptimisticUpdate}
                />
              ))
            )}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-lg py-4 rounded-2xl md:rounded-3xl transition-all shadow-lg active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 bg-zinc-950/20 rounded-full p-0.5" />
            إضافة هدف جديد
          </button>
        </>
      )}

      <AddGoalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onGoalAdded={handleRefresh}
        userId={userId}
      />
    </div>
  );
}
