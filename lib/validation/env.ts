import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  MICROSOFT_ENTRA_TENANT_ID: z.string().optional(),
  MICROSOFT_ENTRA_CLIENT_ID: z.string().optional(),
  MICROSOFT_ENTRA_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_ENTRA_REDIRECT_URI: z.string().url().optional(),
});

export function getValidatedEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}
