// ignore_for_file: avoid_web_libraries_in_flutter

import 'dart:html' as html;
import 'package:flutter/material.dart';
import 'package:fastor_app_ui_widget/fastor_app_ui_widget.dart'
    if (dart.library.html) 'dart:ui_web' as ui;

void main() {
  // Register the view factory for the HTML content
  ui.platformViewRegistry.registerViewFactory(
    'hello-world-html',
    (int viewId) => html.IFrameElement()
      ..src = 'finger_scan.html'
      ..style.border = 'none'
      ..style.width = '100%'
      ..style.height = '100%',
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Finger Scan',
      debugShowCheckedModeBanner: false,
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // appBar: AppBar(
      //   title: const Text('Face Mesh with Color Analysis'),
      // ),
      body: const SizedBox(
        width: double.infinity,
        height: double.infinity,
        child:

            // Text("hi")
            HtmlElementView(
          viewType: 'hello-world-html',
        ),
      ),
    );
  }
}
