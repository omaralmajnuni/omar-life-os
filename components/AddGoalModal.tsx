import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Target, Save } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function AddGoalModal({ isOpen, onClose, onGoalAdded, userId }: { isOpen: boolean, onClose: () => void, onGoalAdded: () => void, userId: string }) {
  const { classes, theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    period: 'weekly',
    start_date: '',
    end_date: '',
    target_value: '',
    unit: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date || !formData.target_value || !formData.unit) {
      alert("الرجاء تعبئة جميع الحقول!");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('goals').insert([{
      title: formData.title,
      period: formData.period,
      start_date: formData.start_date,
      end_date: formData.end_date,
      target_value: parseInt(formData.target_value),
      unit: formData.unit,
      user_id: userId,
      current_value: 0,
      status: 'active'
    }]);

    setIsSubmitting(false);

    if (error) {
      alert("حدث خطأ أثناء حفظ الهدف.");
      console.error(error);
    } else {
      setFormData({ title: '', period: 'weekly', start_date: '', end_date: '', target_value: '', unit: '' });
      onGoalAdded();
      onClose();
    }
  };

  const inputClass = `w-full ${classes.inputBg} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors`;
  const labelClass = `block text-xs font-bold ${classes.muted} mb-1.5`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" dir="rtl">
      <div className={`${classes.card} rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        
        <div className={`flex items-center justify-between p-5 border-b ${classes.mutedBorder}`}>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Target className="w-5 h-5 text-emerald-500" />
            إضافة هدف جديد
          </div>
          <button onClick={onClose} className={`p-1.5 ${classes.muted} hover:text-rose-500 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'} transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>اسم الهدف</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} placeholder="مثل: قراءة كتاب، المشي..." />
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
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${formData.period === p.id ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : `${classes.inputBg} ${classes.muted}`}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>تاريخ البداية</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>تاريخ النهاية</label>
              <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>الرقم المطلوب</label>
              <input type="number" value={formData.target_value} onChange={e => setFormData({...formData, target_value: e.target.value})} className={inputClass} placeholder="مثال: 5" />
            </div>
            <div>
              <label className={labelClass}>الوحدة</label>
              <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className={inputClass} placeholder="صفحة، كيلو، مرة" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الهدف'}
          </button>
        </form>

      </div>
    </div>
  );
}
