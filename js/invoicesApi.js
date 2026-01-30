(function () {
  async function requireSupabase() {
    if (!window.sb) throw new Error("Supabase client belum siap.");
    return window.sb;
  }

  async function listInvoices({ userId = null, from = null, to = null } = {}) {
    const sb = await requireSupabase();
    let q = sb.from("invoices").select("*").order("created_at", { ascending: false });

    if (userId) q = q.eq("user_id", userId);
    if (from) q = q.gte("invoice_date", from);
    if (to) q = q.lte("invoice_date", to);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function createInvoice(payload) {
    const sb = await requireSupabase();
    const { data, error } = await sb.from("invoices").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function deleteInvoice(id) {
    const sb = await requireSupabase();
    const { data, error } = await sb.from("invoices").delete().eq("id", id).select("id,pdf_path").single();
    if (error) throw error;
    return data;
  }

  async function upsertPayment({ invoiceId, amount, note = null }) {
    const sb = await requireSupabase();
    const { data, error } = await sb.from("payments").insert({
      invoice_id: invoiceId,
      amount,
      note
    }).select("*").single();
    if (error) throw error;
    return data;
  }

  window.InvoicesApi = { listInvoices, createInvoice, deleteInvoice, upsertPayment };
})();
