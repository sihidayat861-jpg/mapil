import "dotenv/config";
import express, { Request, Response, NextFunction, RequestHandler } from "express";
import type { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./connection";

const PORT = 5000;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET belum diisi di file .env");
}
const JWT_SECRET: string = process.env.JWT_SECRET;


interface JwtUser {
  id: number;
  role: "admin" | "user";
}

interface AuthRequest extends Request {
  user?: JwtUser;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

const wrap =
  (fn: (req: AuthRequest, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req as AuthRequest, res).catch(next);
  };

function parseId(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID tidak valid");
  return id;
}
function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function tx<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Batalkan pesanan + kembalikan kuota
async function batalkan(conn: PoolConnection, id: number, userId?: number) {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT * FROM pemesanan WHERE id = ? FOR UPDATE",
    [id]
  );
  const p = rows[0];
  if (!p || (userId !== undefined && p.user_id !== userId)) {
    throw new HttpError(404, "Pemesanan tidak ditemukan");
  }
  if (p.status === "batal") throw new HttpError(400, "Pemesanan sudah dibatalkan");
  if (userId !== undefined && p.status !== "pending") {
    throw new HttpError(400, "Hanya pesanan pending yang bisa dibatalkan");
  }

  await conn.query("UPDATE pemesanan SET status = 'batal' WHERE id = ?", [id]);
  await conn.query("UPDATE konser SET kuota = kuota + ? WHERE id = ?", [p.jumlah, p.konser_id]);
}

function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token tidak ada" });

  try {
    req.user = jwt.verify(token, JWT_SECRET) as JwtUser;
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid atau kedaluwarsa" });
  }
}

function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Hanya admin yang boleh mengakses" });
  }
  next();
}

app.post(
  "/api/register",
  wrap(async (req, res) => {
    const { nama, email, password, role } = req.body ?? {};
    if (!nama || !email || !password) {
      throw new HttpError(400, "Nama, email, dan password wajib diisi");
    }
    if (!isEmail(email)) throw new HttpError(400, "Format email tidak valid");
    if (String(password).length < 6) throw new HttpError(400, "Password minimal 6 karakter");
    if (role !== "admin" && role !== "user") {
      throw new HttpError(400, "Role harus admin atau user");
    }

    const [exist] = await db.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (exist.length > 0) throw new HttpError(409, "Email sudah terdaftar");

    const hash = await bcrypt.hash(String(password), 10);
    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
      [nama, email, hash, role]
    );

    res.status(201).json({ message: "Registrasi berhasil", id: result.insertId });
  })
);
app.post(
  "/api/login",
  wrap(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, "Email dan password wajib diisi");

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    const user = rows[0];
    const ok = user && (await bcrypt.compare(String(password), user.password));
    if (!ok) throw new HttpError(401, "Email atau password salah");

    const payload: JwtUser = { id: user.id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
    });
  })
);

app.get(
  "/api/me",
  auth,
  wrap(async (req, res) => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, nama, email, role FROM users WHERE id = ?",
      [req.user!.id]
    );
    if (!rows[0]) throw new HttpError(404, "User tidak ditemukan");
    res.json(rows[0]);
  })
);


app.get(
  "/api/konser",
  wrap(async (_req, res) => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM konser ORDER BY tanggal ASC"
    );
    res.json(rows);
  })
);

app.get(
  "/api/konser/:id",
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM konser WHERE id = ?", [id]);
    if (!rows[0]) throw new HttpError(404, "Konser tidak ditemukan");
    res.json(rows[0]);
  })
);

app.post(
  "/api/konser",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const { nama, lokasi, tanggal, harga, kuota } = req.body ?? {};
    if (!nama || !lokasi || !tanggal || harga == null || kuota == null) {
      throw new HttpError(400, "nama, lokasi, tanggal, harga, dan kuota wajib diisi");
    }
    if (!(Number(harga) >= 0) || !(Number.isInteger(Number(kuota)) && Number(kuota) >= 0)) {
      throw new HttpError(400, "Harga atau kuota tidak valid");
    }

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO konser (nama, lokasi, tanggal, harga, kuota) VALUES (?, ?, ?, ?, ?)",
      [nama, lokasi, tanggal, Number(harga), Number(kuota)]
    );
    res.status(201).json({ message: "Konser dibuat", id: result.insertId });
  })
);

app.put(
  "/api/konser/:id",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const { nama, lokasi, tanggal, harga, kuota } = req.body ?? {};
    if (!nama || !lokasi || !tanggal || harga == null || kuota == null) {
      throw new HttpError(400, "nama, lokasi, tanggal, harga, dan kuota wajib diisi");
    }

    const [result] = await db.query<ResultSetHeader>(
      "UPDATE konser SET nama = ?, lokasi = ?, tanggal = ?, harga = ?, kuota = ? WHERE id = ?",
      [nama, lokasi, tanggal, Number(harga), Number(kuota), id]
    );
    if (result.affectedRows === 0) throw new HttpError(404, "Konser tidak ditemukan");
    res.json({ message: "Konser diperbarui" });
  })
);

