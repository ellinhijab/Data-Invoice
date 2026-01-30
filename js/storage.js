(function () {
  async function requireSupabase() {
    if (!window.sb) throw new Error("Supabase client belum siap.");
    return window.sb;
  }

  function buildPdfPath(userId, invoiceId) {
    // bucket: invoices (private)
    return `${userId}/${invoiceId}.pdf`;
  }

  async function uploadPdf({ userId, invoiceId, file }) {
    const sb = await requireSupabase();
    const path = buildPdfPath(userId, invoiceId);

    const { error } = await sb.storage
      .from("invoices")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: "application/pdf"
      });

    if (error) throw error;
    return path;
  }

  async function removePdf(path) {
    const sb = await requireSupabase();
    const { error } = await sb.storage.from("invoices").remove([path]);
    if (error) throw error;
  }

  async function getSignedUrl(path, expiresIn = 60 * 10) {
    const sb = await requireSupabase();
    const { data, error } = await sb.storage.from("invoices").createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

  window.StorageApi = { buildPdfPath, uploadPdf, removePdf, getSignedUrl };
})();
