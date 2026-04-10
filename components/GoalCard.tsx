import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Trash2, Plus, Calendar, Edit2, Minus } from 'lucide-react';
import EditGoalModal from './EditGoalModal';
import { useTheme } from '@/components/ThemeProvider';

export default function GoalCard({ 
  goal, 
  onUpdate, 
  onDelete,
  onOptimisticUpdate 
}: { 
  goal: any, 
  onUpdate: () => void, 
  onDelete: () => void,
  onOptimisticUpdate?: (id: string, updates: any) => void
}) {
  const { classes, theme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleUpdateProgress = async (delta: number) => {
    if (isUpdating) return;
    
    let newCurrentValue = goal.current_value + delta;
    if (newCurrentValue < 0) newCurrentValue = 0;
    
    if (newCurrentValue === goal.current_value) return;

    setIsUpdating(true);
    
    const previousGoal = { ...goal };
    const newStatus = newCurrentValue >= goal.target_value ? 'completed' : 'active';
    
    if (onOptimisticUpdate) {
      onOptimisticUpdate(goal.id, { current_value: newCurrentValue, status: newStatus });
    }
    
    console.time(`SupabaseUpdate_${goal.id}`);
    const { error } = await supabase
      .from('goals')
      .update({ current_value: newCurrentValue, status: newStatus })
      .eq('id', goal.id);
    console.timeEnd(`SupabaseUpdate_${goal.id}`);
      
    if (error) {
      console.error("Supabase Error updating progress:", error);
      if (onOptimisticUpdate) {
        onOptimisticUpdate(goal.id, { current_value: previousGoal.current_value, status: previousGoal.status });
      }
    }
    
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    if (confirm("هل أنت متأكد من حذف هذا الهدف؟")) {
      const { error } = await supabase.from('goals').delete().eq('id', goal.id);
      if (error) {
        console.error("Supabase Error deleting goal:", error);
      } else {
        onDelete();
      }
    }
  };

  const progressPercent = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  const isCompleted = goal.status === 'completed';

  return (
    <>
      <div className={`${classes.card} ${isCompleted ? 'border-emerald-500/50 bg-emerald-500/5' : ''} rounded-2xl md:rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[180px] transition-all`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isCompleted ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  مكتمل ✅
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/10">
                  نشط
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold flex items-center gap-2 mt-2">
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              <span className={isCompleted ? `line-through ${classes.muted}` : ''}>{goal.title}</span>
            </h3>
            <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${classes.muted}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{goal.start_date}</span>
              <span>إلى</span>
              <span>{goal.end_date}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setIsEditModalOpen(true)} className={`text-zinc-500 hover:text-blue-500 transition-colors p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'}`}>
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className={`text-zinc-500 hover:text-rose-500 transition-colors p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className={isCompleted ? 'text-emerald-500' : 'text-blue-500'}>{goal.current_value} {goal.unit}</span>
              <span className={classes.muted}>{goal.target_value} {goal.unit}</span>
            </div>
            <div className={`h-2.5 ${classes.inputBg} rounded-full overflow-hidden border`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleUpdateProgress(1)}
              disabled={isUpdating || isCompleted}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20'}`}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  جاري...
                </>
              ) : isCompleted ? (
                'الهدف مكتمل 👏'
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  إضافة +1
                </>
              )}
            </button>

            <button 
              onClick={() => handleUpdateProgress(-1)}
              disabled={isUpdating || goal.current_value === 0}
              className={`px-5 flex items-center justify-center font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-rose-400 border border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-zinc-600 hover:text-rose-500 border border-zinc-200'}`}
              title="تراجع"
            >
              -1
            </button>
          </div>
        </div>
      </div>

      <EditGoalModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onGoalUpdated={onUpdate} 
        goal={goal} 
      />
    </>
  );
}
