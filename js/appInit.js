(async function () {
  const sb = window.sb;
  if (!sb) return;

  // require login
  const { data } = await sb.auth.getSession();
  if (!data?.session?.user) {
    window.location.href = "login.html";
    return;
  }

  // pakai SDK supabase
  if (window.supabaseDataSdk) {
    window.dataSdk = window.supabaseDataSdk;
  }

  // jalankan initApp milik UI kamu (yang handle render/count/filter)
  if (typeof window.initApp === "function") {
    try { await window.initApp(); } catch (e) { console.error("initApp error:", e); }
  }

  // inject logout button kalau UI belum punya
  if (!document.getElementById("btnLogout")) {
    const b = document.createElement("button");
    b.id = "btnLogout";
    b.textContent = "Logout";
    b.style.position = "fixed";
    b.style.top = "16px";
    b.style.right = "16px";
    b.style.zIndex = "9999";
    b.style.padding = "10px 14px";
    b.style.borderRadius = "12px";
    b.style.background = "#ef4444";
    b.style.color = "white";
    b.style.fontWeight = "700";
    b.style.boxShadow = "0 10px 20px rgba(0,0,0,.15)";
    document.body.appendChild(b);
  }

  document.getElementById("btnLogout")?.addEventListener("click", async () => {
    await sb.auth.signOut();
    window.location.href = "login.html";
  });
})();
