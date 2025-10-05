# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Enable aggressive optimization
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Remove unused code
-dontwarn **
-ignorewarnings

# Security: Remove debug information
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo modules
-keep class expo.modules.** { *; }
-keep class com.facebook.react.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Document Picker
-keep class expo.modules.documentpicker.** { *; }

# Notifications
-keep class expo.modules.notifications.** { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Keep serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep all classes in the main package
-keep class com.tabibiq.mobile.** { *; }

# Security: Remove debug strings
-assumenosideeffects class java.io.PrintStream {
    public void println(%);
    public void println(**);
}

# Security: Remove console logs
-assumenosideeffects class * {
    public static *** console(...);
}

# Add any project specific keep options here:
