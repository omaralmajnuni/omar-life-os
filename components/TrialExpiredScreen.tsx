"use client";

import React from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";

export function TrialExpiredScreen() {
  const { classes, theme } = useTheme();

  const [profile, setProfile] = React.useState<{name?: string, phone?: string} | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('name, phone').eq('user_id', user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleWhatsApp = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("المستخدم غير مسجل دخول.");

      const name = profile?.name || "غير محدد";
      const phone = profile?.phone || "غير محدد";

      const { data: existingRecords } = await supabase
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
          throw error;
        }
      }

      const message = `السلام عليكم، أرغب في تفعيل اشتراك تطبيق Life OS
الاسم: ${name}
رقم الجوال: ${phone}`;

      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/966548658600?text=${encodedMessage}`;
      window.location.href = waUrl;
    } catch (e) {
      alert("تعذر إرسال الطلب، الرجاء المحاولة لاحقاً.");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${classes.bg} transition-colors duration-300`} dir="rtl">
      <div className={`max-w-md w-full ${classes.card} border rounded-3xl p-8 shadow-2xl text-center space-y-6`}>
        <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-2">
          <span className="text-4xl">⏳</span>
        </div>
        <div>
          <h1 className="text-2xl font-black mb-2 text-rose-500">انتهت فترة التجربة</h1>
          <p className={`font-medium ${classes.muted}`}>للاستمرار في استخدام النظام، تواصل لتفعيل الاشتراك</p>
        </div>
        <div className={`p-4 rounded-2xl border ${classes.inputBg}`}>
          <span className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${classes.muted}`}>رقم التواصل</span>
          <span className="text-xl font-black tracking-wider text-emerald-500" dir="ltr">0548658600</span>
        </div>
        <button onClick={handleWhatsApp} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]">
          تفعيل الاشتراك عبر واتساب
        </button>
      </div>
    </div>
  );
}
