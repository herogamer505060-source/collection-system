# Claude Code Implementation Brief — نظام تحصيل عقاري ذكي (النسخة الأولى)

> هذا الملف مكتوب ليُرفع مباشرة إلى **Claude Code** ليبني التطبيق بأقل قدر ممكن من التخمين.
> المطلوب من Claude هو **تنفيذ تطبيق عربي RTL** لإدارة **أقساط العملاء والتحصيل والمتابعات** في شركة تطوير عقاري.

---

## 1) دور Claude المطلوب

أنت تعمل كمهندس برمجيات ومنتج وبيانات في مشروع **نظام تحصيل عقاري ذكي**.

المطلوب منك:
- بناء **MVP عملي** سريع وقابل للتوسع لاحقًا.
- الاعتماد على ملفات Excel المرفوعة كمصادر بيانات أولية.
- تنفيذ التطبيق بطريقة **Production-minded** حتى لو كانت النسخة الأولى بسيطة.
- عدم اختراع منطق أعمال غير مذكور هنا.
- عند وجود تعارض بين ملفين، اتبع **ترتيب مصادر الحقيقة** المذكور في هذا الملف.
- اجعل الواجهة **بالعربية بالكامل** وبدعم **RTL**.
- استخدم أسماء تقنية داخلية بالإنجليزية في الكود، مع Labels عربية في الواجهة.

---

## 2) هدف المشروع

بناء تطبيق داخلي لمتابعة **أقساط العملاء والتحصيل والمتأخرات والمتابعات** لشركة تطوير عقاري لديها 3 مشاريع:

- **IL Parco**
- **IL Centro**
- **Caza**

النسخة الأولى يجب أن تركز على:
- موقف الأقساط لكل عميل
- ما تم تحصيله وما لم يتم تحصيله
- المتأخرات
- الغرامات (محسوبة أو مستوردة)
- ملاحظات المتابعة على كل عميل / عقد
- تقارير ولوحات للإدارة
- مرجع الوحدات: المباعة والمتاحة

---

## 3) ما لا يجب بناؤه في النسخة الأولى

لا تنفذ هذه الأشياء الآن إلا إذا كانت سهلة جدًا وبدون تشتيت:
- ربط WhatsApp API
- OCR للإيصالات
- التسوية البنكية
- نظام محاسبي كامل
- صلاحيات معقدة جدًا متعددة المستويات
- Workflow قانوني متقدم
- محرك ذكاء اصطناعي متقدم للتنبؤ
- RBAC معقد أو Multi-tenancy
- Mobile app native

يمكن التحضير البنيوي لها، لكن لا تجعلها تعطل النسخة الأولى.

---

## 4) مصادر البيانات الحالية (المرفوعة)

### الملف 1 — تفاصيل عقود/أقساط تفصيلية
- **الاسم:** `Rep_REI011 (1) (3).xlsx`
- **الوصف:** ملف تفصيلي قديم يحتوي على تفاصيل عقود وأقساط وصفوف إجماليات بينية.
- **الاستخدام:** مصدر داعم لحقول إضافية مثل ملاحظات العقد وبعض بيانات التسليم.
- **ملاحظة:** يحتوي على صفوف إجمالية/ملخصات يجب استبعادها عند الاستيراد.

### الملف 2 — إجمالي أقساط العملاء
- **الاسم:** `Rep_REI006 (5).xlsx`
- **الوصف:** الملف الأساسي لأقساط العملاء، يحتوي على المشروع والعميل والوحدة/الوحدات والقسط والمحصل والمتبقي.
- **الاستخدام:** **مصدر الحقيقة الرئيسي** للعقود والأقساط في المرحلة الأولى.

### الملف 3 — الوحدات المباعة
- **الاسم:** `تم بيعها بالفعل.xlsx`
- **الوصف:** قائمة الوحدات المباعة مع الأسعار والمساحات.
- **الاستخدام:** **مصدر الحقيقة الرئيسي** للوحدات المباعة.

### الملف 4 — الوحدات المتاحة
- **الاسم:** `متاحه لم تباع.xlsx`
- **الوصف:** قائمة الوحدات المتاحة مع الأسعار والمساحات.
- **الاستخدام:** **مصدر الحقيقة الرئيسي** للوحدات المتاحة.

### ملفات مرجعية بصرية
- `erd_collection_ar.svg`
- `star_schema_collection_ar.svg`
- `final_collection_model_ar.svg`
- `collection_etl_flow_ar.svg`

