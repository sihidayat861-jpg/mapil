export type Role = "admin" | "user";
export type Status = "pending" | "lunas" | "batal";

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
}

export interface Konser {
  id: number;
  nama: string;
  lokasi: string;
  tanggal: string;
  harga: number;
  kuota: number;
}

export interface Pemesanan {
  id: number;
  user_id: number;
  konser_id: number;
  jumlah: number;
  total_harga: number;
  status: Status;
  tanggal_pesan: string;
  nama_konser: string;
  lokasi?: string;
  tanggal?: string;
  nama_user?: string;
  email?: string;
}

const BASE = "http://localhost:5000/api";

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server Express (localhost:5000). Pastikan backend sudah jalan.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `Gagal (${res.status})`);
  }
  return data as T;
}