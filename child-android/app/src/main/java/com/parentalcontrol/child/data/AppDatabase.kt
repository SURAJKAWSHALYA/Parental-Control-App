package com.parentalcontrol.child.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [
    WebsiteRuleEntity::class, 
    WebsiteCategoryEntity::class,
    LocationRecordEntity::class,
    MessageEntity::class
], version = 3, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun websiteRuleDao(): WebsiteRuleDao
    abstract fun locationRecordDao(): LocationRecordDao
    abstract fun messageDao(): MessageDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "parental_control_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
