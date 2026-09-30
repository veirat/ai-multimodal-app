# My Future

A full-stack AI assistant designed to support:
- text chat
- voice input using browser speech recognition
- text-to-speech replies
- image upload and AI-powered analysis

## Tech stack
- React + Vite frontend
- Express backend
- OpenAI-compatible AI API integration

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Add your OpenAI API key to `.env`.

4. Start the app:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

## Notes
- If no API key is configured, the app still runs in demo mode.
- Use the upload button to analyze images with AI.

## Project structure
- `server/` - Express API
- `src/` - React frontend
