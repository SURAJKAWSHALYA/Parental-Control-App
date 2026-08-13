package com.parentalcontrol.child

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import java.util.Calendar

data class AppUsageRecord(
    val packageName: String,
    val appName: String,
    val usageDuration: Long, // in ms
    val firstUsedAt: Long,
    val lastUsedAt: Long
)

class UsageStatsRepository(private val context: Context) {

    fun getTodayUsageStats(): List<AppUsageRecord> {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val pm = context.packageManager

        // Start of today
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )

        if (stats == null || stats.isEmpty()) {
            return emptyList()
        }

        return stats.filter { it.totalTimeInForeground > 0 }
            .map { stat ->
                val appName = try {
                    val appInfo = pm.getApplicationInfo(stat.packageName, 0)
                    pm.getApplicationLabel(appInfo).toString()
                } catch (e: PackageManager.NameNotFoundException) {
                    stat.packageName
                }

                AppUsageRecord(
                    packageName = stat.packageName,
                    appName = appName,
                    usageDuration = stat.totalTimeInForeground,
                    firstUsedAt = stat.firstTimeStamp,
                    lastUsedAt = stat.lastTimeUsed
                )
            }.filter { 
                // Simple filter to remove some OS level components if needed
                // Real app would filter more system packages
                !it.packageName.startsWith("com.android.") || it.packageName == "com.android.chrome"
            }.sortedByDescending { it.usageDuration }
    }
}
