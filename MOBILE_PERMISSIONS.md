# Mobile App Permissions Configuration Guide

Before publishing to the Google Play Store or Apple App Store, you must declare the permissions the app requires.

## Android (AndroidManifest.xml)
Once you generate your `android` folder (by running `flutter create .` inside the `mobile_app` folder), locate `android/app/src/main/AndroidManifest.xml` and add the following lines before the `<application>` tag:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Required for geofencing and proximity checks -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application>
        ...
```

## iOS (Info.plist)
Once you generate your `ios` folder, locate `ios/Runner/Info.plist` and add the following keys inside the main `<dict>` tag:

```xml
<dict>
    ...
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>We need your location to verify your presence at the office workspace when checking in.</string>
    <key>NSLocationAlwaysUsageDescription</key>
    <string>We need location access to ensure secure attendance tracking.</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    ...
</dict>
```

> **Note**: For production, instead of `NSAllowsArbitraryLoads`, you should use a secure HTTPS endpoint (like our new Render URL). If you use `https`, you can safely omit the `NSAppTransportSecurity` block.
