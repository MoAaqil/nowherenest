class User {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final bool isLicensed;
  final String? profileImage;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.isLicensed = false,
    this.profileImage,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'customer',
      isLicensed: json['isLicensed'] ?? false,
      profileImage: json['profileImage'],
    );
  }
}

class Property {
  final String id;
  final String name;
  final String description;
  final String type;
  final String address;
  final double lat;
  final double lng;
  final double starRating;
  final List<String> photos;
  final List<String> amenities;
  final User? owner;

  Property({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.address,
    required this.lat,
    required this.lng,
    required this.starRating,
    required this.photos,
    required this.amenities,
    this.owner,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    final location = json['location'] ?? {};
    return Property(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? '',
      address: json['address'] ?? '',
      lat: (location['lat'] ?? 0.0).toDouble(),
      lng: (location['lng'] ?? 0.0).toDouble(),
      starRating: (json['starRating'] ?? 3.0).toDouble(),
      photos: List<String>.from(json['photos'] ?? []),
      amenities: List<String>.from(json['amenities'] ?? []),
      owner: json['owner'] != null ? User.fromJson(json['owner']) : null,
    );
  }
}

class Room {
  final String id;
  final String category;
  final double price;
  final int capacity;
  final List<String> images;
  final List<String> amenities;

  Room({
    required this.id,
    required this.category,
    required this.price,
    required this.capacity,
    required this.images,
    required this.amenities,
  });

  factory Room.fromJson(Map<String, dynamic> json) {
    return Room(
      id: json['_id'] ?? '',
      category: json['category'] ?? 'standard',
      price: (json['price'] ?? 0.0).toDouble(),
      capacity: json['capacity'] ?? 2,
      images: List<String>.from(json['images'] ?? []),
      amenities: List<String>.from(json['amenities'] ?? []),
    );
  }
}

class Booking {
  final String id;
  final Property? property;
  final Room? room;
  final DateTime startDate;
  final DateTime endDate;
  final double totalAmount;
  final String status;
  final String checkInOTP;
  final dynamic review;

  Booking({
    required this.id,
    this.property,
    this.room,
    required this.startDate,
    required this.endDate,
    required this.totalAmount,
    required this.status,
    required this.checkInOTP,
    this.review,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['_id'] ?? '',
      property: json['property'] != null ? Property.fromJson(json['property']) : null,
      room: json['room'] != null ? Room.fromJson(json['room']) : null,
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      totalAmount: (json['totalAmount'] ?? 0.0).toDouble(),
      status: json['status'] ?? 'confirmed',
      checkInOTP: json['checkInOTP'] ?? '',
      review: json['review'],
    );
  }
}

class Vibe {
  final String id;
  final User? owner;
  final Property? property;
  final String videoUrl;
  final String caption;
  final List<String> likes;

  Vibe({
    required this.id,
    this.owner,
    this.property,
    required this.videoUrl,
    required this.caption,
    required this.likes,
  });

  factory Vibe.fromJson(Map<String, dynamic> json) {
    return Vibe(
      id: json['_id'] ?? '',
      owner: json['owner'] != null ? User.fromJson(json['owner']) : null,
      property: json['property'] != null ? Property.fromJson(json['property']) : null,
      videoUrl: json['videoUrl'] ?? '',
      caption: json['caption'] ?? '',
      likes: List<String>.from(json['likes'] ?? []),
    );
  }
}
