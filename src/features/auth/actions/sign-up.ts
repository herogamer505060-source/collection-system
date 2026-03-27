"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
});

export async function signUpAction(formData: FormData) {
  const payload = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });

  if (!payload.success) {
    redirect("/register?error=validation_failed");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
    options: { data: { full_name: payload.data.full_name } },
  });

  if (error) {
    redirect("/register?error=signup_failed");
  }

  redirect("/login?registered=1");
}
