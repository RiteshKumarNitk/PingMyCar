# OwnerPing — Google Play launch guide

Everything here is derived from the code as of September 2026. If the code
changes, re-check the Data safety answers — Play declarations must match
real behaviour.

## 1. Release build

| Item | Value |
|---|---|
| Package (applicationId) | `app.pingmycar.pingmycar_mobile` — **permanent once published** (see §6) |
| App label | OwnerPing |
| Version | `pubspec.yaml` `version:` → versionName+versionCode (currently `0.1.0`, code 1) |
| targetSdk / compileSdk | 36 (Android 16) — meets the Aug 31 2026 requirement |
| minSdk | 24 |
| Permissions | INTERNET, POST_NOTIFICATIONS; plus from plugins: VIBRATE, WAKE_LOCK, ACCESS_NETWORK_STATE, c2dm RECEIVE (FCM). No camera, storage, location or foreground-service permissions. |
| Production API | `https://ping-my-car.vercel.app` (compile-time default in `lib/config.dart`) |
| Developer | InnovateX Technology — https://innovatex-technology.com/ — info@innovatex-technology.com |

### Create the upload key (once — back it up; losing it blocks updates)

```bash
keytool -genkey -v -keystore C:\keys\ownerping-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Create `mobile/android/key.properties` (git-ignored — never commit it or the .jks):

```properties
storeFile=C:/keys/ownerping-upload.jks
storePassword=<your store password>
keyAlias=upload
keyPassword=<your key password>
```

Build and verify the signer is **not** "CN=Android Debug":

```bash
cd mobile
flutter build appbundle --release
keytool -printcert -jarfile build/app/outputs/bundle/release/app-release.aab
```

Without `key.properties` the release build falls back to the debug key (with
a Gradle warning) and Play will reject the upload.

`mobile/android/app/google-services.json` is git-ignored; every build machine
needs a copy (Firebase Console → Project settings → Your apps → Android app →
google-services.json), otherwise the build has no Firebase and no push.

## 2. Store listing (Play Console → Grow → Store presence → Main store listing)

**App name:** OwnerPing

**Contact details** (Play Console → Grow → Store presence → Store settings →
Store listing contact details): email `info@innovatex-technology.com`,
website `https://innovatex-technology.com/`. Developer name shown on Play
comes from the developer account (Play Console → Settings → Developer
account) — set it to InnovateX Technology if that is the publishing entity.

**Short description (≤80):**
Connect with vehicle owners privately using a simple QR code.

**Full description:**

> Blocking a driveway? Lights left on? Someone needs to reach you about your
> vehicle — without you sharing your phone number.
>
> OwnerPing gives your vehicle a private contact QR sticker. Anyone who scans
> it can send you a message from their phone's browser — no app, account,
> phone number or email needed on their side.
>
> For owners:
> • Sign in with Google — no passwords.
> • Add your vehicles and get a QR for each one.
> • Choose from five sticker designs and download, share or print them at
>   actual size.
> • Get a notification when someone contacts you, and reply in the app.
> • Your phone number and email are never shown to the person contacting you.
> • Turn a QR off at any time, block a conversation, or report abuse.
>
> For people contacting an owner:
> • Scan the sticker, pick a reason, write a message, send. That's it.
>
> OwnerPing is developed by InnovateX Technology (innovatex-technology.com).

Assets to upload: 512×512 icon (from `mobile/assets/icon.png`), 1024×500
feature graphic, at least 2 phone screenshots (use real screens: Home,
Vehicles, Sticker designer, Messages, a conversation, the notification).

## 3. Data safety (Play Console → Policy → App content → Data safety)

Data **collected** by the app (owner side). Nothing is **shared** with third
parties — hosting/processing vendors (Vercel, Neon database + object storage,
Upstash, Google sign-in + Firebase Cloud Messaging, Resend email) are service
providers, which Play does not count as sharing. No ads, no analytics, no
crash-reporting SDK. All traffic is HTTPS (encrypted in transit).

