# Data Model — نظام التحصيل العقاري

## الجداول الأساسية

### `projects`
مرجع المشاريع: `id`, `code` (parco/centro/caza), `name_ar`, `name_en` optional, timestamps

### `units`
مرجع الوحدات (مباعة + متاحة): `id`, `project_id`, `unit_code`, `composite_unit_key` (unique = project + unit_code), `floor_name`, `built_up_area`, `garden_area`, `other_area`, `list_price`, `contract_price`, `unit_status` (available/sold), `source_file`, timestamps

### `customers`
العملاء: `id`, `customer_code` nullable, `customer_name`, `mobile`, `email`, `national_id`, timestamps

### `contracts`
العقد الرئيسي: `id`, `contract_code` unique, `customer_id`, `project_id`, `contract_notes`, `delivery_date`, `actual_delivery_date`, `contract_status`, `source_file`, timestamps

### `contract_units`
ربط العقد بوحدة أو أكثر: `id`, `contract_id`, `unit_id`, unique composite (contract_id, unit_id)

### `installments`
الأقساط: `id`, `installment_code` unique nullable, `contract_id`, `installment_type`, `due_date`, `amount_due`, `amount_collected`, `amount_outstanding`, `payment_status` (paid/partial/unpaid/overdue), `payment_date`, `commercial_paper`, `receipt_reference`, `delay_days` default 0, `penalty_amount`, `source_file`, timestamps

### `follow_ups`
المتابعات: `id`, `contract_id`, `customer_id`, `follow_up_date`, `contact_type` (call/whatsapp/meeting/email/other), `note`, `customer_response`, `promised_to_pay` boolean, `promise_date`, `next_action_date`, `collector_name`, `follow_up_status` (open/done/missed), timestamps

### `import_batches`
تتبع الاستيراد: `id`, `file_name`, `import_type` (installments/units_sold/units_available/contract_details), `status` (pending/completed/failed), `rows_total`, `rows_imported`, `rows_skipped`, `error_log` json, timestamps

### `receipts` (بنيوي — للمستقبل)
التحصيلات الفعلية: `id`, `contract_id`, `receipt_no`, `receipt_date`, `amount`, `payment_method`, `bank_reference`, `notes`, timestamps

## العلاقات
- projects 1→* units, contracts
- customers 1→* contracts
- contracts 1→* installments, contract_units, follow_ups, receipts
- units 1→* contract_units
- **قاعدة:** لا تربط الأقساط مباشرة بالوحدات — عبر العقد فقط

## Indexes المطلوبة
`contract_code`, `installment_code`, `customer_name`, `project_id`, `unit_status`, `due_date`
