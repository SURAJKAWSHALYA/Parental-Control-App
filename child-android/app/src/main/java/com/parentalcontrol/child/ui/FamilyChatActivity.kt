package com.parentalcontrol.child.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parentalcontrol.child.data.AppDatabase
import com.parentalcontrol.child.data.MessageEntity
import kotlinx.coroutines.launch
import java.util.UUID

class FamilyChatActivity : ComponentActivity() {

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val db = AppDatabase.getDatabase(this)
        val messageDao = db.messageDao()

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val messages by messageDao.getAllMessagesFlow().collectAsState(initial = emptyList())
                    val listState = rememberLazyListState()
                    val coroutineScope = rememberCoroutineScope()
                    var inputText by remember { mutableStateOf("") }
                    
                    // Auto scroll to bottom
                    LaunchedEffect(messages.size) {
                        if (messages.isNotEmpty()) {
                            listState.animateScrollToItem(messages.size - 1)
                        }
                    }

                    Column(modifier = Modifier.fillMaxSize()) {
                        TopAppBar(
                            title = { 
                                Column {
                                    Text("Family Chat", fontWeight = FontWeight.Bold)
                                    Text("🟢 Online", fontSize = 12.sp, color = Color(0xFF2E7D32))
                                }
                            },
                            navigationIcon = {
                                IconButton(onClick = { finish() }) {
                                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                                }
                            },
                            colors = TopAppBarDefaults.smallTopAppBarColors(
                                containerColor = Color(0xFFE8F5E9)
                            )
                        )
                        
                        LazyColumn(
                            state = listState,
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 16.dp),
                            contentPadding = PaddingValues(vertical = 16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(messages) { msg ->
                                val isMe = msg.senderType == "Child"
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .background(
                                                color = if (isMe) Color(0xFF3F51B5) else Color(0xFFF5F5F5),
                                                shape = RoundedCornerShape(
                                                    topStart = 16.dp,
                                                    topEnd = 16.dp,
                                                    bottomStart = if (isMe) 16.dp else 4.dp,
                                                    bottomEnd = if (isMe) 4.dp else 16.dp
                                                )
                                            )
                                            .padding(12.dp)
                                            .widthIn(max = 280.dp)
                                    ) {
                                        if (msg.messageType == "IMAGE" || msg.messageType == "VIDEO") {
                                            Text(
                                                text = "📎 [${msg.messageType}] Media attachment",
                                                color = if (isMe) Color.White else Color.Black,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(bottom = 4.dp)
                                            )
                                        } else {
                                            Text(
                                                text = msg.text,
                                                color = if (isMe) Color.White else Color.Black,
                                                fontSize = 16.sp
                                            )
                                        }
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.End
                                        ) {
                                            Text(
                                                text = if (isMe) msg.status else "",
                                                color = if (isMe) Color.LightGray else Color.Gray,
                                                fontSize = 10.sp,
                                                modifier = Modifier.padding(top = 4.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // Input area
                        Surface(
                            shadowElevation = 8.dp,
                            color = MaterialTheme.colorScheme.surface
                        ) {
                            Column(modifier = Modifier.fillMaxWidth().padding(8.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(onClick = { /* Launch Camera Intent */ }, modifier = Modifier.weight(1f)) {
                                        Text("📷 Camera")
                                    }
                                    Button(onClick = { /* Launch Photo Picker */ }, modifier = Modifier.weight(1f)) {
                                        Text("🖼️ Gallery")
                                    }
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    OutlinedTextField(
                                        value = inputText,
                                        onValueChange = { inputText = it },
                                        modifier = Modifier.weight(1f),
                                        placeholder = { Text("Message...") },
                                        shape = RoundedCornerShape(24.dp),
                                        maxLines = 4
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    FloatingActionButton(
                                        onClick = {
                                            if (inputText.isNotBlank()) {
                                                val newMsg = MessageEntity(
                                                    clientMessageId = UUID.randomUUID().toString(),
                                                    conversationId = "local_temp", 
                                                    text = inputText,
                                                    senderType = "Child",
                                                    messageType = "TEXT",
                                                    status = "SENDING", 
                                                    createdAt = System.currentTimeMillis(),
                                                    isPendingSync = true
                                                )
                                                coroutineScope.launch {
                                                    messageDao.insertMessage(newMsg)
                                                    inputText = ""
                                                }
                                            }
                                        },
                                        containerColor = Color(0xFF3F51B5),
                                        contentColor = Color.White
                                    ) {
                                        Icon(Icons.Default.Send, contentDescription = "Send")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
