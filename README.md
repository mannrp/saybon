# SayBon

A progressive web application for learning French with AI-powered exercises and instant feedback. Practice through rapid-fire questions with helpful explanations in English.

## Features

- AI-generated French exercises (conjugation, translation, vocabulary, grammar)
- CEFR levels A1-C2 support
- Instant answer validation with typo tolerance
- Explanations in English for better understanding
- BYOK (Bring Your Own Key) - uses your Gemini API key
- Local storage with IndexedDB
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open the app and navigate to Settings
3. Enter your API key and test the connection
4. Save settings and start practicing

## Security

- API keys are stored locally in IndexedDB (browser storage only)
- No data is sent to external servers except Google Gemini API
- All practice data remains on your device
- No user tracking or analytics

## Tech Stack

- React 19 with TypeScript
- Vite 7
- Tailwind CSS 4
- IndexedDB (idb)
- Google Gemini AI

## License

MIT
