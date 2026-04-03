import 'package:flutter/material.dart';
import 'dashboard.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math' as math;
import 'config.dart';
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with TickerProviderStateMixin {
  final identifierController = TextEditingController();
  final passwordController = TextEditingController();
  bool isLoading = false;
  
  late AnimationController _pulseController;
  late AnimationController _nebulaController;
  late AnimationController _floatController;
  late AnimationController _scanlineController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _nebulaController = AnimationController(vsync: this, duration: const Duration(seconds: 15))..repeat();
    _floatController = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat(reverse: true);
    _scanlineController = AnimationController(vsync: this, duration: const Duration(seconds: 20))..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _nebulaController.dispose();
    _floatController.dispose();
    _scanlineController.dispose();
    super.dispose();
  }

  Future<String?> _getDeviceId() async {
    final devInfo = DeviceInfoPlugin();
    try {
      if (Platform.isAndroid) {
        final info = await devInfo.androidInfo;
        return info.id; 
      } else if (Platform.isIOS) {
        final info = await devInfo.iosInfo;
        return info.identifierForVendor; 
      }
    } catch (e) {
      return "HARDWARE_ID_LOCKED";
    }
    return "UNKNOWN_HOST";
  }

  Future<void> login() async {
    if (identifierController.text.isEmpty || passwordController.text.isEmpty) {
      _showSnack("Identity Verification Required.", Colors.redAccent);
      return;
    }
    setState(() => isLoading = true);
    try {
      final deviceId = await _getDeviceId();
      final input = identifierController.text;
      final body = {
        "password": passwordController.text,
        "deviceId": deviceId
      };
      
      if (input.contains('@')) {
        body["email"] = input;
      } else {
        body["phoneNumber"] = input;
      }

      final res = await http.post(
        Uri.parse("${ApiConfig.baseUrl}/api/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(body),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final token = data["token"];
        if (token != null) {
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => Dashboard(user: data["user"], token: token)));
        } else {
          _showSnack("Uplink Security Failure.", Colors.orange);
        }
      } else {
        final error = jsonDecode(res.body)["error"] ?? "Invalid Access Key.";
        _showSnack(error, Colors.redAccent); 
      }
    } catch (e) { _showSnack("Connection Error. Check Hub.", Colors.orange); } 
    finally { setState(() => isLoading = false); }
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          AnimatedBuilder(
            animation: _nebulaController,
            builder: (context, child) => Container(
              width: double.infinity, height: double.infinity,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(math.sin(_nebulaController.value * 2 * math.pi) * 0.5, math.cos(_nebulaController.value * 2 * math.pi) * 0.5),
                  radius: 1.5,
                  colors: [const Color(0xFF8B5CF6).withOpacity(0.05), Colors.black],
                ),
              ),
            ),
          ),
          AnimatedBuilder(
            animation: _scanlineController,
            builder: (context, child) => Positioned.fill(
              child: Opacity(
                opacity: 0.03,
                child: CustomPaint(
                  painter: _ScanlinePainter(offset: _scanlineController.value),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: AnimatedBuilder(
                    animation: _floatController,
                    builder: (context, child) => Transform.translate(
                      offset: Offset(0, 4 * math.sin(_floatController.value * 2 * math.pi)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text("Twishh", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.white)),
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: const BoxDecoration(color: Color(0xFF8B5CF6)),
                            child: const Text("Sync", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 80),
                const Text("IDENTITY ID", style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                _buildField("Mobile Number / Email", Icons.smartphone_rounded, identifierController),
                const SizedBox(height: 32),
                const Text("SECURITY KEY", style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                _buildField("Access Password", Icons.lock_outline_rounded, passwordController, isPass: true),
                const SizedBox(height: 60),
                AnimatedBuilder(
                  animation: _pulseController,
                  builder: (context, child) => Container(
                    width: double.infinity, height: 58,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: const Color(0xFF8B5CF6).withOpacity(0.25 * _pulseController.value), blurRadius: 25 * _pulseController.value, spreadRadius: 1)],
                    ),
                    child: ElevatedButton(
                      onPressed: isLoading ? null : login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.12),
                        foregroundColor: const Color(0xFF8B5CF6),
                        side: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: isLoading 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF8B5CF6)))
                        : const Text("AUTHENTICATE SESSION", style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 4, fontSize: 11)),
                    ),
                  ),
                ),
                const SizedBox(height: 48),
                const Center(child: Text("v1.5.0 // HARDWARE BINDING ACTIVE", style: TextStyle(color: Colors.white10, fontSize: 9, letterSpacing: 5, fontWeight: FontWeight.bold))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField(String label, IconData icon, TextEditingController controller, {bool isPass = false}) {
    return TextField(
      controller: controller, obscureText: isPass,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        hintText: label,
        hintStyle: const TextStyle(color: Colors.white12, fontSize: 13),
        prefixIcon: Icon(icon, color: Colors.white24, size: 20),
        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF8B5CF6), width: 2)),
      ),
    );
  }
}

class _ScanlinePainter extends CustomPainter {
  final double offset;
  _ScanlinePainter({required this.offset});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white..strokeWidth = 1;
    for (double i = 0; i < size.height; i += 4) {
      double y = (i + (offset * size.height)) % size.height;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}