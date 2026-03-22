// ============================================================
// AI Insights Logic — Pure utility, no UI dependencies
// ============================================================

export interface InsightsInput {
  tasksPercent: number;     // 0–100: % of tasks completed
  habitsPercent: number;    // 0–100: % of habits completed
  religiousScore: number;   // 0–100: computed religious score
  goalsProgress: number;    // 0–100: avg goals progress
  overallProgress: number;  // 0–100: combined daily score
}

export interface ScoreCategory {
  name: string;
  score: number;
  icon: string;
}

export interface AIInsightsResult {
  insights: string[];           // Max 3 dynamic insight messages
  strongest: ScoreCategory;     // Highest scoring category
  weakest: ScoreCategory;       // Lowest scoring category
  tomorrowAdvice: string;       // Personalized advice for next day
}

/**
 * Generates AI-driven daily insights based on the user's performance scores.
 * Pure function — no side effects, no UI dependencies.
 */
export function getAIInsights(input: InsightsInput): AIInsightsResult {
  const { tasksPercent, habitsPercent, religiousScore, goalsProgress, overallProgress } = input;

  // --- 1. Build score categories ---
  const scores: ScoreCategory[] = [
    { name: "المهام",   score: tasksPercent,   icon: "🎯" },
    { name: "العادات",  score: habitsPercent,   icon: "🔁" },
    { name: "الدين",    score: religiousScore,  icon: "🕌" },
    { name: "الأهداف", score: goalsProgress,   icon: "🚀" },
  ];

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // --- 2. Generate insight messages (max 3 shown) ---
  const messages: string[] = [];

  if (tasksPercent < 40)
    messages.push("أنت مقصر في إنجاز المهام اليوم، حاول التركيز على الأولويات 🎯");

  if (habitsPercent < 40)
    messages.push("مشكلتك في الالتزام بالعادات، التكرار هو سر النجاح 🔁");

  if (religiousScore > 80)
    messages.push("ماشاء الله! التزامك الديني اليوم عالي جداً وملهم 🤍");
  else if (religiousScore < 40)
    messages.push("يومك ينقصه الجانب الروحاني، الصلاة هي عمود يومك 🕌");

  if (goalsProgress > 70)
    messages.push("أنت تسير بخطى ثابتة نحو أهدافك الكبيرة، استمر 🚀");

  if (overallProgress < 50)
    messages.push("يومك الحالي يحتاج إلى إعادة ضبط، لم يفت الأوان بعد ⚠️");

  if (overallProgress >= 90)
    messages.push("أداء استثنائي في جميع الجوانب! أنت في القمة 🔥");

  // --- 3. Tomorrow's advice — based on weakest area ---
  const tomorrowAdvice =
    weakest.name === "المهام"
      ? "ابدأ غداً بأصعب مهمة أولاً (Eat the Frog) لضمان الإنجاز."
      : weakest.name === "العادات"
      ? "اجعل عاداتك سهلة جداً في البداية لضمان الاستمرارية غداً."
      : weakest.name === "الدين"
      ? "غداً، ركز على أداء الصلوات في وقتها فور الأذان."
      : "راجع أهدافك غداً قبل البدء لتتأكد أنك تسير في الاتجاه الصحيح.";

  return {
    insights: messages.slice(0, 3),
    strongest,
    weakest,
    tomorrowAdvice,
  };
}
