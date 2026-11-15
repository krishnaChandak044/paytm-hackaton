# Paytm Munim Frontend

A React + Vite + Tailwind CSS merchant dashboard styled in the official **Paytm for Business** design language.

## Features
- **Paytm Brand Identity**: Paytm Navy (`#002970`), Paytm Cyan (`#00baf2`), and verified merchant indicators.
- **Cash-Gap Radar**: Visualizes bank balance, expected inflows (8-week percentile distribution), and upcoming merchant obligations to detect cash shortfalls before payments are due.
- **Judge Live "What-If" Playground**: Real-time slider and controls to change cash in drawer, shift due dates, or simulate supplier splits, recalculating financial arithmetic dynamically with confetti feedback on gap resolution.
- **Paytm Soundbox Voice Broadcast**: Plays simulated voice alerts in Hindi and English using the Web Speech API.
- **Candidate Obligations**: Displays AI-detected recurring payments awaiting merchant confirmation.
- **Settlement & QR Tracker**: Real-time view of daily QR collections and in-flight bank settlement cycles.
- **Live / Offline Switcher**: Connects to the FastAPI backend (`http://localhost:8001`) or runs in standalone interactive demo mode.

## Development

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:3000`.

