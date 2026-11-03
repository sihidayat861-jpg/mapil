"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const css = `
.nv-nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid #e5e7eb;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.nv-inner{max-width:1120px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.nv-brand{display:flex;align-items:center;gap:10px;font-size:19px;font-weight:800;color:#0f172a;text-decoration:none}
.nv-logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:18px}
.nv-brand span.nv-accent{color:#4f46e5}
.nv-menu{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nv-link{font-size:14px;font-weight:600;color:#475569;text-decoration:none;padding:8px 12px;border-radius:10px;transition:background .15s,color .15s}
.nv-link:hover{background:#eef2ff;color:#4f46e5}
.nv-cta{font-size:14px;font-weight:700;color:#fff;text-decoration:none;padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 4px 12px rgba(79,70,229,.3);transition:transform .1s,opacity .15s}
.nv-cta:hover{transform:translateY(-1px);opacity:.95}
.nv-user{display:flex;align-items:center;gap:8px;margin-left:8px;padding:5px 6px 5px 12px;border-radius:999px;background:#f8fafc;border:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#334155}
.nv-role{background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;text-transform:capitalize}
.nv-out{border:none;background:#f1f5f9;font-family:inherit;font-size:13px;font-weight:600;color:#334155;padding:7px 14px;border-radius:999px;cursor:pointer;transition:background .15s}
.nv-out:hover{background:#fee2e2;color:#b91c1c}
@media(max-width:640px){.nv-user .nv-name{display:none}}
`;

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  function keluar() {
    logout();
    router.replace("/login");
  }

  return (
    <nav className="nv-nav">
      <style>{css}</style>
      <div className="nv-inner">
        <Link href="/" className="nv-brand">
        
          <span>
            Tiket<span className="nv-accent">Konser</span>
          </span>
        </Link>

        <div className="nv-menu">
          {!loading && !user && (
            <>
              <Link href="/login" className="nv-link">Masuk</Link>
              <Link href="/register" className="nv-cta">Daftar</Link>
            </>
          )}

          {user?.role === "user" && (
            <Link href="/pesanan" className="nv-link">Pesanan Saya</Link>
          )}

          {user?.role === "admin" && (
            <>
              <Link href="/admin/konser" className="nv-link">Kelola Konser</Link>
              <Link href="/admin/pemesanan" className="nv-link">Pemesanan</Link>
            </>
          )}

          {user && (
            <div className="nv-user">
              <span className="nv-name">{user.nama}</span>
              <span className="nv-role">{user.role}</span>
              <button onClick={keluar} className="nv-out">Keluar</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}