# إعداد واتساب Cloud API للنظام

هذا الدليل يجهز النظام للعمل مع Meta WhatsApp Cloud API لإرسال رسائل متابعة مباشرة وتذكيرات الأقساط قبل الاستحقاق بـ 7 أيام.

## 1) البيانات المطلوبة من Meta
أحضر القيم التالية:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_API_VERSION` (نستخدم حاليًا `v22.0`)
- `CRON_SECRET` (أنت تنشئه بنفسك)

## 2) إضافتها إلى Vercel
في Project Settings -> Environment Variables أضف:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_API_VERSION=v22.0`
- `CRON_SECRET`

## 3) إعداد Webhook
الرابط الجاهز في النظام:

- `https://YOUR_DOMAIN/api/whatsapp/webhook`

في Meta:
- ضع Callback URL بالقيمة السابقة
- ضع Verify Token = نفس قيمة `WHATSAPP_VERIFY_TOKEN`
- فعّل subscription على `messages`

## 4) تجهيز Template داخل Meta
أنشئ Template معتمد باسم:

- `installment_due_7d`

اللغة:
- `ar`

النوع:
- `Utility`

مثال body:

```text
مرحبًا {{1}}،
نذكرك بأن لديك قسطًا مستحقًا قريبًا في مشروع {{2}} بتاريخ {{3}} بقيمة {{4}}.
يرجى التواصل معنا عند الحاجة.
```

## 5) تسجيل الـ Template داخل قاعدة البيانات
بعد اعتماد الـ Template في Meta، أضف سجلًا في جدول `whatsapp_templates`.

مثال SQL:

```sql
insert into public.whatsapp_templates (
  project_id,
  template_name,
  language_code,
  category,
  approval_status,
  version,
  components_json,
  meta_template_id
)
values (
  null,
  'installment_due_7d',
  'ar',
  'utility',
  'approved',
  1,
  jsonb_build_object(
    'body', 'مرحبًا {{1}}، نذكرك بأن لديك قسطًا مستحقًا قريبًا في مشروع {{2}} بتاريخ {{3}} بقيمة {{4}}.'
  ),
  null
);
```

يمكنك لاحقًا إضافة Template آخر للمتابعة اليدوية، مثل:
- `manual_follow_up`

## 6) تجهيز أرقام العملاء
يفضل تعبئة:
- `customers.whatsapp_phone_normalized`

بصيغة دولية مثل:
- `2010XXXXXXXX`

ولو غير موجود، النظام سيحاول استخدام `customers.mobile`.

## 7) اختبار الإرسال اليدوي
من داخل ملف العميل:
- افتح صفحة العميل
- اضغط `إرسال واتساب مباشر`
- اختر المشروع/العقد
- اكتب اسم الـ Template
- مرر المتغيرات المطلوبة

## 8) التذكير التلقائي قبل الاستحقاق
الـ cron جاهز على:
- `/api/cron/installment-reminders`

ويعمل يوميًا من `vercel.json`.

شروط الإرسال الحالية:
- القسط مستحق بعد 7 أيام
- حالته `unpaid` أو `partial`
- عليه رصيد قائم
- العميل لم يعمل opt-out
- يوجد رقم هاتف صالح
- لا يوجد سجل مرسل مكرر لنفس التذكير

## 9) نقاط مهمة
- لا تضع أي secrets داخل الكود أو `vercel.json`
- لو أردت تشغيل cron يدويًا خارج Vercel استخدم `CRON_SECRET`
- الردود الواردة من العملاء يتم حفظ webhook event لها، لكن mapping الكامل للردود بالعميل ما زال خطوة تالية

## 10) ما الذي سنحتاجه منك لاحقًا
عندما تجهز البيانات، أرسل لي:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- اسم/أسماء الـ templates المعتمدة
- رقم واتساب الاختباري أو أرقام المستلمين المسموح بها

بعدها أستطيع أن أكمل لك:
- اختبار webhook verification
- اختبار manual send
- اختبار reminder cron فعليًا
- ربط الرسائل بمتابعات النظام لو أردت
