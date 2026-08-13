package com.parentalcontrol.child

data class ActivityEvent(
    val type: String,
    val title: String,
    val description: String,
    val metadata: Map<String, Any>? = null
)
