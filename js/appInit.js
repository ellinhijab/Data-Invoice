(async function () {
  // Minimal init: auth guard + show role + logout hook.
  const user = await window.Auth.requireAuth("login.html");
  if (!user) return;

  const profile = await window.Auth.getMyProfile();
  const role = (profile?.role || "user").toLowerCase();

  // Optional: show email/role
  const infoEl = document.querySelector("#userInfo");
  if (infoEl) infoEl.textContent = `${profile?.email || user.email} (${role})`;

  const logoutBtn = document.querySelector("#btnLogout") || document.querySelector("[data-action='logout']");
  if (logoutBtn) logoutBtn.addEventListener("click", window.Auth.signOut);

  // If app has an invoices list container, we render a basic list so you can verify DB works.
  const listEl = document.querySelector("#invoiceList") || document.querySelector("#invoicesList") || document.querySelector("#invoiceContainer");
  if (!listEl) {
    console.log("[app] No list container (#invoiceList / #invoicesList / #invoiceContainer). DB is ready though.");
    return;
  }

  // Admin can see all (by not filtering user_id); regular user sees own due to RLS, but we can still filter.
  const isAdmin = ["admin","owner"].includes(role);
  let selectedUserId = null;

  // Optional user selector for admin
  const userSelect = document.querySelector("#userSelect");
  if (isAdmin && userSelect && window.sb) {
    const { data: users } = await window.sb.from("profiles").select("user_id,email,role").order("email");
    if (users?.length) {
      userSelect.innerHTML = '<option value="">Semua User</option>' + users.map(u => `<option value="${u.user_id}">${u.email} (${u.role})</option>`).join("");
      userSelect.addEventListener("change", async () => {
        selectedUserId = userSelect.value || null;
        await render();
      });
    }
  }

  async function render() {
    try {
      const items = await window.InvoicesApi.listInvoices({ userId: isAdmin ? selectedUserId : user.id });
      listEl.innerHTML = items.map(i => {
        const paid = Number(i.paid || 0);
        const total = Number(i.total || 0);
        return `<div style="padding:10px;border:1px solid #ddd;margin:8px 0;border-radius:8px">
          <div><b>${i.invoice_no || "(no invoice no)"}</b> — ${i.status}</div>
          <div>Total: ${total} | Paid: ${paid}</div>
          <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
            ${i.pdf_path ? `<button data-open="${i.pdf_path}">Lihat PDF</button>` : ""}
            <button data-del="${i.id}" data-path="${i.pdf_path || ""}">Hapus</button>
          </div>
        </div>`;
      }).join("") || "<div>Belum ada data.</div>";

      listEl.querySelectorAll("button[data-open]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const path = btn.getAttribute("data-open");
          const url = await window.StorageApi.getSignedUrl(path);
          window.open(url, "_blank");
        });
      });

      listEl.querySelectorAll("button[data-del]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-del");
          const path = btn.getAttribute("data-path");
          if (!confirm("Hapus invoice ini?")) return;

          try {
            // Delete DB row first -> get pdf_path from returned row (if any)
            const deleted = await window.InvoicesApi.deleteInvoice(id);
            const p = deleted?.pdf_path || path;
            if (p) await window.StorageApi.removePdf(p);
            await render();
          } catch (e) {
            alert(e.message || String(e));
          }
        });
      });
    } catch (e) {
      console.error(e);
      listEl.innerHTML = `<div style="color:red">Error load invoices: ${e.message || e}</div>`;
    }
  }

  await render();
})();
