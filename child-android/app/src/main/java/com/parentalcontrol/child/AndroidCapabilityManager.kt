package com.parentalcontrol.child

import android.os.Build

class AndroidCapabilityManager {
    companion object {
        fun supportsBackgroundLocation(): Boolean {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
        }

        fun requiresForegroundServiceTypeLocation(): Boolean {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE
        }
    }
}
