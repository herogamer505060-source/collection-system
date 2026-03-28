# Import Pipeline — خط الاستيراد

## المبادئ
- لا تفترض ثبات أسماء الأعمدة 100% — استخدم mapping layer
- خدمة import منفصلة لكل ملف
- خزّن النتائج في `import_batches`
- وفّر preview/dry-run
- سجّل الصفوف الفاشلة وأسبابها
- اجعل الاستيراد idempotent

## الـ Importers المطلوبة
1. `importInstallmentsFromExcel()` — من Rep_REI006
2. `importSoldUnitsFromExcel()` — من تم بيعها بالفعل
3. `importAvailableUnitsFromExcel()` — من متاحه لم تباع
4. `importDetailedContractsFromExcel()` — من Rep_REI011 (enrichment)

## ترتيب الاستيراد
1. projects seed
2. sold units import
3. available units import
4. customers/contracts/installments import
5. detailed contracts enrichment

## قواعد التطبيع
- توحيد أسماء المشاريع بقيم ثابتة
- trim + إزالة فراغات مكررة
- توحيد التاريخ → ISO
- تحويل القيم المالية → decimal آمن
- تجاهل صفوف الإجماليات والصفوف غير التشغيلية
- توليد مفاتيح fallback إذا غاب الكود، مع log واضح

## اختبارات Import
- استبعاد صفوف الإجماليات
- التعامل مع صف ناقص
- التعامل مع مشروع غير معروف
- تسجيل الأخطاء في import_batches
- parsing العقود المركبة: B28+B29, G3+G4, T1-T2-T3-T4-T5-T6
