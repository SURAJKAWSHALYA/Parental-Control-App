package com.parentalcontrol.child.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class WebsiteRestrictedActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val url = intent.getStringExtra("BLOCKED_URL") ?: "Unknown Website"
        
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.White
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Surface(
                            color = Color(0xFFFFEBEE),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.size(80.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("!", color = Color.Red, fontSize = 48.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Text(
                            text = "Website Restricted",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = "This website is restricted by\nyour family safety settings.",
                            textAlign = TextAlign.Center,
                            fontSize = 16.sp,
                            color = Color.DarkGray
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = url,
                            textAlign = TextAlign.Center,
                            fontSize = 14.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Medium
                        )
                        
                        Spacer(modifier = Modifier.height(32.dp))
                        
                        Text(
                            text = "If you believe this is a mistake,\ncontact your parent.",
                            textAlign = TextAlign.Center,
                            fontSize = 14.sp,
                            color = Color.Gray
                        )
                        
                        Spacer(modifier = Modifier.height(48.dp))
                        
                        Button(
                            onClick = {
                                // Go home
                                val intent = android.content.Intent(android.content.Intent.ACTION_MAIN)
                                intent.addCategory(android.content.Intent.CATEGORY_HOME)
                                intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                                startActivity(intent)
                                finish()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3F51B5)),
                            modifier = Modifier.fillMaxWidth().height(50.dp)
                        ) {
                            Text("Back", fontSize = 16.sp)
                        }
                    }
                }
            }
        }
    }
}
