package com.parentalcontrol.child

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import com.parentalcontrol.child.network.SocketManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
class MainActivity : ComponentActivity() {
    
    // Simplistic state management for the wizard steps
    enum class AppState {
        WELCOME, PAIRING, PERMISSIONS, HOME
    }

    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
            // In a real app we'd update state based on this result
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val tokenManager = com.parentalcontrol.child.utils.TokenManager(this)
        val startState = if (tokenManager.isPaired()) AppState.HOME else AppState.WELCOME
        
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var appState by remember { mutableStateOf(startState) }
                    
                    when (appState) {
                        AppState.WELCOME -> WelcomeScreen(onContinue = { appState = AppState.PAIRING })
                        AppState.PAIRING -> PairingScreen(onPaired = { appState = AppState.PERMISSIONS })
                        AppState.PERMISSIONS -> PermissionsScreen(
                            onContinue = { 
                                appState = AppState.HOME
                                startTrackingService()
                            }
                        )
                        AppState.HOME -> {
                            LaunchedEffect(Unit) {
                                startTrackingService()
                            }
                            HomeScreen()
                        }
                    }
                }
            }
        }
    }

    private fun startTrackingService() {
        val intent = Intent(this, com.parentalcontrol.child.services.LocationTrackerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(this, intent)
        } else {
            startService(intent)
        }
    }

    private fun requestLocationPermission() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }
}

@Composable
fun WelcomeScreen(onContinue: () -> Unit) {
    var isServerAvailable by remember { mutableStateOf<Boolean?>(null) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        isServerAvailable = com.parentalcontrol.child.network.ApiClient.checkHealth()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Family Safety",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF3F51B5),
            modifier = Modifier.padding(bottom = 24.dp)
        )
        Text(
            text = "This device is being connected to a parental safety account.",
            textAlign = TextAlign.Center,
            fontSize = 18.sp,
            modifier = Modifier.padding(bottom = 48.dp)
        )
        
        if (isServerAvailable == false) {
            Text(
                text = "Server unavailable. Please check your network or backend URL.",
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(bottom = 16.dp),
                textAlign = TextAlign.Center
            )
        }

        Button(
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp),
            enabled = isServerAvailable == true
        ) {
            if (isServerAvailable == null) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Connecting...", fontSize = 18.sp)
            } else {
                Text("Continue", fontSize = 18.sp)
            }
        }
    }
}

@Composable
fun PairingScreen(onPaired: () -> Unit) {
    var pairingCode by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Connect Parent",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        Text(
            text = "Enter the pairing code shown on the Parent Dashboard.",
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(bottom = 32.dp)
        )
        OutlinedTextField(
            value = pairingCode,
            onValueChange = { 
                if (it.length <= 6) pairingCode = it.uppercase()
                errorMessage = null
            },
            label = { Text("Pairing Code") },
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            singleLine = true,
            isError = errorMessage != null
        )
        if (errorMessage != null) {
            Text(
                text = errorMessage!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(bottom = 24.dp)
            )
        } else {
            Spacer(modifier = Modifier.height(32.dp))
        }
        
        Button(
            onClick = {
                if (pairingCode.length == 6) {
                    isLoading = true
                    errorMessage = null
                    coroutineScope.launch {
                        val isHealthy = com.parentalcontrol.child.network.ApiClient.checkHealth()
                        if (!isHealthy) {
                            errorMessage = "Server unavailable. Please check your connection."
                            isLoading = false
                            return@launch
                        }
                        try {
                            val request = com.parentalcontrol.child.network.ApiClient.PairingRequest(
                                code = pairingCode,
                                deviceName = Build.MODEL ?: "Unknown Device",
                                androidVersion = Build.VERSION.RELEASE ?: "Unknown",
                                manufacturer = Build.MANUFACTURER ?: "Unknown",
                                deviceModel = Build.MODEL ?: "Unknown",
                                appVersion = "1.0.0",
                                batteryLevel = getBatteryLevel(context)
                            )
                            val response = com.parentalcontrol.child.network.ApiClient.pairDevice(request)
                            val tokenManager = com.parentalcontrol.child.utils.TokenManager(context)
                            tokenManager.saveAuthData(response.deviceId, response.token)
                            isLoading = false
                            onPaired()
                        } catch (e: com.parentalcontrol.child.network.ApiClient.ApiException) {
                            isLoading = false
                            errorMessage = when (e.errorCode) {
                                "INVALID_CODE" -> "That pairing code is invalid or has expired."
                                "VALIDATION_ERROR" -> "Please enter a valid pairing code."
                                else -> e.message ?: "Failed to connect to server."
                            }
                        } catch (e: Exception) {
                            isLoading = false
                            errorMessage = "Network error. Please try again."
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = pairingCode.length == 6 && !isLoading,
            shape = RoundedCornerShape(12.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            } else {
                Text("Connect Device", fontSize = 18.sp)
            }
        }
    }
}

fun getBatteryLevel(context: android.content.Context): Int {
    val batteryStatus = android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED).let { ifilter ->
        context.registerReceiver(null, ifilter)
    }
    val level = batteryStatus?.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1) ?: -1
    val scale = batteryStatus?.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1) ?: -1
    return if (level != -1 && scale != -1) {
        (level * 100 / scale.toFloat()).toInt()
    } else {
        100
    }
}

@Composable
fun PermissionsScreen(onContinue: () -> Unit) {
    val context = LocalContext.current
    val permissionManager = remember { PermissionManager(context) }
    
    var hasLocation by remember { mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) }
    var hasBackgroundLocation by remember { mutableStateOf(if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED else true) }
    var hasCamera by remember { mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    var hasMic by remember { mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) }
    var hasUsage by remember { mutableStateOf(permissionManager.hasUsageAccessPermission()) }
    var hasAccessibility by remember { mutableStateOf(permissionManager.isAccessibilityServiceEnabled()) }
    var hasNotification by remember { mutableStateOf(permissionManager.isNotificationAccessGranted()) }

    val lifecycleOwner = androidx.compose.ui.platform.LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                hasLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                hasBackgroundLocation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED else true
                hasCamera = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                hasMic = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
                hasUsage = permissionManager.hasUsageAccessPermission()
                hasAccessibility = permissionManager.isAccessibilityServiceEnabled()
                hasNotification = permissionManager.isNotificationAccessGranted()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val launcher = androidx.activity.compose.rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        hasLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        hasBackgroundLocation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED else true
        hasCamera = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        hasMic = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = "Permissions & Setup",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp, top = 24.dp)
        )
        Text(
            text = "The following Android permissions are required for monitoring.",
            modifier = Modifier.padding(bottom = 24.dp)
        )

        PermissionRow("Location", if (hasLocation) "GRANTED" else "NOT GRANTED", hasLocation) {
            launcher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
        PermissionRow("Background Location", if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) "NOT REQUIRED" else if (hasBackgroundLocation) "GRANTED" else "NOT GRANTED", hasBackgroundLocation) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                launcher.launch(arrayOf(Manifest.permission.ACCESS_BACKGROUND_LOCATION))
            }
        }
        PermissionRow("Usage Access", if (hasUsage) "GRANTED" else "NOT GRANTED", hasUsage) {
            context.startActivity(permissionManager.getUsageAccessSettingsIntent())
        }
        PermissionRow("Accessibility", if (hasAccessibility) "ENABLED" else "DISABLED", hasAccessibility) {
            context.startActivity(permissionManager.getAccessibilitySettingsIntent())
        }
        PermissionRow("Notification Access", if (hasNotification) "GRANTED" else "NOT GRANTED", hasNotification) {
            context.startActivity(permissionManager.getNotificationAccessSettingsIntent())
        }
        PermissionRow("Screen Capture", "NOT GRANTED / SESSION NOT ACTIVE", false) {
            // No intent, needs active session
        }
        PermissionRow("Camera", if (hasCamera) "GRANTED" else "NOT GRANTED", hasCamera) {
            launcher.launch(arrayOf(Manifest.permission.CAMERA))
        }
        PermissionRow("Microphone", if (hasMic) "GRANTED" else "NOT GRANTED", hasMic) {
            launcher.launch(arrayOf(Manifest.permission.RECORD_AUDIO))
        }

        Spacer(modifier = Modifier.height(24.dp))
        
        Button(
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Finish Setup", fontSize = 18.sp)
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
fun PermissionRow(title: String, status: String, isGranted: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(
                    status,
                    color = if (status.contains("NOT REQUIRED")) Color.Gray else if (isGranted) Color(0xFF2E7D32) else Color.Red,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
            if (!isGranted && !status.contains("NOT REQUIRED") && !status.contains("SESSION NOT ACTIVE")) {
                Button(onClick = onClick) {
                    Text("Enable")
                }
            }
        }
    }
}

