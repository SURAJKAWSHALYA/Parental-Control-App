package com.parentalcontrol.child

data class AppLimit(
    val deviceId: String,
    val packageName: String,
    val appName: String,
    val dailyLimitMinutes: Int,
    val enabled: Boolean
)
