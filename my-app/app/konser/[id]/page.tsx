"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Konser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errMsg, rupiah, tgl } from "@/lib/ui";
import s from "./detail.module.css";

export default function DetailKonserPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [konser, setKonser] = useState<Konser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [busy, setBusy] = useState(false);
  const [sukses, setSukses] = useState("");

  useEffect(() => {
    let aktif = true;
    api<Konser>(`/konser/${id}`)
      .then((data) => {
        if (aktif) setKonser(data);
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
  }, [id]);

  if (loading) {
    return (
      <div className={s.wrap}>
        <p className={s.state}>Memuat...</p>
      </div>
    );
  }

  if (!konser) {
    return (
      <div className={s.wrap}>
        <div className={s.container}>
          <Link href="/" className={s.back}>← Kembali</Link>
          <div className={s.error}>{error || "Konser tidak ditemukan."}</div>
        </div>
      </div>
    );
  }

  const habis = konser.kuota <= 0;
  const maks = Math.min(konser.kuota, 10);
  const total = konser.harga * jumlah;

  async function pesan() {
    if (!user) {
      router.push("/login");
      return;
    }
    setError("");
    setSukses("");
    setBusy(true);
    try {
      // Sesuaikan endpoint dan body dengan backend Anda
      await api("/pemesanan", {
        method: "POST",
        body: JSON.stringify({ konser_id: konser!.id, jumlah }),
      });
      setSukses("Pesanan berhasil dibuat!");
      setTimeout(() => router.push("/pemesanan"), 800);
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  }

  return (
    <div className={s.wrap}>
      <div className={s.container}>
        <Link href="/" className={s.back}>← Kembali ke daftar konser</Link>

        <div className={s.layout}>
          <div className={s.card}>
            <div className={s.cover}>
              
              <span className={`${s.badge} ${habis ? s.badgeHabis : ""}`}>
                {habis ? "Habis" : `Sisa ${konser.kuota} tiket`}
              </span>
            </div>
            <div className={s.info}>
              <h1 className={s.title}>{konser.nama}</h1>
              <div className={s.rows}>
                <div className={s.row}>
                  <span className={s.rowIcon}></span>
                  <div>
                    <span className={s.rowLabel}>Lokasi</span>
                    <span className={s.rowValue}>{konser.lokasi}</span>
                  </div>
                </div>
                <div className={s.row}>
                  <span className={s.rowIcon}></span>
                  <div>
                    <span className={s.rowLabel}>Tanggal</span>
                    <span className={s.rowValue}>{tgl(konser.tanggal)}</span>
                  </div>
                </div>
                <div className={s.row}>
                  <span className={s.rowIcon}></span>
                  <div>
                    <span className={s.rowLabel}>Kuota tersisa</span>
                    <span className={s.rowValue}>{konser.kuota} tiket</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={s.order}>
            <h2 className={s.orderTitle}>Pesan Tiket</h2>
            <p className={s.price}>
              {rupiah(konser.harga)} <span className={s.priceNote}>/ tiket</span>
            </p>

            {error && <div className={s.error}>{error}</div>}
            {sukses && <div className={s.success}>{sukses}</div>}

            <span className={s.label}>Jumlah tiket</span>
            <div className={s.qty}>
              <button
                type="button"
                className={s.qtyBtn}
                disabled={habis || jumlah <= 1}
                onClick={() => setJumlah((j) => j - 1)}
              >
                −
              </button>
              <span className={s.qtyValue}>{jumlah}</span>
              <button
                type="button"
                className={s.qtyBtn}
                disabled={habis || jumlah >= maks}
                onClick={() => setJumlah((j) => j + 1)}
              >
                +
              </button>
            </div>

            <div className={s.total}>
              <span>Total</span>
              <span className={s.totalValue}>{rupiah(total)}</span>
            </div>

            <button
              className={s.button}
              disabled={habis || busy}
              onClick={pesan}
            >
              {habis ? "Tiket Habis" : busy ? "Memproses..." : "Pesan Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}