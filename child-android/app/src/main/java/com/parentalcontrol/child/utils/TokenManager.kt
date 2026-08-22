package com.parentalcontrol.child.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenManager(context: Context) {

    private val sharedPreferences: SharedPreferences

    init {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        sharedPreferences = EncryptedSharedPreferences.create(
            context,
            "secure_auth_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveAuthData(deviceId: String, token: String) {
        sharedPreferences.edit()
            .putString("DEVICE_ID", deviceId)
            .putString("DEVICE_TOKEN", token)
            .apply()
    }

    fun getDeviceId(): String? {
        return sharedPreferences.getString("DEVICE_ID", null)
    }

    fun getToken(): String? {
        return sharedPreferences.getString("DEVICE_TOKEN", null)
    }

    fun isPaired(): Boolean {
        return !getDeviceId().isNullOrEmpty() && !getToken().isNullOrEmpty()
    }

    fun getBaseUrl(): String {
        return sharedPreferences.getString("BACKEND_URL", null) ?: com.parentalcontrol.child.BuildConfig.BASE_URL
    }

    fun setBaseUrl(url: String) {
        var formatted = url.trim()
        if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
            formatted = "http://$formatted"
        }
        if (!formatted.endsWith("/")) {
            formatted = "$formatted/"
        }
        val finalUrl = if (formatted.endsWith("/api/")) formatted else "${formatted}api/"
        sharedPreferences.edit().putString("BACKEND_URL", finalUrl).apply()
    }

    fun clearAuthData() {
        sharedPreferences.edit().remove("DEVICE_ID").remove("DEVICE_TOKEN").apply()
    }
}
