/**
 * useAdminGuard — hook مركزي للتحقق من صلاحيات الأدمن
 *
 * الاستخدام:
 *   const { ready, authorized } = useAdminGuard();
 *   if (!ready) return <LoadingSpinner />;
 *   if (!authorized) return null; // layout يتولى الـ redirect
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminGuardResult {
  /** true بعد انتهاء التحقق */
  ready: boolean;
  /** true فقط إذا كان المستخدم admin فعلاً */
  authorized: boolean;
  /** الـ user_id الحالي */
  userId: string | null;
}

export function useAdminGuard(): AdminGuardResult {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setReady(true); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (cancelled) return;

        if (profile?.role === 'admin') {
          setAuthorized(true);
          setUserId(user.id);
        }
      } catch {
        // silent — layout سيتولى الـ redirect
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { ready, authorized, userId };
}
