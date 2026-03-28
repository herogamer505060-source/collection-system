import { z } from "zod";

const whatsappEnvSchema = z.object({
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_API_VERSION: z.string().min(1).default("v22.0"),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

export type WhatsAppEnv = z.infer<typeof whatsappEnvSchema>;

export function getWhatsAppEnv(): WhatsAppEnv {
  return whatsappEnvSchema.parse({
    CRON_SECRET: process.env.CRON_SECRET,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  });
}
