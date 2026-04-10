"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Target, Trophy, Clock, Calendar, CalendarDays, CheckCircle2, User, Plus, Heart, Moon, Flame, Activity } from "lucide-react";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";
import GoalProgressCard from "@/components/GoalProgressCard";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { TrialExpiredScreen } from "@/components/TrialExpiredScreen";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardPage() {
  const { theme, classes } = useTheme();
  const [goals, setGoals] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { isTrialExpired, isCheckingTrial } = useTrialStatus();

  // Daily performance stats calculated seamlessly from historical local logging
  const [dailyScore, setDailyScore] = useState(0);
  const [religionScore, setReligionScore] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [tasksScore, setTasksScore] = useState(0);

  // Progressive Leveling System
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        fetchGoals(session.user.id);

        // Process daily local history securely 
        const history = JSON.parse(localStorage.getItem(`lifeos_history_${session.user.id}`) || "[]");
        const today = new Date().toISOString().split("T")[0];
        const todayRecord = history.find((h: any) => h.date === today);

        if (todayRecord) {
          setDailyScore(todayRecord.dailyScore || 0);

          // 1) Religion
          const qTarget = todayRecord.quran?.target || 10;
          const qCurrent = todayRecord.quran?.current || 0;
          const qScore = qTarget > 0 ? Math.min(100, (qCurrent / qTarget) * 100) : 0;
          const pScore = todayRecord.prayers ? (Object.values(todayRecord.prayers).filter((p: any) => p.completed).length / 5) * 100 : 0;
          const aScore = todayRecord.adhkar ? ((todayRecord.adhkar.morning ? 50 : 0) + (todayRecord.adhkar.evening ? 50 : 0)) : 0;
          setReligionScore(Math.round((qScore + pScore + aScore) / 3) || 0);

          // 2) Health
          const wTarget = todayRecord.water?.target || 8;
          const wCurrent = todayRecord.water?.current || 0;
          const wScore = wTarget > 0 ? Math.min(100, (wCurrent / wTarget) * 100) : 0;
          const cTarget = todayRecord.calories?.target || 2000;
          const cCurrent = todayRecord.calories?.current || 0;
          const cScore = cTarget > 0 ? Math.min(100, (cCurrent / cTarget) * 100) : 0;
          const sTarget = todayRecord.steps?.target || 8000;
          const sCurrent = todayRecord.steps?.current || 0;
          const sScore = sTarget > 0 ? Math.min(100, (sCurrent / sTarget) * 100) : 0;
          setHealthScore(Math.round((wScore + cScore + sScore) / 3) || 0);

          // 3) Tasks
          const tasks = todayRecord.tasks || [];
          const habits = todayRecord.habits || [];
          const tScore = tasks.length > 0 ? (tasks.filter((t:any) => t.completed).length / tasks.length) * 100 : 0;
          const hScore = habits.length > 0 ? (habits.filter((h:any) => h.completed).length / habits.length) * 100 : 0;
          if (tasks.length === 0 && habits.length === 0) setTasksScore(0);
          else if (tasks.length > 0 && habits.length === 0) setTasksScore(Math.round(tScore));
          else if (tasks.length === 0 && habits.length > 0) setTasksScore(Math.round(hScore));
          else setTasksScore(Math.round((tScore + hScore) / 2));
        }

        // XP & Level Calculation (Retroactive)
        if (history && history.length > 0) {
          let totalXp = 0;
          history.forEach((h: any) => {
            const tCost = (h.tasks?.filter((t:any) => t.completed)?.length || 0) * 10;
            const hCost = (h.habits?.filter((ha:any) => ha.completed)?.length || 0) * 10;
            totalXp += (tCost + hCost);
            
            const pReady = h.prayers ? Object.values(h.prayers).some((p:any) => p.completed) : false;
            if (pReady || (h.quran?.current > 0) || h.adhkar?.morning || h.adhkar?.evening) totalXp += 5;

            if ((h.water?.current > 0) || (h.steps?.current > 0) || (h.calories?.current > 0) || h.waterIntake > 0) totalXp += 5;
            if (h.dailyScore > 0) totalXp += 10;
          });
          setLevel(Math.floor(totalXp / 100) + 1);
          setXp(totalXp % 100);
        }

      } else {
        setIsLoading(false);
      }
    };
    initDashboard();
  }, []);

  const fetchGoals = async (uid: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setGoals(data);
    }
    setIsLoading(false);
  };

  if (isLoading || isCheckingTrial) return <div className={`min-h-screen ${classes.bg}`} />;
  if (isTrialExpired) return <TrialExpiredScreen />;

  if (!userId) {
    return (
      <div className={`pb-12 px-4 py-8 md:px-8 md:py-12 max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8 ${classes.bg}`} dir="rtl">
        <header className="flex justify-between items-start w-full mb-6">
          <div className="flex flex-col space-y-0.5">
            <span className={`text-xs md:text-sm font-bold uppercase tracking-widest ${classes.muted}`}>
              {new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date())} {new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long' }).format(new Date())}
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 select-none touch-none text-emerald-500">
              الداشبورد
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
        <div className={`${classes.card} rounded-3xl p-8 text-center mt-10 flex flex-col items-center`}>
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 text-rose-500">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">اربط الداشبورد بحسابك</h2>
          <p className={`${classes.muted} text-sm mb-6 max-w-sm`}>
            نحتاج لرقم جوالك لنجلب بياناتك وإحصائياتك الخاصة من قاعدة البيانات.
          </p>
          <Link href="/profile" className="w-full sm:w-auto px-8 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-lg py-3.5 rounded-2xl transition-all shadow-lg active:scale-[0.98]">
            إكمال الملف الشخصي
          </Link>
        </div>
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  
  const overallPercent = goals.length === 0 ? 0 : Math.round(
    goals.reduce((acc, g) => acc + Math.min(1, g.current_value / g.target_value), 0) / goals.length * 100
  );

  const weeklyGoals = goals.filter(g => g.period === 'weekly');
  const monthlyGoals = goals.filter(g => g.period === 'monthly');
  const yearlyGoals = goals.filter(g => g.period === 'yearly');

  let closestGoal = null;
  if (activeGoals.length > 0) {
    closestGoal = [...activeGoals].sort((a, b) => {
      const remainingA = a.target_value - a.current_value;
      const remainingB = b.target_value - b.current_value;
      return remainingA - remainingB;
    })[0];
  }

  return (
    <div className={`pb-12 px-4 py-8 md:px-8 md:py-12 max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8 ${classes.bg}`} dir="rtl">
      <header className="flex justify-between items-start w-full mb-6">
        <div className="flex flex-col space-y-0.5">
          <span className={`text-xs md:text-sm font-bold uppercase tracking-widest ${classes.muted}`}>
            {new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date())} {new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long' }).format(new Date())}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 select-none touch-none text-emerald-500">
            الداشبورد
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

      {/* Motivational Hero Card & Level Bar */}
      <div className="mb-6">
        {/* User Level Strip */}
        <div className="flex items-center gap-3 px-4 py-2 border rounded-t-[2.5rem] bg-indigo-500/5 border-indigo-500/10 mb-[-1.5rem] pb-8">
           <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500 text-white font-black text-sm shrink-0 border-[3px] border-indigo-200/20 shadow-md">
             L{level}
           </div>
           <div className="flex-1">
             <div className="flex justify-between items-end mb-1">
               <span className="text-xs font-bold text-indigo-500">نقاط الخبرة (XP)</span>
               <span className="text-[10px] font-bold text-zinc-500">{xp} / 100</span>
             </div>
             <div className="h-2 w-full bg-indigo-500/10 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${xp}%` }} />
             </div>
           </div>
        </div>

        {/* Hero Card */}
        <div className="relative bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 rounded-[2.5rem] p-6 overflow-hidden flex items-center justify-between z-10 shadow-sm bg-white dark:bg-zinc-950">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
           <div className="z-10 flex flex-col space-y-1.5 w-3/5">
              <span className="text-zinc-400 font-bold text-xs md:text-sm tracking-wider uppercase">الإنجاز اليومي</span>
              <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-cyan-400 leading-tight">
                 {dailyScore === 100 ? "أداء أسطوري اليوم! 👑" : dailyScore >= 80 ? "أداء استثنائي! استمر يا بطل 🔥" : dailyScore >= 50 ? "أنت في الطريق الصحيح للقمة 🌟" : "كل تقدم يقرّبك للهدف 💫"}
              </h2>
           </div>
           <div className="relative w-24 h-24 shrink-0 flex items-center justify-center z-10">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
                 <circle cx="48" cy="48" r="40" className="stroke-zinc-800/60" strokeWidth="9" fill="none" />
                 <circle cx="48" cy="48" r="40" className="stroke-emerald-400 transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" strokeWidth="9" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * dailyScore) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-black text-white">{dailyScore}%</span>
              </div>
           </div>
        </div>
      </div>

      {/* 3 Categories Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-2">
         <div className={`${classes.card} flex flex-col items-center justify-center py-5 px-2 rounded-3xl border gap-2 text-center shadow-sm hover:border-indigo-500/30 transition-colors`}>
            <div className="w-12 h-12 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-full mb-1"><Moon className="w-6 h-6" /></div>
            <span className="font-black text-2xl text-white">{religionScore}%</span>
            <span className="text-[11px] md:text-xs font-bold text-zinc-500 uppercase tracking-wide">الدين</span>
         </div>
         <div className={`${classes.card} flex flex-col items-center justify-center py-5 px-2 rounded-3xl border gap-2 text-center shadow-sm hover:border-rose-500/30 transition-colors`}>
            <div className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-400 rounded-full mb-1"><Heart className="w-6 h-6" /></div>
            <span className="font-black text-2xl text-white">{healthScore}%</span>
            <span className="text-[11px] md:text-xs font-bold text-zinc-500 uppercase tracking-wide">الصحة</span>
         </div>
         <div className={`${classes.card} flex flex-col items-center justify-center py-5 px-2 rounded-3xl border gap-2 text-center shadow-sm hover:border-amber-500/30 transition-colors`}>
            <div className="w-12 h-12 flex items-center justify-center bg-amber-500/10 text-amber-400 rounded-full mb-1"><CheckCircle2 className="w-6 h-6" /></div>
            <span className="font-black text-2xl text-white">{tasksScore}%</span>
            <span className="text-[11px] md:text-xs font-bold text-zinc-500 uppercase tracking-wide">المهام</span>
         </div>
      </div>

      {/* Closest Goal */}
      {closestGoal && (
        <div className={`${classes.card} border rounded-3xl p-5 shadow-sm relative overflow-hidden mb-4`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-sm font-bold text-emerald-500 mb-4 flex items-center gap-2 relative z-10">
            <Trophy className="w-5 h-5" />
            أقرب هدف للإنجاز 🚀
          </h3>
          <div className="relative z-10">
            <GoalProgressCard goal={closestGoal} />
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className={`${classes.card} rounded-3xl p-8 text-center mt-6`}>
          <p className={`font-bold mb-4 text-lg ${classes.muted}`}>لا توجد لديك أهداف طويلة الأمد 🎯</p>
          <Link href="/goals" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black px-6 py-3.5 rounded-2xl transition-all">
            <Plus className="w-5 h-5" />
            إضافة هدف جديد
          </Link>
        </div>
      ) : (
        <>

          {/* Weekly Goals */}
          {weeklyGoals.length > 0 && (
            <div className={`space-y-4 p-5 rounded-2xl md:rounded-3xl border ${classes.card}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                أهداف هذا الأسبوع
              </h3>
              <div className="grid gap-3">
                {weeklyGoals.map(g => <GoalProgressCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}

          {/* Monthly Goals */}
          {monthlyGoals.length > 0 && (
            <div className={`space-y-4 p-5 rounded-2xl md:rounded-3xl border ${classes.card}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-500" />
                أهداف هذا الشهر
              </h3>
              <div className="grid gap-3">
                {monthlyGoals.map(g => <GoalProgressCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
