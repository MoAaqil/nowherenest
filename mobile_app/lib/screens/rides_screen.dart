import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class RidesScreen extends StatefulWidget {
  const RidesScreen({Key? key}) : super(key: key);

  @override
  State<RidesScreen> createState() => _RidesScreenState();
}

class _RidesScreenState extends State<RidesScreen> {
  String _selectedCabType = 'mini';
  bool _isBooked = false;
  String _rideStatus = 'Searching for driver...';
  double _simulationProgress = 0.0;

  void _bookCab() {
    setState(() {
      _isBooked = true;
      _rideStatus = 'Driver assigned (Ramu D). Heading to check-in stay...';
      _simulationProgress = 0.05;
    });

    // Simulate progress timing
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _rideStatus = 'Driver arrived at pick-up point. Transit active...';
          _simulationProgress = 0.45;
        });
      }
    });

    Future.delayed(const Duration(seconds: 6), () {
      if (mounted) {
        setState(() {
          _rideStatus = 'Ride active: Passing by Kumarakom Backwaters (90km/h)...';
          _simulationProgress = 0.8;
        });
      }
    });

    Future.delayed(const Duration(seconds: 9), () {
      if (mounted) {
        setState(() {
          _rideStatus = 'Arrived at Taj Kumarakom Stay! Ride finished.';
          _simulationProgress = 1.0;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text('nowhere nest rides', style: TextStyle(color: Color(0xFF0A3B2A), fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Nest Proximity Transit',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF0A3B2A)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Direct flat-rate cab booking from your current location to your checked-in property.',
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const Divider(height: 32),

            if (!_isBooked) ...[
              const Text('Select Cab Model', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 12),
              _buildCabOption('mini', 'Nest Hatchback Mini', 'Flat fee: ₹450 · Ideal for 2-3 guests', LucideIcons.car),
              _buildCabOption('sedan', 'Nest Comfort Sedan', 'Flat fee: ₹750 · AC + Extra baggage space', LucideIcons.car),
              _buildCabOption('suv', 'Nest Cruiser SUV', 'Flat fee: ₹1100 · Large group flex travel', LucideIcons.car),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _bookCab,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0A3B2A),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.car, color: Colors.white),
                    SizedBox(width: 8),
                    Text('Book flat-rate taxi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
              )
            ] else ...[
              // Ride active panel
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: const BoxDecoration(color: Color(0xFFE8F0EC), shape: BoxShape.circle),
                            child: const Icon(LucideIcons.navigation, color: Color(0xFF0A3B2A), size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Active Cab Tracking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                Text(_rideStatus, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                              ],
                            ),
                          )
                        ],
                      ),
                      const SizedBox(height: 20),
                      LinearProgressIndicator(
                        value: _simulationProgress,
                        backgroundColor: Colors.black12,
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Estimated distance to destination: ${(22 * (1 - _simulationProgress)).toStringAsFixed(1)} km',
                        style: const TextStyle(fontSize: 12, color: Colors.black45, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _isBooked = false;
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.redAccent,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Cancel Booking', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      )
                    ],
                  ),
                ),
              )
            ],
            const SizedBox(height: 64), // Safe bottom margin. NO FOOTER DETAILS EXIST HERE.
          ],
        ),
      ),
    );
  }

  Widget _buildCabOption(String type, String title, String desc, IconData icon) {
    final isSelected = _selectedCabType == type;
    return GestureDetector(
      onTap: () => setState(() => _selectedCabType = type),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE8F0EC) : Colors.white,
          border: Border.all(color: isSelected ? const Color(0xFF0A3B2A) : Colors.black12, width: isSelected ? 2 : 1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? const Color(0xFF0A3B2A) : Colors.black45, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(desc, style: const TextStyle(fontSize: 11, color: Colors.black54)),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
