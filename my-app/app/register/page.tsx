"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent } from "react";
import type { Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/ui";
import s from "./register.module.css";

const pilihanRole: { value: Role; judul: string; ket: string }[] = [
  { value: "user", judul: "User", ket: "Membeli tiket konser" },
  { value: "admin", judul: "Admin", ket: "Menambah & mengelola konser" },
];

export default function RegisterPage() {
  const { register, login } = useAuth();
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (nama.trim().length < 3) return setError("Nama minimal 3 karakter");
    if (password.length < 8) return setError("Password minimal 8 karakter");

    setBusy(true);
    try {
      await register(nama.trim(), email.trim(), password, role);
      const u = await login(email.trim(), password);
      router.replace(u.role === "admin" ? "/admin/konser" : "/");
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <h1 className={s.title}>Buat Akun</h1>
        <p className={s.subtitle}>Pilih peranmu dan mulai.</p>

        {error && <div className={s.error}>{error}</div>}

        <form onSubmit={submit} className={s.form}>
          <div>
            <span className={s.label}>Daftar sebagai</span>
            <div className={s.roles}>
              {pilihanRole.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`${s.role} ${role === r.value ? s.roleActive : ""}`}
                >
                  <span className={s.roleTitle}>{r.judul}</span>
                  <span className={s.roleDesc}>{r.ket}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={s.label}>Nama</label>
            <input required minLength={3} value={nama}
              onChange={(e) => setNama(e.target.value)}
              className={s.input} placeholder="Nama lengkap" autoComplete="name" />
          </div>

          <div>
            <label className={s.label}>Email</label>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={s.input} placeholder="nama@email.com" autoComplete="email" />
          </div>

          <div>
            <label className={s.label}>Password</label>
            <input type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={s.input} placeholder="••••••••" autoComplete="new-password" />
            <p className={s.hint}>Minimal 8 karakter.</p>
          </div>

          <button disabled={busy} className={s.button}>
            {busy ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className={s.footer}>
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </p>
      </div>
    </div>
  );
}