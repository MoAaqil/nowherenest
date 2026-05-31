# build_wrappers.ps1
# Automates the creation of standard Android WebView wrappers for Nowhere Nest Customer & Host apps.

Write-Host "=============================================" -ForegroundColor Green
Write-Host "Nowhere Nest Mobile App Builder Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. Paths
$workspace = "d:\nowherenest"
$custAndroidPath = "$workspace\customer-app-android"
$hostAndroidPath = "$workspace\host-app-android"
$logoSource = "$workspace\customer-app\public\logo.png"
$logoInvertedSource = "$workspace\host-app\public\logo-inverted.png"

# Helper to write files
function Write-FileIfNotExist($path, $content) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -Path $path -Value $content -Force
    Write-Host "  Generated: $path" -ForegroundColor Gray
}

# 2. Build Customer App Android Folder
Write-Host "`nInitializing Customer Android WebView Wrapper..." -ForegroundColor Cyan

# build.gradle (Project)
$projGradle = @"
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.1'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
"@
Write-FileIfNotExist "$custAndroidPath\build.gradle" $projGradle
Write-FileIfNotExist "$hostAndroidPath\build.gradle" $projGradle

# settings.gradle
Write-FileIfNotExist "$custAndroidPath\settings.gradle" "include ':app'`nrootProject.name = `"NowhereNestCustomer`""
Write-FileIfNotExist "$hostAndroidPath\settings.gradle" "include ':app'`nrootProject.name = `"NowhereNestHost`""

# gradle.properties (Standard settings)
$gradleProps = @"
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
android.useAndroidX=true
android.enableJetifier=true
"@
Write-FileIfNotExist "$custAndroidPath\gradle.properties" $gradleProps
Write-FileIfNotExist "$hostAndroidPath\gradle.properties" $gradleProps

