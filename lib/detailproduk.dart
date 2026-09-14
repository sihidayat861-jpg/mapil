import 'package:flutter/material.dart';


class DetailProdukPage extends StatelessWidget {
  final Map<String, dynamic> post;

  const DetailProdukPage({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(post['title'] ?? '-')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                post['title'] ?? '-',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Oleh ${post['author'] ?? '-'} • Kategori ${post['categories_id'] ?? '-'}',
                style: TextStyle(color: Colors.grey[600], fontSize: 14),
              ),
              const Divider(height: 24),
              Text(
                post['content'] ?? '-',
                style: const TextStyle(fontSize: 16, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}