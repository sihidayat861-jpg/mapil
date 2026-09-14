import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latihan_api/homepage.dart';
import 'package:latihan_api/tambahproduk.dart';


void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return MaterialApp(
      theme: ThemeData(
        textTheme: GoogleFonts.dancingScriptTextTheme(
          textTheme
          ).copyWith(bodyMedium: GoogleFonts.dancingScript
          (textStyle: textTheme.bodyMedium)),
      ),
      home: Homepage(),
      routes: {
       '/tambahproduk': (context) => AddProductPage(),
        '/home': (context) => Homepage()
        
      },
    );
  }
}