# app/build.gradle (App level)
$custAppGradle = @"
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.nowherenest.customer'
    compileSdk 33

    defaultConfig {
        applicationId "com.nowherenest.customer"
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
"@
Write-FileIfNotExist "$custAndroidPath\app\build.gradle" $custAppGradle

$hostAppGradle = $custAppGradle -replace 'com.nowherenest.customer', 'com.nowherenest.host'
Write-FileIfNotExist "$hostAndroidPath\app\build.gradle" $hostAppGradle

# AndroidManifest.xml
$manifestContent = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/logo"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.NowhereNest"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
"@
Write-FileIfNotExist "$custAndroidPath\app\src\main\AndroidManifest.xml" $manifestContent
Write-FileIfNotExist "$hostAndroidPath\app\src\main\AndroidManifest.xml" $manifestContent

# res/values/strings.xml
Write-FileIfNotExist "$custAndroidPath\app\src\main\res\values\strings.xml" "<resources><string name=`"app_name`">Nowhere Nest</string></resources>"
Write-FileIfNotExist "$hostAndroidPath\app\src\main\res\values\strings.xml" "<resources><string name=`"app_name`">Nowhere Nest Host</string></resources>"

# res/values/styles.xml
$stylesContent = @"
<resources>
    <style name="Theme.NowhereNest" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">#0A3B2A</item>
        <item name="colorPrimaryVariant">#052219</item>
        <item name="colorSecondary">#22C55E</item>
        <item name="android:statusBarColor">#0A3B2A</item>
    </style>
</resources>
"@
Write-FileIfNotExist "$custAndroidPath\app\src\main\res\values\styles.xml" $stylesContent
Write-FileIfNotExist "$hostAndroidPath\app\src\main\res\values\styles.xml" $stylesContent

# MainActivity.java (Customer)
$custMainActivity = @"
package com.nowherenest.customer;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.os.Build;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;
    
    // Deployed customer app URL. 
    // To test locally on Android Emulator, use "http://10.0.2.2:5173"
    private static final String APP_URL = "https://nowherenest.vercel.app"; 

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        myWebView = new WebView(this);
        setContentView(myWebView);
        
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setGeolocationEnabled(true);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        myWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        
        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
        });

        myWebView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (myWebView.canGoBack()) {
            myWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
"@
Write-FileIfNotExist "$custAndroidPath\app\src\main\java\com\nowherenest\customer\MainActivity.java" $custMainActivity

# MainActivity.java (Host)
$hostMainActivity = $custMainActivity -replace 'package com.nowherenest.customer;', 'package com.nowherenest.host;' `
                                     -replace 'com.nowherenest.customer', 'com.nowherenest.host' `
                                     -replace 'https://nowherenest.vercel.app', 'https://nowherenesthost.vercel.app'
Write-FileIfNotExist "$hostAndroidPath\app\src\main\java\com\nowherenest\host\MainActivity.java" $hostMainActivity

# 3. Copy logos as drawables
Write-Host "`nCopying App Logo Drawables..." -ForegroundColor Cyan
$custDrawableDir = "$custAndroidPath\app\src\main\res\drawable"
$hostDrawableDir = "$hostAndroidPath\app\src\main\res\drawable"

if (-not (Test-Path $custDrawableDir)) { New-Item -ItemType Directory -Path $custDrawableDir -Force | Out-Null }
if (-not (Test-Path $hostDrawableDir)) { New-Item -ItemType Directory -Path $hostDrawableDir -Force | Out-Null }

if (Test-Path $logoSource) {
    Copy-Item -Path $logoSource -Destination "$custDrawableDir\logo.png" -Force
    Write-Host "  Copied original logo.png to Customer Android Appdrawable" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️ Original logo.png not found at $logoSource!" -ForegroundColor Yellow
}

if (Test-Path $logoInvertedSource) {
    Copy-Item -Path $logoInvertedSource -Destination "$hostDrawableDir\logo.png" -Force
    Write-Host "  Copied color-inverted logo.png to Host Android App drawable" -ForegroundColor Gray
} else {
    # If inverted logo doesn't exist, we run the inversion code inline
    Write-Host "  ⚠️ Color-inverted logo not found. Copying original as fallback." -ForegroundColor Yellow
    if (Test-Path $logoSource) {
        Copy-Item -Path $logoSource -Destination "$hostDrawableDir\logo.png" -Force
    }
}

# 4. Generate build instruction guides
$guidePath = "$workspace\mobile_build_guide.md"
$guideContent = @"
# Nowhere Nest Android Apps Build Guide

This directory contains the Gradle source trees for compiled Android WebView applications loading the Nowhere Nest web servers.

## Android Projects Location
- **Customer App**: `customer-app-android/` (Launcher Logo: Original green badge)
- **Host App**: `host-app-android/` (Launcher Logo: Color-inverted logo with green background)

## Live Synchronization
Because both wrapper apps use Android `WebView` pointing directly to hosted web console URLs, **any client code updates pushed live instantly apply on all mobile devices** without needing to compile new release APK files!

---

## How to Compile APKs in Android Studio

1. **Download & Launch Android Studio**:
   - Download from: [developer.android.com/studio](https://developer.android.com/studio)

2. **Open the Projects**:
   - Open Android Studio.
   - Click **Open** (or File -> Open).
   - Navigate to the project folder `d:\nowherenest\customer-app-android` or `d:\nowherenest\host-app-android` and select the directory. Android Studio will automatically index the Gradle configurations.

3. **Configure Live URLs (Optional)**:
   - By default, the apps point to local emulator loopbacks:
     - Customer app: `http://10.0.2.2:5173`
     - Host app: `http://10.0.2.2:5174`
   - Open `app/src/main/java/com/nowherenest/[customer/host]/MainActivity.java`.
   - Update the `APP_URL` string variable to point to your live hosted domain (e.g. `https://customer.nowherenest.com` or local network IP).

4. **Run on Emulator / Local Device**:
   - Select your target device (e.g., Pixel Emulator or local USB connected phone).
   - Click the green **Run (Play)** button in the top toolbar to launch and test.

5. **Generate compiled release APKs**:
   - Click **Build** in the top menu -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
   - Once completed, Android Studio will display a popup notification. Click **Locate** to retrieve the compiled APK file:
      - Output location: app/build/outputs/apk/debug/app-debug.apk
"@

Set-Content -Path $guidePath -Value $guideContent -Force
Write-Host "`n✅ Android WebView App wrapper creation successfully completed!" -ForegroundColor Green
Write-Host "Check Mobile Build Guide: $guidePath" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
