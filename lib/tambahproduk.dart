import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AddProductPage extends StatefulWidget {
  const AddProductPage({super.key});

  @override
  State<AddProductPage> createState() => _AddProductPageState();
}

class _AddProductPageState extends State<AddProductPage> {
  final titleController = TextEditingController();
  final contentController = TextEditingController();
  final authorController = TextEditingController();
  final categoryController = TextEditingController();
  bool isSaving = false;

  Future<void> addProduct() async {
    setState(() => isSaving = true);

    try {
      final response = await http.post(
        Uri.parse('http://10.0.2.2:4000/api/posts'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'title': titleController.text,
          'content': contentController.text, // add this line
          'author': authorController.text,
          'categories_id': int.tryParse(categoryController.text) ?? 0,
        }),
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Berhasil menyimpan post: ${response.body}')),
        );
        titleController.clear();
        contentController.clear();
        authorController.clear();
        categoryController.clear();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menyimpan post: ${response.statusCode}'),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Terjadi kesalahan koneksi: $e')));
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  @override
  void dispose() {
    titleController.dispose();
    contentController.dispose();
    authorController.dispose();
    categoryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tambah Post')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Judul'),
            ),
            TextField(
              controller: contentController,
              maxLines: 5,
              decoration: const InputDecoration(labelText: 'Konten'),
            ),
            TextField(
              controller: authorController,
              decoration: const InputDecoration(labelText: 'Penulis'),
            ),
            TextField(
              controller: categoryController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'ID Kategori'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: isSaving ? null : addProduct,
              child: isSaving
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Simpan'),
            ),
          ],
        ),
      ),
    );
  }
}
