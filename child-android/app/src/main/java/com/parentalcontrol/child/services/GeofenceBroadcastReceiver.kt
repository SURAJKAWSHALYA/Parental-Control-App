package com.parentalcontrol.child.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class GeofenceBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val geofencingEvent = GeofencingEvent.fromIntent(intent)
        if (geofencingEvent == null) return
        
        if (geofencingEvent.hasError()) {
            Log.e("GeofenceReceiver", "Error: ${geofencingEvent.errorCode}")
            return
        }

        val geofenceTransition = geofencingEvent.geofenceTransition

        if (geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER ||
            geofenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT) {

            val triggeringGeofences = geofencingEvent.triggeringGeofences
            val eventType = if (geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER) "ENTER" else "EXIT"

            triggeringGeofences?.forEach { geofence ->
                Log.d("GeofenceReceiver", "Transition: $eventType for ${geofence.requestId}")
                sendGeofenceEventToBackend(context, geofence.requestId, eventType)
            }
        }
    }

    private fun sendGeofenceEventToBackend(context: Context, placeId: String, eventType: String) {
        val sharedPrefs = context.getSharedPreferences("ParentalControlPrefs", Context.MODE_PRIVATE)
        val deviceToken = sharedPrefs.getString("device_token", null)
        val deviceId = sharedPrefs.getString("device_id", null)

        if (deviceToken == null || deviceId == null) return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                
                val json = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("placeId", placeId)
                    put("eventType", eventType)
                    put("timestamp", System.currentTimeMillis())
                }

                val body = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
                
                val request = Request.Builder()
                    .url("http://10.0.2.2:5000/api/geofences/event")
                    .post(body)
                    .addHeader("Authorization", "Bearer $deviceToken")
                    .build()

                val response = client.newCall(request).execute()
                Log.d("GeofenceReceiver", "Backend event sent: ${response.isSuccessful}")
            } catch (e: Exception) {
                Log.e("GeofenceReceiver", "Failed to send geofence event", e)
            }
        }
    }
}
