"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useSubscriptionStatus() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "active" | "expired" | "unknown">("loading");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus("loading");
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile || !profile.trial_ends_at) {
          setStatus("unknown");
          setTrialDaysLeft(null);
          return;
        }

        const today = new Date();
        const end = new Date(profile.trial_ends_at);
        const diffTime = end.getTime() - today.getTime();
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (profile.subscription_status === 'trial') {
          if (remainingDays <= 0) {
            setStatus("expired");
            setTrialDaysLeft(0);
          } else {
            setStatus("active");
            setTrialDaysLeft(remainingDays);
          }
        } else if (profile.subscription_status === 'active') {
          setStatus("active");
          setTrialDaysLeft(null);
        } else if (profile.subscription_status === 'expired') {
          setStatus("expired");
          setTrialDaysLeft(0);
        } else {
          setStatus("unknown");
          setTrialDaysLeft(null);
        }
      } catch (err) {
        console.error("Error checking subscription status:", err);
        setStatus("unknown");
      }
    };

    checkStatus();
  }, [router]);

  return { 
    isExpired: status === "expired", 
    isLoading: status === "loading",
    status,
    trialDaysLeft 
  };
}
