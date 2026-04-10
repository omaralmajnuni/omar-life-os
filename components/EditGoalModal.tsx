import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Target, Save } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function EditGoalModal({ 
  isOpen, 
  onClose, 
  onGoalUpdated, 
  goal 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onGoalUpdated: () => void, 
  goal: any 
}) {
  const [formData, setFormData] = useState({
    title: '',
    period: 'weekly',
    start_date: '',
    end_date: '',
    target_value: '',
    unit: ''
  });
  const { classes, theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal && isOpen) {
      setFormData({
        title: goal.title,
        period: goal.period,
        start_date: goal.start_date,
        end_date: goal.end_date,
        target_value: goal.target_value.toString(),
        unit: goal.unit
      });
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date || !formData.target_value || !formData.unit) {
      alert("الرجاء تعبئة جميع الحقول!");
      return;
    }

    setIsSubmitting(true);
    
    const targetValue = parseInt(formData.target_value);
    const newStatus = goal.current_value >= targetValue ? 'completed' : 'active';

    const { error } = await supabase
      .from('goals')
      .update({
        title: formData.title,
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date,
        target_value: targetValue,
        unit: formData.unit,
        status: newStatus
      })
      .eq('id', goal.id);

    setIsSubmitting(false);

    if (error) {
      console.error("Supabase Error updating goal:", error);
      alert("حدث خطأ من قاعدة البيانات: " + error.message);
    } else {
      onGoalUpdated();
      onClose();
    }
  };

  const inputClass = `w-full ${classes.inputBg} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors`;
  const labelClass = `block text-xs font-bold ${classes.muted} mb-1.5`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" dir="rtl">
      <div className={`${classes.card} rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        
        <div className={`flex items-center justify-between p-5 border-b ${classes.mutedBorder}`}>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Target className="w-5 h-5 text-blue-500" />
            تعديل الهدف
          </div>
          <button onClick={onClose} className={`p-1.5 ${classes.muted} hover:text-rose-500 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'} transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>اسم الهدف</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>نوع الهدف</label>
            <div className="flex gap-2">
              {[
                { id: 'weekly', label: 'أسبوعي' },
                { id: 'monthly', label: 'شهري' },
                { id: 'yearly', label: 'سنوي' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({...formData, period: p.id})}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${formData.period === p.id ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : `${classes.inputBg} ${classes.muted}`}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>تاريخ البداية</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>تاريخ النهاية</label>
              <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>الرقم المطلوب</label>
              <input type="number" value={formData.target_value} onChange={e => setFormData({...formData, target_value: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الوحدة</label>
              <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>

      </div>
    </div>
  );
}
