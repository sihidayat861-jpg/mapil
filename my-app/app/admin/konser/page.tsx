"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, type Konser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errMsg, rupiah, tgl } from "@/lib/ui";
import s from "./admin.module.css";

type Form = {
  nama: string;
  lokasi: string;
  tanggal: string; // format datetime-local: 2026-12-20T19:00
  harga: string;
  kuota: string;
};

const kosong: Form = { nama: "", lokasi: "", tanggal: "", harga: "", kuota: "" };

// ISO dari server -> nilai untuk input datetime-local (waktu lokal)
function keInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminKonser() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<Konser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [form, setForm] = useState<Form>(kosong);
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Hanya admin yang boleh masuk
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "admin") router.replace("/");
  }, [authLoading, user, router]);

  async function load() {
    try {
      setList(await api<Konser[]>("/konser"));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  function ubah(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function mulaiEdit(k: Konser) {
    setEditId(k.id);
    setForm({
      nama: k.nama,
      lokasi: k.lokasi,
      tanggal: keInput(k.tanggal),
      harga: String(k.harga),
      kuota: String(k.kuota),
    });
    setError("");
    setSukses("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function batalEdit() {
    setEditId(null);
    setForm(kosong);
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSukses("");
    setBusy(true);
    try {
      const body = JSON.stringify({
        nama: form.nama.trim(),
        lokasi: form.lokasi.trim(),
        tanggal: form.tanggal.replace("T", " ") + ":00",
        harga: Number(form.harga),
        kuota: Number(form.kuota),
      });
      if (editId) {
        await api(`/konser/${editId}`, { method: "PUT", body });
        setSukses("Konser berhasil diperbarui");
      } else {
        await api("/konser", { method: "POST", body });
        setSukses("Konser berhasil dibuat");
      }
      batalEdit();
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  async function hapus(k: Konser) {
    if (!confirm(`Hapus konser "${k.nama}"?`)) return;
    setError("");
    setSukses("");
    try {
      await api(`/konser/${k.id}`, { method: "DELETE" });
      setSukses("Konser dihapus");
      if (editId === k.id) batalEdit();
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  if (authLoading || user?.role !== "admin" || loading) {
    return (
      <div className={s.wrap}>
        <p className={s.loading}>Memuat...</p>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.container}>
        <section className={s.hero}>
          <h1 className={s.heroTitle}>Kelola Konser 🛠️</h1>
          <p className={s.heroText}>Tambah, ubah, dan hapus tiket konser.</p>
        </section>

        {error && <div className={s.error}>{error}</div>}
        {sukses && <div className={s.success}>{sukses}</div>}

        <form className={s.formCard} onSubmit={simpan}>
          <h2 className={s.formTitle}>
            {editId ? "Ubah Konser" : "Tambah Konser Baru"}
          </h2>

          <div className={s.formGrid}>
            <div className={s.full}>
              <label className={s.label}>Nama konser</label>
              <input
                required
                className={s.input}
                value={form.nama}
                onChange={(e) => ubah("nama", e.target.value)}
                placeholder="Contoh: Konser Jazz"
              />
            </div>

            <div>
              <label className={s.label}>Lokasi</label>
              <input
                required
                className={s.input}
                value={form.lokasi}
                onChange={(e) => ubah("lokasi", e.target.value)}
                placeholder="Jakarta"
              />
            </div>

            <div>
              <label className={s.label}>Tanggal & jam</label>
              <input
                required
                type="datetime-local"
                className={s.input}
                value={form.tanggal}
                onChange={(e) => ubah("tanggal", e.target.value)}
              />
            </div>

            <div>
              <label className={s.label}>Harga per tiket (Rp)</label>
              <input
                required
                type="number"
                min={0}
                className={s.input}
                value={form.harga}
                onChange={(e) => ubah("harga", e.target.value)}
                placeholder="150000"
              />
            </div>

            <div>
              <label className={s.label}>Kuota tiket</label>
              <input
                required
                type="number"
                min={0}
                step={1}
                className={s.input}
                value={form.kuota}
                onChange={(e) => ubah("kuota", e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className={s.actions}>
            <button className={s.button} disabled={busy}>
              {busy ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Konser"}
            </button>
            {editId && (
              <button type="button" className={s.ghost} onClick={batalEdit}>
                Batal
              </button>
            )}
          </div>
        </form>

        <div className={s.bar}>
          <h2 className={s.barTitle}>Daftar Konser</h2>
          <span className={s.count}>{list.length} konser</span>
        </div>

        {list.length === 0 ? (
          <div className={s.empty}>Belum ada konser.</div>
        ) : (
          <div className={s.list}>
            {list.map((k) => (
              <div key={k.id} className={s.card}>
                <div className={s.cover}>🎤</div>
                <div className={s.body}>
                  <h3 className={s.name}>{k.nama}</h3>
                  <p className={s.meta}>
                    📍 {k.lokasi} · 📅 {tgl(k.tanggal)}
                  </p>
                  <p className={s.meta}>
                    <b className={s.price}>{rupiah(k.harga)}</b> · Sisa {k.kuota} tiket
                  </p>
                </div>
                <div className={s.side}>
                  <button className={s.edit} onClick={() => mulaiEdit(k)}>
                    Ubah
                  </button>
                  <button className={s.del} onClick={() => hapus(k)}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}