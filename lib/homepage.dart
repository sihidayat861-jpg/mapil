import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:latihan_api/detailproduk.dart';
import 'dart:convert';
import 'package:latihan_api/formedit.dart';

class Homepage extends StatefulWidget {
  const Homepage({super.key});

  @override
  State<Homepage> createState() => _HomepageState();
}

class _HomepageState extends State<Homepage> {
  List posts = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    getPosts();
  }

  Future<void> getPosts() async {
    try {
      final response = await http.get(
        Uri.parse('http://10.0.2.2:4000/api/posts'),
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        setState(() {
          posts =
              jsonData['data']; // sesuai format { message, data } di Express
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
      print('Response body: ${response.body}');
    } catch (e) {
      print('Error: $e');
      setState(() => isLoading = false);
    }
  }

  Future<void> deleteProduct(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('http://10.0.2.2:4000/api/posts/$id'),
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 204) {
        setState(() {
          posts.removeWhere((product) => product['id'] == id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Produk Berhasil Dihapus: ${response.statusCode}'),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menghapus produk: ${response.statusCode}'),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Terjadi kesalahan: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Blog App"),
        backgroundColor: Colors.amber,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : posts.isEmpty
          ? const Center(child: Text("Belum ada post"))
          : ListView.builder(
              itemCount: posts.length,
              itemBuilder: (context, index) {
                final post = posts[index];
                return Card(
                  margin: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  child: ListTile(
                    title: Text(
                      post['title'] ?? '-',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      'Oleh ${post['author'] ?? '-'} • Kategori ${post['categories_id'] ?? '-'}',
                    ),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => DetailProdukPage(post: post)),
                      );
                    },

                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => EditProductPage(product: post),
                              ),
                            ).then((_) => getPosts());
                          },
                          icon: const Icon(Icons.edit, color: Colors.blue),
                        ),
                        IconButton(
                          onPressed: () => deleteProduct(post['id']),
                          icon: const Icon(Icons.delete, color: Colors.red),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.pushNamed(context, '/tambahproduk');
          getPosts(); // refresh list setelah balik dari halaman tambah
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
