"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Target, CheckSquare, Repeat, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface UserActivity {
  phone: string;
  goalsCount: number;
  tasksCount: number;
  habitsCount: number;
  totalActivity: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    zeroGoals: 0,
    zeroTasks: 0,
    zeroHabits: 0,
    topUsers: [] as UserActivity[],
    bottomUsers: [] as UserActivity[],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch users to establish the baseline of who registered
        const { data: usersData } = await supabase.from('users').select('phone, user_phone');
        
        // Fetch all items to count activity
        const { data: goalsAll } = await supabase.from('goals').select('user_phone');
        const { data: tasksAll } = await supabase.from('tasks').select('user_phone');
        const { data: habitsAll } = await supabase.from('habits').select('user_phone');

        // Extract all unique phones across all tables just in case someone has goals but isn't in users table
        const phonesSet = new Set<string>();
        usersData?.forEach(u => phonesSet.add(u.phone || u.user_phone));
        goalsAll?.forEach(g => { if (g.user_phone) phonesSet.add(g.user_phone); });
        tasksAll?.forEach(t => { if (t.user_phone) phonesSet.add(t.user_phone); });
        habitsAll?.forEach(h => { if (h.user_phone) phonesSet.add(h.user_phone); });

        // Build Activity Map
        const activityMap: Record<string, UserActivity> = {};
        phonesSet.forEach(phone => {
          if (phone) {
            activityMap[phone] = { phone, goalsCount: 0, tasksCount: 0, habitsCount: 0, totalActivity: 0 };
          }
        });

        // Tally Goals
        goalsAll?.forEach(g => {
          if (g.user_phone && activityMap[g.user_phone]) {
            activityMap[g.user_phone].goalsCount += 1;
            activityMap[g.user_phone].totalActivity += 1;
          }
        });

        // Tally Tasks
        tasksAll?.forEach(t => {
          if (t.user_phone && activityMap[t.user_phone]) {
            activityMap[t.user_phone].tasksCount += 1;
            activityMap[t.user_phone].totalActivity += 1;
          }
        });

        // Tally Habits
        habitsAll?.forEach(h => {
          if (h.user_phone && activityMap[h.user_phone]) {
            activityMap[h.user_phone].habitsCount += 1;
            activityMap[h.user_phone].totalActivity += 1;
          }
        });

        const usersList = Object.values(activityMap);

        // Compute zero counts
        let zeroGoals = 0, zeroTasks = 0, zeroHabits = 0;
        usersList.forEach(u => {
          if (u.goalsCount === 0) zeroGoals++;
          if (u.tasksCount === 0) zeroTasks++;
          if (u.habitsCount === 0) zeroHabits++;
        });

        // Sort by totalActivity
        const sortedDesc = [...usersList].sort((a, b) => b.totalActivity - a.totalActivity);
        const top5 = sortedDesc.slice(0, 5);
        
        // Bottom 5 (sort Ascending)
        // Only include users connected to actual numbers, sometimes empty phones exist
        const validUsers = usersList.filter(u => u.phone && u.phone.trim().length > 0);
        const sortedAsc = [...validUsers].sort((a, b) => a.totalActivity - b.totalActivity);
        const bottom5 = sortedAsc.slice(0, 5);

        setStats({
          zeroGoals,
          zeroTasks,
          zeroHabits,
          topUsers: top5,
          bottomUsers: bottom5
        });

      } catch (error) {
        console.error("Error computing analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">التحليلات والمؤشرات الإحصائية</h1>
        <p className="text-zinc-400 text-sm">متابعة دقيقة لنشاط المستخدمين وتفاعلهم مع النظام</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-400">جاري تحليل البيانات...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-zinc-400 text-sm font-medium">مستخدمين بدون أهداف</h3>
                  <p className="text-2xl font-bold text-white">{stats.zeroGoals}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-zinc-400 text-sm font-medium">مستخدمين بدون مهام</h3>
                  <p className="text-2xl font-bold text-white">{stats.zeroTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center shrink-0">
                  <Repeat className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-zinc-400 text-sm font-medium">مستخدمين بدون عادات</h3>
                  <p className="text-2xl font-bold text-white">{stats.zeroHabits}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top and Bottom Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top 5 Active */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-zinc-800/50 bg-zinc-950/20 flex items-center gap-3">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">أكثر 5 مستخدمين نشاطاً</h2>
              </div>
              <div className="p-6 flex-1">
                {stats.topUsers.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">لا يوجد بيانات كافية</p>
                ) : (
                  <div className="space-y-4">
                    {stats.topUsers.map((u, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-xs shadow-inner shadow-emerald-500/20">
                            {i + 1}
                          </div>
                          <span className="text-white font-medium" dir="ltr">{u.phone}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                           <span className="text-zinc-500">حجم النشاط: <span className="text-emerald-400 text-sm font-bold">{u.totalActivity}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom 5 Active */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-zinc-800/50 bg-zinc-950/20 flex items-center gap-3">
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-white">أقل 5 مستخدمين نشاطاً</h2>
              </div>
              <div className="p-6 flex-1">
                {stats.bottomUsers.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">لا يوجد بيانات كافية</p>
                ) : (
                  <div className="space-y-4">
                    {stats.bottomUsers.map((u, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center font-bold text-rose-400 text-xs shadow-inner shadow-rose-500/20">
                            {i + 1}
                          </div>
                          <span className="text-white font-medium" dir="ltr">{u.phone || 'غير معروف'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                           <span className="text-zinc-500">حجم النشاط: <span className="text-rose-400 text-sm font-bold">{u.totalActivity}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
