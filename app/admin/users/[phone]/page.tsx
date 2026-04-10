"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, Target, CheckSquare, Repeat, Activity, Trash2, Info } from 'lucide-react';
import { logAdminAction } from '@/lib/adminLog';

export default function UserDetailsPage() {
  const params = useParams();
  const phone = decodeURIComponent(params.phone as string);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>({ phone, created_at: null, status: 'active' });
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);

  // Read-only Profile Data
  const [profileData, setProfileData] = useState<any>({
    name: '',
    phone: phone,
    age: '',
    height: '',
    weight: '',
    monthly_weight_goal: '',
    gender: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch User Info safely
        const { data: usersData, error: uErr } = await supabase.from('users').select('*').eq('phone', phone).single();
        let userRec = { phone, created_at: null, status: 'active' };
        
        if (!uErr && usersData) {
           userRec = { phone: usersData.phone || phone, created_at: usersData.created_at, status: usersData.status || 'active' };
        } else {
           const { data: uData2, error: uErr2 } = await supabase.from('users').select('*').eq('user_phone', phone).single();
           if (!uErr2 && uData2) {
             userRec = { phone: uData2.phone || uData2.user_phone || phone, created_at: uData2.created_at, status: uData2.status || 'active' };
           }
        }
        setUserInfo(userRec);

        // Fetch User's Profile safely (Read Only)
        const { data: pData } = await supabase.from('profiles').select('*').eq('phone', phone).single();
        if (pData) {
          setProfileData({
            name: pData.name || '',
            phone: pData.phone || phone,
            age: pData.age || '',
            height: pData.height || '',
            weight: pData.weight || '',
            monthly_weight_goal: pData.monthly_weight_goal || '',
            gender: pData.gender || ''
          });
        }

        // Fetch User's Data Safely
        const { data: gData } = await supabase.from('goals').select('*').eq('user_phone', phone);
        if (gData) setGoals(gData);

        const { data: tData } = await supabase.from('tasks').select('*').eq('user_phone', phone);
        if (tData) setTasks(tData);

        const { data: hData } = await supabase.from('habits').select('*').eq('user_phone', phone);
        if (hData) setHabits(hData);

      } catch (err) {
        console.error("Error fetching detailed user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (phone) fetchUserData();
  }, [phone]);

  const [actionLoading, setActionLoading] = useState(false);
  
  const toggleStatus = async () => {
    const newStatus = userInfo.status === 'disabled' ? 'active' : 'disabled';
    const confirmMsg = newStatus === 'active' 
      ? 'هل أنت متأكد من تفعيل هذا المستخدم؟'
      : 'هل أنت متأكد من تعطيل هذا المستخدم؟ لن يتمكن من استخدام التطبيق.';
      
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.from('users').upsert({
        phone: userInfo.phone,
        status: newStatus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'phone' });

      if (!error) {
        setUserInfo({ ...userInfo, status: newStatus });
        await logAdminAction(newStatus === 'disabled' ? 'disable_user' : 'enable_user', 'user', userInfo?.user_id, `${userInfo?.name || userInfo?.phone}`);
      } else {
        alert('حدث خطأ أثناء تحديث حالة المستخدم. قد يكون الجدول غير مدعوم حالياً.');
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (table: string, id: number | string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذه الخطوة.")) return;

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        alert("فشل عملية الحذف. يرجى المحاولة لاحقاً.");
        console.error(error);
        return;
      }
      
      // Update UI locally
      if (table === 'goals') setGoals(prev => prev.filter(g => g.id !== id));
      else if (table === 'tasks') setTasks(prev => prev.filter(t => t.id !== id));
      else if (table === 'habits') setHabits(prev => prev.filter(h => h.id !== id));

      const typeMap: Record<string, string> = { goals: 'goal', tasks: 'task', habits: 'habit' };
      await logAdminAction(`delete_${typeMap[table]}`, typeMap[table], String(id));
      
    } catch (err) {
      console.error(err);
      alert("حدث خطأ غير متوقع أثناء الحذف.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400">جاري تحميل بيانات المستخدم...</p>
      </div>
    );
  }

  const statCards = [
    { label: "الأهداف المضافة", value: goals.length, icon: <Target className="w-6 h-6 text-emerald-400" /> },
    { label: "المهام المسجلة", value: tasks.length, icon: <CheckSquare className="w-6 h-6 text-amber-400" /> },
    { label: "العادات النشطة", value: habits.length, icon: <Repeat className="w-6 h-6 text-blue-400" /> }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-colors text-zinc-400">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">تفاصيل المستخدم</h1>
          <p className="text-zinc-400 text-sm">عرض معلومات تفصيلية وإدارة نشاط الحساب</p>
        </div>
      </div>

      {/* User Overview Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white" dir="ltr">{userInfo.phone}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${userInfo.status === 'disabled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {userInfo.status === 'disabled' ? 'معطل' : 'نشط'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span>تاريخ التسجيل: {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString("ar-SA") : 'غير متوفر'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end w-full md:w-auto mb-4 md:mb-0">
            <button 
              onClick={toggleStatus}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors w-full md:w-auto ${userInfo.status === 'disabled' ? 'bg-emerald-500 hover:bg-emerald-600 text-black' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'}`}
            >
              {actionLoading ? 'جاري التنفيذ...' : userInfo.status === 'disabled' ? 'تفعيل المستخدم' : 'تعطيل المستخدم'}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             {statCards.map((s, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 flex-1 text-center min-w-[110px]">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <div className="text-xl font-bold text-white mb-0.5">{s.value}</div>
                  <div className="text-xs text-zinc-500 font-medium">{s.label}</div>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Read-Only Profile Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Info className="w-5 h-5 text-emerald-400" />
          البيانات الأساسية
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
            <span className="text-zinc-500 text-xs font-bold block mb-1">الاسم</span>
            <span className="text-white font-medium text-sm">{profileData.name || 'غير متوفر'}</span>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
            <span className="text-zinc-500 text-xs font-bold block mb-1">العمر</span>
            <span className="text-white font-medium text-sm">{profileData.age ? `${profileData.age} سنة` : 'غير متوفر'}</span>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
            <span className="text-zinc-500 text-xs font-bold block mb-1">الجنس</span>
            <span className="text-white font-medium text-sm">{profileData.gender || 'غير متوفر'}</span>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
            <span className="text-zinc-500 text-xs font-bold block mb-1">الطول</span>
            <span className="text-white font-medium text-sm">{profileData.height ? `${profileData.height} سم` : 'غير متوفر'}</span>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
            <span className="text-zinc-500 text-xs font-bold block mb-1">الوزن الحالي</span>
            <span className="text-white font-medium text-sm">{profileData.weight ? `${profileData.weight} كجم` : 'غير متوفر'}</span>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
            <span className="text-zinc-500 text-xs font-bold block mb-1">هدف النزول (شهرياً)</span>
            <span className="text-white font-medium text-sm">{profileData.monthly_weight_goal ? `${profileData.monthly_weight_goal} كجم` : 'غير متوفر'}</span>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Goals */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-400" /></div>
            <h3 className="text-lg font-bold text-white">الأهداف</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {goals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">لا توجد أهداف مسجلة</div>
            ) : (
              goals.map((g, i) => (
                <div key={g.id || i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 relative group">
                  <button onClick={() => handleDeleteItem('goals', g.id)} className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h4 className="font-bold text-white text-sm mb-2 pl-10">{g.title || 'هدف بدون عنوان'}</h4>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-zinc-400">التقدم: <span className="text-emerald-400">{g.current_value || 0}</span> / {g.target_value || 0}</span>
                    <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md text-zinc-300">
                      {g.status === 'completed' ? 'مكتمل' : 'نشط'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><CheckSquare className="w-5 h-5 text-amber-400" /></div>
            <h3 className="text-lg font-bold text-white">المهام</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">لا توجد مهام مسجلة</div>
            ) : (
              tasks.map((t, i) => (
                <div key={t.id || i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 flex items-start justify-between group">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center ${t.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}>
                      {t.completed && <CheckSquare className="w-3 h-3 text-black" />}
                    </div>
                    <div>
                      <h4 className={`font-medium text-sm mb-1 ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{t.title || 'مهمة بدون عنوان'}</h4>
                      <span className="text-xs font-medium text-zinc-500">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString("ar-SA") : 'تاريخ غير متوفر'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteItem('tasks', t.id)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex flex-shrink-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Habits */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Repeat className="w-5 h-5 text-blue-400" /></div>
            <h3 className="text-lg font-bold text-white">العادات</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {habits.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">لا توجد عادات مسجلة</div>
            ) : (
              habits.map((h, i) => (
                <div key={h.id || i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 flex flex-col justify-center relative group">
                  <button onClick={() => handleDeleteItem('habits', h.id)} className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3 mb-2 pl-10">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h4 className="font-medium text-sm text-zinc-200">{h.title || h.name || 'عادة بدون عنوان'}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-zinc-500">التردد: <span className="text-zinc-300">{h.frequency || 'يومي'}</span></span>
                    {h.status && <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">{h.status}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
