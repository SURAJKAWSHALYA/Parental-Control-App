package com.parentalcontrol.child

data class AllowedApp(
    val id: String,
    val packageName: String,
    val appName: String,
    val allowedDuringDowntime: Boolean
)
