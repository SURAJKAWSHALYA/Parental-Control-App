package com.parentalcontrol.child

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class AppLimitRepository(private val context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("AppLimitsCache", Context.MODE_PRIVATE)
    private val gson = Gson()

    fun getAppLimits(): List<AppLimit> {
        val limitsJson = prefs.getString("limits", "[]")
        val type = object : TypeToken<List<AppLimit>>() {}.type
        return gson.fromJson(limitsJson, type) ?: emptyList()
    }

    fun saveAppLimits(limits: List<AppLimit>) {
        prefs.edit().putString("limits", gson.toJson(limits)).apply()
    }

    fun getAppLimit(packageName: String): AppLimit? {
        return getAppLimits().find { it.packageName == packageName }
    }
}
