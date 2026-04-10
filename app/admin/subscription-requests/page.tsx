"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Search, CheckCircle2, PhoneCall, Clock } from 'lucide-react';
import { SubscriptionRequest } from '@/types';
import { logAdminAction } from '@/lib/adminLog';

export default function SubscriptionRequestsPage() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all'|'pending'|'contacted'|'activated'>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // أخذ أحدث طلب فقط لكل مستخدم (حسب ترتيب created_at التنازلي)
      const latestRequests = (data || []).reduce((acc: Record<string, any>, req: any) => {
        if (req.user_id && !acc[req.user_id]) {
          acc[req.user_id] = req;
        }
        return acc;
      }, {});

      setRequests(Object.values(latestRequests) as SubscriptionRequest[]);
    } catch (e: any) {
      console.error("Error fetching subscription requests:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, userId: string, newStatus: SubscriptionRequest['status']) => {
    try {
      // 1- Update the request status
      const { data, error } = await supabase
        .from('subscription_requests')
        .update({ status: newStatus })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Subscription request update error:', error);
        return; // stop execution if update fails
      }

      // أضفنا هذا الفحص لمعرفة ما إذا كان سبب الفشل هو صلاحيات RLS التي تمنع التحديث
      if (!data || data.length === 0) {
        console.error('Subscription request update error:', new Error("Update silent failure: No row affected. This is usually caused by an RLS (Row Level Security) policy preventing the update operation on 'subscription_requests'."));
        return; // stop execution so UI doesn't update falsely
      }

      // 2- Activate the user profile and subscription if 'activated'
      if (newStatus === 'activated') {
        // تحديث في profiles (حسب بنية المشروع الحالية)
        const { error: pError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            trial_ends_at: null // مسح التجربة لأن الحساب تفعل
          })
          .eq('user_id', userId);

        if (pError) console.error("حدث خطأ في تحديث profiles:", pError);

        // إنشاء أو تحديث في جدول subscriptions لمنع التكرار (لتلبية المطلب بالكامل)
        // ملاحظة: تأكد من وجود جدول subscriptions وصلاحيات INSERT/UPDATE
        try {
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({ 
              user_id: userId, 
              status: 'active', 
              updated_at: new Date().toISOString() 
            }, { onConflict: 'user_id' });
            
          if (subError) console.error("حدث خطأ في تحديث subscriptions:", subError);
        } catch (subErr) {
          console.error("جدول subscriptions غير موجود أو حدث خطأ RLS:", subErr);
        }
      }

      // 3- Handle Success in UI directly
      setRequests(prev => 
        prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
      );

      // 4- تسجيل العملية في admin_logs
      const req = requests.find(r => r.id === id);
      const statusLabels: Record<string, string> = {
        contacted: 'تم التواصل',
        activated: 'تم التفعيل',
        pending: 'إعادة إلى قيد الانتظار',
      };
      await logAdminAction({
        action: newStatus === 'activated' ? 'activate_subscription' : 'update_request_status',
        targetType: 'subscription',
        targetUserId: userId,
        targetUserName: req?.name,
        targetUserPhone: req?.phone,
        details: `تحديث حالة طلب الاشتراك إلى: ${statusLabels[newStatus] ?? newStatus}`,
      });
      
      // Re-fetch to guarantee sync with DB and bypass cache
      await fetchRequests();

    } catch (e: any) {
      console.error("Error in handleStatusUpdate:", e);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.name && req.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.phone && req.phone.includes(searchQuery));
    const matchesFilter = filterType === 'all' || req.status === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
            طلبات الاشتراكات
          </h1>
          <p className="text-zinc-400 text-sm mt-1">إدارة الطلبات الواردة عبر واتساب لحفظ السجلات</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="contacted">تم التواصل</option>
          <option value="activated">مفعل</option>
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">الاسم</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">الجوال</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">الحالة</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">التاريخ</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 animate-pulse">
                    جاري تحميل الطلبات...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    لا يوجد طلبات تطابق بحثك
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{req.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-300 font-mono tracking-wider">{req.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-3.5 h-3.5"/> قيد الانتظار</span>}
                      {req.status === 'contacted' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20"><PhoneCall className="w-3.5 h-3.5"/> تم التواصل</span>}
                      {req.status === 'activated' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5"/> مفعل</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 font-mono">
                      {new Date(req.created_at).toLocaleString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {req.status === 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(req.id, req.user_id, 'contacted')}
                            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-500/20 transition-colors"
                          >
                            تم التواصل
                          </button>
                        )}
                        {(req.status === 'pending' || req.status === 'contacted') && (
                          <button 
                            onClick={() => handleStatusUpdate(req.id, req.user_id, 'activated')}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/20 transition-colors"
                          >
                            تم التفعيل
                          </button>
                        )}
                      </div>
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
