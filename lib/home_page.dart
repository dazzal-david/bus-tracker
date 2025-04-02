import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _supabase = Supabase.instance.client;
  bool _isTracking = false;

  @override
  void initState() {
    super.initState();
    _checkServiceStatus();
  }

  Future<void> _checkServiceStatus() async {
    final service = FlutterBackgroundService();
    bool isRunning = await service.isRunning();
    setState(() {
      _isTracking = isRunning;
    });
  }

  Future<void> _toggleTracking() async {
    final service = FlutterBackgroundService();
    
    if (_isTracking) {
      // Just invoke the stop command
      service.invoke("stopService");
      setState(() {
        _isTracking = false;
      });
    } else {
      // Start the service and update state based on result
      await service.startService();
      bool isRunning = await service.isRunning();
      setState(() {
        _isTracking = isRunning;
      });
    }
  }

  Future<void> _signOut() async {
    final service = FlutterBackgroundService();
    if (_isTracking) {
      service.invoke("stopService");
    }
    
    if (mounted) {
      await _supabase.auth.signOut();
      Navigator.of(context).pushReplacementNamed('/auth');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GPS Tracker'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _signOut,
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _isTracking ? 'Tracking Active' : 'Tracking Inactive',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _toggleTracking,
              child: Text(_isTracking ? 'Stop Tracking' : 'Start Tracking'),
            ),
            const SizedBox(height: 20),
            StreamBuilder<Position?>(
              stream: _isTracking ? Geolocator.getPositionStream() : null,
              builder: (context, snapshot) {
                if (!_isTracking) {
                  return const Text('Location tracking is disabled');
                }
                
                if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                }

                if (!snapshot.hasData) {
                  return const CircularProgressIndicator();
                }

                return Column(
                  children: [
                    Text(
                      'Latitude: ${snapshot.data?.latitude.toStringAsFixed(6)}',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Text(
                      'Longitude: ${snapshot.data?.longitude.toStringAsFixed(6)}',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Text(
                      'Accuracy: ${snapshot.data?.accuracy.toStringAsFixed(2)} meters',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}