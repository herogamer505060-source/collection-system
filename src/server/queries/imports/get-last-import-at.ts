import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export async function getLastImportAt(
  client: AdminClient = createAdminSupabaseClient(),
): Promise<string | null> {
  const { data, error } = await client
    .from("import_batches")
    .select("finished_at")
    .in("status", ["approved", "approved_with_issues"])
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.finished_at ?? null;
}
