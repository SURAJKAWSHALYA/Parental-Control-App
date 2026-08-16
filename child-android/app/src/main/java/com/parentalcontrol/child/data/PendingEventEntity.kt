package com.parentalcontrol.child.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_events")
data class PendingEventEntity(
    @PrimaryKey
    val eventId: String,
    val eventType: String,
    val payload: String, // JSON representation of the event payload
    val createdAt: Long,
    val attemptCount: Int = 0,
    val status: String = "PENDING", // PENDING, SYNCING, FAILED
    val lastAttemptAt: Long = 0L
)
