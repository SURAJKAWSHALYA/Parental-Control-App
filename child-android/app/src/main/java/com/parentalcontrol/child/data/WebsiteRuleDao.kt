package com.parentalcontrol.child.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface WebsiteRuleDao {
    @Query("SELECT * FROM website_rules WHERE enabled = 1")
    suspend fun getActiveRules(): List<WebsiteRuleEntity>

    @Query("SELECT * FROM website_categories WHERE enabled = 1")
    suspend fun getActiveCategories(): List<WebsiteCategoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRules(rules: List<WebsiteRuleEntity>)

    @Query("DELETE FROM website_rules")
    suspend fun clearRules()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategories(categories: List<WebsiteCategoryEntity>)

    @Query("DELETE FROM website_categories")
    suspend fun clearCategories()
}
