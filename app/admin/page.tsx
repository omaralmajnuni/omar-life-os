"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Target, CheckSquare, Repeat, Activity, UserMinus, UserPlus, Clock, Zap, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    users: 0, 
    goals: 0, 
    tasks: 0, 
    habits: 0,
    inactiveUsers: 0,
    completedGoals: 0,
    incompleteTasks: 0,
    dailyHabits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let usersCount = 0;
        const { count: uCount, error: uErr } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (!uErr && uCount !== null) {
          usersCount = uCount;
        } else {
          const { data: gData } = await supabase.from('goals').select('user_phone');
          if (gData) {
            const phones = new Set(gData.map(g => g.user_phone).filter(Boolean));
            usersCount = phones.size;
          }
        }

        let goalsCount = 0;
        const { count: gCount, error: gErr } = await supabase.from('goals').select('*', { count: 'exact', head: true });
        if (!gErr && gCount !== null) goalsCount = gCount;

        let tasksCount = 0;
        const { count: tCount, error: tErr } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
        if (!tErr && tCount !== null) tasksCount = tCount;

        let habitsCount = 0;
        const { count: hCount, error: hErr } = await supabase.from('habits').select('*', { count: 'exact', head: true });
        if (!hErr && hCount !== null) habitsCount = hCount;

        // Quick Actions Stats
        let inactiveUsers = 0;
        const { count: iUserCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'disabled');
        if (iUserCount !== null) inactiveUsers = iUserCount;

        let completedGoals = 0;
        const { count: compGoalsCount } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        if (compGoalsCount !== null) completedGoals = compGoalsCount;

        let incompleteTasks = 0;
        const { data: allTasks } = await supabase.from('tasks').select('completed');
        if (allTasks) {
          incompleteTasks = allTasks.filter(t => !t.completed).length;
        }

        let dailyHabits = 0;
        const { data: allHabits } = await supabase.from('habits').select('frequency');
        if (allHabits) {
          dailyHabits = allHabits.filter(h => h.frequency === 'يومي' || h.frequency === 'يومية' || !h.frequency).length;
        }

        setStats({ 
          users: usersCount, 
          goals: goalsCount, 
          tasks: tasksCount, 
          habits: habitsCount,
          inactiveUsers,
          completedGoals,
          incompleteTasks,
          dailyHabits
        });
      } catch (e) {
        console.error("Error fetching stats:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "المستخدمين", value: stats.users, icon: <Users className="w-6 h-6 text-blue-400" />, bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "الأهداف النشطة", value: stats.goals, icon: <Target className="w-6 h-6 text-emerald-400" />, bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "المهام المسجلة", value: stats.tasks, icon: <CheckSquare className="w-6 h-6 text-amber-400" />, bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "العادات المتبعة", value: stats.habits, icon: <Repeat className="w-6 h-6 text-purple-400" />, bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">مرحباً بك في لوحة الإدارة 👋</h1>
          <p className="text-zinc-400">نظرة عامة على إحصائيات النظام والأداء العام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-all hover:border-zinc-700`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bg} ${card.border} border`}>
                {card.icon}
              </div>
              {loading ? (
                <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse"></div>
              ) : (
                <span className="text-3xl font-bold text-white">{card.value}</span>
              )}
            </div>
            <h3 className="text-zinc-400 font-medium">{card.label}</h3>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <Link href="/admin/users" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-800 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UserMinus className="w-5 h-5" />
            </div>
            <span className="text-white font-medium text-sm mb-1">المستخدمون غير النشطين</span>
            {loading ? <div className="h-3 w-8 bg-zinc-800 rounded animate-pulse mt-1"></div> : <span className="text-rose-400 text-xs font-bold">{stats.inactiveUsers || 0} مستخدم</span>}
          </Link>

          <Link href="/admin/users" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-800 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-white font-medium text-sm mb-1">أحدث المستخدمين</span>
            <span className="text-zinc-500 text-xs mt-0.5">عرض المسجلين حديثاً</span>
          </Link>

          <Link href="/admin/goals" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-800 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-white font-medium text-sm mb-1">الأهداف المكتملة</span>
            {loading ? <div className="h-3 w-8 bg-zinc-800 rounded animate-pulse mt-1"></div> : <span className="text-emerald-400 text-xs font-bold">{stats.completedGoals || 0} هدف</span>}
          </Link>

          <Link href="/admin/tasks" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-800 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-white font-medium text-sm mb-1">المهام غير المكتملة</span>
            {loading ? <div className="h-3 w-8 bg-zinc-800 rounded animate-pulse mt-1"></div> : <span className="text-amber-400 text-xs font-bold">{stats.incompleteTasks || 0} مهمة</span>}
          </Link>

          <Link href="/admin/habits" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-800 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Repeat className="w-5 h-5" />
            </div>
            <span className="text-white font-medium text-sm mb-1">العادات اليومية</span>
            {loading ? <div className="h-3 w-8 bg-zinc-800 rounded animate-pulse mt-1"></div> : <span className="text-purple-400 text-xs font-bold">{stats.dailyHabits || 0} عادة</span>}
          </Link>

          <Link href="/admin/subscriptions" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-800 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-white font-medium text-sm mb-1">إدارة الاشتراكات</span>
            <span className="text-zinc-500 text-xs mt-0.5">تفعيل وتمديد</span>
          </Link>

        </div>
      </div>

    </div>
  );
}
