package com.parentalcontrol.child

data class DowntimeSchedule(
    val id: String,
    val name: String,
    val days: List<Int>,
    val startTime: String,
    val endTime: String,
    val enabled: Boolean
)
