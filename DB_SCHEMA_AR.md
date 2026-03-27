# DB_SCHEMA_AR.md
## تصميم قاعدة البيانات المقترح في Supabase لتطبيق التحصيل العقاري

**هذا الملف مكمل لـ:**
- `CLAUDE.md`
- `DATA_DICTIONARY_AR.md`
- `IMPORT_RULES_AR.md`
- `APP_ARCHITECTURE_SUPABASE_AR.md`
- `REPORT_SPECS_AR.md`

**الغرض من هذا الملف:**  
تحديد تصميم قاعدة البيانات في Supabase بشكل واضح وقابل للتنفيذ، ويشمل:
- أسماء الجداول
- الأعمدة الأساسية
- المفاتيح
- العلاقات
- الفهارس `indexes`
- القيود `constraints`
- الأعمدة المشتقة أو المحسوبة
- جداول الاستيراد
- توصيات RLS
- ترتيب إنشاء الـ migrations

> ملاحظة: الأسماء الظاهرة للمستخدم داخل التطبيق ستكون بالعربية، لكن أسماء الجداول والأعمدة داخل قاعدة البيانات يفضل أن تكون بالإنجليزية لسهولة التطوير والصيانة.

---

# 1) المبادئ العامة لتصميم الـ Schema

## 1.1 قواعد عامة
- استخدم أسماء جداول واضحة ومباشرة
- استخدم `uuid` كمفتاح أساسي داخلي لمعظم الجداول
- احتفظ أيضًا بالمفاتيح التجارية `business keys` مثل:
  - `installment_code`
  - `project_code`
  - `unit_code`
- أضف `created_at` و `updated_at` لمعظم الجداول التشغيلية
- استخدم `not null` فقط عندما يكون الحقل إلزاميًا فعلًا
- لا تعتمد على القيم النصية كمفاتيح أساسية
- لا تُخزن البيانات الخام من Excel مباشرة في الجداول النهائية دون تنظيف

## 1.2 Naming Conventions
- الجداول: `snake_case` جمع أو مفرد متسق
- الأعمدة: `snake_case`
- المفاتيح الخارجية: `<entity>_id`
- المفاتيح التجارية: `<entity>_code` أو `<entity>_key`
- جداول الربط: `<entity1>_<entity2>`

## 1.3 Schemas المقترحة
### `public`
للجداول التي يحتاجها التطبيق

### `storage`
لملفات Excel المرفوعة

### اختياري لاحقًا: `internal`
لو أردت عزل بعض الجداول الداخلية جدًا أو الوظائف المساعدة

---

# 2) الجداول المرجعية الأساسية

## 2.1 جدول `projects`
يمثل المشاريع العقارية

### الأعمدة
- `id uuid primary key`
- `project_code text unique not null`
- `name_ar text not null`
- `name_en text null`
- `is_active boolean default true not null`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### ملاحظات
- `project_code` يمكن أن يكون:
  - `IL_PARCO`
  - `IL_CENTRO`
  - `CAZA`

### قيود
- `unique(project_code)`

### فهارس
- index على `is_active`

---

## 2.2 جدول `units`
يمثل جميع الوحدات سواء مباعة أو متاحة

### الأعمدة
- `id uuid primary key`
- `project_id uuid not null references projects(id)`
- `unit_key text unique not null`
- `unit_code text not null`
- `floor_name text null`
- `area_internal numeric(12,2) null`
- `area_external numeric(12,2) null`
- `list_price numeric(18,2) null`
- `contract_price numeric(18,2) null`
- `unit_status text not null`
- `is_sold boolean not null default false`
- `source_sold boolean not null default false`
- `source_available boolean not null default false`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### معنى الحقول
- `unit_key` = مفتاح موحد مثل `IL Centro::B21`
- `unit_code` = الكود البشري مثل `B21`
- `unit_status` = `sold` أو `available`

### قيود
- `unique(unit_key)`
- `check(unit_status in ('sold','available'))`

### فهارس
- index على `project_id`
- index على `unit_status`
- index مركب على `(project_id, unit_code)`