app.delete(
  "/api/konser/:id",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const id = parseId(req.params.id);

    const [used] = await db.query<RowDataPacket[]>(
      "SELECT id FROM pemesanan WHERE konser_id = ? AND status <> 'batal' LIMIT 1",
      [id]
    );
    if (used.length > 0) {
      throw new HttpError(400, "Konser tidak bisa dihapus karena masih ada pemesanan aktif");
    }

    const [result] = await db.query<ResultSetHeader>("DELETE FROM konser WHERE id = ?", [id]);
    if (result.affectedRows === 0) throw new HttpError(404, "Konser tidak ditemukan");
    res.json({ message: "Konser dihapus" });
  })
);


app.post(
  "/api/pemesanan",
  auth,
  wrap(async (req, res) => {
    const konserId = Number(req.body?.konser_id);
    const jumlah = Number(req.body?.jumlah);
    if (!Number.isInteger(konserId) || konserId <= 0) throw new HttpError(400, "konser_id tidak valid");
    if (!Number.isInteger(jumlah) || jumlah <= 0) throw new HttpError(400, "jumlah harus bilangan bulat > 0");

    const id = await tx(async (conn) => {
      // Kunci baris konser agar kuota tidak bisa direbut bersamaan
      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT * FROM konser WHERE id = ? FOR UPDATE",
        [konserId]
      );
      const k = rows[0];
      if (!k) throw new HttpError(404, "Konser tidak ditemukan");
      if (k.kuota < jumlah) throw new HttpError(400, `Kuota tidak cukup (sisa ${k.kuota})`);

      const total = k.harga * jumlah;
const [result] = await conn.query<ResultSetHeader>(
  "INSERT INTO pemesanan (user_id, konser_id, jumlah, total_harga, status) VALUES (?, ?, ?, ?, 'pending')",
  [req.user!.id, konserId, jumlah, total]
);
      await conn.query("UPDATE konser SET kuota = kuota - ? WHERE id = ?", [jumlah, konserId]);
      return result.insertId;
    });

    res.status(201).json({ message: "Pemesanan berhasil dibuat", id });
  })
);

app.get(
  "/api/pemesanan",
  auth,
  wrap(async (req, res) => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT p.*, k.nama AS nama_konser, k.lokasi, k.tanggal
       FROM pemesanan p
       JOIN konser k ON k.id = p.konser_id
       WHERE p.user_id = ?
       ORDER BY p.id DESC`,
      [req.user!.id]
    );
    res.json(rows);
  })
);

app.get(
  "/api/pemesanan/:id",
  auth,
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT p.*, k.nama AS nama_konser, k.lokasi, k.tanggal
       FROM pemesanan p
       JOIN konser k ON k.id = p.konser_id
       WHERE p.id = ? AND p.user_id = ?`,
      [id, req.user!.id]
    );
    if (!rows[0]) throw new HttpError(404, "Pemesanan tidak ditemukan");
    res.json(rows[0]);
  })
);

app.put(
  "/api/pemesanan/:id/batal",
  auth,
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    await tx((conn) => batalkan(conn, id, req.user!.id));
    res.json({ message: "Pemesanan dibatalkan" });
  })
);


app.get(
  "/api/admin/pemesanan",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const status = req.query.status as string | undefined;
    const valid = ["pending", "lunas", "batal"];
    if (status && !valid.includes(status)) throw new HttpError(400, "Status tidak valid");

    const sql = `
      SELECT p.*, u.nama AS nama_user, u.email, k.nama AS nama_konser
      FROM pemesanan p
      JOIN users u ON u.id = p.user_id
      JOIN konser k ON k.id = p.konser_id
      ${status ? "WHERE p.status = ?" : ""}
      ORDER BY p.id DESC`;
    const [rows] = await db.query<RowDataPacket[]>(sql, status ? [status] : []);
    res.json(rows);
  })
);

app.put(
  "/api/admin/pemesanan/:id/konfirmasi",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const [result] = await db.query<ResultSetHeader>(
      "UPDATE pemesanan SET status = 'lunas' WHERE id = ? AND status = 'pending'",
      [id]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(400, "Pemesanan tidak ditemukan atau bukan berstatus pending");
    }
    res.json({ message: "Pembayaran dikonfirmasi" });
  })
);

app.put(
  "/api/admin/pemesanan/:id/batal",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    await tx((conn) => batalkan(conn, id));
    res.json({ message: "Pemesanan dibatalkan oleh admin" });
  })
);


app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server" });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});