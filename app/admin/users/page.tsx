"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, User, Calendar, Target, CheckSquare, Repeat, Download } from 'lucide-react';
import { UserDB, ExtendedUserDB, Goal, Task, Habit } from '@/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ExtendedUserDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        let baseUsers: UserDB[] = [];
        // نعتمد على profiles كمصدر أساسي
        const { data: profilesData, error: profilesErr } = await supabase.from('profiles').select('*').limit(500);
        
        if (!profilesErr && profilesData && profilesData.length > 0) {
          baseUsers = profilesData.map(p => ({
            id: p.user_id || p.id,
            user_id: p.user_id, // الاحتفاظ بـ user_id صريحاً
            phone: p.phone || 'بدون رقم',
            name: p.name || 'بدون اسم',
            created_at: p.created_at || null,
            status: 'active'
          }));
        }

        // جلب الإحصائيات الخاصة بالأهداف والمهام والعادات لربطها بكل مستخدم
        const { data: goalsAll } = await supabase.from('goals').select('user_phone').limit(3000);
        const { data: tasksAll } = await supabase.from('tasks').select('user_phone').limit(3000);
        const { data: habitsAll } = await supabase.from('habits').select('user_phone').limit(3000);

        // الحساب المجمع لعدد العناصر المربوطة بالجوال
        const goalsCount = (goalsAll || []).reduce((acc: Record<string, number>, g: { user_phone: string }) => {
           if(g.user_phone) acc[g.user_phone] = (acc[g.user_phone] || 0) + 1; return acc;
        }, {});
        
        const tasksCount = (tasksAll || []).reduce((acc: Record<string, number>, t: { user_phone: string }) => {
           if(t.user_phone) acc[t.user_phone] = (acc[t.user_phone] || 0) + 1; return acc;
        }, {});
        
        const habitsCount = (habitsAll || []).reduce((acc: Record<string, number>, h: { user_phone: string }) => {
           if(h.user_phone) acc[h.user_phone] = (acc[h.user_phone] || 0) + 1; return acc;
        }, {});

        // Fetch user subscriptions
        const { data: subsAll } = await supabase.from('subscriptions').select('user_id, status').limit(3000);
        const subStatusMap = (subsAll || []).reduce((acc: Record<string, string>, sub: any) => {
           if(sub.user_id) acc[sub.user_id] = sub.status; return acc;
        }, {});

        // دمج البيانات بالاعتماد حرفياً على user_id
        const enrichedUsers: ExtendedUserDB[] = baseUsers.map(u => ({
          ...u,
          goalsCount: goalsCount[u.phone || ''] || 0,
          tasksCount: tasksCount[u.phone || ''] || 0,
          habitsCount: habitsCount[u.phone || ''] || 0,
          realSubscriptionStatus: subStatusMap[u.user_id || ''] || 'غير مشترك'
        })).sort((a, b) => {
          // ترتيب تنازلي بناءً على وجود نشاط ليكون الأنشط في الأعلى
          const totalA = a.goalsCount + a.tasksCount + a.habitsCount;
          const totalB = b.goalsCount + b.tasksCount + b.habitsCount;
          return totalB - totalA;
        });

        setUsers(enrichedUsers);
      } catch (error) {
        console.error("Error fetching users data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersData();
  }, []);

  const filteredUsers = users.filter(u => {
    if (!searchQuery || searchQuery.trim() === '') return true;
    return u.phone && u.phone.includes(searchQuery);
  });

  const handleExportCSV = () => {
    if (!filteredUsers.length) return;
    const headers = ['رقم الجوال', 'تاريخ التسجيل', 'الأهداف', 'المهام', 'العادات', 'الحالة'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => {
        const date = u.created_at ? new Date(u.created_at).toLocaleDateString("ar-SA") : 'غير متوفر';
        const status = u.status === 'disabled' ? 'معطل' : 'نشط';
        return `"${u.phone}","${date}","${u.goalsCount}","${u.tasksCount}","${u.habitsCount}","${status}"`;
      })
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'admin-users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة المستخدمين</h1>
          <p className="text-zinc-400 text-sm">عرض وتحليل نشاط المسجلين في النظام</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="ابحث برقم الجوال..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
          <button onClick={handleExportCSV} className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0" title="تصدير CSV">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="p-4 text-zinc-400 font-medium text-sm">المستخدم (رقم الجوال)</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">تاريخ التسجيل</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">الأهداف</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">المهام</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">العادات</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    لا يوجد مستخدمين مطابقين للبحث.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-white font-medium block">{user.name || 'بدون اسم'}</span>
                          <span className="text-zinc-500 text-xs block mt-0.5" dir="ltr">{user.phone}</span>
                          <div className="flex gap-2 mt-1">
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-medium ${user.status === 'disabled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                              {user.status === 'disabled' ? 'معطل' : 'نشط'}
                            </span>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                              user.realSubscriptionStatus === 'active' || user.realSubscriptionStatus === 'activated' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                              user.realSubscriptionStatus === 'pending' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                              'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              {user.realSubscriptionStatus === 'active' || user.realSubscriptionStatus === 'activated' ? 'مفعل' : 
                               user.realSubscriptionStatus === 'pending' ? 'قيد الانتظار' : 'غير مشترك'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{user.created_at ? new Date(user.created_at).toLocaleDateString("ar-SA") : 'غير متوفر'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span className="text-white text-sm">{user.goalsCount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                        <span className="text-white text-sm">{user.tasksCount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <Repeat className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">{user.habitsCount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <button onClick={() => router.push(`/admin/users/${encodeURIComponent(user.phone || '')}`)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-500/20 transition-colors">
                         عـرض
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
