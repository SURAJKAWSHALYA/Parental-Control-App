package com.parentalcontrol.child.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.parentalcontrol.child.data.AppDatabase
import com.parentalcontrol.child.data.LocationRecordEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class LocationTrackerService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)
    private val CHANNEL_ID = "LocationServiceChannel"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Family Safety")
            .setContentText("Location is being shared with your parent")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
        
        // Simulating FusedLocationProviderClient receiving a location update
        simulateLocationUpdates()

        return START_STICKY
    }

    private fun simulateLocationUpdates() {
        serviceScope.launch {
            // Mock Location
            val loc = LocationRecordEntity(
                latitude = 37.7749 + (Math.random() - 0.5) * 0.01,
                longitude = -122.4194 + (Math.random() - 0.5) * 0.01,
                accuracy = 10f,
                altitude = null,
                speed = null,
                heading = null,
                battery = 76,
                source = "fused",
                timestamp = System.currentTimeMillis()
            )
            
            val db = AppDatabase.getDatabase(applicationContext)
            
            // Limit offline queue to 10,000 records
            val count = db.locationRecordDao().getCount()
            if (count > 10000) {
                db.locationRecordDao().deleteOldest(100)
            }
            
            db.locationRecordDao().insertLocation(loc)
            
            // In a real implementation: Socket.emit("location:updated", loc)
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Location Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
