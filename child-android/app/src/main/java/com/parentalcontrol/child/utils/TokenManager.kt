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

    fun clearAuthData() {
        sharedPreferences.edit().clear().apply()
    }
}
