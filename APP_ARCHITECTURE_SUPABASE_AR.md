# APP_ARCHITECTURE_SUPABASE_AR.md
## المعمارية المقترحة للتطبيق باستخدام Claude Code + Supabase

هذا الملف يحدد **القرار التقني النهائي** لبناء تطبيق التحصيل العقاري الداخلي باحترافية، مع دعم:
- رفع ملفات Excel من السيستم المحاسبي
- مطابقة البيانات الجديدة مع الحالية
- إضافة السجلات الجديدة
- تحديث السجلات القديمة
- الحفاظ على ملاحظات التحصيل والمتابعات
- تجهيز قاعدة قوية للتقارير ولوحة الإدارة

---

# 1) القرار النهائي

## نبدأ بـ **Application-first**
وليس Power BI فقط.

### لماذا؟
لأن المطلوب ليس تقارير فقط، بل **تشغيل يومي** يشمل:
- رفع ملف Excel جديد
- تشغيل import pipeline
- مطابقة وتحديث البيانات (upsert)
- إدخال ملاحظات متابعة
- إدارة وعود السداد
- حفظ سجل الاستيراد والأخطاء
- عرض تقارير تشغيلية وإدارية

---

# 2) الـ Stack المقترح

## 2.1 الواجهة والتطبيق
- **Next.js App Router**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

## 2.2 قاعدة البيانات والبنية الخلفية
- **Supabase Postgres**
- **Supabase Auth**
- **Supabase Storage** لملفات Excel المرفوعة
- **Row Level Security (RLS)** على الجداول التي تُقرأ من الواجهة

## 2.3 طبقة منطق التطبيق
- **Route Handlers** للـ import والعمليات الثقيلة
- **Server Actions** للنماذج والعمليات المباشرة الخفيفة
- **Zod** للتحقق من البيانات
- **Drizzle ORM** أو **SQL + Supabase client**
  - يفضل: SQL migrations + queries واضحة
  - أو Drizzle إذا أردت type-safety أعلى

## 2.4 قراءة ملفات Excel
- مكتبة قراءة Excel مثل:
  - `xlsx`
  - أو `exceljs`

## 2.5 التقارير داخل التطبيق
- جداول + بطاقات KPI + رسوم بسيطة داخل التطبيق
- Power BI لاحقًا فوق نفس قاعدة البيانات إذا لزم

---

# 3) لماذا هذا الاختيار مناسب؟

## Next.js App Router
- مناسب جدًا لتطبيقات الويب الحديثة
- يدعم Route Handlers لبناء API endpoints داخل `app/`
- ويدعم Server Actions للنماذج والمعالجات على السيرفر

## Supabase
- Postgres حقيقي
- Auth مدمج
- Storage مدمج
- RLS قوي جدًا
- مناسب جدًا للتطبيقات الداخلية والمتعددة المستخدمين

## Claude Code
- ممتاز في بناء كود متعدد الملفات داخل مشروع واضح البنية
- أفضل أداء له يكون عندما نزوّده بملفات مرجعية واضحة مثل:
  - `CLAUDE.md`
  - `DATA_DICTIONARY_AR.md`
  - `IMPORT_RULES_AR.md`
  - `REPORT_SPECS_AR.md`
  - `APP_ARCHITECTURE_SUPABASE_AR.md`

---

# 4) الشكل المعماري العام

## طبقات التطبيق

### 4.1 Presentation Layer
الواجهة:
- Dashboard
- صفحة العملاء
- صفحة العقود
- صفحة الأقساط
- صفحة المتابعات
- صفحة رفع الملفات
- صفحة نتائج الاستيراد
- صفحة المشاكل/الأخطاء

### 4.2 Application Layer
منطق الأعمال:
- import orchestration
- parsing
- normalization
- validation
- matching
- upsert
- follow-up logic
- KPI calculation

### 4.3 Data Layer
قاعدة البيانات:
- جداول مرجعية
- جداول تشغيلية
- جداول audit/import logs
- views للتقارير

