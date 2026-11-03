"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/ui";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) errors.email = "Email wajib diisi";
    else if (!email.includes("@")) errors.email = "Format email tidak valid";

    if (!password) errors.password = "Password wajib diisi";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setError("");
    setBusy(true);

    try {
      const user = await login(email.trim(), password);
      router.replace(user.role === "admin" ? "/admin/konser" : "/");
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Masuk</h1>
        <p className={styles.subtitle}>Selamat datang kembali.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div role="alert" className={styles.alert}>
              {error}
            </div>
          )}

          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}

          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}

          <button type="submit" disabled={busy} className={styles.button}>
            {busy ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className={styles.footer}>
          Belum punya akun?{" "}
          <Link href="/register" className={styles.link}>
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}