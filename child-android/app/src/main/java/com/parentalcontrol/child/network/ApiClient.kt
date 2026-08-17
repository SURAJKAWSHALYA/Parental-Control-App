package com.parentalcontrol.child.network

import com.google.gson.Gson
import com.parentalcontrol.child.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object ApiClient {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    // Request Models
    data class PairingRequest(
        val code: String,
        val deviceName: String,
        val androidVersion: String,
        val manufacturer: String,
        val deviceModel: String,
        val appVersion: String,
        val batteryLevel: Int
    )

    // Response Models
    data class PairingResponseData(
        val deviceId: String,
        val token: String
    )

    data class PairingResponse(
        val success: Boolean,
        val message: String,
        val data: PairingResponseData?
    )

    data class ErrorResponse(
        val success: Boolean,
        val message: String,
        val error_code: String?
    )

    class ApiException(message: String, val errorCode: String? = null) : Exception(message)

    suspend fun pairDevice(requestData: PairingRequest): PairingResponseData {
        return withContext(Dispatchers.IO) {
            val url = "${BuildConfig.BASE_URL}pairing/connect"
            val jsonBody = gson.toJson(requestData)
            val body = jsonBody.toRequestBody(JSON)

            val request = Request.Builder()
                .url(url)
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()

            if (response.isSuccessful && responseBody != null) {
                val apiResponse = gson.fromJson(responseBody, PairingResponse::class.java)
                if (apiResponse.success && apiResponse.data != null) {
                    return@withContext apiResponse.data
                } else {
                    throw ApiException(apiResponse.message)
                }
            } else {
                if (responseBody != null) {
                    try {
                        val errorResponse = gson.fromJson(responseBody, ErrorResponse::class.java)
                        throw ApiException(errorResponse.message, errorResponse.error_code)
                    } catch (e: Exception) {
                        if (e is ApiException) throw e
                        throw ApiException("HTTP ${response.code}")
                    }
                }
                throw ApiException("Unknown network error")
            }
        }
    }
    suspend fun checkHealth(): Boolean {
        return withContext(Dispatchers.IO) {
            val url = "${BuildConfig.BASE_URL}health/ping"
            val request = Request.Builder().url(url).build()
            try {
                val response = client.newCall(request).execute()
                response.isSuccessful
            } catch (e: Exception) {
                false
            }
        }
    }

    suspend fun syncUsage(token: String, requestData: Map<String, Any>): Boolean {
        return withContext(Dispatchers.IO) {
            val url = "${BuildConfig.BASE_URL}app-usage/sync"
            val jsonBody = gson.toJson(requestData)
            val body = jsonBody.toRequestBody(JSON)

            val request = Request.Builder()
                .url(url)
                .header("Authorization", "Bearer $token")
                .post(body)
                .build()

            try {
                val response = client.newCall(request).execute()
                return@withContext response.isSuccessful
            } catch (e: Exception) {
                return@withContext false
            }
        }
    }

    suspend fun syncLocation(token: String, requestData: Map<String, Any>): Boolean {
        return withContext(Dispatchers.IO) {
            val url = "${BuildConfig.BASE_URL}location/sync"
            val jsonBody = gson.toJson(requestData)
            val body = jsonBody.toRequestBody(JSON)

            val request = Request.Builder()
                .url(url)
                .header("Authorization", "Bearer $token")
                .post(body)
                .build()

            try {
                val response = client.newCall(request).execute()
                return@withContext response.isSuccessful
            } catch (e: Exception) {
                return@withContext false
            }
        }
    }
}
