package com.parentalcontrol.child

import android.Manifest
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

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
        
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var appState by remember { mutableStateOf(AppState.WELCOME) }
                    
                    when (appState) {
                        AppState.WELCOME -> WelcomeScreen(onContinue = { appState = AppState.PAIRING })
                        AppState.PAIRING -> PairingScreen(onPaired = { appState = AppState.PERMISSIONS })
                        AppState.PERMISSIONS -> PermissionsScreen(
                            onRequestLocation = { requestLocationPermission() },
                            onRequestUsage = { /* TODO */ },
                            onContinue = { appState = AppState.HOME }
                        )
                        AppState.HOME -> HomeScreen()
                    }
                }
            }
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
        Button(
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Continue", fontSize = 18.sp)
        }
    }
}

@Composable
fun PairingScreen(onPaired: () -> Unit) {
    var pairingCode by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

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
            onValueChange = { if (it.length <= 6) pairingCode = it.uppercase() },
            label = { Text("Pairing Code") },
            modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp),
            singleLine = true
        )
        Button(
            onClick = {
                if (pairingCode.length == 6) {
                    isLoading = true
                    coroutineScope.launch {
                        // Mock API Call delay
                        delay(1500)
                        isLoading = false
                        onPaired()
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

@Composable
fun PermissionsScreen(onRequestLocation: () -> Unit, onRequestUsage: () -> Unit, onContinue: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = "Device Permissions",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp, top = 48.dp)
        )
        Text(
            text = "The following Android permissions may be required for parental-control features. Only grant what is needed.",
            modifier = Modifier.padding(bottom = 32.dp)
        )
        
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Location", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(bottom = 8.dp))
                Text("Used for location sharing and geofence alerts.", color = Color.Gray, modifier = Modifier.padding(bottom = 16.dp))
                Button(onClick = onRequestLocation) {
                    Text("Allow Location")
                }
            }
        }
        
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Usage Access", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(bottom = 8.dp))
                Text("Required to monitor application screen time.", color = Color.Gray, modifier = Modifier.padding(bottom = 16.dp))
                Button(onClick = onRequestUsage) {
                    Text("Open Settings")
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        
        Button(
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Finish Setup", fontSize = 18.sp)
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

    LaunchedEffect(Unit) {
        // Mock background Socket.IO connection and Heartbeat
        launch {
            while(isActive) {
                lastHeartbeat = "Just now"
                hasUsagePermission = permissionManager.hasUsageAccessPermission()
                delay(15000) // Send heartbeat every 15 seconds in this mock
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

        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
        ) {
                Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Device Status", fontWeight = FontWeight.Medium)
                Text("🟢 Connected", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
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
