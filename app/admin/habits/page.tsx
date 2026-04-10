"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Repeat, Calendar, Trash2, Download } from 'lucide-react';
import { logAdminAction } from '@/lib/adminLog';
import { Habit } from '@/types';

export default function AdminHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .limit(500)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setHabits(data);
        }
      } catch (err) {
        console.error("Error fetching habits:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, []);

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه العادة؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    // Optimistic Update
    const previousHabits = [...habits];
    setHabits(prev => prev.filter(h => h.id !== id));

    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) {
        alert("حدث خطأ أثناء إتمام عملية الحذف. المحاولة التراجع عن الحذف.");
        console.error(error);
        setHabits(previousHabits);
      } else {
        await logAdminAction('delete_habit', 'habit', String(id));
      }
    } catch (err) {
      alert("حدث خطأ غير متوقع.");
      console.error(err);
      setHabits(previousHabits);
    }
  };

  const filteredHabits = habits.filter(h => {
    const q = searchQuery.toLowerCase();
    const phoneMatches = h.user_phone && h.user_phone.includes(q);
    const titleMatches = (h.title && h.title.toLowerCase().includes(q)) || (h.name && h.name.toLowerCase().includes(q));
    const matchesSearch = phoneMatches || titleMatches;
    
    if (!matchesSearch) return false;
    if (filter === 'daily') return (h.frequency === 'يومي' || h.frequency === 'يومية' || !h.frequency);
    if (filter === 'weekly') return (h.frequency === 'أسبوعي' || h.frequency === 'أسبوعية');
    if (filter === 'active') return (h.status === 'active' || h.status === 'نشطة' || !h.status);
    return true;
  });

  const handleExportCSV = () => {
    if (!filteredHabits.length) return;
    const headers = ['العنوان', 'الجوال', 'التردد', 'الحالة', 'تاريخ الإنشاء'];
    const csvContent = [
      headers.join(','),
      ...filteredHabits.map(h => {
        const titleRaw = h.title || h.name || 'بدون عنوان';
        const title = (typeof titleRaw === 'string') ? titleRaw.replace(/"/g, '""') : 'بدون عنوان';
        const phone = h.user_phone || 'غير متوفر';
        const frequency = h.frequency || 'يومي';
        const status = h.status || 'نشطة';
        const date = h.created_at ? new Date(h.created_at).toLocaleDateString("ar-SA") : 'غير متوفر';
        return `"${title}","${phone}","${frequency}","${status}","${date}"`;
      })
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'admin-habits.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة العادات</h1>
          <p className="text-zinc-400 text-sm">عرض وتحليل العادات المسجلة في النظام</p>
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
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>الكل</button>
        <button onClick={() => setFilter('daily')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'daily' ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>يومية</button>
        <button onClick={() => setFilter('weekly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'weekly' ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>أسبوعية</button>
        <button onClick={() => setFilter('active')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'active' ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>نشطة</button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="p-4 text-zinc-400 font-medium text-sm">العنوان</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">الجوال</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">التردد</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">الحالة</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">تاريخ الإنشاء</th>
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
              ) : filteredHabits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    لا توجد عادات مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredHabits.map((h, idx) => (
                  <tr key={h.id || idx} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Repeat className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-white font-medium">{h.title || h.name || 'بدون عنوان'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300" dir="ltr">{h.user_phone || 'غير متوفر'}</td>
                    <td className="p-4 text-center">
                       <span className="text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg text-xs border border-zinc-700">
                         {h.frequency || 'يومي'}
                       </span>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-medium ${h.status === 'active' || !h.status ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                         {h.status || 'نشطة'}
                       </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{h.created_at ? new Date(h.created_at).toLocaleDateString("ar-SA") : 'غير متوفر'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <button onClick={() => handleDelete(h.id)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
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
