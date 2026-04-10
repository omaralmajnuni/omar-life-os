"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Brain } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const MESSAGES = {
  religious: {
    excellent: ["🕌 ما شاء الله، التزامك الديني اليوم ممتاز", "🕌 تقبل الله طاعتك، بداية مبشرة ونور ليومك", "🕌 أتممت صلواتك وأذكارك، استمر على هذا الفضل"],
    good: ["🕌 عندك تقدم جميل في التزامك اليوم، أكمل الناقص", "🕌 بداية موفقة، لا تنس إتمام باقي وردك وأذكارك", "🕌 أداؤك جيد، احرص على تدارك ما فاتك"],
    weak: ["🕌 لا تنس صلاتك وأذكارك اليوم، هي زادك", "🕌 يومك ناقص بدون صلاتك، خذ دقيقة وابدأ الآن", "🕌 رتّب وقتك لتبدأ بصلاتك أولاً فهي مفتاح التوفيق"]
  },
  tasks: {
    excellent: ["📋 أداؤك مبهر في الأيام الماضية، واصل تألقك!", "📋 تقدم مستمر وإنجاز يفخر به، بطل الأسبوع!", "📋 ما شاء الله سلسلة إنجازاتك لا تنقطع، استمر"],
    good: ["📋 عندك تقدم متقطع، لكنك في الاتجاه الصحيح", "📋 أنجزت بعض المهام مؤخراً، اجعل اليوم أفضل!", "📋 لا تتوقف، كل مهمة تنجزها تصنع الفارق"],
    weak: ["📋 لك فترة ما أنجزت مهام.. ابدأ الآن بمهمة بسيطة", "📋 تراكم المهام يثقلك، اكسر الجليد وأنجز مهمة اليوم", "📋 لا تدع الأيام تمر دون إنجاز، ابدأ بأهم مهمة"],
    none: ["📋 لم تسجل مهام مؤخراً، خطط لغدك لتستعيد نشاطك", "📋 يوم خفيف بدون مهام، فرصة ممتازة للراحة", "📋 أنشئ قائمة مهامك الجديدة لتبدأ بانطلاقة قوية"]
  },
  habits: {
    excellent: ["💪 التزامك بعاداتك خلال الأيام الماضية ملهم جداً!", "💪 سلسلة رائعة من الالتزام، أنت تبني مستقبلك بقوة", "💪 استمرارية ممتازة، عاداتك أصبحت جزءاً جميلاً من يومك"],
    good: ["💪 التزامك متقطع لكنك تحاول، عد بقوة اليوم!", "💪 لا تكسر السلسلة، حافظ على أداء عاداتك يومياً", "💪 استمر، كل يوم هو فرصة جديدة للالتزام بعاداتك"],
    weak: ["💪 لك فترة منقطع عن عاداتك.. ابدأ اليوم من جديد!", "💪 العادات تحتاج لاستمرارية، لا تستسلم وعد أقوى", "💪 التكرار يصنع المجد، عد لأداء عاداتك خطوة بخطوة"],
    none: ["💪 ركز على بناء عادة جديدة مفيدة لك", "💪 العادات الإيجابية تغير الحياة، أضف عادتك الأولى", "💪 خذ دقيقة وفكّر في عادة تود تطويرها غداً"]
  },
  diagnosis: {
    excellent: [
      "🔥 ممتاز، مستواك العام يتحسن بشكل ملحوظ",
      "🔥 أداء عالي والتزامك يستحق الإشادة",
      "🔥 خطواتك واثقة ونجاحك اليومي يتصاعد"
    ],
    good: [
      "👍 عندك تقدم حقيقي، لكن نحتاج تركيز أكبر",
      "👍 أداؤك جيد، خطوة إضافية وتصل للامتياز",
      "👍 استمراريتك واضحة، حافظ عليها وارفع مستواك"
    ],
    weak: [
      "⚠️ واضح فيه هبوط عام، ارجع اليوم ولو بخطوة",
      "⚠️ تراجع بسيط.. لا بأس، المهم العودة بقوة اليوم",
      "⚠️ لا تدع الكسل يتغلب عليك، ابدأ الآن لتعويض ما فات"
    ],
    none: [
      "🧠 ابدأ اليوم بخطوة واحدة وسنكمل البناء عليك",
      "🧠 رحلتك تبدأ بقرار صغير، اتخذه اليوم",
      "🧠 خطط ليومك القادم، ابدأ بتسجيل أولى إنجازاتك"
    ]
  },
  mission: {
    goals: [
      "🎯 حدّث هدف واحد الآن لتعود للطريق الصحيح",
      "🎯 اتخذ خطوة صغيرة اليوم تقربك من أهدافك",
      "🎯 لا تترك أهدافك معلقة، راجعها وحدد خطوتك القادمة"
    ],
    habits: [
      "🔁 ابدأ بعادة واحدة اليوم، الاستمرارية هي السر",
      "🔁 العادات تُبنى بالتكرار، لا تكسر السلسلة اليوم",
      "🔁 اختر عادة بسيطة وأنجزها الآن، هذا يكفي كبداية"
    ],
    tasks: [
      "📋 أنجز مهمة بسيطة الآن واكسر حاجز التأجيل",
      "📋 ركز على مهمة واحدة فقط وأنهِها بنجاح",
      "📋 قائمة مهامك بانتظارك، ابدأ بأسهلها سريعاً"
    ],
    excellent: [
      "🚀 أداؤك رائع، استمر بنفس القوة ولا تتراجع",
      "🚀 حافظ على هذا الاستمرار المذهل في أدائك",
      "🚀 أنت في قمة عطائك، حافظ على التزامك الممتاز"
    ]
  }
};

