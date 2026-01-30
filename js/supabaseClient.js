/* global supabase */
(function () {
  const url = (window.SUPABASE_URL || "").trim();
  const key = (window.SUPABASE_ANON_KEY || "").trim();

  if (!url || !key) {
    console.warn("[Supabase] SUPABASE_URL / SUPABASE_ANON_KEY belum diisi di js/config.js");
    window.sb = null;
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("[Supabase] supabase-js belum ke-load. Pastikan script CDN @supabase/supabase-js ada sebelum supabaseClient.js");
    window.sb = null;
    return;
  }

  window.sb = window.supabase.createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  console.log("[Supabase] client ready");
})();
