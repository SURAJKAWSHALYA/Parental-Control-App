package com.parentalcontrol.child.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages ORDER BY createdAt ASC")
    fun getAllMessagesFlow(): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE isPendingSync = 1")
    suspend fun getPendingMessages(): List<MessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<MessageEntity>)

    @Query("UPDATE messages SET status = :status, isPendingSync = 0 WHERE clientMessageId = :clientMessageId")
    suspend fun updateMessageStatus(clientMessageId: String, status: String)

    @Query("DELETE FROM messages WHERE clientMessageId = :clientMessageId")
    suspend fun deleteMessage(clientMessageId: String)
}