export default function DailyCoachCard({
  religiousStatus,
  tasksStatus,
  habitsStatus,
  goalsStatus,
  tasksDone, tasksTotal,
  habitsDone, habitsTotal,
  prayersDone, quranDone, quranTotal, adhkarDone
}: any) {

  const [goals, setGoals] = useState<any[] | null>(null);
  
  const [historyStats, setHistoryStats] = useState({
    loaded: false,
    hasHistory: false,
    tasksProgress: 0,
    habitsProgress: 0
  });

  useEffect(() => {
    // 1. Fetch Goals Created in the last 3 days
    const fetchGoals = async () => {
      try {
        const saved = localStorage.getItem("userProfile");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.phone) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const { data, error } = await supabase
              .from('goals')
              .select('*')
              .eq('user_phone', parsed.phone)
              .gte('created_at', threeDaysAgo.toISOString());
              
            if (!error && data) {
              setGoals(data);
            } else {
              setGoals([]);
            }
          }
        }
      } catch (e) {
        setGoals([]);
      }
    };
    fetchGoals();

    // 2. Fetch History for the last 3 days
    try {
      const historyStr = localStorage.getItem("lifeos_history");
      if (historyStr) {
        const historyArray = JSON.parse(historyStr) || [];
        if (historyArray.length > 0) {
          
          const last3Days = Array.from({length: 3}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
          });

          const recent = historyArray.filter((h: any) => last3Days.includes(h.date));
          
          const totalTasks = recent.reduce((sum: number, r: any) => sum + (r.tasksCompleted || 0), 0);
          const totalHabits = recent.reduce((sum: number, r: any) => sum + (r.habitsCompleted || 0), 0);

          setHistoryStats({
            loaded: true,
            hasHistory: recent.length > 0,
            tasksProgress: totalTasks,
            habitsProgress: totalHabits
          });
        } else {
          setHistoryStats(prev => ({ ...prev, loaded: true }));
        }
      } else {
        setHistoryStats(prev => ({ ...prev, loaded: true }));
      }
    } catch (e) {
      setHistoryStats(prev => ({ ...prev, loaded: true }));
    }
  }, [tasksDone, habitsDone]); 

  // -- Helpers --
  const dayIndex = new Date().getDate(); 

  const getMessage = (category: keyof typeof MESSAGES, status: string) => {
    const list = (MESSAGES[category] as any)[status];
    if (!list || list.length === 0) return '';
    return list[dayIndex % list.length];
  };

  // 1. Religious Status
  let rStatus = religiousStatus || 'weak';
  if (prayersDone !== undefined && adhkarDone !== undefined) {
    const score = (prayersDone / 5) * 50 + (adhkarDone / 2) * 25 + Math.min((quranDone / Math.max(1, quranTotal)) * 25, 25);
    if (score === 0) rStatus = 'weak';
    else if (score >= 80) rStatus = 'excellent';
    else rStatus = 'good';
  }
  const finalReligiousText = getMessage('religious', rStatus);

  // 2. Tasks Status
  let tStatus = tasksStatus || 'weak';
  if (historyStats.loaded && historyStats.hasHistory) {
    if (historyStats.tasksProgress === 0) tStatus = 'weak';
    else if (historyStats.tasksProgress > 4) tStatus = 'excellent'; 
    else tStatus = 'good'; 
  } else {
    if (tasksDone !== undefined && tasksTotal !== undefined) {
      const percent = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;
      if (tasksTotal === 0) tStatus = 'none';
      else if (percent >= 80) tStatus = 'excellent';
      else if (percent >= 40) tStatus = 'good';
      else tStatus = 'weak';
    } else if (tasksStatus === 'good') {
      tStatus = 'excellent'; 
    }
  }
  const finalTasksText = getMessage('tasks', tStatus);

  // 3. Habits Status
  let hStatus = habitsStatus || 'weak';
  if (historyStats.loaded && historyStats.hasHistory) {
    if (historyStats.habitsProgress === 0) hStatus = 'weak';
    else if (historyStats.habitsProgress > 3) hStatus = 'excellent'; 
    else hStatus = 'good'; 
  } else {
    if (habitsDone !== undefined && habitsTotal !== undefined) {
      const percent = habitsTotal > 0 ? (habitsDone / habitsTotal) * 100 : 0;
      if (habitsTotal === 0) hStatus = 'none';
      else if (percent >= 80) hStatus = 'excellent';
      else if (percent >= 40) hStatus = 'good';
      else hStatus = 'weak';
    } else if (habitsStatus === 'good') {
      hStatus = 'excellent';
    }
  }
  const finalHabitsText = getMessage('habits', hStatus);

  // 4. Goals Status based on created_at activity in the last 3 days
  let finalGoalsText = "جاري الحساب...";
  let gStatus = goalsStatus || 'weak';
  if (goals !== null) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yDate = new Date(); yDate.setDate(yDate.getDate() - 1);
    const yesterdayStr = yDate.toISOString().split('T')[0];
    const dDate = new Date(); dDate.setDate(dDate.getDate() - 2);
    const dayBeforeStr = dDate.toISOString().split('T')[0];

    let todayCount = 0;
    let yesterdayCount = 0;
    let dayBeforeCount = 0;

    goals.forEach((g: any) => {
       if (!g.created_at) return;
       const date = g.created_at.split('T')[0];
       if (date === todayStr) todayCount++;
       else if (date === yesterdayStr) yesterdayCount++;
       else if (date === dayBeforeStr) dayBeforeCount++;
    });

    if (todayCount === 0 && yesterdayCount === 0 && dayBeforeCount === 0) {
      gStatus = 'none';
    } else if (todayCount === 0 && (yesterdayCount > 0 || dayBeforeCount > 0)) {
      gStatus = 'weak';
    } else if (todayCount > yesterdayCount && yesterdayCount >= dayBeforeCount) {
      gStatus = 'excellent';
    } else if (todayCount < yesterdayCount && yesterdayCount <= dayBeforeCount) {
      gStatus = 'weak';
    } else if (todayCount === yesterdayCount && yesterdayCount === dayBeforeCount && todayCount > 0) {
      gStatus = 'good';
    } else {
      gStatus = 'excellent';
    }
    
    // Fallback static messages for goals section itself
    if (gStatus === 'none') finalGoalsText = "🎯 لك 3 أيام بدون أي نشاط… ارجع اليوم ولو بخطوة بسيطة";
    else if (gStatus === 'weak') finalGoalsText = "⚠️ واضح في تراجع، حاول ترجع اليوم";
    else if (gStatus === 'good') finalGoalsText = "👍 أداءك ثابت، حاول ترفعه خطوة";
    else finalGoalsText = "🎯 ممتاز! نشاط ملحوظ في أهدافك مؤخراً";

  } else if (goalsStatus !== undefined) {
    // Basic fallback if goals aren't loaded and static props passed
    finalGoalsText = goalsStatus === 'good' ? "🎯 ممتاز! نشاط ملحوظ في أهدافك مؤخراً" : "🎯 لك 3 أيام بدون أي نشاط… ارجع اليوم ولو بخطوة بسيطة";
    gStatus = goalsStatus;
  }

  // --- Overall Diagnosis ---
  let excellentCount = 0;
  let goodCount = 0;
  let weakCount = 0;
  let noneCount = 0;

  [tStatus, hStatus, gStatus].forEach(s => {
    if (s === 'excellent') excellentCount++;
    else if (s === 'good') goodCount++;
    else if (s === 'weak') weakCount++;
    else if (s === 'none') noneCount++;
  });

  let diagnosisKey = 'none';
  let diagnosisColor = "text-zinc-400";

  if (noneCount >= 2 && excellentCount === 0 && goodCount === 0) {
    diagnosisKey = 'none';
    diagnosisColor = "text-zinc-400";
  } else if (excellentCount + goodCount >= 2) {
    diagnosisKey = 'excellent';
    diagnosisColor = "text-emerald-400";
  } else if (excellentCount + goodCount === 1) {
    diagnosisKey = 'good';
    diagnosisColor = "text-amber-400";
  } else {
    diagnosisKey = 'weak';
    diagnosisColor = "text-rose-400";
  }

  const overallDiagnosis = getMessage('diagnosis', diagnosisKey);

  // --- Mission of the Day ---
  let missionKey = 'excellent';
  let missionColor = "text-emerald-400";
  
  if (gStatus === 'weak' || gStatus === 'none') {
    missionKey = 'goals';
    missionColor = "text-rose-400";
  } else if (hStatus === 'weak' || hStatus === 'none') {
    missionKey = 'habits';
    missionColor = "text-amber-400";
  } else if (tStatus === 'weak' || tStatus === 'none') {
    missionKey = 'tasks';
    missionColor = "text-blue-400";
  }
  
  const missionOfTheDay = getMessage('mission', missionKey);

  const { classes, theme } = useTheme();

  const itemBg = theme === 'dark' 
    ? 'bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-800/50' 
    : 'bg-slate-50 border-slate-200 hover:bg-slate-100';
  const itemText = theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700';
  const labelText = theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400';
  const iconBg = theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100';
  const dividerBorder = theme === 'dark' ? 'border-zinc-800/50' : 'border-slate-200';

  return (
    <section className="relative w-full mb-6">
      <div className={`${classes.card} border rounded-3xl p-6 shadow-sm relative overflow-hidden text-right`}>
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Brain className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="font-bold text-lg">مدربك اليومي</h2>
        </div>

        {/* Override Diagnosis & Mission */}
        <div className={`mb-4 pb-4 border-b ${dividerBorder} space-y-3`}>
           <div>
             <h3 className={`${labelText} text-[13px] md:text-xs font-bold mb-1`}>التشخيص العام:</h3>
             <p className={`font-bold text-[15px] md:text-sm ${diagnosisColor}`}>{overallDiagnosis}</p>
           </div>
           <div>
             <h3 className={`${labelText} text-[13px] md:text-xs font-bold mb-1`}>مهمة اليوم:</h3>
             <p className={`font-bold text-[15px] md:text-sm ${missionColor}`}>{missionOfTheDay}</p>
           </div>
        </div>

        <div className="space-y-3">
          <div className={`flex ${itemBg} border rounded-2xl p-4 transition-colors`}>
            <span className={`${itemText} text-[15px] md:text-sm font-medium leading-relaxed max-w-full`}>
              <span className={`${labelText} font-bold ml-2`}>الالتزام الديني:</span> {finalReligiousText}
            </span>
          </div>

          <div className={`flex ${itemBg} border rounded-2xl p-4 transition-colors`}>
            <span className={`${itemText} text-[15px] md:text-sm font-medium leading-relaxed max-w-full`}>
              <span className={`${labelText} font-bold ml-2`}>المهام:</span> {finalTasksText}
            </span>
          </div>

          <div className={`flex ${itemBg} border rounded-2xl p-4 transition-colors`}>
            <span className={`${itemText} text-[15px] md:text-sm font-medium leading-relaxed max-w-full`}>
              <span className={`${labelText} font-bold ml-2`}>العادات:</span> {finalHabitsText}
            </span>
          </div>

          <div className={`flex ${itemBg} border rounded-2xl p-4 transition-colors`}>
            <span className={`${itemText} text-[15px] md:text-sm font-medium leading-relaxed max-w-full`}>
              <span className={`${labelText} font-bold ml-2`}>الأهداف:</span> {finalGoalsText}
            </span>
          </div>
        </div>
        
      </div>
    </section>
  );
}
