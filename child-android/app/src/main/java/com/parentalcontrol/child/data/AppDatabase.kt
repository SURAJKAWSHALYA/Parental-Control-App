package com.parentalcontrol.child.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [
    WebsiteRuleEntity::class, 
    WebsiteCategoryEntity::class,
    LocationRecordEntity::class
], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun websiteRuleDao(): WebsiteRuleDao
    abstract fun locationRecordDao(): LocationRecordDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "parental_control_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
