"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type Konser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errMsg, rupiah } from "@/lib/ui";
import s from "./homepage.module.css";

// Bentuk data asli dari tabel MySQL
type BarisKonser = {
  id: number;
  nama: string;
  deskripsi: string | null;
  harga: number;
  jumlah: number;
};

function DaftarKonser() {
  const [list, setList] = useState<Konser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [hanyaTersedia, setHanyaTersedia] = useState(false);

  useEffect(() => {
    let aktif = true;
    api<BarisKonser[]>("/konser")
      .then((data) => {
        if (!aktif) return;
        const rows = Array.isArray(data) ? data : [];
        setList(
          rows.map((r) => ({
            id: r.id,
            nama: r.nama,
            lokasi: r.deskripsi ?? "",
            tanggal: "",
            harga: r.harga,
            kuota: r.jumlah,
          }))
        );
      })
      .catch((e) => {
        if (aktif) setError(errMsg(e));
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return list.filter(
      (k) =>
        (!hanyaTersedia || k.kuota > 0) &&
        (!t ||
          k.nama.toLowerCase().includes(t) ||
          k.lokasi.toLowerCase().includes(t))
    );
  }, [list, q, hanyaTersedia]);

  return (
    <div className={s.wrap}>
      <div className={s.container}>
        <section className={s.hero}>
          <h1 className={s.heroTitle}>Pesan tiket konser favoritmu </h1>
          <p className={s.heroText}>
            Lihat daftar konser dan amankan tiketmu sekarang.
          </p>
        </section>

        <div className={s.bar}>
          <h2 className={s.barTitle}>Daftar Konser</h2>
        </div>

        {error && <div className={s.error}>{error}</div>}
        {loading && <p className={s.loading}>Memuat...</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className={s.empty}>
            {list.length === 0
              ? "Belum ada konser."
              : "Tidak ada konser yang cocok."}
          </div>
        )}

        <div className={s.grid}>
          {filtered.map((k) => {
            const habis = k.kuota <= 0;
            return (
              <Link key={k.id} href={`/konser/${k.id}`} className={s.card}>
                <div className={s.cover}>
                  <span className={`${s.badge} ${habis ? s.badgeHabis : ""}`}>
                    {habis ? "Habis" : `Sisa ${k.kuota} tiket`}
                  </span>
                </div>
                <div className={s.body}>
                  <h3 className={s.name}>{k.nama}</h3>
                  <p className={s.meta}>{k.lokasi}</p>
                  <div className={s.foot}>
                    <span className={s.price}>{rupiah(k.harga)}</span>
                    <span className={s.cta}>
                      {habis ? "Lihat detail →" : "Lihat & Pesan →"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === "admin") router.replace("/admin/konser");
  }, [loading, user, router]);

  if (loading || user?.role === "admin") {
    return (
      <div className={s.wrap}>
        <p className={s.loading}>Memuat...</p>
      </div>
    );
  }

  return <DaftarKonser />;
}