استخدم هذه الرسومات كمرجع لفهم العلاقات أثناء التنفيذ.

---

## 5) ترتيب مصادر الحقيقة (Source of Truth Priority)

عند التعارض، استخدم هذا الترتيب:

### بالنسبة للأقساط والعقود
1. `Rep_REI006 (5).xlsx`
2. `Rep_REI011 (1) (3).xlsx`

### بالنسبة للوحدات
1. `تم بيعها بالفعل.xlsx`
2. `متاحه لم تباع.xlsx`
3. `Rep_REI011 (1) (3).xlsx` فقط كمصدر داعم

### بالنسبة للمتابعات
- لا توجد حاليًا في الإكسيلات بالشكل المطلوب
- يجب إنشاء جدول داخلي جديد داخل التطبيق

### بالنسبة للتحصيلات الفعلية حسب تاريخ القبض
- لا يوجد حتى الآن ملف مستقل معتمد
- إذا أضيف لاحقًا ملف سندات قبض، سيكون Fact مستقل

---

## 6) حقائق عمل مهمة يجب على Claude فهمها

### 6.1 المشاريع
الشركة تعمل على 3 مشاريع:
- IL Parco
- IL Centro
- Caza

### 6.2 الوحدات
- أسماء/أكواد الوحدات قد تتكرر بين المشاريع.
- **لا يجوز اعتبار اسم الوحدة وحده مفتاحًا فريدًا عالميًا**.
- مفتاح الوحدة يجب أن يكون مبنيًا على **المشروع + كود الوحدة** أو Key داخلي مشتق منهما.

### 6.3 العقود
- العقد هو الكيان التجاري الأهم.
- لا تستخدم الوحدة وحدها كمفتاح للعقد.
- قد توجد حالات لنفس المشروع + نفس الوحدة لكن بعقد مختلف في الداتا التاريخية أو التفصيلية.
- استخدم **كود العقد** كمفتاح العقد الأساسي متى كان موجودًا.

### 6.4 العقود متعددة الوحدات
في ملف الأقساط توجد حالات مثل:
- `B28+B29`
- `G3+G4`
- `T1-T2-T3-T4-T5-T6`

هذا يعني أن بعض العقود تخص أكثر من وحدة.

**مهم جدًا:**
- لا تخزن الوحدة كحقل منفرد في العقد فقط.
- أنشئ **جدول ربط ContractUnit** بين العقود والوحدات.
- يجب أن يستطيع النظام تفكيك هذه القيم المركبة إلى وحدات منفصلة وربط كل وحدة بالعقد.

### 6.5 الغرامات
- قد لا يوجد عمود غرامة صريح في كل الملفات.
- صمّم الحقل في قاعدة البيانات.
- إذا لم توجد غرامة مستوردة، اسمح بحسابها عبر قواعد عمل لاحقًا.
- في النسخة الأولى يكفي:
  - `penalty_amount` nullable
  - `penalty_calculation_method` optional later

### 6.6 التحصيلات الفعلية
- ملف الأقساط يكفي لموقف القسط (محصل/متبقي) لكنه ليس أفضل مصدر لتقرير قبض يومي دقيق.
- لذلك صمّم التطبيق بحيث يدعم لاحقًا جدول مستقل اسمه مثلًا `receipts` أو `collections`.

---

## 7) الموديل البياني النهائي المطلوب

## 7.1 الجداول الأساسية

### `projects`
الغرض: مرجع المشاريع

الحقول المقترحة:
- `id`
- `code` مثل `parco`, `centro`, `caza`
- `name_ar`
- `name_en` optional
- timestamps

### `units`
الغرض: مرجع الوحدات، سواء مباعة أو متاحة

الحقول المقترحة:
- `id`
- `project_id`
- `unit_code`
- `composite_unit_key` ← unique = project + unit_code
- `floor_name` nullable
- `built_up_area` nullable
- `garden_area` nullable
- `other_area` nullable
- `list_price` nullable
- `contract_price` nullable
- `unit_status` enum: `available`, `sold`
- `source_file`
- timestamps

### `customers`
الغرض: العملاء

الحقول المقترحة:
- `id`
- `customer_code` nullable في البداية
- `customer_name`
- `mobile` nullable
- `email` nullable
- `national_id` nullable
- timestamps

### `contracts`
الغرض: العقد الرئيسي

