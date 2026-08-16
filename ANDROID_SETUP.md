# Android Client Setup & Build Guide

The Child Client App is a background-heavy Android application built in Kotlin. It enforces parental rules and synchronizes telemetry (location, app usage) with the backend API.

## Requirements
- Android Studio Ladybug (or newer)
- Android SDK 34 (Target API)
- Minimum SDK 26 (Android 8.0)
- Java 17

## Project Structure
The Android source is located in the `/child-android` directory. It uses standard Gradle architecture.

## Configuration & Secrets
Do **not** hardcode the Production API URL into the git repository. 

1. Create a file named `local.properties` in the `/child-android` directory.
2. Add your local development backend URL:
   ```properties
   API_BASE_URL="http://10.0.2.2:3000/api"
   SOCKET_BASE_URL="http://10.0.2.2:3000"
   ```
   *(Note: 10.0.2.2 is the localhost alias for the Android Emulator).*

## Required Permissions (Manifest)
The app requires extensive permissions to function correctly. These must be granted manually by the parent during the pairing flow:
- `ACCESS_FINE_LOCATION` & `ACCESS_BACKGROUND_LOCATION`: For Geofencing and tracking.
- `PACKAGE_USAGE_STATS`: For App time limits (Requires special Settings Intent).
- `SYSTEM_ALERT_WINDOW`: To overlay a "Blocked" screen when downtime or app limits are reached.
- `FOREGROUND_SERVICE`: To ensure the OS does not kill the sync process.

## Generating a Release Build (Production)
When moving to production, you must sign the APK/AAB with a secure keystore.

1. **Create a Keystore**:
   In Android Studio, go to `Build > Generate Signed Bundle / APK`, choose `APK`, and click `Create new` under the Key store path. Save this `.jks` file securely outside of the repository.

2. **Configure build.gradle (app)**:
   Add the signing config. Do not commit passwords! Use environment variables or a local properties file.
   ```gradle
   signingConfigs {
       release {
           storeFile file("path/to/release-key.keystore")
           storePassword System.getenv("KEYSTORE_PASSWORD")
           keyAlias System.getenv("KEY_ALIAS")
           keyPassword System.getenv("KEY_PASSWORD")
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled true
           proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
   }
   ```

3. **Build the Release**:
   Run `./gradlew assembleRelease` or use the Android Studio UI.

## Limitations & Device Fragmentation
- **Battery Optimization**: Manufacturers like Xiaomi, Huawei, and Samsung aggressively kill background apps. The parent **MUST** manually exclude the app from Battery Optimization in the device settings.
- **Call/SMS Logging**: Google Play Policies strictly prohibit Call Log and SMS reading permissions unless the app is the default dialer. This functionality is restricted/disabled for Play Store builds.
