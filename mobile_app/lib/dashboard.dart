import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui';
import 'package:intl/intl.dart';
import 'login.dart';
import 'config.dart';

class Dashboard extends StatefulWidget {
  final Map<String, dynamic> user;
  final String token;
  Dashboard({required this.user, required this.token});

  @override
  _DashboardState createState() => _DashboardState();
}

class _DashboardState extends State<Dashboard> with TickerProviderStateMixin, WidgetsBindingObserver {
  List<dynamic> officeLocations = [];
  bool isLoading = true;
  bool isInRange = false;
  String proximityStatus = "Scanning for nearest zone...";
  
  int _selectedIndex = 0;
  late AnimationController _pulseController;
  late AnimationController _nebulaController;
  late AnimationController _floatController;
  late AnimationController _scanController;
  late AnimationController _radarPulseController;
  late AnimationController _shimmerController;
  late AnimationController _scanlineController;
  
  List<dynamic> notices = [];
  List<dynamic> attendanceHistory = [];
  bool isLoading = true;
  bool isChecking = false;
  bool isInRange = false;
  bool isCheckedIn = false;
  bool _isGlitching = false;
  String proximityStatus = "Synchronizing Protocol...";

  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _reasonController = TextEditingController();
  DateTime? _backgroundTimestamp;

  Map<String, String> get _authHeaders => {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${widget.token}"
  };

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat(reverse: true);
    _nebulaController = AnimationController(vsync: this, duration: const Duration(seconds: 20))..repeat();
    _floatController = AnimationController(vsync: this, duration: const Duration(seconds: 5))..repeat(reverse: true);
    _scanController = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat();
    _radarPulseController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
    _shimmerController = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();
    _scanlineController = AnimationController(vsync: this, duration: const Duration(seconds: 30))..repeat();
    
    _radarPulseController.addStatusListener((status) {
      if (status == AnimationStatus.forward || status == AnimationStatus.reverse) {
         HapticFeedback.selectionClick(); 
      }
    });

