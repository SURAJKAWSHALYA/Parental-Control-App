package com.parentalcontrol.child.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "website_rules")
data class WebsiteRuleEntity(
    @PrimaryKey val id: String,
    val type: String, // "BLOCK" or "ALLOW"
    val domain: String,
    val category: String?,
    val enabled: Boolean
)

@Entity(tableName = "website_categories")
data class WebsiteCategoryEntity(
    @PrimaryKey val category: String,
    val blocked: Boolean,
    val enabled: Boolean
)