---

# 5) الموديولات الأساسية داخل التطبيق

## 5.1 Module: Authentication
- تسجيل دخول المستخدمين الداخليين
- أدوار مثل:
  - Admin
  - Collector
  - Manager
  - ReadOnly

## 5.2 Module: Import Center
- رفع ملفات Excel
- preview قبل الاستيراد
- تشغيل parser
- إظهار نتائج المطابقة
- اعتماد الاستيراد
- عرض import logs و import issues

## 5.3 Module: Customers & Contracts
- ملف العميل
- العقود المرتبطة
- الوحدات المرتبطة
- الأقساط
- الملاحظات
- الوعد بالسداد

## 5.4 Module: Installments & Collections
- قائمة الأقساط
- المستحق
- المحصل
- المتبقي
- المتأخر
- الغرامة
- الفلاتر حسب المشروع والفترة والحالة

## 5.5 Module: Follow-ups
- إدخال ملاحظات التحصيل
- تتبع آخر تواصل
- وعود السداد
- المتابعة القادمة
- من الذي يجب متابعته اليوم

## 5.6 Module: Reports & Dashboard
- KPIs
- العملاء المتأخرون
- العملاء الأعلى مديونية
- المتابعة اليومية
- موقف المشاريع
- المباعة مقابل المتاحة

---

# 6) بنية قاعدة البيانات المقترحة في Supabase

## جداول مرجعية
- `projects`
- `units`
- `customers`
- `date_dim`

## جداول تشغيلية
- `contracts`
- `contract_units`
- `installments`
- `followups`

## جداول الاستيراد والمراجعة
- `import_batches`
- `import_files`
- `import_issues`

## جداول المستخدمين والأدوار
- `profiles`
- `user_roles`

## اختياري لاحقًا
- `collection_receipts`
- `penalty_rules`
- `audit_logs`

---

# 7) الجداول المهمة جدًا في المرحلة الأولى

## 7.1 import_batches
يسجل كل عملية استيراد

### أعمدة مقترحة
- `id`
- `batch_type`
- `status`
- `started_at`
- `finished_at`
- `created_by`
- `summary_json`

## 7.2 import_files
يسجل الملف المرفوع داخل كل دفعة

### أعمدة مقترحة
- `id`
- `batch_id`
- `file_name`
- `storage_path`
- `source_type`
- `row_count_raw`
- `row_count_valid`
- `row_count_rejected`

## 7.3 import_issues
يسجل المشاكل المكتشفة

### أعمدة مقترحة
- `id`
- `batch_id`
- `source_file_id`
- `severity`
- `issue_type`
- `raw_value`
- `message`
- `source_row_number`
- `resolved`

---

# 8) منطق الـ Upsert المطلوب

## 8.1 قاعدة أساسية
لا تعمل Replace كامل للبيانات.

بل نفّذ:
- **Insert** للجديد
- **Update** للموجود
- **Preserve** للبيانات الداخلية

## 8.2 ما الذي يُحدَّث من ملف Excel؟
- العملاء الجدد
- العقود الجديدة
- الوحدات الجديدة
- الأقساط الجديدة
- المحصل
- المتبقي
- حالة القسط
- حالة الوحدة

## 8.3 ما الذي لا يجب أن يمسحه الاستيراد؟
- ملاحظات المتابعة
- وعود السداد
- اسم مسؤول التحصيل
- التصنيفات اليدوية
- أي بيانات تشغيلية داخلية كتبها المستخدمون

## 8.4 المفاتيح المعتمدة
- Installment = `كود القسط`
- Unit = `المشروع + كود الوحدة`
- Contract = مفتاح مشتق أو كود موثوق
- Customer = مفتاح مؤقت من الاسم حتى يتوفر كود عميل

---

# 9) أفضل ممارسة للـ Import Pipeline