| Data (Play category) | Source | Required? | Purpose | Stored | On account deletion |
|---|---|---|---|---|---|
| Name (Personal info → Name) | Google sign-in; editable | Required | Account management, App functionality | Neon Postgres `User.name` | Deleted* |
| Email (Personal info → Email address) | Google sign-in | Required | Account management; new-message email alerts (Resend) | `User.email` | Deleted* |
| Profile photo (Photos) | Google profile image URL | Optional (from Google) | App functionality (optional display on vehicle page) | `User.image` (URL) | Deleted |
| Preferred name (Personal info → Name) | Owner enters | Optional | Optional display on vehicle page | `User.preferredName` | Deleted |
| Vehicle info (Other user-generated content) | Owner enters: nickname, type, colour, visibility toggles | Required (nickname) | App functionality | `Vehicle`, `VehicleProfile` | Deleted* |
| Registration number (Other user-generated content) | Owner enters | Optional | Optional display on vehicle page | `Vehicle.registrationNumber` | Deleted |
| Vehicle photo (Photos) | Owner uploads | Optional | Optional display on vehicle page | Private S3 bucket `userprofile/<userId>/…` | Deleted |
| Messages (Messages → Other in-app messages) | Visitors + owner replies | Required for the feature | App functionality | `Conversation`, `Message` | Deleted* |
| FCM push token (Device or other IDs) | Firebase on the device | Optional (notifications) | App functionality (push) | `Device.fcmToken` | Deleted; also removed on sign-out |
| Session token | Issued at sign-in | Required | Authentication | `Session` + device secure storage | Deleted |

\* Exception: while an abuse report on a conversation is still open, that
conversation and its messages are kept for moderation; the account is kept
as an anonymized, suspended record (no name/email/photo/vehicle details) and
the vehicle's QR is turned off. A security audit entry records the deletion
without personal details.

- Users can request deletion: **Yes** — in the app (Profile → Account →
  Delete account), on the web (Dashboard → Settings → Delete account).
- **Delete account URL** (Data safety form): `https://ping-my-car.vercel.app/delete-account`

## 4. Other App content declarations

- **Privacy policy:** `https://ping-my-car.vercel.app/privacy-policy`
- **Ads:** No ads.
- **App access:** choose "All or some functionality is restricted" and add
  instructions (no credentials needed): *Open the app and tap **Continue as
  Guest**. This opens a read-only demo account with sample vehicles, QR
  stickers and conversations. Owner features that change data (adding
  vehicles, replying, notifications) require Google sign-in.*
- **Target audience:** 18+ (vehicle owners). Not designed for children.
- **Content rating:** complete the questionnaire; the app has user-to-user
  messaging (answer "Yes" to users interacting/communicating).
- **Financial / health / government features:** None.

## 5. Testing track requirement

Personal developer accounts created after 13 Nov 2023 must run a **closed
test with at least 12 opted-in testers for 14 consecutive days** before
applying for production (Play Console → Test and release → Testing → Closed
testing). Check the account type under Play Console → Settings → Developer
account.

## 6. Open items

1. **Package name (decision).** `app.pingmycar.pingmycar_mobile` carries the
   old brand and can never change after the first upload. It appears in:
   `mobile/android/app/build.gradle.kts` (namespace + applicationId),
   `android/app/src/main/kotlin/app/pingmycar/pingmycar_mobile/MainActivity.kt`
   (package + folder), `mobile/android/app/google-services.json` (Firebase
   Android app), the Google Cloud Android OAuth client, and docs/README.
   Renaming means: new Android app in Firebase (`pingmycar-da11d`) → new
   google-services.json; new Android OAuth client in Google Cloud project
   `25207232577`; update the two Gradle lines and move MainActivity.kt.
2. **Google Sign-In SHA-1s.** Google sign-in uses the Google Cloud project
   `25207232577` (the backend's web client), not the Firebase project. After
   the first upload, copy BOTH SHA-1s from Play Console → Test and release →
   Setup → App signing ("App signing key certificate" and "Upload key
   certificate") and add each as an Android OAuth client (package name as
   above) in Google Cloud Console → project 25207232577 → APIs & Services →
   Credentials → Create credentials → OAuth client ID → Android.
3. **Crash monitoring.** None installed. Firebase Crashlytics fits the
   existing Firebase setup; adding it adds "Crash logs"/"Diagnostics" to Data
   safety.
4. **Demo QR URLs on the website** encode `https://pingmycar.app/v/EXAMPLE1`
   (homepage hero, sticker showcase, stickers page). Confirm you own that
   domain, or change them to an OwnerPing URL.
