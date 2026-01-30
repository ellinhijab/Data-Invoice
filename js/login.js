(async function () {
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  // --- modal helpers ---
  function openModal(el) {
    if (!el) return;
    el.classList.remove("hidden");
    el.classList.add("flex");
  }
  function closeModal(el) {
    if (!el) return;
    el.classList.add("hidden");
    el.classList.remove("flex");
  }

  // --- ensure supabase ready ---
  if (!window.sb) {
    console.error("Supabase client belum siap. Cek js/config.js (SUPABASE_URL harus https://...)");
    return;
  }

  // If already logged in -> app
  try {
    const { data } = await window.sb.auth.getSession();
    if (data?.session?.user) {
      window.location.href = "app.html";
      return;
    }
  } catch (e) {
    console.warn("getSession error:", e?.message || e);
  }

  // --- elements from your UI ---
  const loginFormDesktop = $("#login-form");
  const loginFormMobile  = $("#login-form-mobile");
  const emailDesktop = $("#username-desktop");
  const passDesktop  = $("#password-desktop");
  const emailMobile  = $("#username-mobile");
  const passMobile   = $("#password-mobile");

  const signupModal = $("#signup-modal");
  const forgotModal = $("#forgot-modal");
  const closeSignup = $("#close-signup");
  const closeForgot = $("#close-forgot");

  const signupForm = $("#signup-form");
  const signupEmail = $("#signup-email");
  const signupPass  = $("#signup-password");
  const signupBtn   = $("#signup-btn");

  const forgotForm = $("#forgot-form");
  const forgotEmail = $("#forgot-email");
  const forgotBtn   = $("#forgot-btn");

  // Buttons/bubbles
  const signupBubbles = $all(".signup-bubble, #signup-text, #signup-text-mobile");
  const forgotBubbles = $all(".forgot-bubble, #forgot-text, #forgot-text-mobile");

  // Open modals on bubble click
  signupBubbles.forEach(el => el.addEventListener("click", () => openModal(signupModal)));
  forgotBubbles.forEach(el => el.addEventListener("click", () => openModal(forgotModal)));
  if (closeSignup) closeSignup.addEventListener("click", () => closeModal(signupModal));
  if (closeForgot) closeForgot.addEventListener("click", () => closeModal(forgotModal));

  // --- LOGIN handlers ---
  async function doLogin(email, password) {
    if (!email || !password) return alert("Isi email & kata sandi dulu.");
    const { error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.location.href = "app.html";
  }

  if (loginFormDesktop) {
    loginFormDesktop.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await doLogin((emailDesktop?.value||"").trim(), (passDesktop?.value||"").trim()); }
      catch (err) { alert(err.message || String(err)); }
    });
  }

  if (loginFormMobile) {
    loginFormMobile.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await doLogin((emailMobile?.value||"").trim(), (passMobile?.value||"").trim()); }
      catch (err) { alert(err.message || String(err)); }
    });
  }

  // --- SIGNUP handler ---
  async function doSignup(email, password) {
    if (!email || !password) return alert("Isi email & kata sandi dulu.");
    const { error } = await window.sb.auth.signUp({ email, password });
    if (error) throw error;

    alert("Akun berhasil dibuat. Silakan login. (Kalau email confirmation aktif, cek email.)");
    closeModal(signupModal);
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await doSignup((signupEmail?.value||"").trim(), (signupPass?.value||"").trim()); }
      catch (err) { alert(err.message || String(err)); }
    });
  }
  if (signupBtn && !signupForm) {
    signupBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try { await doSignup((signupEmail?.value||"").trim(), (signupPass?.value||"").trim()); }
      catch (err) { alert(err.message || String(err)); }
    });
  }

  // --- FORGOT PASSWORD handler ---
  async function doForgot(email) {
    if (!email) return alert("Isi email dulu.");
    const { error } = await window.sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/reset-password.html")
    });
    if (error) throw error;
    alert("Link reset password sudah dikirim ke email.");
    closeModal(forgotModal);
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await doForgot((forgotEmail?.value||"").trim()); }
      catch (err) { alert(err.message || String(err)); }
    });
  }
  if (forgotBtn && !forgotForm) {
    forgotBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try { await doForgot((forgotEmail?.value||"").trim()); }
      catch (err) { alert(err.message || String(err)); }
    });
  }
})();
