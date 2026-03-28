# نظام تحصيل عقاري ذكي — Collection System

## المشروع
تطبيق داخلي عربي RTL لإدارة أقساط العملاء والتحصيل والمتابعات لشركة تطوير عقاري (3 مشاريع: IL Parco, IL Centro, Caza).

## التقنيات
Next.js 15 (App Router) | TypeScript 5 strict | Tailwind CSS | shadcn/ui | Supabase (PostgreSQL) | TanStack Table | Recharts | react-hook-form | Zod | exceljs | date-fns

## القواعد الأساسية
- الواجهة بالعربية بالكامل، RTL افتراضي
- أسماء الكود بالإنجليزية، Labels بالعربي
- لا تستخدم `any` — TypeScript strict دائمًا
- لا تخترع business logic غير موثق
- عند التعارض: `Rep_REI006` > `Rep_REI011` للأقساط | `تم بيعها` > `متاحه` للوحدات
- مفتاح الوحدة = project + unit_code (ليس unit_code وحده)
- العقد قد يحتوي أكثر من وحدة (جدول contract_units)
- تنسيق المال: جنيه مصري (EGP) مع Intl.NumberFormat

## حالة القسط (مشتقة)
- `paid`: amount_outstanding <= 0
- `partial`: amount_collected > 0 AND amount_outstanding > 0
- `overdue`: amount_outstanding > 0 AND due_date < today
- `unpaid`: amount_collected == 0 AND due_date >= today
- delay_days = (unpaid && due_date < today) ? today - due_date : 0

## Arabic Labels
لوحة المتابعة | العملاء | العقود | الوحدات | المتابعات | الاستيراد | المستحق | المحصل | المتبقي | متأخر | غرامة | تاريخ وعد السداد

## ما لا يُبنى في V1
WhatsApp API | OCR | تسوية بنكية | محاسبة كاملة | RBAC معقد | Mobile native | AI تنبؤي

## المواصفات التفصيلية (تُقرأ عند الحاجة)
- `docs/specs/data-model.md` — الجداول والعلاقات الكاملة
- `docs/specs/business-rules.md` — قواعد العمل التفصيلية
- `docs/specs/screens-and-reports.md` — الشاشات والتقارير و KPIs
- `docs/specs/import-pipeline.md` — تفاصيل الاستيراد من Excel
- `docs/specs/data-sources.md` — مصادر البيانات وترتيب الأولوية

## Compaction Rules
عند ضغط المحادثة، احفظ دائمًا:
- قائمة الملفات المعدلة وأغراضها
- حالة الاختبارات الحالية
- أي قيود صلبة (مثل: لا تعدل ملفات migration موجودة)
- وصف المهمة الحالية ومعايير القبول
- الأخطاء التي تم تجربتها وفشلت (لتجنب التكرار)
