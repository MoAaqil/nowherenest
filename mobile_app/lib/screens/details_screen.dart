import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class DetailsScreen extends StatefulWidget {
  final String propertyId;

  const DetailsScreen({Key? key, required this.propertyId}) : super(key: key);

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> {
  Property? _property;
  List<Room> _rooms = [];
  List<dynamic> _reviews = [];
  bool _loading = true;
  Room? _selectedRoom;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    try {
      final details = await ApiService.getPropertyDetails(widget.propertyId);
      final roomsList = await ApiService.getRoomsByProperty(widget.propertyId);

      setState(() {
        _property = details['property'];
        _reviews = details['reviews'];
        _rooms = roomsList;
        if (roomsList.isNotEmpty) {
          _selectedRoom = roomsList[0];
        }
      });
    } catch (e) {
      print('Error loading property details: $e');
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

    if (_property == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('Failed to load property details.')),
      );
    }

    final prop = _property!;
    final photos = prop.photos.isNotEmpty
        ? prop.photos
        : ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Text(prop.name, style: const TextStyle(color: Color(0xFF0A3B2A), fontSize: 16, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Carousel (paging builder)
            SizedBox(
              height: 240,
              child: PageView.builder(
                itemCount: photos.length,
                itemBuilder: (context, idx) {
                  return Image.network(
                    photos[idx],
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: Colors.black10),
                  );
                },
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F0EC),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          prop.type.toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF0A3B2A)),
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(LucideIcons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            '${prop.starRating} Rating',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          prop.name,
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                        ),
                      ),
                      if (prop.owner?.isLicensed ?? false) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: Color(0xFF22C55E),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.check, color: Colors.white, size: 12),
                        )
                      ]
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin, color: Colors.black45, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          prop.address,
                          style: const TextStyle(fontSize: 13, color: Colors.black54),
                        ),
                      )
                    ],
                  ),
                  const Divider(height: 32),

                  // Host Details Card
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.black05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: const BoxDecoration(
                                color: Color(0xFF0A3B2A),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  (prop.owner?.name ?? 'Host').substring(0, 1).toUpperCase(),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  prop.owner?.name ?? 'Local Host',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const Text('Verified Local Host', style: TextStyle(fontSize: 11, color: Colors.black54)),
                              ],
                            )
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFF0A3B2A)),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Verified',
                            style: TextStyle(color: Color(0xFF0A3B2A), fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        )
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                  const Text('Select Room Option', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 12),

                  // Rooms List
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _rooms.length,
                    itemBuilder: (context, idx) {
                      final rm = _rooms[idx];
                      final isSelected = _selectedRoom?.id == rm.id;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedRoom = rm),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFE8F0EC) : Colors.white,
                            border: Border.all(color: isSelected ? const Color(0xFF0A3B2A) : Colors.black12, width: isSelected ? 2 : 1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${rm.category.toUpperCase()} ROOM',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  const SizedBox(height: 4),
                                  Text('Capacity: ${rm.capacity} Guests', style: const TextStyle(fontSize: 11, color: Colors.black54)),
                                ],
                              ),
                              Text(
                                '₹${rm.price.toInt()}/night',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0A3B2A)),
                              )
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  const Divider(height: 32),
                  const Text('Description', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text(
                    prop.description,
                    style: const TextStyle(fontSize: 13, color: Colors.black54, height: 1.4),
                  ),

                  const Divider(height: 32),
                  const Text('Customer Reviews', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 12),

                  // Horizontal reviews carousel
                  SizedBox(
                    height: 120,
                    child: _reviews.isEmpty
                        ? const Center(child: Text('No reviews submitted yet.', style: TextStyle(fontSize: 12, color: Colors.black54)))
                        : ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: _reviews.length,
                            itemBuilder: (context, idx) {
                              final rev = _reviews[idx];
                              return Container(
                                width: 260,
                                margin: const EdgeInsets.only(right: 12),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(color: Colors.black12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          rev['customerName'] ?? 'Guest',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFEF3C7),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            '★ ${rev['rating']}',
                                            style: const TextStyle(color: Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        )
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Expanded(
                                      child: Text(
                                        rev['comment'] ?? '',
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 11, color: Colors.black54, fontStyle: FontStyle.italic),
                                      ),
                                    )
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                  const SizedBox(height: 80), // safe space. NO FOOTER DETAILS EXIST HERE.
                ],
              ),
            )
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black05, blurRadius: 4, offset: Offset(0, -2))],
        ),
        child: ElevatedButton(
          onPressed: () {
            // Initiate Booking process
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0A3B2A),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Book Standard Overnight Stay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
        ),
      ),
    );
  }
}
