package com.parentalcontrol.child

import android.content.Context
import android.util.Log
import com.parentalcontrol.child.network.ApiClient
import com.parentalcontrol.child.utils.TokenManager
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Locale

class UsageSyncManager(private val context: Context) {
    
    private val usageStatsRepository = UsageStatsRepository(context)
    
    // In a real app this would be a CoroutineWorker
    suspend fun syncUsageData() {
        val permissionManager = PermissionManager(context)
        if (!permissionManager.hasUsageAccessPermission()) {
            Log.w("UsageSync", "No usage access permission. Skipping sync.")
            return
        }

        val todayStats = usageStatsRepository.getTodayUsageStats()
        if (todayStats.isEmpty()) return

        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        
        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        val todayStr = dateFormat.format(calendar.time)

        val payload = todayStats.map {
            mapOf(
                "packageName" to it.packageName,
                "appName" to it.appName,
                "usageDate" to todayStr,
                "usageDuration" to it.usageDuration,
                "launchCount" to 1, // UsageStatsManager doesn't give reliable launch counts easily without parsing events
                "firstUsedAt" to it.firstUsedAt,
                "lastUsedAt" to it.lastUsedAt
            )
        }

        val tokenManager = TokenManager(context)
        val token = tokenManager.getToken()
        
        if (token.isNullOrEmpty()) {
            Log.e("UsageSync", "No token found. Skipping sync.")
            return
        }

        Log.i("UsageSync", "Syncing ${payload.size} apps usage to backend")
        val success = ApiClient.syncUsage(token, mapOf("usageData" to payload))
        if (success) {
            Log.i("UsageSync", "Sync successful")
        } else {
            Log.e("UsageSync", "Sync failed")
        }
    }
}
