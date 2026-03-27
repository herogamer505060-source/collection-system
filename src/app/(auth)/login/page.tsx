import Link from "next/link";

import { signInAction } from "@/features/auth/actions/sign-in";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ERROR_MESSAGES_AR: Record<string, string> = {
  validation_failed: "الرجاء مراجعة بيانات الدخول",
  invalid_credentials: "بيانات الدخول غير صحيحة",
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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = readSearchParam(params, "error");
  const nextPath = readSearchParam(params, "next");
  const registered = readSearchParam(params, "registered");

  return (
    <main className="min-h-screen bg-surface px-6 py-10 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl bg-surface-container-low p-8 lg:p-10">
            <span className="inline-flex rounded-full bg-surface-container-lowest px-3 py-1 text-label-lg font-semibold text-primary">
              The Financial Architect
            </span>
            <h1 className="mt-6 bg-gradient-to-br from-primary to-primary-container bg-clip-text font-display text-display-sm text-transparent lg:text-display-md">
              دخول هادئ لمساحة التحصيل التنفيذية
            </h1>
            <p className="mt-4 max-w-xl text-body-lg leading-8 text-on-surface-variant">
              ادخل ببريدك المؤسسي وكلمة المرور للوصول إلى لوحة متابعة مصممة للجلسات الطويلة
              والقرارات اليومية الدقيقة.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-xl bg-surface-container-lowest px-4 py-4">
                <div className="text-label-lg font-semibold text-on-surface">وصول منظم حسب الصلاحيات</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  يتم التحقق من الجلسة والدور قبل فتح الشاشات التشغيلية أو واجهات الإدارة.
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-lowest px-4 py-4">
                <div className="text-label-lg font-semibold text-on-surface">واجهة عربية أولاً</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  كل تفاصيل المتابعة والتحصيل مصممة لتدفق RTL واضح ومريح طوال يوم العمل.
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-lowest px-4 py-4">
                <div className="text-label-lg font-semibold text-on-surface">تركيز على الإشارات المهمة</div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  مؤشرات الحالات، التقارير، وسجل المتابعات تظهر بهرمية بصرية تقلل الإرهاق.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-surface-container-lowest p-8 ambient-shadow lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-label-lg font-semibold uppercase tracking-[0.24em] text-primary/70">
                  Welcome Back
                </p>
                <h2 className="mt-3 font-display text-headline-sm text-on-surface">بيانات الدخول</h2>
                <p className="mt-2 text-body-md text-on-surface-variant">
                  أدخل البريد الإلكتروني وكلمة المرور للمتابعة إلى النظام.
                </p>
              </div>
              <Link className="text-body-md font-semibold text-primary transition-colors hover:text-primary-container" href="/">
                العودة للرئيسية
              </Link>
            </div>

            {registered ? (
              <div className="mt-6 rounded-xl bg-[#d0f5f5] px-4 py-3 text-body-md text-[#004f4f]">
                تم إنشاء حسابك بنجاح — سجّل الدخول الآن
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">
                {ERROR_MESSAGES_AR[error] ?? "حدث خطأ غير متوقع"}
              </div>
            ) : null}

            <form action={signInAction} className="mt-8 space-y-5">
              <input name="next" type="hidden" value={nextPath ?? ""} />

              <label className="block space-y-2">
                <span className="text-label-lg font-semibold text-on-surface">البريد الإلكتروني</span>
                <input
                  className={inputClassName}
                  dir="ltr"
                  name="email"
                  placeholder="admin@example.com"
                required
                type="email"
              />
            </label>

              <label className="block space-y-2">
                <span className="text-label-lg font-semibold text-on-surface">كلمة المرور</span>
                <input
                  className={inputClassName}
                  dir="ltr"
                  name="password"
                  placeholder="********"
                required
                type="password"
              />
              </label>

              <button className={submitButtonClassName} type="submit">
                دخول
              </button>

              <p className="text-center text-body-md text-on-surface-variant">
                ليس لديك حساب؟{" "}
                <Link className="font-semibold text-primary transition-colors hover:text-primary-container" href="/register">
                  إنشاء حساب جديد
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
