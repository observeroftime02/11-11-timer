# CI/CD & Automated GitHub Workflows

This repository contains automated GitHub Actions workflows to build, verify, and distribute the **Next 11:11 & 4:20 World Clock** application.

---

## 🛠️ Included Workflows

### 1. 📱 Build Android Debug APK (`.github/workflows/android-build.yml`)
- **Trigger**: Every push or pull request to `main` / `master`, or manually via GitHub's "Run workflow" button.
- **What it does**:
  1. Checks out code and sets up Node.js 22 & Java JDK 21.
  2. Runs TypeScript checks (`npm run lint`) and Vite production build (`npm run build`).
  3. Initializes Capacitor Android platform and runs `scripts/setup-android.js` to dynamically inject all 6 native Android widgets, adaptive high-res icons, and chime audio.
  4. Compiles the native Android Debug APK using Gradle.
  5. Uploads the generated APK as an **Artifact** stored in the GitHub Actions run summary (retained for 30 days).
- **How to download the APK**:
  1. Open your repository on GitHub.
  2. Click the **Actions** tab.
  3. Select the latest run under **Build Android Debug APK**.
  4. Scroll down to the **Artifacts** section and click `Next1111-Debug-APK-build-XXX.zip` to download and install.

---

### 2. 🚀 Automated GitHub Releases (`.github/workflows/release.yml`)
- **Trigger**: Whenever a git tag starting with `v` is pushed (e.g. `v1.0.0`, `v1.1.0`), or manually via the "Run workflow" button.
- **What it does**:
  1. Compiles the Android APK.
  2. Automatically creates a GitHub Release entry with auto-generated changelog notes.
  3. Attaches `Next1111-WorldClock-vX.X.X.apk` directly to the release page.
- **How to create a release**:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
  Or go to GitHub **Actions** → **Release Android APK** → **Run workflow** → enter version tag.

---

### 3. 🧪 Web App CI & Verification (`.github/workflows/ci.yml`)
- **Trigger**: Every push and pull request.
- **What it does**:
  1. Runs `tsc --noEmit` to ensure type safety.
  2. Runs `npm run build` to verify Vite bundle integrity.
  3. Verifies audio chimes, manifest, and icons exist.

---

## 💡 Local Build Alternative
You can also build the APK locally at any time using:
- **Windows**: Double-click `build-apk.bat` or `clean-build-apk.bat`.
- **Command Line**: `npm run build:apk` then `cd android && ./gradlew assembleDebug`.
