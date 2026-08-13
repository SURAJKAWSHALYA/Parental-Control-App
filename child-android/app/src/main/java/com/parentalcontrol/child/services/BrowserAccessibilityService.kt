package com.parentalcontrol.child.services

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.parentalcontrol.child.WebsiteRestrictionManager
import com.parentalcontrol.child.ui.WebsiteRestrictedActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BrowserAccessibilityService : AccessibilityService() {

    private lateinit var restrictionManager: WebsiteRestrictionManager
    private val serviceScope = CoroutineScope(Dispatchers.IO)
    private var lastUrl: String = ""

    override fun onServiceConnected() {
        super.onServiceConnected()
        restrictionManager = WebsiteRestrictionManager(this)
        serviceScope.launch {
            restrictionManager.refreshCache()
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
            event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            
            val parentNodeInfo = event.source ?: return
            
            val url = captureUrl(parentNodeInfo)
            if (url != null && url != lastUrl) {
                lastUrl = url
                
                if (restrictionManager.isUrlBlocked(url)) {
                    // Block the website
                    val intent = Intent(this, WebsiteRestrictedActivity::class.java).apply {
                        putExtra("BLOCKED_URL", url)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    startActivity(intent)
                    
                    // Note: In a full app, we would emit a Socket.IO event here
                    // e.g., SocketManager.emitActivity("WEBSITE", "Website blocked: $url")
                }
            }
        }
    }

    private fun captureUrl(info: AccessibilityNodeInfo): String? {
        val nodes = info.findAccessibilityNodeInfosByViewId("com.android.chrome:id/url_bar")
        if (nodes.isNotEmpty()) {
            val urlNode = nodes[0]
            val text = urlNode.text?.toString()
            return text
        }
        return null
    }

    override fun onInterrupt() {
        // Handle interrupt
    }
}
