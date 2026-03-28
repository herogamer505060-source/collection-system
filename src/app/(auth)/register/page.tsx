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
    <main className="min-h-screen bg-transparent px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="executive-panel executive-mesh relative overflow-hidden rounded-[32px] p-8 lg:p-10">
            <div className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-[rgba(183,146,82,0.1)] to-transparent lg:block" />
            <span className="inline-flex rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-label-lg font-semibold text-primary">
              The Financial Architect
            </span>
            <h1 className="mt-6 max-w-2xl font-display text-display-sm tracking-[-0.04em] text-[hsl(var(--premium-ink))] lg:text-display-md">
              أنشئ حسابك وابدأ العمل من اللحظة الأولى
            </h1>
            <p className="mt-4 max-w-xl text-body-lg leading-8 text-on-surface-variant">
              أدخل بياناتك الأساسية ليتم تجهيز حسابك مباشرة، ثم سجّل الدخول للوصول إلى بيئة
              التحصيل الموحدة.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 backdrop-blur-sm">
                <div className="text-label-lg font-semibold text-on-surface">انطلاقة سريعة</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  الحساب الجديد يُنشأ فوراً ويمكن استخدامه مباشرة بعد إتمام التسجيل.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 backdrop-blur-sm">
                <div className="text-label-lg font-semibold text-on-surface">صلاحيات قابلة للترقية</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  يبدأ الحساب بصلاحية مشاهدة، ويمكن لمدير النظام رفع مستوى الوصول لاحقاً.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 backdrop-blur-sm">
                <div className="text-label-lg font-semibold text-on-surface">تجربة متناسقة</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  نفس اللغة البصرية والتنظيمية سترافقك من شاشة التسجيل حتى التقارير اليومية.
                </p>
              </div>
            </div>
          </section>

          <section className="executive-panel rounded-[32px] p-8 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-label-lg font-semibold uppercase tracking-[0.24em] text-primary/70">
                  Create Account
                </p>
                <h2 className="mt-3 font-display text-headline-sm tracking-[-0.02em] text-[hsl(var(--premium-ink))]">بيانات الحساب الجديد</h2>
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
