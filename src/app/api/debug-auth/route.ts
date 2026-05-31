// ============================================
// OGOUTEL_Prestige - Debug Auth API
// Temporary endpoint to diagnose auth issues
// DELETE THIS AFTER DEBUGGING
// ============================================

import { NextResponse } from "next/server";
import env from "@/lib/env";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_env: env.NODE_ENV,
    supabase_url_set: !!env.SUPABASE_URL,
    supabase_url_prefix: env.SUPABASE_URL ? env.SUPABASE_URL.substring(0, 20) + "..." : "NOT SET",
    supabase_anon_key_set: !!env.SUPABASE_ANON_KEY,
    supabase_anon_key_prefix: env.SUPABASE_ANON_KEY ? env.SUPABASE_ANON_KEY.substring(0, 10) + "..." : "NOT SET",
    supabase_service_key_set: !!env.SUPABASE_SERVICE_ROLE_KEY,
    resend_configured: env.RESEND_CONFIGURED,
    app_url: env.APP_URL,
    app_name: env.APP_NAME,
    admin_email: env.ADMIN_EMAIL,
    // Check raw env vars too
    raw_next_public_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    raw_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    raw_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Try to connect to Supabase
  try {
    const { createClient } = await import("@supabase/ssr");
    
    if (!env.SUPABASE_CONFIGURED) {
      diagnostics.supabase_connection = "SKIP - not configured";
    } else {
      const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      });

      // Try a simple health check
      const { error, data } = await client.auth.getSession();
      
      diagnostics.supabase_connection = error 
        ? { status: "ERROR", message: error.message, name: error.name }
        : { status: "OK", has_session: !!data.session };
    }
  } catch (err) {
    diagnostics.supabase_connection = {
      status: "EXCEPTION",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(diagnostics);
}
