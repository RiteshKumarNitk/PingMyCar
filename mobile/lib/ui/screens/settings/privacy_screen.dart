import 'package:flutter/material.dart';

/// Static privacy explainer — reflects the backend's real behavior:
/// visitors never see owner contact info; QR only exposes the public flow.
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('What visitors see', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF0D1926))),
                  const SizedBox(height: 10),
                  _bullet('Your vehicle\'s name/type — if you enable it per vehicle'),
                  _bullet('A form to send you a private message'),
                  _bullet('Nothing else, unless you explicitly turn it on'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('What visitors never see', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFFDC2626))),
                  const SizedBox(height: 10),
                  _bullet('Your phone number'),
                  _bullet('Your email address'),
                  _bullet('Your registration number (unless you enable it)'),
                  _bullet('Your Google account or profile photo (unless enabled)'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('About the QR code', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 10),
                  const Text(
                    'The QR contains only a public link to your vehicle\'s contact page — no personal information, no ids that expose your account. You can pause it anytime, or regenerate it to make old stickers stop working.',
                    style: TextStyle(fontSize: 13.5, height: 1.4, color: Color(0xFF5B6773)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bullet(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('•  ', style: TextStyle(fontWeight: FontWeight.w800)),
            Expanded(child: Text(text, style: const TextStyle(fontSize: 13.5, height: 1.35))),
          ],
        ),
      );
}