الحقول المقترحة:
- `id`
- `contract_code` unique
- `customer_id`
- `project_id`
- `contract_notes` nullable
- `delivery_date` nullable
- `actual_delivery_date` nullable
- `contract_status` nullable
- `source_file`
- timestamps

### `contract_units`
الغرض: ربط العقد بوحدة أو أكثر

الحقول المقترحة:
- `id`
- `contract_id`
- `unit_id`
- unique composite on (`contract_id`, `unit_id`)

### `installments`
الغرض: الأقساط/الاستحقاقات

الحقول المقترحة:
- `id`
- `installment_code` unique nullable
- `contract_id`
- `installment_type`
- `due_date`
- `amount_due`
- `amount_collected`
- `amount_outstanding`
- `payment_status` enum: `paid`, `partial`, `unpaid`, `overdue`
- `payment_date` nullable
- `commercial_paper` nullable
- `receipt_reference` nullable
- `delay_days` default 0
- `penalty_amount` nullable
- `source_file`
- timestamps

### `follow_ups`
الغرض: المتابعات التشغيلية

الحقول المقترحة:
- `id`
- `contract_id` nullable
- `customer_id` nullable
- `follow_up_date`
- `contact_type` enum: `call`, `whatsapp`, `meeting`, `email`, `other`
- `note`
- `customer_response` nullable
- `promised_to_pay` boolean
- `promise_date` nullable
- `next_action_date` nullable
- `collector_name` nullable
- `follow_up_status` enum: `open`, `done`, `missed`
- timestamps

### `import_batches`
الغرض: تتبع الاستيراد من الإكسيل

الحقول المقترحة:
- `id`
- `file_name`
- `import_type` enum: `installments`, `units_sold`, `units_available`, `contract_details`
- `status` enum: `pending`, `completed`, `failed`
- `rows_total`
- `rows_imported`
- `rows_skipped`
- `error_log` json/text nullable
- timestamps

### `receipts` (اختياري بنيويًا الآن)
الغرض: دعم التحصيلات الفعلية لاحقًا

الحقول المقترحة:
- `id`
- `contract_id`
- `receipt_no`
- `receipt_date`
- `amount`
- `payment_method`
- `bank_reference` nullable
- `notes` nullable
- timestamps

---

## 8) العلاقات المطلوبة

- `projects 1 --- * units`
- `projects 1 --- * contracts`
- `customers 1 --- * contracts`
- `contracts 1 --- * installments`
- `contracts 1 --- * contract_units`
- `units 1 --- * contract_units`
- `contracts 1 --- * follow_ups`
- `customers 1 --- * follow_ups` (اختياري حسب مستوى الربط)
- `contracts 1 --- * receipts` لاحقًا

**قاعدة مهمة:**
لا تربط الأقساط مباشرة بالوحدات، بل عبر العقد، لأن العقد قد يحتوي أكثر من وحدة.

---

## 9) قواعد اشتقاق منطق الأعمال (Business Rules)

### 9.1 حالة القسط
احسب `payment_status` هكذا:
- `paid` إذا `amount_outstanding <= 0`
- `partial` إذا `amount_collected > 0` و `amount_outstanding > 0`
- `overdue` إذا `amount_outstanding > 0` و `due_date < today`
- `unpaid` إذا `amount_collected == 0` و `due_date >= today`

### 9.2 أيام التأخير
- إذا القسط غير مسدد بالكامل وتاريخ الاستحقاق أقل من اليوم → `today - due_date`
- غير ذلك = 0

### 9.3 حالة العميل/العقد (مشتقة في التقارير)
يفضل عدم تخزينها مباشرة في البداية، بل اشتقاقها من الأقساط:
- منتظم
- مستحق قريب
- متأخر بسيط
- متأخر متوسط
- متأخر شديد
- عليه وعد سداد

### 9.4 حالة الوحدة
- من ملف الوحدات المباعة = `sold`
- من ملف الوحدات المتاحة = `available`
- إذا ظهرت نفس الوحدة في الملفين، سجّل Conflict في import log ولا تخمّن

### 9.5 العقود متعددة الوحدات
- عند وجود قيمة مثل `B28+B29` أو سلسلة مفصولة بـ `+` أو `-`، فكّها إلى وحدات مستقلة حسب قواعد parsing واضحة.
- يجب كتابة parser قابل للاختبار (tested parser).
- لا تعتمد على split بدائي فقط؛ راعِ الفراغات والرموز المختلفة واحتمال وجود أنماط مختلطة.

