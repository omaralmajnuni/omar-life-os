"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useTrialStatus() {
  const router = useRouter();
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [isCheckingTrial, setIsCheckingTrial] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const checkTrial = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsCheckingTrial(false);
          router.replace("/login");
          return;
        }

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, ends_at')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from('profiles')
          .select('trial_ends_at')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const status = sub?.status || 'none';

        if (status === 'trial') {
          if (profile?.trial_ends_at) {
            const remainingDays = Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays > 0) {
              setTrialDaysLeft(remainingDays);
              setIsTrialExpired(false);
            } else {
              setTrialDaysLeft(0);
              setIsTrialExpired(true);
            }
          } else {
            setTrialDaysLeft(0);
            setIsTrialExpired(true);
          }
        } 
        else if (status === 'active' || status === 'activated' || status === 'permanent') {
          setIsTrialExpired(false);
          if (sub?.ends_at) {
            const remainingDays = Math.ceil((new Date(sub.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays > 0) {
              setTrialDaysLeft(remainingDays);
            } else {
              setTrialDaysLeft(0);
              setIsTrialExpired(true);
            }
          } else {
            setTrialDaysLeft(null); // غير محدد
          }
        } 
        else if (status === 'expired' || status === 'inactive') {
          setIsTrialExpired(true);
          setTrialDaysLeft(0);
        } 
        else {
          // If status is pending or none, try falling back to overall trial if they still have days
          if (profile?.trial_ends_at) {
            const remainingDays = Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays > 0) {
              setTrialDaysLeft(remainingDays);
              setIsTrialExpired(false);
              return;
            }
          }
          setIsTrialExpired(true);
          setTrialDaysLeft(0);
        }
      } catch (err) {
        console.error("Error checking trial status:", err);
      } finally {
        setIsCheckingTrial(false);
      }
    };

    checkTrial();
  }, [router]);

  return { isTrialExpired, isCheckingTrial, trialDaysLeft };
}