---

## 2.3 جدول `customers`
يمثل العملاء

### الأعمدة
- `id uuid primary key`
- `customer_key text unique not null`
- `customer_name text not null`
- `customer_name_raw text null`
- `phone text null`
- `email text null`
- `national_id text null`
- `notes text null`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### ملاحظات
- `customer_key` يكون مؤقتًا مشتقًا من الاسم إلى أن يتوفر customer code رسمي
- لاحقًا يمكن إضافة:
  - `erp_customer_code text unique null`

### فهارس
- unique على `customer_key`
- index على `customer_name`
- اختياري: trigram index للبحث النصي لاحقًا

---

# 3) الجداول التشغيلية الأساسية

## 3.1 جدول `contracts`
يمثل العقد ككيان مستقل

### الأعمدة
- `id uuid primary key`
- `contract_key text unique not null`
- `project_id uuid not null references projects(id)`
- `customer_id uuid not null references customers(id)`
- `contract_code text null`
- `contract_notes text null`
- `delivery_date date null`
- `actual_date date null`
- `collector_user_id uuid null`
- `contract_status text not null default 'active'`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### معاني الحقول
- `contract_key` = المفتاح التشغيلي الداخلي الذي يولد من المشروع + العميل + مجموعة الوحدات أو الكود الموثوق
- `collector_user_id` = مسؤول التحصيل الحالي

### قيود
- `unique(contract_key)`
- `check(contract_status in ('active','closed','cancelled','suspended'))`

### فهارس
- index على `project_id`
- index على `customer_id`
- index على `collector_user_id`
- index على `contract_status`

---

## 3.2 جدول `contract_units`
جدول ربط بين العقد والوحدة

### الأعمدة
- `id uuid primary key`
- `contract_id uuid not null references contracts(id) on delete cascade`
- `unit_id uuid not null references units(id)`
- `unit_order integer null`
- `created_at timestamptz default now() not null`

### قيود
- `unique(contract_id, unit_id)`

### فهارس
- index على `contract_id`
- index على `unit_id`

### ملاحظة مهمة
هذا الجدول **إجباري** لأن بعض العقود تحتوي أكثر من وحدة.

---

## 3.3 جدول `installments`
يمثل الأقساط والاستحقاقات

### الأعمدة
- `id uuid primary key`
- `installment_code text unique not null`
- `contract_id uuid not null references contracts(id)`
- `installment_type text not null`
- `installment_date date not null`
- `installment_amount numeric(18,2) not null`
- `net_amount numeric(18,2) null`
- `collected_amount numeric(18,2) null default 0`
- `remaining_amount numeric(18,2) null`
- `commercial_paper text null`
- `installment_status text not null`
- `delay_days integer not null default 0`
- `delay_bucket text not null default 'not_due'`
- `penalty_amount numeric(18,2) not null default 0`
- `is_due_now boolean not null default false`
- `is_overdue boolean not null default false`
- `source_batch_id uuid null`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### قيم منطقية
#### `installment_status`
- `collected`
- `partial`
- `uncollected`
- `future_due`

#### `delay_bucket`
- `not_due`
- `1_30`
- `31_60`
- `61_90`
- `90_plus`

### قيود
- `unique(installment_code)`
- `check(installment_status in ('collected','partial','uncollected','future_due'))`
- `check(delay_bucket in ('not_due','1_30','31_60','61_90','90_plus'))`

### فهارس
- index على `contract_id`
- index على `installment_date`
- index على `installment_status`
- index على `delay_bucket`
- index على `is_overdue`
- index على `source_batch_id`
- index مركب على `(contract_id, installment_date)`
- index مركب على `(installment_status, delay_bucket)`

### ملاحظات
- `remaining_amount` يمكن استيرادها مباشرة من الملف أو اشتقاقها عند غيابها
- `penalty_amount` إما محسوبة أو مستوردة لاحقًا

---

## 3.4 جدول `followups`
يمثل ملاحظات التحصيل والمتابعة اليومية

