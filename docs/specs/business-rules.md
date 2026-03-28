# Business Rules — قواعد العمل

## حالة القسط payment_status
- `paid` إذا `amount_outstanding <= 0`
- `partial` إذا `amount_collected > 0` و `amount_outstanding > 0`
- `overdue` إذا `amount_outstanding > 0` و `due_date < today`
- `unpaid` إذا `amount_collected == 0` و `due_date >= today`

## أيام التأخير delay_days
- إذا القسط غير مسدد بالكامل و due_date < today → `today - due_date`
- غير ذلك = 0

## حالة العميل/العقد (مشتقة — لا تُخزّن)
- منتظم | مستحق قريب | متأخر بسيط | متأخر متوسط | متأخر شديد | عليه وعد سداد

## حالة الوحدة
- من ملف المباعة = `sold` | من ملف المتاحة = `available`
- تعارض بين الملفين → سجّل Conflict في import log ولا تخمّن

## العقود متعددة الوحدات
- أنماط مثل: `B28+B29`, `G3+G4`, `T1-T2-T3-T4-T5-T6`
- فكّها إلى وحدات مستقلة عبر parser مختبر
- لا تعتمد على split بدائي — راعِ الفراغات والرموز المختلفة

## الغرامات
- `penalty_amount` nullable — قد لا يوجد عمود صريح في كل الملفات
- `penalty_calculation_method` optional later
- إذا لم توجد غرامة مستوردة، اسمح بحسابها لاحقًا

## التحصيلات الفعلية
- ملف الأقساط يكفي لموقف القسط (محصل/متبقي)
- جدول `receipts` مستقل لتقرير قبض يومي دقيق لاحقًا