## المراحل
1. Upload
2. Parse
3. Staging
4. Normalize
5. Validate
6. Match
7. Upsert
8. Log
9. Report

## قاعدة مهمة
كل مرحلة يجب أن تكون:
- منفصلة
- قابلة للاختبار
- قابلة لإعادة التشغيل
- لا تعتمد على side effects غير واضحة

---

# 10) أفضل ممارسات Supabase في هذا المشروع

## 10.1 فعّل RLS
أي جدول موجود في schema مكشوفة للواجهة يجب تفعيل RLS عليه.

## 10.2 لا تستخدم service role في الواجهة
- service role يكون للسيرفر فقط
- لا يُكشف أبدًا للمتصفح

## 10.3 استخدم migrations
- لا تعتمد فقط على Dashboard changes
- كل تعديل schema يكون عبر migration versioned

## 10.4 استخدم بيئات منفصلة
- local
- staging
- production

## 10.5 اجعل import العمليات الثقيلة على السيرفر
- لا تنفذ parsing ضخم في الـ client
- ارفع الملف ثم شغّل المعالجة من Route Handler أو job server-side

## 10.6 أضف indexes مدروسة
خصوصًا على:
- `installment_key`
- `contract_key`
- `customer_key`
- `project_key`
- أعمدة مستخدمة في RLS
- أعمدة البحث والفلاتر

---

# 11) أفضل ممارسات الأمان

## 11.1 Auth
- كل مستخدم له حساب داخلي
- ربط الحساب بملف `profiles`

## 11.2 Roles
أدوار واضحة:
- `admin`
- `manager`
- `collector`
- `viewer`

## 11.3 RLS policies
سياسات مثل:
- الـ collector يرى فقط العملاء/المتابعات الخاصة به
- الـ manager يرى بيانات مشروعه أو كل المشاريع حسب الدور
- الـ admin يرى الكل

## 11.4 Auditability
يجب تسجيل:
- من رفع الملف
- متى رفعه
- من اعتمد الاستيراد
- من عدّل الملاحظات
- من غيّر حالة السجل

---

# 12) أفضل ممارسات الأداء

## 12.1 لا تعتمد على joins ضخمة في كل صفحة
- استخدم views أو materialized views عند الحاجة
- أو server-side composed queries

## 12.2 Pagination
- صفحات العملاء
- الأقساط
- المتابعات
يجب أن تدعم pagination من البداية

## 12.3 Search
- بحث بالعميل
- بالعقد
- بالوحدة
- بالمشروع
- بالحالة

## 12.4 Async import
- الاستيراد يجب أن يكون غير متزامن
- يعرض progress/status
- لا يعلّق الواجهة

---

# 13) أفضل ممارسات UX داخل التطبيق

## 13.1 لا تجعل رفع الملف خطوة غامضة
اعرض:
- نوع الملف
- الأعمدة المكتشفة
- عدد الصفوف
- preview
- الأخطاء قبل الاعتماد

## 13.2 بعد الاستيراد اعرض ملخصًا واضحًا
مثل:
- 14 عميل جديد
- 93 قسط جديد
- 420 قسط تم تحديثه
- 7 مشاكل تحتاج مراجعة

## 13.3 ملف العميل يجب أن يكون قويًا جدًا
يحتوي على:
- الاسم
- المشروع
- الوحدات
- العقود
- الأقساط
- المتأخر
- الغرامة
- آخر متابعة
- وعد السداد
- سجل المتابعات

---

# 14) أفضل structure للمشروع

```text
src/
  app/
    (auth)/
    dashboard/
    customers/
    contracts/
    installments/
    followups/
    imports/
    reports/
    api/
      imports/
      customers/
      installments/
  components/
    ui/
    dashboard/
    customers/
    imports/
    reports/
  features/
    auth/
    imports/
    customers/
    contracts/
    installments/
    followups/
    reports/
  lib/
    supabase/
    db/
    excel/
    validators/
    utils/
  server/
    imports/
      parsers/
      transformers/
      validators/
      upsert/
      jobs/
    queries/
    services/
  types/
```