### الأعمدة
- `id uuid primary key`
- `contract_id uuid not null references contracts(id) on delete cascade`
- `customer_id uuid not null references customers(id)`
- `followup_date timestamptz not null`
- `contact_type text not null`
- `note_text text not null`
- `promise_to_pay boolean not null default false`
- `promise_date date null`
- `next_action text null`
- `next_followup_date date null`
- `status text not null default 'open'`
- `created_by uuid not null`
- `assigned_to uuid null`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### قيم `contact_type`
- `call`
- `whatsapp`
- `visit`
- `email`
- `other`

### قيم `status`
- `open`
- `done`
- `cancelled`

### قيود
- `check(contact_type in ('call','whatsapp','visit','email','other'))`
- `check(status in ('open','done','cancelled'))`

### فهارس
- index على `contract_id`
- index على `customer_id`
- index على `followup_date`
- index على `promise_to_pay`
- index على `promise_date`
- index على `assigned_to`
- index على `created_by`
- index على `status`

---

# 4) جداول الاستيراد والتدقيق

## 4.1 جدول `import_batches`
يسجل كل عملية استيراد

### الأعمدة
- `id uuid primary key`
- `batch_type text not null`
- `status text not null`
- `started_at timestamptz default now() not null`
- `finished_at timestamptz null`
- `created_by uuid not null`
- `summary_json jsonb null`
- `notes text null`
- `created_at timestamptz default now() not null`

### قيم `batch_type`
- `installments`
- `units_sold`
- `units_available`
- `contracts_detail`
- `mixed`

### قيم `status`
- `uploaded`
- `processing`
- `ready_for_review`
- `approved`
- `failed`
- `approved_with_issues`

### قيود
- check على القيم السابقة

### فهارس
- index على `created_by`
- index على `status`
- index على `batch_type`
- index على `started_at desc`

---

## 4.2 جدول `import_files`
يمثل الملفات داخل كل دفعة

### الأعمدة
- `id uuid primary key`
- `batch_id uuid not null references import_batches(id) on delete cascade`
- `file_name text not null`
- `storage_path text not null`
- `source_type text not null`
- `sheet_name text null`
- `raw_rows_count integer null`
- `valid_rows_count integer null`
- `rejected_rows_count integer null`
- `created_at timestamptz default now() not null`

### قيم `source_type`
- `installments_report`
- `units_sold_report`
- `units_available_report`
- `contracts_detail_report`

### فهارس
- index على `batch_id`
- index على `source_type`

---

## 4.3 جدول `import_issues`
يسجل مشاكل البيانات المكتشفة

### الأعمدة
- `id uuid primary key`
- `batch_id uuid not null references import_batches(id) on delete cascade`
- `import_file_id uuid null references import_files(id) on delete set null`
- `severity text not null`
- `issue_type text not null`
- `raw_value text null`
- `message text not null`
- `source_row_number integer null`
- `payload jsonb null`
- `resolved boolean not null default false`
- `resolved_by uuid null`
- `resolved_at timestamptz null`
- `created_at timestamptz default now() not null`

### قيم `severity`
- `high`
- `medium`
- `low`

### فهارس
- index على `batch_id`
- index على `import_file_id`
- index على `severity`
- index على `resolved`
- index على `issue_type`

---

# 5) جداول المستخدمين والصلاحيات

## 5.1 جدول `profiles`
يمثل بروفايل المستخدم الداخلي ويرتبط بـ auth.users

### الأعمدة
- `id uuid primary key references auth.users(id) on delete cascade`
- `full_name text not null`
- `email text null`
- `is_active boolean not null default true`
- `default_project_id uuid null references projects(id)`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### فهارس
- index على `default_project_id`
- index على `is_active`

---

## 5.2 جدول `user_roles`
يمثل دور المستخدم

### الأعمدة
- `id uuid primary key`
- `user_id uuid not null references profiles(id) on delete cascade`
- `role text not null`
- `project_id uuid null references projects(id)`
- `created_at timestamptz default now() not null`

### قيم `role`
- `admin`
- `manager`
- `collector`
- `viewer`

