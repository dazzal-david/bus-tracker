import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:bus_tracker/auth_page.dart';
import 'package:bus_tracker/services/background_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://yrocmxeoqzstzsxwlrlj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyb2NteGVvcXpzdHpzeHdscmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTU4NTcsImV4cCI6MjA1OTA5MTg1N30.bHaLlzdnbFpWD52VASU4YNGc4YqDj8923689NIpKMcI',
  );
  
  // Initialize background service
  await initializeBackgroundService();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GPS Tracker',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const AuthPage(),
    );
  }
}