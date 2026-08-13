package com.parentalcontrol.child.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "location_records")
data class LocationRecordEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val altitude: Double?,
    val speed: Float?,
    val heading: Float?,
    val battery: Int?,
    val source: String,
    val timestamp: Long
)
