// ============================================
// OGOUTEL_Prestige - Server-Side Login API (V2)
// Route : POST /api/auth/login (public)
//
// Handles authentication server-side so the client
// doesn't need NEXT_PUBLIC_* env vars baked in.
// Uses service role key for profile lookup to bypass RLS.
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

    // Check Supabase configuration
    if (!env.SUPABASE_CONFIGURED) {
      return NextResponse.json(
        {
          success: false,
          error: "Service d'authentification non configuré.",
          debug: {
            url_set: !!env.SUPABASE_URL,
            key_set: !!env.SUPABASE_ANON_KEY,
            service_key_set: !!env.SUPABASE_SERVICE_ROLE_KEY,
          },
        },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();

    // ─── Supabase client (anon) for auth ────────────────────────
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: authError.message,
          code: (authError as Record<string, unknown>).code || null,
        },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // 2. Get user profile using SERVICE ROLE KEY (bypasses RLS)
    //    The anon key might not have RLS access to profiles table
    let profile: Record<string, unknown> | null = null;

    if (env.SUPABASE_ADMIN_CONFIGURED) {
      // Use service role client for profile lookup (bypasses RLS)
      const adminClient = createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        cookies: {
          getAll() { return []; },
          setAll() { /* no cookies for admin */ },
        },
      });

      const { data: profileData, error: profileError } = await adminClient
        .from("profiles")
        .select("role, hotel_id, full_name, is_active")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("[api/auth/login] Profile error (admin):", profileError.message);
      } else {
        profile = profileData;
      }
    }

    // Fallback: try with anon client (in case service key not available)
    if (!profile) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, hotel_id, full_name, is_active")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("[api/auth/login] Profile error (anon):", profileError.message);
      } else {
        profile = profileData;
      }
    }

    // Fallback: use user_metadata from auth if no profile found
    if (!profile) {
      const userMeta = authData.user.user_metadata || {};
      profile = {
        role: userMeta.role || null,
        hotel_id: userMeta.hotel_id || null,
        full_name: userMeta.full_name || authData.user.email,
        is_active: userMeta.is_active !== false,
      };
    }

    // 3. Check if account is active
    if (profile.is_active === false) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: "Votre compte a été désactivé. Contactez le support." },
        { status: 403 }
      );
    }

    // 4. Return success with user info (NO sensitive data)
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        role: profile.role || authData.user.user_metadata?.role || null,
        full_name: profile.full_name || authData.user.user_metadata?.full_name,
        hotel_id: profile.hotel_id || null,
      },
      redirect: getRedirectPath(profile.role || authData.user.user_metadata?.role),
    });

    return response;
  } catch (error) {
    console.error("[api/auth/login] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur. Veuillez réessayer.",
      },
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
