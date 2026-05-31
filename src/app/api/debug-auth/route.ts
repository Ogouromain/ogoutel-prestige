// ============================================
// OGOUTEL_Prestige - Debug Auth API
// Endpoint to diagnose Supabase auth connection
// DELETE THIS AFTER DEBUGGING
// ============================================

import { NextResponse } from "next/server";
import env from "@/lib/env";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_env: env.NODE_ENV,
    // Env var status (shows if they are set, NOT the actual values)
    supabase_url_set: !!env.SUPABASE_URL,
    supabase_url_length: env.SUPABASE_URL?.length ?? 0,
    supabase_url_starts: env.SUPABASE_URL?.startsWith("https://") ?? false,
    supabase_anon_key_set: !!env.SUPABASE_ANON_KEY,
    supabase_anon_key_length: env.SUPABASE_ANON_KEY?.length ?? 0,
    supabase_service_key_set: !!env.SUPABASE_SERVICE_ROLE_KEY,
    resend_configured: env.RESEND_CONFIGURED,
    app_url: env.APP_URL,
    app_name: env.APP_NAME,
    // Raw env var checks
    raw_next_public_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    raw_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    raw_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Fallback checks
    raw_supabase_url: !!process.env.SUPABASE_URL,
    raw_anon_key_alt: !!process.env.ANON_KEY,
    raw_service_key_alt: !!process.env.SERVICE_ROLE_KEY,
  };

  // Try to connect to Supabase
  try {
    if (!env.SUPABASE_CONFIGURED) {
      diagnostics.supabase_connection = "SKIP - not configured";
      diagnostics.issue = "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty on Vercel.";
    } else {
      const { createClient } = await import("@supabase/ssr");
      
      const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      });

      // Test 1: getSession (lightweight)
      const { error: sessionError, data: sessionData } = await client.auth.getSession();
      
      diagnostics.supabase_getSession = sessionError 
        ? { status: "ERROR", message: sessionError.message, name: sessionError.name }
        : { status: "OK", has_session: !!sessionData.session };

      // Test 2: Try signIn with test credentials to see the exact error
      const { error: signInError } = await client.auth.signInWithPassword({
        email: "debug-test@ogoutel.com",
        password: "debug-test-nonexistent",
      });

      diagnostics.supabase_signInTest = signInError
        ? { status: "ERROR", message: signInError.message, status_code: signInError.status, name: signInError.name }
        : { status: "OK", note: "Test credentials somehow worked (unexpected)" };
    }
  } catch (err) {
    diagnostics.supabase_connection = {
      status: "EXCEPTION",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    };
  }

  return NextResponse.json(diagnostics);
}
