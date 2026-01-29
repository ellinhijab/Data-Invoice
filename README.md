# Invoice PDF Web App (Supabase)

Ini versi web dari app kamu:
- Login multi-user (Supabase Auth)
- Tiap user hanya lihat invoice milik sendiri (RLS)
- PDF disimpan ke Supabase Storage bucket `invoices`
- Admin/Owner (role = `admin` atau `owner`) bisa lihat semua invoice

## 1) Setup Supabase
1. Buat project baru di Supabase
2. Auth -> Providers: aktifkan **Email** (Email + Password)
3. Storage -> New bucket:
   - Name: `invoices`
   - Private (recommended)
4. SQL Editor -> Run file: `supabase_schema.sql`

### Set role Admin & Owner
Supabase akan otomatis bikin baris di tabel `profiles` saat user mendaftar.

Set role via SQL Editor (jalankan ulang kapan saja):

```sql
update public.profiles set role = 'admin' where email = 'anggunnifa02@gmail.com';
update public.profiles set role = 'owner' where email = 'nasikinputrapraja@gmail.com';
```

> Catatan: perintah di atas baru akan mengubah role setelah akun dengan email tersebut sudah terdaftar.

## 2) Isi config
Edit file `js/config.js`:
- `window.__SUPABASE_URL`
- `window.__SUPABASE_ANON_KEY`

Ambil dari: Project Settings -> API (Project URL + anon public key).

## 3) Jalankan lokal (localhost)
Di folder ini:
```bash
python -m http.server 8080
```
Buka: http://localhost:8080/login.html

> Catatan: kalau hanya localhost, laptop orang lain **tidak bisa** akses kecuali:
> - mereka ada di Wi‑Fi yang sama, dan kamu serve pakai IP LAN kamu, ATAU
> - kamu port-forward / pakai VPN / server publik.
> Paling gampang: deploy ke Cloudflare Pages / Vercel / Netlify.

## 4) Deploy ke Cloudflare Pages + GitHub
- Push folder ini ke GitHub repo
- Cloudflare Pages -> Create project -> connect repo
- Build command: (kosong)
- Output folder: `/` (root)
- Set domain (opsional)

Karena ini static, Cloudflare Pages cuma hosting HTML/JS. Database + storage tetap di Supabase.

## 5) Flow delete invoice
Di app:
- User klik hapus -> app hapus file di Storage dulu -> lalu hapus row DB.
Kalau delete file sukses tapi delete row gagal: file sudah hilang, row masih ada (rare). Bisa retry delete row.

## 6) Limit storage
Limit bergantung plan Supabase kamu. Cek pricing: https://supabase.com/pricing
