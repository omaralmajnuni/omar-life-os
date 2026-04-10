-- إنشاء جدول سجل عمليات الأدمن
-- نفّذ هذا الأمر في Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_type ON admin_logs (target_type);

-- تفعيل RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- السماح للأدمن فقط بالقراءة والكتابة
CREATE POLICY "Admin full access" ON admin_logs
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id::uuid FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id::uuid FROM profiles WHERE role = 'admin')
  );
