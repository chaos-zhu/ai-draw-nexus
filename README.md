# AI Diagram Hub

An AI-powered diagram creation platform. Describe your diagram in natural language, and AI generates it for you.

## Features

- **Natural Language Generation** - Just describe what you want, AI creates the diagram
- **Three Drawing Engines**
  - Mermaid - Flowcharts, sequence diagrams, class diagrams
  - Excalidraw - Hand-drawn style diagrams
  - Draw.io - Professional diagram editor
- **Version History** - Auto-saves every change, restore anytime
- **Local Storage** - Data stored in browser, privacy-friendly

## Quick Start

### Option 1: Quick Generate from Homepage

1. Open the homepage
2. Select a drawing engine (Mermaid / Excalidraw / Draw.io)
3. Enter your diagram description, e.g., "Draw a user login flowchart"
4. Click Generate - AI creates the project and diagram automatically

### Option 2: Project Management

1. Go to the Projects page
2. Click "New Project"
3. Choose an engine and name your project
4. Use the chat panel in the editor to describe your needs

## Usage Tips

### AI Chat Generation

In the chat panel on the right side of the editor, you can:

- Describe new diagrams: "Draw an e-commerce checkout flow"
- Modify existing diagrams: "Change the payment node to red"
- Add elements: "Add an inventory check step"

### Manual Editing

- **Excalidraw** - Drag and draw directly on the canvas
- **Draw.io** - Use professional diagram editing tools
- **Mermaid** - Edit the code directly

### Version Management

- Click the "History" button in the toolbar
- View all historical versions
- Click any version to preview
- Click "Restore" to revert to that version

## Deployment

### Frontend

Deploy to Vercel with one click, or any static hosting platform.

### Backend

Backend uses Cloudflare Workers. Configure your AI API:

```bash
cd worker

# Set environment variables
pnpm run secret:set AI_API_KEY      # Your API Key
pnpm run secret:set AI_BASE_URL     # API endpoint

# Deploy
pnpm run deploy:prod
```

### Supported AI Services

| Provider | Recommended Models |
|----------|-------------------|
| OpenAI | gpt-4o, gpt-4o-mini |
| Anthropic | claude-3-opus, claude-3-sonnet |
| Other OpenAI-compatible services | - |

## Local Development

```bash
# Install dependencies
pnpm install
cd worker && pnpm install && cd ..

# Start dev servers (run both)
pnpm run dev              # Frontend http://localhost:5173
cd worker && pnpm run dev # Backend http://localhost:8787
```

Configure `worker/.dev.vars`:

```env
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_PROVIDER=openai
AI_MODEL_ID=gpt-4o-mini
```

## Tech Stack

- Frontend: React 19 + Vite + TypeScript + Tailwind CSS
- State: Zustand
- Storage: Dexie.js (IndexedDB)
- Backend: Cloudflare Workers

## License

MIT
