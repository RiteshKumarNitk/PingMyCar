# PingMyCar mobile (owner app)

Flutter owner app: Google sign-in → owner APIs → vehicles / QR / messages / stickers + FCM notifications.

## Run

```bash
cd mobile
flutter pub get
flutter run --dart-define=PINGMYCAR_API_BASE_URL=http://10.0.2.2:3100   # Android emulator → local backend
```

On a physical device, use your LAN IP instead of `10.0.2.2`.

## Continue with Google — setup (required once)

The app logs in **only** with Google; the ID token is verified by the existing Better Auth backend. Setup:

1. Open Google Cloud Console → APIs & Services → Credentials (same project as the backend's `GOOGLE_CLIENT_ID`).
2. Create an **OAuth client ID → Web application** if the backend doesn't already have one. This ID is what you pass to the app.
3. Create an **OAuth client ID → Android** with:
   - Package name: `app.pingmycar.pingmycar_mobile`
   - SHA-1: your debug keystore (`cd mobile && gradlew signingReport`) and your release keystore's SHA-1.
4. (iOS) Create an **OAuth client ID → iOS** with bundle id `app.pingmycar.pingmycarMobile`, then add its **reversed** client id as a URL scheme in `ios/Runner/Info.plist`.

Run with the **web client id**:

```bash
flutter run \
  --dart-define=PINGMYCAR_API_BASE_URL=http://10.0.2.2:3100 \
  --dart-define=PINGMYCAR_GOOGLE_CLIENT_ID=<WEB_CLIENT_ID>.apps.googleusercontent.com
```

Note: the backend must also list the app's redirect/callback origin in its authorized origins if you test sign-in from the Flutter web target. The Android/iOS apps do not need that — they use the native Google SDK.

> Verified flow: app → Google SDK (ID token) → `POST /api/auth/sign-in/social` with `{provider: 'google', idToken: {token}}` → backend verifies against Google → `set-auth-token` header → stored → `Authorization: Bearer` on every call. A bad token gets `401 INVALID_TOKEN`; a good one creates the session.

## Push notifications (FCM)

1. In the Firebase console, add an Android app (`app.pingmycar.pingmycar_mobile`) and an iOS app (`app.pingmycar.pingmycarMobile`) to the **same Firebase project the backend uses**.
2. Download `google-services.json` into `android/app/` (the Gradle config auto-activates when the file exists).
3. Download `GoogleService-Info.plist` into `ios/Runner/` (add it to the Runner Xcode target).
4. Server side: set `GOOGLE_APPLICATION_CREDENTIALS_JSON` (service-account JSON) so the backend can send via firebase-admin.

Without these files the app still runs — login, vehicles, QR, messages all work; notifications are simply disabled (the FCM layer no-ops safely).

## Tests

```bash
flutter analyze   # static analysis
flutter test      # unit tests (models, API client, error mapping)
```

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