### قيود
- unique على `(user_id, role, project_id)`
- check للقيم

### فهارس
- index على `user_id`
- index على `role`
- index على `project_id`

---

# 6) جداول اختيارية لكن مفيدة مبكرًا

## 6.1 جدول `penalty_rules`
لو قررت حساب الغرامات داخل النظام

### الأعمدة
- `id uuid primary key`
- `project_id uuid null references projects(id)`
- `rule_name text not null`
- `rule_type text not null`
- `rate_value numeric(18,6) null`
- `fixed_value numeric(18,2) null`
- `grace_days integer not null default 0`
- `is_active boolean not null default true`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

### قيم `rule_type`
- `percentage_daily`
- `percentage_monthly`
- `fixed_once`
- `custom_formula`

---

## 6.2 جدول `audit_logs`
للتدقيق والرجوع للعمليات المهمة

### الأعمدة
- `id uuid primary key`
- `actor_user_id uuid null`
- `entity_type text not null`
- `entity_id uuid null`
- `action_type text not null`
- `old_data jsonb null`
- `new_data jsonb null`
- `created_at timestamptz default now() not null`

### فهارس
- index على `actor_user_id`
- index على `entity_type`
- index على `entity_id`
- index على `created_at desc`

---

# 7) العلاقات الأساسية النهائية

## One-to-Many
- `projects -> units`
- `projects -> contracts`
- `customers -> contracts`
- `contracts -> installments`
- `contracts -> followups`
- `import_batches -> import_files`
- `import_batches -> import_issues`

## Many-to-Many
- `contracts <-> units` عبر `contract_units`

## User Assignments
- `profiles -> user_roles`
- `profiles -> contracts` عبر `collector_user_id`
- `profiles -> followups` عبر `created_by` و `assigned_to`

---

# 8) الـ Views المقترحة للتقارير

## 8.1 `vw_customer_financial_summary`
يلخص لكل عميل:
- عدد العقود
- عدد الوحدات
- إجمالي الأقساط
- إجمالي المحصل
- إجمالي المتبقي
- إجمالي الغرامات
- عدد الأقساط المتأخرة

## 8.2 `vw_contract_financial_summary`
يلخص لكل عقد:
- إجمالي الأقساط
- إجمالي المحصل
- إجمالي المتبقي
- عدد الوحدات
- عدد الأقساط المتأخرة
- آخر متابعة

## 8.3 `vw_followup_latest_per_contract`
يعطي آخر متابعة لكل عقد

## 8.4 `vw_dashboard_project_metrics`
يعطي لكل مشروع:
- عدد الوحدات المباعة
- عدد الوحدات المتاحة
- إجمالي المحصل
- إجمالي المتبقي
- عدد العملاء المتأخرين

> ملاحظة: ابدأ بـ views عادية. استخدم materialized views لاحقًا فقط إذا ظهرت مشكلة أداء حقيقية.

---

# 9) الأعمدة المحسوبة أو المحدثة دوريًا

## داخل `installments`
- `installment_status`
- `delay_days`
- `delay_bucket`
- `is_due_now`
- `is_overdue`

## داخل `units`
- `is_sold`
- `unit_status`

## داخل `contracts`
- `collector_user_id` يمكن تحديثه يدويًا

### كيف تُحدَّث؟
- أثناء الـ import
- أو عبر job دورية
- أو عبر trigger محدود وبسيط عند الحاجة

> يفضل عدم المبالغة في triggers في البداية. اجعل الحسابات الأساسية في طبقة التطبيق أو import pipeline أو views الواضحة.

---

# 10) الفهارس المهمة جدًا (High Priority)

## على المفاتيح التجارية
- `projects(project_code)`
- `units(unit_key)`
- `customers(customer_key)`
- `contracts(contract_key)`
- `installments(installment_code)`

## على الفهارس التشغيلية
- `installments(contract_id)`
- `installments(installment_date)`
- `installments(installment_status)`
- `installments(delay_bucket)`
- `followups(contract_id)`
- `followups(promise_date)`
- `contracts(customer_id)`
- `contracts(project_id)`

