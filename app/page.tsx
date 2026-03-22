"use client";

import { useState, useEffect } from "react";
import {
  Check, Flame, CheckCircle2, Sparkles, Moon, Sun,
  BookOpen, Star, Heart, TrendingUp, Lightbulb, SunMedium, Plus, Trash2, Activity, Droplets, Footprints, Pin
} from "lucide-react";
import { getAIInsights } from "../lib/aiInsights";
import { PageContainer } from "../components/PageContainer";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";

export default function Home() {
  // --- Theme ---
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("lifeos_theme");
    if (saved !== null) setDarkMode(saved === "dark");
  }, []);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("lifeos_theme", next ? "dark" : "light");
      return next;
    });
  };

  const bg = darkMode ? "bg-zinc-950 text-zinc-100" : "bg-slate-50 text-zinc-900";
  const card = darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-sm";
  const cardInner = darkMode ? "bg-zinc-950" : "bg-slate-100";
  const muted = darkMode ? "text-zinc-500" : "text-zinc-400";
  const mutedBorder = darkMode ? "border-zinc-800" : "border-zinc-200";
  const inputBg = darkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200";

  // --- State ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [tasks, setTasks] = useState<{ id: number; title: string; completed: boolean; isPinned?: boolean; pinned?: boolean }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskIsPinned, setNewTaskIsPinned] = useState(false);

  const [habits, setHabits] = useState<{ id: number; name: string; type: "positive" | "negative"; completed: boolean; streak: number; isPinned?: boolean; pinned?: boolean }[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitType, setNewHabitType] = useState<"positive" | "negative">("positive");
  const [newHabitIsPinned, setNewHabitIsPinned] = useState(false);

  const PRAYER_NAMES = [
    { id: "fajr", name: "الفجر" }, { id: "dhuhr", name: "الظهر" },
    { id: "asr", name: "العصر" }, { id: "maghrib", name: "المغرب" },
    { id: "isha", name: "العشاء" },
  ];
  const [prayers, setPrayers] = useState<Record<string, { completed: boolean; khushu: string }>>({
    fajr: { completed: false, khushu: "" }, dhuhr: { completed: false, khushu: "" },
    asr: { completed: false, khushu: "" }, maghrib: { completed: false, khushu: "" },
    isha: { completed: false, khushu: "" },
  });
  const [adhkar, setAdhkar] = useState({ morning: false, evening: false });
  const [quran, setQuran] = useState({ current: 0, target: 10 });
  const [activeKhushuModal, setActiveKhushuModal] = useState<string | null>(null);

  const [water, setWater] = useState({ current: 0, target: 8 });
  const [calories, setCalories] = useState({ current: 0, target: 2200 });
  const [steps, setSteps] = useState({ current: 0, target: 8000 });
  const [calInput, setCalInput] = useState("");
  const [stepInput, setStepInput] = useState("");

  const [weight, setWeight] = useState<number | string>(78.5);
  const [weightTarget, setWeightTarget] = useState<number | string>(4);
  const [weightStart, setWeightStart] = useState<number | string>(82.5);
  const [goalsProgress, setGoalsProgress] = useState(0);
  const [yesterdayComparison, setYesterdayComparison] = useState<{ diff: number; yesterdayScore: number } | null>(null);

  // --- Load Data ---
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("lifeos_history") || "[]");
    const todayRecord = history.find((h: any) => h.date === today);

    if (todayRecord) {
      if (todayRecord.tasks) setTasks(todayRecord.tasks);
      if (todayRecord.habits) setHabits(todayRecord.habits);
      if (todayRecord.prayers) setPrayers(todayRecord.prayers);
      if (todayRecord.adhkar) setAdhkar(todayRecord.adhkar);
      
      if (todayRecord.quran) setQuran(todayRecord.quran);
      else if (todayRecord.quranPages !== undefined) setQuran({ current: todayRecord.quranPages, target: 10 });
      
      if (todayRecord.water) setWater(todayRecord.water);
      else if (todayRecord.waterIntake !== undefined) setWater({ current: todayRecord.waterIntake, target: 8 });

      if (todayRecord.calories) setCalories(todayRecord.calories);
      if (todayRecord.steps) setSteps(todayRecord.steps);
      if (todayRecord.weight !== undefined) setWeight(todayRecord.weight);
    } else {
      let carriedTasks: any[] = [];
      let carriedHabits: any[] = [];
      
      if (history.length > 0) {
        const lastRecord = history[history.length - 1];
        if (lastRecord.tasks) carriedTasks = lastRecord.tasks.filter((t: any) => t.isPinned || t.pinned).map((t: any) => ({ ...t, completed: false }));
        if (lastRecord.habits) carriedHabits = lastRecord.habits.filter((h: any) => h.isPinned || h.pinned).map((h: any) => ({ ...h, completed: false }));
      }
      setTasks(carriedTasks);
      setHabits(carriedHabits);
      setPrayers({
        fajr: { completed: false, khushu: "" }, dhuhr: { completed: false, khushu: "" },
        asr: { completed: false, khushu: "" }, maghrib: { completed: false, khushu: "" },
        isha: { completed: false, khushu: "" }
      });
      setAdhkar({ morning: false, evening: false });
      setQuran({ current: 0, target: 10 });
      setWater(prev => ({ ...prev, current: 0 }));
      setCalories(prev => ({ ...prev, current: 0 }));
      setSteps(prev => ({ ...prev, current: 0 }));
    }

    const savedGoals = localStorage.getItem("lifeos_goals");
    if (savedGoals) {
      const goals = JSON.parse(savedGoals);
      if (goals.length > 0) {
        const totalProgress = goals.reduce((acc: number, g: any) => acc + g.current / g.target, 0);
        setGoalsProgress(Math.round((totalProgress / goals.length) * 100));
      }
    }

    try {
      const hist = JSON.parse(localStorage.getItem("lifeos_history") || "[]");
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yDateStr = yesterdayDate.toISOString().split("T")[0];
      const yRecord = hist.find((h: any) => h.date === yDateStr);
      if (yRecord && todayRecord) {
        setYesterdayComparison({ diff: todayRecord.dailyScore - yRecord.dailyScore, yesterdayScore: yRecord.dailyScore });
      }
    } catch {}

    const savedMonthlyWeight = localStorage.getItem("lifeos_weight_config");
    if (savedMonthlyWeight) {
      try {
        const parsed = JSON.parse(savedMonthlyWeight);
        if (parsed.start !== undefined) setWeightStart(parsed.start);
        if (parsed.target !== undefined) setWeightTarget(parsed.target);
      } catch {}
    }

    setIsLoaded(true);
  }, []);

  // --- Save Data ---
  useEffect(() => {
    if (!isLoaded) return;

    const today = new Date().toISOString().split("T")[0];
    const tasksDone = tasks.filter(t => t.completed).length;
    const habitsDone = habits.filter(h => h.completed).length;
    const tasksP = tasks.length > 0 ? (tasksDone / tasks.length) * 100 : 0;
    const habitsP = habits.length > 0 ? (habitsDone / habits.length) * 100 : 0;
    const prayersDone = Object.values(prayers).filter(p => p.completed).length;
    const religiousScore = Math.round(
      (prayersDone / 5) * 50 +
      ((adhkar.morning ? 1 : 0) + (adhkar.evening ? 1 : 0)) / 2 * 25 +
      Math.min((quran.current / Math.max(1, quran.target)) * 25, 25)
    );
    const mainScore = Math.round((tasksP + habitsP + religiousScore) / 3);

    const record = {
      date: today, dailyScore: mainScore, religiousScore,
      tasks, habits, prayers, adhkar, quran,
      tasksCompleted: tasksDone, tasksTotal: tasks.length,
      habitsCompleted: habitsDone, habitsTotal: habits.length,
      water, calories, steps, weight: parseFloat(weight as string) || 0,
      quranPages: quran.current,
      waterIntake: water.current
    };

    const history = JSON.parse(localStorage.getItem("lifeos_history") || "[]");
    const idx = history.findIndex((h: any) => h.date === today);
    if (idx > -1) history[idx] = record; else history.push(record);
    localStorage.setItem("lifeos_history", JSON.stringify(history));
  }, [isLoaded, tasks, habits, water, calories, steps, weight, prayers, adhkar, quran]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("lifeos_weight_config", JSON.stringify({ 
        start: parseFloat(weightStart as string) || 0, 
        target: parseFloat(weightTarget as string) || 0 
      }));
    }
  }, [weightStart, weightTarget, isLoaded]);

  // --- Goals Link ---
  const updateLinkedGoal = (linkedName: string, isCompleted: boolean) => {
    const savedGoals = localStorage.getItem("lifeos_goals");
    if (!savedGoals) return;
    const goals: any[] = JSON.parse(savedGoals);
    let total = 0;
    const updated = goals.map(goal => {
      let cur = goal.current;
      if (goal.linkedId === linkedName && isCompleted) cur = Math.min(cur + 1, goal.target);
      total += cur / goal.target;
      return { ...goal, current: cur, completed: cur >= goal.target };
    });
    setGoalsProgress(Math.round((total / goals.length) * 100));
    localStorage.setItem("lifeos_goals", JSON.stringify(updated));
  };

  // --- Task Ops ---
  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const done = !t.completed;
        if (done) updateLinkedGoal(t.title, true);
        return { ...t, completed: done };
      }
      return t;
    }));
  };
  const toggleTaskPin = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isPinned: !(t.isPinned || t.pinned) } : t));
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), title: newTaskTitle.trim(), completed: false, isPinned: newTaskIsPinned }]);
    setNewTaskTitle("");
    setNewTaskIsPinned(false);
  };
  const deleteTask = (id: number) => setTasks(prev => prev.filter(t => t.id !== id));

  // --- Habit Ops ---
  const toggleHabit = (id: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const done = !h.completed;
        if (done) updateLinkedGoal(h.name, true);
        return { ...h, completed: done, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) };
      }
      return h;
    }));
  };
  const toggleHabitPin = (id: number) => setHabits(prev => prev.map(h => h.id === id ? { ...h, isPinned: !(h.isPinned || h.pinned) } : h));
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    setHabits(prev => [...prev, { id: Date.now(), name: newHabitName.trim(), type: newHabitType, completed: false, streak: 0, isPinned: newHabitIsPinned }]);
    setNewHabitName("");
    setNewHabitIsPinned(false);
  };
  const deleteHabit = (id: number) => setHabits(prev => prev.filter(h => h.id !== id));

  // --- Religious Ops ---
  const togglePrayer = (id: string) => {
    const done = !prayers[id].completed;
    setPrayers(prev => ({ ...prev, [id]: { ...prev[id], completed: done } }));
    if (done) setActiveKhushuModal(id);
  };
  const setKhushu = (id: string, level: string) => {
    setPrayers(prev => ({ ...prev, [id]: { ...prev[id], khushu: level } }));
    setActiveKhushuModal(null);
  };
  const updateQuran = (delta: number) => setQuran(prev => ({ ...prev, current: Math.max(0, prev.current + delta) }));

  // --- Health Ops ---
  const updateWater = (delta: number) => setWater(prev => ({ ...prev, current: Math.max(0, prev.current + delta) }));
  const addCalories = () => {
    const amt = parseInt(calInput);
    if (!isNaN(amt) && amt !== 0) {
      setCalories(prev => ({ ...prev, current: Math.max(0, prev.current + amt) }));
    }
    setCalInput("");
  };
  const addSteps = () => {
    const amt = parseInt(stepInput);
    if (!isNaN(amt) && amt !== 0) {
      setSteps(prev => ({ ...prev, current: Math.max(0, prev.current + amt) }));
    }
    setStepInput("");
  };

  if (!isLoaded) return <div className={`min-h-screen ${bg}`} />; 

  // --- Computed Stats ---
  const tasksDoneCount = tasks.filter(t => t.completed).length;
  const tasksPercent = tasks.length > 0 ? (tasksDoneCount / tasks.length) * 100 : 0;
  const habitsDoneCount = habits.filter(h => h.completed).length;
  const habitsPercent = habits.length > 0 ? (habitsDoneCount / habits.length) * 100 : 0;
  
  const prayersDoneCount = Object.values(prayers).filter(p => p.completed).length;
  const adhkarDoneCount = (adhkar.morning ? 1 : 0) + (adhkar.evening ? 1 : 0);
  
  const finalReligiousScore = Math.round(
    (prayersDoneCount / 5) * 50 +
    (adhkarDoneCount / 2) * 25 +
    Math.min((quran.current / Math.max(1, quran.target)) * 25, 25)
  );
  const overallProgress = Math.round((tasksPercent + habitsPercent + finalReligiousScore) / 3);
  const aiInsights = getAIInsights({ tasksPercent, habitsPercent, religiousScore: finalReligiousScore, goalsProgress, overallProgress });

  const getScoreFeedback = (score: number) => {
    if (score >= 90) return { text: "يوم أسطوري 🔥", color: "text-orange-400" };
    if (score >= 70) return { text: "ممتاز 👏", color: "text-emerald-400" };
    if (score >= 50) return { text: "جيد 👍", color: "text-blue-400" };
    return { text: "تحتاج تشد حيلك ⚠️", color: darkMode ? "text-zinc-500" : "text-zinc-400" };
  };
  const feedback = getScoreFeedback(overallProgress);

  const parsedWeight = parseFloat(weight as string) || 0;
  const parsedStart = parseFloat(weightStart as string) || 0;
  const parsedTarget = parseFloat(weightTarget as string) || 0;

  const lostKg = parsedStart - parsedWeight;
  const progressPercent = parsedTarget > 0 ? (lostKg / parsedTarget) * 100 : 0;
  
  let weightStatus = "";
  if (lostKg < 0) weightStatus = "زيادة عن البداية ⚠️";
  else if (lostKg >= parsedTarget) weightStatus = "اكتمل الهدف 🏆";
  else weightStatus = `باقي ${(parsedTarget - lostKg).toFixed(1)} كجم`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`} dir="rtl">
      <main className="px-3 py-3 md:px-8 md:py-8 pt-16 md:pt-24 pb-28 max-w-4xl mx-auto space-y-4 md:space-y-6">
        
        <div className="flex justify-end">
          <button onClick={toggleTheme} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            darkMode ? "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-700 shadow-sm"
          }`}>
            {darkMode ? <><SunMedium className="w-3.5 h-3.5" /> فاتح</> : <><Moon className="w-3.5 h-3.5" /> داكن</>}
          </button>
        </div>

        <header className="flex flex-col items-center text-center space-y-1">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-l from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            مجموعة بن أحمد
          </h1>
          <p className={`text-sm sm:text-lg font-medium ${muted}`}>لوحة التحكم اليومية</p>
        </header>

        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[1.5rem] md:rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition duration-1000" />
          <div className={`relative border rounded-[1.5rem] md:rounded-[2rem] p-5 sm:p-8 md:p-12 flex flex-row items-center justify-between gap-4 shadow-2xl overflow-hidden ${card}`}>
            <div className="z-10 flex flex-col items-start space-y-2">
              <h2 className={`text-sm sm:text-xl font-black uppercase tracking-widest ${muted}`}>تقييم اليوم</h2>
              <span className={`text-5xl sm:text-7xl md:text-8xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] ${darkMode ? "text-white" : "text-zinc-900"}`}>
                {overallProgress}%
              </span>
              <p className={`text-xl sm:text-3xl md:text-4xl font-black italic tracking-tight ${feedback.color} transition-all`}>{feedback.text}</p>
            </div>
            <div className="relative flex items-center justify-center shrink-0 w-28 h-28 sm:w-44 sm:h-44 md:w-52 md:h-52">
              <svg className="w-full h-full -rotate-90 overflow-visible">
                <circle cx="50%" cy="50%" r="45" className={`fill-none stroke-[10px] sm:hidden ${darkMode ? "stroke-zinc-800" : "stroke-zinc-200"}`} />
                <circle cx="50%" cy="50%" r="45" className="stroke-emerald-400 stroke-[10px] fill-none transition-all duration-1000 ease-out sm:hidden"
                  strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - overallProgress / 100)} strokeLinecap="round" />
                <circle cx="50%" cy="50%" r="65" className={`fill-none stroke-[12px] hidden sm:block ${darkMode ? "stroke-zinc-800" : "stroke-zinc-200"}`} />
                <circle cx="50%" cy="50%" r="65" className="stroke-emerald-400 stroke-[12px] fill-none transition-all duration-1000 ease-out hidden sm:block"
                  strokeDasharray={2 * Math.PI * 65} strokeDashoffset={2 * Math.PI * 65 * (1 - overallProgress / 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
            </div>
          </div>
        </section>

        {yesterdayComparison !== null && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
            yesterdayComparison.diff > 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
            : yesterdayComparison.diff < 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
            : `${darkMode ? "bg-zinc-800/50 border-zinc-700 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"}`
          }`}>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>
                {yesterdayComparison.diff > 0 ? `أفضل من أمس +${yesterdayComparison.diff}% 🔥`
                  : yesterdayComparison.diff < 0 ? `أقل من أمس ${yesterdayComparison.diff}% ⚠️`
                  : "نفس مستوى أمس 👍"}
              </span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${muted}`}>مقارنة الأداء اليومي</span>
          </div>
        )}

        {/* AI & Insights section... */}
        <section className={`relative overflow-hidden border rounded-2xl md:rounded-[2.5rem] shadow-xl transition-all ${card}`}>
          <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/5 blur-[80px] rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="p-4 sm:p-7 md:p-10 relative z-10 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border flex items-center justify-center shadow-inner ${cardInner} ${mutedBorder}`}>
                  <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-emerald-400 animate-pulse" />
                </div>
                <div><h2 className="text-lg md:text-2xl font-black">تحليل اليوم</h2><p className={`font-bold text-xs md:text-sm ${muted}`}>رؤية ذكية ومخصصة لأدائك</p></div>
              </div>
              <span className={`hidden md:inline-flex px-4 py-1.5 rounded-full text-xs font-black text-emerald-400 uppercase tracking-widest border ${cardInner} ${mutedBorder}`}>AI Active</span>
            </div>
            <div className="space-y-2">
              <p className={`font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${muted}`}><TrendingUp className="w-3 h-3" /> أبرز التحليل</p>
              {aiInsights.insights.length > 0 ? aiInsights.insights.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 md:p-4 border rounded-xl md:rounded-2xl ${cardInner} ${mutedBorder}`}>
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="font-bold text-sm md:text-base leading-relaxed">{msg}</p>
                </div>
              )) : (
                <div className={`p-3 border rounded-xl italic font-medium text-sm ${muted} ${cardInner} ${mutedBorder}`}>أكمل مهامك وعاداتك لتظهر التحليلات...</div>
              )}
            </div>
          </div>
        </section>

        {/* 6 Summary Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-4">
          <StatCard darkMode={darkMode} title="الدين" value={`${finalReligiousScore}%`} percentage={finalReligiousScore} color="bg-orange-500" />
          <StatCard darkMode={darkMode} title="العادات" value={`${habitsDoneCount}/${habits.length}`} percentage={habitsPercent} color="bg-emerald-500" />
          <StatCard darkMode={darkMode} title="المهام" value={`${tasksDoneCount}/${tasks.length}`} percentage={tasksPercent} color="bg-blue-500" />
          <StatCard darkMode={darkMode} title="الموية" value={`${water.current}`} percentage={(water.current / water.target) * 100} color="bg-cyan-500" />
          <StatCard darkMode={darkMode} title="السعرات" value={`${calories.current}`} percentage={(calories.current / calories.target) * 100} color="bg-rose-500" />
          <StatCard darkMode={darkMode} title="الخطوات" value={`${steps.current}`} percentage={(steps.current / steps.target) * 100} color="bg-purple-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-4 md:space-y-8">
            <section className={`border rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-xl relative overflow-hidden transition-all ${card}`}>
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Star className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg md:text-2xl font-bold">الالتزام الديني</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-1.5">
                  {PRAYER_NAMES.map(prayer => (
                    <button key={prayer.id} onClick={() => togglePrayer(prayer.id)} className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${prayers[prayer.id].completed ? "bg-orange-500/10 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]" : `${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700" : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300"}`}`}>
                      <span className="text-[9px] font-black">{prayer.name}</span>
                      {prayers[prayer.id].completed ? <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border ${darkMode ? "border-zinc-700" : "border-zinc-300"}`} />}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setAdhkar({ ...adhkar, morning: !adhkar.morning })} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${adhkar.morning ? "bg-orange-400/10 border-orange-400 text-orange-500" : `${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-zinc-50 border-zinc-200 text-zinc-400"}`}`}>
                    <div className="flex items-center gap-2"><Sun className={`w-4 h-4 ${adhkar.morning ? "text-orange-400" : muted}`} /><span className="font-bold text-xs md:text-sm">أذكار الصباح</span></div>
                    {adhkar.morning && <Check className="w-4 h-4 text-orange-400" />}
                  </button>
                  <button onClick={() => setAdhkar({ ...adhkar, evening: !adhkar.evening })} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${adhkar.evening ? "bg-indigo-400/10 border-indigo-400 text-indigo-500" : `${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-zinc-50 border-zinc-200 text-zinc-400"}`}`}>
                    <div className="flex items-center gap-2"><Moon className={`w-4 h-4 ${adhkar.evening ? "text-indigo-400" : muted}`} /><span className="font-bold text-xs md:text-sm">أذكار المساء</span></div>
                    {adhkar.evening && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                </div>
                <div className={`p-3 md:p-4 rounded-xl border flex flex-col gap-3 ${cardInner} ${mutedBorder}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center"><BookOpen className="w-4 h-4 text-orange-400" /></div>
                      <div>
                        <h4 className="font-black text-sm">ورد القرآن</h4>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${muted}`}>
                          الهدف:
                          <input type="number" value={quran.target} onChange={e => setQuran({...quran, target: e.target.value ? Math.max(1, parseInt(e.target.value)) : '' as any})} className={`w-8 bg-transparent border-b text-center focus:outline-none ${darkMode?"border-zinc-700 focus:border-orange-500":"border-zinc-300 focus:border-orange-500"}`}/>
                          صفحة <span className="mx-1">•</span> متبقي: {Math.max(0, quran.target - quran.current)}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"}`}>
                      <button onClick={() => updateQuran(-1)} className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors ${darkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-200"}`}>-</button>
                      <input type="number" value={quran.current} onChange={(e) => setQuran({...quran, current: e.target.value ? Math.max(0, parseInt(e.target.value)) : '' as any})} className="w-10 text-center bg-transparent focus:outline-none font-black text-base text-orange-500" />
                      <button onClick={() => updateQuran(1)} className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors ${darkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-200"}`}>+</button>
                    </div>
                  </div>
                </div>

                <div className={`pt-3 border-t flex flex-col gap-2.5 ${mutedBorder}`}>
                  <div className="flex justify-between items-end">
                    <span className={`font-black text-[10px] uppercase tracking-widest ${muted}`}>مستوى الالتزام</span>
                    <span className="text-xl font-black text-orange-500 leading-none">{finalReligiousScore}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? "bg-zinc-900" : "bg-zinc-200"}`}>
                    <div className="h-full bg-orange-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(finalReligiousScore, 100)}%` }} />
                  </div>
                  <div className={`flex justify-between items-center text-[10px] font-bold ${muted}`}>
                    <span>صلوات: {prayersDoneCount}/5</span>
                    <span>أذكار: {adhkarDoneCount}/2</span>
                    <span>قرآن: {quran.current}/{quran.target}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Health Tracking UI */}
            <section className={`border rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-xl relative overflow-hidden transition-all ${card}`}>
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Activity className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg md:text-2xl font-bold">المتابعة الصحية</h2>
              </div>
              <div className="space-y-4">
                {/* Water */}
                <div className={`p-3 md:p-4 rounded-xl border flex flex-col gap-3 ${cardInner} ${mutedBorder}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center"><Droplets className="w-4 h-4 text-cyan-500" /></div>
                      <div>
                        <h4 className="font-black text-sm">الماء</h4>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${muted}`}>
                          الهدف:
                          <input type="number" value={water.target} onChange={e => setWater({...water, target: e.target.value ? Math.max(1, parseInt(e.target.value)) : '' as any})} className={`w-8 bg-transparent border-b text-center focus:outline-none ${darkMode?"border-zinc-700 focus:border-cyan-500":"border-zinc-300 focus:border-cyan-500"}`}/>
                          أكواب <span className="mx-1">•</span> متبقي: {Math.max(0, water.target - water.current)}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"}`}>
                      <button onClick={() => updateWater(-1)} className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors ${darkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-200"}`}>-</button>
                      <input type="number" value={water.current} onChange={(e) => setWater({...water, current: e.target.value ? Math.max(0, parseInt(e.target.value)) : '' as any})} className="w-10 text-center bg-transparent focus:outline-none font-black text-base text-cyan-500" />
                      <button onClick={() => updateWater(1)} className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors ${darkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-200"}`}>+</button>
                    </div>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-zinc-900" : "bg-zinc-200"}`}><div className="h-full bg-cyan-500 transition-all" style={{ width: `${Math.min((water.current / water.target) * 100, 100)}%` }} /></div>
                </div>

                {/* Calories */}
                <div className={`p-3 md:p-4 rounded-xl border flex flex-col gap-3 ${cardInner} ${mutedBorder}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center"><Flame className="w-4 h-4 text-rose-500" /></div>
                      <div>
                        <h4 className="font-black text-sm">السعرات</h4>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${muted}`}>
                          الهدف:
                          <input type="number" value={calories.target} onChange={e => setCalories({...calories, target: e.target.value ? Math.max(1, parseInt(e.target.value)) : '' as any})} className={`w-10 bg-transparent border-b text-center focus:outline-none ${darkMode?"border-zinc-700 focus:border-rose-500":"border-zinc-300 focus:border-rose-500"}`}/>
                          kcal <span className="mx-1">•</span> متبقي: {Math.max(0, calories.target - calories.current)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <input type="number" placeholder="+ إدخال" value={calInput} onChange={e => setCalInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCalories()} className={`w-20 text-xs px-2 py-1.5 rounded-lg border focus:outline-none focus:border-rose-500 text-center ${inputBg}`} />
                       <button onClick={addCalories} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-zinc-900" : "bg-zinc-200"}`}><div className="h-full bg-rose-500 transition-all" style={{ width: `${Math.min((calories.current / calories.target) * 100, 100)}%` }} /></div>
                </div>

                {/* Steps */}
                <div className={`p-3 md:p-4 rounded-xl border flex flex-col gap-3 ${cardInner} ${mutedBorder}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center"><Footprints className="w-4 h-4 text-purple-500" /></div>
                      <div>
                        <h4 className="font-black text-sm">الخطوات</h4>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${muted}`}>
                          الهدف:
                          <input type="number" value={steps.target} onChange={e => setSteps({...steps, target: e.target.value ? Math.max(1, parseInt(e.target.value)) : '' as any})} className={`w-10 bg-transparent border-b text-center focus:outline-none ${darkMode?"border-zinc-700 focus:border-purple-500":"border-zinc-300 focus:border-purple-500"}`}/>
                          خطوة <span className="mx-1">•</span> متبقي: {Math.max(0, steps.target - steps.current)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <input type="number" placeholder="+ إدخال" value={stepInput} onChange={e => setStepInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSteps()} className={`w-20 text-xs px-2 py-1.5 rounded-lg border focus:outline-none focus:border-purple-500 text-center ${inputBg}`} />
                       <button onClick={addSteps} className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-zinc-900" : "bg-zinc-200"}`}><div className="h-full bg-purple-500 transition-all" style={{ width: `${Math.min((steps.current / steps.target) * 100, 100)}%` }} /></div>
                </div>

                {/* Weight */}
                <div className={`p-3 md:p-4 rounded-xl border flex flex-col gap-3 ${cardInner} ${mutedBorder}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Activity className="w-4 h-4 text-emerald-500" /></div>
                      <div>
                        <h4 className="font-black text-sm">الوزن</h4>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${muted}`}>
                          الهدف:
                          <input type="number" step="0.1" value={weightTarget} onChange={e => setWeightTarget(e.target.value)} className={`w-8 bg-transparent border-b text-center focus:outline-none ${darkMode?"border-zinc-700 focus:border-emerald-500":"border-zinc-300 focus:border-emerald-500"}`}/>
                          كجم <span className="mx-1">•</span> البداية:
                          <input type="number" step="0.1" value={weightStart} onChange={e => setWeightStart(e.target.value)} className={`w-8 bg-transparent border-b text-center focus:outline-none ${darkMode?"border-zinc-700 focus:border-emerald-500":"border-zinc-300 focus:border-emerald-500"}`}/>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">الوزن الحالي</span>
                       <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className={`w-16 font-black text-sm md:text-base px-1 py-1 rounded-lg border focus:outline-none focus:border-emerald-500 text-center ${inputBg} text-emerald-500`} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold px-1 -my-1">
                    <span className={lostKg < 0 ? "text-amber-500" : muted}>{weightStatus}</span>
                    <span className="text-emerald-500 font-black">{progressPercent > 0 ? `${Math.min(100, Math.round(progressPercent))}%` : '0%'}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden flex-shrink-0 ${darkMode ? "bg-zinc-900" : "bg-zinc-200"}`}>
                    <div className={`h-full transition-all duration-1000 ${lostKg < 0 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4 md:space-y-8">
            <section className={`border rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-xl ${card}`}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg md:text-2xl font-bold">المهام</h2>
                </div>
              </div>
              <div className="space-y-2 relative">
                {tasks.length > 0 ? tasks.map(task => (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl transition-all border group/item ${
                      task.completed
                        ? `${darkMode ? "bg-zinc-950/50 border-emerald-500/10 text-zinc-500" : "bg-zinc-100 border-emerald-200 text-zinc-400"}`
                        : `${darkMode ? "bg-zinc-800/30 border-zinc-800/50 hover:border-blue-500/30" : "bg-white border-zinc-200 hover:border-blue-300"}`
                    }`}>
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        task.completed ? "bg-emerald-500 border-emerald-500 rotate-12" : darkMode ? "border-zinc-700" : "border-zinc-300"
                      }`}>
                        {task.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${task.completed ? "line-through opacity-40" : ""}`}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pr-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleTaskPin(task.id); }} 
                        aria-label="تثبيت المهمة"
                        className={`p-2 rounded-lg transition-all active:scale-95 flex items-center justify-center min-w-[36px] min-h-[36px] ${
                          (task.isPinned || task.pinned) 
                            ? "text-amber-400 bg-amber-400/10 shadow-[0_0_8px_rgba(251,191,36,0.3)]" 
                            : darkMode ? "text-amber-500/70 bg-zinc-800 hover:bg-zinc-700 hover:text-amber-400" : "text-amber-600/70 bg-zinc-100 hover:bg-zinc-200 hover:text-amber-500"
                        }`}
                      >
                        <Pin className={`w-4 h-4 ${(task.isPinned || task.pinned) ? "fill-amber-400" : ""}`} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
                        aria-label="حذف المهمة"
                        className={`p-2 rounded-lg transition-all active:scale-95 text-red-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center min-w-[36px] min-h-[36px] ${
                          darkMode ? "bg-zinc-800" : "bg-zinc-100"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : <div className={`text-center py-4 text-xs font-bold italic ${muted}`}>لا توجد مهام</div>}
                
                <div className={`p-2 rounded-xl border mt-4 space-y-2 ${inputBg}`}>
                  <input type="text" placeholder="مهمة جديدة..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="w-full bg-transparent border-none focus:outline-none text-sm px-2 py-1" />
                  <div className="flex items-center justify-between px-2 pb-1">
                    <button onClick={() => setNewTaskIsPinned(!newTaskIsPinned)} className={`text-xs flex items-center gap-1 font-bold ${newTaskIsPinned ? 'text-emerald-500' : muted}`}>
                       <Pin className="w-3 h-3" /> تثبيت المهمة
                    </button>
                    <button onClick={addTask} className="p-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-transform flex items-center gap-1">
                       <Plus className="w-3 h-3" /> إضافة
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className={`border rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-xl ${card}`}>
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Flame className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg md:text-2xl font-bold">العادات</h2>
              </div>
              <div className="space-y-2">
                {habits.length > 0 ? habits.map(habit => (
                  <div key={habit.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all group/item ${darkMode ? "bg-zinc-800/20 border-zinc-800/50 hover:border-zinc-700" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"}`}>
                    <div className="flex flex-col gap-0.5 max-w-[45%]">
                      <span className="text-sm font-bold truncate">{habit.name}</span>
                      <div className={`flex items-center gap-1 text-xs font-black ${habit.type === 'positive' ? 'text-emerald-500' : 'text-orange-400'}`}>
                        {habit.type === 'positive' ? <TrendingUp className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
                        {habit.streak} {habit.type === 'positive' ? 'يوم' : 'أيام بدون'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pr-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id); }} className={`px-3 py-2 rounded-lg font-black text-xs transition-all active:scale-95 min-h-[36px] flex items-center justify-center ${habit.completed ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]" : darkMode ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-100" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"}`}>
                        {habit.completed ? "تم ✓" : "إنجاز"}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleHabitPin(habit.id); }} 
                        aria-label="تثبيت العادة"
                        className={`p-2 rounded-lg transition-all active:scale-95 flex items-center justify-center min-w-[36px] min-h-[36px] ${
                          (habit.isPinned || habit.pinned) 
                            ? "text-amber-400 bg-amber-400/10 shadow-[0_0_8px_rgba(251,191,36,0.3)]" 
                            : darkMode ? "text-amber-500/70 bg-zinc-800 hover:bg-zinc-700 hover:text-amber-400" : "text-amber-600/70 bg-zinc-100 hover:bg-zinc-200 hover:text-amber-500"
                        }`}
                      >
                        <Pin className={`w-4 h-4 ${(habit.isPinned || habit.pinned) ? "fill-amber-400" : ""}`} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }} 
                        aria-label="حذف العادة"
                        className={`p-2 rounded-lg transition-all active:scale-95 text-red-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center min-w-[36px] min-h-[36px] ${
                          darkMode ? "bg-zinc-800" : "bg-zinc-100"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : <div className={`text-center py-4 text-xs font-bold italic ${muted}`}>لا توجد عادات</div>}
                <div className={`p-2 rounded-xl border mt-4 space-y-2 ${inputBg}`}>
                  <input type="text" placeholder="إضافة عادة جديدة..." value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHabit()} className="w-full bg-transparent border-none focus:outline-none text-sm px-2 py-1" />
                  <div className="flex items-center justify-between px-2 pb-1">
                    <select value={newHabitType} onChange={(e) => setNewHabitType(e.target.value as "positive"|"negative")} className={`text-xs focus:outline-none bg-transparent font-bold ${newHabitType === 'positive' ? 'text-emerald-500' : 'text-orange-500'}`}>
                      <option value="positive" className="text-zinc-900">إيجابية (بناء)</option>
                      <option value="negative" className="text-zinc-900">سلبية (ترك)</option>
                    </select>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setNewHabitIsPinned(!newHabitIsPinned)} className={`text-xs flex items-center gap-1 font-bold ${newHabitIsPinned ? 'text-emerald-500' : muted}`}>
                         <Pin className="w-3 h-3" /> تثبيت
                      </button>
                      <button onClick={addHabit} className="p-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-transform active:scale-95 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> إضافة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={`flex items-center gap-3 md:gap-5 p-4 md:p-6 border rounded-2xl transition-all group/adv ${
          darkMode ? "bg-zinc-900 border-zinc-800 hover:border-emerald-500/40" : "bg-white border-zinc-200 hover:border-emerald-400/50 shadow-sm"
        }`}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 group-hover/adv:scale-110 transition-transform" />
          </div>
          <div>
            <p className={`font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-0.5 ${muted}`}>نصيحة الغد</p>
            <p className={`text-sm md:text-base font-bold leading-snug ${darkMode ? "text-zinc-200" : "text-zinc-700"}`}>
              {aiInsights.tomorrowAdvice}
            </p>
          </div>
        </div>

        <footer className={`text-center py-4 text-xs font-medium border-t ${mutedBorder} ${muted}`}>
          Developed by Omar Almajnuni
        </footer>
      </main>

      {activeKhushuModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`border rounded-3xl w-[92%] max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center ${card}`}>
            <h3 className="text-xl font-black mb-1 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              كيف كان خشوعك؟
            </h3>
            <p className={`font-medium mb-5 text-sm ${muted}`}>تقييم جودة الصلاة يساعدك على التطوير</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: "ممتاز", color: "bg-emerald-500 hover:bg-emerald-600" },
                { id: "متوسط", color: "bg-orange-500 hover:bg-orange-600" },
                { id: "ضعيف", color: "bg-rose-500 hover:bg-rose-600" },
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => setKhushu(activeKhushuModal, level.id)}
                  className={`py-3.5 rounded-2xl text-zinc-950 text-lg font-black transition-all hover:scale-[1.02] active:scale-95 shadow-md ${level.color}`}
                >
                  {level.id}
                </button>
              ))}
            </div>
            <button onClick={() => setActiveKhushuModal(null)} className={`mt-5 font-bold hover:opacity-80 transition-opacity text-sm ${muted}`}>
              تخطي لاحقاً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
