package com.parentalcontrol.child.services

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.parentalcontrol.child.data.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ChatSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val db = AppDatabase.getDatabase(applicationContext)
            val dao = db.messageDao()
            
            val pendingMessages = dao.getPendingMessages()
            if (pendingMessages.isEmpty()) {
                return@withContext Result.success()
            }

            // In a real app we'd make a network request to /api/chat/:id/messages
            // For now, we mock the success response and update the local status
            
            for (msg in pendingMessages) {
                // Mock API Call
                // val response = api.sendMessage(msg)
                
                // On success, update status to SENT and remove pending flag
                dao.updateMessageStatus(msg.clientMessageId, "SENT")
            }

            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}
