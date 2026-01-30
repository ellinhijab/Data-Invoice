(async function () {
  function $(sel) { return document.querySelector(sel); }

  // If already logged in, go to app
  if (window.Auth?.getSession) {
    try {
      const s = await window.Auth.getSession();
      if (s?.user) {
        window.location.href = "app.html";
        return;
      }
    } catch (_) {}
  }

  const form = $("#loginForm") || $("form");
  const emailEl = $("#email") || $("input[type='email']");
  const passEl = $("#password") || $("input[type='password']");
  const loginBtn = $("#btnLogin") || $("button[type='submit']");

  if (!form || !emailEl || !passEl) {
    console.warn("[login] Elemen form/email/password tidak ditemukan. Sesuaikan id: loginForm, email, password.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl.value || "").trim();
    const password = (passEl.value || "").trim();
    if (!email || !password) return alert("Isi email & password dulu.");

    try {
      if (!window.sb) return alert("Supabase belum siap. Cek js/config.js");
      const { error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "app.html";
    } catch (err) {
      alert(err.message || String(err));
    }
  });

  // Optional register button
  const regBtn = $("#btnRegister") || $("#registerBtn") || document.querySelector("[data-action='register']");
  if (regBtn) {
    regBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = (emailEl.value || "").trim();
      const password = (passEl.value || "").trim();
      if (!email || !password) return alert("Isi email & password dulu.");

      try {
        const { error } = await window.sb.auth.signUp({ email, password });
        if (error) throw error;
        alert("Akun dibuat. Silakan login. (Kalau email confirmation aktif, cek email ya.)");
      } catch (err) {
        alert(err.message || String(err));
      }
    });
  }
})();
