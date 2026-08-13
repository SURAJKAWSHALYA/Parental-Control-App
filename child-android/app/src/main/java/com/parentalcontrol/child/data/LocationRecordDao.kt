package com.parentalcontrol.child.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface LocationRecordDao {
    @Query("SELECT * FROM location_records ORDER BY timestamp ASC LIMIT :limit")
    suspend fun getPendingLocations(limit: Int = 100): List<LocationRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLocation(location: LocationRecordEntity)

    @Query("DELETE FROM location_records WHERE id IN (:ids)")
    suspend fun deleteLocations(ids: List<Int>)

    @Query("SELECT COUNT(*) FROM location_records")
    suspend fun getCount(): Int

    // Delete oldest records if queue is too large to prevent unlimited offline storage
    @Query("DELETE FROM location_records WHERE id IN (SELECT id FROM location_records ORDER BY timestamp ASC LIMIT :count)")
    suspend fun deleteOldest(count: Int)
}
