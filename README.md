# EduTech LMS

EduTech LMS is a React Native Expo learning app designed for browsing courses, bookmarking them, enrolling in them, viewing course details, and accessing learning content through a WebView experience. The app also includes secure auth flow, offline awareness, and AI-generated course insights.

## Overview

This project is a mobile learning management system built with Expo and React Native. It allows a user to:

- register and sign in
- browse a course catalog
- search and filter courses
- save bookmarks
- enroll in courses
- open detailed course information
- view embedded course content via WebView
- view profile information and logout
- receive offline status and lightweight reminders

The app is designed to work as a lightweight demo LMS and to be easy to understand, extend, and run locally.

## Features

- User registration and login
- Secure token storage with Expo SecureStore
- Persistent local storage for bookmarks and enrollments
- Searchable course catalog
- Pull-to-refresh for course data
- Course detail screen with instructor info and pricing
- AI-powered course insights using Google Gemini
- Bookmark and enrollment actions
- Offline banner based on network connectivity
- WebView course content screen
- Profile screen with account info and avatar selection
- Notification support for app reminders and bookmark milestones

## Technologies Used

- React Native
- Expo SDK 56
- Expo Router
- TypeScript
- NativeWind
- React Hook Form + Zod
- Expo SecureStore + AsyncStorage
- Expo Notifications
- Expo Image
- react-native-webview
- @react-native-community/netinfo
- Google Gemini API via @google/genai

## Project Structure

```text
Edutech-app/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── bookmarks.tsx
│   │   ├── index.tsx
│   │   └── profile.tsx
│   ├── course/
│   │   └── [id].tsx
│   ├── _layout.tsx
│   ├── webview.tsx
│   └── ...
├── components/
│   ├── CourseCard.tsx
│   ├── OfflineBanner.tsx
│   └── SearchBar.tsx
├── constants/
│   ├── api.ts
│   └── colors.ts
├── hooks/
│   └── useNetworkStatus.ts
├── providers/
│   ├── AuthProvider.tsx
│   └── CourseProvider.tsx
├── store/
│   ├── authStore.ts
│   └── courseStore.ts
├── utils/
│   ├── ai.ts
│   ├── api.ts
│   └── notifications.ts
├── assets/
├── screenshots/
├── .env.example
├── app.json
├── babel.config.js
├── global.css
├── global.d.ts
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── README.md
└── .gitignore
```

## Installation and Setup

1. Open a terminal in the project root.
2. Install dependencies:

```bash
npm install
```

3. Create a local environment file from the example:

```bash
copy .env.example .env
```

On Linux/macOS use:

```bash
cp .env.example .env
```

4. Edit the `.env` file and add the required values:

