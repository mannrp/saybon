# SayBon

A calm, offline-first French practice app for Québec/Canada immigrants —
built around high-frequency drills, typo-tolerant validation, and a
dedicated TEF Canada exam-prep mode. React Native, local SQLite + MMKV
storage, no mandatory account.

## Repository layout

```
mobile/       The app. React Native 0.85, TypeScript. Start here — see
              mobile/README.md for environment setup and run commands.
scripts/      Standalone content-QA scripts (run with Node, no build step):
                scripts/tef/validateItems.cjs           TEF item batches
                scripts/content/validateCulturalContext.cjs  cultural notes
planning/     Local design/audit docs (gitignored — not part of the repo
              history, kept for reference on this machine).
```

## Getting started

```bash
cd mobile
npm install
npm start
```

Then, in a second terminal:

```bash
npm run android   # or: npm run ios
```

See [mobile/README.md](mobile/README.md) for the full React Native
environment setup (Android Studio / Xcode, CocoaPods, etc.).

## License

MIT
