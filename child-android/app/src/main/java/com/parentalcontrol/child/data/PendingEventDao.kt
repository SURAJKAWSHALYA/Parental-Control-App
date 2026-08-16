package com.parentalcontrol.child.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface PendingEventDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: PendingEventEntity)

    @Query("SELECT * FROM pending_events WHERE status = 'PENDING' OR status = 'FAILED' ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getPendingEvents(limit: Int): List<PendingEventEntity>

    @Update
    suspend fun updateEvent(event: PendingEventEntity)

    @Query("UPDATE pending_events SET status = :status WHERE eventId IN (:eventIds)")
    suspend fun updateEventStatuses(eventIds: List<String>, status: String)

    @Query("DELETE FROM pending_events WHERE eventId IN (:eventIds)")
    suspend fun deleteEvents(eventIds: List<String>)
    
    @Query("DELETE FROM pending_events")
    suspend fun deleteAll()
}
