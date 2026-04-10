"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollText, Filter, RefreshCw, User, Target, CreditCard, LogIn, Trash2, UserX, Settings, Search, ChevronDown } from 'lucide-react';
import { AdminLog } from '@/types';

const ACTION_LABELS: Record<string, string> = {
  'admin_login': 'تسجيل دخول',
  'delete_goal': 'حذف هدف',
  'delete_task': 'حذف مهمة',
  'delete_habit': 'حذف عادة',
  'disable_user': 'تعطيل مستخدم',
  'enable_user': 'تفعيل مستخدم',
  // أكواد الاشتراك الجديدة (مميزة لكل عملية)
  'activate_30d': 'تفعيل 30 يوم',
  'extend_14d': 'تمديد 14 يوم',
  'activate_365d': 'تفعيل سنة',
  'activate_permanent': 'تفعيل دائم',
  'terminate_subscription': 'إنهاء اشتراك',
  // الأكواد القديمة (للتوافق مع السجلات السابقة)
  'activate_subscription': 'تفعيل اشتراك',
  'extend_subscription': 'تمديد اشتراك',
  'update_request_status': 'تحديث حالة طلب',
  'change_password': 'تغيير كلمة المرور',
  'change_email': 'تغيير البريد',
};

const TYPE_LABELS: Record<string, string> = {
  'auth': 'مصادقة',
  'user': 'مستخدم',
  'goal': 'هدف',
  'task': 'مهمة',
  'habit': 'عادة',
  'subscription': 'اشتراك',
  'settings': 'إعدادات',
};

const TYPE_ICONS: Record<string, any> = {
  'auth': LogIn,
  'user': User,
  'goal': Target,
  'task': ScrollText,
  'habit': RefreshCw,
  'subscription': CreditCard,
  'settings': Settings,
};

const TYPE_COLORS: Record<string, string> = {
  'auth': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'user': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'goal': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'task': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'habit': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'subscription': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'settings': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

// قائمة العمليات الممكنة للفلترة
const ACTION_FILTER_OPTIONS = [
  { value: 'all', label: 'كل العمليات' },
  { value: 'activate_30d', label: 'تفعيل 30 يوم' },
  { value: 'extend_14d', label: 'تمديد 14 يوم' },
  { value: 'activate_365d', label: 'تفعيل سنة' },
  { value: 'activate_permanent', label: 'تفعيل دائم' },
  { value: 'terminate_subscription', label: 'إنهاء اشتراك' },
  { value: 'update_request_status', label: 'تحديث حالة طلب' },
  { value: 'activate_subscription', label: 'تفعيل اشتراك (قديم)' },
  { value: 'disable_user', label: 'تعطيل مستخدم' },
  { value: 'enable_user', label: 'تفعيل مستخدم' },
  { value: 'delete_goal', label: 'حذف هدف' },
  { value: 'delete_task', label: 'حذف مهمة' },
  { value: 'delete_habit', label: 'حذف عادة' },
];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // فلترة حسب النوع (target_type)
      if (filterType !== 'all') {
        query = query.eq('target_type', filterType);
      }

      // فلترة حسب العملية (action) — من قاعدة البيانات مباشرة
      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterAction]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHr < 24) return `منذ ${diffHr} ساعة`;
    if (diffDay < 7) return `منذ ${diffDay} يوم`;
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDetails = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.message) return String(value.message);
    return JSON.stringify(value, null, 2);
  };

  // فلترة محلية بالبحث عن الاسم أو الجوال
  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.target_user_name?.toLowerCase().includes(q)) ||
      (log.target_user_phone?.includes(q)) ||
      (ACTION_LABELS[log.action] ?? log.action).includes(q)
    );
  });

  const filterTypes = ['all', 'auth', 'user', 'goal', 'task', 'habit', 'subscription', 'settings'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-emerald-400" />
            سجل العمليات
          </h1>
          <p className="text-zinc-500 text-sm">تتبع جميع عمليات لوحة الإدارة</p>
        </div>

        <div className="flex items-center gap-3">
          {/* بحث بالاسم / الجوال */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الجوال..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-xl py-2 pr-9 pl-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors w-52"
            />
          </div>

          {/* فلترة حسب العملية */}
          <div className="relative">
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-800 text-white rounded-xl py-2 pr-4 pl-8 text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {ACTION_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors border border-zinc-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Filters — فلترة حسب النوع */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
        {filterTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              filterType === type
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
          >
            {type === 'all' ? 'الكل' : TYPE_LABELS[type] || type}
          </button>
        ))}
        {filteredLogs.length > 0 && (
          <span className="text-xs text-zinc-600 mr-auto">{filteredLogs.length} سجل</span>
        )}
      </div>

      {/* Logs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <ScrollText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">لا توجد سجلات لعرضها</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredLogs.map(log => {
              const Icon = TYPE_ICONS[log.target_type] || ScrollText;
              const color = TYPE_COLORS[log.target_type] || TYPE_COLORS['settings'];
              const isDanger = log.action.startsWith('delete') || log.action === 'terminate_subscription' || log.action === 'disable_user';

              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                  {/* أيقونة النوع */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* المحتوى */}
                  <div className="flex-1 min-w-0">
                    {/* سطر الفعل */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isDanger ? 'text-rose-400' : 'text-white'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
                        {TYPE_LABELS[log.target_type] || log.target_type}
                      </span>
                    </div>

                    {/* اسم المستخدم المستهدف */}
                    {(log.target_user_name || log.target_user_phone) && (
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-xs text-zinc-300">
                          {log.target_user_name || '—'}
                        </span>
                        {log.target_user_phone && (
                          <span className="text-xs text-zinc-500 font-mono" dir="ltr">
                            {log.target_user_phone}
                          </span>
                        )}
                      </div>
                    )}

                    {/* التفاصيل */}
                    {log.details && (
                      <p className="text-xs text-zinc-500 mt-1 truncate max-w-md">
                        {formatDetails(log.details)}
                      </p>
                    )}

                    {/* الـ IDs القديمة (للتوافق) */}
                    {log.target_id && !log.target_user_id && (
                      <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ID: {log.target_id}</p>
                    )}
                  </div>

                  {/* الوقت */}
                  <span className="text-xs text-zinc-600 shrink-0 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