---

## 10) وظيفة الاستيراد من Excel المطلوبة

المطلوب بناء **Import Pipeline** محترمة، وليس مجرد script مؤقت.

### 10.1 مبادئ عامة
- لا تفترض ثبات أسماء الأعمدة بنسبة 100%؛ استخدم mapping layer.
- أنشئ خدمة import منفصلة لكل ملف.
- خزّن نتائج الاستيراد في `import_batches`.
- وفّر preview أو dry-run إن أمكن.
- سجّل الصفوف الفاشلة وأسبابها.
- اجعل الاستيراد idempotent قدر الإمكان.

### 10.2 importers المطلوبة
- `importInstallmentsFromExcel()`
- `importSoldUnitsFromExcel()`
- `importAvailableUnitsFromExcel()`
- `importDetailedContractsFromExcel()`

### 10.3 import order المقترح
1. projects seed
2. sold units import
3. available units import
4. customers/contracts/installments import
5. detailed contracts enrichment import

### 10.4 Data normalization rules
- توحيد أسماء المشاريع (`IL Parco`, `IL Centro`, `Caza`) بقيم ثابتة
- trim لكل النصوص
- إزالة الفراغات المكررة
- توحيد التاريخ إلى ISO
- تحويل القيم المالية إلى decimal آمن
- تجاهل صفوف الإجماليات والصفوف غير التشغيلية
- توليد مفاتيح fallback إذا غاب الكود الأساسي، لكن مع log واضح

---

## 11) الشاشات المطلوبة في التطبيق

## 11.1 لوحة الإدارة (Dashboard)
المطلوب عرض:
- إجمالي الأقساط المستحقة
- إجمالي المحصل
- إجمالي المتبقي
- إجمالي المتأخرات
- إجمالي الغرامات
- عدد العملاء الذين سددوا
- عدد العملاء الذين لم يسددوا
- عدد العملاء المتأخرين
- عدد وعود السداد المفتوحة
- توزيع حسب المشروع
- أعلى العملاء المتأخرين
- أحدث المتابعات

## 11.2 شاشة العملاء
- بحث باسم العميل
- فلترة بالمشروع
- فلترة بالحالة
- إجمالي المتأخر
- إجمالي المتبقي
- آخر متابعة

## 11.3 شاشة العقود
- قائمة العقود
- العميل
- المشروع
- الوحدات المرتبطة
- إجمالي المستحق
- المحصل
- المتبقي
- حالة العقد

## 11.4 شاشة ملف العميل / العقد
يجب أن تعرض:
- بيانات العميل
- بيانات المشروع
- الوحدات المرتبطة بالعقد
- جدول الأقساط
- إجمالي المحصل
- إجمالي المتبقي
- إجمالي الغرامات
- المتابعات
- إمكانية إضافة متابعة جديدة

## 11.5 شاشة الوحدات
- فلترة: مباعة / متاحة
- فلترة حسب المشروع
- إظهار السعر والمساحات
- ربط سريع بالعقد إذا كانت الوحدة مباعة

## 11.6 شاشة المتابعات
- قائمة كل المتابعات
- فلترة حسب المسؤول
- فلترة حسب التاريخ
- وعود السداد القادمة
- المتابعات المتأخرة

## 11.7 شاشة الاستيراد
- رفع ملف إكسيل
- اختيار نوع الاستيراد
- عرض preview بسيط
- تقرير نجاح/فشل

---

## 12) التقارير والمؤشرات المطلوبة

### 12.1 تقارير أساسية
- تقرير: مين سدد ومين لم يسدد
- تقرير: العملاء المتأخرون
- تقرير: أعمار المديونية
- تقرير: الغرامات
- تقرير: موقف كل مشروع
- تقرير: آخر ملاحظات التحصيل
- تقرير: العملاء الذين لديهم وعد سداد
- تقرير: العملاء بدون متابعة منذ X يوم

### 12.2 مؤشرات KPI
- إجمالي المستحق
- إجمالي المحصل
- إجمالي المتبقي
- نسبة التحصيل
- إجمالي المتأخرات
- متوسط أيام التأخير
- عدد الأقساط المتأخرة
- عدد العملاء المتأخرين
- نسبة الوحدات المباعة لكل مشروع
- قيمة المخزون المتاح

---

## 13) اللغة وتجربة الاستخدام

