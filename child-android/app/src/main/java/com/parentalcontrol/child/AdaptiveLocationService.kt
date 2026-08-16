package com.parentalcontrol.child

import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.content.ContextCompat
import android.content.IntentFilter

class AdaptiveLocationService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    
    // Adaptive intervals in milliseconds
    private val INTERVAL_ACTIVE = 2 * 60 * 1000L // 2 minutes (when active/moving)
    private val INTERVAL_STATIC = 15 * 60 * 1000L // 15 minutes (when still)
    private val INTERVAL_LOW_BATTERY = 30 * 60 * 1000L // 30 minutes (battery < 15%)
    
    private var currentInterval = INTERVAL_ACTIVE
    private var isMoving = true // Mock state for motion detection

    private val locationPoller = object : Runnable {
        override fun run() {
            pollLocation()
            adjustIntervalAndSchedule()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        handler.post(locationPoller)
        return START_STICKY
    }

    private fun pollLocation() {
        val locationGranted = ContextCompat.checkSelfPermission(
            this,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        if (locationGranted) {
            // Fetch location via FusedLocationProviderClient
            // and save to local Room DB using LocationRecordDao
        }
    }
    
    private fun adjustIntervalAndSchedule() {
        val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { ifilter ->
            applicationContext.registerReceiver(null, ifilter)
        }
        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val batteryPct = level * 100 / scale.toFloat()
        
        val status: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging: Boolean = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL

        // Adaptive logic
        currentInterval = when {
            batteryPct < 15 && !isCharging -> INTERVAL_LOW_BATTERY
            !isMoving -> INTERVAL_STATIC
            else -> INTERVAL_ACTIVE
        }
        
        handler.postDelayed(locationPoller, currentInterval)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(locationPoller)
    }
}
