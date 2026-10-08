# API Setup Guide

## Required Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

## FuelIX (app-hosted models)

All app-hosted chat models are served through the FuelIX gateway.

```
FUELIX_API_KEY=your_fuelix_api_key_here
# Optional, defaults to https://api.fuelix.ai/v1
FUELIX_BASE_URL=https://api.fuelix.ai/v1
```

On Vercel, add `FUELIX_API_KEY` as an environment variable (Project Settings → Environment Variables).

### How models are loaded
- A small static list is shown immediately and used if FuelIX can't be reached.
- Signed-in users get the full live list from `GET /models`, with non-chat models (embeddings, TTS, image) and known-unusable ids filtered out (see `src/app/lib/providers/fuelixModels.ts`).
- Chat uses `/chat/completions`. Models that only support the Anthropic-style `/messages` endpoint (e.g. premium Opus models) are retried there automatically.

### Current limitations
- Text only: image/file upload and web search are disabled for FuelIX models.
- Context length is not exposed by FuelIX, so it is not shown.
- If your key gains or loses access to a model, update the `UNUSABLE_IDS` set in `fuelixModels.ts`.

## BYOK (bring your own key)

Signed-in users can add their own key for any OpenAI-compatible provider from the in-app API Keys panel. Saved keys are encrypted at rest with `ENCRYPTION_KEY`.
