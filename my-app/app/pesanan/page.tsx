"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errMsg, rupiah, tgl } from "@/lib/ui";
import s from "./pemesanan.module.css"; // salin file CSS-nya ke folder ini, atau sesuaikan path

type Pesanan = {
  id: number;
  jumlah: number;
  total_harga: number | string;
  status: "pending" | "lunas" | "batal";
  tanggal_pesan?: string;
  nama_konser: string;
  lokasi: string;
  tanggal: string;
};

const kartuClass: Record<string, string> = {
  pending: s.cardPending,
  lunas: s.cardLunas,
  batal: s.cardBatal,
};
const badgeClass: Record<string, string> = {
  pending: s.pending,
  lunas: s.lunas,
  batal: s.batal,
};

export default function PesananSaya() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  async function load() {
    try {
      setList(await api<Pesanan[]>("/pemesanan"));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function batal(id: number) {
    if (!confirm("Batalkan pesanan ini? Tiket akan dikembalikan ke kuota.")) return;
    setError("");
    setSukses("");
    setBusyId(id);
    try {
      await api(`/pemesanan/${id}/batal`, { method: "PUT" });
      setSukses("Pesanan dibatalkan");
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !user || loading) {
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
          <h1 className={s.heroTitle}>Pesanan Saya 🎟️</h1>
          <p className={s.heroText}>Pantau status pesanan tiket konsermu.</p>
        </section>

        {error && <div className={s.error}>{error}</div>}
        {sukses && <div className={s.success}>{sukses}</div>}

        {list.length === 0 ? (
          <div className={s.empty}>Kamu belum punya pesanan.</div>
        ) : (
          <div className={s.list}>
            {list.map((p) => (
              <div key={p.id} className={`${s.card} ${kartuClass[p.status] ?? ""}`}>
                <div className={s.body}>
                  <h3 className={s.name}>{p.nama_konser}</h3>
                  <p className={s.meta}>
                    📍 {p.lokasi} · 📅 {tgl(p.tanggal)}
                  </p>
                  <p className={s.sum}>
                    {p.jumlah} tiket ·<b>{rupiah(Number(p.total_harga))}</b>
                  </p>
                  <p className={s.date}>
                    #{p.id}
                    {p.tanggal_pesan ? ` · Dipesan ${tgl(p.tanggal_pesan)}` : ""}
                  </p>
                </div>

                <div className={s.side}>
                  <span className={`${s.badge} ${badgeClass[p.status] ?? ""}`}>
                    {p.status}
                  </span>
                  <div className={s.actions}>
                    {p.status === "pending" && (
                      <button
                        className={s.cancel}
                        disabled={busyId === p.id}
                        onClick={() => batal(p.id)}
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}