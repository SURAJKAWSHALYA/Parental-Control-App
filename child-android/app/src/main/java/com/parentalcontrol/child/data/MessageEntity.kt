package com.parentalcontrol.child.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val clientMessageId: String,
    val conversationId: String,
    val text: String,
    val senderType: String, // "Parent" or "Child"
    val messageType: String = "TEXT", // "TEXT", "IMAGE", "VIDEO"
    val mediaId: String? = null,
    val status: String, // "SENDING", "SENT", "DELIVERED", "READ", "FAILED"
    val createdAt: Long,
    val isPendingSync: Boolean = false
)
