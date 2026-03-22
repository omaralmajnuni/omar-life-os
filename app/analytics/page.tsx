"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, TrendingUp, Star, Award, ChevronLeft, Loader2 } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { SectionCard } from "../../components/SectionCard";

export default function Analytics() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const rawData = localStorage.getItem("lifeos_history");
        if (!rawData) { setHistory([]); setLoading(false); return; }
        const data = JSON.parse(rawData);
        setHistory(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch { setHistory([]); }
      finally { setLoading(false); }
    };
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  const today = history[0];
  const yesterday = history[1];
  const bestDay = history.length > 0
    ? history.reduce((prev, cur) => (prev.dailyScore > cur.dailyScore ? prev : cur))
    : { dailyScore: 0, date: "" };
  const worstDay = history.length > 0
    ? history.reduce((prev, cur) => (prev.dailyScore < cur.dailyScore ? prev : cur))
    : { dailyScore: 0, date: "" };

  const weeklyRecords = history.slice(0, 7);
  const monthlyRecords = history.slice(0, 30);
  const weeklyAvg = weeklyRecords.reduce((acc, cur) => acc + cur.dailyScore, 0) / Math.max(weeklyRecords.length, 1);
  const monthlyAvg = monthlyRecords.reduce((acc, cur) => acc + cur.dailyScore, 0) / Math.max(monthlyRecords.length, 1);

  const lastWeekRecords = history.slice(7, 14);
  const lastWeekAvg = lastWeekRecords.length > 0
    ? lastWeekRecords.reduce((acc, cur) => acc + cur.dailyScore, 0) / lastWeekRecords.length
    : 0;
  const weekDiff = weeklyAvg - lastWeekAvg;
  const scoreDiff = today && yesterday ? today.dailyScore - yesterday.dailyScore : 0;

  const getTrendMessage = () => {
    if (!today || !yesterday) return "نحتاج بيانات أكثر للمقارنة 👍";
    if (scoreDiff > 0) return "أداءك اليوم أفضل من أمس 👏";
    if (scoreDiff < 0) return "انخفض مستواك اليوم ⚠️";
    return "مستواك ثابت 👍";
  };

  const getProblemInsights = () => {
    const insights = [];
    if (today) {
      const taskRatio = today.tasksCompleted / (today.tasksTotal || 1);
      const habitRatio = today.habitsCompleted / (today.habitsTotal || 1);
      if (habitRatio < taskRatio) insights.push({ text: "مشكلتك في الالتزام بالعادات ⚠️", color: "text-orange-400" });
      if (taskRatio < 0.5) insights.push({ text: "تحتاج تركز على إنجاز المهام 🎯", color: "text-blue-400" });
      if (today.religiousScore !== undefined && today.religiousScore < 50)
        insights.push({ text: "حاول تقوي التزامك الديني اليوم 🕌", color: "text-orange-400" });
    }
    return insights;
  };

  const problems = getProblemInsights();

  let goodStreak = 0;
  for (const record of history) {
    if (record.dailyScore >= 70) goodStreak++;
    else break;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-zinc-500 font-bold animate-pulse text-sm">جاري تحميل بياناتك...</p>
      </main>
    );
  }

  if (history.length === 0) {
    return (
      <PageContainer>
        <header className="flex flex-col items-center text-center space-y-1 mt-2 md:mt-4">
          <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-l from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            تحليلات الأداء
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm">سجل الإنجازات</p>
        </header>
        <SectionCard className="p-12 md:p-20 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl opacity-50">📊</div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-black">لا يوجد بيانات حتى الآن</h2>
            <p className="text-zinc-500 font-medium max-w-xs text-sm">ابدأ بإنجاز مهامك اليوم لتبدأ في تسجيل تاريخك!</p>
          </div>
          <Link href="/" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black rounded-2xl transition-all hover:scale-105 text-sm">
            اذهب للرئيسية
          </Link>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <header className="flex flex-col items-center text-center space-y-1 mt-2 md:mt-4">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-l from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          تحليلات الأداء
        </h1>
        <p className="text-zinc-400 text-sm sm:text-lg md:text-xl font-medium">التوجهات والتحليل المعمق</p>
      </header>

      {/* 1. Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <HighlightCard 
          title="اليوم vs أمس" 
          value={today ? `${today.dailyScore}%` : "---"} 
          subtitle={getTrendMessage()}
          icon={TrendingUp}
          color={scoreDiff >= 0 ? "text-emerald-400" : "text-rose-400"}
        />
        <HighlightCard 
          title="متوسط الأسبوع" 
          value={`${Math.round(weeklyAvg)}%`} 
          subtitle={today && today.dailyScore >= weeklyAvg ? "أنت فوق المتوسط الأسبوعي 🚀" : "فرصة للتحسين غداً"}
          icon={Star}
          color="text-blue-400"
        />
        <HighlightCard 
          title="متوسط الشهر" 
          value={`${Math.round(monthlyAvg)}%`} 
          subtitle="أدائك التراكمي لآخر 30 يوم"
          icon={Award}
          color="text-cyan-400"
        />
      </section>

      {/* 2. Smart Comparison */}
      <SectionCard title="مقارنة الأداء الذكية" icon={TrendingUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mt-2">
          <div className="space-y-1.5">
            <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">مقارنة مع أمس</p>
            <div className={`text-xl md:text-3xl font-black ${scoreDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {scoreDiff >= 0 ? `أفضل من أمس +${scoreDiff}% 🔥` : `أقل من أمس ${scoreDiff}% ⚠️`}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">مقارنة مع الأسبوع الماضي</p>
            <div className={`text-xl md:text-3xl font-black ${weekDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lastWeekRecords.length > 0
                ? (weekDiff >= 0 ? `تحسن أسبوعي +${Math.round(weekDiff)}% 🚀` : `تراجع أسبوعي ${Math.round(weekDiff)}% 📉`)
                : <span className="text-zinc-600 text-base font-bold">بيانات الأسبوع الماضي غير متوفرة</span>}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 3. Deep Analysis */}
      <SectionCard title="تحليل الأداء" icon={Star}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mt-2">
          {/* Problems */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 shadow-inner">
            <h3 className="text-zinc-400 font-bold text-xs uppercase flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> نقاط التركيز
            </h3>
            <div className="space-y-3">
              {problems.length > 0 ? problems.map((p, i) => (
                <div key={i} className={`flex items-center gap-3 font-black text-sm md:text-lg ${p.color}`}>
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0" />
                  {p.text}
                </div>
              )) : (
                <div className="text-emerald-400 font-black flex items-center gap-3 text-sm md:text-lg">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce shrink-0" />
                  أداء متوازن وممتاز اليوم! ✨
                </div>
              )}
            </div>
          </div>

          {/* Records */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 shadow-inner">
            <h3 className="text-zinc-400 font-bold text-xs uppercase flex items-center gap-2">
              <Award className="w-4 h-4" /> أرقام قياسية
            </h3>
            <div className="flex justify-between items-center bg-zinc-900/50 p-3 md:p-4 rounded-xl border border-zinc-800/50">
              <div>
                <p className="text-orange-400 font-black text-2xl md:text-3xl">{bestDay.dailyScore}%</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase">أعلى تقييم</p>
              </div>
              <div className="text-right border-r border-zinc-800 pr-4 md:pr-6">
                <p className="text-rose-500 font-black text-2xl md:text-3xl">{worstDay.dailyScore}%</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase">أقل تقييم</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 4. History List */}
      <SectionCard title="سجل الأيام السابقة" icon={Calendar}>
        <div className="absolute top-4 left-4 md:top-6 md:left-8">
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black border border-emerald-500/20">
            {goodStreak} أيام 🔥
          </div>
        </div>

        <div className="space-y-3 mt-6 md:mt-8">
          {history.map((record) => (
            <div
              key={record.date}
              className="group bg-zinc-900 border border-zinc-800 p-3 md:p-6 rounded-xl md:rounded-2xl flex items-center justify-between hover:border-zinc-600 transition-all hover:translate-x-[-4px] md:hover:translate-x-[-8px] shadow-sm"
            >
              <div className="flex items-center gap-3 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-sm md:text-2xl shadow-inner group-hover:text-emerald-400 transition-colors shrink-0">
                  {record.dailyScore}%
                </div>
                <div className="flex flex-col">
                  <span className="text-sm md:text-xl font-black leading-tight">
                    {new Date(record.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-zinc-500 text-[10px] md:text-sm font-bold flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" /> {record.tasksCompleted}/{record.tasksTotal}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> {record.habitsCompleted}/{record.habitsTotal}
                    {record.religiousScore !== undefined && (
                      <><span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" /> {record.religiousScore}%</>
                    )}
                  </span>
                </div>
              </div>
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full shrink-0 ${
                record.dailyScore >= 90 ? 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.4)]'
                : record.dailyScore >= 70 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                : record.dailyScore >= 50 ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.4)]'
                : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
              } transition-all group-hover:scale-125`} />
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}

function HighlightCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] space-y-3 md:space-y-6 shadow-xl hover:border-zinc-700 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-all" />
      <div className="flex items-start justify-between relative z-10">
        <p className="text-zinc-500 font-black text-[10px] md:text-xs uppercase tracking-widest">{title}</p>
        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl bg-zinc-950 border border-zinc-800 ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>
      <div className="space-y-1 relative z-10">
        <h3 className="text-3xl md:text-5xl font-black tracking-tight">{value}</h3>
        <p className={`text-xs md:text-sm font-bold leading-relaxed ${color}`}>{subtitle}</p>
      </div>
    </div>
  );
}