### 13.1 اللغة
- الواجهة كلها بالعربي
- عناوين الجداول والتقارير بالعربي
- أسماء الحقول في الكود بالإنجليزية

### 13.2 RTL
- التطبيق يجب أن يكون RTL افتراضيًا
- الجداول يجب أن تكون مقروءة بالعربي
- الأرقام المالية والتواريخ تظهر بشكل واضح

### 13.3 تنسيق الأموال
- استخدم تنسيق مناسب للجنيه المصري
- اجعل الأرقام قابلة للنسخ بسهولة

### 13.4 البحث
- دعم البحث العربي المرن قدر الإمكان
- راعِ التطابق الجزئي في أسماء العملاء

---

## 14) التوصية التقنية الافتراضية

إذا لم توجد توجيهات أخرى من المستخدم، نفّذ بهذه التقنية:

### Frontend / Fullstack
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

### Database / ORM
- **Prisma**
- **PostgreSQL** للإنتاج
- يسمح بـ **SQLite** في local dev إذا كان ذلك أسرع للبداية

### Excel parsing
- مكتبة `xlsx` أو ما يعادلها
- مع abstraction layer فوق parser الخام

### Validation
- `zod`

### Tables / filtering
- `tanstack table`

### Charts
- `recharts`

### Forms
- `react-hook-form`

### Date handling
- `date-fns`

### Optional auth for v1
- Simple local auth أو mock auth
- لا تُعقّد المصادقة في النسخة الأولى

---

## 15) هيكل المشروع المقترح (Best Practice)

استخدم هيكلًا واضحًا قابلًا للتوسع:

```text
src/
  app/
    (dashboard)/
      dashboard/
      customers/
      contracts/
      units/
      follow-ups/
      imports/
    api/
      imports/
      customers/
      contracts/
      dashboard/
      follow-ups/
  components/
    ui/
    layout/
    dashboard/
    customers/
    contracts/
    units/
    follow-ups/
    imports/
  features/
    dashboard/
      queries/
      services/
      types/
    customers/
      queries/
      services/
      schema/
      types/
    contracts/
      queries/
      services/
      schema/
      types/
    units/
      queries/
      services/
      schema/
      types/
    follow-ups/
      queries/
      services/
      schema/
      types/
    imports/
      parsers/
      mappers/
      services/
      validators/
      utils/
  lib/
    db/
    excel/
    formatting/
    dates/
    constants/
    utils/
  server/
    repositories/
    services/
  prisma/
    schema.prisma
    seeds/
  tests/
    unit/
    integration/
```

### ملاحظات مهمة على الهيكل
- لا تضع كل business logic داخل صفحات Next.js.
- افصل `parser`, `mapper`, `service`, `repository`.
- اجعل import logic قابلة للاختبار منفصلة عن UI.
- استخدم repository/services pattern بشكل معتدل، بدون overengineering.

---

## 16) ما يجب على Claude بناؤه أولًا

### المرحلة 1
- إعداد المشروع
- تصميم Prisma schema
- seed للمشاريع
- صفحات أساسية RTL
- Dashboard مبدئي
- CRUD للمتابعات

### المرحلة 2
- Import pipeline للوحدات المباعة والمتاحة
- Import pipeline للأقساط والعقود
- Parsing للعقود متعددة الوحدات
- صفحات العملاء والعقود والوحدات

### المرحلة 3
- KPIs والتقارير
- Filters قوية
- تحسين الأداء
- Export CSV/PDF لاحقًا إن لزم

---

## 17) اختبارات يجب كتابتها

### 17.1 اختبارات parsing
اختبر parsing للوحدات المركبة مثل:
- `B28+B29`
- `G3+G4`
- `T1-T2-T3-T4-T5-T6`
- قيم بها فراغات
- قيم بها separators مختلفة

### 17.2 اختبارات business rules
- اشتقاق `payment_status`
- حساب `delay_days`
- حساب `amount_outstanding`
- تصنيف الوحدة sold/available

### 17.3 اختبارات import
- استبعاد صفوف الإجماليات
- التعامل مع صف ناقص
- التعامل مع مشروع غير معروف
- تسجيل الأخطاء في `import_batches`

---

## 18) أداء واعتبارات عملية

- استخدم pagination للجداول الكبيرة
- استخدم server-side data fetching للشاشات الثقيلة
- جهّز indexes مناسبة على:
  - `contract_code`
  - `installment_code`
  - `customer_name`
  - `project_id`
  - `unit_status`
  - `due_date`
