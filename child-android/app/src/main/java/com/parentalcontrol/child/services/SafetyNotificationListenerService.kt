package com.parentalcontrol.child.services

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.parentalcontrol.child.network.SocketManager
import org.json.JSONObject

class SafetyNotificationListenerService : NotificationListenerService() {

    private val TAG = "SafetyNotifListener"

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        sbn?.let {
            val packageName = it.packageName
            val notification = it.notification
            val extras = notification.extras

            val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

            // Target mostly social/communication apps
            val targetApps = listOf(
                "com.whatsapp",
                "com.instagram.android",
                "com.facebook.katana",
                "org.telegram.messenger",
                "com.facebook.orca"
            )

            if (targetApps.contains(packageName) || title.isNotEmpty() || text.isNotEmpty()) {
                Log.d(TAG, "Notification received from: $packageName")
                
                try {
                    val data = JSONObject().apply {
                        put("packageName", packageName)
                        put("title", title)
                        put("text", text)
                        put("timestamp", it.postTime)
                    }
                    
                    // Emit to SocketManager
                    SocketManager.emit("notification:received", data)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing notification", e)
                }
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
        // Currently do nothing on removed
    }
}
