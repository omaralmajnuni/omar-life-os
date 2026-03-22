"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Trash2, CheckCircle2, Flame, Sparkles } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { SectionCard } from "../../components/SectionCard";

type GoalType = "weekly" | "monthly" | "yearly";

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: GoalType;
  icon: string;
  linkedId?: string;
  linkedType?: "habit" | "task";
  completed: boolean;
}

const EMOJI_OPTIONS = ["🔥", "📚", "🏃", "🕌", "💪", "💡", "💰", "🎯", "🌱", "💧"];

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState<GoalType>("weekly");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(10);
  const [newType, setNewType] = useState<GoalType>("weekly");
  const [newIcon, setNewIcon] = useState("🎯");
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    const savedGoals = localStorage.getItem("lifeos_goals");
    if (savedGoals) setGoals(JSON.parse(savedGoals));
  }, []);

  useEffect(() => {
    localStorage.setItem("lifeos_goals", JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    const sanitizedTitle = newTitle.trim();
    const sanitizedTarget = isNaN(newTarget) || newTarget < 1 ? 1 : newTarget;
    if (!sanitizedTitle) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: sanitizedTitle,
      target: sanitizedTarget,
      current: 0,
      type: newType,
      icon: newIcon,
      linkedId: newLink.trim(),
      completed: false
    };
    setGoals([...goals, goal]);
    setIsModalOpen(false);
    setNewTitle(""); setNewLink(""); setNewIcon("🎯"); setNewTarget(10);
  };

  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const incrementProgress = (id: string) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const currentProgress = isNaN(g.current) ? 0 : g.current;
        const targetValue = isNaN(g.target) || g.target < 1 ? 1 : g.target;
        const next = Math.min(currentProgress + 1, targetValue);
        return { ...g, current: next, completed: next >= targetValue };
      }
      return g;
    }));
  };

  const filteredGoals = goals.filter(g => g.type === activeTab);

  return (
    <PageContainer>
      {/* Header */}
      <header className="flex flex-col items-center text-center space-y-1 mt-2 md:mt-4">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-l from-orange-400 to-rose-400 bg-clip-text text-transparent">
          الأهداف الشخصية
        </h1>
        <p className="text-zinc-400 text-sm sm:text-lg md:text-xl font-medium">خطط ونفذ وطوّر ذاتك</p>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl w-fit mx-auto">
        {(["weekly", "monthly", "yearly"] as GoalType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-5 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-xs md:text-sm uppercase transition-all ${
              activeTab === type 
              ? "bg-zinc-800 text-orange-400 shadow-lg" 
              : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {type === "weekly" ? "إسبوعي" : type === "monthly" ? "شهري" : "سنوي"}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {filteredGoals.map((goal) => (
          <div 
            key={goal.id} 
            className={`group bg-zinc-900 border p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden transition-all duration-500 shadow-xl ${
              goal.completed 
              ? 'border-orange-500 shadow-[0_0_30px_rgba(251,146,60,0.12)] bg-orange-500/5' 
              : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {/* Completion Ribbon */}
            {goal.completed && (
              <div className="absolute top-0 right-0 py-2 px-3 bg-orange-500 text-zinc-950 font-black rounded-bl-2xl flex items-center gap-1.5 shadow-xl animate-in slide-in-from-top-4 duration-500 text-sm">
                <Sparkles className="w-4 h-4 animate-pulse" />
                تم تحقيق الهدف 🎉
              </div>
            )}

            {/* Top: icon + title + delete */}
            <div className="flex justify-between items-start mb-5 md:mb-8">
              <div className="flex items-center gap-3 md:gap-5 text-right">
                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-inner border transition-all duration-500 ${
                  goal.completed ? 'bg-orange-500/20 border-orange-500/50 scale-110 rotate-3' : 'bg-zinc-950 border-zinc-800'
                }`}>
                  {goal.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl md:text-3xl font-black leading-tight">{goal.title}</h3>
                  {goal.linkedId && (
                    <p className="text-zinc-500 text-xs font-bold flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-orange-500" /> مرتبط بـ: {goal.linkedId}
                    </p>
                  )}
                </div>
              </div>
              {!goal.completed && (
                <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-zinc-700 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className={`text-4xl md:text-6xl font-black tracking-tighter transition-all ${goal.completed ? 'text-orange-400' : 'text-zinc-100'}`}>
                    {goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0}%
                  </span>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-0.5 pr-1">نسبة الإنجاز</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-300 text-lg md:text-2xl font-black">{goal.current || 0} / {goal.target || 1}</p>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pr-1">التقدم الحالي</p>
                </div>
              </div>

              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-3 md:h-5 overflow-hidden shadow-inner p-0.5 md:p-1 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative group-hover:brightness-110 ${
                    goal.completed 
                    ? 'bg-gradient-to-l from-orange-400 via-rose-500 to-orange-400 bg-[length:200%_auto] animate-gradient-fast' 
                    : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                  }`}
                  style={{ width: `${goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
              </div>
            </div>

            <button 
              onClick={() => incrementProgress(goal.id)}
              disabled={goal.completed}
              className={`w-full mt-5 md:mt-8 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-base md:text-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                goal.completed 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default shadow-inner' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-orange-500/50'
              }`}
            >
              {goal.completed ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {goal.completed ? "اكتمل الهدف بنجاح" : "تحديث التقدم"}
            </button>
          </div>
        ))}

        {/* Add Goal Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center justify-center gap-4 text-zinc-500 hover:border-orange-500/50 hover:text-orange-400 transition-all hover:bg-orange-500/5 group"
        >
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
            <Plus className="w-7 h-7 md:w-10 md:h-10" />
          </div>
          <div className="text-center">
            <span className="text-xl md:text-3xl font-black block">إضافة هدف</span>
            <p className="text-xs md:text-sm font-bold opacity-60 mt-1">حدد خطتك القادمة وابدأ الإنجاز</p>
          </div>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-[94%] max-w-md p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden my-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <h2 className="text-2xl md:text-4xl font-black mb-5 md:mb-8 relative z-10 flex items-center gap-2">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
              إضافة هدف جديد
            </h2>
            
            <div className="space-y-5 md:space-y-7 relative z-10">
              {/* Icon Picker */}
              <div className="space-y-2">
                <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest">اختر أيقونة</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewIcon(emoji)}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-xl text-xl md:text-2xl flex items-center justify-center transition-all ${
                        newIcon === emoji 
                        ? 'bg-orange-500 scale-110 shadow-lg' 
                        : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest">عنوان الهدف</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: قراءة 5 كتب"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-base md:text-xl font-black focus:border-orange-500/50 focus:outline-none transition-all text-right shadow-inner"
                />
              </div>

              {/* Target + Type */}
              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-2">
                  <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest">الرقم المستهدف</label>
                  <input 
                    type="number" 
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-zinc-100 text-base md:text-xl font-black focus:border-orange-500/50 focus:outline-none transition-all text-right shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest">نوع الهدف</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as GoalType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-zinc-100 text-base md:text-xl font-black focus:border-orange-500/50 focus:outline-none transition-all appearance-none text-right shadow-inner"
                  >
                    <option value="weekly">إسبوعي</option>
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                  </select>
                </div>
              </div>

              {/* Link */}
              <div className="space-y-2">
                <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest">الربط بعادة/مهمة</label>
                <input 
                  type="text" 
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="اسم العادة بالضبط"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-sm md:text-lg font-bold focus:border-orange-500/50 focus:outline-none transition-all text-right shadow-inner"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 md:gap-4 pt-2">
                <button 
                  onClick={addGoal}
                  className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 text-base md:text-xl font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_8px_24px_rgba(249,115,22,0.25)]"
                >
                  تأكيد وحفظ
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-base md:text-xl font-black rounded-2xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gradient-fast {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-fast {
          animation: gradient-fast 2s linear infinite;
        }
      `}</style>
    </PageContainer>
  );
}
