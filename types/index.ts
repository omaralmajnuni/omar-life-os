export interface Profile {
  id: number;
  user_id: string;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  role?: 'admin' | 'user' | null;
  subscription_status?: 'active' | 'trial' | 'expired' | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  created_at?: string | null;
  real_subscription?: any | null;
}

export interface SubscriptionRequest {
  id: number;
  user_id: string;
  name: string;
  phone: string;
  status: 'pending' | 'contacted' | 'activated';
  created_at: string;
}

export interface Goal {
  id: number | string;
  user_id?: string;
  user_phone?: string;
  title?: string;
  target_value?: number;
  current_value?: number;
  period?: string;
  status?: string;
  created_at?: string;
}

export interface Task {
  id: number | string;
  user_id?: string;
  user_phone?: string;
  title?: string;
  completed?: boolean;
  date?: string;
  created_at?: string;
}

export interface Habit {
  id: number | string;
  user_id?: string;
  user_phone?: string;
  title?: string;
  name?: string;
  frequency?: string;
  status?: string;
  created_at?: string;
}

export interface AdminLog {
  id: number | string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  target_user_id?: string | null;
  target_user_name?: string | null;
  target_user_phone?: string | null;
  details?: string | any;
  created_at: string;
}

export interface UserDB {
  id?: number | string;
  user_id?: string | null;
  phone?: string | null;
  user_phone?: string | null;
  name?: string | null;
  created_at?: string | null;
  status?: string | null;
  role?: string | null;
}

export interface ExtendedUserDB extends UserDB {
  goalsCount: number;
  tasksCount: number;
  habitsCount: number;
  realSubscriptionStatus?: string;
}

