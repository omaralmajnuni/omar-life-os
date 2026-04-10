-- إضافة عمود role إلى جدول profiles
-- نفّذ هذا الأمر في Supabase SQL Editor

-- 1. إضافة العمود
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. تعيين الأدمن (استبدل الـ user_id بمعرفك الحقيقي)
-- الطريقة 1: إذا تعرف user_id مباشرة:
-- UPDATE profiles SET role = 'admin' WHERE user_id = 'YOUR_USER_ID_HERE';

-- الطريقة 2: عن طريق الإيميل (من جدول auth.users):
UPDATE profiles SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'omar-14151@outlook.sa' LIMIT 1
);

-- 3. التحقق
SELECT user_id, role FROM profiles WHERE role = 'admin';
