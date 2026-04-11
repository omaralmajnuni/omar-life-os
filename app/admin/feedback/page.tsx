"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Loader2, Calendar, Phone, User, Inbox, RefreshCw, Trash2, CheckCircle } from 'lucide-react';

interface Feedback {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    setLoading(true);
    // Suppress errors directly and treat Missing Relation as Empty List for smooth UX if it's not setup yet
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
       console.error("Feedback fetch error:", error);
       setFeedback([]);
    } else {
       setFeedback(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('feedback').update({ status: newStatus }).eq('id', id);
    if (!error) {
       setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    const { error } = await supabase.from('feedback').delete().eq('id', id);
    if (!error) {
       setFeedback(prev => prev.filter(f => f.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-500" />
            الشكاوى والاقتراحات
          </h1>
          <p className="text-zinc-400 text-sm mt-1">إدارة رسائل المستخدمين ومقترحاتهم</p>
        </div>
        <button 
          onClick={fetchFeedback}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-sm font-medium border border-zinc-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-900 border-dashed">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-zinc-500">جاري جلب الرسائل...</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-900 border-dashed">
          <Inbox className="w-12 h-12 text-zinc-600 mb-4" />
          <h2 className="text-lg font-bold text-zinc-300">لا توجد رسائل حالياً</h2>
          <p className="text-zinc-500 text-sm text-center max-w-sm mt-2 leading-relaxed">
            لم يتم العثور على أي بيانات؛ إذا لم تقم بإنشاء الجدول في Supabase بعد، فنفذ استعلام SQL لبناء جدول (feedback).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedback.map(item => (
             <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-zinc-700 transition-colors">
               
               <div className="flex justify-between items-start mb-4">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${item.status === 'new' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                    {item.status === 'new' ? 'جديدة' : 'تمت قراءتها'}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs text-left" dir="ltr">
                     <Calendar className="w-3.5 h-3.5" />
                     {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </div>
               </div>

               <p className="text-zinc-200 text-sm leading-relaxed flex-1 mb-6 whitespace-pre-wrap">
                 {item.message}
               </p>

               <div className="pt-4 border-t border-zinc-800/50 mt-auto">
                 <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <User className="w-3.5 h-3.5" />
                      <span>{item.name || 'غير معروف'}</span>
                    </div>
                    {item.phone && (
                      <div className="flex items-center gap-2 text-emerald-500/70 text-xs font-mono" dir="ltr">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{item.phone}</span>
                      </div>
                    )}
                 </div>

                 <div className="flex items-center gap-2">
                    {item.status === 'new' && (
                      <button 
                        onClick={() => handleStatusChange(item.id, 'read')}
                        className="flex-1 px-3 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors text-xs font-bold flex justify-center items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        تحديد كمقروءة
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors text-xs font-bold flex justify-center items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
               </div>

             </div>
          ))}
        </div>
      )}
    </div>
  );
}