@Composable
fun HomeScreen() {
    val coroutineScope = rememberCoroutineScope()
    var lastHeartbeat by remember { mutableStateOf("Not sent yet") }

    val context = LocalContext.current
    val permissionManager = remember { PermissionManager(context) }
    var hasUsagePermission by remember { mutableStateOf(permissionManager.hasUsageAccessPermission()) }
    var screenTimeStr by remember { mutableStateOf("Calculating...") }

    val connectionState by SocketManager.connectionState.collectAsState()

    LaunchedEffect(Unit) {
        SocketManager.init(context)
        
        launch {
            while(isActive) {
                if (SocketManager.connectionState.value == "CONNECTED") {
                    val battery = getBatteryLevel(context)
                    SocketManager.emitHeartbeat(battery)
                    val format = SimpleDateFormat("hh:mm a", Locale.getDefault())
                    lastHeartbeat = format.format(Date())
                }
                hasUsagePermission = permissionManager.hasUsageAccessPermission()
                delay(15000) // Send heartbeat every 15 seconds
            }
        }
        
        launch {
            // Mock Usage Sync
            val syncManager = UsageSyncManager(context)
            while(isActive) {
                syncManager.syncUsageData()
                
                // Get local total for display
                val repo = UsageStatsRepository(context)
                val stats = repo.getTodayUsageStats()
                val totalMs = stats.sumOf { it.usageDuration }
                
                val hours = totalMs / (1000 * 60 * 60)
                val minutes = (totalMs % (1000 * 60 * 60)) / (1000 * 60)
                
                screenTimeStr = if (hours > 0) "${hours}h ${minutes}m" else "${minutes}m"
                
                delay(60000) // Sync every minute in mock
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Family Safety",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 24.dp, bottom = 32.dp)
        )

        val statusColor = when(connectionState) {
            "CONNECTED" -> Color(0xFF2E7D32)
            "CONNECTING" -> Color(0xFFF57F17)
            "ERROR" -> Color.Red
            else -> Color.Gray
        }
        val statusText = when(connectionState) {
            "CONNECTED" -> "🟢 Connected"
            "CONNECTING" -> "🟡 Connecting..."
            "ERROR" -> "🔴 Error"
            else -> "⚫ Disconnected"
        }

        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
        ) {
                Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Device Status", fontWeight = FontWeight.Medium)
                Text(statusText, fontWeight = FontWeight.Bold, color = statusColor)
            }
            Text("Last heartbeat: $lastHeartbeat", fontSize = 10.sp, color = Color.Gray, modifier = Modifier.padding(start = 16.dp, bottom = 8.dp))
        }
        
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Parent Account", fontWeight = FontWeight.Medium)
                    Text("Connected", color = Color.Gray)
                }
                Divider(modifier = Modifier.padding(vertical = 12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Today's Screen Time", fontWeight = FontWeight.Medium)
                    Text(screenTimeStr, color = Color.Gray)
                }
                Divider(modifier = Modifier.padding(vertical = 12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Battery", fontWeight = FontWeight.Medium)
                    Text("78%", color = Color.Gray)
                }
                Divider(modifier = Modifier.padding(vertical = 12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Usage Access", fontWeight = FontWeight.Medium)
                    Text(if (hasUsagePermission) "✓ Enabled" else "✗ Disabled", color = if (hasUsagePermission) Color(0xFF2E7D32) else Color.Red)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        
        Surface(
            color = Color(0xFF3F51B5),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Device Protection", color = Color.White, fontSize = 14.sp)
                Text("ACTIVE", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp, modifier = Modifier.padding(top = 4.dp))
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text("Website Restrictions", color = Color.White, fontSize = 14.sp)
                Text("ACTIVE", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(top = 2.dp))
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text("Location Tracking", color = Color.White, fontSize = 14.sp)
                val hasLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                Text(if (hasLocation) "ACTIVE" else "DISABLED", color = if (hasLocation) Color.White else Color.Red, fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(top = 2.dp))
                
                Text("Last Updated: Today, 8:15 PM", color = Color.LightGray, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            Text("Settings", color = Color.Gray)
            Text("Permissions", color = Color.Gray)
            Text("Help", color = Color.Gray)
            Text("About", color = Color.Gray)
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = {
                context.startActivity(android.content.Intent(context, com.parentalcontrol.child.ui.FamilyChatActivity::class.java))
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE8F5E9), contentColor = Color(0xFF2E7D32))
        ) {
            Text("Open Family Chat", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        }
    }
}
