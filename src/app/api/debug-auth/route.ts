// ============================================
// OGOUTEL_Prestige - Debug Auth API v2
// Affiche les infos de diagnostic Supabase
// Route publique (pas d'auth requise)
// ============================================

import { NextResponse } from "next/server";

// Access raw env vars directly (bypass centralized config for debugging)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';

export async function GET() {
  // 1. Environment diagnostics
  const envInfo = {
    supabase_url_is_set: supabaseUrl.length > 0,
    supabase_url_starts_https: supabaseUrl.startsWith('https://'),
    supabase_url_starts_correct: supabaseUrl.includes('.supabase.co'),
    supabase_url_has_trailing_slash: supabaseUrl.endsWith('/'),
    supabase_url_first_30_chars: supabaseUrl ? supabaseUrl.substring(0, 30) : '(empty)',
    supabase_url_last_20_chars: supabaseUrl.length > 20 ? supabaseUrl.substring(supabaseUrl.length - 20) : supabaseUrl,
    supabase_url_length: supabaseUrl.length,
    supabase_anon_key_is_set: supabaseAnonKey.length > 0,
    supabase_anon_key_starts_eyJ: supabaseAnonKey.startsWith('eyJ'),
    supabase_anon_key_length: supabaseAnonKey.length,
    service_key_is_set: serviceKey.length > 0,
    service_key_starts_eyJ: serviceKey.startsWith('eyJ'),
    node_env: process.env.NODE_ENV || 'development',
    // Raw checks
    raw_next_public_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    raw_next_public_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // 2. URL validation checks
  const urlChecks: string[] = [];
  if (!supabaseUrl) {
    urlChecks.push('CRITICAL: Supabase URL is EMPTY');
  } else {
    if (!supabaseUrl.startsWith('https://')) urlChecks.push('ERROR: URL does not start with https://');
    if (!supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('.supabase.in')) urlChecks.push('ERROR: URL does not contain .supabase.co or .supabase.in');
    if (supabaseUrl.includes('supabase.com') || supabaseUrl.includes('dashboard')) urlChecks.push('ERROR: URL looks like a dashboard URL, not the project API URL');
    if (supabaseUrl.includes(' ')) urlChecks.push('ERROR: URL contains spaces');
    if (supabaseUrl.includes('"') || supabaseUrl.includes("'")) urlChecks.push('ERROR: URL contains quotes');
    if (supabaseUrl.endsWith('/')) urlChecks.push('WARNING: URL has trailing slash');
    if (supabaseUrl.length < 25) urlChecks.push('ERROR: URL is too short (should be ~40 chars)');
  }

  if (!supabaseAnonKey) {
    urlChecks.push('CRITICAL: Anon key is EMPTY');
  } else {
    if (!supabaseAnonKey.startsWith('eyJ')) urlChecks.push('ERROR: Anon key does not start with eyJ (JWT format expected)');
    if (supabaseAnonKey.length < 100) urlChecks.push('ERROR: Anon key is too short (should be ~200 chars)');
  }

  // 3. Try actual connection to Supabase
  let connectionResult: Record<string, unknown> = {};
  
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.includes('.supabase')) {
    try {
      // Test 1: Simple health check via fetch
      const authEndpoint = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`;
      const healthResponse = await fetch(authEndpoint, {
        method: 'GET',
        headers: { 'apikey': supabaseAnonKey },
      });
      connectionResult.health_check = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        statusText: healthResponse.statusText,
      };

      // Test 2: Try actual signIn (will fail with "Invalid credentials" which is expected)
      const signInEndpoint = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`;
      const signInResponse = await fetch(signInEndpoint, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'debug_test_nonexistent@ogoutel.com',
          password: 'debug_test_nonexistent',
        }),
      });

      const signInData = await signInResponse.json().catch(() => ({}));
      connectionResult.signin_test = {
        http_status: signInResponse.status,
        supabase_msg: signInData.msg || signInData.error_description || signInData.error || 'no message',
        error_code: signInData.error_code || signInData.code || null,
      };
    } catch (err) {
      connectionResult.connection_error = {
        message: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'UnknownError',
      };
    }
  }

  return NextResponse.json({
    environment: envInfo,
    url_checks: urlChecks,
    connection: connectionResult,
  });
}
