# Question Bank Builder

This script generates a large question bank from Gemini API with proper rate limiting and duplicate prevention.

## Setup

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. Set the environment variable:
```bash
# Windows CMD
set GEMINI_API_KEY=your_api_key_here

# Windows PowerShell
$env:GEMINI_API_KEY="your_api_key_here"
```

## Usage

```bash
npm run build-bank [level] [type] [count]
```

### Parameters

- `level`: CEFR level (a1, a2, b1, b2, c1, c2) - default: a1
- `type`: Exercise type (conjugation, translation, vocabulary, grammar, fill-blank) - default: conjugation
- `count`: Number of questions to generate - default: 500

### Examples

```bash
# Generate 500 A1 conjugation questions
npm run build-bank a1 conjugation 500

# Generate 300 A1 translation questions
npm run build-bank a1 translation 300

# Generate 400 A1 vocabulary questions
npm run build-bank a1 vocabulary 400

# Generate 500 A2 conjugation questions
npm run build-bank a2 conjugation 500
```

## Rate Limits

- **15 requests per minute**
- **1500 requests per day**

The script automatically handles rate limiting with ~4 second delays between requests.

## Output

Questions are saved to: `public/questions/{level}-{type}.json`

Example: `public/questions/a1-conjugation.json`

## Estimated Time

- 500 questions ≈ 25 batches ≈ 2 minutes
- 1000 questions ≈ 50 batches ≈ 4 minutes

## Building a Complete A1 Bank

To build a comprehensive A1 question bank, run these commands:

```bash
# Conjugation (500 questions)
npm run build-bank a1 conjugation 500

# Wait a few minutes, then:
npm run build-bank a1 translation 500

# Wait a few minutes, then:
npm run build-bank a1 vocabulary 500

# Wait a few minutes, then:
npm run build-bank a1 grammar 500

# Wait a few minutes, then:
npm run build-bank a1 fill-blank 500
```

Total: 2500 unique A1 questions across all types!

## Tips

- Run during off-peak hours to maximize daily quota
- Monitor the console output for progress
- The script automatically filters duplicates
- Questions are saved incrementally (safe to stop/resume)
