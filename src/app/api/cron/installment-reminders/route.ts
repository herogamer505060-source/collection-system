import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { getWhatsAppEnv } from "@/lib/integrations/whatsapp-env";
import { sendInstallmentDueSoonReminders } from "@/server/services/whatsapp/installment-reminder-service";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const isVercelCron = request.headers.has("x-vercel-cron");
  const env = getWhatsAppEnv();

  if (!isVercelCron) {
    const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null;
    if (!expected || authorization !== expected) {
      return Response.json({ error: { code: "forbidden", message: "Cron access denied" } }, { status: 403 });
    }
  }

  const sessionUser = await getRequiredSessionUser().catch(() => null);
  const result = await sendInstallmentDueSoonReminders({
    sessionUser: sessionUser ?? undefined,
  });

  return Response.json(result);
}
