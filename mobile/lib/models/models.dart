/// Models mapped to the backend's actual API responses (see /api routes).
/// Backend data stays authoritative; the app only renders what it sends.
library;

class UserProfile {
  UserProfile({required this.id, required this.name, required this.email, this.image, this.preferredName, this.hasRealEmail = true});

  final String id;
  final String name;
  final String email;
  final String? image;
  final String? preferredName;
  /// False when the account has a placeholder email (phone-signup accounts).
  final bool hasRealEmail;

  factory UserProfile.fromJson(Map<String, dynamic> j) => UserProfile(
        id: j['id'] as String,
        name: (j['name'] as String?) ?? '',
        email: (j['email'] as String?) ?? '',
        image: j['image'] as String?,
        preferredName: j['preferredName'] as String?,
        hasRealEmail: j['hasRealEmail'] as bool? ?? true,
      );

  /// Placeholder names (phone-number accounts) render better blank.
  bool get hasRealName => name.trim().isNotEmpty;
}

class Vehicle {
  Vehicle({
    required this.id,
    required this.name,
    this.type,
    this.registrationNumber,
    this.color,
    required this.publicToken,
    required this.qrActive,
    this.photoUrl,
    this.conversationCount = 0,
  });

  final String id;
  final String name;
  final String? type; // CAR | BIKE | SCOOTER | TRUCK | VAN | OTHER
  final String? registrationNumber;
  final String? color;
  final String publicToken;
  final bool qrActive;
  final String? photoUrl;
  final int conversationCount;

  static const typeLabels = {
    'CAR': 'Car',
    'BIKE': 'Motorcycle',
    'SCOOTER': 'Scooter',
    'TRUCK': 'Truck',
    'VAN': 'Van',
    'OTHER': 'Other',
  };

  String get typeLabel => typeLabels[type] ?? 'Vehicle';

  factory Vehicle.fromJson(Map<String, dynamic> j) => Vehicle(
        id: j['id'] as String,
        name: j['name'] as String,
        type: j['type'] as String?,
        registrationNumber: j['registrationNumber'] as String?,
        color: j['color'] as String?,
        publicToken: j['publicToken'] as String,
        qrActive: (j['qrActive'] as bool?) ?? true,
        photoUrl: j['photoUrl'] as String?,
        conversationCount: (j['_count']?['conversations'] as num?)?.toInt() ?? 0,
      );
}

class ConversationSummary {
  ConversationSummary({
    required this.id,
    required this.vehicleId,
    required this.vehicleName,
    required this.reason,
    required this.reasonLabel,
    required this.status,
    this.unread = false,
    this.unreadCount = 0,
    this.lastMessageBody,
    this.lastMessageAt,
  });

  final String id;
  final String vehicleId;
  final String vehicleName;
  final String reason;
  final String reasonLabel;
  final String status; // OPEN | CLOSED | BLOCKED
  final bool unread;
  final int unreadCount;
  final String? lastMessageBody;
  final DateTime? lastMessageAt;

  factory ConversationSummary.fromListJson(Map<String, dynamic> j) => ConversationSummary(
        id: j['id'] as String,
        vehicleId: j['vehicleId'] as String,
        vehicleName: j['vehicleName'] as String,
        reason: j['reason'] as String,
        reasonLabel: _reasonLabel(j['reason'] as String),
        status: j['status'] as String,
        lastMessageBody: j['lastMessage']?['body'] as String?,
        lastMessageAt: _date(j['lastMessage']?['createdAt'] ?? j['updatedAt']),
      );

  factory ConversationSummary.fromRecentJson(Map<String, dynamic> j) => ConversationSummary(
        id: j['id'] as String,
        vehicleId: j['vehicleId'] as String,
        vehicleName: j['vehicleName'] as String,
        reason: j['reason'] as String,
        reasonLabel: (j['reasonLabel'] as String?) ?? _reasonLabel(j['reason'] as String),
        status: j['status'] as String,
        unread: (j['unread'] as bool?) ?? false,
        lastMessageBody: j['lastMessageBody'] as String?,
        lastMessageAt: _date(j['lastMessageAt']),
      );

  static const _labels = {
    'LIGHTS_ON': 'Lights are on',
    'MOVE_VEHICLE': 'Please move the vehicle',
    'DOOR_OPEN': 'Door/window appears open',
    'VEHICLE_ISSUE': 'Vehicle issue',
    'DAMAGE': 'Possible damage',
    'SECURITY': 'Security concern',
    'URGENT': 'Urgent',
    'OTHER': 'Other',
  };

  static String _reasonLabel(String id) => _labels[id] ?? id;
}

class ConversationMessage {
  ConversationMessage({required this.senderType, required this.body, required this.createdAt});

  final String senderType; // VISITOR | OWNER
  final String body;
  final DateTime createdAt;

  factory ConversationMessage.fromJson(Map<String, dynamic> j) => ConversationMessage(
        senderType: j['senderType'] as String,
        body: j['body'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String).toLocal(),
      );
}

class ConversationDetail {
  ConversationDetail({
    required this.id,
    required this.vehicleId,
    required this.vehicleName,
    required this.reason,
    required this.reasonLabel,
    required this.status,
    required this.messages,
  });

  final String id;
  final String vehicleId;
  final String vehicleName;
  final String reason;
  final String reasonLabel;
  final String status;
  final List<ConversationMessage> messages;

  factory ConversationDetail.fromJson(Map<String, dynamic> j) => ConversationDetail(
        id: j['id'] as String,
        vehicleId: j['vehicleId'] as String,
        vehicleName: j['vehicleName'] as String,
        reason: j['reason'] as String,
        reasonLabel: ConversationSummary._reasonLabel(j['reason'] as String),
        status: j['status'] as String,
        messages: (j['messages'] as List).map((m) => ConversationMessage.fromJson(m)).toList(),
      );
}

class DashboardSummary {
  DashboardSummary({
    required this.vehicleCount,
    required this.activeQrCount,
    required this.unreadMessageCount,
    required this.totalMessageCount,
    required this.recentConversations,
  });

  final int vehicleCount;
  final int activeQrCount;
  final int unreadMessageCount;
  final int totalMessageCount;
  final List<ConversationSummary> recentConversations;

  factory DashboardSummary.fromJson(Map<String, dynamic> j) => DashboardSummary(
        vehicleCount: (j['vehicleCount'] as num).toInt(),
        activeQrCount: (j['activeQrCount'] as num).toInt(),
        unreadMessageCount: (j['unreadMessageCount'] as num).toInt(),
        totalMessageCount: (j['totalMessageCount'] as num).toInt(),
        recentConversations: (j['recentConversations'] as List? ?? [])
            .map((c) => ConversationSummary.fromRecentJson(c))
            .toList(),
      );
}

DateTime? _date(dynamic v) {
  if (v is String) return DateTime.parse(v).toLocal();
  return null;
}