```env
EXPO_PUBLIC_BASE_URL=https://api.freeapi.app
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Notes:
- `EXPO_PUBLIC_BASE_URL` is used to connect to the API backend.
- `EXPO_PUBLIC_GEMINI_API_KEY` is required for AI-generated course insights.
- If the Gemini key is missing, the app falls back to static course insight content.

## Running the Project

From the project root:

```bash
npx expo start
```

To start with a clean Metro cache:

```bash
npx expo start --clear
```

To run on Android:

```bash
npx expo start --android
```

To run on iOS:

```bash
npx expo start --ios
```

You can also use Expo Go or a development build, depending on your environment.

## How to Use the Application

### 1. Register or Sign In
- Open the app and choose the login screen.
- If you do not have an account, register using a valid email and password.
- The app stores the auth token securely and restores the logged-in session on startup when available.

### 2. Browse Courses
- The main home screen displays the course catalog.
- Use the search bar to filter by title, description, or instructor.
- Pull down to refresh the list.

### 3. Save Course Bookmarks
- Tap the bookmark icon on a course card.
- Bookmarked courses appear in the bookmarks tab.

### 4. Enroll in a Course
- Open a course detail screen.
- Tap the Enroll Now button.
- The app tracks enrollments locally.

### 5. View AI Insights
- On the course detail page, the app generates AI course insights.
- If the Gemini API is unavailable, a fallback summary is shown instead.

### 6. Open Course Content
- Tap View Course Content from the detail screen.
- This opens a WebView with course information and metadata.

### 7. View Profile
- The profile tab shows the current user, account info, bookmarks count, and enrollment count.
- Users can choose an avatar image from the gallery.

## Important Configurations

### API Configuration
The file [constants/api.ts](constants/api.ts) contains the base URL and endpoint definitions.

```ts
export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL ?? 'https://api.freeapi.app';
```

This means the project falls back to the public demo API if the environment value is not set.

### Gemini Configuration
The AI feature uses the environment key from `.env`:

```ts
process.env.EXPO_PUBLIC_GEMINI_API_KEY
```

If this is not configured, the app still works, but the AI summary is replaced by the fallback static content.

## Common Issues and Fixes

## Verified Fix Log

### Auth session was discarded when the server was unavailable

- **Issue:** Startup authentication could continue into token refresh after access-token verification failed because the API was unreachable. A failed refresh then cleared a valid locally saved session.
- **Cause:** `AuthProvider` caught verification errors but did not stop the startup flow.
- **Changed files:** `providers/AuthProvider.tsx`.
- **Solution:** When verification throws a network or temporary server error, the provider now restores the saved token and user locally and finishes initialization. A normal `false` verification result still proceeds to refresh-token handling.
- **Verification:** `npx tsc --noEmit` from the project root.

### Course details violated the Rules of Hooks

- **Issue:** The course details screen returned early when data was not loaded, before calling its state and effect hooks. When the course later became available, React could report a hook-order error.
- **Cause:** Hooks were declared after the conditional `course` guard.
- **Changed files:** `app/course/[id].tsx`.
- **Solution:** State and effect hooks now run on every render, and the AI request exits cleanly until a course is available.
- **Verification:** `npx tsc --noEmit` from the project root.

### Saved sessions used incorrect auth endpoints

- **Issue:** Login used the versioned API path, but startup token verification and refresh called unversioned `/users/...` URLs.
- **Cause:** Those two requests built URLs independently instead of using the configured endpoint constants.
- **Changed files:** `constants/api.ts`, `utils/api.ts`.
- **Solution:** Added the versioned refresh-token endpoint and reused both centralized auth endpoints for session restoration.
- **Verification:** `npx tsc --noEmit` from the project root.

### Expo dependencies were incomplete and out of SDK alignment

- **Issue:** Expo Doctor reported missing `expo-font` and `expo-constants` peer dependencies and several packages using versions different from the installed Expo SDK 56 compatibility set.
- **Cause:** The dependency manifest had not been synchronized with Expo SDK 56.
- **Changed files:** `package.json`, `package-lock.json`, `app.json`.
- **Solution:** Installed the missing peer dependencies and ran `npx expo install --fix` to align the SDK-managed packages. Expo Doctor now passes 21 of 22 checks.
- **Verification:** `npx expo-doctor` and `npx tsc --noEmit` from the project root.
- **Remaining limitation:** The only remaining Expo Doctor warning is the known Hermes V1 memory regression in Expo SDK 56. Expo recommends SDK 57 for its fix; that major upgrade is intentionally not applied without the PDF’s compatibility requirements.

### Notification startup could produce unhandled errors

- **Issue:** Permission requests and reminder scheduling ran independently during root layout startup. A denied permission or platform scheduling failure could reject without being handled.
- **Cause:** The startup effect did not await or guard the notification operations.
- **Changed files:** `app/_layout.tsx`.
- **Solution:** Startup now schedules reminders only after permission is granted and catches optional notification failures so authentication and navigation are unaffected.
- **Verification:** `npx tsc --noEmit` from the project root.

### 1. Expo says the project is missing expo
This usually means dependencies were not installed:

```bash
npm install
```

### 2. App starts on a different port or Metro is stuck
Use a clean restart:

```bash
npx expo start --clear
```

### 3. Missing environment values
Make sure `.env` exists and includes the required keys.

### 4. Course data does not load
Check the API base URL and ensure the backend is reachable.

### 5. AI insights are not generated
This is usually caused by a missing or invalid Gemini API key or rate limits.
The app gracefully falls back to static course insights.

### 6. Stored auth or bookmarks look corrupted
The app already guards against invalid JSON in local storage, but clearing app data can help in some cases.

## Screenshots

The project includes a screenshots folder for product preview images; these can be used in documentation or design presentations.

```text
screenshots/
├── course-content-webview.jpeg
├── course-details.jpeg
├── courses-bookmarkscreen.jpeg
├── courseslist.jpeg
├── login.jpeg
├── notifications.jpeg
├── offline-banner.jpeg
├── profile.jpeg
├── register.jpeg
├── splashscreen.jpeg
```

## Notes and Limitations

- The app uses a public demo backend and therefore behaves like a prototype rather than a fully production-ready LMS backend.
- AI summaries are optional and gracefully fall back if the Gemini API is unavailable.
- Avatar changes are local and do not sync to a real backend upload service.
- Some course thumbnails are placeholder/demo images for visual consistency.

## Build Notes

To create an Android build with EAS:

```bash
npx expo install
npx eas login
npx eas build --platform android --profile development
```

For a local Android debug build:

```bash
npx expo prebuild
cd android
./gradlew assembleDebug
```

The generated APK usually appears in:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Summary

EduTech LMS is a practical mobile learning app that demonstrates authentication, course browsing, local personalization, offline detection, and AI-powered enhancement. It is intentionally lightweight, easy to run locally, and well-suited for learning, demos, and simple LMS-style prototypes.



