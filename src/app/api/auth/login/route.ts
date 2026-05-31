// ============================================
// OGOUTEL_Prestige - Server-Side Login API
// Route : POST /api/auth/login (public)
//
// Handles authentication server-side so the client
// doesn't need NEXT_PUBLIC_* env vars baked in.
// Returns a session cookie via Set-Cookie header.
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
          },
        },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();

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

    // 2. Get user profile (role, hotel, etc.)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, hotel_id, full_name, is_active")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      // Sign out since we can't determine role
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: "Profil non trouvé. Contactez le support." },
        { status: 403 }
      );
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
        role: profile.role,
        full_name: profile.full_name,
        hotel_id: profile.hotel_id,
      },
      redirect: getRedirectPath(profile.role),
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

function getRedirectPath(role: string): string {
  const paths: Record<string, string> = {
    super_admin: "/super-admin",
    admin_hotel: "/admin",
    gerant: "/staff",
    receptionniste: "/staff",
  };
  return paths[role] || "/";
}
