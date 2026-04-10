"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, CheckSquare, Calendar, Trash2, Download } from 'lucide-react';
import { logAdminAction } from '@/lib/adminLog';
import { Task } from '@/types';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .limit(500)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setTasks(data);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    // Optimistic Update
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        alert("حدث خطأ أثناء إتمام عملية الحذف. المحاولة التراجع عن الحذف.");
        console.error(error);
        setTasks(previousTasks);
      } else {
        await logAdminAction('delete_task', 'task', String(id));
      }
    } catch (err) {
      alert("حدث خطأ غير متوقع.");
      console.error(err);
      setTasks(previousTasks);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const q = searchQuery.toLowerCase();
    const phoneMatches = t.user_phone && t.user_phone.includes(q);
    const titleMatches = t.title && t.title.toLowerCase().includes(q);
    const matchesSearch = phoneMatches || titleMatches;
    
    if (!matchesSearch) return false;
    if (filter === 'completed') return t.completed === true;
    if (filter === 'incomplete') return t.completed !== true;
    return true;
  });

  const handleExportCSV = () => {
    if (!filteredTasks.length) return;
    const headers = ['العنوان', 'الجوال', 'الحالة', 'تاريخ الإنشاء'];
    const csvContent = [
      headers.join(','),
      ...filteredTasks.map(t => {
        const title = (t.title && typeof t.title === 'string') ? t.title.replace(/"/g, '""') : 'بدون عنوان';
        const phone = t.user_phone || 'غير متوفر';
        const status = t.completed ? 'مكتملة' : 'غير مكتملة';
        const date = t.created_at ? new Date(t.created_at).toLocaleDateString("ar-SA") : 'غير متوفر';
        return `"${title}","${phone}","${status}","${date}"`;
      })
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'admin-tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة المهام</h1>
          <p className="text-zinc-400 text-sm">عرض وتحليل المهام المسجلة في النظام</p>
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
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>الكل</button>
        <button onClick={() => setFilter('completed')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'completed' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>المكتملة</button>
        <button onClick={() => setFilter('incomplete')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'incomplete' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>غير المكتملة</button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="p-4 text-zinc-400 font-medium text-sm">العنوان</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">الجوال</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">الحالة</th>
                <th className="p-4 text-zinc-400 font-medium text-sm">تاريخ الإنشاء</th>
                <th className="p-4 text-zinc-400 font-medium text-sm text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    لا توجد مهام مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className={`font-medium ${t.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>{t.title || 'بدون عنوان'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300" dir="ltr">{t.user_phone || 'غير متوفر'}</td>
                    <td className="p-4 text-center">
                       <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-medium ${t.completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                         {t.completed ? 'مكتملة' : 'غير مكتملة'}
                       </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{t.created_at ? new Date(t.created_at).toLocaleDateString("ar-SA") : 'غير متوفر'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <button onClick={() => handleDelete(t.id)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
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
