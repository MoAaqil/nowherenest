import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class ProfileScreen extends StatefulWidget {
  final String? initialTab;
  const ProfileScreen({Key? key, this.initialTab}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? _user;
  List<Booking> _bookings = [];
  bool _loading = true;
  late String _activeTab;

  @override
  void initState() {
    super.initState();
    _activeTab = widget.initialTab ?? 'settings';
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    setState(() {
      _loading = true;
    });
    try {
      final me = await ApiService.getMe();
      final list = await ApiService.getCustomerBookings();
      setState(() {
        _user = me;
        _bookings = list;
      });
    } catch (e) {
      print('Failed to load profile details: $e');
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: Color(0xFF0A3B2A))),
      );
    }

    final name = _user?.name ?? 'Guest User';
    final email = _user?.email ?? 'guest@nowherenest.com';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text('My Profile', style: TextStyle(color: Color(0xFF0A3B2A), fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, color: Colors.redAccent),
            onPressed: () {
              // Sign out operations
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Meta Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0A3B2A),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(color: Colors.white24, shape: BoxShape.circle),
                    child: Center(
                      child: Text(
                        name.substring(0, 1).toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          email,
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        )
                      ],
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Tab toggler segment
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeTab = 'settings'),
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: _activeTab == 'settings' ? const Color(0xFF0F172A) : Colors.black05,
                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(10)),
                      ),
                      child: Center(
                        child: Text(
                          'Profile Settings',
                          style: TextStyle(
                            color: _activeTab == 'settings' ? Colors.white : Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeTab = 'history'),
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: _activeTab == 'history' ? const Color(0xFF0F172A) : Colors.black05,
                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(10)),
                      ),
                      child: Center(
                        child: Text(
                          'Booking History',
                          style: TextStyle(
                            color: _activeTab == 'history' ? Colors.white : Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            if (_activeTab == 'settings') ...[
              // Account Settings Forms list
              const Text('Account Information', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 12),
              _buildSettingItem('Display Name', name, LucideIcons.user),
              _buildSettingItem('Contact Phone', _user?.phone ?? '+91 9999988888', LucideIcons.phone),
              _buildSettingItem('Notification Status', 'Enabled', LucideIcons.bell),
              _buildSettingItem('Distance Preferences', 'Kilometers (km)', LucideIcons.navigation),
            ] else ...[
              // Booking history list
              Row(
                children: const [
                  Icon(LucideIcons.history, color: Color(0xFF0A3B2A)),
                  SizedBox(width: 8),
                  Text('Your Stay History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ],
              ),
              const SizedBox(height: 12),
              if (_bookings.isEmpty)
                const Center(child: Text('No bookings recorded yet.', style: TextStyle(fontSize: 13, color: Colors.black45)))
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _bookings.length,
                  itemBuilder: (context, idx) {
                    final item = _bookings[idx];
                    final propName = item.property?.name ?? 'Nowhere Nest Stay';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 1,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    propName,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: item.status == 'checked_out' ? Colors.black10 : const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    item.status.toUpperCase().replaceAll('_', ' '),
                                    style: TextStyle(
                                      color: item.status == 'checked_out' ? Colors.black54 : const Color(0xFF16A34A),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                )
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Date: ${item.startDate.day} ${_getMonthName(item.startDate.month)} - ${item.endDate.day} ${_getMonthName(item.endDate.month)}',
                              style: const TextStyle(fontSize: 12, color: Colors.black54),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Total Cost: ₹${item.totalAmount.toInt()}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0A3B2A)),
                            ),
                            if (item.status == 'confirmed' && item.checkInOTP.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(8)),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Check-In OTP:', style: TextStyle(fontSize: 12, color: Color(0xFF0F5132), fontWeight: FontWeight.bold)),
                                    Text(
                                      item.checkInOTP,
                                      style: const TextStyle(fontSize: 18, color: Color(0xFF0A3B2A), fontWeight: FontWeight.black, letterSpacing: 2),
                                    )
                                  ],
                                ),
                              )
                            ]
                          ],
                        ),
                      ),
                    );
                  },
                )
            ],
            const SizedBox(height: 64), // safe space. NO FOOTER DETAILS EXIST HERE.
          ],
        ),
      ),
    );
  }

  Widget _buildSettingItem(String label, String value, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.black05),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.black45, size: 20),
              const SizedBox(width: 12),
              Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            ],
          ),
          Text(value, style: const TextStyle(fontSize: 13, color: Colors.black54)),
        ],
      ),
    );
  }

  String _getMonthName(int month) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  }
}
