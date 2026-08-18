package com.parentalcontrol.child.network

import android.content.Context
import android.util.Log
import com.parentalcontrol.child.BuildConfig
import com.parentalcontrol.child.utils.TokenManager
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import java.net.URI

object SocketManager {
    private const val TAG = "SocketManager"
    private var socket: Socket? = null

    // Connection states: CONNECTING, CONNECTED, DISCONNECTED, ERROR
    private val _connectionState = MutableStateFlow("DISCONNECTED")
    val connectionState: StateFlow<String> = _connectionState

    fun init(context: Context) {
        if (socket != null && socket?.connected() == true) return

        val tokenManager = TokenManager(context)
        val token = tokenManager.getToken()

        if (token.isNullOrEmpty()) {
            Log.e(TAG, "AUTH FAILURE: No token found. Cannot connect to socket.")
            return
        }

        try {
            // The BASE_URL ends with /api/, so we strip it to get the socket host
            val baseUrl = BuildConfig.BASE_URL.replace("/api/", "")
            
            val opts = IO.Options()
            opts.reconnection = true
            opts.reconnectionDelay = 1000
            opts.reconnectionDelayMax = 5000
            opts.reconnectionAttempts = Int.MAX_VALUE
            opts.transports = arrayOf(io.socket.engineio.client.transports.WebSocket.NAME)

            // Pass token in auth for Socket.IO v4
            val authMap = java.util.Collections.singletonMap<String, String>("token", token)
            opts.auth = authMap

            _connectionState.value = "CONNECTING"

            socket = IO.socket(URI.create(baseUrl), opts)

            pendingListeners.forEach { (event, listener) ->
                socket?.on(event) { args ->
                    if (args.isNotEmpty() && args[0] is JSONObject) {
                        listener(args[0] as JSONObject)
                    } else {
                        listener(null)
                    }
                }
            }
            pendingListeners.clear()

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "CONNECT: Socket connected successfully")
                _connectionState.value = "CONNECTED"
            }

            socket?.on(Socket.EVENT_DISCONNECT) { args ->
                val reason = if (args.isNotEmpty()) args[0].toString() else "Unknown"
                Log.w(TAG, "DISCONNECT: Socket disconnected. Reason: $reason")
                _connectionState.value = "DISCONNECTED"
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = if (args.isNotEmpty()) args[0].toString() else "Unknown"
                Log.e(TAG, "EVENT FAILURE: Socket connection error: $error")
                _connectionState.value = "ERROR"
            }

            // Backend commands and configuration updates
            socket?.on("parent:command") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as JSONObject
                    Log.d(TAG, "Received parent:command -> $data")
                    // Handle command logically
                }
            }
            
            socket?.on("restriction:updated") { args ->
                if (args.isNotEmpty()) {
                    Log.d(TAG, "Received restriction:updated")
                    // Trigger sync
                }
            }

            socket?.connect()

        } catch (e: Exception) {
            Log.e(TAG, "AUTH FAILURE: Failed to initialize socket", e)
            _connectionState.value = "ERROR"
        }
    }

    fun emitHeartbeat(batteryLevel: Int) {
        if (socket?.connected() == true) {
            val data = JSONObject()
            data.put("batteryLevel", batteryLevel)
            socket?.emit("device:heartbeat", data)
            Log.d(TAG, "Heartbeat emitted")
        }
    }

    fun emitLocation(latitude: Double, longitude: Double, accuracy: Float, battery: Int, timestamp: Long) {
        if (socket?.connected() == true) {
            val data = JSONObject()
            data.put("latitude", latitude)
            data.put("longitude", longitude)
            data.put("accuracy", accuracy)
            data.put("batteryLevel", battery)
            data.put("timestamp", timestamp)
            socket?.emit("location:updated", data)
            Log.d(TAG, "LOCATION_DEBUG Socket.IO LOCATION_UPDATED emission: lat=$latitude, lng=$longitude, acc=$accuracy")
        }
    }

    fun emitActivity(type: String, title: String, description: String, metadata: JSONObject? = null) {
        if (socket?.connected() == true) {
            val data = JSONObject()
            data.put("type", type)
            data.put("title", title)
            data.put("description", description)
            if (metadata != null) {
                data.put("metadata", metadata)
            }
            socket?.emit("activity:new", data)
            Log.d(TAG, "Activity emitted: $title")
        }
    }

    fun emit(event: String, data: JSONObject) {
        if (socket?.connected() == true) {
            socket?.emit(event, data)
        }
    }

    private val pendingListeners = mutableMapOf<String, (JSONObject?) -> Unit>()

    fun on(event: String, listener: (JSONObject?) -> Unit) {
        if (socket != null) {
            socket?.on(event) { args ->
                if (args.isNotEmpty() && args[0] is JSONObject) {
                    listener(args[0] as JSONObject)
                } else {
                    listener(null)
                }
            }
        } else {
            pendingListeners[event] = listener
        }
    }

    fun disconnect() {
        Log.d(TAG, "DISCONNECT: Disconnecting socket manually")
        socket?.disconnect()
        socket = null
        _connectionState.value = "DISCONNECTED"
    }
}