    refreshData();
    fetchConfig();
    checkProximityContinuously();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() { 
    WidgetsBinding.instance.removeObserver(this);
    _pulseController.dispose(); _nebulaController.dispose(); _floatController.dispose(); 
    _scanController.dispose(); _radarPulseController.dispose(); 
    _shimmerController.dispose(); _scanlineController.dispose(); super.dispose(); 
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      // User minimized the app
      _backgroundTimestamp = DateTime.now();
    } else if (state == AppLifecycleState.resumed) {
      // User returned to the app
      if (_backgroundTimestamp != null) {
        final difference = DateTime.now().difference(_backgroundTimestamp!).inSeconds;
        if (difference >= 300) { // 5 minutes
          _forceLogout();
        }
        _backgroundTimestamp = null;
      }
    }
  }

  void _forceLogout() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => LoginPage()),
      (Route<dynamic> route) => false,
    );
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Security Protocol: Session timed out due to inactivity."),
        backgroundColor: Colors.orangeAccent,
      ),
    );
  }

  Future<void> refreshData() async {
    setState(() => isLoading = true);
    await Future.wait([ fetchStatus(), fetchNotices(), fetchHistory() ]);
    _triggerGlitch();
  setState(() => isLoading = false);
  }

  Future<void> fetchConfig() async {
    try {
      final res = await http.get(
        Uri.parse("${ApiConfig.baseUrl}/api/attendance/config"),
        headers: _authHeaders
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          officeLocations = data;
        });
      }
    } catch (e) {
      debugPrint("Config fetch failed: $e");
    }
  }

  void _triggerGlitch() {
    setState(() => _isGlitching = true);
    Future.delayed(const Duration(milliseconds: 300), () => setState(() => _isGlitching = false));
  }

  Future<void> fetchStatus() async {
    try {
      final res = await http.get(
        Uri.parse("${ApiConfig.baseUrl}/api/attendance/status/${widget.user["_id"]}"),
        headers: _authHeaders
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() => isCheckedIn = data["isCheckedIn"]);
      }
    } catch (e) { _triggerGlitch(); }
  }

  Future<void> fetchNotices() async {
    try {
      final res = await http.get(
        Uri.parse("${ApiConfig.baseUrl}/api/attendance/notices"), 
        headers: _authHeaders
      );
      if (res.statusCode == 200) { setState(() => notices = jsonDecode(res.body)); }
    } catch (e) { _triggerGlitch(); }
  }

  Future<void> fetchHistory() async {
    try {
      final res = await http.get(
        Uri.parse("${ApiConfig.baseUrl}/api/attendance/history/${widget.user["_id"]}"),
        headers: _authHeaders
      );
      if (res.statusCode == 200) { setState(() => attendanceHistory = jsonDecode(res.body)); }
    } catch (e) { _triggerGlitch(); }
  }

  void checkProximityContinuously() async {
    while (mounted) {
      try {
        Position pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        bool foundInRange = false;
        double minDistance = double.infinity;
        String nearestZone = "Unknown Zone";

        for (var loc in officeLocations) {
          double lat = (loc["latitude"] as num).toDouble();
          double lon = (loc["longitude"] as num).toDouble();
          
          double dist = Geolocator.distanceBetween(lat, lon, pos.latitude, pos.longitude);
          if (dist <= 100.0) foundInRange = true;
          if (dist < minDistance) {
            minDistance = dist;
            nearestZone = loc["name"];
          }
        }

        setState(() {
          isInRange = foundInRange; 
          proximityStatus = isInRange 
            ? "Within $nearestZone Radius" 
            : "${minDistance.toStringAsFixed(0)}m from $nearestZone";
        });
      } catch (e) { setState(() => proximityStatus = "Enable Location"); }
      await Future.delayed(const Duration(seconds: 10));
    }
  }

  Future<void> handleAction(bool isEntry) async {
    if (isEntry && !isInRange) {
      _showReasonDialog();
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => isChecking = true);
    try {
      Position pos = await Geolocator.getCurrentPosition();
      final url = isEntry ? "checkin" : "checkout";
      final body = isEntry ? {"userId": widget.user["_id"], "location": "${pos.latitude},${pos.longitude}"} : {"userId": widget.user["_id"]};
      
      final res = await http.post(
        Uri.parse("${ApiConfig.baseUrl}/api/attendance/$url"), 
        headers: _authHeaders, 
        body: jsonEncode(body)
      );
      
      if (res.statusCode == 200) {
        _showMsg("Access Granted", isEntry ? "Entry Verified" : "Logout Successful", const Color(0xFF8B5CF6));
        _triggerGlitch();
        await fetchStatus(); 
        await fetchHistory();
      } else { 
        final error = jsonDecode(res.body)["error"] ?? "Rejected.";
        _showMsg("Failed", error, Colors.redAccent); 
      }
    } catch (e) { _showMsg("Error", "Uplink break.", Colors.red); } 
    finally { setState(() => isChecking = false); }
  }

  Future<void> handleRemoteRequest(String reason) async {
    HapticFeedback.heavyImpact();
    setState(() => isChecking = true);
    try {
      Position pos = await Geolocator.getCurrentPosition();
      final body = {
        "userId": widget.user["_id"], 
        "location": "${pos.latitude},${pos.longitude}",
        "reason": reason
      };
      
      final res = await http.post(
        Uri.parse("${ApiConfig.baseUrl}/api/attendance/request"), 
        headers: _authHeaders, 
        body: jsonEncode(body)
      );
      
      if (res.statusCode == 200) {
        _showMsg("Uplink Sent", "Remark logged for Admin review.", Colors.orangeAccent);
        _triggerGlitch();
        await fetchStatus(); 
        await fetchHistory();
      } else { 
        final error = jsonDecode(res.body)["error"] ?? "Request Failed.";
        _showMsg("Request Rejected", error, Colors.redAccent); 
      }
    } catch (e) { _showMsg("Error", "Uplink break.", Colors.red); } 
    finally { setState(() => isChecking = false); }
  }

  void _showReasonDialog() {
    _reasonController.clear();
    showDialog(
      context: context,
      builder: (context) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: AlertDialog(
          backgroundColor: const Color(0xFF111116).withOpacity(0.9),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.orangeAccent.withOpacity(0.3))),
          title: const Text("OFF-SITE REMARK", style: TextStyle(color: Colors.orangeAccent, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 2)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("You are outside the authorized zone. Enter a remark to justify your remote synchronization.", style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: _reasonController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: "Enter your remark here...",
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: Colors.black.withOpacity(0.3),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text("CANCEL", style: TextStyle(color: Colors.white24))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orangeAccent.withOpacity(0.1), side: const BorderSide(color: Colors.orangeAccent)),
              onPressed: () {
                if (_reasonController.text.trim().isEmpty) return;
                Navigator.pop(context);
                handleRemoteRequest(_reasonController.text.trim());
              },
              child: const Text("SUBMIT REMARK", style: TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _updatePassword() async {
    if (_currentPasswordController.text.isEmpty || _newPasswordController.text.isEmpty) return;
    try {
      final res = await http.patch(
        Uri.parse("${ApiConfig.baseUrl}/api/auth/change-password/${widget.user["_id"]}"),
        headers: _authHeaders,
        body: jsonEncode({
          "currentPassword": _currentPasswordController.text,
          "newPassword": _newPasswordController.text
        })
      );
      if (res.statusCode == 200) {
        _showMsg("Security Update", "Access Key Changed", const Color(0xFF8B5CF6));
        _currentPasswordController.clear();
        _newPasswordController.clear();
      } else {
        _showMsg("Security Failure", "Invalid Current Key", Colors.redAccent);
      }
    } catch (e) { _showMsg("Error", "Uplink break.", Colors.red); }
  }

  void _showMsg(String title, String body, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.transparent, elevation: 0, content: ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: const Color(0xFF111116).withOpacity(0.8), borderRadius: BorderRadius.circular(16), border: Border.all(color: color.withOpacity(0.3))),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.security, size: 14, color: color),
              const SizedBox(width: 8),
              Text(title.toUpperCase(), style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 2)),
            ]),
            const SizedBox(height: 8),
            Text(body, style: const TextStyle(color: Colors.white70, fontSize: 14)),
          ]),
        ),
      ),
    )));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: AnimatedBuilder(
          animation: _floatController,
          builder: (context, child) => Transform.translate(
            offset: Offset(0, 2 * math.cos(_floatController.value * 2 * math.pi)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.user["companyLogo"] != null) ...[
                  Container(
                    height: 24,
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4)),
                    child: Image.network(widget.user["companyLogo"], height: 20),
                  ),
                  const SizedBox(width: 10),
                ],
                Text(
                  (widget.user["companyName"] ?? "TwishhSync").toString().toUpperCase(),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white),
                ),
              ],
            ),
          ),
        ),
        centerTitle: true, backgroundColor: Colors.transparent, elevation: 0,
        actions: [ IconButton(onPressed: _showHistorySheet, icon: const Icon(Icons.history, color: Colors.white, size: 24)), const SizedBox(width: 8) ],
      ),
      body: Stack(
        children: [
          AnimatedBuilder(
            animation: _nebulaController,
            builder: (context, child) => Container(
              width: double.infinity, height: double.infinity,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(math.cos(_nebulaController.value * 2 * math.pi) * 0.4, math.sin(_nebulaController.value * 2 * math.pi) * 0.4),
                  radius: 1.6,
                  colors: [const Color(0xFF8B5CF6).withOpacity(0.06), Colors.black],
                ),
              ),
            ),
          ),
          AnimatedBuilder(
            animation: _scanlineController,
            builder: (context, child) => Positioned.fill(
              child: Opacity(
                opacity: 0.04,
                child: CustomPaint(painter: _ScanlinePainter(offset: _scanlineController.value)),
              ),
            ),
          ),
          IndexedStack(
            index: _selectedIndex,
            children: [ _buildHubView(), _buildSettingsView() ],
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.white.withOpacity(0.03)))),
        child: BottomNavigationBar(
          backgroundColor: const Color(0xFF0A0A0A).withOpacity(0.9),
          currentIndex: _selectedIndex,
          onTap: (i) => setState(() => _selectedIndex = i),
          selectedItemColor: const Color(0xFF8B5CF6),
          unselectedItemColor: Colors.white12,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: "HUB"),
            BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: "SETTINGS"),
          ],
        ),
      ),
    );
  }

  Widget _buildHubView() {
    return RefreshIndicator(
      onRefresh: refreshData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 140, left: 24, right: 24, bottom: 40),
        child: Column(children: [
          Center(child: AnimatedBuilder(
            animation: _floatController,
            builder: (context, child) => Transform.translate(
              offset: Offset(0, 8 * math.sin(_floatController.value * 2 * math.pi)),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _radarPulseController,
                    builder: (context, child) => Container(
                      width: 200 * _radarPulseController.value,
                      height: 200 * _radarPulseController.value,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [const Color(0xFF8B5CF6).withOpacity(0.4 * (1 - _radarPulseController.value)), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  RotationTransition(
                    turns: _scanController,
                    child: CustomPaint(size: const Size(200, 200), painter: _RadarScanPainter()),
                  ),
                  Container(
                    width: 200, height: 200,
                    decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.12))),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.radar, size: 44, color: Color(0xFF8B5CF6)),
                      const SizedBox(height: 12),
                      Text(proximityStatus, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(isCheckedIn ? "SESSION ACTIVE" : "SESSION IDLE", style: TextStyle(color: isCheckedIn ? Colors.amber : Colors.white24, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
                    ]),
                  ),
                ],
              ),
            ),
          )),
          const SizedBox(height: 52),
          Align(alignment: Alignment.centerLeft, child: Text("// ACCESS GRANTED FOR:", style: TextStyle(color: Colors.white.withOpacity(0.1), fontSize: 10, letterSpacing: 3, fontWeight: FontWeight.bold))),
          const SizedBox(height: 4),
          Align(alignment: Alignment.centerLeft, child: AnimatedBuilder(
            animation: _shimmerController,
            builder: (context, child) => ShaderMask(
              shaderCallback: (bounds) => LinearGradient(
                begin: Alignment.topLeft, end: Alignment.bottomRight,
                stops: [0.0, _shimmerController.value, 1.0],
                colors: [Colors.white, const Color(0xFF8B5CF6).withOpacity(0.5), Colors.white],
              ).createShader(bounds),
              child: Text(widget.user["name"].toString().toUpperCase(), style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1)),
            ),
          )),
          const SizedBox(height: 44),
          Row(children: [
            Expanded(child: _buildGlowAction(true)),
            const SizedBox(width: 16),
            Expanded(child: _buildGlowAction(false)),
          ]),
          const SizedBox(height: 60),
          Align(alignment: Alignment.centerLeft, child: Text("// BROADCAST LOGS:", style: TextStyle(color: Colors.white.withOpacity(0.1), fontSize: 10, letterSpacing: 3, fontWeight: FontWeight.bold))),
          const SizedBox(height: 14),
          Opacity(
            opacity: _isGlitching ? 0.3 : 1.0,
            child: Transform.translate(
              offset: Offset(_isGlitching ? (math.Random().nextDouble() * 10 - 5) : 0, 0),
              child: Column(children: notices.map((n) => ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.04), border: Border.all(color: Colors.white.withOpacity(0.06)), borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      Text("> ", style: TextStyle(color: const Color(0xFF8B5CF6).withOpacity(0.6), fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                      Expanded(child: Text(n["message"].toString().toUpperCase(), style: const TextStyle(fontSize: 11, color: Colors.white60, letterSpacing: 1.2, fontFamily: 'monospace'))),
                    ]),
                  ),
                ),
              )).toList()),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildGlowAction(bool isEntry) {
    bool isActive = false;
    String btnText = isEntry ? "MARK ENTRY" : "MARK EXIT";
    Color color = isEntry ? const Color(0xFF8B5CF6) : const Color(0xFFF59E0B);

    if (isEntry) {
      if (!isCheckedIn && !isChecking) {
        isActive = true;
        if (!isInRange) {
          btnText = "REQUEST ENTRY";
          color = Colors.orangeAccent;
        }
      }
    } else {
      if (isCheckedIn && !isChecking) {
        isActive = true;
        // Allow checkout even if out of range
      }
    }
    
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) => Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          boxShadow: isActive ? [BoxShadow(color: color.withOpacity(0.3 * _pulseController.value), blurRadius: 20 * _pulseController.value, spreadRadius: 1)] : [],
        ),
        child: ElevatedButton(
          onPressed: isActive ? () => handleAction(isEntry) : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: isActive ? color.withOpacity(0.12) : Colors.white.withOpacity(0.03),
            foregroundColor: isActive ? color : Colors.white12,
            side: BorderSide(color: isActive ? color.withOpacity(0.8) : Colors.white.withOpacity(0.06), width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 0, padding: const EdgeInsets.symmetric(vertical: 18),
          ),
          child: Text(btnText, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 2)),
        ),
      ),
    );
  }

  Widget _buildSettingsView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(top: 140, left: 24, right: 24, bottom: 40),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text("// IDENTITY & UPLINK", style: TextStyle(color: Colors.white.withOpacity(0.1), letterSpacing: 3, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: const Color(0xFF0A0A0A).withOpacity(0.5), border: Border.all(color: Colors.white.withOpacity(0.08)), borderRadius: BorderRadius.circular(20)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  CircleAvatar(radius: 24, backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.15), child: const Icon(Icons.security, color: Color(0xFF8B5CF6))),
                  const SizedBox(width: 16),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(widget.user["name"] ?? "Unknown Identity", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                    Text(widget.user["email"] ?? "offline@hub.com", style: const TextStyle(color: Colors.white24, fontSize: 12)),
                  ]),
                ]),
                const SizedBox(height: 20),
                _buildInfoLine("EMPLOYEE ID", widget.user["_id"]?.toString() ?? "NOT_LINKED"),
                _buildInfoLine("PROTOCOL", "V1.5 // SECURITY UPLINK"),
              ]),
            ),
          ),
        ),
        const SizedBox(height: 52),
        Text("// SECURITY PROTOCOLS", style: TextStyle(color: Colors.white.withOpacity(0.1), letterSpacing: 3, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        _inputField("Current Access Key", _currentPasswordController),
        const SizedBox(height: 20),
        _inputField("New Access Key", _newPasswordController),
        const SizedBox(height: 48),
        SizedBox(width: double.infinity, height: 54, child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.1), side: const BorderSide(color: Color(0xFF8B5CF6))),
          onPressed: _updatePassword, 
          child: const Text("UPDATE ACCESS KEY", style: TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold, letterSpacing: 2)))),
        const SizedBox(height: 80),
        Center(child: TextButton.icon(
          onPressed: () => Navigator.pop(context), 
          icon: const Icon(Icons.logout, color: Colors.orangeAccent, size: 18), 
          label: const Text("TERMINATE SESSION", style: TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.bold, letterSpacing: 4, fontSize: 11)))),
      ]),
    );
  }

  Widget _inputField(String label, TextEditingController ctrl) {
    return TextField(
      controller: ctrl, obscureText: true, style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label, labelStyle: const TextStyle(color: Colors.white24, fontSize: 12),
        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF8B5CF6), width: 2)),
      ),
    );
  }

  Widget _buildInfoLine(String label, String value) {
    return Padding(padding: const EdgeInsets.only(top: 10), child: Row(children: [
      Text("$label:", style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.15), letterSpacing: 2, fontWeight: FontWeight.bold)),
      const SizedBox(width: 14),
      Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white60, fontFamily: 'monospace')),
    ]));
  }

  void _showHistorySheet() {
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          color: const Color(0xFF0A0A0A).withOpacity(0.8),
          padding: const EdgeInsets.all(24), height: MediaQuery.of(context).size.height * 0.7,
          child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text("Attendance Logs", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close, color: Colors.white24)),
            ]),
            const Divider(color: Colors.white10),
            Expanded(child: ListView.builder(itemCount: attendanceHistory.length, itemBuilder: (context, i) {
              final h = attendanceHistory[i];
              String checkInTime = "-";
              String checkOutTime = "-";
              try {
                if (h["checkIn"] != null) {
                  if (h["checkIn"] == "OFF-SITE") {
                    checkInTime = "REMOTE";
                  } else {
                    checkInTime = DateFormat.jm().format(DateTime.parse(h["checkIn"]));
                  }
                }
                if (h["checkOut"] != null) {
                  if (h["checkOut"] == "AUTO_CHECKOUT") {
                    checkOutTime = "AUTO";
                  } else {
                    checkOutTime = DateFormat.jm().format(DateTime.parse(h["checkOut"]));
                  }
                }
              } catch (e) {}
              
              return Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(h["date"] != null ? DateFormat('EEEE, MMM d').format(DateTime.parse(h["date"])) : "Unknown Date", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                Text("In: $checkInTime | Out: $checkOutTime", style: const TextStyle(color: Colors.white24, fontSize: 11, fontFamily: 'monospace')),
              ]));
            })),
          ]),
        ),
      ),
    ));
  }
}

class _RadarScanPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final paint = Paint()..shader = const SweepGradient(center: Alignment.center, startAngle: 0, endAngle: math.pi / 2, colors: [Color(0xFF8B5CF6), Colors.transparent], stops: [0.1, 1.0]).createShader(rect);
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), size.width / 2, paint);
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
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