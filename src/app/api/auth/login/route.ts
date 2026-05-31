// ============================================
// OGOUTEL_Prestige - Server-Side Login API (V3)
// Route : POST /api/auth/login (public)
//
// Enhanced diagnostics for profile lookup.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import env from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    if (!env.SUPABASE_CONFIGURED) {
      return NextResponse.json(
        { success: false, error: "Service non configuré." },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();

    // ─── Auth client (anon) ────────────────────────
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    // 1. Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    const userMeta = authData.user.user_metadata || {};

    // 2. Profile lookup - try ALL methods
    let profile: Record<string, unknown> | null = null;
    const diag: string[] = [];

    // Method A: Direct REST call with service role key (bypasses RLS + SSR cookie issues)
    if (env.SUPABASE_ADMIN_CONFIGURED) {
      try {
        const restUrl = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles`;
        const restRes = await fetch(`${restUrl}?id=eq.${userId}&select=role,hotel_id,full_name,is_active`, {
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (restRes.ok) {
          const restData = await restRes.json();
          if (restData && restData.length > 0) {
            profile = restData[0];
            diag.push('profile_found_via_rest_service_role');
          } else {
            diag.push('profile_empty_via_rest_service_role');
          }
        } else {
          diag.push(`profile_rest_error_${restRes.status}`);
        }
      } catch (err) {
        diag.push(`profile_rest_exception_${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      diag.push('no_service_role_key');
    }

    // Method B: Direct REST with anon key
    if (!profile) {
      try {
        const restUrl = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles`;
        const restRes = await fetch(`${restUrl}?id=eq.${userId}&select=role,hotel_id,full_name,is_active`, {
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (restRes.ok) {
          const restData = await restRes.json();
          if (restData && restData.length > 0) {
            profile = restData[0];
            diag.push('profile_found_via_rest_anon');
          } else {
            diag.push('profile_empty_via_rest_anon');
          }
        } else {
          diag.push(`profile_rest_anon_error_${restRes.status}`);
        }
      } catch (err) {
        diag.push(`profile_rest_anon_exception`);
      }
    }

    // Method C: Fallback to user_metadata from auth
    if (!profile) {
      profile = {
        role: userMeta.role || null,
        hotel_id: userMeta.hotel_id || null,
        full_name: userMeta.full_name || authData.user.email,
        is_active: true,
      };
      diag.push('profile_from_user_metadata_fallback');
    }

    console.log('[api/auth/login] Diagnostics:', {
      user_id: userId,
      user_metadata_role: userMeta.role,
      user_metadata_name: userMeta.full_name,
      profile_methods: diag,
      final_profile: profile,
    });

    // 3. Return success
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        role: profile.role || userMeta.role || null,
        full_name: profile.full_name || userMeta.full_name,
        hotel_id: profile.hotel_id || null,
      },
      redirect: getRedirectPath(profile.role || userMeta.role),
      _diag: diag,
    });

    return response;
  } catch (error) {
    console.error("[api/auth/login] Erreur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

function getRedirectPath(role: string | null | undefined): string {
  if (!role) return "/";
  const paths: Record<string, string> = {
    super_admin: "/super-admin",
    admin_hotel: "/admin",
    gerant: "/staff",
    receptionniste: "/staff",
  };
  return paths[role] || "/";
}