- لا تحمل كل الإكسيلات في الذاكرة إذا كان الحجم كبيرًا جدًا؛ استخدم أسلوبًا عمليًا مناسبًا

---

## 19) جودة الكود المطلوبة

- TypeScript strict
- لا تستخدم `any` إلا عند الضرورة القصوى
- أسماء واضحة ومباشرة
- توثيق مختصر فوق الخدمات المهمة
- تجنب الدوال الطويلة جدًا
- بناء شاشات قابلة لإعادة الاستخدام
- عدم مزج لغة العرض مع لغة الكود

---

## 20) القرار التصميمي بخصوص Power BI مقابل التطبيق

هذا المشروع **ليس بديلًا عن Power BI** فقط، بل يمكن أن يكون:
- تطبيق تشغيل يومي للتحصيل
- ومصدر بيانات منظم لـ Power BI لاحقًا

لذلك:
- صمّم قاعدة البيانات بشكل نظيف وكأنها ستغذي BI لاحقًا
- لا تبنِ كل شيء على منطق UI فقط

---

## 21) تسليمات Claude المتوقعة

عند التنفيذ، المطلوب من Claude أن ينتج:
- مشروع يعمل محليًا
- Prisma schema
- migrations
- import services
- شاشات أساسية RTL
- Dashboard مبدئي
- CRUD للمتابعات
- صفحة للوحدات
- صفحة للعقود
- صفحة للعملاء
- تعليمات تشغيل واضحة في README

---

## 22) ما الذي يجب فعله إذا كانت بعض الأعمدة غير واضحة

إذا وجد Claude أعمدة غير واضحة في الإكسيل:
- لا يتوقف مباشرة
- ينشئ mapping مرن
- يضع TODOs واضحة
- يسجل assumptions في ملف README أو docs/assumptions.md
- يتجنب كسر النظام بسبب عمود واحد غير واضح

لكن:
- لا يختلق معنى عمود غير مفهوم ثم يبني عليه business logic حرج

---

## 23) مثال أسماء عربية في الواجهة

### Labels مقترحة
- Dashboard = `لوحة المتابعة`
- Customers = `العملاء`
- Contracts = `العقود`
- Units = `الوحدات`
- Follow Ups = `المتابعات`
- Imports = `الاستيراد`
- Due Amount = `المستحق`
- Collected Amount = `المحصل`
- Outstanding = `المتبقي`
- Overdue = `متأخر`
- Penalty = `غرامة`
- Promise Date = `تاريخ وعد السداد`

---

## 24) قرارات تنفيذية لتقليل الغموض

### اختر هذه القرارات افتراضيًا
- Framework: Next.js
- Database: PostgreSQL (SQLite local optional)
- ORM: Prisma
- UI: shadcn/ui + Tailwind
- Charts: Recharts
- Tables: TanStack Table
- RTL: default app layout direction rtl
- Imports: admin screen + server services

### لا تؤجل هذه القرارات
خذها كافتراضات تنفيذ افتراضية ما لم يطلب المستخدم خلاف ذلك.

---

## 25) Definition of Done للنسخة الأولى

اعتبر النسخة الأولى ناجحة إذا توفر الآتي:
- يمكن استيراد ملفات الوحدات المباعة والمتاحة
- يمكن استيراد ملف الأقساط الأساسي
- يتم إنشاء العقود والعملاء والأقساط بشكل صحيح
- يتم تفكيك العقود متعددة الوحدات بشكل صحيح
- يمكن فتح صفحة عميل ورؤية موقفه
- يمكن فتح صفحة عقد ورؤية الوحدات والأقساط والمتابعات
- تظهر لوحة مؤشرات أساسية للإدارة
- يمكن إضافة متابعة جديدة وتظهر في التقارير
- الواجهة عربية RTL وواضحة

---

## 26) توجيه نهائي مباشر إلى Claude

نفّذ هذا المشروع كـ **MVP قوي وقابل للتوسع**.

ابدأ بـ:
1. وضع خطة تنفيذ قصيرة
2. إنشاء schema واضح
3. بناء import pipeline
4. بناء الواجهات الأساسية
5. اختبار parsing والعلاقات

لا تبالغ في التعقيد، لكن لا تبنِ المشروع بطريقة مؤقتة فوضوية.

إذا احتجت قرارًا ولم يرد هنا، اختر القرار الأكثر بساطة واستقرارًا وقابلية للتوسع.