---

# 15) كيف نوجّه Claude Code ليبني التطبيق صح؟

## يجب أن نبقي التعليمات موزعة هكذا:
- `CLAUDE.md` → الرؤية العامة والتعليمات العليا
- `DATA_DICTIONARY_AR.md` → بنية البيانات
- `IMPORT_RULES_AR.md` → قواعد ETL
- `APP_ARCHITECTURE_SUPABASE_AR.md` → المعمارية التقنية
- `REPORT_SPECS_AR.md` → الشاشات والتقارير

## تعليمات مهمة لـ Claude
- ابنِ المشروع modular
- لا تضع import logic في component
- لا تجعل SQL متناثرًا بلا تنظيم
- لا تخلط بين domain logic وUI
- اجعل الملفات قصيرة وواضحة
- استخدم types مشتركة
- اكتب validations واضحة
- اكتب seed/dev helpers عند الحاجة
- اكتب migrations منظمة

---

# 16) الترتيب الصحيح للتنفيذ

## Phase 1 — Foundation
- إعداد Next.js + Supabase
- Auth + profiles + roles
- migrations الأساسية
- layout + design system
- رفع الملفات إلى storage
- import_batches/import_files/import_issues

## Phase 2 — Data Model & Import
- projects
- units
- customers
- contracts
- contract_units
- installments
- parser + normalize + validate + upsert

## Phase 3 — Core Screens
- Dashboard
- Imports
- Customers
- Installments
- Follow-ups

## Phase 4 — Business Features
- follow-up notes
- promise to pay
- overdue buckets
- penalty rules
- manager reports

## Phase 5 — Enhancements
- Power BI integration
- notifications
- AI summaries
- WhatsApp or email templates

---

# 17) ما الذي أنصح به في المرحلة الأولى تحديدًا؟

## نعم لـ:
- تطبيق ويب داخلي
- Supabase
- رفع Excel
- upsert
- متابعة العملاء
- Dashboard
- Import log

## لا تبدأ الآن بـ:
- Realtime معقد
- AI agent داخل التطبيق
- WhatsApp integration
- OCR
- Power BI integration
- Multi-tenant architecture معقدة
- microservices

---

# 18) القرارات التنفيذية الموصى بها

## أوصي بهذا القرار النهائي:
- **Frontend + Backend App:** Next.js App Router
- **Database/Auth/Storage:** Supabase
- **Import Engine:** داخل السيرفر في نفس المشروع كبداية
- **Schema Management:** SQL migrations
- **Security:** RLS + roles + server-only secrets
- **Reporting:** داخل التطبيق أولًا
- **Claude Guidance:** مجموعة markdown files واضحة

---

# 19) ملاحظات مهمة جدًا

1. التطبيق هو الأساس، وليس Power BI.
2. Supabase مناسب جدًا، لكن لا بد من design منضبط.
3. RLS ليست اختيارية على الجداول المكشوفة.
4. الاستيراد يجب أن يكون robust ومقسّم المراحل.
5. المتابعات يجب أن تُخزن داخليًا منفصلة عن Excel.
6. لا تعتمد على اسم الوحدة أو اسم العميل وحدهما كمفاتيح نهائية إن توفر بديل أقوى.
7. يجب الاحتفاظ بسجل واضح لكل عملية import.

---

# 20) الخلاصة التنفيذية
**الاختيار الصحيح لك الآن:**
بناء **تطبيق تحصيل داخلي احترافي** باستخدام:
- Next.js
- Supabase
- Import pipeline قوي
- Dashboard داخلي
- Follow-up system

ثم لاحقًا يمكن ربط نفس قاعدة البيانات بـ Power BI للإدارة.

هذا يحقق:
- سرعة تشغيل
- مرونة
- أمان
- قابلية للتوسع
- توافق ممتاز مع طريقة عمل Claude Code
