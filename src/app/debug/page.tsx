// ============================================
// OGOUTEL_Prestige - Client-Side Debug Page
// Route : /debug (public, no auth)
// Shows Supabase connection diagnostics
// DELETE AFTER DEBUGGING
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugPage() {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      const diag: Record<string, unknown> = {};

      // 1. Check environment variables (public ones only)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      diag.step1_env_vars = {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || '(EMPTY - NOT SET)',
        url_length: supabaseUrl.length,
        url_starts_https: supabaseUrl.startsWith('https://'),
        url_contains_supabase_co: supabaseUrl.includes('.supabase.co'),
        url_has_trailing_slash: supabaseUrl.endsWith('/'),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 15)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 10)}` : '(EMPTY - NOT SET)',
        key_length: supabaseAnonKey.length,
        key_starts_eyJ: supabaseAnonKey.startsWith('eyJ'),
      };

      // 2. Validate URL format
      const urlErrors: string[] = [];
      if (!supabaseUrl) urlErrors.push('CRITICAL: URL is empty');
      else {
        if (!supabaseUrl.startsWith('https://')) urlErrors.push('Does not start with https://');
        if (!supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('.supabase.in')) urlErrors.push('Does not contain .supabase.co');
        if (supabaseUrl.includes('dashboard') || supabaseUrl.includes('supabase.com/')) urlErrors.push('Looks like dashboard URL, NOT project API URL');
        if (supabaseUrl.includes('"') || supabaseUrl.includes("'") || supabaseUrl.includes(' ')) urlErrors.push('Contains invalid characters (quotes/spaces)');
        if (supabaseUrl.endsWith('/')) urlErrors.push('Has trailing slash');
      }

      if (!supabaseAnonKey) urlErrors.push('CRITICAL: Anon key is empty');
      else {
        if (!supabaseAnonKey.startsWith('eyJ')) urlErrors.push('Does not start with eyJ (JWT format)');
        if (supabaseAnonKey.length < 100) urlErrors.push('Too short (expected ~200 chars)');
      }

      diag.step2_url_validation = urlErrors.length > 0 ? urlErrors : ['URL and key format look correct'];

      // 3. Test Supabase Auth API connectivity
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const cleanUrl = supabaseUrl.replace(/\/$/, '');
          
          // Health check
          const healthRes = await fetch(`${cleanUrl}/auth/v1/health`, {
            method: 'GET',
            headers: { 'apikey': supabaseAnonKey },
          });
          
          diag.step3_health_check = {
            status: healthRes.status,
            ok: healthRes.ok,
            statusText: healthRes.statusText,
          };

          // Auth test (will fail with bad credentials, but proves connection works)
          const authRes = await fetch(`${cleanUrl}/auth/v1/token?grant_type=password`, {
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

          let authData: Record<string, unknown> = {};
          try {
            authData = await authRes.json();
          } catch {
            authData = { raw_body: '(could not parse)' };
          }

          diag.step4_auth_test = {
            http_status: authRes.status,
            supabase_error: authData.msg || authData.error_description || authData.error || null,
            error_code: authData.error_code || authData.code || null,
            raw_response: authData,
          };

          // Interpret results
          if (healthRes.ok && authRes.status === 401 && (authData.msg === 'Invalid login credentials' || String(authData.error_description || '').includes('Invalid login credentials'))) {
            diag.conclusion = '✅ SUCCESS: Supabase is reachable and working. The "Invalid login credentials" error is EXPECTED (we used a fake account). The real login issue might be wrong email/password or unconfirmed email.';
          } else if (!healthRes.ok) {
            diag.conclusion = `❌ FAIL: Supabase health check returned ${healthRes.status}. The URL might be wrong or Supabase is down.`;
          } else {
            diag.conclusion = `⚠️ UNEXPECTED: Health=${healthRes.status}, Auth=${authRes.status}. Check raw_response for details.`;
          }

        } catch (err) {
          diag.step3_health_check = { error: err instanceof Error ? err.message : String(err) };
          diag.conclusion = `❌ FAIL: Could not connect to Supabase at all. Error: ${err instanceof Error ? err.message : String(err)}`;
          if (String(diag.step3_health_check.error || '').includes('Failed to fetch') || String(diag.step3_health_check.error || '').includes('NetworkError')) {
            diag.conclusion += '. This usually means the Supabase URL is WRONG (e.g., dashboard URL instead of project API URL).';
          }
        }
      } else {
        diag.conclusion = '❌ SKIP: Cannot test - URL or key is empty.';
      }

      setResults(diag);
      setLoading(false);
    }

    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">🔍 OGOUTEL_Prestige - Diagnostic Supabase</h1>
        <p className="text-sm text-gray-500">
          Cette page teste la connexion Supabase depuis votre navigateur.
          Copiez le résultat JSON ci-dessous et envoyez-le au développeur.
        </p>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Analyse en cours...
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Résultats complets</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conclusion</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={String(results.conclusion || '').startsWith('✅') ? 'default' : 'destructive'}>
                  {String(results.conclusion || 'Pas de résultat')}
                </Badge>
              </CardContent>
            </Card>
          </>
        )}

        <p className="text-xs text-gray-400 text-center">
          ⚠️ Page temporaire de diagnostic. À supprimer après le débogage.
        </p>
      </div>
    </div>
  );
}
