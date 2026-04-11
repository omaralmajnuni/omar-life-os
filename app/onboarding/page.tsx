"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Rocket, AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function OnboardingPage() {
  const router = useRouter();
  const { classes } = useTheme();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    weight: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Optionally prefill from auth or existing partial profile
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile) {
        setForm(prev => ({
          ...prev,
          name: profile.name || "",
          phone: profile.phone || "",
          age: profile.age?.toString() || "",
          weight: profile.weight?.toString() || ""
        }));
      }
    };
    loadSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    let errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = "مطلوب";
    
    if (!form.phone.trim()) {
      errors.phone = "مطلوب";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      errors.phone = "رقم الجوال يجب أن يكون 10 أرقام بالضبط";
    }

    if (!form.age) {
      errors.age = "مطلوب";
    } else if (isNaN(Number(form.age)) || Number(form.age) <= 0) {
      errors.age = "عمر غير صحيح";
    }

    if (!form.weight) {
      errors.weight = "مطلوب";
    } else if (isNaN(Number(form.weight)) || Number(form.weight) <= 0) {
      errors.weight = "وزن غير صحيح";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("تأكد من صحة البيانات المدخلة");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("لا توجد جلسة نشطة.");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        age: parseInt(form.age),
        weight: parseFloat(form.weight)
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .update(payload).eq('user_id', session.user.id);

      if (upsertError) throw upsertError;

      // Successfully saved!
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ غير متوقع. حاول مرة أخرى.");
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) => 
    `w-full bg-zinc-100 dark:bg-zinc-900/50 border ${hasError ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-emerald-500'} rounded-2xl py-3.5 px-4 focus:outline-none transition-colors text-zinc-900 dark:text-white`;

  return (
    <div className={`min-h-screen ${classes.bg} flex flex-col justify-center items-center p-4 rtl`} dir="rtl">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
            <User className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">
             أهلاً بك في البداية!
          </h1>
          <p className={`${classes.muted} text-sm font-medium px-4`}>
             نحتاج بعض المعلومات السريعة لتخصيص تجربتك.
          </p>
        </div>

        {/* Card */}
        <div className={`${classes.card} border rounded-3xl p-6 md:p-8 shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-sm font-bold block mb-1.5 px-1 text-zinc-700 dark:text-zinc-300">
                الاسم <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className={inputClass(!!fieldErrors.name)}
                placeholder="اسمك الكامل"
              />
              {fieldErrors.name && <p className="text-xs text-rose-500 mt-1 px-1">{fieldErrors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-bold block mb-1.5 px-1 text-zinc-700 dark:text-zinc-300">
                رقم الجوال <span className="text-rose-500">*</span>
              </label>
              <input 
                type="tel" 
                dir="ltr"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className={`${inputClass(!!fieldErrors.phone)} text-left tracking-wider font-mono`}
                placeholder="05xxxxxxxx"
                maxLength={10}
              />
              {fieldErrors.phone && <p className="text-xs text-rose-500 mt-1 px-1">{fieldErrors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="text-sm font-bold block mb-1.5 px-1 text-zinc-700 dark:text-zinc-300">
                  العمر <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={form.age}
                    onChange={e => setForm({...form, age: e.target.value})}
                    className={`${inputClass(!!fieldErrors.age)} text-center font-mono`}
                    placeholder="25"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">سنة</span>
                </div>
                {fieldErrors.age && <p className="text-xs text-rose-500 mt-1 px-1">{fieldErrors.age}</p>}
              </div>

              {/* Weight */}
              <div>
                <label className="text-sm font-bold block mb-1.5 px-1 text-zinc-700 dark:text-zinc-300">
                   الوزن <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.1" 
                    value={form.weight}
                    onChange={e => setForm({...form, weight: e.target.value})}
                    className={`${inputClass(!!fieldErrors.weight)} text-center font-mono`}
                    placeholder="75.5"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">kg</span>
                </div>
                {fieldErrors.weight && <p className="text-xs text-rose-500 mt-1 px-1">{fieldErrors.weight}</p>}
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-4 px-4 text-lg rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Rocket className="w-6 h-6" />
                )}
                ابدأ رحلتك 🚀
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
