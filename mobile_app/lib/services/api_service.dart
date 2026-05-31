import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  // Use 10.0.2.2 for Android Emulator, or localhost for iOS simulator
  static const String baseUrl = 'http://localhost:5000/api';

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final headers = {
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Auth Operations
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token'] ?? '');
      return {'success': true, 'user': User.fromJson(data['user'])};
    }
    return {'success': false, 'message': data['message'] ?? 'Login failed'};
  }

  static Future<Map<String, dynamic>> register(String name, String email, String password, String phone, String role) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
        'role': role,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token'] ?? '');
      return {'success': true, 'user': User.fromJson(data['user'])};
    }
    return {'success': false, 'message': data['message'] ?? 'Registration failed'};
  }

  static Future<User?> getMe() async {
    try {
      final headers = await _getHeaders();
      final res = await http.get(Uri.parse('$baseUrl/auth/me'), headers: headers);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return User.fromJson(data['user']);
      }
    } catch (e) {
      print('Failed to get current user: $e');
    }
    return null;
  }

  // Properties & Listings
  static Future<List<Property>> getProperties({String type = 'stay', String search = ''}) async {
    try {
      final headers = await _getHeaders();
      final query = 'type=$type&search=$search';
      // In Nowhere Nest, listings route maps properties. We query listings directly for unified search
      final res = await http.get(Uri.parse('$baseUrl/listings?$query'), headers: headers);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['listings'] as List? ?? [];
        // Map listings json keys to Property parameters
        return list.map((item) {
          final loc = item['location'] ?? {};
          return Property(
            id: item['_id'] ?? '',
            name: item['title'] ?? '',
            description: item['description'] ?? '',
            type: item['type'] ?? 'stay',
            address: loc['address'] ?? '',
            lat: (loc['lat'] ?? 9.5929).toDouble(),
            lng: (loc['lng'] ?? 76.4227).toDouble(),
            starRating: (item['starRating'] ?? 4.0).toDouble(),
            photos: List<String>.from(item['images'] ?? []),
            amenities: List<String>.from(item['amenities'] ?? []),
            owner: item['owner'] != null ? User.fromJson(item['owner']) : null,
          );
        }).toList();
      }
    } catch (e) {
      print('Failed to fetch properties: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> getPropertyDetails(String id) async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('$baseUrl/properties/$id'), headers: headers);
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      return {
        'property': Property.fromJson(data['property']),
        'reviews': data['reviews'] as List? ?? [],
      };
    }
    throw Exception(data['message'] ?? 'Failed to load details');
  }

  static Future<List<Room>> getRoomsByProperty(String propertyId) async {
    try {
      final headers = await _getHeaders();
      final res = await http.get(Uri.parse('$baseUrl/rooms/property/$propertyId'), headers: headers);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['rooms'] as List? ?? [];
        return list.map((r) => Room.fromJson(r)).toList();
      }
    } catch (e) {
      print('Failed to load rooms: $e');
    }
    return [];
  }

  // Bookings
  static Future<Booking> createBooking(Map<String, dynamic> bookingData) async {
    final headers = await _getHeaders();
    final res = await http.post(
      Uri.parse('$baseUrl/bookings'),
      headers: headers,
      body: jsonEncode(bookingData),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      return Booking.fromJson(data['booking']);
    }
    throw Exception(data['message'] ?? 'Failed to complete booking');
  }

  static Future<List<Booking>> getCustomerBookings() async {
    try {
      final headers = await _getHeaders();
      final res = await http.get(Uri.parse('$baseUrl/bookings/customer'), headers: headers);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['bookings'] as List? ?? [];
        return list.map((b) => Booking.fromJson(b)).toList();
      }
    } catch (e) {
      print('Failed to load booking history: $e');
    }
    return [];
  }

  static Future<bool> submitReview(String bookingId, int rating, String comment) async {
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse('$baseUrl/bookings/$bookingId/review'),
        headers: headers,
        body: jsonEncode({'rating': rating, 'comment': comment}),
      );
      return res.statusCode == 200;
    } catch (e) {
      print('Failed to submit review: $e');
    }
    return false;
  }

  // Rides API
  static Future<Map<String, dynamic>> createRide(String bookingId, String type, double startLat, double startLng, double endLat, double endLng) async {
    final headers = await _getHeaders();
    final res = await http.post(
      Uri.parse('$baseUrl/rides'),
      headers: headers,
      body: jsonEncode({
        'bookingId': bookingId,
        'type': type,
        'startLocation': {'lat': startLat, 'lng': startLng, 'address': 'Current Location'},
        'endLocation': {'lat': endLat, 'lng': endLng, 'address': 'Target Property Stay'}
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      return data['ride'];
    }
    throw Exception(data['message'] ?? 'Failed to dispatch cab booking');
  }

  // Vibes Reels API
  static Future<List<Vibe>> getVibes() async {
    try {
      final headers = await _getHeaders();
      final res = await http.get(Uri.parse('$baseUrl/vibes'), headers: headers);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['vibes'] as List? ?? [];
        return list.map((v) => Vibe.fromJson(v)).toList();
      }
    } catch (e) {
      print('Failed to load reels: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> toggleLikeVibe(String vibeId) async {
    final headers = await _getHeaders();
    final res = await http.post(Uri.parse('$baseUrl/vibes/$vibeId/like'), headers: headers);
    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw Exception('Failed to toggle like');
  }
}
