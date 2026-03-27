import Link from "next/link";

import { signUpAction } from "@/features/auth/actions/sign-up";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ERROR_MESSAGES_AR: Record<string, string> = {
  validation_failed: "الرجاء مراجعة البيانات المدخلة",
  signup_failed: "حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى",
};

const inputClassName =
  "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

const submitButtonClassName =
  "gradient-primary w-full rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90";

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = readSearchParam(params, "error");

  return (
    <main className="min-h-screen bg-surface px-6 py-10 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl bg-surface-container-low p-8 lg:p-10">
            <span className="inline-flex rounded-full bg-surface-container-lowest px-3 py-1 text-label-lg font-semibold text-primary">
              The Financial Architect
            </span>
            <h1 className="mt-6 bg-gradient-to-br from-primary to-primary-container bg-clip-text font-display text-display-sm text-transparent lg:text-display-md">
              أنشئ حسابك وابدأ العمل من اللحظة الأولى
            </h1>
            <p className="mt-4 max-w-xl text-body-lg leading-8 text-on-surface-variant">
              أدخل بياناتك الأساسية ليتم تجهيز حسابك مباشرة، ثم سجّل الدخول للوصول إلى بيئة
              التحصيل الموحدة.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-xl bg-surface-container-lowest px-4 py-4">
                <div className="text-label-lg font-semibold text-on-surface">انطلاقة سريعة</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  الحساب الجديد يُنشأ فوراً ويمكن استخدامه مباشرة بعد إتمام التسجيل.
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-lowest px-4 py-4">
                <div className="text-label-lg font-semibold text-on-surface">صلاحيات قابلة للترقية</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  يبدأ الحساب بصلاحية مشاهدة، ويمكن لمدير النظام رفع مستوى الوصول لاحقاً.
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-lowest px-4 py-4">
                <div className="text-label-lg font-semibold text-on-surface">تجربة متناسقة</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  نفس اللغة البصرية والتنظيمية سترافقك من شاشة التسجيل حتى التقارير اليومية.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-surface-container-lowest p-8 ambient-shadow lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-label-lg font-semibold uppercase tracking-[0.24em] text-primary/70">
                  Create Account
                </p>
                <h2 className="mt-3 font-display text-headline-sm text-on-surface">بيانات الحساب الجديد</h2>
                <p className="mt-2 text-body-md text-on-surface-variant">جميع الحقول مطلوبة لإتمام التسجيل.</p>
              </div>
              <Link className="text-body-md font-semibold text-primary transition-colors hover:text-primary-container" href="/login">
                تسجيل الدخول
              </Link>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">
                {ERROR_MESSAGES_AR[error] ?? "حدث خطأ غير متوقع"}
              </div>
            ) : null}

            <form action={signUpAction} className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-label-lg font-semibold text-on-surface">الاسم الكامل</span>
                <input
                  className={inputClassName}
                  name="full_name"
                  placeholder="مثال: محمد أحمد"
                  required
                minLength={2}
                type="text"
              />
            </label>

              <label className="block space-y-2">
                <span className="text-label-lg font-semibold text-on-surface">البريد الإلكتروني</span>
                <input
                  className={inputClassName}
                  dir="ltr"
                  name="email"
                  placeholder="name@example.com"
                required
                type="email"
              />
            </label>

              <label className="block space-y-2">
                <span className="text-label-lg font-semibold text-on-surface">كلمة المرور</span>
                <input
                  className={inputClassName}
                  dir="ltr"
                  minLength={8}
                  name="password"
                placeholder="8 أحرف على الأقل"
                required
                type="password"
              />
            </label>

              <button className={submitButtonClassName} type="submit">
                إنشاء الحساب
              </button>

              <p className="text-center text-body-md text-on-surface-variant">
                لديك حساب بالفعل؟{" "}
                <Link className="font-semibold text-primary transition-colors hover:text-primary-container" href="/login">
                  سجّل الدخول الآن
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
