import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Setting up Next 11:11 & Next 4:20 Native Android App Icons & Widgets...');

const androidDir = path.join(rootDir, 'android');
if (!fs.existsSync(androidDir)) {
  console.log('⚠️  android/ folder not found. Please run "npx cap add android" first.');
  process.exit(0);
}

const mainResDir = path.join(androidDir, 'app', 'src', 'main', 'res');

// Helper to render SVG to PNG buffer
function renderSvgToPng(svgPath, width, height) {
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

// 1. GENERATE ALL NATIVE ANDROID ICONS & ADAPTIVE LAYERS
console.log('🎨 Generating high-resolution launcher icons & adaptive layers...');

const iconSvgPath = path.join(rootDir, 'public', 'icon.svg');
const fgSvgPath = path.join(rootDir, 'public', 'icon-foreground.svg');
const bgSvgPath = path.join(rootDir, 'public', 'icon-background.svg');

const mipmapDensities = [
  { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
];

for (const d of mipmapDensities) {
  const targetMipmapDir = path.join(mainResDir, d.folder);
  fs.mkdirSync(targetMipmapDir, { recursive: true });

  // Standard legacy icon
  const iconPng = renderSvgToPng(iconSvgPath, d.iconSize, d.iconSize);
  fs.writeFileSync(path.join(targetMipmapDir, 'ic_launcher.png'), iconPng);
  fs.writeFileSync(path.join(targetMipmapDir, 'ic_launcher_round.png'), iconPng);

  // Adaptive foreground layer
  const fgPng = renderSvgToPng(fgSvgPath, d.fgSize, d.fgSize);
  fs.writeFileSync(path.join(targetMipmapDir, 'ic_launcher_foreground.png'), fgPng);

  console.log(` ✅ Generated icons for ${d.folder} (${d.iconSize}x${d.iconSize})`);
}

// 2. ADAPTIVE ICON XML DRAWABLES (FOR SAMSUNG ONE UI / PIXEL / MODERN ANDROID)
const anyDpiDir = path.join(mainResDir, 'mipmap-anydpi-v26');
fs.mkdirSync(anyDpiDir, { recursive: true });

const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>`;

fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher.xml'), adaptiveIconXml);
fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher_round.xml'), adaptiveIconXml);
console.log(' ✅ Configured adaptive icon manifests in mipmap-anydpi-v26');

// Replace default Capacitor background & foreground drawables in drawable/ & drawable-v24/
const drawableDir = path.join(mainResDir, 'drawable');
const drawableV24Dir = path.join(mainResDir, 'drawable-v24');
fs.mkdirSync(drawableDir, { recursive: true });
fs.mkdirSync(drawableV24Dir, { recursive: true });

const bgDrawableXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0D0C0F"
        android:pathData="M0,0h108v108h-108z" />
</vector>`;

fs.writeFileSync(path.join(drawableDir, 'ic_launcher_background.xml'), bgDrawableXml);

// Also copy full resolution foreground to drawable
const highResFgPng = renderSvgToPng(fgSvgPath, 432, 432);
fs.writeFileSync(path.join(drawableDir, 'ic_launcher_foreground.png'), highResFgPng);
if (fs.existsSync(path.join(drawableV24Dir, 'ic_launcher_foreground.xml'))) {
  fs.unlinkSync(path.join(drawableV24Dir, 'ic_launcher_foreground.xml'));
}
fs.writeFileSync(path.join(drawableV24Dir, 'ic_launcher_foreground.png'), highResFgPng);
console.log(' ✅ Replaced default Capacitor blue cross icon with gold 11:11 icon');

// 3. COPY JAVA WIDGET PROVIDERS & HELPERS
const targetJavaDir = path.join(androidDir, 'app', 'src', 'main', 'java', 'com', 'nextcity', 'worldclock');
fs.mkdirSync(targetJavaDir, { recursive: true });

const templateDir = path.join(rootDir, 'android-widget-template');
const javaFiles = [
  'Next1111WidgetHelper.java',
  'Next1111WidgetReceiver.java',
  'Next1111CompactWidgetProvider.java',
  'Next1111MediumWidgetProvider.java',
  'Next1111SquareWidgetProvider.java',
  'Next420CompactWidgetProvider.java',
  'Next420MediumWidgetProvider.java',
  'Next420SquareWidgetProvider.java',
  'Next1111WidgetProvider.java',
];

for (const file of javaFiles) {
  const src = path.join(templateDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(targetJavaDir, file));
    console.log(` ✅ Copied Java class: ${file}`);
  }
}

// 4. COPY WIDGET RESOURCES (layout, drawable, xml, values)
function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(` ✅ Copied resource: ${path.relative(mainResDir, destPath)}`);
    }
  }
}

