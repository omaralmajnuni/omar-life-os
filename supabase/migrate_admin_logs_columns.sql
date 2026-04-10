-- إضافة الأعمدة الناقصة إلى جدول admin_logs (إن لم تكن موجودة)
-- نفّذ هذا الأمر في Supabase SQL Editor

ALTER TABLE admin_logs
  ADD COLUMN IF NOT EXISTS target_user_id   TEXT,
  ADD COLUMN IF NOT EXISTS target_user_name TEXT,
  ADD COLUMN IF NOT EXISTS target_user_phone TEXT;

-- إنشاء index للبحث السريع حسب العملية
CREATE INDEX IF NOT EXISTS idx_admin_logs_action      ON admin_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user ON admin_logs (target_user_id);

-- تحقق من الأعمدة الموجودة
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_logs'
ORDER BY ordinal_position;
