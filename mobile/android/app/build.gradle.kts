import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Firebase/FCM. Guarded so `flutter build` still works before
// google-services.json is dropped into android/app/ (see README).
// NOTE: `file(...)` resolves against this module (android/app). The previous
// `File("google-services.json")` inside `plugins {}` resolved against the
// Gradle daemon's working directory, was always false, and silently left
// Firebase uninitialized — no FCM token, so no push notifications at all.
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
} else {
    logger.warn("google-services.json missing in android/app — Firebase/FCM push will be disabled in this build.")
}

// Release signing (Play upload key). Values live in android/key.properties,
// which is git-ignored together with *.jks — never commit either:
//   storeFile=/absolute/path/to/ownerping-upload.jks
//   storePassword=…
//   keyAlias=upload
//   keyPassword=…
val keystoreProperties = Properties().apply {
    val f = rootProject.file("key.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
val hasReleaseKey = keystoreProperties.getProperty("storeFile") != null

android {
    namespace = "app.pingmycar.pingmycar_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        // Core library desugaring is required by flutter_local_notifications.
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "app.pingmycar.pingmycar_mobile"
        // firebase_messaging requires >= 23.
        minSdk = maxOf(23, flutter.minSdkVersion)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasReleaseKey) {
            create("release") {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            if (hasReleaseKey) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                // Lets `flutter run --release` work locally. Google Play
                // REJECTS debug-signed bundles — create key.properties first.
                logger.warn("android/key.properties not found — release build is DEBUG-signed and cannot be uploaded to Google Play.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
