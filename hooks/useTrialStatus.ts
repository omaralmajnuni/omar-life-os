"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useTrialStatus(enforceProfile = true) {
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
          .select('trial_ends_at, name, phone, age')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const status = sub?.status || 'none';

        // Profile Completion Interceptor
        if (enforceProfile) {
          const profileIncomplete = !profile?.name || !profile?.phone || !profile?.age;
          if (profileIncomplete) {
            console.log("Incomplete profile detected, forcing router intercept to /profile");
            setIsCheckingTrial(false);
            router.replace("/profile");
            return;
          }
        }

        // 1. Explicitly Expired or Inactive
        if (status === 'expired' || status === 'inactive') {
          setIsTrialExpired(true);
          setTrialDaysLeft(0);
          return;
        }

        // 2. Fully active cases
        if (status === 'active' || status === 'activated' || status === 'permanent') {
          setIsTrialExpired(false);
          if (status !== 'permanent' && sub?.ends_at) {
            const remainingDays = Math.ceil((new Date(sub.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            setTrialDaysLeft(remainingDays > 0 ? remainingDays : 0);
            if (remainingDays <= 0) setIsTrialExpired(true);
          } else {
            setTrialDaysLeft(null); // permanent or unspecified active
          }
          return;
        }

        // 3. Autopilot Trial Logic for 'trial' or 'none' / Fresh Users
        let endsAt = profile?.trial_ends_at;

        // Automatically initialize 14-days Free Trial for completely new users seamlessly
        if (!endsAt) {
           const newEndDate = new Date();
           newEndDate.setDate(newEndDate.getDate() + 14);
           endsAt = newEndDate.toISOString();
           
           console.log("Auto-granting 14 days trial for NEW user:", session.user.id);

           // Safely patch the profiles table
           const { error: profileErr } = await supabase.from('profiles').update({ trial_ends_at: endsAt }).eq('user_id', session.user.id);
           if (profileErr) console.error("Error setting trial in profile:", profileErr);
           
           // Ensure a matching 'subscriptions' record is dynamically bootstrapped
           if (status === 'none') {
             await supabase.from('subscriptions').insert({
               user_id: session.user.id,
               status: 'trial',
               ends_at: endsAt
             });
           } else {
             await supabase.from('subscriptions').update({ ends_at: endsAt, status: 'trial' }).eq('user_id', session.user.id);
           }
        }

        // Compute Trial Validation Window
        const remainingDays = Math.ceil((new Date(endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (remainingDays > 0) {
          setTrialDaysLeft(remainingDays);
          setIsTrialExpired(false);
        } else {
          setTrialDaysLeft(0);
          setIsTrialExpired(true); // Exact point of blocking the user!
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
