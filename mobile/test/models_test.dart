import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/models/models.dart';

void main() {
  group('Vehicle (parses the real /api/vehicles response shape)', () {
    test('full record', () {
      final v = Vehicle.fromJson({
        'id': 'veh-1',
        'ownerId': 'user-1',
        'type': 'CAR',
        'name': 'Honda City',
        'registrationNumber': 'RJ14XX0000',
        'publicToken': 'K7M3PQ9X',
        'qrActive': true,
        'color': 'White',
        'scanCount': 3,
        'createdAt': '2026-09-21T10:00:00.000Z',
        'updatedAt': '2026-09-22T10:00:00.000Z',
      });
      expect(v.id, 'veh-1');
      expect(v.name, 'Honda City');
      expect(v.type, 'CAR');
      expect(v.typeLabel, 'Car');
      expect(v.registrationNumber, 'RJ14XX0000');
      expect(v.publicToken, 'K7M3PQ9X');
      expect(v.qrActive, isTrue);
    });

    test('BIKE label', () {
      final v = Vehicle.fromJson({'id': 'v2', 'name': 'Activa', 'type': 'BIKE', 'publicToken': 'T2'});
      expect(v.typeLabel, 'Motorcycle');
    });

    test('unknown type falls back safely', () {
      final v = Vehicle.fromJson({'id': 'v3', 'name': 'X', 'type': 'HOVERBOARD', 'publicToken': 'T3'});
      expect(v.typeLabel, 'Vehicle');
    });

    test('missing qrActive defaults to true (backend default)', () {
      final v = Vehicle.fromJson({'id': 'v4', 'name': 'X', 'publicToken': 'T4'});
      expect(v.qrActive, isTrue);
    });
  });

  group('ConversationSummary (list shape from /api/messages)', () {
    test('parses list item with lastMessage', () {
      final c = ConversationSummary.fromListJson({
        'id': 'con-1',
        'vehicleId': 'veh-1',
        'vehicleName': 'Honda City',
        'reason': 'LIGHTS_ON',
        'status': 'OPEN',
        'lastMessage': {
          'body': 'Your headlights are on.',
          'senderType': 'VISITOR',
          'createdAt': '2026-09-25T08:30:00.000Z',
        },
        'updatedAt': '2026-09-25T08:30:00.000Z',
      });
      expect(c.reasonLabel, 'Lights are on');
      expect(c.lastMessageBody, 'Your headlights are on.');
      expect(c.status, 'OPEN');
      expect(c.lastMessageAt, isNotNull);
    });

    test('unknown reason id falls back to raw id', () {
      final c = ConversationSummary.fromListJson({
        'id': 'c', 'vehicleId': 'v', 'vehicleName': 'V', 'reason': 'SOMETHING_NEW', 'status': 'OPEN',
      });
      expect(c.reasonLabel, 'SOMETHING_NEW');
    });
  });

  group('DashboardSummary (shape from /api/dashboard/summary)', () {
    test('parses counts and recent conversations', () {
      final s = DashboardSummary.fromJson({
        'vehicleCount': 2,
        'activeQrCount': 2,
        'unreadMessageCount': 3,
        'totalMessageCount': 11,
        'recentConversations': [
          {
            'id': 'c1',
            'vehicleId': 'v1',
            'vehicleName': 'Honda City',
            'reason': 'LIGHTS_ON',
            'reasonLabel': 'Lights are on',
            'status': 'OPEN',
            'unread': true,
            'lastMessageBody': 'Your headlights are on.',
            'lastMessageAt': '2026-09-25T08:30:00.000Z',
          },
        ],
      });
      expect(s.vehicleCount, 2);
      expect(s.activeQrCount, 2);
      expect(s.unreadMessageCount, 3);
      expect(s.totalMessageCount, 11);
      expect(s.recentConversations, hasLength(1));
      expect(s.recentConversations.first.unread, isTrue);
      expect(s.recentConversations.first.reasonLabel, 'Lights are on');
    });

    test('missing recentConversations defaults to empty', () {
      final s = DashboardSummary.fromJson({
        'vehicleCount': 0, 'activeQrCount': 0, 'unreadMessageCount': 0, 'totalMessageCount': 0,
      });
      expect(s.recentConversations, isEmpty);
    });
  });

  group('ConversationDetail (shape from GET /api/conversations/:id)', () {
    test('parses messages in order', () {
      final d = ConversationDetail.fromJson({
        'id': 'con-1',
        'vehicleId': 'veh-1',
        'vehicleName': 'Honda City',
        'reason': 'LIGHTS_ON',
        'status': 'OPEN',
        'messages': [
          {'senderType': 'VISITOR', 'body': 'Your headlights are on.', 'createdAt': '2026-09-25T08:30:00.000Z'},
          {'senderType': 'OWNER', 'body': 'Thanks! On my way.', 'createdAt': '2026-09-25T08:40:00.000Z'},
        ],
      });
      expect(d.messages, hasLength(2));
      expect(d.messages.first.senderType, 'VISITOR');
      expect(d.messages.last.senderType, 'OWNER');
      expect(d.reasonLabel, 'Lights are on');
    });
  });
}
