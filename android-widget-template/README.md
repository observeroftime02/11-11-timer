# Native Android Widget Setup for Next 11:11

After running `npx cap add android`, copy the prepared template files from `/android-widget-template` into your `android/` project:

### 1. Copy Java Provider:
Copy `android-widget-template/Next1111WidgetProvider.java` to:
`android/app/src/main/java/com/nextcity/worldclock/Next1111WidgetProvider.java`

### 2. Copy Resources:
- Copy `android-widget-template/res/layout/widget_1111.xml` to `android/app/src/main/res/layout/widget_1111.xml`
- Copy `android-widget-template/res/drawable/widget_background.xml` to `android/app/src/main/res/drawable/widget_background.xml`
- Copy `android-widget-template/res/xml/widget_1111_info.xml` to `android/app/src/main/res/xml/widget_1111_info.xml`

### 3. Add to `android/app/src/main/AndroidManifest.xml`:
Inside the `<application>` tag (alongside `MainActivity`), add:

```xml
<receiver
    android:name=".Next1111WidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_1111_info" />
</receiver>
```

### 4. Build APK:
```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```
