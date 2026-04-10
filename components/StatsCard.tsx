import { ReactNode } from 'react';
import { useTheme } from '@/components/ThemeProvider';

export default function StatsCard({ title, value, icon, colorClass }: { title: string, value: string | number, icon: ReactNode, colorClass: string }) {
  const { classes } = useTheme();

  return (
    <div className={`${classes.card} p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <h4 className={`${classes.muted} text-xs sm:text-sm font-bold mb-1`}>{title}</h4>
        <div className="text-xl sm:text-2xl font-black">{value}</div>
      </div>
    </div>
  );
}