const templateResDir = path.join(templateDir, 'res');
copyDirRecursive(templateResDir, mainResDir);

// 4b. ENSURE NOTIFICATION SOUNDS (chime.wav & chime_420.wav) ARE IN res/raw/
const rawDir = path.join(mainResDir, 'raw');
fs.mkdirSync(rawDir, { recursive: true });
const chimePublicPath = path.join(rootDir, 'public', 'chime.wav');
if (fs.existsSync(chimePublicPath)) {
  fs.copyFileSync(chimePublicPath, path.join(rawDir, 'chime.wav'));
  console.log(' ✅ Placed 11:11 crystal harmonic chime into res/raw/chime.wav');
}
const chime420PublicPath = path.join(rootDir, 'public', 'chime-420.wav');
if (fs.existsSync(chime420PublicPath)) {
  fs.copyFileSync(chime420PublicPath, path.join(rawDir, 'chime_420.wav'));
  console.log(' ✅ Placed 4:20 mellow chill tone into res/raw/chime_420.wav');
}

// 5. UPDATE ANDROIDMANIFEST.XML WITH NOTIFICATION PERMISSIONS & ALL 6 WIDGET RECEIVERS
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  // Add Notification permissions (Android 13+ & Exact Alarm scheduling)
  const notificationPermissions = `
    <!-- 11:11 & 4:20 Push & Local Notification Permissions -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />`;

  if (!manifest.includes('android.permission.POST_NOTIFICATIONS')) {
    manifest = manifest.replace('<application', `${notificationPermissions}\n\n    <application`);
    console.log(' ✅ Injected POST_NOTIFICATIONS & Alarm permissions into AndroidManifest.xml');
  }

  const receiversXml = `
        <!-- Next 11:11 & Next 4:20 Home Screen Widgets (Minute-by-minute Auto Updating) -->
        <receiver
            android:name=".Next1111CompactWidgetProvider"
            android:label="@string/widget_compact_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_compact_info" />
        </receiver>

        <receiver
            android:name=".Next1111MediumWidgetProvider"
            android:label="@string/widget_medium_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_medium_info" />
        </receiver>

        <receiver
            android:name=".Next1111SquareWidgetProvider"
            android:label="@string/widget_square_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_square_info" />
        </receiver>

        <!-- Next 4:20 Native Home Screen Widgets -->
        <receiver
            android:name=".Next420CompactWidgetProvider"
            android:label="@string/widget_compact_420_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_compact_420_info" />
        </receiver>

        <receiver
            android:name=".Next420MediumWidgetProvider"
            android:label="@string/widget_medium_420_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_medium_420_info" />
        </receiver>

        <receiver
            android:name=".Next420SquareWidgetProvider"
            android:label="@string/widget_square_420_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_square_420_info" />
        </receiver>

        <!-- Minute-by-minute Alarm & System Clock Broadcast Receiver -->
        <receiver
            android:name=".Next1111WidgetReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="com.nextcity.worldclock.ACTION_WIDGET_UPDATE" />
                <action android:name="android.intent.action.TIME_TICK" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>`;

  // Clean any older receiver block before replacing
  const startMarker = '<!-- Next 11:11 & Next 4:20 Home Screen Widgets';
  if (manifest.includes(startMarker)) {
    const startIdx = manifest.indexOf(startMarker);
    const endIdx = manifest.indexOf('</application>');
    if (startIdx !== -1 && endIdx !== -1) {
      manifest = manifest.substring(0, startIdx) + receiversXml.trim() + '\n    ' + manifest.substring(endIdx);
    }
  } else if (!manifest.includes('Next1111CompactWidgetProvider')) {
    manifest = manifest.replace('</application>', `${receiversXml}\n    </application>`);
  }

  // Double check that </manifest> is intact
  if (!manifest.includes('</manifest>')) {
    if (!manifest.includes('</application>')) {
      manifest += '\n    </application>';
    }
    manifest += '\n</manifest>';
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log(' ✅ Injected all 6 widget providers & minute broadcast receiver into AndroidManifest.xml!');
}

console.log('🎉 Android setup complete: Custom 11:11 & 4:20 Golden/Emerald Icons + 6 Widgets ready!');
