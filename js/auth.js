(function () {
  async function requireSupabase() {
    if (!window.sb) throw new Error("Supabase client belum siap. Cek js/config.js dan script supabase-js.");
    return window.sb;
  }

  async function getSession() {
    const sb = await requireSupabase();
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function requireAuth(redirectTo = "login.html") {
    const session = await getSession();
    if (!session?.user) {
      window.location.href = redirectTo;
      return null;
    }
    return session.user;
  }

  async function getMyProfile() {
    const sb = await requireSupabase();
    const session = await getSession();
    if (!session?.user) return null;

    const { data, error } = await sb
      .from("profiles")
      .select("user_id,email,role")
      .eq("user_id", session.user.id)
      .single();

    // kalau profile belum kebentuk (jarang), fallback
    if (error) {
      console.warn("[profiles] fetch error:", error.message);
      return { user_id: session.user.id, email: session.user.email, role: "user" };
    }
    return data;
  }

  async function isAdmin() {
    const p = await getMyProfile();
    return ["admin", "owner"].includes((p?.role || "user").toLowerCase());
  }

  async function signOut() {
    const sb = await requireSupabase();
    await sb.auth.signOut();
    window.location.href = "login.html";
  }

  window.Auth = { getSession, requireAuth, getMyProfile, isAdmin, signOut };
})();
