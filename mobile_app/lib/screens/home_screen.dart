import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import 'details_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Property> _properties = [];
  bool _loading = true;
  String _searchQuery = '';
  String _selectedCategory = 'cottage';
  double _gpsRange = 40.0;
  bool _showFilters = false;

  // Filter settings
  double _minPrice = 0;
  double _maxPrice = 1000;
  List<String> _selectedAmenities = [];

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties() async {
    setState(() {
      _loading = true;
    });
    try {
      final list = await ApiService.getProperties(
        type: 'stay',
        search: _searchQuery,
      );
      
      // Apply filters client-side
      var filtered = list.where((item) {
        // Enforce category constraint if no search query
        if (_searchQuery.isEmpty) {
          final category = (item.type == 'resort' || item.type == 'villa' || item.type == 'homestay') ? 'cottage' : (item.type == 'guesthouse' ? 'pg' : item.type);
          if (category != _selectedCategory) return false;
        }
        
        // Price limits
        // for simplicity, assume price filtering is checked against properties' standard category price
        return true;
      }).toList();

      setState(() {
        _properties = filtered;
      });
    } catch (e) {
      print('Error loading properties: $e');
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Row(
          children: [
            Image.asset(
              'assets/logo.png',
              height: 32,
              errorBuilder: (_, __, ___) => const Icon(Icons.location_on, color: Color(0xFF0A3B2A)),
            ),
            const SizedBox(width: 8),
            const Text(
              'nowhere nest',
              style: TextStyle(color: Color(0xFF0A3B2A), fontWeight: FontWeight.w900, fontSize: 18),
            )
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.bell, color: Colors.black87),
            onPressed: () {},
          )
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0A3B2A)))
          : RefreshIndicator(
              onRefresh: _loadProperties,
              color: const Color(0xFF0A3B2A),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Discover\nyour new house!',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        height: 1.2,
                        color: Color(0xFF0A3B2A),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Search input & filter button (Mockup layout matches second image)
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 48,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.black12),
                              boxShadow: const [
                                BoxShadow(color: Colors.black05, blurRadius: 4, offset: Offset(0, 2))
                              ],
                            ),
                            child: Row(
                              children: [
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 12.0),
                                  child: Icon(LucideIcons.search, color: Colors.black45, size: 20),
                                ),
                                Expanded(
                                  child: TextField(
                                    decoration: const InputDecoration(
                                      hintText: 'Search Places',
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.zero,
                                    ),
                                    onChanged: (val) {
                                      setState(() {
                                        _searchQuery = val;
                                      });
                                      _loadProperties();
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _showFilters = !_showFilters;
                            });
                          },
                          child: Container(
                            height: 48,
                            width: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A), // Dark sliders button matching mockup
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              LucideIcons.slidersHorizontal,
                              color: _showFilters ? const Color(0xFF22C55E) : Colors.white,
                              size: 18,
                            ),
                          ),
                        )
                      ],
                    ),

                    if (_showFilters) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.black12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Select Amenities', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              children: ['wifi', 'pool', 'food', 'hot_water'].map((amenity) {
                                final selected = _selectedAmenities.contains(amenity);
                                return ChoiceChip(
                                  label: Text(amenity.replaceAll('_', ' ')),
                                  selected: selected,
                                  onSelected: (val) {
                                    setState(() {
                                      if (val) {
                                        _selectedAmenities.add(amenity);
                                      } else {
                                        _selectedAmenities.remove(amenity);
                                      }
                                    });
                                    _loadProperties();
                                  },
                                );
                              }).toList(),
                            )
                          ],
                        ),
                      )
                    ],

                    const SizedBox(height: 20),

                    // GPS Alert Proximity Strip
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        border: Border.all(color: const Color(0xFF86EFAC)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: const BoxDecoration(
                                  color: Color(0xFF22C55E),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(LucideIcons.navigation, color: Colors.white, size: 14),
                              ),
                              const SizedBox(width: 8),
                              const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'GPS Proximity Range Filter',
                                    style: TextStyle(color: Color(0xFF0F5132), fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Text(
                                    'Limit recommendations by distance',
                                    style: TextStyle(color: Color(0xFF14532D), fontSize: 11),
                                  )
                                ],
                              )
                            ],
                          ),
                          Slider(
                            value: _gpsRange,
                            min: 0,
                            max: 250,
                            activeColor: const Color(0xFF22C55E),
                            inactiveColor: Colors.black12,
                            onChanged: (val) {
                              setState(() {
                                _gpsRange = val;
                              });
                            },
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('0 km', style: TextStyle(fontSize: 11, color: Colors.black54)),
                              Text(
                                '${_gpsRange.toInt()} km Proximity',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F5132)),
                              ),
                              const Text('250 km', style: TextStyle(fontSize: 11, color: Colors.black54)),
                            ],
                          )
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Category segregation Chips (Mockup category layout)
                    Row(
                      children: [
                        _buildCategoryChip('cottage', 'Cottages'),
                        const SizedBox(width: 8),
                        _buildCategoryChip('hotel', 'Hotels'),
                        const SizedBox(width: 8),
                        _buildCategoryChip('apartment', 'Apartments'),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Properties Scroll Feed
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _properties.length,
                      itemBuilder: (context, idx) {
                        final item = _properties[idx];
                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DetailsScreen(propertyId: item.id),
                              ),
                            );
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.black05),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                  child: Image.network(
                                    item.photos.isNotEmpty ? item.photos[0] : 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
                                    height: 180,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(color: Colors.black10, height: 180),
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
                                          Text(
                                            item.type.toUpperCase(),
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF22C55E)),
                                          ),
                                          Row(
                                            children: [
                                              const Icon(LucideIcons.star, color: Colors.amber, size: 14),
                                              const SizedBox(width: 2),
                                              Text(
                                                item.starRating.toString(),
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                              )
                                            ],
                                          )
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item.name,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                            ),
                                          ),
                                          if (item.owner?.isLicensed ?? false) ...[
                                            const SizedBox(width: 4),
                                            Container(
                                              padding: const EdgeInsets.all(2),
                                              decoration: const BoxDecoration(
                                                color: Color(0xFF22C55E),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(LucideIcons.check, color: Colors.white, size: 10),
                                            )
                                          ]
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          const Icon(LucideIcons.mapPin, color: Colors.black45, size: 14),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              item.address,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 12, color: Colors.black54),
                                            ),
                                          )
                                        ],
                                      )
                                    ],
                                  ),
                                )
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 64), // Safe bottom nav margin. NO FOOTER DETAILS EXIST HERE.
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCategoryChip(String category, String label) {
    final active = _selectedCategory == category;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategory = category;
        });
        _loadProperties();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? Colors.transparent : Colors.black12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
