# Mobile App

Flutter Android client for the Project Milestone & Control System.

## Implemented

- Login with JWT auth against the existing backend
- Secure local token storage with automatic token refresh
- Dashboard with overview metrics and recent projects
- Projects list and project detail view
- Project task browser
- Project report viewer
- Global store / inventory viewer
- Settings screen with current environment details

## Run

```bash
flutter pub get
flutter run
```

## API Base URL

By default the app uses:

- Android emulator: `http://10.0.2.2:3000/api/v1`
- other platforms: `http://localhost:3000/api/v1`

Override it when needed:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_HOST:3000/api/v1
```

## Build APK

```bash
flutter build apk --debug
```

For a physical Android device, make sure the backend is reachable on your LAN or pass a `--dart-define` base URL.
