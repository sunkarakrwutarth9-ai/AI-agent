# PulseBuilder - AI Assistant

PulseBuilder is a full-featured AI assistant application available on Web, Mobile (Android), and Desktop (Windows).

## Features

- AI Chat powered by Groq's llama-3.3-70b-versatile model
- Chat history sidebar with session management
- Built-in browser
- Code editor with JavaScript execution
- File explorer
- Terminal emulator
- Download, Preview, and Host & Share features for generated code

## Project Structure

- `web/` - React web application
- `mobile/` - Capacitor-based Android app
- `desktop/` - Electron-based Windows app
- `api/` - FastAPI backend server

## Web App

The web app is deployed at: https://pulsebuilder-generator-crzio4sg.devinapps.com

## Building

### Web App
```bash
cd web
npm install
npm run build
```

### Android APK
```bash
cd mobile
npm install
npx cap sync android
cd android
./gradlew assembleDebug
```

### Windows EXE
```bash
cd desktop
npm install
npm run build:win
```

## API Backend

The backend API is deployed at: https://app-xjdhhtie.fly.dev

Set the `GROQ_API_KEY` environment variable for the API backend.

## License

MIT
