package com.parentalcontrol.child.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Base64
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.parentalcontrol.child.network.SocketManager
import org.json.JSONObject
import java.io.ByteArrayOutputStream

class ScreenCaptureService : Service() {

    private val TAG = "ScreenCaptureService"
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isCapturing = false

    companion object {
        const val EXTRA_RESULT_CODE = "RESULT_CODE"
        const val EXTRA_RESULT_DATA = "RESULT_DATA"
        private const val CHANNEL_ID = "screen_capture_channel"
        private const val NOTIFICATION_ID = 101
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "STOP") {
            stopCapture()
            stopSelf()
            return START_NOT_STICKY
        }

        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
        val resultData = intent?.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)

        if (resultCode != 0 && resultData != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, buildNotification(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
            } else {
                startForeground(NOTIFICATION_ID, buildNotification())
            }
            startCapture(resultCode, resultData)
        } else {
            stopSelf()
        }

        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Capture",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Screen Sharing Active")
            .setContentText("Your screen is being shared with your parent.")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startCapture(resultCode: Int, resultData: Intent) {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)

        if (mediaProjection == null) {
            Log.e(TAG, "MediaProjection is null")
            stopSelf()
            return
        }

        val metrics = android.content.res.Resources.getSystem().displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        // Keep it small to avoid OOM and reduce bandwidth
        val scaledWidth = width / 2
        val scaledHeight = height / 2

        imageReader = ImageReader.newInstance(scaledWidth, scaledHeight, PixelFormat.RGBA_8888, 2)
        
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenCapture",
            scaledWidth,
            scaledHeight,
            density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            handler
        )

        isCapturing = true
        SocketManager.emit("screen:session:started", JSONObject())

        // Start capturing frames
        captureFrameRunnable.run()
    }

    private val captureFrameRunnable = object : Runnable {
        override fun run() {
            if (!isCapturing) return
            
            try {
                val image: Image? = imageReader?.acquireLatestImage()
                if (image != null) {
                    val planes = image.planes
                    val buffer = planes[0].buffer
                    val pixelStride = planes[0].pixelStride
                    val rowStride = planes[0].rowStride
                    val rowPadding = rowStride - pixelStride * image.width

                    val bitmap = Bitmap.createBitmap(
                        image.width + rowPadding / pixelStride,
                        image.height,
                        Bitmap.Config.ARGB_8888
                    )
                    bitmap.copyPixelsFromBuffer(buffer)
                    image.close()

                    // Compress to JPEG and Base64
                    val outputStream = ByteArrayOutputStream()
                    // 50% quality to save bandwidth
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 50, outputStream)
                    val byteArray = outputStream.toByteArray()
                    val base64Image = "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)

                    val payload = JSONObject().apply {
                        put("image", base64Image)
                        put("timestamp", System.currentTimeMillis())
                    }
                    SocketManager.emit("screen:frame", payload)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error capturing frame", e)
            }

            // Capture at ~1 FPS
            handler.postDelayed(this, 1000)
        }
    }

    private fun stopCapture() {
        isCapturing = false
        handler.removeCallbacks(captureFrameRunnable)
        virtualDisplay?.release()
        imageReader?.close()
        mediaProjection?.stop()
        mediaProjection = null
        SocketManager.emit("screen:session:stopped", JSONObject())
    }

    override fun onDestroy() {
        stopCapture()
        super.onDestroy()
    }
}
