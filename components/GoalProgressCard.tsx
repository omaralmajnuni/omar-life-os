import { useTheme } from '@/components/ThemeProvider';

export default function GoalProgressCard({ goal }: { goal: any }) {
  const { classes, theme } = useTheme();
  const percent = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  const isCompleted = goal.status === 'completed';

  return (
    <div className={`${classes.cardInner} border ${isCompleted ? 'border-emerald-500/30' : classes.mutedBorder} rounded-2xl p-4 transition-all hover:opacity-90`}>
      <div className="flex justify-between items-start mb-3 gap-4">
        <h4 className={`font-bold text-sm ${isCompleted ? `line-through ${classes.muted}` : ''}`}>{goal.title}</h4>
        <span className={`text-xs font-bold ${classes.muted} ${classes.inputBg} px-2 py-1 rounded-md shrink-0 border`}>
          {goal.current_value} / {goal.target_value} {goal.unit}
        </span>
      </div>
      <div className={`h-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800/50' : 'bg-slate-200 border-slate-300/50'} rounded-full overflow-hidden border`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
