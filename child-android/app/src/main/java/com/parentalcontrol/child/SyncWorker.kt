package com.parentalcontrol.child

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.parentalcontrol.child.data.AppDatabase

class SyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            // Check battery level to prevent draining when low (Battery-Aware Sync)
            val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { ifilter ->
                applicationContext.registerReceiver(null, ifilter)
            }
            val status: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging: Boolean = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
            val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val batteryPct = level * 100 / scale.toFloat()

            // Defer work if battery is critically low (< 15%) and not charging
            if (batteryPct < 15 && !isCharging) {
                return Result.retry() // WorkManager will try again later with exponential backoff
            }

            val db = AppDatabase.getDatabase(applicationContext)
            val pendingEventDao = db.pendingEventDao()
            val locationDao = db.locationRecordDao()

            // 1. Upload Pending Events (Activities, Safety Events, Device Health)
            val pendingEvents = pendingEventDao.getPendingEvents(50)
            if (pendingEvents.isNotEmpty()) {
                val eventIds = pendingEvents.map { it.eventId }
                pendingEventDao.updateEventStatuses(eventIds, "SYNCING")
                
                // TODO: Replace with actual Retrofit POST /api/sync/events
                // val success = syncService.uploadEvents(pendingEvents)
                val success = true // Simulated success
                
                if (success) {
                    pendingEventDao.deleteEvents(eventIds)
                } else {
                    pendingEventDao.updateEventStatuses(eventIds, "FAILED")
                }
            }

            // 2. Upload Pending Locations
            val pendingLocations = locationDao.getPendingLocations(100)
            if (pendingLocations.isNotEmpty()) {
                val prefs = applicationContext.getSharedPreferences("auth", Context.MODE_PRIVATE)
                val token = prefs.getString("token", null)
                val deviceId = prefs.getString("deviceId", null)
                
                if (token != null && deviceId != null) {
                    val requestData = mapOf(
                        "deviceId" to deviceId,
                        "records" to pendingLocations.map { loc ->
                            mapOf(
                                "latitude" to loc.latitude,
                                "longitude" to loc.longitude,
                                "accuracy" to loc.accuracy,
                                "altitude" to loc.altitude,
                                "speed" to loc.speed,
                                "heading" to loc.heading,
                                "battery" to loc.battery,
                                "source" to loc.source,
                                "timestamp" to loc.timestamp
                            )
                        }
                    )
                    
                    android.util.Log.d("SyncWorker", "LOCATION_DEBUG Backend location upload: Starting API sync for ${pendingLocations.size} records")
                    val success = com.parentalcontrol.child.network.ApiClient.syncLocation(token, requestData)
                    android.util.Log.d("SyncWorker", "LOCATION_DEBUG Backend location upload HTTP status/error: success=$success")
                    if (success) {
                        val idsToRemove = pendingLocations.map { it.id }
                        locationDao.deleteLocations(idsToRemove)
                    }
                }
            }

            // 3. Fetch latest configuration (App Limits, Downtime, Website Rules)
            // with Configuration Versioning check
            val currentConfigVersion = applicationContext.getSharedPreferences("config", Context.MODE_PRIVATE)
                .getInt("configurationVersion", 0)
                
            // val newConfig = syncService.fetchConfig(currentConfigVersion)
            // if (newConfig.version > currentConfigVersion) {
            //      applyConfig(newConfig)
            //      saveNewVersion(newConfig.version)
            // }

            Result.success()
        } catch (e: Exception) {
            // If network is still down or server errors, retry later using WorkManager exponential backoff
            Result.retry()
        }
    }
}
