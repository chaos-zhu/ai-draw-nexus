# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Diagram Hub - An AI-powered diagram creation platform supporting Mermaid, Excalidraw, and Draw.io engines. Users describe diagrams in natural language and AI generates them.

## Development Commands

```bash
# Frontend (root directory)
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (http://localhost:5173)
pnpm run build        # TypeScript check + Vite build
pnpm run lint         # ESLint

# Backend Worker (worker/ directory)
cd worker
pnpm install          # Install worker dependencies
pnpm run dev          # Start Cloudflare Worker (http://localhost:8787)
pnpm run deploy:prod  # Deploy to production
```

Both frontend and worker must run simultaneously for full functionality.

## Architecture

### Monorepo Structure
- **Root**: React frontend (Vite + React 19 + TypeScript)
- **worker/**: Cloudflare Workers backend (API proxy to AI providers)

### Frontend Architecture

**State Management**: Zustand stores in `src/stores/`
- `editorStore.ts` - Current project, canvas content, unsaved changes tracking
- `chatStore.ts` - Chat messages for AI interaction
- `payloadStore.ts` - OpenAI-compatible message payloads

**Data Layer**: Dexie.js (IndexedDB) in `src/lib/db.ts`
- `projects` table - Project metadata with thumbnails
- `versionHistory` table - Content snapshots per project

**Feature Modules** (`src/features/`):
- `engines/` - Drawing engine integrations (mermaid, excalidraw, drawio)
- `chat/` - AI chat panel components
- `editor/` - Canvas and version history UI
- `project/` - Project management

**Services** (`src/services/`):
- `aiService.ts` - Frontend AI client with SSE streaming support
- `projectRepository.ts` / `versionRepository.ts` - IndexedDB CRUD

### Backend Architecture

Single Cloudflare Worker (`worker/src/index.ts`) that:
- Proxies requests to OpenAI or Anthropic APIs
- Handles message format conversion between providers
- Supports both streaming (SSE) and non-streaming responses

### Key Patterns

**Path Alias**: Use `@/` for imports from `src/` (configured in vite.config.ts and tsconfig)

**Engine Types**: `'mermaid' | 'excalidraw' | 'drawio'` - defined in `src/types/index.ts`

**AI Message Format**: OpenAI-compatible with multimodal support (text + images)

## Environment Setup

Worker requires `.dev.vars` file in `worker/` directory:
```env
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_PROVIDER=openai
AI_MODEL_ID=gpt-4o-mini
```

For production, use `wrangler secret put <VAR_NAME> --env production`.
