import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL."),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY is missing or too short."),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const source = {
    SUPABASE_URL: process.env.SUPABASE_URL ?? (process.env.NODE_ENV === "test" ? "https://example.supabase.co" : undefined),
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      (process.env.NODE_ENV === "test" ? "test-service-role-key-1234567890" : undefined),
  };

  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" | ");
    throw new Error(`Environment validation failed. ${errors}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
