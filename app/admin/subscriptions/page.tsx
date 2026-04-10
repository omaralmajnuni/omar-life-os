"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Calendar, CheckCircle2, Play, Plus, XOctagon, Search, Target } from 'lucide-react';
import { Profile } from '@/types';
import { logAdminAction } from '@/lib/adminLog';
import { useAdminGuard } from '@/hooks/useAdminGuard';

// ─── أنواع البيانات ──────────────────────────────
interface Subscription {
  id: number;
  profile_id: number;
  user_id: string;
  status: string;       // 'active' | 'lifetime' | 'cancelled' | 'inactive'
  plan_type: string;    // 'monthly' | 'yearly' | 'lifetime'
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string | null;
}

interface ProfileWithSub extends Profile {
  real_subscription: Subscription | null;
}

export default function SubscriptionsAdminPage() {
  const { ready, authorized } = useAdminGuard();
  const [profiles, setProfiles] = useState<ProfileWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (ready && authorized) fetchProfiles();
    if (ready && !authorized) setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authorized]);


  // ─── جلب بيانات profiles + subscriptions (LEFT JOIN منطقي) ─
  const fetchProfiles = async () => {
    try {
      const [profilesRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*').limit(1000).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').limit(3000),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      // بناء قاموس subscriptions مع الربط بـ user_id
      const subsMap: Record<string, Subscription> = {};
      for (const sub of (subsRes.data || [])) {
        if (sub.user_id) subsMap[sub.user_id] = sub as Subscription;
      }

      // دمج البيانات
      const merged: ProfileWithSub[] = (profilesRes.data || []).map((p: any) => ({
        ...p,
        real_subscription: subsMap[p.user_id] ?? null,
      }));

      setProfiles(merged);
    } catch (err) {
      console.error('fetchProfiles error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── حساب الأيام المتبقية من ends_at في subscriptions ──
  const calcDaysLeft = (endsAt: string | null | undefined): string => {
    if (!endsAt) return 'دائم';
    const diff = new Date(endsAt).getTime() - Date.now();
    const days = Math.ceil(diff / 86_400_000);
    return days > 0 ? `${days} يوم` : 'منتهي';
  };

  // ─── منطق تحديث الاشتراك ─────────────────────────
  const updateSubscription = async (
    userId: string,
    profileId: number,
    action: 'activate_30' | 'extend_14' | 'activate_365' | 'activate_permanent' | 'terminate',
    userName?: string,
    userPhone?: string,
  ) => {
    try {
      setActionLoading(userId);
      const now = new Date();

      // 1) جلب السجل الحالي أولاً
      const { data: existingSub, error: fetchErr } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      // 2) تحديد قيم الخطة
      let status: string;
      let plan_type: string;
      let starts_at: string;
      let ends_at: string | null;

      if (action === 'activate_30') {
        status = 'active';
        plan_type = 'monthly';
        starts_at = now.toISOString();
        ends_at = new Date(now.getTime() + 30 * 86_400_000).toISOString();

      } else if (action === 'extend_14') {
        // يمدد من تاريخ الانتهاء الحالي (ends_at) إن كان مستقبليًا، وإلا من الآن
        const base = existingSub?.ends_at && new Date(existingSub.ends_at) > now
          ? new Date(existingSub.ends_at)
          : now;
        status = 'active';
        plan_type = existingSub?.plan_type ?? 'monthly';
        starts_at = existingSub?.starts_at ?? now.toISOString();
        ends_at = new Date(base.getTime() + 14 * 86_400_000).toISOString();

      } else if (action === 'activate_365') {
        status = 'active';
        plan_type = 'yearly';
        starts_at = now.toISOString();
        ends_at = new Date(now.getTime() + 365 * 86_400_000).toISOString();

      } else if (action === 'activate_permanent') {
        status = 'lifetime';
        plan_type = 'lifetime';
        starts_at = existingSub?.starts_at ?? now.toISOString();
        ends_at = null;

      } else {
        // terminate
        status = 'cancelled';
        plan_type = existingSub?.plan_type ?? 'monthly';
        starts_at = existingSub?.starts_at ?? now.toISOString();
        ends_at = existingSub?.ends_at ?? now.toISOString();
      }

      // 3) الـ payload الكامل الرسمي
      const payload: Omit<Subscription, 'id'> = {
        profile_id: profileId,
        user_id: userId,
        status,
        plan_type,
        starts_at,
        ends_at,
        updated_at: now.toISOString(),
      };

      // 4) insert أو update
      if (existingSub) {
        const { error } = await supabase
          .from('subscriptions')
          .update(payload)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert([payload]);
        if (error) throw error;
      }

      // 5) تحديث واجهة المستخدم المحلية فوراً
      setProfiles(prev => prev.map(p =>
        p.user_id === userId
          ? { ...p, real_subscription: { ...payload, id: existingSub?.id ?? 0 } }
          : p
      ));

      // 6) تسجيل العملية في admin_logs
      const actionLabels: Record<string, string> = {
        activate_30: 'تفعيل 30 يوم',
        extend_14: 'تمديد 14 يوم',
        activate_365: 'تفعيل سنة',
        activate_permanent: 'تفعيل دائم',
        terminate: 'إنهاء اشتراك',
      };
      const actionKeys: Record<string, string> = {
        activate_30: 'activate_30d',
        extend_14: 'extend_14d',
        activate_365: 'activate_365d',
        activate_permanent: 'activate_permanent',
        terminate: 'terminate_subscription',
      };
      await logAdminAction({
        action: actionKeys[action],
        targetType: 'subscription',
        targetUserId: userId,
        targetUserName: userName,
        targetUserPhone: userPhone,
        details: `${actionLabels[action]} | الخطة: ${plan_type} | الحالة: ${status}`,
      });

      alert('تم تحديث حالة الاشتراك بنجاح!');

    } catch (error: any) {
      console.error('SUBSCRIPTION ERROR FULL', JSON.stringify(error, null, 2));
      console.error('SUBSCRIPTION ERROR RAW', error);
      alert(error?.message || error?.details || 'حدث خطأ أثناء التحديث');
    } finally {
      setActionLoading(null);
    }
  };


  // حالات التحميل وفحص الصلاحيات
  if (!ready || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <XOctagon className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">غير مصرح لك</h1>
        <p className="text-zinc-400">ليس لديك الصلاحية للوصول إلى هذه الصفحة.</p>
      </div>
    );
  }


  const filteredProfiles = profiles.filter(p => {
    if (!search.trim()) return true;
    return (p.name?.includes(search)) || (p.phone?.includes(search));
  });

  // ─── واجهة المستخدم ──────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-amber-500" />
            إدارة الاشتراكات
          </h1>
          <p className="text-zinc-400">إدارة اشتراكات المستخدمين وصلاحيات الوصول</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="البحث بالاسم أو رقم الجوال..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-emerald-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">المستخدم</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">حالة الاشتراك</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">الخطة</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">تاريخ الانتهاء</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">الأيام المتبقية</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    لا يوجد مستخدمين لعرضهم
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile, idx) => {
                  const sub = profile.real_subscription;
                  const daysLeft = calcDaysLeft(sub?.ends_at);
                  const isExpired = daysLeft === 'منتهي';
                  const isActivating = actionLoading === profile.user_id;

                  // تصنيف الحالة للعرض
                  const statusLabel = !sub
                    ? 'غير مشترك'
                    : sub.status === 'lifetime'
                    ? 'دائم'
                    : sub.status === 'active'
                    ? 'مفعّل'
                    : sub.status === 'cancelled'
                    ? 'ملغى'
                    : 'منتهي';

                  const statusClass = !sub
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : sub.status === 'lifetime'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : sub.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                  const planLabel = !sub ? '-'
                    : sub.plan_type === 'monthly' ? 'شهري'
                    : sub.plan_type === 'yearly'  ? 'سنوي'
                    : sub.plan_type === 'lifetime' ? 'دائم'
                    : sub.plan_type;

                  const endsAtDisplay = sub?.ends_at
                    ? new Date(sub.ends_at).toLocaleDateString('ar-SA')
                    : sub?.status === 'lifetime' ? '∞' : '-';

                  return (
                    <tr key={profile.user_id || `prof-${profile.id || idx}`} className="hover:bg-zinc-800/50 transition-colors">
                      {/* المستخدم */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{profile.name || 'بدون اسم'}</span>
                          <span className="text-xs text-zinc-400 font-mono mt-1" dir="ltr">{profile.phone || 'بدون رقم'}</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5 break-all">{profile.email || 'بدون إيميل'}</span>
                        </div>
                      </td>

                      {/* الحالة */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                          {sub?.status === 'active' || sub?.status === 'lifetime' ? <CheckCircle2 className="w-3 h-3" /> : null}
                          {statusLabel}
                        </span>
                      </td>

                      {/* الخطة */}
                      <td className="px-6 py-4 text-sm text-zinc-400">{planLabel}</td>

                      {/* تاريخ الانتهاء */}
                      <td className="px-6 py-4 text-sm text-zinc-400 font-mono">{endsAtDisplay}</td>

                      {/* الأيام المتبقية */}
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${
                          !sub ? 'text-zinc-500'
                          : sub.status === 'lifetime' ? 'text-amber-400'
                          : isExpired ? 'text-rose-500'
                          : 'text-emerald-400'
                        }`}>
                          {!sub ? '-' : sub.status === 'lifetime' ? '∞' : daysLeft}
                        </span>
                      </td>

                      {/* الإجراءات */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            disabled={isActivating}
                            onClick={() => updateSubscription(profile.user_id!, profile.id, 'activate_30', profile.name ?? undefined, profile.phone ?? undefined)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-500 rounded-lg text-xs font-medium transition-colors border border-zinc-700 hover:border-emerald-500/30 disabled:opacity-50"
                            title="تفعيل 30 يوم"
                          >
                            <Play className="w-3.5 h-3.5" />
                            30 يوم
                          </button>

                          <button
                            disabled={isActivating}
                            onClick={() => updateSubscription(profile.user_id!, profile.id, 'extend_14', profile.name ?? undefined, profile.phone ?? undefined)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-blue-500/20 text-zinc-300 hover:text-blue-400 rounded-lg text-xs font-medium transition-colors border border-zinc-700 hover:border-blue-500/30 disabled:opacity-50"
                            title="تمديد 14 يوم"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            14 يوم
                          </button>

                          <button
                            disabled={isActivating}
                            onClick={() => updateSubscription(profile.user_id!, profile.id, 'activate_365', profile.name ?? undefined, profile.phone ?? undefined)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-violet-500/20 text-zinc-300 hover:text-violet-400 rounded-lg text-xs font-medium transition-colors border border-zinc-700 hover:border-violet-500/30 disabled:opacity-50"
                            title="تفعيل سنة"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            سنة
                          </button>

                          <button
                            disabled={isActivating}
                            onClick={() => updateSubscription(profile.user_id!, profile.id, 'activate_permanent', profile.name ?? undefined, profile.phone ?? undefined)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-500 rounded-lg text-xs font-medium transition-colors border border-zinc-700 hover:border-amber-500/30 disabled:opacity-50"
                            title="تفعيل دائم"
                          >
                            <Target className="w-3.5 h-3.5" />
                            دائم
                          </button>

                          <button
                            disabled={isActivating}
                            onClick={() => updateSubscription(profile.user_id!, profile.id, 'terminate', profile.name ?? undefined, profile.phone ?? undefined)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-xs font-medium transition-colors border border-rose-500/20 disabled:opacity-50"
                            title="إنهاء"
                          >
                            <XOctagon className="w-3.5 h-3.5" />
                            إنهاء
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
