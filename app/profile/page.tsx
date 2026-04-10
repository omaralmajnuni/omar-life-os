"use client";

import { useState, useEffect, useRef } from "react";
import { User, Activity, Settings, Save, CheckCircle2, Star, Wrench, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { TrialExpiredScreen } from "@/components/TrialExpiredScreen";
import { useTheme } from "@/components/ThemeProvider";

export default function ProfilePage() {
  const { classes, theme } = useTheme();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const { isTrialExpired, isCheckingTrial } = useTrialStatus();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("🔥 بداية قوية! تم حفظ بياناتك");
  const [isSaved, setIsSaved] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{ status: string, daysText: string, isEnded: boolean } | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    age: "",
    phone: "",
    weight: "",
    height: "",
    targetWeightLoss: "",
    targetWater: "",
    targetCalories: "",
    targetSteps: "",
    personalGoal: ""
  });

  useEffect(() => {
    const initProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        console.log("Loading profile for user:", session.user.id);
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        console.log("Fetch result:", existingProfile, fetchError);

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Profile Fetch Error:", {
            message: fetchError.message,
            code: fetchError.code,
            details: fetchError.details,
            hint: fetchError.hint
          });
        }

        let profData = existingProfile;

        if (!profData) {
          const { data: insertedData, error: insertError } = await supabase
            .from('profiles')
            .upsert({
              user_id: session.user.id,
              created_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select('*')
            .single();

          if (insertError) {
            console.error("Profile Creation Sandbox Error:", {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            });
            setToastMsg("ملاحظة: حدث تأخير بسيط في مزامنة حسابك، يمكن الاستمرار بشكل طبيعي.");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
          } else {
            profData = insertedData;
          }
        }

        if (profData) {
          setProfile({
            name: profData.name || "",
            age: profData.age?.toString() || "",
            phone: profData.phone || "",
            weight: profData.weight?.toString() || "",
            height: profData.height?.toString() || "",
            targetWeightLoss: profData.monthly_weight_goal?.toString() || profData.target_weight_loss?.toString() || "",
            targetWater: profData.water_goal?.toString() || "",
            targetCalories: profData.calories_goal?.toString() || "",
            targetSteps: profData.steps_goal?.toString() || "",
            personalGoal: profData.personal_goal || ""
          });
          if (profData.name && profData.age && profData.phone) setIsSaved(true);
        }

        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('status, ends_at')
          .eq('user_id', session.user.id)
          .maybeSingle();

        let subStatusDisplay = 'غير مشترك';
        let subDaysDisplay = 'لا يوجد';
        let subIsEnded = true;

        const status = subData?.status || profData?.subscription_status || 'none';

        if (status === 'trial') {
          const trialEnd = profData?.trial_ends_at; 
          if (trialEnd) {
            const remainingDays = Math.ceil((new Date(trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays > 0) {
              subStatusDisplay = 'تجريبي';
              subDaysDisplay = `متبقي ${remainingDays} يوم`;
              subIsEnded = false;
            } else {
              subStatusDisplay = 'تجريبي';
              subDaysDisplay = 'منتهي';
            }
          }
        } 
        else if (status === 'active' || status === 'activated' || status === 'permanent') {
          subStatusDisplay = 'مفعل';
          subIsEnded = false;
          if (subData?.ends_at) {
            const remainingDays = Math.ceil((new Date(subData.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays > 0) {
              subDaysDisplay = `متبقي ${remainingDays} يوم`;
            } else {
              subDaysDisplay = 'منتهي';
              subIsEnded = true; 
            }
          } else {
            subDaysDisplay = 'غير محدد';
          }
        }
        else if (status === 'expired' || status === 'inactive') {
          subStatusDisplay = 'منتهي';
          subDaysDisplay = 'انتهى الاشتراك';
        }
        else if (status === 'pending') {
          subStatusDisplay = 'قيد الانتظار';
          subDaysDisplay = 'يتم المراجعة';
          subIsEnded = true; 
        } 
        else {
          if (profData?.trial_ends_at) {
            const remainingDays = Math.ceil((new Date(profData.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays > 0) {
              subStatusDisplay = 'تجريبي';
              subDaysDisplay = `متبقي ${remainingDays} يوم`;
              subIsEnded = false;
            }
          }
        }

        setTrialInfo({ status: subStatusDisplay, daysText: subDaysDisplay, isEnded: subIsEnded });

      } catch (err: any) {
        console.error("Unexpected error ensuring profile:", err);
      }

      setIsLoaded(true);
    };

    initProfile();
  }, [router]);

  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
      setShowDevTools(true);
      setToastMsg("تم تفعيل وضع المطور");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile.phone || !profile.name) {
      alert("الرجاء إدخال الاسم ورقم الجوال للتسجيل.");
      return;
    }
    
    // 4) استخدم auth.getUser
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) return;

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', profile.phone)
        .neq('user_id', userData.user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking profile:", checkError);
      }

      if (existingUser) {
        alert("هذا الرقم مسجل بحساب آخر ❌");
        return;
      }

      // نحفظ الحقول الحساسة إذا كانت موجودة مسبقًا
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('email, subscription_status, role, trial_ends_at')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      console.log("Saving profile for user id:", userData.user.id);

      // 7) مطابقة الحقول المطلوبة بالضبط
      const payload = {
        age: profile.age ? parseInt(profile.age) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        monthly_weight_goal: profile.targetWeightLoss ? parseFloat(profile.targetWeightLoss) : null,
        water_goal: profile.targetWater ? parseInt(profile.targetWater) : null,
        calories_goal: profile.targetCalories ? parseInt(profile.targetCalories) : null,
        steps_goal: profile.targetSteps ? parseInt(profile.targetSteps) : null,
        personal_goal: profile.personalGoal || null,
        name: profile.name,
        phone: profile.phone,
        email: myProfile?.email || userData.user.email || null,
        subscription_status: myProfile?.subscription_status || null,
        role: myProfile?.role || 'user',
        trial_ends_at: myProfile?.trial_ends_at || null,
        user_id: userData.user.id
      };
      
      console.log("Payload الكامل قبل الحفظ:", payload);

      // 5) استخدم upsert بالشكل الصحيح
      const { data: savedData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();

      // 6) طباعة النتيجة
      console.log("نتيجة الحفظ من Supabase (Data):", savedData);
      console.log("أي Error من Supabase:", upsertError);

      if (upsertError) {
        console.error("Error updating profile:", upsertError);
        alert(upsertError.message || "حدث خطأ في قاعدة البيانات");
        return;
      }

      alert("تم حفظ بياناتك بنجاح ✅");

    } catch (e: any) {
      console.error("Unexpected error:", e);
      alert(e.message || "حدث خطأ غير متوقع.");
      return;
    }

    // Trial info is no longer persisted in local storage

    setIsSaved(true);
    setToastMsg("🔥 بداية قوية! تم حفظ بياناتك");
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleDevAction = (action: string) => {
    setToastMsg("وظائف المطور التجريبية متوقفة - الاشتراكات تعتمد الآن على الخادم.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    // احذف فقط مفاتيح هذا المستخدم (لا تمسح بيانات مستخدمين آخرين)
    if (user?.id) {
      const keysToRemove = [
        `lifeos_history_${user.id}`,
        `lifeos_weight_config_${user.id}`,
        `lifeos_goals_${user.id}`,
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
    router.replace('/login');
  };


  const handleWhatsApp = async () => {
    if (isActivating) return;
    setIsActivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("المستخدم غير مسجل دخول.");

      const name = profile?.name || "غير محدد";
      const phone = profile?.phone || "غير محدد";

      const { data: existingRecords, error: checkError } = await supabase
        .from('subscription_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'contacted'])
        .limit(1);

      if (!existingRecords || existingRecords.length === 0) {
        const { error } = await supabase.from('subscription_requests').insert({
          user_id: user.id,
          name: name,
          phone: phone,
          status: 'pending'
        });

        if (error) {
          console.error("Error saving request:", error);
          throw new Error("حدث خطأ أثناء رفع الطلب للمراجعة.");
        }
      }

      // تحديث حالة الاشتراك في جدول الاشتراكات لكي يتحدث في الواجهة مباشرة
      const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        status: 'pending'
      }, { onConflict: 'user_id' });

      if (subError) {
        console.error("Error updating subscription table:", subError);
        throw new Error("حدث خطأ أثناء تحديث حالة الاشتراك.");
      }

      // تحديث حالة الواجهة فوريًا
      setTrialInfo({ status: 'قيد الانتظار', daysText: 'يتم المراجعة', isEnded: false });

      const message = `السلام عليكم، أرغب في تفعيل اشتراك تطبيق Life OS
الاسم: ${name}
رقم الجوال: ${phone}`;

      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/966548658600?text=${encodedMessage}`;
      window.location.href = waUrl;
    } catch (e: any) {
      alert(e.message || "تعذر إرسال الطلب، الرجاء المحاولة لاحقاً.");
    } finally {
      setIsActivating(false);
    }
  };

  if (!isLoaded || isCheckingTrial) return <div className={`min-h-screen ${classes.bg}`} />;
  if (isTrialExpired) return <TrialExpiredScreen />;

  const inputClass = `w-full ${classes.inputBg} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors`;
  const labelClass = `block text-xs font-bold ${classes.muted} mb-1.5 uppercase tracking-widest`;
  const sectionClass = `${classes.card} rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm relative overflow-hidden transition-all`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${classes.bg}`} dir="rtl">
      <main className="px-4 py-8 md:px-8 md:py-12 max-w-2xl mx-auto space-y-6 md:space-y-8">

        <header className="flex flex-col items-start space-y-1 mb-6">
          <h1
            className="text-3xl md:text-5xl font-black tracking-tight mb-2 select-none touch-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            ابدأ رحلتك 🔥
          </h1>
          <p className={`text-sm md:text-base font-medium ${classes.muted}`}>
            خلنا نبني نظامك اليومي حسب أهدافك
          </p>
        </header>

        <div className={`bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-4 rounded-2xl md:rounded-3xl font-bold text-sm md:text-base leading-relaxed`}>
          كل شيء يبدأ بخطوة بسيطة... واليوم هو البداية
        </div>

        {/* Basic Info */}
        <section className={sectionClass}>
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold">المعلومات الأساسية</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>الاسم</label>
              <input type="text" value={profile.name} onChange={e => handleChange("name", e.target.value)} className={inputClass} placeholder="أدخل اسمك" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>العمر</label>
                <input type="number" value={profile.age} onChange={e => handleChange("age", e.target.value)} className={inputClass} placeholder="سنة" />
              </div>
              <div>
                <label className={labelClass}>رقم الجوال</label>
                <input type="text" value={profile.phone} onChange={e => handleChange("phone", e.target.value)} className={inputClass} placeholder="05xxxxxxxx" />
              </div>
            </div>
          </div>
        </section>

        {/* Health */}
        <section className={sectionClass}>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold">الصحة والأهداف</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>الوزن الحالي</label>
                <div className="relative">
                  <input type="number" value={profile.weight} onChange={e => handleChange("weight", e.target.value)} className={inputClass} placeholder="0" />
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs ${classes.muted} font-bold`}>كجم</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>الطول</label>
                <div className="relative">
                  <input type="number" value={profile.height} onChange={e => handleChange("height", e.target.value)} className={inputClass} placeholder="0" />
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs ${classes.muted} font-bold`}>سم</span>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>الهدف الشهري لنزول الوزن</label>
              <div className="relative">
                <input type="number" value={profile.targetWeightLoss} onChange={e => handleChange("targetWeightLoss", e.target.value)} className={inputClass} placeholder="0" />
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs ${classes.muted} font-bold`}>كجم</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>هدف الماء</label>
                <input type="number" value={profile.targetWater} onChange={e => handleChange("targetWater", e.target.value)} className={inputClass} placeholder="أكواب" />
              </div>
              <div>
                <label className={labelClass}>هدف السعرات</label>
                <input type="number" value={profile.targetCalories} onChange={e => handleChange("targetCalories", e.target.value)} className={inputClass} placeholder="سعرة" />
              </div>
              <div>
                <label className={labelClass}>الخطوات</label>
                <input type="number" value={profile.targetSteps} onChange={e => handleChange("targetSteps", e.target.value)} className={inputClass} placeholder="خطوة" />
              </div>
            </div>
          </div>
        </section>

        {/* Settings */}
        <section className={sectionClass}>
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold">إعدادات بسيطة</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>هدف شخصي</label>
              <textarea
                value={profile.personalGoal}
                onChange={e => handleChange("personalGoal", e.target.value)}
                className={`${inputClass} min-h-[100px] resize-none`}
                placeholder="اكتب هدفك الشخصي هنا..."
              />
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className={sectionClass}>
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">الاشتراك</h2>
          </div>

          <div className="space-y-4">
            {trialInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${classes.inputBg}`}>
                    <span className={labelClass}>حالة الحساب</span>
                    <span className={`font-black text-lg block mt-1 ${trialInfo.status === 'تجريبي' ? 'text-emerald-500' : trialInfo.status === 'مفعل' ? 'text-amber-500' : trialInfo.isEnded ? 'text-rose-500' : classes.muted}`}>
                      {trialInfo.status}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl border ${classes.inputBg}`}>
                    <span className={labelClass}>الأيام المتبقية</span>
                    <span className={`font-black text-lg block mt-1 ${trialInfo.isEnded ? 'text-rose-500' : (theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900')}`}>
                      {trialInfo.daysText}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-6 border border-dashed rounded-xl ${classes.mutedBorder} ${classes.cardInner}`}>
                <p className={`text-sm font-bold animate-pulse ${classes.muted}`}>جاري تحميل بيانات الاشتراك...</p>
              </div>
            )}

            <button
              onClick={handleWhatsApp}
              disabled={isActivating}
              className={`w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-base md:text-lg py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] ${isActivating ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
            >
              {isActivating ? (
                <span className="animate-pulse">جاري الإرسال...</span>
              ) : (
                <>
                  <Star className="w-5 h-5 md:w-6 md:w-6 fill-zinc-950" />
                  تفعيل الاشتراك عبر واتساب
                </>
              )}
            </button>
          </div>
        </section>

        {/* Save Button */}
        <div className="space-y-4">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-2xl md:rounded-3xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]"
          >
            <Save className="w-5 h-5" />
            حفظ البيانات
          </button>

          {isSaved && !trialInfo?.isEnded ? (
            <Link
              href="/"
              className={`w-full flex items-center justify-center gap-2 font-bold text-lg py-4 rounded-2xl md:rounded-3xl transition-all border active:scale-[0.98] ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-white hover:bg-slate-50 text-zinc-900 border-zinc-200'}`}
            >
              دخول للنظام
            </Link>
          ) : isSaved && trialInfo?.isEnded ? (
            <div className="w-full text-center py-3 text-rose-500 font-bold text-sm bg-rose-500/10 rounded-xl">
              لا يمكنك الدخول للنظام (الاشتراك منتهي أو غير متوفر)
            </div>
          ) : null}

          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-lg py-4 rounded-2xl md:rounded-3xl transition-all border border-rose-500/20 active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </main>
    </div>
  );
}
