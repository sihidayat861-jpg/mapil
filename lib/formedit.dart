import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';


class EditProductPage extends StatefulWidget {
  final Map product;
  const EditProductPage({super.key, required this.product});

  @override
  State<EditProductPage> createState() => _EditProductPageState();
}

class _EditProductPageState extends State<EditProductPage> {
  late final titleController = TextEditingController(
    text: widget.product['title'],
  );
  late final contentController = TextEditingController(
    text: widget.product['content'].toString(),
  );
  late final authorController = TextEditingController(
    text: widget.product['author'],
  );
  late final categoriesController = TextEditingController(
    text: widget.product['categories_id'].toString(),
  );

  bool isSaving = false;

  Future<void> updateProduct() async {
    setState(() => isSaving = true);

    final response = await http.put(
      Uri.parse('http://10.0.2.2:4000/api/posts/${widget.product['id']}'),
      body: jsonEncode({
        'title': titleController.text,
        'content': contentController.text, // add this line
        'author': authorController.text,
        'categories_id': int.tryParse(categoriesController.text) ?? 0,
      }),
    );

    setState(() => isSaving = false);

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Berhasil memperbarui produk: ${response.statusCode}'),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal memperbarui produk: ${response.statusCode}'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Produk')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Judul Produk'),
            ),
            TextField(
              controller: contentController,
              decoration: const InputDecoration(labelText: 'content'),
            ),
            TextField(
              controller: authorController,
              decoration: const InputDecoration(labelText: 'author'),
            ),
            TextField(
              controller: categoriesController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Kategori'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: isSaving ? null : updateProduct,
              child: isSaving
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Perbarui'),
            ),
          ],
        ),
      ),
    );
  }
}
