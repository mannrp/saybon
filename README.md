# SayBon - French Practice App

A progressive web application for learning French with AI-powered exercises and feedback. Practice French through rapid-fire questions with instant validation and helpful explanations in English.

## Project Setup

This project uses:
- **React 19** with TypeScript
- **Vite 7** for fast development and optimized builds
- **Tailwind CSS 4** for styling
- **IndexedDB** (via `idb`) for local storage

## Directory Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── providers/      # AI provider implementations
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component
├── main.tsx        # Entry point
└── index.css       # Global styles with Tailwind
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## TypeScript Configuration

The project uses strict TypeScript configuration with:
- Strict mode enabled
- No unused locals/parameters
- No fallthrough cases in switch statements
- ES2022 target with modern features

## Tailwind CSS

Custom theme colors configured:
- **Primary**: Blue shades (50-950)
- **Success**: Green shades (50-900)
- **Error**: Red shades (50-900)

## Next Steps

## Features

- 🎯 AI-generated French exercises (conjugation, translation, vocabulary, grammar)
- 📊 CEFR levels A1-C2 support
- ✅ Instant answer validation with typo tolerance
- 💡 Explanations in English for better understanding
- 🔑 BYOK (Bring Your Own Key) - uses your Gemini API key
- 💾 Local storage with IndexedDB
- 📱 Responsive design for mobile and desktop

## Configuration

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open the app and go to Settings
3. Enter your API key and test the connection
4. Start practicing!

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- IndexedDB (idb)
- Google Gemini AI
