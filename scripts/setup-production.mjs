/**
 * Production setup script — run AFTER migrations have been applied.
 *
 * Handles:
 *   1. Create the `imports` storage bucket
 *   2. Bootstrap the first admin user (profile + role)
 *
 * Usage:
 *   node scripts/setup-production.mjs bucket
 *   node scripts/setup-production.mjs admin <auth-user-uuid> "<Full Name>" "<email>"
 *
 * Prerequisites:
 *   - .env.local must exist with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - Migrations must already be applied (run all-migrations.sql first)
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// --- Load .env.local ---
function loadEnv() {
  const envPath = resolve(__dir, "../.env.local");
  const content = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const command = process.argv[2];

// ─── Command: bucket ─────────────────────────────────────────────────────────
async function createBucket() {
  console.log("Creating imports storage bucket...");

  const { data, error } = await supabase.storage.createBucket("imports", {
    public: false,
    fileSizeLimit: 52428800, // 50 MB
    allowedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
  });

  if (error) {
    if (error.message?.includes("already exists")) {
      console.log("✓ Bucket 'imports' already exists — skipping.");
    } else {
      console.error("❌ Failed to create bucket:", error.message);
      process.exit(1);
    }
  } else {
    console.log("✓ Bucket 'imports' created successfully.");
  }
}

// ─── Command: admin ───────────────────────────────────────────────────────────
async function bootstrapAdmin(authUserId, fullName, email) {
  if (!authUserId || !fullName) {
    console.error(
      "Usage: node scripts/setup-production.mjs admin <auth-user-uuid> \"<Full Name>\" \"<email>\""
    );
    process.exit(1);
  }

  console.log(`Bootstrapping admin user: ${fullName} (${authUserId})`);

  // 1. Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: authUserId, full_name: fullName, email: email ?? null, is_active: true },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("❌ Failed to create profile:", profileError.message);
    process.exit(1);
  }
  console.log("✓ Profile created.");

  // 2. Assign admin role (project_id null = global admin)
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: authUserId, role: "admin", project_id: null },
      { onConflict: "user_id,role,project_id" }
    );

  if (roleError) {
    console.error("❌ Failed to assign admin role:", roleError.message);
    process.exit(1);
  }
  console.log("✓ Admin role assigned (global).");
  console.log(`\n✅ Admin user ${fullName} is ready. Login with the credentials you set in Supabase Auth.`);
}

// ─── Command: set-password ────────────────────────────────────────────────────
async function setPassword(userId, newPassword) {
  if (!userId || !newPassword) {
    console.error(
      "Usage: node scripts/setup-production.mjs set-password <auth-user-uuid> \"<new-password>\""
    );
    process.exit(1);
  }

  console.log(`Setting password for user: ${userId}`);

  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });

  if (error) {
    console.error("❌ Failed to set password:", error.message);
    process.exit(1);
  }

  console.log("✓ Password updated successfully.");
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
if (command === "bucket") {
  await createBucket();
} else if (command === "admin") {
  const [, , , authUserId, fullName, email] = process.argv;
  await bootstrapAdmin(authUserId, fullName, email);
} else if (command === "set-password") {
  const [, , , userId, newPassword] = process.argv;
  await setPassword(userId, newPassword);
} else {
  console.log("Commands:");
  console.log("  node scripts/setup-production.mjs bucket");
  console.log("  node scripts/setup-production.mjs admin <uuid> \"<name>\" \"<email>\"");
  console.log("  node scripts/setup-production.mjs set-password <uuid> \"<new-password>\"");
}
