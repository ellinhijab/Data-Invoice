(function () {
  const sb = window.sb;
  if (!sb) {
    console.error("[supabaseDataSdk] window.sb belum siap");
    return;
  }

  let _handler = null;

  const toBigInt = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(/[^\d\-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const normalizeItems = (items) => {
    if (!items) return null;
    if (Array.isArray(items)) return items;
    if (typeof items === "string") {
      try { return JSON.parse(items); } catch { return null; }
    }
    return items;
  };

  async function refresh() {
    const { data, error } = await sb
      .from("invoices")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("[supabaseDataSdk] load invoices error:", error);
      return { isOk: false, error };
    }

    const mapped = (data || []).map((row) => ({
      ...row,
      __backendId: row.id,
      items: row.items ?? row.items,
    }));

    _handler?.onDataChanged?.(mapped);
    return { isOk: true, data: mapped };
  }

  const supabaseDataSdk = {
    async init(handler) {
      _handler = handler;
      return await refresh();
    },

    async create(invoiceData, file) {
      try {
        const { data: sess } = await sb.auth.getSession();
        const user = sess?.session?.user;
        if (!user) return { isOk: false, error: { message: "Not logged in" } };

        const id = (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()));
        const userId = user.id;

        const row = {
          id,
          user_id: userId,
          vendor: invoiceData.seller_name || invoiceData.vendor || null,
          invoice_no: invoiceData.invoice_no || null,
          invoice_date: invoiceData.invoice_date || null,
          due_date: invoiceData.due_date || null,

          subtotal_printed: toBigInt(invoiceData.subtotal_printed),
          total_printed: toBigInt(invoiceData.total_printed),
          diff: toBigInt(invoiceData.diff),

          total_paid: toBigInt(invoiceData.total_paid) ?? 0,
          remaining: toBigInt(invoiceData.remaining),

          payment_status: invoiceData.payment_status || "BELUM",
          validation_status: invoiceData.validation_status || null,
          fingerprint: invoiceData.fingerprint || null,

          items: normalizeItems(invoiceData.items),
          notes: invoiceData.notes || null,

          seller_name: invoiceData.seller_name || null,
          seller_address: invoiceData.seller_address || null,
          seller_phone: invoiceData.seller_phone || null,
          seller_email: invoiceData.seller_email || null,
          buyer_name: invoiceData.buyer_name || null,
          terms: invoiceData.terms || null,
          balance_due_printed: toBigInt(invoiceData.balance_due_printed),
          subtotal_computed: toBigInt(invoiceData.subtotal_computed),
        };

        const ins = await sb.from("invoices").insert(row);
        if (ins.error) {
          if (ins.error.code === "23505") return { isOk: false, error: ins.error, duplicate: true };
          return { isOk: false, error: ins.error };
        }

        if (file) {
          const bucket = "invoices";
          const pdfPath = `${userId}/${id}.pdf`;

          const up = await sb.storage
            .from(bucket)
            .upload(pdfPath, file, { contentType: "application/pdf", upsert: false });

          if (up.error) {
            await sb.from("invoices").delete().eq("id", id);
            return { isOk: false, error: up.error };
          }

          const upd = await sb.from("invoices").update({
            pdf_bucket: bucket,
            pdf_path: pdfPath,
            original_filename: file.name,
            file_size: file.size,
          }).eq("id", id);

          if (upd.error) {
            await sb.storage.from(bucket).remove([pdfPath]);
            await sb.from("invoices").delete().eq("id", id);
            return { isOk: false, error: upd.error };
          }
        }

        await refresh();
        return { isOk: true };
      } catch (e) {
        console.error("[supabaseDataSdk] create error:", e);
        return { isOk: false, error: { message: e?.message || String(e) } };
      }
    },

    async update(invoice) {
      try {
        const id = invoice.__backendId || invoice.id;
        if (!id) return { isOk: false, error: { message: "Missing id" } };

        const payload = { ...invoice };
        delete payload.__backendId;

        const { error } = await sb.from("invoices").update(payload).eq("id", id);
        if (error) return { isOk: false, error };

        await refresh();
        return { isOk: true };
      } catch (e) {
        return { isOk: false, error: { message: e?.message || String(e) } };
      }
    },

    async delete(invoice) {
      try {
        const id = invoice.__backendId || invoice.id;
        if (!id) return { isOk: false, error: { message: "Missing id" } };

        const got = await sb.from("invoices").select("pdf_bucket,pdf_path").eq("id", id).single();
        if (got.error && got.error.code !== "PGRST116") {
          return { isOk: false, error: got.error };
        }

        const bucket = got.data?.pdf_bucket || "invoices";
        const path = got.data?.pdf_path;

        const del = await sb.from("invoices").delete().eq("id", id);
        if (del.error) return { isOk: false, error: del.error };

        if (path) {
          const rm = await sb.storage.from(bucket).remove([path]);
          if (rm.error) console.warn("[supabaseDataSdk] remove file warning:", rm.error);
        }

        await refresh();
        return { isOk: true };
      } catch (e) {
        return { isOk: false, error: { message: e?.message || String(e) } };
      }
    },
  };

  window.supabaseDataSdk = supabaseDataSdk;
})();
