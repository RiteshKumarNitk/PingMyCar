package app.pingmycar.pingmycar_mobile

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "app.ownerping/notification_settings")
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "open" -> result.success(openNotificationSettings(call.argument<String>("channelId")))
                    else -> result.notImplemented()
                }
            }
    }

    /**
     * Settings → Apps → OwnerPing → Notifications (or one channel's page when
     * [channelId] is given). Falls back to the app's details page, where
     * Notifications is one tap away, on devices that lack those screens.
     */
    private fun openNotificationSettings(channelId: String?): Boolean {
        val intents = mutableListOf<Intent>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (channelId != null) {
                intents += Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                    .putExtra(Settings.EXTRA_CHANNEL_ID, channelId)
            }
            intents += Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
        }
        intents += Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null))

        for (intent in intents) {
            try {
                startActivity(intent)
                return true
            } catch (_: Exception) {
                // Try the next, more general settings screen.
            }
        }
        return false
    }
}
