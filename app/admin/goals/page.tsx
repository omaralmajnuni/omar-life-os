"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Target, Calendar, Trash2, Download } from 'lucide-react';
import { logAdminAction } from '@/lib/adminLog';
import { Goal } from '@/types';

export default function AdminGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .limit(500)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setGoals(data);
        }
      } catch (err) {
        console.error("Error fetching goals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الهدف؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    // Optimistic Update
    const previousGoals = [...goals];
    setGoals(prev => prev.filter(g => g.id !== id));

    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) {
        alert("حدث خطأ أثناء إتمام عملية الحذف. المحاولة التراجع عن الحذف.");
        console.error(error);
        setGoals(previousGoals);
      } else {
        await logAdminAction('delete_goal', 'goal', String(id));
      }
    } catch (err) {
      alert("حدث خطأ غير متوقع.");
      console.error(err);
      setGoals(previousGoals);
    }
  };

  const filteredGoals = goals.filter(g => {
    const q = searchQuery.toLowerCase();
    const phoneMatches = g.user_phone && g.user_phone.includes(q);
    const titleMatches = g.title && g.title.toLowerCase().includes(q);
    const matchesSearch = phoneMatches || titleMatches;
    
    if (!matchesSearch) return false;
    if (filter === 'active') return g.status !== 'completed';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  const handleExportCSV = () => {
    if (!filteredGoals.length) return;
    const headers = ['العنوان', 'الجوال', 'الفترة', 'القيمة المطلوبة', 'القيمة الحالية', 'الحالة', 'تاريخ الإنشاء'];
    const csvContent = [
      headers.join(','),
      ...filteredGoals.map(g => {
        const title = (g.title && typeof g.title === 'string') ? g.title.replace(/"/g, '""') : 'بدون عنوان';
        const phone = g.user_phone || 'غير متوفر';
        const period = g.period || 'غير محدد';
        const target = g.target_value ?? 0;
        const current = g.current_value ?? 0;
        const status = g.status === 'completed' ? 'مكتمل' : 'نشط';
        const date = g.created_at ? new Date(g.created_at).toLocaleDateString("ar-SA") : 'غير متوفر';
        return `"${title}","${phone}","${period}","${target}","${current}","${status}","${date}"`;
      })
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'admin-goals.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة الأهداف</h1>
          <p className="text-zinc-400 text-sm">عرض وتحليل الأهداف المسجلة في النظام</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="ابحث برقم الجوال أو العنوان..." 
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

      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>الكل</button>
        <button onClick={() => setFilter('active')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'active' ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>النشطة فقط</button>
        <button onClick={() => setFilter('completed')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'completed' ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>المكتملة فقط</button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="p-4 text-zinc-400 font-medium text-sm">العنوان</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">الجوال</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">الفترة</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">القيمة المطلوبة</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">القيمة الحالية</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">الحالة</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">تاريخ الإنشاء</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : filteredGoals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    لا يوجد أهداف مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredGoals.map((g, idx) => (
                  <tr key={g.id || idx} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-white font-medium">{g.title || 'بدون عنوان'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300" dir="ltr">{g.user_phone || 'غير متوفر'}</td>
                    <td className="p-4 text-zinc-400 text-sm">{g.period || 'غير محدد'}</td>
                    <td className="p-4 text-center">
                      <span className="text-white font-bold">{g.target_value ?? 0}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-emerald-400 font-bold">{g.current_value ?? 0}</span>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-medium ${g.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                         {g.status === 'completed' ? 'مكتمل' : 'نشط'}
                       </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{g.created_at ? new Date(g.created_at).toLocaleDateString("ar-SA") : 'غير متوفر'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <button onClick={() => handleDelete(g.id)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                         <Trash2 className="w-4 h-4" />
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
