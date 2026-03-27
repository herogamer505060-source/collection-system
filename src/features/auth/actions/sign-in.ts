"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
  password: z.string().min(1),
});

function normalizeNextPath(nextPath: string | undefined): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath === "/login") {
    return "/users";
  }

  return nextPath;
}

export async function signInAction(formData: FormData) {
  const payload = signInSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || undefined,
    password: formData.get("password"),
  });

  if (!payload.success) {
    redirect("/login?error=validation_failed");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  revalidatePath("/", "layout");
  redirect(normalizeNextPath(payload.data.next));
}
