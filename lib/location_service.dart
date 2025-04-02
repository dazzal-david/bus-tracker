import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> initializeBackgroundService() async {
  final service = FlutterBackgroundService();

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart,
      autoStart: true,
      isForegroundMode: true,
      foregroundServiceNotificationId: 888,
      initialNotificationTitle: 'GPS Tracker',
      initialNotificationContent: 'Tracking location in background',
    ),
    iosConfiguration: IosConfiguration(
      autoStart: true,
      onForeground: onStart,
      onBackground: (ServiceInstance service) async {
        return true;
      },
    ),
  );
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  // Request location permissions
  await Geolocator.requestPermission();
  
  // Handle stop command
  service.on('stopService').listen((event) {
    service.stopSelf();
  });
  
  // Start location updates using a timer
  bool isRunning = true;
  Future.doWhile(() async {
    if (!isRunning) return false;

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user != null) {
        await supabase.from('locations').insert({
          'user_id': user.id,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'is_background': true,
          'timestamp': DateTime.now().toUtc().toIso8601String(),
        });
      }
    } catch (e) {
      print('Error updating location: $e');
    }

    // Wait for 1 minute before next update
    await Future.delayed(const Duration(minutes: 1));
    return isRunning;
  });

  // Listen for stop command to break the loop
  service.on('stopService').listen((_) {
    isRunning = false;
    service.stopSelf();
  });
}