import { supabase } from './supabase';

interface LogPayload {
  action: string;
  targetType: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserPhone?: string;
  details?: string;
}

export async function logAdminAction(payload: LogPayload): Promise<void>;
/** @deprecated Use object form instead */
export async function logAdminAction(
  action: string,
  targetType: string,
  targetId?: string,
  details?: string
): Promise<void>;

export async function logAdminAction(
  payloadOrAction: string | LogPayload,
  targetType?: string,
  targetId?: string,
  details?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let record: Record<string, any>;

    if (typeof payloadOrAction === 'object') {
      // شكل الكائن الجديد (الموصى به)
      const p = payloadOrAction;
      record = {
        admin_id: user.id,
        action: p.action,
        target_type: p.targetType,
        target_user_id: p.targetUserId ?? null,
        target_user_name: p.targetUserName ?? null,
        target_user_phone: p.targetUserPhone ?? null,
        details: p.details ?? null,
      };
    } else {
      // شكل الأوتار القديم (للتوافق الخلفي)
      record = {
        admin_id: user.id,
        action: payloadOrAction,
        target_type: targetType ?? '',
        target_id: targetId ?? null,
        details: details ?? null,
      };
    }

    await supabase.from('admin_logs').insert(record);
  } catch (e) {
    console.error('Failed to log admin action:', e);
  }
}
