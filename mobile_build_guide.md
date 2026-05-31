# Nowhere Nest Android Apps Build Guide

This directory contains the Gradle source trees for compiled Android WebView applications loading the Nowhere Nest web servers.

## Android Projects Location
- **Customer App**: customer-app-android/ (Launcher Logo: Original green badge)
- **Host App**: host-app-android/ (Launcher Logo: Color-inverted logo with green background)

## Live Synchronization
Because both wrapper apps use Android WebView pointing directly to hosted web console URLs, **any client code updates pushed live instantly apply on all mobile devices** without needing to compile new release APK files!

---

## How to Compile APKs in Android Studio

1. **Download & Launch Android Studio**:
   - Download from: [developer.android.com/studio](https://developer.android.com/studio)

2. **Open the Projects**:
   - Open Android Studio.
   - Click **Open** (or File -> Open).
   - Navigate to the project folder d:\nowherenest\customer-app-android or d:\nowherenest\host-app-android and select the directory. Android Studio will automatically index the Gradle configurations.

3. **Configure Live URLs (Optional)**:
   - By default, the apps point to local emulator loopbacks:
     - Customer app: http://10.0.2.2:5173
     - Host app: http://10.0.2.2:5174
   - Open pp/src/main/java/com/nowherenest/[customer/host]/MainActivity.java.
   - Update the APP_URL string variable to point to your live hosted domain (e.g. https://customer.nowherenest.com or local network IP).

4. **Run on Emulator / Local Device**:
   - Select your target device (e.g., Pixel Emulator or local USB connected phone).
   - Click the green **Run (Play)** button in the top toolbar to launch and test.

5. **Generate compiled release APKs**:
   - Click **Build** in the top menu -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
   - Once completed, Android Studio will display a popup notification. Click **Locate** to retrieve the compiled APK file:
      - Output location: app/build/outputs/apk/debug/app-debug.apk
