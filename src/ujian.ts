import express, { type Express, type Request, type Response } from 'express';
import { z } from 'zod';
import {pool} from './connection';
import { title } from 'node:process';
const categoriesSchema = z.object({
    nama: z.string().min(1, "Tidak boleh kosong"),
    description: z.string().min(1, "Tidak boleh kosong")
})
const postsSchema = z.object({
    title: z.string().min(1, "Tidak boleh kosong"),
    content: z.string().min(1, "Tidak boleh kosong"),
    author: z.string().min(1, "Tidak boleh kosong"),
    categories_id: z.number()
})
const transaksiUpdateSchema =z.object({
  title: z.string().min(1, "Tidak boleh kosong"),
  content: z.string().min(1, "Tidak boleh kosong"),
  author: z.string().min(1, "Tidak boleh kosong"),
  categories_id: z.number()
})
const app: Express = express();
const port = 4000;
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});
app.post("/api/categories",async (req: Request, res: Response) => {
  const result = categoriesSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: "Data tidak valid",
      errors: result.error.flatten().fieldErrors,
    });
  }
  try {
    const { nama,description } = result.data;
    await pool.query(
      "INSERT INTO tb_categories (nama,description) VALUES (?, ?)",
      [nama,description]
    );
    res.status(201).json({ message: "berhasil disimpan ke database", data: result.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan data", error: err });
  }
});


app.post("/api/posts",async (req: Request, res: Response) => {
  const result = postsSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: "Data tidak valid",
      errors: result.error.flatten().fieldErrors,
    });
  }
  try {
    const { categories_id, title, content, author } = result.data;
    await pool.query(
      "INSERT INTO tb_posts (categories_id, title, content, author) VALUES (?, ?,?,?)",
      [categories_id, title, content, author]
    );
    res.status(201).json({ message: "berhasil disimpan ke database", data: result.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan data", error: err });
  }
});

app.get("/api/categories", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nama, description FROM tb_categories" 
    );
    res.status(200).json({ message: "Berhasil mengambil data", data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data", error: err });
  }
});




app.get("/api/posts", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT id,categories_id, title , content, author  FROM tb_posts"
    );
    res.status(200).json({ message: "Berhasil mengambil data users", data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data", error: err });
  }
});
app.delete("/api/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [existing]: any = await pool.query(
      "SELECT id FROM tb_posts WHERE id= ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    await pool.query("DELETE FROM tb_posts WHERE id = ?", [id]);
    res.status(200).json({ message: "User berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus data", error: err });
  }
});



app.put("/api/posts/:id", async (req: Request, res: Response) => {
  const result = transaksiUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: "Data tidak valid",
      errors: result.error.flatten().fieldErrors,
    });
  }
  try {
    const { id } = req.params;
    const { title, content, author, categories_id } = result.data;

    const [existing]: any = await pool.query(
      "SELECT id FROM tb_posts WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Post tidak ditemukan" });
    }

    await pool.query(
      `UPDATE tb_posts SET 
        categories_id = COALESCE(?, categories_id), 
        title = COALESCE(?, title), 
        content = COALESCE(?, content),
        author = COALESCE(?, author) 
       WHERE id = ?`,
      [categories_id ?? null, title ?? null, content ?? null, author ?? null, id]
    );

    res.status(200).json({ message: "Post berhasil diupdate", data: result.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update data", error: err });
  }
});





app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});