## على أعمدة RLS أو التصفية حسب المستخدم
- `contracts(collector_user_id)`
- `followups(assigned_to)`
- `followups(created_by)`
- `user_roles(user_id, role)`

---

# 11) RLS المقترحة بشكل أولي

> هذه سياسات أولية. يتم تنفيذها بدقة في migrations منفصلة بعد اكتمال الجداول الأساسية.

## 11.1 قاعدة عامة
- فعّل RLS على جميع الجداول الموجودة في `public` التي قد تُقرأ من الواجهة
- لا تستخدم `service_role` في الـ client نهائيًا
- استخدم مفاتيح server-side فقط في Route Handlers والعمليات الخلفية

## 11.2 جداول يسمح فيها بالقراءة الواسعة للمستخدمين المصرح لهم
- `projects`
- `units`
- `customers`
- `contracts`
- `installments`
- `followups`
- `import_batches`
- `import_files`
- `import_issues`

## 11.3 منطق الصلاحيات الأولي
### admin
- قراءة/كتابة كل شيء

### manager
- قراءة كل شيء
- كتابة على المتابعات والاستيراد
- قراءة/كتابة حسب المشروع إن أردت التقييد لاحقًا

### collector
- يرى فقط:
  - العقود المخصصة له
  - العملاء المرتبطين بها
  - الأقساط المرتبطة بهذه العقود
  - المتابعات التي أنشأها أو المخصصة له
- يكتب:
  - followups فقط
  - لا يوافق على import

### viewer
- قراءة فقط
- بدون تعديل
- يمكن تقييده بمشروع واحد

## 11.4 تنفيذ RLS بشكل عملي
يُفضل أن تعتمد السياسات على:
- `auth.uid()`
- جدول `user_roles`
- `collector_user_id`
- أو `project_id` عند الحاجة

---

# 12) الـ Migrations المقترحة بالترتيب

## Migration 001
- extensions الأساسية
- helper functions إن لزم
- trigger لتحديث `updated_at` إن أردت

## Migration 002
- `projects`
- `units`
- `customers`

## Migration 003
- `contracts`
- `contract_units`
- `installments`

## Migration 004
- `profiles`
- `user_roles`

## Migration 005
- `followups`

## Migration 006
- `import_batches`
- `import_files`
- `import_issues`

## Migration 007
- `penalty_rules`
- `audit_logs` (اختياري)

## Migration 008
- indexes الإضافية
- views

## Migration 009
- enable RLS
- policies الأساسية

---

# 13) أشياء يجب ألا يفعلها Claude في الـ Schema

- لا يستخدم أسماء عربية داخل أسماء الجداول أو الأعمدة في قاعدة البيانات
- لا يضع كل شيء في جدول واحد كبير
- لا يربط العقد مباشرة بوحدة واحدة فقط
- لا يعتمد على اسم العميل أو اسم الوحدة كمفتاح أساسي نهائي
- لا يجعل الاستيراد overwrite كامل لكل السجلات
- لا يبني RLS معقدة جدًا من أول يوم بدون حاجة
- لا يضيف triggers كثيرة غير ضرورية
- لا يترك الجداول بدون فهارس على المفاتيح التجارية والبحث

---

# 14) ملخص تنفيذي
الـ Schema المقترح في Supabase يجب أن يدعم 4 أهداف رئيسية:
1. استيعاب ملفات Excel المحدثة من السيستم المحاسبي
2. تنفيذ matching و upsert بشكل آمن
3. الحفاظ على بيانات المتابعة الداخلية
4. إخراج تقارير تشغيلية وإدارية واضحة

الهيكل الأساسي الذي يجب أن يخرج في المرحلة الأولى:
- `projects`
- `units`
- `customers`
- `contracts`
- `contract_units`
- `installments`
- `followups`
- `import_batches`
- `import_files`
- `import_issues`
- `profiles`
- `user_roles`

وهذا يكفي جدًا لبناء نسخة قوية واحترافية من التطبيق في المرحلة الأولى.
