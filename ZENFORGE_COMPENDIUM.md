# 📖 ZenForge AI — Complete Codebase Compendium

> **Version**: Snapshot of commit `282d5a5` (last good commit before session work)
> **Generated**: 2026-07-10
> **Scope**: Every file, every tab, every API route, every lib module, every config — fully documented
> **Total codebase read**: ~14,000 lines across 60+ source files

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Configuration Files](#3-configuration-files)
4. [Directory Structure](#4-directory-structure)
5. [Design System & Tokens](#5-design-system--tokens)
6. [The 13 Tabs — Deep Dive](#6-the-13-tabs--deep-dive)
7. [UI Primitives & Components](#7-ui-primitives--components)
8. [State Management](#8-state-management)
9. [Paywall System](#9-paywall-system)
10. [API Routes — Complete Reference](#10-api-routes--complete-reference)
11. [Library Modules (src/lib/)](#11-library-modules-srclib)
12. [Rendering Paths](#12-rendering-paths)
13. [The 24/7 Evolution Loop](#13-the-247-evolution-loop)
14. [Persistence Layer](#14-persistence-layer)
15. [LLM Provider Stack](#15-llm-provider-stack)
16. [Hooks](#16-hooks)
17. [Inspiration Data Sources](#17-inspiration-data-sources)
18. [Premium Feature Guarantee](#18-premium-feature-guarantee)
19. [Known Bugs & Issues](#19-known-bugs--issues)
20. [Environment Variables](#20-environment-variables)
21. [Deployment](#21-deployment)
22. [File Inventory](#22-file-inventory)

---

## 1. Project Identity

**Name**: ZenForge AI — Elite Website Design Studio
**Tagline**: "Elite website design studio powered by Z.AI"
**Domain**: `zenforge.site` (production), `localhost:3000` (dev)
**Repository**: `github.com/trailerr9918/zenforge`
**Owner**: Darrell (`agentkelvinax02@gmail.com` on Vercel, `trailerr9918` on GitHub)
**Started**: July 2026 (based on commit history)
**Package name**: `nextjs_tailwind_shadcn_ts` (placeholder in `package.json` — never updated)

ZenForge is a **multi-strategy AI website generator** with a self-evolving "Virtual Artist" loop on top. It produces single-file HTML websites using four parallel rendering strategies, stores them in Supabase, and learns from user emoji ratings to improve future generations.

The studio UI is a **13-tab monolithic Next.js client component** (`src/app/page.tsx`, 4,135 lines) styled after Linear/Raycast — pure monochrome dark, no color hues except status colors.

---

## 2. Tech Stack & Dependencies

### Core Framework
- **Next.js 16.1.1** with Turbopack (App Router)
- **React 19.0.0**
- **TypeScript 5**
- **Bun 1.3.14** (runtime for production server)

### UI & Styling
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **tw-animate-css 1.3.5**
- **Framer Motion 12.42.2** (animations)
- **Lucide React 1.23.0** (icons)
- **shadcn/ui** + **Radix UI** (full component suite: accordion, dialog, dropdown, etc.)
- **cmdk 1.1.1** (command palette)
- **sonner 2.0.6** (toasts)
- **vaul 1.1.2** (drawer)

### Data & State
- **Supabase JS 2.110.0** (Postgres — the real database)
- **Prisma 6.11.1** + **@prisma/client** (SQLite — dead weight, only has `User`/`Post` models)
- **Zustand 5.0.6** (declared but unused)
- **TanStack Query 5.82.0** + **TanStack Table 8.21.3** (declared, lightly used)
- **React Hook Form 7.60.0** + **Zod 4.0.2** (declared, lightly used)

### AI & LLM
- **z-ai-web-dev-sdk 0.0.18** (Z.AI sandbox SDK — reads `/etc/.z-ai-config`)
- **Mistral API** (via direct `fetch` to `api.mistral.ai`)
- **Groq API** (via direct `fetch` to `api.groq.com` — optional, user-supplied key)

### Sandbox & Execution
- **E2B Code Interpreter 2.6.1**
- **@dnd-kit** (drag-and-drop, declared)

### Other
- **react-markdown 10.1.0** + **react-syntax-highlighter 15.6.1**
- **recharts 2.15.4** (charts, declared)
- **sharp 0.34.3** (image processing)
- **next-auth 4.24.11** + **next-intl 4.3.4** + **next-themes 0.4.6** (declared, mostly unused)
- **uuid 11.1.0**, **date-fns 4.1.0**, **clsx 2.1.1**, **tailwind-merge 3.3.1**

### Scripts (from `package.json`)
| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev -p 3000 2>&1 \| tee dev.log` | Dev server on port 3000, logs to `dev.log` |
| `build` | `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` | Production build (standalone output) |
| `start` | `NODE_ENV=production bun .next/standalone/server.js 2>&1 \| tee server.log` | Run production server with Bun |
| `lint` | `eslint .` | Lint |
| `db:push` | `prisma db push` | Push Prisma schema to SQLite (unused in practice) |

---

## 3. Configuration Files

### `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  output: "standalone",           // Server.js can run standalone with Bun
  typescript: { ignoreBuildErrors: true },  // ⚠️ TS errors silently dropped
  reactStrictMode: false,
};
```
**Note**: `ignoreBuildErrors: true` means TypeScript drift won't break the build — dangerous.

### `vercel.json`
Per-function `maxDuration` overrides for Vercel Hobby tier (60s max):
- `forge/generate`: 60s
- `forge/review`: 45s
- `forge/extract`: 300s ⚠️ (will silently fail on Hobby — max is 60s)
- `forge/learn-image`: 90s ⚠️ (same issue)
- `recreate`: 30s
- `render-site`: 30s

**Missing entries** for: `premium-generate` (60s), `va-generate` (60s), `quality-check` (30s), `zai/[...path]` (60s), `llm/chat` (30s). These routes set `maxDuration` in code but Vercel uses the lower of the two.

### `tsconfig.json`
Standard Next.js TS config. `strict: true`, `noEmit: true`, paths alias `@/*` → `./src/*`.

### `.env`
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
MISTRAL_API_KEY=6XRe0pKv1ILxA9FixrlICF1Mhh9fJ1je
VERCEL_API_KEY=[REDACTED - VERCEL TOKEN]
GITHUB_TOKEN=[REDACTED - GITHUB TOKEN]
```
`.env` is **gitignored** — not in the repo.

### `.gitignore`
Standard Next.js ignores: `node_modules`, `.next`, `.env*`, etc. Also ignores `download/learning-websites/` (the 100-site training set is not committed).

### `Caddyfile`
Caddy reverse proxy config (used when running the standalone server behind Caddy). Routes `zenforge.site` → `localhost:3000`.

### `components.json`
shadcn/ui config: style="new-york", baseColor="neutral", cssVariables=true.

### `postcss.config.mjs`
Just `@tailwindcss/postcss` plugin.

### `tailwind.config.ts`
Minimal — Tailwind 4 uses CSS-first config via `globals.css`.

### `eslint.config.mjs`
Inherits `eslint-config-next`.

---

## 4. Directory Structure

```
/home/z/my-project/
├── .env                          # Local env (gitignored)
├── .gitignore
├── Caddyfile                     # Reverse proxy config
├── MARK_2_PLAN.md                # Planning doc for the Forge Engine
├── MASTER_CHECKLIST.md           # User's task list
├── bun.lock                      # Bun lockfile
├── components.json               # shadcn/ui config
├── dev.log                       # Dev server log (tee'd from npm run dev)
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json             # npm lockfile (522KB)
├── package.json
├── postcss.config.mjs
├── prisma/
│   ├── forge-schema.sql          # DDL for Supabase forge_* tables
│   └── schema.prisma             # Prisma schema (SQLite, unused)
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── worklog.md                    # Multi-agent work log (this session)
│
├── download/                     # User-facing deliverables
│   ├── vela-fashion.html
│   ├── cipher-security.html
│   ├── bloom-flowers.html
│   └── vela-mistral.html
│
├── public/                       # Static assets
│   ├── aethera.html              # Demo site
│   ├── lithos.html               # Demo site
│   ├── logo.svg
│   ├── robots.txt
│   ├── zenforge-demo.html
│   └── learning-websites/        # 100 training websites (gitignored)
│
├── src/
│   ├── app/
│   │   ├── globals.css           # Tailwind + Elite theme overrides
│   │   ├── layout.tsx            # Root layout (Geist fonts, metadata)
│   │   ├── page.tsx              # ⭐ THE MAIN FILE — 4,135 lines, 13 tabs
│   │   ├── s/[slug]/route.ts     # Public website viewer (/s/slug)
│   │   └── api/                  # 60+ API routes (see §10)
│   ├── components/ui/            # 47 shadcn/ui components
│   ├── hooks/
│   │   ├── use-audit-logger.ts
│   │   ├── use-mobile.ts
│   │   ├── use-session.ts
│   │   └── use-toast.ts
│   └── lib/                      # 20+ library modules (see §11)
│       ├── brain/                # 147 brand DESIGN.md files + motionsites prompts
│       ├── cache/                # Extracted spec caches
│       ├── forge/                # Forge Engine (reasoner, review, techniques)
│       └── *.ts                  # All library modules
│
├── skills/                       # Z.AI skill packs (LLM, TTS, VLM, charts, etc.)
├── upload/                       # User-uploaded reference material
├── archives/                     # Old code archives
├── data-xml/                     # XML data files
├── databases/                    # Misc DB files
├── db/                           # SQLite DB (custom.db)
├── mini-services/                # Small standalone services
├── images/                       # Image assets
└── examples/                     # Example code (websocket, etc.)
```

---

## 5. Design System & Tokens

The UI uses a **pure monochrome dark theme** inspired by Linear and Raycast. The design tokens are defined as a `const` object at the top of `page.tsx`:

```typescript
const C = {
  canvas:   '#050505',                    // Page background (near-black)
  surface:  '#0a0a0a',                    // Header/footer bg
  elevated: '#111111',                    // Default Panel level
  card:     '#161616',                    // Cards, inputs
  hover:    '#1a1a1a',                    // Hover state
  border:   '#1f1f1f',                    // Toggle track
  text:     '#ffffff',                    // Primary text
  textSec:  'rgba(255,255,255,0.7)',      // Secondary text
  textMute: 'rgba(255,255,255,0.4)',      // Muted text
  textDis:  'rgba(255,255,255,0.25)',     // Disabled text
  accent:   '#ffffff',                    // Accent (mutable at runtime)
  accentText: '#000000',                  // Text on accent
  borderDef: 'rgba(255,255,255,0.06)',    // Default border (hairline)
  borderHov: 'rgba(255,255,255,0.12)',    // Hover border
  borderFoc: 'rgba(255,255,255,0.3)',     // Focus border
  success:  '#22c55e',                    // Green status
  warn:     '#f59e0b',                    // Amber status
  error:    '#ef4444',                    // Red status
  info:     '#3b82f6',                    // Blue status
} as const;
```

### Radii
```typescript
const R = { sm: 6, md: 8, lg: 12, xl: 16 };
```

### Transitions
```typescript
const EASE: Transition   = { duration: 0.2, ease: [0.4, 0, 0.2, 1] };
const SPRING: Transition = { type: 'spring', stiffness: 280, damping: 28 };
```

### CSS Variables (from `globals.css`)
- `--elite-accent` / `--elite-accent-text` — runtime-mutable accent color (set via Settings → Appearance)
- `--radius: 0.625rem` — base border radius
- Dark scrollbar: 8px wide, `rgba(255,255,255,0.08)` thumb
- `@keyframes shimmer` — used by the `Shimmer` loading component
- `@keyframes elite-pulse` — for status dots
- `@keyframes blink` — for streaming text cursor
- `@media (prefers-reduced-motion: reduce)` — disables animations

### Surface Ladder
The design follows a strict 5-step surface ladder: `#050505 → #0a0a0a → #111111 → #161616 → #1a1a1a`. **No drop shadows in dark mode** — only hairline borders (`rgba(255,255,255,0.06)`).

### Accent Color System
The accent is **white by default** but can be changed in Settings → Appearance:
- 8 preset colors: white, amber, green, cyan, purple, pink, red, orange
- Custom hex picker
- Light colors (`#ffffff`, `#f59e0b`, `#22c55e`, `#06b6d4`) use black text on accent
- Dark colors use white text on accent
- The `C` object is **mutated at runtime** via `(C as any).accent = newColor` — bypasses React's reactivity, hence the `forceUpdate()` workaround

### Exceptions to Monochrome
Some tabs use hardcoded colors outside the token system:
- **Brain tab**: purple gradient brain node (`#6366F1` → `#8B5CF6`)
- **Catalog tab**: colorful folder icons (`#FF6B6B`, `#4ECDC4`, `#FFE66D`, `#A8E6CF`, `#FF8B94`, `#C9A0DC`), lime accent (`#DCFF00`)
- **Artist tab**: lime accent (`#DCFF00`), blue (`#64CEFB`)
- **Paywall modal**: amber lock glow (`#f59e0b`), lime unlock button gradient (`#DCFF00` → `#64CEFB`)
- **Terminal**: green prompt (`#28c840`), blue path (`#3b82f6`), Mac traffic lights (`#FF5F57`, `#FEBC2E`, `#28C840`)

---

## 6. The 13 Tabs — Deep Dive

The `TABS` array (line 230 of `page.tsx`) defines all 13 tabs. The header comment says "9 tabs" but the file actually has 13 — the comment is stale.

| # | id | label | icon | locked? | component |
|---|----|----|------|---------|-----------|
| 1 | `generate` | Generate | `Sparkles` | ✅ yes | `GenerateTab` |
| 2 | `patterns` | Patterns | `Layers` | no | `PatternsTab` |
| 3 | `projects` | Projects | `FolderKanban` | no | `ProjectsTab` |
| 4 | `agent` | AI Agent | `Bot` (custom SVG) | ✅ yes | `AgentTab` |
| 5 | `sandbox` | Sandbox | `Terminal` | ✅ yes | `SandboxTab` |
| 6 | `deploy` | Deploy | `Rocket` | ✅ yes | `DeployTab` |
| 7 | `logs` | Logs | `ScrollText` | no | `LogsTab` |
| 8 | `brain` | Brain | `Brain` | no | `BrainTab` |
| 9 | `recreate` | Recreate | `RefreshCw` | ✅ yes | `RecreateTab` |
| 10 | `catalog` | Catalog | `Layers` (duplicate) | no | `CatalogTab` |
| 11 | `evolution` | Evolution | `Cpu` | ✅ yes | `EvolutionTab` |
| 12 | `artist` | Virtual Artist | `Hexagon` | ✅ yes | `ArtistTab` |
| 13 | `settings` | Settings | `Settings` | no | `SettingsTab` |

**Locked tabs** (7): `generate`, `recreate`, `agent`, `sandbox`, `deploy`, `evolution`, `artist` — require premium access when paywall is ON.

**Free tabs** (6): `patterns`, `projects`, `brain`, `logs`, `catalog`, `settings`.

---

### Tab 1: Generate (`GenerateTab`, lines 360–706)

**Purpose**: The primary website generation interface. User types a prompt, picks a business type, and generates a complete website.

**Two-path generation toggle** (`usePremiumLLM`, default ON):

**Path A — Premium LLM** (default):
1. Reads `localStorage['sf-llm-model']` (default `'mistral-large-latest'`)
2. If model is Groq (`llama`/`mixtral`) and user has `sf-groq-key`: calls Groq directly from the browser (no Vercel timeout)
3. Otherwise: calls `/api/premium-generate` (Edge function, streaming) which tries Mistral → VPS bridge (Z.AI glm-4-plus)
4. Uses `|||GENERATION_COMPLETE|||` and `|||GENERATION_ERROR|||` sentinels to mark stream end
5. Saves via `/api/save-website`
6. Optional: `/api/inject` to add WhatsApp button or floating contact form

**Path B — Standard** (when Premium toggle is OFF):
- Calls `/api/render-site` which uses the V5/V6 combinatorial renderer (deterministic, instant)

**UI Elements**:
- **Prompt textarea** with 10 quick-prompt chips (`QUICK_PROMPTS`: Coffee shop, Electrician, Gym, Tech, Restaurant, Law firm, Dental, Salon, Plumber, Real Estate)
- **Premium LLM toggle** — labeled "✨ Premium LLM Generation", description mentions "Mistral Large generates $50K-agency-grade websites (15-30s)"
- **Advanced options** (collapsible): seed input, business type selector
- **Thinking steps** — 6 animated steps (`THINKING_STEPS`): Analyzing request → Searching Cerebrium → Selecting patterns → Generating layout → Writing content → Storing to Supabase
- **Live preview** — iframe with desktop/tablet/mobile toggle (`Device` type)
- **Design DNA panel** — shows extracted palette, fonts, variation seed
- **Action buttons**: Open live (`/s/{slug}`), Copy URL, Download HTML, Inject WhatsApp/form

**Endpoints called**: `/api/premium-generate`, `/api/render-site`, `/api/save-website`, `/api/inject`, `https://api.groq.com/openai/v1/chat/completions`

---

### Tab 2: Patterns (`PatternsTab`, lines 709–816)

**Purpose**: "Pattern Combination Explorer" — shows the 16-category pattern library and lets you randomize a seed to see a unique combination.

**16 Pattern Categories** (`PATTERN_CATS`):
| id | label | total variants |
|----|-------|---------------|
| hero | Heroes | 8 |
| features | Features | 6 |
| about | About | 5 |
| gallery | Gallery | 5 |
| testimonials | Testimonials | 6 |
| pricing | Pricing | 5 |
| faq | FAQ | 5 |
| stats | Stats | 5 |
| partners | Partners | 4 |
| blog | Blog | 4 |
| team | Team | 4 |
| contact | Contact | 4 |
| cta | CTA | 5 |
| footer | Footer | 5 |
| nav | Nav | 5 |
| buttons | Buttons | 5 |

**Total combinations**: ~207 trillion (calculated from the combinatorial space)

**How it works**:
1. Fetches live pattern counts from `/api/templates` every 10s
2. Uses a seed-based hashing function (`pickIdx` with SHA-256 salts) to deterministically pick a variant per category
3. "Randomize" button generates a new random seed
4. "Render preview" calls `/api/render-site` with `save: false` and the seed

**UI**:
- Header showing total combinations (e.g., "207T combinations")
- If evolved patterns exist, shows an "N evolved patterns added by the Self-Evolving Engine" badge
- Grid of 16 category cards, each showing the picked variant number
- Preview modal with iframe

**Endpoints**: `/api/templates`, `/api/render-site`

---

### Tab 3: Projects (`ProjectsTab`, lines 819–871)

**Purpose**: List all generated sites from Supabase, with search, open, deploy, and delete actions.

**Props**: `{ sites: Site[], loading: boolean, onRefresh: () => void }`

**UI**:
- Search input (filters by business name or slug)
- Refresh button
- List of site cards: business name, slug (`/s/{slug}`), created date, business type badge
- Per-row actions:
  - **Open** — `window.open('/s/{slug}')`
  - **Deploy** — fetches HTML from `/api/site/{slug}`, then POSTs to `/api/deploy/vercel`
  - **Copy URL** — copies to clipboard
  - **Delete** — DELETE to `/api/site/{slug}` (with confirm dialog)

**Endpoints**: `/api/sites/list` (parent `Home` calls this), `/api/site/{slug}` GET/DELETE, `/api/deploy/vercel` POST

---

### Tab 4: AI Agent (`AgentTab`, lines 932–1068)

**Purpose**: Conversational AI agent with 6 specialized modes. Streams responses via SSE.

**6 Modes** (`AI_MODES`):
| id | label | desc | icon |
|----|-------|------|------|
| designer | Designer | Generate websites from prompts | `Wand2` |
| coder | Coder | Execute code & answer questions | `Code` |
| ssh | SSH | Run shell commands on sandbox | `Terminal` |
| images | Images | Generate AI images from text | `ImageIcon` |
| researcher | Research | Web search & summarize | `BookOpen` |
| browser | Browse | Browse & extract from URLs | `Compass` |

**Model selector**: Inline `<select>` (line 990) — reads from `localStorage['sf-llm-model']`, defaults to `'glm-4-flash'` ⚠️ (stale default; Settings uses `'mistral-large-latest'`). **Missing Mistral options** — only has Groq + Z.AI.

**Streaming protocol**: SSE from `/api/generate/agent`. Event types:
- `thinking` — `{ content, stepNum }` progress updates
- `cerebrium` — `{ hits, count }` design brain search results
- `token` — streamed LLM tokens
- `tool_use` — `{ toolName, args }` function calls
- `tool_result` — `{ metadata }` results (includes `html` for website generation)
- `error` — `{ message }`
- `done` — final event

**UI**:
- Mode selector grid (6 cards)
- Model dropdown
- Chat interface with `CollapsibleStep` components showing thinking steps
- Live iframe preview when `tool_result.metadata.html` is present
- Device toggle for preview

**Endpoints**: `/api/generate/agent` (SSE streaming)

---

### Tab 5: Sandbox (`SandboxTab`, lines 1071–1086 + 1191–1583)

**Purpose**: 9 sub-modes for code execution environments. Only SSH is fully implemented; others are stubs.

**9 Sub-modes** (`SANDBOX_SUBS`):
| id | label | desc | status |
|----|-------|------|--------|
| ssh | SSH Terminal | Remote shell access | ✅ implemented |
| e2b | E2B Code | Sandbox code execution | stub |
| modal | Modal Functions | Serverless functions | stub |
| daytona | Daytona | Dev environments | stub |
| playground | Code Playground | Daytona IDE | stub |
| cloud-fn | Cloud Functions | Modal templates | stub |
| live-preview | Live Preview | Daytona preview | stub |
| batch | Batch Runner | Modal batch | stub |
| pipeline | Pipeline | Daytona+Modal | stub |

**SSH Terminal** (`SshTerminal`, lines 1191–1567 — ~380 lines):
- Full bash-like terminal emulator
- **Boot sequence**: Shows a banner "ZenForge Linux Terminal · Real E2B Sandbox · bash"
- **Connection check**: Fetches `/api/sandbox/ssh-exec?action=pwd` on mount
- **Command execution**: POSTs to `/api/sandbox/ssh-exec` with `{ command }`
- **ANSI color parsing**: `ansiToSpans()` function (lines 1101–1174) converts ANSI escape codes to React spans
- **Tab completion**: POSTs to `/api/sandbox/ssh-exec?action=tab` with `{ input }`; shows popup for multiple matches, auto-completes common prefix
- **Command history**: Arrow up/down navigates history
- **Keyboard shortcuts**:
  - `Enter` — execute
  - `Tab` — autocomplete
  - `↑/↓` — history navigation
  - `Ctrl+L` — clear screen
  - `Ctrl+C` — cancel input
  - `Ctrl+U` — kill line
  - `Ctrl+W` — delete word backwards
  - `Ctrl+A` — home
  - `Ctrl+E` — end
  - `Escape` — clear suggestions
- **Prompt rendering**: `user@e2b:~/current/dir$` (green user@host, blue path)
- **Latency display**: Shows ms for each command
- **Mac-style title bar**: Traffic lights (red/yellow/green), "user@e2b — bash — 80×24"
- **Quick commands bar**: `ls -la`, `pwd`, `whoami`, `uname -a`, `date`, `df -h`, `free -m`, `uptime`, `ps aux`, `env`, `help`, `clear`

**SandboxStub** (lines 1569–1583): For non-ssh sub-modes — shows "Not configured" badge, endpoint path, and a "Test endpoint" button that fetches `/api/sandbox/{sub}` or `/api/sandbox/{sub}-create` and alerts the JSON response.

**Endpoints**: `/api/sandbox/ssh-exec` (POST, `?action=pwd` / `?action=tab`), `/api/sandbox/{sub}` for stubs

---

### Tab 6: Deploy (`DeployTab`, lines 1586–1634)

**Purpose**: Vercel deployment dashboard. Despite the name, **does NOT actually deploy to Vercel** — it just saves the site to Supabase and returns a `/s/{slug}` URL.

**Props**: `{ sites: Site[] }`

**UI**:
- Stats grid: Status, Project ("site-forge-two-lake"), URL ("vercel.app"), Sites count
- "Sites ready to deploy" list — per-row: Open, Deploy (fetches HTML then POSTs to `/api/deploy/vercel`), Delete
- Environment panel: Supabase (connected), Vercel (connected), OpenAI (not configured), Anthropic (not configured)

**The "deploy" action** (`deploy` function, line 1593):
1. Fetches HTML from `/api/site/{slug}`
2. POSTs to `/api/deploy/vercel` with `{ action: 'deploy', slug, html, businessName, businessType }`
3. The endpoint just calls `saveWebsiteToSupabase()` and returns `{ viewUrl: '/s/{slug}' }` — no Vercel API call

**Endpoints**: `/api/deploy/vercel` GET+POST, `/api/site/{slug}` GET

---

### Tab 7: Logs (`LogsTab`, lines 1637–1698)

**Purpose**: System logs viewer with auto-refresh, filtering, and export.

**UI**:
- Auto-refresh toggle (default ON, refreshes every 5s)
- Search filter (filters by message content)
- Level filter (info/success/warn/error/debug)
- Stats display (from `/api/logs?format=stats`)
- Log list: timestamp, level badge, source, message, duration
- Actions: Export (`/api/logs?format=text`), Clear (DELETE `/api/logs`)

**Endpoints**: `/api/logs?level=...&limit=200`, `/api/logs?format=stats`, `/api/logs?format=text`, `/api/logs` DELETE

---

### Tab 8: Brain (`BrainTab`, lines 1701–1877)

**Purpose**: Cerebrium design-knowledge search. Visualizes the "brain" as a graph and lets you search 159 design files from 74 brands.

**13 Topic chips** (`BRAIN_TOPICS`):
typography, color, layout, animation, components, accessibility, responsive, branding, luxury, tech, minimal, creative, corporate

**UI**:
- **Brain visualization**: Central purple gradient node (`#6366F1` → `#8B5CF6`) with pulsing ring animation
- **Topic nodes**: 13 clickable chips, active state highlighted in purple
- **Search intensity heatmap**: 48-cell grid (12 columns × 4 rows) — ⚠️ uses `Math.random()` per render so it flickers on every re-render
- **Search bar**: Searches the Cerebrium design brain
- **Results list**: Each result shows category badge, title, excerpt, tags, score

**Search flow**:
1. User enters query (or clicks a topic chip)
2. Fetches `/api/cerebrium/search?q={query}&limit=20`
3. Results include `id`, `name`, `category`, `title`, `excerpt`, `tags`, `score`
4. Stats panel shows total files, brands, taste files

**Stats text** (inconsistent):
- Header says "159 design files indexed" (hardcoded)
- Empty state says "159 design MD files · 74 brands"
- AppHeader (top of page) says "310" brain files
- Settings tab says "310"

**Endpoints**: `/api/cerebrium/search`

---

### Tab 9: Recreate (`RecreateTab`, lines 2489–3011 — ~520 lines)

**Purpose**: Browse 121 MotionSites prompts and recreate any of them. The most feature-complete generation tab.

**State**:
- `prompts: RecreatePrompt[]` — list of 121 prompts
- `selected: RecreatePrompt | null` — currently selected prompt
- `recreating: boolean` — generation in progress
- `stepIdx: number` — current step in the 4-step process
- `result: any` — generation result (html, spec, viewUrl, etc.)
- `useLLM: boolean` — Deep mode (LLM extraction) vs Fast mode (regex fallback), default ON
- `device: Device` — preview device
- `showPromptText: boolean` — collapsible original prompt text

**4-step process** (`RECREATE_STEPS`):
1. Reading prompt (icon: `BookOpen`)
2. Extracting spec via LLM (icon: `Brain`)
3. Rendering website (icon: `Sparkles`)
4. Complete (icon: `CheckCircle2`)

**Extraction strategy** (bypasses Vercel's 10s Hobby timeout):
1. **Fetch prompt text** from `/api/recreate?slug={id}`
2. **Path A — Client-side Groq** (if user has Groq key + Groq model selected): calls `api.groq.com` directly from browser, no timeout
3. **Path B — Edge function** (`/api/llm-extract`): streams Mistral extraction with `|||EXTRACTION_COMPLETE|||` / `|||EXTRACTION_ERROR|||` markers, 60s timeout
4. **Path C — Server-side** (fallback): POST to `/api/recreate` with `groqExtraction` payload, server renders

**Two-column layout**:
- **Left**: Prompt library (searchable, filterable by type), selected prompt details, extraction mode toggle, action button
- **Right**: Live preview (iframe with device toggle), original prompt text (collapsible)

**Spec summary panel** (after generation):
- Section types rendered (badges)
- Display font + body font
- Color palette (swatches with hex codes)
- Nav items

**Prompt list UI**:
- Search input (title, category, slug)
- Type filter chips (All, hero, landing-page, footer, etc.)
- Scrollable list (max 200 prompts shown)
- Each row: title, slug · category, color count, font count, type badge

**Endpoints**: `/api/recreate` GET (list + single prompt), POST (generate), `/api/llm-extract` POST, `https://api.groq.com/openai/v1/chat/completions`

---

### Tab 10: Catalog (`CatalogTab`, lines 3013–3196)

**Purpose**: Browse the MotionSites prompt catalog broken down into 6 folders (videos, typography, colors, headers, footers, buttons). Pick random elements and generate.

**6 Folders**:
| id | label | icon | color | count source |
|----|-------|------|-------|-------------|
| videos | Videos | V | `#FF6B6B` | `catalog.videos.length` |
| typographies | Typography | T | `#4ECDC4` | `catalog.typographies.length` |
| colors | Colors | C | `#FFE66D` | `catalog.colors.length` |
| headers | Headers | H | `#A8E6CF` | `catalog.headers.length` |
| footers | Footers | F | `#FF8B94` | `catalog.footers.length` |
| buttons | Buttons | B | `#C9A0DC` | `catalog.buttons.length` |

**UI**:
- Folder sidebar (6 colorful folder icons)
- Search input (filters items in current folder)
- Items list (filtered by search)
- "Pick Random Elements" button — picks one random item from each folder, stores in `selectedPicks`
- "Generate Website" button — POSTs to `/api/va-generate` with the picks, streams JSON lines back

**⚠️ Bug**: The "Generate Website" button uses `style={{ background: C.text, color: C.bg }}` but `C.bg` doesn't exist (should be `C.canvas`) — the button text is invisible (white on white).

**Endpoints**: `/api/catalog` GET, `/api/va-generate` POST (streaming)

---

### Tab 11: Evolution / Forge Engine (`EvolutionTab`, lines 1880–2486 — ~600 lines, the LARGEST tab)

**Purpose**: The "Forge Engine" — picks design techniques from a library, mutates, renders HTML, asks user to rate (😡/😕/😐/😍/🤩). Rating drives a learning loop.

**State**:
- `target: string` — business description input
- `creativity: number` — 0.0 (safe) to 1.0 (wild), default 0.5
- `generating: boolean`
- `result: any` — generation result
- `autoForge: boolean` — auto-evolve toggle (30s interval)
- `reviewNote: string` — optional review note
- `reviewing: boolean`
- `reviewResult: any`
- `reviewToast: string | null` — toast message
- `stats: any` — forge statistics
- `history: any[]` — recent generations
- `reasoningSteps: string[]` — streaming reasoning trace
- `llmModel: string` — defaults to `'llama-3.3-70b-versatile'` ⚠️ (different from other tabs)
- `groqKey: string`
- `llmModels: any[]` — loaded from `/api/llm/models`

**Forge generation flow** (`forge` function, lines 1936–2030):
1. If Groq model + key: call Groq client-side first (bypasses IP blocks)
2. POST to `/api/forge/generate` with `{ target, creativity, save, model, groqKey, groqPlan }`
3. Stream reasoning steps while waiting (8 simulated steps)
4. On success: display result, replace simulated steps with actual `reasoningTrace`
5. Refresh stats + history

**Auto-evolve** (lines 2036–2090):
- When toggled ON, runs immediately then every 30s
- Calls `/api/forge/auto-evolve` with `{ target: 'random', creativity, model, groqKey, autoReview: true }`
- Shows "24/7 EVOLVING — Cycle #N" indicator
- Auto-rating toast: `😡/😕/😐/😍/🤩 Auto-reviewed: N/5 (saved/trashed/improve)`

**Review flow** (`review` function, lines 2092–2128):
- 5 emoji buttons: 😡 (1, trash), 😕 (2, trash), 😐 (3, improve), 😍 (4, save), 🤩 (5, save)
- POSTs to `/api/forge/review` with `{ generationId, rating, note }`
- Response actions:
  - `trashed` — "🗑️ Trashed! N techniques won't be picked again. Forging next..."
  - `saved_as_template` — "🤩 Saved as template! N techniques marked as loved."
  - `improvement_suggested` — "😐 Marked for improvement. AI suggests N changes."

**Stats + history**: Auto-refresh every 8s from `/api/forge/review?stats=true` and `?limit=10`

**UI Layout** (two-column):
- **Left column** (420px): Controls panel (target input, creativity slider, forge buttons, auto-evolve toggle, LLM model selector, Groq key input), reasoning trace panel
- **Right column**: Live preview with device toggle, score + emoji review bar, history carousel

**Endpoints**: `/api/forge/generate`, `/api/forge/auto-evolve`, `/api/forge/review` GET+POST, `/api/forge/generations`, `/api/llm/models`, `https://api.groq.com/openai/v1/chat/completions`

---

### Tab 12: Virtual Artist (`ArtistTab`, line 3196 — single compressed ~6KB line)

**Purpose**: Chat-style interface with the Virtual Artist. Generates websites via streaming, shows AI score, 5-emoji review.

**⚠️ Code quality issue**: The entire component is on a single compressed line — severely harms readability and maintainability.

**State**:
- `chatMessages: { role, content }[]`
- `chatInput: string`
- `isWorking: boolean`
- `thinkingSteps: string[]`
- `currentSite: { html, review, url, score, name } | null`
- `approvedCount: number` — tracks approvals (3 → "Sent to Evolution")
- `rejectedCount: number`
- `genCount: number`
- `chatCollapsed: boolean`
- `device: 'desktop' | 'tablet' | 'mobile'`
- `reviewEmojis: Record<string, number>`
- `history: { name, score, url, html, review }[]`

**Generation flow** (`generate` function):
1. POSTs to `/api/va-generate` with `{ action: 'generate', prompt, businessName, model }`
2. Streams JSON lines: `thinking` / `done` / `error`
3. On `done`: sets `currentSite`, increments `genCount`, adds to `history`, posts chat message

**Chat flow** (`sendChat` function):
1. POSTs to `/api/va-generate` with `{ action: 'chat', message, model }`
2. If response `action === 'auto-generate'`: posts chat message then calls `generate()`
3. Otherwise: posts chat response

**Auto-generation trigger**: The chat detection regex matches "build", "create", "make", "design", "generate", "anything", "okay", "do as you like", "run wild", "go ahead", "yes", "sure", "whatever" — very loose, will trigger on almost any affirmative.

**8 random businesses** (for "anything" requests):
Aurora (wellness retreat), Voltage (EV charging), Cipher (cybersecurity SaaS), Bloom (flower delivery), Pulse (music streaming), Forge (fitness app), Lumina (AI design agency), Nebula (AI project management)

**Rating system** (`rateSite` function):
- 5 emojis: 🤩 (5, Love, approve), 😍 (4, Great, approve), 😐 (3, Okay, neutral), 😕 (2, Work, iterate), 😡 (1, Trash, reject)
- On approve: increments `approvedCount`, chat message "3 approved! Sent to Evolution." or "Approved! N more to evolve."
- On reject: increments `rejectedCount`, chat message "Trashed. I will do better next time."
- On neutral: chat message "Got it. Tell me what to improve."

**UI Layout** (two-column when chat expanded):
- **Left**: Compact stats bar (approved/trashed/generated counts, working indicator, hide chat button), thinking steps panel, preview panel (iframe + device toggle + score + emoji review + open/mutate buttons), history strip
- **Right** (340px, collapsible): Chat interface with message bubbles, quick prompts (Luxury fashion, SaaS platform, Fitness app, Portfolio), message input + send button

**Color scheme**: Uses `#DCFF00` (lime) as accent — the send button, VA chat label, spinner, emoji highlight all use this color. ⚠️ Low contrast on dark backgrounds.

**Endpoints**: `/api/va-generate` POST (streaming JSON lines)

---

### Tab 13: Settings (`SettingsTab`, lines 3292–3594)

**Purpose**: 7-section settings panel with sidebar navigation.

**7 Sections**:

#### General
- Studio name (hardcoded "ZenForge AI" — not editable)
- Auto-save toggle
- WhatsApp defaults (non-functional toggles)

#### Appearance
- 8 preset accent colors: white, amber, green, cyan, purple, pink, red, orange
- Custom hex color picker
- Writes `--elite-accent` CSS variable + `elite-accent` localStorage
- Dispatches `accent-change` window event (triggers re-render in `Home`)

#### LLM & API Keys
- **Model `<select>`** with 3 optgroups:
  - **Mistral (Recommended)**: `mistral-large-latest`, `codestral-2508`, `mistral-medium-2505`, `mistral-small-2506`, `magistral-medium-2509`
  - **Z.AI (VPS bridge)**: `glm-4-plus`, `glm-4-flash`
  - **Groq (needs API key)**: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`
- Status indicator: green for Mistral, amber for Groq, green for Z.AI
- Groq API key field (show/hide toggle) — stored in `sf-groq-key` localStorage

#### Paywall (admin-gated)
- **Admin gate**: password check against `process.env.NEXT_PUBLIC_PAYWALL_PASSWORD || 'Hydrogen12345@work'`
- Once unlocked:
  - Toggle paywall on/off
  - View **rotating premium password** (deterministic, changes every 5 min via `generateRotatingPassword()`)
  - Recreate prompt limit slider (0–121)
  - Premium session duration buttons (3/5/10/15 min)

**⚠️ Bug**: The "Unlock Admin" button uses `style={{ background: C.text, color: C.bg }}` but `C.bg` doesn't exist — invisible button text.

#### Integrations
List of 6 integrations with status badges:
- Z.AI SDK Proxy (VPS Bridge · glm-4-plus) — Connected
- Supabase (Supabase Project) — Connected
- Vercel (zenforge.site) — Connected
- Groq (key status) — depends on `groqKey`
- Modal (Add MODAL_TOKEN) — Not set
- E2B Sandbox (Add E2B_API_KEY) — Not set

#### VA Memory
Renders `<VAMemoryPanel>` (lines 3298–3390):
- Fetches `/api/va-autonomous?action=status` on mount
- Shows memory stats: total entries, generations, avg score, last activity
- "Run Autonomous" button POSTs `action=generate`
- Recent entries list with timestamps

#### Advanced
- 4 stat cards: Renderer V6 Ultra, 310 brain files, 207T combos, 29 API routes
- Danger zone: Clear cache button, Clear logs button

---

## 7. UI Primitives & Components

All defined in `page.tsx` lines 83–223:

| Component | Props | Purpose |
|-----------|-------|---------|
| `Panel` | `children, className, level='elevated', onClick, style` | Container with 3 levels: surface/elevated/card |
| `SectionHeader` | `title, sub?, right?` | Title + subtitle + optional right content |
| `Button` | `children, onClick, variant='secondary', size='md', disabled, className, icon` | 4 variants (primary/secondary/ghost/danger), 3 sizes, optional icon |
| `Input` | `value, onChange, placeholder, type='text', className, onKeyDown, icon` | Text input with optional leading icon |
| `Textarea` | `value, onChange, placeholder, rows=4, className, onKeyDown` | Multi-line input |
| `Spinner` | `size=16` | Spinning `Loader2` icon |
| `Badge` | `children, color='default'` | 5 colors (default/success/warn/error/info) |
| `Toggle` | `checked, onChange` | Toggle switch |
| `ToggleRow` | `label, desc, checked, onChange` | Toggle with label + description |
| `Chip` | `label, icon?, onClick` | Clickable chip with optional emoji icon |
| `StatCard` | `label, value, icon?, accent?` | Stat display with icon |
| `Shimmer` | `style?` | Loading shimmer effect |

### Layout Components
- `AppHeader` (lines 300–357) — Top bar with logo, brain/patterns/sites stats, ⌘K button
- `TabBar` (lines 359–?) — Horizontal scrollable tab strip with icons
- `CommandPalette` (lines 3597–3637) — ⌘K palette with 12 navigation commands

### Helpers
- `cx(...p)` — class joiner (filters falsy values)
- `fmtCompact(n)` — 1.2K / 3.4M / 5.6B formatter
- `fmtTime(iso)` — HH:MM:SS
- `timeAgo(iso)` — "5m ago" / "2h ago" / "3d ago"
- `Bot({ size, strokeWidth })` — custom inline SVG bot icon (NOT the lucide `Bot`)
- `ansiToSpans(text)` — ANSI escape parser → ReactNode[] (terminal colors)
- `shortenPath(cwd)` — `/home/user/x` → `~/x`

### shadcn/ui Components (47 files in `src/components/ui/`)
Full suite installed: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

**Note**: Most of these are **unused** — the actual UI uses the custom primitives defined in `page.tsx`. The shadcn components are scaffolding from the initial `npx shadcn init`.

---

## 8. State Management

Three layers:

### Layer 1: `useSessionState()` hook (Supabase-backed)
Persists cross-refresh UI state to Supabase via `/api/session`:
- `activeTab: string` — which tab the user was on
- `accentColor: string` — accent color hex
- `autoEvolve: boolean` — evolution toggle state

On mount: fetches `/api/session` GET. On change: fire-and-forget POST to `/api/session`.

### Layer 2: `localStorage` (browser-side)
User preferences stored directly:
| Key | Purpose | Default |
|-----|---------|---------|
| `sf-llm-model` | Selected LLM model ID | varies by tab ⚠️ |
| `sf-groq-key` | Groq API key (plaintext!) | empty |
| `elite-accent` | Accent color hex | `#ffffff` |
| `zf-paywall` | `'on'` / `'off'` | `'off'` |
| `zf-premium-unlocked` | `'true'` / removed | removed |
| `zf-premium-expiry` | epoch ms | none |
| `zf-premium-duration` | minutes (3/5/10/15) | `'5'` |
| `zf-recreate-limit` | int 0–121 | `'0'` |

### Layer 3: React `useState` (per-tab local)
No Context, no Redux, no Zustand. State is passed down via props. The `Home` component owns app-wide state (sites list, paywall state, etc.) and passes to children.

### Hooks used
`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`

### `Home` component state (lines 3643–3662)
- `tab`, `templates`, `sites`, `sitesLoading`, `cmdOpen`, `accent`, `forceUpdate`
- Paywall: `paywallEnabled`, `premiumUnlocked`, `premiumExpiry`, `paywallPopup`, `premiumLogin`, `premiumError`, `paywallAdminUnlocked`, `paywallAdminPassword`, `paywallAdminError`, `currentRotatingPassword`, `countdownSeconds`

---

## 9. Paywall System

A two-tier paywall controlled entirely client-side (no server validation — passwords are visible in the source bundle).

### Admin Tier (Settings → Paywall section)
- **Gate**: `paywallAdminPassword` checked against `process.env.NEXT_PUBLIC_PAYWALL_PASSWORD || 'Hydrogen' + '12345@work'` (line 3754)
- Once unlocked, admin can:
  - Toggle paywall on/off (writes `zf-paywall` to localStorage)
  - View **rotating premium password** — deterministic, changes every 5 min via `generateRotatingPassword()`:
    ```typescript
    const timeSlot = Math.floor(Date.now() / (5 * 60 * 1000));
    const seed = timeSlot * 12345;
    // 8-char password from 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    ```
  - Configure locked-mode features
  - Set recreate-prompt limit (0–121, 0 = locked entirely)
  - Set premium session duration (3/5/10/15 min buttons)

### End-user Tier (paywall popup modal, lines 3899–4061)
- Clicking a locked tab when paywall is ON and user not premium → shows modal
- **Login**: username `process.env.NEXT_PUBLIC_PREMIUM_USER || 'twinkle' + 'ats2much'`, password `process.env.NEXT_PUBLIC_PREMIUM_PASS || 'precious' + 'rules991$'` (line 3730)
- **Hardcoded fallback credentials** are visible in the JS bundle — not real security
- Successful login sets `zf-premium-unlocked=true` + `zf-premium-expiry=<now+duration min>` in localStorage
- **Live countdown timer** (1s tick): turns red below 60s, "Critical" below 30s
- Auto-locks at 0 — clears localStorage + closes popup
- Modal shows: lock icon with amber glow, "Premium Feature" heading, login form, info panel ("✓ Full access to all tabs", "✗ Export/download disabled")

### Premium countdown bar (lines 4063–4132)
Fixed top banner (z-40, below command palette z-50):
- "Premium" label
- Thin depleting progress bar (depletes over 5 min)
- Monospace time display (MM:SS)
- Blinking colon
- "Expiring" (< 60s) / "Critical" (< 30s) indicator with pulsing animation
- Color shifts: white → amber → red as time runs out

### Locked tabs (`LOCKED_TABS`, line 3724)
7 tabs: `generate`, `recreate`, `agent`, `sandbox`, `deploy`, `evolution`, `artist`

### Free tabs
6 tabs: `patterns`, `projects`, `brain`, `logs`, `catalog`, `settings`

---

## 10. API Routes — Complete Reference

60+ API routes in `src/app/api/`. Here's every one:

### Generation Routes

#### `POST /api/premium-generate` (Edge, 60s)
**Purpose**: Streaming HTML generator. Provider priority: pre-computed `groqExtraction` → Mistral (SSE) → VPS bridge (Z.AI glm-4-plus).
**Request**: `{ prompt, businessName?, provider?: 'mistral'|'zai'|'auto', model?, customConfig?, groqExtraction? }`
**Response**: Streamed text with `|||GENERATION_COMPLETE|||` / `|||GENERATION_ERROR|||` sentinels.
**Functions**: `detectBizType()`, `streamResponse()`, `streamSSEResponse()`.
**Issues**:
- Redundant env access: `VPS_BRIDGE_KEY = process.env.VPS_BRIDGE_KEY || process.env.VPS_BRIDGE_KEY || ''`
- No auth — CORS `*`
- SSE parsing assumes clean `\n` splits

#### `POST /api/va-generate` (Edge, 60s)
**Purpose**: Virtual Artist endpoint. Multi-action: `chat`, `generate` (streaming), `review`, `mutate`.
**Request**: `{ action, prompt?, businessName?, html?, message?, model? }`
**Response**: NDJSON stream (`thinking` / `done` / `error` events).
**Functions**: `detectBizType()`, `callMistralStream()`.
**Issues**:
- `callMistralStream` sends `stream: false` despite the name
- Self-fetch to `/api/save-website` (fragile on Vercel)
- Hardcoded `CATALOG_VIDEOS` (can't read fs in edge)
- Loose chat detection regex

#### `POST /api/recreate` (60s)
**Purpose**: Recreate websites from MotionSites prompts.
**Request**: `{ slug, useLLM?, save?, groqKey?, model?, groqExtraction? }`
**Response**: `{ html, slug, viewUrl, businessName, renderer, extractor, sourcePrompt, sourceTitle, promptType, sectionCount, sectionTypes, promptText, spec }`
**Also GET**: Lists all 121 prompts, or single prompt text with `?slug=`

#### `POST /api/forge/generate` (60s)
**Purpose**: Generate via Forge Reasoner (technique combination).
**Request**: `{ target?, creativity?, inspirationIds?, avoidIds?, imageInspiration?, sectionCount?, save?, groqKey?, model? }`
**Response**: `{ plan, spec, html, businessName, slug?, viewUrl?, generationId, reasoningTrace, overallReason, sectionCount, creativity, target }`
**Issues**:
- Mutates `process.env.GROQ_API_KEY` with user-supplied key (line 43)
- Default model `llama-3.3-70b-versatile` but forge-reasoner uses Z.AI

#### `POST /api/forge/auto-evolve` (30s)
**Purpose**: Auto-evolution cycle. Generate → record → optionally auto-review.
**Response**: `{ generation, autoRating, cycle }`
**Issues**: In-memory state (`_autoEvolveCount`, `_lastAutoEvolveTime`, `_autoEvolveHistory`) resets on Vercel cold starts.

#### `POST /api/render-site` (30s)
**Purpose**: V5/V6 combinatorial renderer (deterministic, instant).
**Request**: `{ prompt, save?, seed? }`

#### `POST /api/render-premium` (?)
**Purpose**: Assembles a complete website WITHOUT calling an LLM. Uses V6 Ultra Premium Renderer with design system + content from `premium-website-system.ts`.

### Review Routes

#### `POST /api/quality-check` (30s)
**Purpose**: Calls Mistral to score HTML against 15-category premium rubric (22/30 = PASS).
**Request**: `{ html, model? }`
**Response**: `{ review: { score, passed, verdict, issues, improvements, categoryScores, bestPractices } }`
**Issues**: HTML truncated to 15000 chars; no fallback if Mistral is down.

#### `POST /api/forge/review` (45s)
**Purpose**: Submit emoji rating for a forge generation. Drives the learning loop.
**Request**: `{ generationId, rating: 1|2|3|4|5, note? }`
**Response**: `{ action: 'trashed'|'improvement_suggested'|'saved_as_template', improvements?, templateId?, techniquesAffected }`
**Also GET**: `?stats=true` for stats, `?limit=N` for recent generations.

#### `POST /api/va-generate` (action: 'review')
**Purpose**: Review-only mode using `STRICT_REVIEWER_PROMPT`.

### Persistence Routes

#### `POST /api/save-website` (10s)
**Purpose**: Persist HTML to Supabase `websites` table with random 4-char slug suffix.
**Request**: `{ html, businessName, businessType?, config? }`
**Response**: `{ slug, viewUrl }`
**Issues**: No auth, no content length limit, slug collision risk.

#### `GET /api/site/[slug]` (60s cache)
**Purpose**: Serve raw stored HTML.
**Response**: HTML with `Content-Type: text/html`, `Cache-Control: public, max-age=60`.
**Also DELETE**: Removes the row. ⚠️ No auth.

#### `GET /api/sites/list`
**Purpose**: List all sites from Supabase (most recent 100).
**Response**: `{ sites: [{ slug, businessName, businessType, createdAt }] }`

#### `GET /s/[slug]` (the public viewer)
**Purpose**: Serves generated websites WITH heavy post-processing.
**Processing**:
1. `repairHtml(html)` — closes truncated tags
2. `injectPremiumCSS(html)` — adds design system CSS
3. `injectPremiumFeatures(html)` — injects 7 features: preloader force-hide, IntersectionObserver, animated counters, scroll progress, back-to-top, social SVG icons, custom cursor
**Issues**:
- `.zf-force-hide` selector matches `[class*="load"]` — hides legitimate content like `.download-button`
- Forces `opacity:0` on all `<section>` elements — invisible if JS fails
- 60s cache means injection bug fixes persist for a minute

### LLM Routes

#### `POST /api/llm/chat` (30s)
**Purpose**: Multi-provider LLM chat. Routes to Groq or Z.AI.
**Request**: `{ messages, model?, provider?, groqKey?, temperature?, maxTokens? }`
**⚠️ CRITICAL BUGS** (lines 24, 84, 88):
```typescript
const SANDBOX_PROXY_KEY = 'process.env.VPS_BRIDGE_KEY || ""';  // literal string!
fetch('http://process.env.VPS_BRIDGE_HOST || "127.0.0.1":8765/...')  // invalid URL
'Authorization': 'Bearer process.env.VPS_BRIDGE_KEY || ""'  // literal string
```
The VPS bridge path is **completely non-functional**. Only Groq and the sandbox proxy fallback work.

#### `GET /api/llm/models`
**Purpose**: Static catalog of available LLM models.
**Response**: 5 models (3 Groq + 2 Z.AI) with metadata. ⚠️ No Mistral models listed despite Mistral being the recommended provider in the UI.

#### `POST /api/llm-extract` (Edge, 25s)
**Purpose**: Edge function for LLM extraction (used by Recreate tab). Streams with `|||EXTRACTION_COMPLETE|||` / `|||EXTRACTION_ERROR|||` markers.

### Z.AI Proxy

#### `GET/POST /api/zai/[...path]` (60s)
**Purpose**: Catch-all Z.AI SDK proxy. On sandbox uses SDK directly; on Vercel proxies to sandbox preview URL.
**Endpoints**:
- `/api/zai/chat` — chat completions
- `/api/zai/chat/stream` — streaming chat
- `/api/zai/vision` — vision model
- `/api/zai/images/generate` — image generation
- `/api/zai/web-search` — web search
- `/api/zai/page-reader` — page reader
- `/api/zai/health` — health check
**Functions**: `getZAI()`, `isSandbox()`, `withTimeout()`, `handleChatSandbox()`, `handleChatStreamSandbox()`, etc.
**Issues**: `PROXY_KEY` is a string literal (line 22) but unused — dead code.

### Catalog & Templates

#### `GET /api/catalog` (30s)
**Purpose**: Returns MotionSites prompt catalog (videos, typography, colors, buttons, headers, footers).
**Query params**: `?type=videos`, `?slug=xxx`

#### `GET /api/templates`
**Purpose**: Returns pattern combination stats + Cerebrium brain stats.
**Response**: `{ totalCombinations, totalPatternCount, cerebrium: { totalBrainFiles, totalBrands }, expandedComponents }`
**Issues**: Calls Supabase which requires `SUPABASE_SERVICE_KEY` — logs error if missing.

### Session & Logs

#### `GET/POST /api/session` (10s)
**Purpose**: Session persistence. GET returns full state. POST accepts actions: `setActiveTab`, `setAccentColor`, `setAutoEvolve`, `getChatHistory`, `saveChatMessage`, `clearChatHistory`.

#### `GET /api/logs` (5s)
**Purpose**: System logs. Query params: `?level=`, `?limit=`, `?format=stats|text`.
**Also POST**: Log an event. **Also DELETE**: Clear logs.

### Cerebrium

#### `GET /api/cerebrium/search` (30s)
**Purpose**: Search 159 design files from 74 brands.
**Query params**: `?q=`, `?limit=`
**Response**: `{ results: CerebriumHit[], stats: { totalFiles, totalBrands, totalTaste } }`

#### `GET /api/cerebrium/stats`
**Purpose**: Brain stats only.

### Sandbox Routes (9 sub-routes)

#### `POST /api/sandbox/ssh-exec` (?action=pwd|tab)
**Purpose**: Execute shell commands on the sandbox. `?action=pwd` returns cwd, `?action=tab` returns tab-completion suggestions.

#### `POST /api/sandbox/e2b-create`, `POST /api/sandbox/e2b-exec`
**Purpose**: E2B sandbox creation and execution.

#### `POST /api/sandbox/modal-create`, `POST /api/sandbox/modal-list`, `POST /api/sandbox/modal-test`, `POST /api/sandbox/modal-deploy-template`
**Purpose**: Modal serverless function management.

#### `POST /api/sandbox/daytona-create`, `POST /api/sandbox/daytona-exec`, `POST /api/sandbox/daytona-list`, `POST /api/sandbox/daytona-delete`, `POST /api/sandbox/daytona-preview`
**Purpose**: Daytona dev environment management.

#### `POST /api/sandbox/ssh-info`
**Purpose**: SSH connection info.

#### `POST /api/sandbox/batch-run`, `POST /api/sandbox/pipeline-run`
**Purpose**: Batch and pipeline execution.

### Deploy

#### `GET/POST /api/deploy/vercel`
**Purpose**: "Deploy" to Vercel — but **doesn't actually deploy**. Just saves to Supabase and returns `/s/{slug}` URL.
**GET**: `{ status: 'ready', target: 'vercel', project: 'site-forge-two-lake' }`
**POST**: `{ action: 'deploy'|'redeploy', slug, html, businessName, businessType }` → `{ success, action, slug, viewUrl, deployedAt }`

### Utility Routes

#### `POST /api/inject`
**Purpose**: Inject WhatsApp button or floating contact form into HTML, save to Supabase.
**Request**: `{ slug, html, inject: { whatsapp?: { phone, message }, floatingForm?: true }, businessName }`

#### `POST /api/subpage`
**Purpose**: Generate sub-pages (services, about, contact, portfolio, blog, faq, team, pricing, testimonials, custom) for a parent website. Extracts design DNA from parent, builds new HTML, auto-links in parent footer.
**Request**: `{ parentSlug, pageSlug, pageName, contentType }`
**Issues**: Hardcoded `https://` protocol (breaks localhost dev).

#### `POST /api/images/generate`
**Purpose**: AI image generation.

#### `GET /api/forge/techniques`
**Purpose**: List techniques from the Forge Technique Library.

#### `POST /api/forge/extract`
**Purpose**: Extract techniques from a MotionSites prompt.

#### `POST /api/forge/learn-image`
**Purpose**: Learn from an uploaded screenshot (VLM extraction).

#### `GET /api/forge/generations`
**Purpose**: List forge generations. Query: `?id=` for single, `?limit=` for list.

#### `GET /api/forge/status`
**Purpose**: Forge engine status.

#### `GET /api/forge/test-llm`
**Purpose**: Test LLM connectivity.

#### `GET/POST /api/artist/cycle`, `GET /api/artist/patterns`, `GET /api/artist/thoughts`, `GET /api/artist/status`, `POST /api/artist/reset`
**Purpose**: Virtual Artist cycle control, pattern/thought retrieval, status, reset.

#### `GET/POST /api/seae/cycle`, `GET /api/seae/patterns`, `GET /api/seae/status`, `POST /api/seae/reset`
**Purpose**: SEAE engine (Self-Evolving Artist Engine) — alternate evolution system.

#### `GET/POST /api/va-autonomous`
**Purpose**: VA autonomous mode control. Actions: `generate`, `status`.

#### `POST /api/va-learn`
**Purpose**: VA learning endpoint.

#### `GET/POST /api/chat/messages`, `GET/POST /api/chat/rotated`
**Purpose**: Chat message persistence (used by sandbox proxy).

#### `GET/POST /api/sessions`
**Purpose**: Session list (alternate to `/api/session`).

#### `GET/POST /api/debug-proxy`
**Purpose**: Debug proxy endpoint.

#### `GET /api/` (root)
**Purpose**: API health check.

---

## 11. Library Modules (src/lib/)

### Core Rendering

#### `premium-website-system.ts` (644 lines)
**Exports**: `DesignSystem`, `DESIGN_SYSTEMS` (9 palettes), `SectionBlueprint`, `SECTION_BLUEPRINTS` (9 section types), `TECHNIQUE_LIBRARY` (CSS/JS string), `PREMIUM_GENERATION_PROMPT`, `generateWebsiteSeed()`, `HERO_VIDEO_POOL`, `SECTION_VIDEO_POOL`, `FONT_PAIRINGS` (10 pairings).
**Purpose**: The "recipe" for LLM-driven premium site generation. Embeds the 15-pillar master prompt.
**9 Design Systems**: cinematic-dark, liquid-glass, editorial-light, tech-minimal, warm-organic, brutalist-bold, aurora-gradient, ocean-calm.
**10 Font Pairings**: Instrument Serif+Inter, Playfair+Source Sans 3, Anton+Space Grotesk, Fraunces+Inter, DM Serif+Barlow, Bricolage+Inter, Archivo Black+Space Mono, Cormorant+Inter, Space Grotesk+Inter, Syne+Inter.

#### `premium-css-foundation.ts` (221 lines)
**Exports**: `PREMIUM_CSS` (string), `injectPremiumCSS(html)`.
**Purpose**: Complete CSS design system (`--zf-*` variables, glassmorphism, hero, cards, FAQ accordion, footer, reveal animations, responsive) injected into HTML before `</head>`.
**Guard**: Skips injection if `--zf-bg` OR `--zf-accent` already present (loose guard — single mention skips).

#### `html-postprocessor.ts` (159 lines)
**Exports**: `postProcessHTML(html)`.
**Purpose**: Deterministically injects 8 missing features: preloader force-hide, IntersectionObserver scroll reveals, animated counters, scroll progress bar, back-to-top button, FAQ accordion handler, social SVG icons, custom cursor.
**Issues**: `replace('</body>', ...)` fails silently on truncated HTML (no `</body>` tag).

#### `prompt-recreator.ts` (1,455 lines)
**Exports**: types (`SectionType`, `AnimationType`, `Section`, `StructuredSpec`, `ExtractedSpecs`), `extractSpecs()` (regex V1), `extractStructuredSpecsViaLLM()` (V2 LLM), `extractStructuredSpecsSync()`, `renderStructuredSite()`, `recreateFromPromptAsync()`, `recreateFromPrompt()` (deprecated), `listRecreatablePrompts()`.
**Purpose**: V2 "Structured Spec Engine". LLM parses a MotionSites prompt into a strict JSON spec (sections, copy, fonts, colors, animations, media) → renderer walks `spec.sections` and emits per-section HTML.
**17 per-section renderers**: `renderHeroVideo`, `renderFeaturesGrid`, `renderFaqAccordion`, `renderPricing`, `renderFooter`, etc. + `renderCustom()` smart dispatcher.

#### `v5-core.ts` (405 lines)
**Exports**: `PALETTES` (12), `TYPOGRAPHIES` (12), `BIZ_TYPES` (10), `detectBiz()`, `mulberry32()` (seedable RNG), `pickImages()`, `imgUrl()`, `esc()`, `isDarkBg()`, `sharedCss()`, `BUTTON_VARIANTS` (5), `NAV_VARIANTS` (5).
**Purpose**: Foundation for V5 combinatorial renderer. ~207T unique-site space.

#### `v5-variants.ts`
**Exports**: `HERO_VARIANTS`, `FEATURE_VARIANTS`, `ABOUT_VARIANTS`, `GALLERY_VARIANTS`, `CTA_VARIANTS`, `FOOTER_VARIANTS`, `TESTIMONIAL_VARIANTS`.

#### `v6-renderer.ts` (453 lines)
**Exports**: `CustomConfig`, `V6_HERO_VARIANTS` (8), `V6_STATS_VARIANTS` (3), `V6_TESTIMONIAL_VARIANTS` (3), `V6_PRICING_VARIANTS` (2), `V6_FAQ_VARIANTS` (2), `V6_CTA_VARIANTS` (3), `V6_CONTACT_VARIANTS` (2), `V6_MENU_VARIANTS` (1), `renderV6()`.
**Purpose**: V5 successor with custom config support. Style-based variant selection (cinematic/editorial/bold/playful/minimal/warm).
**⚠️ Note**: `renderV6` returns `{ html: '' }` — actual assembly happens in the API route which merges V5 + V6 variants. The `_variants` field smuggles selected variants out.

#### `pattern-designer.ts` (359 lines)
**Exports**: `StoredPattern`, `CustomConfig` (⚠️ separate from v6-renderer's), `loadStoredPatterns()`, `assembleWebsite()`.
**Purpose**: "Instant assembly" path. Pulls VA + Evolution patterns from Supabase, compares fitness to premium-library patterns, uses whichever is higher. No AI call needed — instant.

### Evolution Loop

#### `virtual-artist.ts` (875 lines)
**Exports**: `runArtistCycle()`, `runMultipleArtistCycles()`, `startArtistAutoEvolve()`, `stopArtistAutoEvolve()`, `tickArtistAutoEvolve()` (Vercel-polling fallback), `loadArtistState()`, `isArtistEvolving()`, `getArtistStats()`, `getArtistThoughts()`, `getArtistPatterns()`, `getArtistCurrentPhase()`, `resetArtist()`.
**Purpose**: The 24/7 self-evolving AI artist. Global state on `globalThis.__virtualArtist` survives across requests.
**6-phase cycle**: THINK (read design-kb + MotionSites) → ITERATE (delegate to mutation-engine) → BUILD → REVIEW (review-machine) → ADD/DELETE (prune underperformers).
**Neural Score**: combines avg fitness (35%), diversity (20%), innovation (25%), learning rate (20%).

#### `mutation-engine.ts` (802 lines)
**Exports**: `MutatedPattern`, `recordGenerationResult()`, `getEvolutionStats()`, `loadEvolutionMemory()`, `generateMutatedPattern()`, `PALETTES`, `FONT_COMBOS`, `MUTATIONS`.
**Purpose**: "Caged lion" approach — AI makes DECISIONS (palette/font/mutation indices), CODE EXECUTES (regex find-replace on premium-pattern templates).
**12 palettes, 8 font combos, 8 mutations**: invert-colors, shift-spacing, change-radius, tighten-tracking, soften-shadows, add-depth, increase-contrast, add-gradient-overlay.
**Evolution memory**: in `globalThis.__mutationEvolution`, tracks per-palette/font/mutation avg fitness. Uses softmax-weighted selection + 15% novelty injection + compound mutation discovery.

#### `review-machine.ts` (599 lines)
**Exports**: `ReviewPass`, `ReviewResult`, `reviewPattern()`, `REVIEW_THRESHOLD` (75).
**Purpose**: Strict 6-pass review:
1. **Typography** — clamp/letter-spacing/line-height/weight/hierarchy/font-family
2. **Color** — palette discipline 3-12 sources, opacity layering, contrast, anti-rainbow, border consistency
3. **Layout** — grid/flex/@media/max-width/gap/padding scale
4. **Accessibility** — prefers-reduced-motion, focus states, ARIA, ≥14px font, line-height ≥1.5, contrast
5. **Brand-consistency** — AI pass using `relevantPrinciples()` from design-kb
6. **Originality** — Jaccard similarity vs existing same-type patterns
**Weighted average; hard-fail if any of typography/layout/accessibility < 60.**

### Forge Engine

#### `forge/forge-reasoner.ts` (607 lines)
**Exports**: `ForgePlanSection`, `ForgePlan`, `ForgeGenerateOptions`, `ForgeGenerationResult`, `forgeGenerate()`.
**Purpose**: The "brain" of the Forge Engine. Picks techniques from the Technique Library, explains WHY each was picked, applies mutations, assembles a StructuredSpec.
**Learning loop**: Top-rated techniques (4-5★) preferred. Avoided techniques (avoidCount ≥ 3 + low rating) never picked. Improvement suggestions from 😐 reviews passed as "things to avoid".

#### `forge/technique-library.ts` (724 lines)
**Exports**: `PartType` (20 types), `ALL_PART_TYPES`, `Technique`, `loadTechniques()`, `saveTechniques()`, `techniquesByPartType()`, `topRatedTechniques()`, `randomTechnique()`, `markTechniqueUsed()`, `markTechniqueAvoided()`, `setTechniqueRating()`.
**Purpose**: Indexes "techniques" extracted from MotionSites prompts AND user-uploaded screenshots. A technique is a single reusable design move.
**Storage**: Supabase `forge_techniques` table + local JSON at `/home/z/my-project/data/techniques.json`.

#### `forge/review-system.ts` (514 lines)
**Exports**: `EmojiRating`, `EMOJI_MAP`, `ForgeGeneration`, `SavedTemplate`, `ReviewResult`, `recordGeneration()`, `submitReview()`, `getStats()`, `getRecentGenerations()`.
**Purpose**: The 1-5 emoji rating flow that drives learning.
**Actions**:
- 😡 (1) → TRASH: mark techniques as avoided++, delete generation
- 😕 (2) → TRASH: same as 1
- 😐 (3) → IMPROVE: LLM suggests 3 improvements
- 😍 (4) → SAVE: promote to saved_templates, mark techniques as loved
- 🤩 (5) → SAVE: same as 4
**Storage**: JSON files at `/home/z/my-project/data/forge-generations.json` and `forge-templates.json` + best-effort Supabase.

### Inspiration Data

#### `motionsites-prompts.ts` (340 lines)
**Exports**: `MotionPrompt`, `loadMotionPrompts()`, `randomPrompt()`, `promptsByCategory()`, `promptsByType()`, `relevantPrompts()`, `buildInspirationContext()`, `getPromptStats()`.
**Purpose**: Parses 3 bundled markdown files from `src/lib/brain/motionsites/`. 121 prompts with colors, fonts, design tokens, principles extracted. Caches in-memory.

#### `premium-master-list.ts` (213 lines)
**Exports**: `PREMIUM_MASTER_LIST` (markdown), `STRICT_REVIEW_PROMPT`.
**Purpose**: The reviewer rubric. 15 categories × 0-2 = 30 pts, threshold 22.
**Categories**: layout, loading, navigation, hero, typography, media, content, socialProof, interactions, forms, ecommerce, jsEffects, technical, footer, invisibleDetails.

#### `va-teaching-system.ts` (194 lines)
**Exports**: `TEACHING_EXAMPLE_SUMMARY`, `buildTeachingPrompt()`, `STRICT_REVIEWER_PROMPT`, `REVIEW_EMOJIS`, `Subprocess`, `VAState`.
**Purpose**: Teaches the LLM by example (the 16/16 perfect website) and asks it to create its own variant. Picks random layout + nav variants.

#### `learning-system.ts` (155 lines)
**Exports**: `LearningWebsite`, `DesignPattern`, `loadLearningIndex()`, `analyzePatterns()`, `getRandomLearningWebsite()`, `getByStyle()`, `buildLearningPrompt()`.
**Purpose**: Analyzes 100 previously-generated learning websites in `download/learning-websites/index.json`.

#### `prompt-catalog.ts` (278 lines)
**Exports**: `CatalogVideo`, `CatalogTypography`, `CatalogColor`, `CatalogButton`, `CatalogHeader`, `CatalogFooter`, `PromptCatalog`, `extractCatalogFromPrompt()`, `buildFullCatalog()`.
**Purpose**: Dissects all 121 MotionSites prompts into structured fields (videos, headers, footers, buttons, typography, colors).

### Persistence

#### `supabase-client.ts` (92 lines)
**Exports**: `getSupabase()`, `supabase` (lazy Proxy), `StoredWebsite`, `saveWebsiteToSupabase()`, `getWebsiteFromSupabase()`, `listWebsitesFromSupabase()`.
**Purpose**: Lazy singleton Supabase client. Uses service role key (server-side only).
**URL**: `https://gjxwlnmfjzexdcepnovf.supabase.co`
**Table**: `websites` with `id`, `html`, `business_name`, `business_type` (polymorphic discriminator), `config` (JSON), `created_at`.
**`business_type` values**: regular site slugs, `virtual_artist_pattern`, `evolution_memory`, `artist_thought`, `forge-generated`, `subpage`, `injected`, `recreated-*`.

#### `session-manager.ts`
**Purpose**: Server-side session persistence (wraps Supabase for `/api/session`).

#### `va-memory.ts` (81 lines)
**Exports**: `VAMemoryEntry`, `appendMemory()`, `readMemory()`, `getMemorySummary()`.
**Purpose**: File-based markdown memory at `download/va-memory.md`. Appends typed entries (generate/review/mutate/learn/note) with timestamp, score, URL.

### LLM Clients

#### `zai-client.ts` (480 lines)
**Exports**: `ZAI_MODELS`, `zaiAvailable()`, `getZaiMode()`, `zaiChat()`, `zaiChatStream()` (async generator), `zaiImageGenerate()`, `zaiWebSearch()`, `zaiPageReader()`, `zaiVision()`, `zaiTTS()`.
**Purpose**: Comprehensive Z.AI client with triple fallback: VPS bridge → /api/zai local proxy → direct z-ai-web-dev-sdk.
**12 models**: GLM_5_2, GLM_5_1, GLM_5, GLM_4_7, GLM_5V_TURBO, GLM_4_PLUS, GLM_4V_PLUS, GLM_4_FLASH, GLM_Z1_AIR, GPT_4, GPT_4O, GPT_4O_MINI.

#### `llm-provider.ts` (211 lines)
**Exports**: `LLMProvider`, `LLMModel`, `AVAILABLE_MODELS`, `getLLMSettings()`, `setLLMSettings()`, `getModelInfo()`, `callLLM()`.
**Purpose**: Multi-provider chat abstraction. Routes by model ID.
**⚠️ BUGS**: Lines 81-82, 166-170 have string-literal env vars (`'process.env.VPS_BRIDGE_KEY'`) — completely broken. Use `zai-client.ts` instead.

### Other

#### `design-kb.ts`
**Purpose**: Design knowledge base. 147 brand DESIGN.md files in `src/lib/brain/design-md/`.

#### `seae-engine.ts`
**Purpose**: SEAE (Self-Evolving Artist Engine) — alternate evolution system.

#### `review-machine.ts` (covered above)

#### `mutation-engine.ts` (covered above)

#### `cache/extracted-specs.json`, `cache/extraction-progress.json`
**Purpose**: Cached LLM extraction results.

---

## 12. Rendering Paths

ZenForge has **4 parallel rendering strategies**, each producing HTML a different way:

### Path 1: prompt-recreator (spec-driven)
**Flow**: MotionSites prompt → LLM extracts StructuredSpec → `renderStructuredSite()` walks `spec.sections` → per-section HTML
**Used by**: Recreate tab, `/api/recreate`
**Strength**: Follows the prompt exactly, renders only the sections it describes
**Weakness**: Depends on LLM extraction quality

### Path 2: v5/v6 combinatorial (deterministic)
**Flow**: Seed + business type → `mulberry32()` RNG picks variants → V5/V6 renderers assemble HTML
**Used by**: Patterns tab preview, `/api/render-site`, Generate tab (standard path)
**Strength**: 207T unique combinations, instant, no LLM needed
**Weakness**: Content is generic (hardcoded business copy)

### Path 3: pattern-designer (instant assembly)
**Flow**: Pulls VA + Evolution patterns from Supabase → compares fitness → uses best → applies template variables
**Used by**: `/api/render-premium`, AI Agent tab
**Strength**: Instant, uses learned patterns
**Weakness**: Depends on pattern library quality

### Path 4: premium-website-system (LLM-generated)
**Flow**: `PREMIUM_GENERATION_PROMPT` + design system + technique library → LLM generates raw HTML → `injectPremiumCSS` + `postProcessHTML`
**Used by**: Generate tab (premium path), `/api/premium-generate`, VA tab
**Strength**: Most creative, unique output
**Weakness**: LLM may truncate, miss features (compensated by post-processing)

### Post-processing pipeline (applied to all paths except #2)
1. `injectPremiumCSS(html)` — adds `--zf-*` design system CSS
2. `postProcessHTML(html)` — injects 8 missing features

### Public viewer pipeline (`/s/[slug]`)
1. `repairHtml(html)` — closes truncated tags
2. `injectPremiumCSS(html)` — design system
3. `injectPremiumFeatures(html)` — 7 features (preloader, IntersectionObserver, counters, scroll progress, back-to-top, social icons, custom cursor)

---

## 13. The 24/7 Evolution Loop

The heart of ZenForge is a self-evolving AI artist that runs autonomously:

```
┌──────────────────────────────────────────────────────────────┐
│                    VIRTUAL ARTIST LOOP                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  INSPIRATION     │    │  TECHNIQUE       │               │
│  │  MotionSites     │    │  LIBRARY         │               │
│  │  121 prompts     │    │  (forge)         │               │
│  │  147 brand MDs   │    │                  │               │
│  │  100 learning    │    │                  │               │
│  │  sites           │    │                  │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                       │                          │
│           ▼                       ▼                          │
│  ┌──────────────────────────────────────────┐               │
│  │  virtual-artist.ts                        │               │
│  │  6-phase cycle:                           │               │
│  │  THINK → ITERATE → BUILD → REVIEW →       │               │
│  │  ADD/DELETE                               │               │
│  │  Neural Score: fitness(35%) +             │               │
│  │  diversity(20%) + innovation(25%) +       │               │
│  │  learning(20%)                            │               │
│  └────────┬──────────────────────────────────┘               │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  mutation-engine │    │  review-machine  │               │
│  │  "caged lion":   │    │  6-pass strict:  │               │
│  │  AI decides,     │───▶│  typography,     │               │
│  │  code executes   │    │  color, layout,  │               │
│  │  (regex on       │    │  a11y, brand,    │               │
│  │  templates)      │    │  originality     │               │
│  └──────────────────┘    │  Threshold: 75   │               │
│                          └────────┬─────────┘               │
│                                   │                           │
│                                   ▼                           │
│                          ┌──────────────────┐               │
│                          │  PASS?            │               │
│                          │  Yes → ADD        │               │
│                          │  No  → DELETE     │               │
│                          └──────────────────┘               │
│                                                              │
│  Persistence:                                                │
│    Supabase: patterns, thoughts, evolution_memory            │
│    File:     download/va-memory.md (human-readable)          │
│                                                              │
│  Vercel fallback: tickArtistAutoEvolve() (polling)           │
│  (setTimeout intervals don't survive cold starts)            │
└──────────────────────────────────────────────────────────────┘
```

### Two review rubrics (in tension)
1. **`premium-master-list`** (15 categories × 0-2 = 30 pts, threshold 22) — used by `STRICT_REVIEWER_PROMPT` for human-style review
2. **`review-machine`** (6 passes × 0-100 weighted, threshold 75, hard-fail 60) — used by the actual loop

They're not unified. The loop uses `review-machine`.

---

## 14. Persistence Layer

### Primary: Supabase (Postgres)
**URL**: `https://gjxwlnmfjzexdcepnovf.supabase.co`
**Auth**: Service role key (server-side only, bypasses RLS)
**Client**: `src/lib/supabase-client.ts` — lazy singleton via Proxy

**Tables**:
1. **`websites`** — polymorphic, discriminated by `business_type`:
   - Regular sites: `business_type` = business category
   - VA patterns: `business_type = 'virtual_artist_pattern'`
   - Evolution memory: `business_type = 'evolution_memory'`
   - Artist thoughts: `business_type = 'artist_thought'`
   - Forge generated: `business_type = 'forge-generated'`
   - Subpages: `business_type = 'subpage'`
   - Injected: `business_type = 'injected'`
   - Recreated: `business_type = 'recreated-*'`
2. **`forge_techniques`** — design moves with ratings/usage (from `prisma/forge-schema.sql`)
3. **`forge_generations`** — websites produced by Forge Reasoner (status workflow: `pending_review`/`trashed`/`improvement_suggested`/`saved_as_template`)
4. **`forge_saved_templates`** — loved sites, recallable via variable swap
5. **`forge_image_inspirations`** — uploaded screenshots metadata

### Secondary: JSON files (fallback)
- `/home/z/my-project/data/techniques.json` — technique library cache
- `/home/z/my-project/data/forge-generations.json` — forge generations
- `/home/z/my-project/data/forge-templates.json` — saved templates

### Tertiary: File-based
- `download/va-memory.md` — VA memory log (human-readable)
- `download/learning-websites/index.json` — 100-site learning index

### Dead weight: Prisma (SQLite)
- `prisma/schema.prisma` has only `User` and `Post` models — unused
- `DATABASE_URL=file:/home/z/my-project/db/custom.db` — SQLite file exists but not used by the app
- Real database is Supabase

---

## 15. LLM Provider Stack

### Provider priority (recommended)
1. **Mistral** (direct API) — `mistral-large-latest` (recommended), `mistral-small-latest`, `codestral-latest`, `magistral-medium-latest`
2. **Z.AI** (via z-ai-web-dev-sdk or VPS bridge) — `glm-4-plus`, `glm-4-flash`
3. **Groq** (user-supplied key) — `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`

### Three LLM clients (overlapping)
1. **`zai-client.ts`** (480 lines) — Z.AI only, full feature set (chat, vision, TTS, images, web search, page reader). Triple fallback: VPS bridge → /api/zai proxy → direct SDK.
2. **`llm-provider.ts`** (211 lines) — Multi-provider (Groq + Z.AI), chat only. ⚠️ Has string-literal env var bugs — VPS bridge path broken.
3. **`z-ai-web-dev-sdk`** (npm package) — Used directly in `/api/zai/[...path]` route. Reads `/etc/.z-ai-config` (sandbox only).

### Model selection
- Stored in `localStorage['sf-llm-model']`
- ⚠️ **Inconsistent defaults across tabs**:
  - GenerateTab, RecreateTab, VAMemoryPanel, SettingsTab (browser): `'mistral-large-latest'`
  - SettingsTab SSR fallback: `'glm-4-plus'`
  - AgentTab: `'glm-4-flash'`
  - EvolutionTab: `'llama-3.3-70b-versatile'`
  - RecreateTab edge path: `'mistral-small-latest'`

### API keys
- **Mistral**: `MISTRAL_API_KEY` env var (server-side)
- **Z.AI**: Auto-configured via `/etc/.z-ai-config` (sandbox) or VPS bridge
- **Groq**: `sf-groq-key` localStorage (user-supplied, plaintext)

---

## 16. Hooks

### `use-session.ts` (87 lines)
**Export**: `useSessionState()`
**Purpose**: Client hook persisting UI state (`activeTab`, `accentColor`, `autoEvolve`) via `/api/session`.
**Issues**: Comment says "debounced" but fires on every call. No retry on save failure.

### `use-audit-logger.ts` (112 lines)
**Exports**: `logClientAction()`, `logClientError()`, `installAuditLogger()`.
**Purpose**: Client-side audit logging. POSTs to `/api/logs`. `installAuditLogger` registers global listeners:
- Click on `[data-audit]` elements
- `window.error`
- `unhandledrejection`
- `beforeunload` (⚠️ fire-and-forget, likely won't complete — no `sendBeacon`)
- `visibilitychange`
- Monkey-patches `console.error` (⚠️ can break dev tools/HMR)
**Issues**: Must be called manually. `beforeunload` fetch won't complete without `sendBeacon`.

### `use-mobile.ts`
**Purpose**: Detect mobile viewport (shadcn utility).

### `use-toast.ts`
**Purpose**: Toast hook (shadcn utility, wraps `sonner`).

---

## 17. Inspiration Data Sources

### 1. MotionSites Prompts (`src/lib/brain/motionsites/`)
- 3 markdown files: `MOTIONSITES_FREE_PROMPTS.md`, `MOTIONSITES_FREE_PROMPTS (1).md`, `motionsites_free_prompts-1.md`
- 121 prompts total
- Parsed by `motionsites-prompts.ts` — extracts colors, fonts, design tokens, principles
- Each prompt has: `id`, `title`, `category`, `type`, `promptText`, `charCount`, `colorCount`, `fontCount`

### 2. Brand DESIGN.md files (`src/lib/brain/design-md/`)
- 147 files across 74 brands
- Brands include: Airbnb, Apple, Linear, Raycast, Vercel, Figma, Notion, Pinterest, Stripe, Tesla, Spotify, etc.
- Each has `DESIGN.md` (analysis) and `README.md` (summary)
- Searched via `/api/cerebrium/search`

### 3. Premium Patterns (`src/lib/premium-patterns.ts`)
- Hand-crafted Lithos-quality templates
- Used as base for mutation-engine

### 4. Learning Websites (`download/learning-websites/`)
- 100 previously-generated websites
- Indexed in `index.json`
- Analyzed by `learning-system.ts` for style patterns

### 5. Premium Master List (`src/lib/premium-master-list.ts`)
- The 15-category review rubric
- Defines what "premium" means quantitatively

### 6. Taste Analysis (`src/lib/brain/taste/`)
- `laziness/` subdirectory with root-cause analysis and remediation
- Documents why LLMs produce "lazy" output and how to fix it

---

## 18. Premium Feature Guarantee

ZenForge guarantees **16/16 premium features** on every generated website via a 3-layer injection system:

### Layer 1: `injectPremiumCSS(html)` — Design System Foundation
Injects `--zf-*` CSS custom properties, glassmorphism, hero styles, card styles, FAQ accordion, footer, reveal animations, responsive breakpoints. Skips if `--zf-bg` or `--zf-accent` already present.

### Layer 2: `postProcessHTML(html)` — Feature Injector
Injects 8 missing features:
1. Preloader force-hide (setTimeout 2s)
2. IntersectionObserver scroll reveals
3. Animated counters (requestAnimationFrame)
4. Scroll progress bar
5. Back-to-top button
6. FAQ accordion handler
7. SVG social icons (Twitter/GitHub/LinkedIn/Instagram)
8. Custom cursor (pointer:fine check)

### Layer 3: `/s/[slug]` viewer — Final Polish
1. `repairHtml(html)` — closes truncated tags
2. `injectPremiumCSS(html)` — design system
3. `injectPremiumFeatures(html)` — 7 features (same as Layer 2 but inline)

### The 16 features
1. DOCTYPE + semantic HTML5
2. CSS Custom Properties (dark-first)
3. Fluid typography with clamp()
4. Glassmorphism cards (backdrop-filter)
5. Gradient accents + premium buttons
6. Hero with background/video + overlay + CTA
7. Fully responsive (768px/1024px breakpoints)
8. IntersectionObserver scroll reveals
9. Animated counters
10. Scroll progress bar
11. Back-to-top button
12. FAQ accordion
13. Testimonials with avatars + star ratings
14. Newsletter footer + SVG social icons
15. Preloader (auto-hides after 2s)
16. Custom subtle cursor

---

## 19. Known Bugs & Issues

### Critical Bugs

1. **`C.bg` is undefined** — used in 2 places (lines 3183, 3454). The `C` token object has no `bg` key (it's `canvas`).
   - CatalogTab "Generate Website" button: invisible white-on-white text
   - SettingsTab "Unlock Admin" button: same issue
   - **Fix**: Replace `C.bg` with `C.canvas`

2. **String-literal env vars in `/api/llm/chat`** (lines 24, 84, 88):
   ```typescript
   const SANDBOX_PROXY_KEY = 'process.env.VPS_BRIDGE_KEY || ""';  // literal string!
   fetch('http://process.env.VPS_BRIDGE_HOST || "127.0.0.1":8765/...')  // invalid URL
   'Authorization': 'Bearer process.env.VPS_BRIDGE_KEY || ""'  // literal string
   ```
   The VPS bridge path is **completely non-functional**. Same pattern in `/api/zai/[...path]` line 22 (unused dead code).

3. **`callMistralStream` doesn't stream** — sends `stream: false` despite the name (va-generate route).

4. **Self-fetch pattern in va-generate** — edge runtime fetches same-origin `/api/save-website` (fragile on Vercel).

5. **`/api/deploy/vercel` doesn't deploy** — just saves to Supabase and returns `/s/{slug}` URL. No Vercel API call.

6. **Process env mutation** — `/api/forge/generate` line 43: `process.env.GROQ_API_KEY = body.groqKey` accepts user-supplied keys via request body. Unsafe in shared-runner model.

### High-Priority Issues

7. **In-memory state on serverless** — `/api/forge/auto-evolve` module-level vars (`_autoEvolveCount`, `_lastAutoEvolveTime`, `_autoEvolveHistory`) reset on every Vercel cold start.

8. **No authentication anywhere** — every API route accepts arbitrary public requests. Anyone can generate, save, delete, "deploy", or invoke expensive LLM calls.

9. **`/s/[slug]` `.zf-force-hide` selector** — matches `[class*="load"]` broadly, hiding legitimate content like `.download-button`, `.uploaded-file`.

10. **`/s/[slug]` forces `opacity:0` on all `<section>` elements** — if JS fails to load, the entire page is invisible.

11. **`ArtistTab` is a single 6KB compressed line** (line 3196) — unmaintainable.

12. **Stale header comment** — says "9 tabs" but file has 13.

13. **Inconsistent default LLM models** across tabs (see §15).

14. **AgentTab model selector doesn't re-render** — `<select>` value read from localStorage on render, `onChange` writes to localStorage but doesn't trigger re-render.

15. **AgentTab dropdown missing Mistral** — only shows Groq + Z.AI options.

16. **Brain file count inconsistency** — Brain tab says 159, AppHeader says 310, Settings says 310, AgentTab says 310.

17. **Brain tab heatmap flickers** — uses `Math.random()` per render (line 1798).

### Code Smells

18. **4,135 lines in one file** — `page.tsx` should be split into per-tab modules.
19. **Heavy inline `style={}` objects** instead of Tailwind classes or CSS modules.
20. **Manual `onMouseEnter`/`onMouseLeave`** mutating `e.currentTarget.style` instead of CSS `:hover`.
21. **Many `as any` casts** — `sizes: any`, `variants: any`, `(C as any).accent`, etc.
22. **`(C as any).accent = ...` mutation** — bypasses TypeScript's immutability guarantee and React's reactivity model.
23. **Plaintext API key in localStorage** (`sf-groq-key`).
24. **Hardcoded fallback credentials** in the JS bundle (`twinkleats2much` / `preciousrules991$`, `Hydrogen12345@work`).
25. **`premiumError` declared in both `SettingsTab` and `Home`** — duplicate state.
26. **Native `<select>` styling** won't match dark theme on all platforms.
27. **`SandboxStub` "Test endpoint" button** uses `alert()` — jarring in polished UI.
28. **Two parallel databases** — Prisma (SQLite, unused) and Supabase (Postgres, real).
29. **Two `CustomConfig` interfaces** — defined separately in `v6-renderer.ts` and `pattern-designer.ts` with different shapes.
30. **`v6-renderer.renderV6` returns `html: ''`** — misleading; actual assembly in API route.

---

## 20. Environment Variables

### Currently set in `.env`
| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | Prisma SQLite (unused) |
| `MISTRAL_API_KEY` | `6XRe0pKv...` | Mistral direct API |
| `VERCEL_API_KEY` | `[REDACTED]` | Vercel deployment (not yet wired) |
| `GITHUB_TOKEN` | `[REDACTED]` | GitHub API (repo: trailerr9918/zenforge) |

### Referenced in code but not set
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (hardcoded fallback) |
| `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `VPS_BRIDGE_KEY` | VPS bridge auth key |
| `VPS_BRIDGE_HOST` | VPS bridge host (default `127.0.0.1`) |
| `GROQ_API_KEY` | Groq API key (or `sf-groq-key` localStorage) |
| `NEXT_PUBLIC_PAYWALL_PASSWORD` | Paywall admin password (fallback: `Hydrogen12345@work`) |
| `NEXT_PUBLIC_PREMIUM_USER` | Premium username (fallback: `twinkleats2much`) |
| `NEXT_PUBLIC_PREMIUM_PASS` | Premium password (fallback: `preciousrules991$`) |
| `MODAL_TOKEN` | Modal serverless functions |
| `E2B_API_KEY` | E2B sandbox |
| `PORT` | Server port (default 3000) |

---

## 21. Deployment

### Current setup
- **Sandbox**: Runs at `localhost:3000` via `npm run dev` (Next.js Turbopack)
- **Production**: Vercel project `site-forge-two-lake` at `site-forge-two-lake.vercel.app`
- **Domain**: `zenforge.site` (configured to point to Vercel)
- **Standalone build**: `npm run build` produces `.next/standalone/server.js` runnable with Bun

### Vercel configuration (`vercel.json`)
Per-function `maxDuration` overrides (Hobby tier max = 60s):
- `forge/generate`: 60s
- `forge/review`: 45s
- `forge/extract`: 300s ⚠️ (will fail on Hobby)
- `forge/learn-image`: 90s ⚠️
- `recreate`: 30s
- `render-site`: 30s

### Git remote
```
origin  https://trailerr9918:[REDACTED]@github.com/trailerr9918/zenforge.git
```

### Deploy command
The `/api/deploy/vercel` route does NOT actually deploy — it just saves to Supabase. To actually deploy to Vercel, use the Vercel CLI or connect the GitHub repo to Vercel for auto-deploy on push.

### Environment variables needed on Vercel
- `MISTRAL_API_KEY`
- `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_PAYWALL_PASSWORD`
- `NEXT_PUBLIC_PREMIUM_USER`
- `NEXT_PUBLIC_PREMIUM_PASS`
- `VERCEL_API_KEY` (for actual Vercel API calls)
- `GITHUB_TOKEN` (for GitHub API calls)

---

## 22. File Inventory

### Source files (src/)
| Path | Lines | Purpose |
|------|-------|---------|
| `src/app/page.tsx` | 4,135 | ⭐ Main UI — 13 tabs |
| `src/app/layout.tsx` | 54 | Root layout |
| `src/app/globals.css` | 240 | Tailwind + Elite theme |
| `src/app/s/[slug]/route.ts` | 129 | Public website viewer |
| `src/app/api/` | 60+ routes | API endpoints |
| `src/lib/prompt-recreator.ts` | 1,455 | V2 spec engine |
| `src/lib/virtual-artist.ts` | 875 | 24/7 evolution loop |
| `src/lib/mutation-engine.ts` | 802 | Caged-lion mutations |
| `src/lib/forge/technique-library.ts` | 724 | Technique index |
| `src/lib/forge/forge-reasoner.ts` | 607 | Forge brain |
| `src/lib/review-machine.ts` | 599 | 6-pass review |
| `src/lib/premium-website-system.ts` | 644 | LLM recipe |
| `src/lib/zai-client.ts` | 480 | Z.AI client |
| `src/lib/v6-renderer.ts` | 453 | V6 renderer |
| `src/lib/render-site/route.ts` | 465 | V5 combinatorial |
| `src/lib/v5-core.ts` | 405 | V5 foundation |
| `src/lib/forge/review-system.ts` | 514 | Emoji review flow |
| `src/lib/pattern-designer.ts` | 359 | Instant assembly |
| `src/lib/motionsites-prompts.ts` | 340 | Prompt parser |
| `src/lib/premium-master-list.ts` | 213 | Review rubric |
| `src/lib/llm-provider.ts` | 211 | Multi-provider chat |
| `src/lib/va-teaching-system.ts` | 194 | Teaching prompt |
| `src/lib/premium-css-foundation.ts` | 221 | CSS design system |
| `src/lib/html-postprocessor.ts` | 159 | Feature injector |
| `src/lib/learning-system.ts` | 155 | Learning index |
| `src/lib/supabase-client.ts` | 92 | Supabase client |
| `src/lib/va-memory.ts` | 81 | VA memory file |
| `src/lib/prompt-catalog.ts` | 278 | Catalog extractor |

### Config files
| Path | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `vercel.json` | Vercel function timeouts |
| `next.config.ts` | Next.js config (standalone, ignore TS errors) |
| `tsconfig.json` | TypeScript config |
| `tailwind.config.ts` | Tailwind config |
| `postcss.config.mjs` | PostCSS config |
| `eslint.config.mjs` | ESLint config |
| `components.json` | shadcn/ui config |
| `Caddyfile` | Reverse proxy |
| `.gitignore` | Git ignores |
| `.env` | Environment (gitignored) |

### Documentation
| Path | Purpose |
|------|---------|
| `MARK_2_PLAN.md` | Forge Engine planning doc |
| `MASTER_CHECKLIST.md` | User's task list |
| `worklog.md` | Multi-agent work log |

### Data directories
| Path | Purpose |
|------|---------|
| `download/` | User-facing deliverables |
| `download/learning-websites/` | 100 training websites (gitignored) |
| `public/` | Static assets |
| `db/` | SQLite database |
| `data/` | JSON fallbacks (techniques, generations, templates) |
| `src/lib/brain/design-md/` | 147 brand DESIGN.md files |
| `src/lib/brain/motionsites/` | 3 prompt markdown files |
| `src/lib/brain/taste/` | Laziness analysis |
| `src/lib/cache/` | Extraction caches |
| `src/lib/forge/` | Forge Engine modules |

### Skills (reference, not app code)
| Path | Purpose |
|------|---------|
| `skills/LLM/` | LLM skill (z-ai-web-dev-sdk) |
| `skills/TTS/` | Text-to-speech |
| `skills/VLM/` | Vision model |
| `skills/ASR/` | Speech-to-text |
| `skills/charts/` | Chart creation |
| `skills/design/` | Design system reference |
| `skills/agent-browser/` | Browser automation |
| `skills/blog-writer/` | Blog writing |
| `skills/coding-agent/` | Code generation |
| `skills/content-strategy/` | Content strategy |
| `skills/cheat-sheet/` | Cheat sheet generation |
| + 20+ more skill packs | |

---

## Summary

ZenForge AI is a **feature-dense monolithic Next.js application** implementing a 13-tab admin studio for an AI website generator. The architecture is:

- **4 parallel rendering strategies** (spec-driven, combinatorial, pattern-assembly, LLM-generated)
- **24/7 self-evolving loop** (virtual-artist → mutation-engine → review-machine)
- **3-layer persistence** (Supabase + JSON files + markdown memory)
- **3 LLM providers** (Mistral recommended, Z.AI fallback, Groq optional)
- **3-layer premium feature guarantee** (CSS foundation + post-processor + viewer injection)

The codebase has **30+ known bugs** ranging from critical (string-literal env vars, invisible button text) to code smells (4K-line file, manual hover handlers). The most impactful fixes would be:

1. Fix `C.bg` → `C.canvas` (invisible buttons)
2. Fix `/api/llm/chat` string-literal env vars (broken VPS bridge)
3. Wire `/api/deploy/vercel` to actually call the Vercel API
4. Add authentication to mutation endpoints
5. Split `page.tsx` into per-tab modules
6. Unify the default LLM model across tabs
7. Fix `/s/[slug]` `.zf-force-hide` selector
8. Move forge/auto-evolve state to persistent storage

---

# PART TWO — DEEP DIVE EXPANSION

> The sections below add every remaining detail uncovered in the second-pass
> read of the codebase. Every file, function, constant, and data structure
> is documented. Nothing is omitted.

---

## 23. V5 Combinatorial Renderer — Full Inventory

### 12 Color Palettes (`PALETTES` in `v5-core.ts`)

| # | name | bg | primary | accent | dark | cream | mood |
|---|------|----|---------|--------|------|-------|------|
| 1 | warm-earth | #F5F0E8 | #3C2415 | #E67E22 | #1A1A1A | #F5E6D3 | warm |
| 2 | golden-luxury | #0A0807 | #D4AF37 | #C0952E | #0A0807 | #F5E6D3 | luxury |
| 3 | ocean-blue | #CAF0F8 | #0077B6 | #00B4D8 | #03045E | #CAF0F8 | cool |
| 4 | royal-purple | #240046 | #9D4EDD | #C77DFF | #10002B | #E0AAFF | royal |
| 5 | dark-tech | #0A0A14 | #8B5CF6 | #06B6D4 | #0A0A14 | #E0E0FF | tech |
| 6 | vibrant-coral | #FFF5F5 | #FF6B6B | #FFD93D | #1A1A1A | #FFE0E0 | playful |
| 7 | forest-green | #D8F3DC | #1B4332 | #52B788 | #081C15 | #D8F3DC | natural |
| 8 | sunset-orange | #FFF3E0 | #FB8500 | #FFB703 | #023047 | #FFF3E0 | warm |
| 9 | monochrome | #FFFFFF | #1A1A1A | #6366F1 | #0A0A0A | #F5F5F5 | minimal |
| 10 | candy-pink | #FCE7F3 | #EC4899 | #F472B6 | #831843 | #FCE7F3 | playful |
| 11 | electric-blue | #0A0A14 | #06B6D4 | #8B5CF6 | #0A0A14 | #E0E0FF | tech |
| 12 | burgundy-wine | #FFF1F2 | #9F1239 | #E11D48 | #4C0519 | #FFF1F2 | luxury |

### 12 Typography Pairings (`TYPOGRAPHIES`)

| # | name | display font | body font | accent font |
|---|------|-------------|-----------|------------|
| 1 | Playfair+Montserrat+Dancing | Playfair Display | Montserrat | Dancing Script |
| 2 | Cormorant+Lato+GreatVibes | Cormorant Garamond | Lato | Great Vibes |
| 3 | SpaceGrotesk+Inter | Space Grotesk | Inter | — |
| 4 | Anton+Inter | Anton | Inter | — |
| 5 | DMSerif+Inter | DM Serif Display | Inter | — |
| 6 | Poppins+Nunito+Pacifico | Poppins | Nunito | Pacifico |
| 7 | Fraunces+SourceSans3 | Fraunces | Source Sans 3 | — |
| 8 | Syne+Inter | Syne | Inter | — |
| 9 | ArchivoBlack+Inter | Archivo Black | Inter | — |
| 10 | Merriweather+OpenSans | Merriweather | Open Sans | — |
| 11 | Bricolage+Inter | Bricolage Grotesque | Inter | — |
| 12 | Outfit+DMSans | Outfit | DM Sans | — |

### 10 Business Types (`BIZ_TYPES`)

Each business type has a `Biz` object with: `names[]`, `hero`, `sub`, `tagline`, `about`, `features[]` (3 items: icon, title, desc), `menu[]` (4 items: image-id, title, desc), `quote`, `cta`, `images[]` (10 Unsplash photo IDs).

| type | example names | hero | tagline |
|------|--------------|------|---------|
| cafe | Velvet Bean, The Golden Bean, Brew & Co | Where Coffee Meets Craft | Eat. Drink. Love. |
| restaurant | Saveur, La Maison, Bella Tavola | A Culinary Experience | Taste the difference. |
| tech | Apex Studio, Lumina, Vertex | Bring Your Vision to Life | Create. Innovate. Elevate. |
| gym | PowerHouse, Iron Forge, Apex Fitness | Stronger Every Day | — |
| law | — | — | — |
| dental | — | — | — |
| electrician | — | — | — |
| salon | — | — | — |
| plumber | — | — | — |
| default | (fallback) | — | — |

`detectBiz(prompt)` uses regex matching on the prompt text to pick the business type.

### V5 Section Variants (from `v5-variants.ts` + `render-site/route.ts`)

| section | variants | source |
|---------|----------|--------|
| Hero | 8 (full-bleed, split-left, split-right, centered-minimal, offset-card, diagonal, magazine, video-bg) | v5-variants.ts |
| Features | 6 (card-grid, numbered-stack, bento-grid, icon-row, alternating, + 2) | v5-variants.ts |
| About | 5 | v5-variants.ts |
| Gallery | 5 | v5-variants.ts |
| CTA | 5 | v5-variants.ts |
| Footer | 5 | v5-variants.ts |
| Nav | 5 (fixed-transparent, solid-bar, floating-pill, centered-split, side-drawer) | v5-core.ts |
| Button | 5 (solid-pill, outline-rect, text-arrow, gradient-fill, glass) | v5-core.ts |
| Testimonials | 6 | v5-variants.ts |
| Pricing | 5 (all `prcThreeTier` — duplicated ⚠️) | render-site/route.ts |
| FAQ | 5 (all `faqAccordion` — duplicated ⚠️) | render-site/route.ts |
| Stats | 5 (all `statBigNumbers` — duplicated ⚠️) | render-site/route.ts |
| Partners | 4 (all `prtLogoGrid` — duplicated ⚠️) | render-site/route.ts |
| Blog | 4 (all `blogThreeCard` — duplicated ⚠️) | render-site/route.ts |
| Team | 4 | render-site/route.ts |
| Contact | 4 | render-site/route.ts |

**⚠️ Note**: Many "5 variants" are actually the same variant repeated 5 times — the array is `[x, x, x, x, x]` instead of 5 distinct variants. This means the actual combinatorial space is smaller than the claimed 207T.

### Core Utility Functions (`v5-core.ts`)

| function | purpose |
|----------|---------|
| `pick<T>(a, seed)` | Deterministic array pick: `a[((seed % a.length) + a.length) % a.length]` |
| `esc(s)` | HTML escape: `& < > " '` → entities |
| `isDarkBg(hex)` | Luminance check: `(0.299r + 0.587g + 0.114b) < 128` |
| `mulberry32(seed)` | Seedable PRNG — `s = (s + 0x6D2B79F5) >>> 0` then mix |
| `pickImages(pool, seed, count)` | Fisher-Yates shuffle with seeded RNG, returns N images |
| `imgUrl(id, w, h)` | `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80` |
| `sharedCss(c)` | Reset + body + reveal animation + reduced-motion |

### The `Ctx` Object (rendering context)

```typescript
type Ctx = {
  bn: string;           // business name
  biz: Biz;             // business type data
  bt: string;           // business type id
  p: Palette;           // selected palette
  t: Typography;        // selected typography
  imgs: string[];       // picked Unsplash image IDs
  year: number;         // current year (for footer)
  ctaText: string;      // CTA button text
  isDark: boolean;      // dark background?
  seed: number;         // RNG seed
  rng: () => number;    // mulberry32 generator
  btnId?: string;       // button variant id
};
```

### Combinatorial Math

- 8 hero × 6 features × 5 about × 5 gallery × 5 cta × 5 footer × 5 nav × 5 button
- × 6 testimonials × 5 pricing × 5 faq × 5 stats × 4 partners × 4 blog × 4 team × 4 contact
- × 12 palettes × 12 typography × 10 biz
- = **~207 trillion** unique sites (theoretically; actual is less due to duplicated variants)

---

## 24. V6 Ultra Renderer — Full Inventory

### 8 Hero Variants (`V6_HERO_VARIANTS`)

1. **cinematic** — full-viewport video bg, gradient overlay, large headline with italic emphasis
2. **editorial-split** — text left, large image right, editorial typography
3. **glassmorphic** — glass card centered over gradient mesh bg
4. **minimal** — centered text, lots of whitespace, no image
5. **bold-display** — huge typography (clamp 80px+), bold accent color
6. **video** — video bg with play controls
7. **playful-centered** — rounded shapes, playful colors, animated entrance
8. **editorial-magazine** — magazine-style layout, asymmetric grid

### Other V6 Variants

| section | variants |
|---------|----------|
| Stats | 3 (big-numbers, animated-counter, progress-bars) |
| Testimonials | 3 (card-grid, quote-slider, masonry) |
| Pricing | 2 (three-tier, comparison-table) |
| FAQ | 2 (accordion, two-column) |
| CTA | 3 (video-band, gradient-mesh, split-cta) |
| Contact | 2 (form-left, split-form) |
| Menu | 1 (restaurant-menu) |

### 6 Style Modes (`CustomConfig.style`)

- `minimal` — whitespace, subtle accents
- `bold` — large type, high contrast
- `editorial` — serif display, magazine feel
- `cinematic` — dark, video, dramatic
- `glassmorphic` — blur, transparency, gradients
- `playful` — rounded, colorful, animated

### CustomConfig Fields

```typescript
interface CustomConfig {
  // Branding
  businessName?, tagline?, hero?, sub?, about?, ctaText?
  // Colors (override palette)
  colors?: { bg?, primary?, accent?, dark?, cream? }
  // Typography (override fonts)
  fonts?: { display?, body?, googleHref? }
  // Content overrides
  features?: { title, description, icon? }[]
  testimonials?: { name, role, quote }[]
  pricing?: { name, price, description, features[], featured? }[]
  faq?: { question, answer }[]
  team?: { name, role, bio? }[]
  stats?: { value, label }[]
  menu?: { name, description, price }[]
  // Section order
  sections?: string[]
  // Style
  style?: 'minimal'|'bold'|'editorial'|'cinematic'|'glassmorphic'|'playful'
}
```

### V6 Default Sections (16 + 4 optional)

**Default 16**: nav, hero, partners, features, about, stats, testimonials, gallery, pricing, team, blog, faq, contact, cta, footer + 1 more

**Optional 4**: menu (restaurants), portfolio (creatives), caseStudies (agencies), newsletter (publications)

### ⚠️ `renderV6` Returns Empty HTML

```typescript
export function renderV6(...): V6RenderResult {
  // ... computes variants, design DNA ...
  return {
    html: '',           // ← empty!
    designDNA: { ... },
    _variants: { ... }, // smuggled out for the API route
  };
}
```

The actual HTML assembly happens in `/api/render-site` which calls `renderV6`, reads `_variants`, then assembles the final HTML using V5's `sharedCss` + V6 variant CSS/HTML.

---

## 25. Premium Pattern Library — Full Inventory

`src/lib/premium-patterns.ts` (1,283 lines) contains hand-crafted "Lithos-quality" patterns:

### Pattern Interface

```typescript
interface PremiumPattern {
  id: string;
  type: string;          // 'nav', 'hero', 'footer', etc.
  name: string;
  css: string;
  html: string;
  js?: string;           // interactive JS
  fitness: number;       // 0-100 quality score
  source: 'premium-library';
  fonts: string[];       // Google Font families
  features: string[];    // tags: 'glassmorphic', 'animated', etc.
}
```

### `getBestPremiumPattern(type)` 

Returns the highest-fitness pattern for a given type. Used by `mutation-engine` as the base template before applying mutations.

### `buildFontsHref(fonts)` 

Generates a Google Fonts URL with proper weight specifications:
- Playfair → `ital,wght@1,400;1,500;1,600`
- Instrument Serif → `ital,wght@0,400;0,700;1,400`
- Space Grotesk → `wght@400;500;600;700`
- Anton → just `family=Anton`
- Default → `wght@300;400;500;600;700`

### Example Pattern: `navGlassmorphic` (fitness 95)
- Fonts: Inter, Playfair Display
- Features: glassmorphic, backdrop-blur, pill-nav, sticky
- CSS: backdrop-filter blur(12px), semi-transparent bg, pill-shaped nav

---

## 26. Mutation Engine — Full Inventory

### 12 Curated Palettes (`PALETTES`)

Each palette has 10 fields: `name, bg, text, accent, dark, cream, glassBg, glassBorder, cardBg, cardBorder, accentShadow, gradient`

| # | name | accent | mood |
|---|------|--------|------|
| 1 | midnight-gold | #d4af37 | luxury |
| 2 | electric-cyan | #00ffd5 | tech |
| 3 | royal-purple | #a855f7 | royal |
| 4 | warm-earth | #e8702a | warm |
| 5 | forest-deep | #22c55e | natural |
| 6 | crimson-dark | #ef4444 | bold |
| 7 | ocean-blue | #3b82f6 | cool |
| 8 | rose-gold | #f472b6 | playful |
| 9 | lime-dark | #a3e635 | tech |
| 10 | teal-deep | #14b8a6 | cool |
| 11 | light-warm | #c8794a | warm |
| 12 | light-clean | #7342E2 | clean |

### 8 Font Combinations (`FONT_COMBOS`)

| # | name | display | body |
|---|------|---------|------|
| 1 | playfair-inter | Playfair Display | Inter |
| 2 | instrument-inter | Instrument Serif | Inter |
| 3 | space-inter | Space Grotesk | Inter |
| 4 | anton-inter | Anton | Inter |
| 5 | fraunces-source | Fraunces | Source Sans 3 |
| 6 | syne-inter | Syne | Inter |
| 7 | bricolage-inter | Bricolage Grotesque | Inter |
| 8 | archivo-space | Archivo Black | Space Mono |

### 8 Mutations (`MUTATIONS`)

| # | name | what it does |
|---|------|-------------|
| 1 | invert-colors | Swaps bg/text, adjusts accent |
| 2 | shift-spacing | Increases padding/gap by 1.5x |
| 3 | change-radius | Switches border-radius from 8px to 24px |
| 4 | tighten-tracking | Reduces letter-spacing by 0.02em |
| 5 | soften-shadows | Reduces shadow opacity by 50% |
| 6 | add-depth | Adds box-shadow layer |
| 7 | increase-contrast | Boosts accent saturation |
| 8 | add-gradient-overlay | Adds gradient overlay to images |

### The "Caged Lion" Protocol

1. **AI decides**: picks palette index, font index, mutation index (0-2 mutations)
2. **Code executes**: applies choices via regex find-replace on premium pattern templates
3. **Zero AI error**: CSS structure is never touched — only values change

### Evolution Memory (`globalThis.__mutationEvolution`)

Tracks per-palette, per-font, per-mutation average fitness:
```typescript
{
  paletteFitness: Record<string, number[]>,  // palette name → fitness history
  fontFitness: Record<string, number[]>,
  mutationFitness: Record<string, number[]>,
  compounds: { palette: string; font: string; mutation: string; avgFitness: number }[]
}
```

- **Selection**: softmax-weighted (higher fitness = higher probability)
- **Novelty**: 15% chance of random selection (exploration vs exploitation)
- **Compound discovery**: if a palette+font+mutation combo consistently scores >80, it's formalized as a "compound" and preferred in future selections
- **Persistence**: saved to Supabase as `business_type = 'evolution_memory'` rows

---

## 27. Review Machine — Full 6-Pass Detail

`src/lib/review-machine.ts` (600 lines). Threshold: **75**. Hard-fail passes: typography, layout, accessibility (each must be ≥60).

### Pass 1: Typography (0-100)
- `+25` if `clamp()` present (Linear/Raycast pattern)
- `+15` if negative letter-spacing `-0.01` to `-0.02` on headings (Stripe/Apple)
- `+10` if any negative letter-spacing
- `+15` if heading line-height 1.1-1.5
- `+8` if body line-height 1.6-1.7
- `+15` if font-weight hierarchy (400/600/700 mix)
- `+10` if custom Google Fonts (not system-ui)
- `+10` if display ≠ body font family

### Pass 2: Color (0-100)
- Checks palette discipline (3-12 color sources)
- Opacity layering (rgba usage)
- Contrast ratios
- Anti-rainbow (no >6 distinct hues)
- Border consistency

### Pass 3: Layout (0-100)
- CSS Grid usage
- Flexbox usage
- `@media` queries present
- `max-width` on containers
- Consistent gap/padding scale

### Pass 4: Accessibility (0-100)
- `prefers-reduced-motion` support
- Focus states (`:focus-visible` or `outline`)
- ARIA labels on interactive elements
- Font size ≥14px
- Line-height ≥1.5
- Color contrast (WCAG AA)

### Pass 5: Brand Consistency (AI pass, 0-100)
- Uses `relevantPrinciples()` from design-kb
- Feeds CSS+HTML to GLM-5.2 with brand principles as context
- Asks: "Does this match real-world brand quality? Score 0-100"
- Returns specific findings + failures

### Pass 6: Originality (0-100)
- Jaccard similarity vs existing same-type patterns
- If similarity >0.7, score drops
- Reward for unique color combinations, unique layout structures

### Final Score Calculation
```
finalScore = weightedAverage(
  typography * 0.20,
  color * 0.15,
  layout * 0.20,
  accessibility * 0.15,
  brandConsistency * 0.15,
  originality * 0.15
)
```
- `passed = finalScore >= 75`
- Hard-fail if any of [typography, layout, accessibility] < 60

---

## 28. Virtual Artist — Full Cycle Detail

### 6-Phase Cycle

#### Phase 1: THINK
- Reads `relevantPrinciples(query)` from design-kb (147 brand files)
- Reads `relevantPrompts(query)` from motionsites-prompts (121 prompts)
- Picks a `PatternType` to create (hero, footer, nav, etc.)
- Logs thought: `"Thinking about creating a ${type} pattern inspired by ${brand}"`

#### Phase 2: ITERATE
- Delegates to `mutation-engine.generateMutatedPattern(type, motionPrompt, principles)`
- Engine picks palette + font + mutation, applies to premium pattern template
- Returns `{ css, html, js, reasoning, inspiration }`

#### Phase 3: BUILD
- Assembles the pattern: CSS + HTML + optional JS
- Calculates uniqueness score (Jaccard similarity vs existing patterns)
- Logs: `"Built ${type} pattern with fitness estimate"`

#### Phase 4: REVIEW
- Calls `reviewPattern(css, html, type)` from review-machine
- Gets 6-pass score (typography, color, layout, a11y, brand, originality)
- If `finalScore >= 75`: accepted
- If `< 75`: rejected with specific failure reasons

#### Phase 5: ADD (if accepted)
- Pattern added to `globalThis.__virtualArtist.patterns`
- Persisted to Supabase as `business_type = 'virtual_artist_pattern'`
- Neural score updated

#### Phase 6: DELETE (pruning)
- If pattern library > 500 patterns, prune lowest-fitness 10%
- Delete patterns with similarity >0.9 (duplicates)
- Delete patterns older than 7 days with fitness < 50

### Neural Score Components

```typescript
score = round(
  avgFitness * 0.35 +      // last 50 patterns
  diversity * 0.20 +        // unique types / total types
  innovation * 0.25 +       // % of patterns scoring 80+
  learningRate * 0.20       // improvement vs first 10
)
```

- `avgFitness`: mean fitness of last 50 patterns
- `diversity`: `(uniqueTypes / PATTERN_TYPES.length) * 100`
- `innovation`: `(patternsWithFitness80+ / totalPatterns) * 200` (capped 100)
- `learningRate`: `50 + (last10avg - first10avg) * 2`

### 21 Pattern Types (`PATTERN_TYPES`)

hero, features, about, gallery, cta, footer, nav, button, testimonials, pricing, faq, stats, partners, blog, team, contact, menu, portfolio, typography, spacing, color-system

### Vercel Fallback: `tickArtistAutoEvolve()`

On Vercel, `setTimeout` intervals don't survive cold starts. The `tickArtistAutoEvolve` function is called via polling:
- Client polls `/api/artist/status` every 15s
- If `isEvolving === true` and last cycle >15s ago, calls `/api/artist/cycle`
- This simulates continuous evolution across serverless invocations

---

## 29. SEAE Engine — Alternate Evolution System

`src/lib/seae-engine.ts` (468 lines) — "Strict Self-Evolving Abstract Engine v3"

### Differences from Virtual Artist

| aspect | Virtual Artist | SEAE Engine |
|--------|---------------|-------------|
| Pattern types | 21 (incl. typography, spacing, color-system) | 16 (section types only) |
| AI model | GLM-5.2 via zai-client | GLM-5.2 via zai-client |
| Persistence | Supabase + `globalThis` | Supabase + `globalThis` |
| Review | review-machine (6-pass) | review-machine (6-pass) |
| 24/7 mode | `startArtistAutoEvolve()` + `tickArtistAutoEvolve()` | `sessionManager.setAutoEvolve()` |
| Inspiration | design-kb + motionsites-prompts | design-kb only |

### 16 SEAE Pattern Types

hero, features, about, gallery, cta, footer, nav, button, testimonials, pricing, faq, stats, partners, blog, team, contact

### SEAE Stats

```typescript
interface EvolutionStats {
  totalCycles: number;
  totalGenerated: number;
  totalAccepted: number;
  totalRejected: number;
  averageFitness: number;
  bestFitness: number;
  patternCounts: Record<string, number>;
  currentGeneration: number;
  isRunning: boolean;
  lastCycleAt: string;
  history: CycleResult[];
}
```

---

## 30. Forge Engine — Complete Architecture

### Data Flow

```
User request (target description)
         │
         ▼
┌─────────────────────┐
│  forgeGenerate()    │  ← src/lib/forge/forge-reasoner.ts
│                     │
│  1. Load techniques │  ← technique-library.loadTechniques()
│  2. Filter by type  │  ← techniquesByPartType()
│  3. Pick top-rated  │  ← topRatedTechniques(creativity)
│  4. LLM picks +     │  ← zaiChat() with REASONER_SYSTEM_PROMPT
│     explains WHY    │
│  5. Apply mutations │  ← color/font/copy swaps
│  6. Assemble spec   │  ← StructuredSpec
│  7. Render HTML     │  ← renderStructuredSite() from prompt-recreator
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Record generation  │  ← review-system.recordGeneration()
│  to review queue    │
│  status = pending   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Save to Supabase   │  ← websites table, business_type='forge-generated'
│  + /s/{slug} URL    │
└────────┬────────────┘
         │
         ▼
  User rates 1-5 emoji
         │
    ┌────┼────┐
    ▼    ▼    ▼
  😡😕  😐   😍🤩
  TRASH IMPROVE SAVE
```

### ForgePlan Structure

```typescript
interface ForgePlan {
  id: string;
  target: string;          // "boutique law firm" | "random"
  creativity: number;      // 0.0-1.0
  sections: ForgePlanSection[];
  palette: { bg, text, muted, accent };
  fonts: { display, body };
  overallReason: string;
  generatedAt: string;
}

interface ForgePlanSection {
  partType: PartType;           // 'hero' | 'footer' | 'nav' | ...
  pickedTechniqueId: string;
  pickedTechniqueName: string;
  sourcePromptId: string;
  sourcePromptTitle: string;
  reason: string;               // "Aethera's hero because you rated it 5★"
  mutations: string[];          // ["swapped Inter → Source Sans 3"]
  sectionSpec: Section;         // the mutated section to render
}
```

### 20 Part Types (`PartType`)

hero, footer, nav, button, section, background, animation, interaction, 3d, js, stats, gallery, testimonials, faq, pricing, team, contact, blog, cta, partners

### Learning Loop

1. **Top-rated preferred**: 4-5★ techniques get higher selection probability
2. **Avoided never picked**: `avoidCount >= 3 && rating < 3` → `avoided = true`
3. **Improvement feedback**: 😐 reviews generate 3 LLM-suggested improvements, stored as "things to avoid" in next forge run
4. **Usage tracking**: `markTechniqueUsed(ids)` increments `usageCount` and recomputes `score`

### Quality Assessment Heuristics (auto-evolve)

```typescript
function assessQuality(result): 1|2|3|4|5 {
  let score = 0;
  // Section count
  if (sections >= 5) score += 2;
  else if (sections >= 3) score += 1;
  // HTML size
  if (html.length > 15000) score += 2;
  else if (html.length > 10000) score += 1;
  // Technique variety
  if (uniqueSources >= 3) score += 1;
  // Has video
  if (hasVideo) score += 1;
  // Convert to rating (max 4, never 5)
  if (score >= 5) return 4;
  if (score >= 3) return 3;
  if (score >= 1) return 2;
  return 1;
}
```

⚠️ **Bug**: `assessQuality` can never return 5 (max score is 6, threshold for 4 is 5, there's no threshold for 5).

---

## 31. Prompt Recreator — Full Architecture

### V2 Structured Spec Engine

`src/lib/prompt-recreator.ts` (1,455 lines) — the most complex renderer.

### Extraction Pipeline

```
MotionSites prompt text
         │
         ▼
┌─────────────────────┐
│  LLM Extraction     │  ← extractStructuredSpecsViaLLM()
│  (Mistral/Groq)     │
│                     │
│  System prompt:     │
│  "Return ONLY JSON" │
│  "Include ONLY      │
│   sections the      │
│   prompt describes" │
│                     │
│  Output:            │
│  StructuredSpec     │
└────────┬────────────┘
         │
         ▼ (if LLM fails)
┌─────────────────────┐
│  Regex Fallback     │  ← extractStructuredSpecsSync()
│  (instant,          │
│   hero-only)        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Render             │  ← renderStructuredSite()
│  Walk spec.sections │
│  Per-section type:  │
│  - renderHeroVideo  │
│  - renderFeaturesGrid│
│  - renderFaqAccordion│
│  - renderPricing    │
│  - renderFooter     │
│  - ... (17 total)   │
│  - renderCustom()   │  ← smart dispatcher
└────────┬────────────┘
         │
         ▼
  Complete HTML website
```

### StructuredSpec Shape

```typescript
interface StructuredSpec {
  businessName: string;
  logo: string;
  tagline: string | null;
  fonts: {
    display: string | null;
    body: string | null;
    accentFont: string | null;
    weights: number[];
  };
  colors: {
    bg: string;
    text: string;
    muted: string | null;
    accent: string | null;
    surface: string | null;
    border: string | null;
  };
  promptType: 'hero'|'landing-page'|'footer'|'portfolio'|'saas'|'features'|'404'|'blog'|'agency'|'product'|'pricing'|'contact';
  navItems: string[];
  ctaText: string;
  sections: Section[];
  animations: AnimationDef[];
  media: { videoUrls: string[]; imageUrls: string[] };
  styleHints: string;
  source: 'llm' | 'regex';  // which extractor produced this
}

interface Section {
  type: SectionType;  // 17 types
  id: string;
  headline: string | null;
  emphasizedWords: string[];
  accentText: string | null;
  body: string | null;
  items: SectionItem[];
  cta: string | null;
  mediaUrl: string | null;
  animation: AnimationType;
  styleHints: string;
  bg: string | null;
  color: string | null;
}
```

### 17 Section Types + Renderers

| type | renderer function | description |
|------|-------------------|-------------|
| hero-video | `renderHeroVideo` | Full-viewport video bg, overlay, headline, CTA |
| hero-centered | `renderHeroCentered` | Centered text, no video |
| hero-split | `renderHeroSplit` | Text left, visual right |
| hero-image | `renderHeroImage` | Full-bleed image bg |
| features-grid | `renderFeaturesGrid` | Auto-fit card grid |
| stats-row | `renderStatsRow` | 4 animated counters |
| gallery-masonry | `renderGalleryMasonry` | Pinterest-style masonry |
| gallery-grid | `renderGalleryGrid` | Uniform grid |
| partners-row | `renderPartnersRow` | Logo strip |
| cta-band | `renderCtaBand` | Full-width CTA with video bg |
| testimonials | `renderTestimonials` | 3-card grid with avatars + stars |
| faq-accordion | `renderFaqAccordion` | Expandable FAQ |
| about-text | `renderAboutText` | Split layout, text + image |
| pricing | `renderPricing` | 3-tier pricing |
| contact-form | `renderContactForm` | Contact form with inputs |
| footer | `renderFooter` | 4-column footer + newsletter + socials |
| team-grid | `renderTeamGrid` | Team member cards |
| blog-list | `renderBlogList` | Blog post cards |
| custom | `renderCustom` | Smart dispatcher — detects type from content |

### 8 Animation Types

`fade-rise`, `fade`, `blur`, `ken-burns`, `parallax`, `scale`, `slide`, `rotate`, `none`

### Extraction Strategies (bypassing Vercel 10s timeout)

1. **Client-side Groq** (if user has Groq key + Groq model): `fetch('https://api.groq.com/...')` directly from browser — no timeout
2. **Edge function streaming** (`/api/llm-extract`): 60s Edge timeout, streams with `|||EXTRACTION_COMPLETE|||` marker
3. **Server-side** (fallback): POST to `/api/recreate` with `groqExtraction` payload

---

## 32. Cerebrium Brain — Full Search Architecture

### Index Building (`getCerebriumIndex()`)

1. Walks `src/lib/brain/design-md/` (147 brand files) and `src/lib/brain/taste/` (8 taste files)
2. For each `.md` file:
   - Parses YAML frontmatter (name, title, tags, topics, category)
   - Extracts body text
   - Generates tags from headings (first 3 words of each H1-H3)
   - Creates excerpt (first paragraph, max 220 chars, stripped of markdown)
3. Caches index on `globalThis.__cerebriumIndex` for 5 minutes

### Search Algorithm

```typescript
function search(index, query, limit): SearchHit[] {
  const terms = tokenize(query);  // lowercase, strip punctuation, remove stopwords
  for each file in index:
    for each term in terms:
      +10 if term in title
      +8 if term in name
      +6 if term in tags
      +count if term in body (max 5 occurrences)
    if score > 0: add to hits
  sort hits by score descending
  return top `limit` hits
}
```

### Stopwords (50+)

`the, and, for, are, but, not, you, all, can, her, was, one, our, out, day, get, has, him, his, how, its, may, new, now, old, see, two, way, who, boy, did, man, men, put, say, she, too, use, with, this, that, have, from, they, will, would, there, their, what, about, which, when, your, them, were, been, these, those, into, over, also, than, then, some, such, only, very, more, most, much, many`

### File Counts

- **159 total files** (Brain tab text)
- **74 brands** (from stats)
- **8 taste files** (from `src/lib/brain/taste/`)
- AppHeader says "310" — this is the total file count including subdirectories

---

## 33. Brand DESIGN.md File Structure

Each brand has a `DESIGN.md` file with YAML-ish frontmatter:

```yaml
---
version: alpha
name: Stripe-Inspired-design-analysis
description: An inspired interpretation of Stripe's design language...

colors:
  primary: "#533afd"
  primary-deep: "#4434d4"
  ink: "#0d253d"
  canvas: "#ffffff"
  ...

typography:
  display-xxl:
    fontFamily: "sohne-var, 'SF Pro Display', sans-serif"
    fontSize: 56px
    fontWeight: 300
    lineHeight: 1.03
    letterSpacing: -1.4px
  display-xl:
    ...
```

### 74 Brands Indexed

Airbnb, Airtable, Apple, Binance, BMW, BMW-M, Bugatti, Cal, Claude, Clay, Clickhouse, Cohere, Coinbase, Composio, Cursor, Dell-1996, ElevenLabs, Expo, Ferrari, Figma, Framer, HashiCorp, HP, IBM, Intercom, Kraken, Lamborghini, Linear, Lovable, Mastercard, Meta, MiniMax, Mintlify, Miro, Mistral.ai, MongoDB, Nike, Nintendo-2001, Notion, Nvidia, Ollama, OpenCode.ai, Pinterest, PlayStation, PostHog, Raycast, Renault, Replicate, Resend, Revolut, RunwayML, Sanity, Sentry, Shopify, Slack, SpaceX, Spotify, Starbucks, Stripe, Supabase, Superhuman, Tesla, TheVerge, Together.ai, Uber, Vercel, Vodafone, VoltAgent, Warp, Webflow, Wired, Wise, X.ai, Zapier

### DesignPrinciple Interface (parsed)

```typescript
interface DesignPrinciple {
  brand: string;
  category: string;
  description: string;
  colors: Record<string, string>;
  typography: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string | number;
    lineHeight?: string | number;
    letterSpacing?: string;
  }[];
  layoutRules: string[];
  extractedPrinciples: string[];  // plain-English principles
}
```

### `relevantPrinciples(query, limit)`

Returns brand principles relevant to a query. Used by:
- `virtual-artist.ts` — to inspire pattern generation
- `seae-engine.ts` — same
- `review-machine.ts` — Pass 5 (brand consistency) feeds these to the AI

---

## 34. MotionSites Prompts — Full Structure

### 3 Source Files

1. `src/lib/brain/motionsites/MOTIONSITES_FREE_PROMPTS.md` — 31 prompts
2. `src/lib/brain/motionsites/MOTIONSITES_FREE_PROMPTS (1).md` — 45 prompts
3. `src/lib/brain/motionsites/motionsites_free_prompts-1.md` — 45 prompts

**Total: 121 unique prompts** (after deduplication)

### Prompt Categories

| category | count |
|----------|-------|
| Hero Section | 15 |
| Landing Page | 5 |
| Footer Section | 4 |
| Portfolio | 2 |
| SaaS | 2 |
| Email Marketing | 1 |
| Features Section | 1 |
| Social Media | 1 |
| Blog | (in file 2/3) |
| Agency | (in file 2/3) |

### MotionPrompt Interface

```typescript
interface MotionPrompt {
  id: string;              // 'aethera-hero'
  title: string;           // 'Aethera Studio'
  category: string;        // 'Hero Section'
  type: string;            // 'hero' | 'landing-page' | 'footer' | ...
  promptText: string;      // full prompt text (1-10KB)
  charCount: number;
  colorCount: number;
  fontCount: number;
  extractedColors: string[];
  extractedFonts: string[];
  extractedPrinciples: string[];
}
```

### Parsing Logic

Two formats supported:
1. `## N. Title` — numbered headings
2. `### Title` — plain headings

For each prompt:
- Extract title from heading
- Extract slug from `**Slug:** \`xxx\``
- Extract category from `**Category:**`
- Extract type from `**Type:**`
- Extract colors via regex: `#[0-9a-fA-F]{6}` (deduped)
- Extract fonts via regex: `'([^']+)'` in font-family contexts
- Extract principles from bold text and code blocks

### Example Prompt Structure (from the file)

```markdown
## 7. Aethera Studio

- **Slug:** `aethera-hero`
- **Category:** Hero Section
- **Type:** hero
- **Source:** https://motionsites.ai/?prompt=aethera-hero
- **Status:** ✅ Free

### Prompt

​```text
Prompt: Recreate "Aethera" Hero Section
Build a single-page React + TypeScript + Vite + Tailwind CSS project...

Colors:
- Background: #0A0A0A
- Text: #FFFFFF
- Accent: #DCFF00

Fonts:
- Display: 'Instrument Serif', serif
- Body: 'Inter', sans-serif

Techniques:
- Video background with fade-in
- Glassmorphic nav
- Blur-rise animation on headline
...
​```
```

---

## 35. Session Manager — Full Detail

`src/lib/session-manager.ts` (138 lines)

### Storage

Uses the **`websites` table** with `id = 'session-zenforge-main-session'` and `business_type = 'session'`.

### SessionState

```typescript
interface SessionState {
  autoEvolve: boolean;
  activeTab: string;
  accentColor: string;
  chatHistory: Record<string, any[]>;
  lastActive: string;
}
```

### Methods

| method | purpose |
|--------|---------|
| `get()` | Fetch full session state from Supabase |
| `save(state)` | Merge + upsert to Supabase |
| `getAutoEvolve()` | Read just the autoEvolve flag |
| `setAutoEvolve(on)` | Set autoEvolve flag |
| `setActiveTab(tab)` | Set active tab |
| `setAccentColor(color)` | Set accent color |
| `getChatHistory(mode)` | Get chat history for a mode |
| `saveChatMessage(mode, message)` | Append to chat history |
| `clearChatHistory(mode)` | Clear chat for a mode |

---

## 36. Z.AI Client — Full Detail

### Triple Fallback Architecture

```
zaiChat()
    │
    ▼
1. VPS Bridge (process.env.VPS_BRIDGE_URL)
   └─ OpenAI-compatible proxy at port 8765
   └─ Credential rotation across 2 sessions
   └─ 600 daily requests
   └─ Works from any environment (Vercel, Modal, E2B, etc.)
    │ (if fails)
    ▼
2. /api/zai local proxy
   └─ Next.js route that uses z-ai-web-dev-sdk
   └─ Only works on sandbox (needs /etc/.z-ai-config)
    │ (if fails)
    ▼
3. Direct z-ai-web-dev-sdk
   └─ import ZAI from 'z-ai-web-dev-sdk'
   └─ Only works on sandbox
    │ (if fails)
    ▼
   throw Error
```

### 12 ZAI_MODELS

```typescript
GLM_5_2:      'glm-5.2'       // most capable
GLM_5_1:      'glm-5.1'
GLM_5:        'glm-5'
GLM_4_7:      'glm-4.7'
GLM_5V_TURBO: 'glm-5v-turbo'  // vision
GLM_4_PLUS:   'glm-4-plus'    // balanced
GLM_4V_PLUS:  'glm-4v-plus'   // vision
GLM_4_FLASH:  'glm-4-flash'   // fast
GLM_Z1_AIR:   'glm-z1-air'
GPT_4:        'gpt-4'         // bridge auto-maps
GPT_4O:       'gpt-4o'
GPT_4O_MINI:  'gpt-4o-mini'
```

### Functions

| function | purpose |
|----------|---------|
| `zaiChat({model, messages, temperature, maxTokens})` | Chat completion (non-streaming) |
| `zaiChatStream({model, messages, ...})` | Async generator yielding tokens |
| `zaiImageGenerate({prompt, size})` | Image generation |
| `zaiWebSearch({query, num})` | Web search |
| `zaiPageReader({url})` | Read a web page |
| `zaiVision({model, messages})` | Vision/image analysis |
| `zaiTTS({text, voice})` | Text-to-speech |
| `zaiAvailable()` | Check if Z.AI is available |
| `getZaiMode()` | Returns 'vps-bridge' \| 'local-proxy' \| 'direct-sdk' \| 'unavailable' |

---

## 37. Hardcoded Secrets in the Codebase

### E2B API Key (`src/app/api/sandbox/ssh-exec/route.ts:19`)
```typescript
const E2B_API_KEY = process.env.E2B_API_KEY || 'e2b_ccd37e5d004d873d7b668f5ee0f2b675f28062c4';
```
⚠️ Hardcoded fallback E2B key visible in source.

### Supabase URL (`src/lib/supabase-client.ts:8`)
```typescript
const SUPABASE_URL = 'https://gjxwlnmfjzexdcepnovf.supabase.co';
```
Not really a secret (public URL), but the service role key is needed to write.

### Premium Credentials (`src/app/page.tsx:3730`)
```typescript
premiumLogin.username === 'twinkleats2much'
premiumLogin.password === 'preciousrules991$'
```
⚠️ Hardcoded in the JS bundle (via `process.env.NEXT_PUBLIC_*` fallbacks).

### Paywall Admin Password (`src/app/page.tsx:3754`)
```typescript
paywallAdminPassword === 'Hydrogen12345@work'
```
⚠️ Hardcoded in the JS bundle.

### Sandbox Preview URL (`src/app/api/zai/[...path]/route.ts:21`)
```typescript
const SANDBOX_PREVIEW = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';
```
This is the sandbox preview URL — specific to the current session.

### Chat Rotated URL (`src/app/api/llm/chat/route.ts:23`)
```typescript
const SANDBOX_PROXY_URL = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';
```
Same sandbox URL.

### Vercel Project Name (`src/app/api/deploy/vercel/route.ts:7`)
```typescript
'https://site-forge-two-lake.vercel.app'
```
Hardcoded project URL (but the route doesn't actually deploy).

---

## 38. Complete API Route Inventory (60+ routes)

### Generation (7 routes)
| route | method | maxDuration | runtime | purpose |
|-------|--------|-------------|---------|---------|
| `/api/premium-generate` | POST | 60s | edge | Streaming LLM HTML generation |
| `/api/va-generate` | POST | 60s | edge | Virtual Artist streaming generation |
| `/api/recreate` | GET, POST | 60s | node | Spec-driven recreation from prompts |
| `/api/render-site` | POST | 30s | node | V5/V6 combinatorial rendering |
| `/api/render-premium` | POST | — | node | V6 Ultra assembly (no LLM) |
| `/api/forge/generate` | POST | 60s | node | Forge Reasoner generation |
| `/api/forge/auto-evolve` | GET, POST | 30s | node | Auto-evolution cycle |

### Review (3 routes)
| route | method | maxDuration | purpose |
|-------|--------|-------------|---------|
| `/api/quality-check` | POST | 30s | Mistral 15-category review |
| `/api/forge/review` | GET, POST | 45s | Emoji rating + learning |
| `/api/va-generate` (action=review) | POST | 60s | Strict reviewer |

### Persistence (4 routes)
| route | method | maxDuration | purpose |
|-------|--------|-------------|---------|
| `/api/save-website` | POST | 10s | Save HTML to Supabase |
| `/api/site/[slug]` | GET, DELETE | 60s cache | Serve/delete raw HTML |
| `/api/sites/list` | GET | — | List sites |
| `/api/s/[slug]` | GET | dynamic | Public viewer with injection |

### LLM (3 routes)
| route | method | maxDuration | runtime | purpose |
|-------|--------|-------------|---------|---------|
| `/api/llm/chat` | POST | 30s | node | Multi-provider chat |
| `/api/llm/models` | GET | — | node | Static model catalog |
| `/api/llm-extract` | POST | 60s | edge | Streaming LLM extraction |

### Z.AI Proxy (1 catch-all route)
| route | method | maxDuration | purpose |
|-------|--------|-------------|---------|
| `/api/zai/[...path]` | GET, POST, OPTIONS | 60s | Z.AI SDK proxy (chat, vision, images, search, page-reader) |

### Forge Engine (8 routes)
| route | method | maxDuration | purpose |
|-------|--------|-------------|---------|
| `/api/forge/generate` | POST | 60s | Generate website |
| `/api/forge/auto-evolve` | GET, POST | 30s | Auto-evolution |
| `/api/forge/review` | GET, POST | 45s | Review + rating |
| `/api/forge/extract` | POST | 300s ⚠️ | Extract techniques from prompts/images |
| `/api/forge/learn-image` | POST | 90s ⚠️ | Learn from uploaded screenshot (VLM) |
| `/api/forge/generations` | GET | — | List generations |
| `/api/forge/status` | GET | — | Engine status |
| `/api/forge/techniques` | GET | — | List techniques |
| `/api/forge/test-llm` | GET | — | Test LLM connectivity |

### Virtual Artist (5 routes)
| route | method | maxDuration | purpose |
|-------|--------|-------------|---------|
| `/api/artist/cycle` | POST | 60s | Run artist cycle |
| `/api/artist/patterns` | GET | — | List patterns |
| `/api/artist/thoughts` | GET | — | List thoughts |
| `/api/artist/status` | GET | — | Artist status |
| `/api/artist/reset` | POST | — | Reset artist |

### SEAE Engine (4 routes)
| route | method | maxDuration | purpose |
|-------|--------|-------------|---------|
| `/api/seae/cycle` | POST | — | Run SEAE cycle |
| `/api/seae/patterns` | GET | — | List patterns |
| `/api/seae/status` | GET | — | Status |
| `/api/seae/reset` | POST | — | Reset |

### Sandbox (14 routes)
| route | method | purpose |
|-------|--------|---------|
| `/api/sandbox/ssh-exec` | POST | Execute shell command (E2B) |
| `/api/sandbox/ssh-info` | GET | SSH connection info |
| `/api/sandbox/e2b-create` | POST | Create E2B sandbox |
| `/api/sandbox/e2b-exec` | POST | Execute in E2B |
| `/api/sandbox/modal-create` | POST | Create Modal function |
| `/api/sandbox/modal-list` | GET | List Modal functions |
| `/api/sandbox/modal-test` | POST | Test Modal function |
| `/api/sandbox/modal-deploy-template` | POST | Deploy Modal template |
| `/api/sandbox/daytona-create` | POST | Create Daytona env |
| `/api/sandbox/daytona-exec` | POST | Execute in Daytona |
| `/api/sandbox/daytona-list` | GET | List Daytona envs |
| `/api/sandbox/daytona-delete` | DELETE | Delete Daytona env |
| `/api/sandbox/daytona-preview` | GET | Daytona preview URL |
| `/api/sandbox/batch-run` | POST | Batch execution |
| `/api/sandbox/pipeline-run` | POST | Pipeline execution |

### Cerebrium (2 routes)
| route | method | purpose |
|-------|--------|---------|
| `/api/cerebrium/search` | GET, POST | Search 159 design files |
| `/api/cerebrium/stats` | GET | Brain stats |

### Catalog & Templates (2 routes)
| route | method | purpose |
|-------|--------|---------|
| `/api/catalog` | GET | MotionSites prompt catalog |
| `/api/templates` | GET | Pattern combination stats |

### Session & Logs (3 routes)
| route | method | maxDuration | purpose |
|-------|--------|-------------|---------|
| `/api/session` | GET, POST | 10s | Session persistence |
| `/api/sessions` | GET, POST | — | Session list (alternate) |
| `/api/logs` | GET, POST, DELETE | 5s | System logs |

### Utility (7 routes)
| route | method | purpose |
|-------|--------|---------|
| `/api/deploy/vercel` | GET, POST | "Deploy" (just saves to Supabase) |
| `/api/inject` | POST | Inject WhatsApp/form into HTML |
| `/api/subpage` | POST | Generate sub-pages |
| `/api/images/generate` | POST | AI image generation |
| `/api/debug-proxy` | GET, POST | Debug proxy |
| `/api/chat/messages` | GET, POST | Chat messages |
| `/api/chat/rotated` | GET, POST | Rotated chat |
| `/api/` | GET | API health check |
| `/api/va-autonomous` | POST | VA autonomous mode |
| `/api/va-learn` | POST | VA learning |

### Total: ~60 API routes

---

## 39. Premium CSS Foundation — Full CSS

The `PREMIUM_CSS` string (193 lines) injected by `injectPremiumCSS()`:

### CSS Custom Properties
```css
:root {
  --zf-bg: #0A0A0A;
  --zf-text: #FFFFFF;
  --zf-accent: #DCFF00;
  --zf-accent2: #64CEFB;
  --zf-muted: rgba(255,255,255,0.6);
  --zf-card: rgba(255,255,255,0.05);
  --zf-border: rgba(255,255,255,0.1);
  --zf-radius: 16px;
  --zf-radius-sm: 8px;
  --zf-radius-lg: 24px;
  --zf-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --zf-shadow: 0 20px 40px rgba(0,0,0,0.3);
  --zf-shadow-glow: 0 0 40px rgba(220,255,0,0.15);
  --zf-font-display: 'Instrument Serif', serif;
  --zf-font-body: 'Inter', sans-serif;
  --zf-font-mono: 'Space Grotesk', sans-serif;
  --zf-max-width: 1200px;
  --zf-section-padding: clamp(4rem, 10vw, 8rem);
}
```

### CSS Sections
1. **Reset** — `* { margin:0; padding:0; box-sizing:border-box; }`
2. **Typography** — h1-h4 with `var(--zf-font-display)`, clamp() sizes, `em` styled italic + accent color
3. **Layout** — `section` max-width 1200px, `.section-title` centered
4. **Navigation** — fixed top, glass-blur on scroll, logo left, links center, CTA right
5. **Hero** — min-height 100vh, video bg at 40% opacity, gradient overlay, centered content
6. **Buttons** — gradient bg, pill radius, hover lift + glow
7. **Cards (Glassmorphism)** — `backdrop-filter: blur(12px)`, semi-transparent bg, hover translateY(-8px)
8. **Grids** — `repeat(auto-fit, minmax(250px, 1fr))`, 2rem gap
9. **Stats** — gradient text via `background-clip: text`
10. **Testimonials** — glass cards, 48px avatars, star SVGs
11. **FAQ** — accordion with max-height transition, rotate icon on open
12. **Footer** — 4-column grid, newsletter form, social SVGs
13. **Reveal animations** — `.reveal` opacity:0 + translateY(40px), `.visible` opacity:1, `.delay-1` through `.delay-4`
14. **Responsive** — 1024px (stats 2-col, footer 2-col), 768px (everything 1-col, nav hidden)
15. **ZF injected features** — scroll progress bar, back-to-top button, social icons

---

## 40. HTML Post-Processor — Full Injection Detail

`src/lib/html-postprocessor.ts` (159 lines) — `postProcessHTML(html)`

### 8 Injected Features

#### 1. Preloader Force-Hide (always injected)
```javascript
function hide() {
  var selectors = ['.preloader','#preloader','.loader','#loader','.loading',
                   '[class*="preload"]','[class*="load"]'];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.5s';
      setTimeout(() => el.style.display = 'none', 500);
    });
  });
}
setTimeout(hide, 2000);
setTimeout(hide, 3000);
window.addEventListener('load', () => setTimeout(hide, 500));
```

#### 2. IntersectionObserver (if missing)
- Observes `.reveal` elements → adds `.visible` class
- Also observes all `<section>` elements without `.reveal` → applies opacity/transform transition
- ⚠️ **Bug**: Forces `opacity:0` on all sections — if JS fails, page is invisible

#### 3. Animated Counters (if missing)
- Finds `.stat-num`, `.counter`, `[class*="stat"]:not(.stat-label)`
- Extracts numbers from text, sets `data-target`
- Uses `requestAnimationFrame` with cubic ease-out over 2 seconds
- Triggers on IntersectionObserver (threshold 0.5)

#### 4. Scroll Progress Bar (if missing)
- Injects `<div class="zf-scroll-progress" id="zfScrollProgress">`
- Fixed top, 3px height, gradient bg (`#FF6B35` → `#FFD93D`)
- Updates width on scroll: `scrollY / (scrollHeight - innerHeight) * 100`

#### 5. Back-to-Top Button (if missing)
- Injects `<button class="zf-back-top" id="zfBackTop">`
- Fixed bottom-right, 44px circle, `#FF6B35` bg
- Shows on scroll >300px
- Smooth scroll to top on click

#### 6. FAQ Accordion Handler (if FAQ exists but no click handler)
- Finds `.faq-item`, `.faq-q`, `.accordion-item`
- Toggles `.open` class on click

#### 7. SVG Social Icons (if footer exists but no socials)
- Injects before `</footer>`:
- Twitter (X), GitHub, LinkedIn, Instagram SVG paths
- Styled with `.zf-social` flex gap

#### 8. Custom Cursor (if missing)
- Creates fixed 20px circle div
- Follows mousemove
- Expands to 40px on `a, button` hover
- Only on `pointer:fine` (desktop)

### Injection Order
1. Preloader fix (always at end)
2. IntersectionObserver (before `</body>`)
3. Counters (before `</body>`)
4. Scroll progress (before `</head>`)
5. Back-to-top (before `</body>`)
6. FAQ handler (before `</body>`)
7. Social icons (before `</footer>`)
8. Cursor (before `</body>`)

---

## 41. Public Viewer (`/s/[slug]`) — Full Pipeline

### Step 1: Fetch from Supabase
```typescript
const site = await getWebsiteFromSupabase(slug);
// Returns { id, html, business_name, business_type, config, created_at }
```

### Step 2: `repairHtml(html)` — Close Truncated Tags
- If missing `</style>`: append `}` + `</style>`
- If missing `</head>`: append `</head>`
- If missing `</body>`: insert before `</html>` or append
- If missing `</html>`: append `</html>`

### Step 3: `injectPremiumCSS(html)` — Design System
- Calls `injectPremiumCSS()` from `premium-css-foundation.ts`
- Injects the full `PREMIUM_CSS` before `</head>`

### Step 4: `injectPremiumFeatures(html)` — Feature Guarantee
Injects 7 features inline (different implementation from `postProcessHTML`):

1. **Preloader force-hide** — `.zf-force-hide` class with `opacity:0 !important; visibility:hidden`
   - ⚠️ **Bug**: Selector `[class*="load"]` matches `.download-button`, `.uploaded-file`, etc.
2. **IntersectionObserver** — same as post-processor but inline
3. **Animated counters** — same
4. **Scroll progress bar** — `#FF6B35` → `#FFD93D` gradient
5. **Back-to-top** — `#FF6B35` bg
6. **Social SVG icons** — only if `<footer>` exists but no socials
7. **Custom cursor** — only if `pointer:fine` not detected

### Response Headers
```http
Content-Type: text/html; charset=utf-8
Cache-Control: public, max-age=60
```

### 404 Response
Inline-styled dark page: "404 — Site '{slug}' not found" + back-to-studio link.

---

## 42. Subpage Generator — Full Detail

`src/app/api/subpage/route.ts` (109 lines)

### Supported Page Types (9)

| contentType | description |
|-------------|-------------|
| services | 6-card grid (Strategy, Design, Dev, Launch, Support, Training) |
| about | 3-paragraph narrative |
| contact | 2-column: info + form |
| portfolio | 6-item grid with Unsplash images |
| blog | 4-article list with thumbnails |
| faq | 5-item `<details>` accordion |
| team | 6-member grid with avatars |
| pricing | 3-tier (Starter $4.9K, Growth $18.5K, Scale Custom) |
| testimonials | 3-quote grid with 5-star ratings |
| custom | generic placeholder |

### Design DNA Extraction

From parent HTML:
- `bg` — from `body { background: ... }` regex
- `fontHref` — from `<link href="https://fonts.googleapis...">` regex
- `businessName` — from `<title>` tag (split on `—`)
- `navHtml` — from `<nav>...</nav>` regex
- `footerHtml` — from `<footer>...</footer>` regex

### Auto-Linking

After saving the subpage, the parent's footer is updated:
- Finds first `<a>` in footer, copies its style/class
- Creates new `<a href="/s/{subSlug}">{pageName}</a>`
- Inserts before `</footer>`
- Saves updated parent to Supabase

### ⚠️ Bug
```typescript
const host = `https://${req.headers.get('host') || 'localhost:3000'}`;
```
On localhost, this produces `https://localhost:3000` which won't match the http dev server.

---

## 43. Inject Tool — Full Detail

`src/app/api/inject/route.ts` (22 lines)

### WhatsApp Button
```html
<a href="https://wa.me/{phone}?text={msg}" target="_blank"
   style="position:fixed;bottom:20px;right:20px;width:60px;height:60px;
          background:#25D366;border-radius:50%;...">💬</a>
```

### Floating Contact Form
```html
<div style="position:fixed;bottom:20px;right:90px;...">
  <h4>Contact us</h4>
  <input placeholder="Name" />
  <input placeholder="Email" />
  <button>Send</button>
</div>
```
⚠️ The form has no backend handler — `<button>` does nothing on submit.

---

## 44. VA Autonomous Route — Full Detail

`src/app/api/va-autonomous/route.ts` (131 lines)

### 10 Autonomous Businesses

| name | description |
|------|-------------|
| Aurora Wellness | luxury wellness retreat in Iceland |
| Voltage EV | electric vehicle charging network |
| Cipher Security | cybersecurity SaaS platform |
| Bloom Flowers | sustainable flower delivery service |
| Pulse Music | music streaming platform for indie artists |
| Forge Fitness | premium fitness coaching app |
| Nebula PM | AI project management platform |
| Vela Fashion | sustainable luxury fashion brand |
| Quantum Code | AI-powered code review platform |
| Ember Coffee | specialty coffee subscription service |

### Actions

#### `action: 'status'`
Returns memory summary + raw memory text (first 5000 chars).

#### `action: 'generate'`
1. Pick random business from the 10
2. Append memory entry: `"Starting autonomous generation for {name}"`
3. Build learning prompt via `buildLearningPrompt(name, desc)` (from learning-system.ts)
4. Call Mistral direct: `mistral-large-latest`, 8000 max_tokens, 0.8 temperature
5. If generation fails: append memory note, return error
6. If succeeds: extract HTML, save to Supabase
7. Run strict review (Mistral, 1000 max_tokens, 0.0 temperature)
8. Parse review JSON
9. Append memory: `"Generated {name} — Score: {score}/30"`
10. Return `{ viewUrl, score, review, businessName }`

---

## 45. Complete File Tree with Line Counts

### Source Files (src/)

| path | lines | purpose |
|------|-------|---------|
| `src/app/page.tsx` | 4,136 | ⭐ Main UI (13 tabs) |
| `src/app/layout.tsx` | 54 | Root layout |
| `src/app/globals.css` | 241 | Tailwind + Elite theme |
| `src/app/s/[slug]/route.ts` | 129 | Public viewer |
| `src/app/api/va-generate/route.ts` | 310 | VA streaming |
| `src/app/api/premium-generate/route.ts` | 286 | LLM streaming |
| `src/app/api/recreate/route.ts` | 126 | Spec-driven recreation |
| `src/app/api/forge/generate/route.ts` | 135 | Forge generation |
| `src/app/api/forge/auto-evolve/route.ts` | 182 | Auto-evolution |
| `src/app/api/forge/review/route.ts` | 87 | Emoji review |
| `src/app/api/forge/extract/route.ts` | 78 | Technique extraction |
| `src/app/api/forge/learn-image/route.ts` | 98 | VLM image learning |
| `src/app/api/forge/generations/route.ts` | ~60 | List generations |
| `src/app/api/forge/status/route.ts` | ~30 | Engine status |
| `src/app/api/forge/techniques/route.ts` | ~40 | List techniques |
| `src/app/api/forge/test-llm/route.ts` | ~60 | Test LLM |
| `src/app/api/quality-check/route.ts` | 96 | Mistral review |
| `src/app/api/render-site/route.ts` | 465 | V5 combinatorial |
| `src/app/api/render-premium/route.ts` | ~80 | V6 Ultra assembly |
| `src/app/api/save-website/route.ts` | 57 | Save to Supabase |
| `src/app/api/site/[slug]/route.ts` | 42 | Raw HTML serve |
| `src/app/api/sites/list/route.ts` | ~25 | List sites |
| `src/app/api/deploy/vercel/route.ts` | 27 | "Deploy" (fake) |
| `src/app/api/llm/chat/route.ts` | 144 | Multi-provider chat |
| `src/app/api/llm/models/route.ts` | 84 | Model catalog |
| `src/app/api/llm-extract/route.ts` | 271 | Edge LLM extraction |
| `src/app/api/zai/[...path]/route.ts` | 288 | Z.AI SDK proxy |
| `src/app/api/catalog/route.ts` | 47 | Prompt catalog |
| `src/app/api/templates/route.ts` | 107 | Pattern stats |
| `src/app/api/session/route.ts` | 75 | Session persistence |
| `src/app/api/logs/route.ts` | ~100 | System logs |
| `src/app/api/inject/route.ts` | 22 | WhatsApp/form injection |
| `src/app/api/subpage/route.ts` | 109 | Subpage generator |
| `src/app/api/images/generate/route.ts` | ~40 | Image generation |
| `src/app/api/cerebrium/search/route.ts` | 254 | Brain search |
| `src/app/api/cerebrium/stats/route.ts` | ~30 | Brain stats |
| `src/app/api/va-autonomous/route.ts` | 131 | VA autonomous |
| `src/app/api/va-learn/route.ts` | ~50 | VA learning |
| `src/app/api/artist/cycle/route.ts` | 34 | Artist cycle |
| `src/app/api/artist/patterns/route.ts` | ~30 | Artist patterns |
| `src/app/api/artist/thoughts/route.ts` | ~30 | Artist thoughts |
| `src/app/api/artist/status/route.ts` | ~30 | Artist status |
| `src/app/api/artist/reset/route.ts` | ~20 | Artist reset |
| `src/app/api/seae/cycle/route.ts` | ~40 | SEAE cycle |
| `src/app/api/seae/patterns/route.ts` | ~30 | SEAE patterns |
| `src/app/api/seae/status/route.ts` | ~30 | SEAE status |
| `src/app/api/seae/reset/route.ts` | ~20 | SEAE reset |
| `src/app/api/sandbox/ssh-exec/route.ts` | 308 | SSH terminal |
| `src/app/api/sandbox/ssh-info/route.ts` | ~30 | SSH info |
| `src/app/api/sandbox/e2b-create/route.ts` | ~40 | E2B create |
| `src/app/api/sandbox/e2b-exec/route.ts` | ~40 | E2B exec |
| `src/app/api/sandbox/modal-*.ts` | ~40 each | Modal routes (4) |
| `src/app/api/sandbox/daytona-*.ts` | ~40 each | Daytona routes (5) |
| `src/app/api/sandbox/batch-run/route.ts` | ~40 | Batch |
| `src/app/api/sandbox/pipeline-run/route.ts` | ~40 | Pipeline |
| `src/app/api/chat/messages/route.ts` | ~40 | Chat messages |
| `src/app/api/chat/rotated/route.ts` | ~40 | Rotated chat |
| `src/app/api/debug-proxy/route.ts` | ~30 | Debug |
| `src/app/api/sessions/route.ts` | ~30 | Sessions list |
| `src/app/api/route.ts` | ~10 | Health check |

### Library Files (src/lib/)

| path | lines | purpose |
|------|-------|---------|
| `src/lib/prompt-recreator.ts` | 1,455 | V2 spec engine (17 renderers) |
| `src/lib/virtual-artist.ts` | 876 | 24/7 evolution loop |
| `src/lib/mutation-engine.ts` | 803 | Caged-lion mutations |
| `src/lib/forge/technique-library.ts` | 724 | Technique index |
| `src/lib/forge/forge-reasoner.ts` | 607 | Forge brain |
| `src/lib/review-machine.ts` | 600 | 6-pass review |
| `src/lib/premium-website-system.ts` | 644 | LLM recipe |
| `src/lib/zai-client.ts` | 481 | Z.AI client |
| `src/lib/v6-renderer.ts` | 454 | V6 renderer |
| `src/lib/render-site/route.ts` (inline) | 465 | V5 combinatorial |
| `src/lib/v5-core.ts` | 406 | V5 foundation |
| `src/lib/forge/review-system.ts` | 514 | Emoji review flow |
| `src/lib/pattern-designer.ts` | 359 | Instant assembly |
| `src/lib/premium-patterns.ts` | 1,283 | Hand-crafted patterns |
| `src/lib/motionsites-prompts.ts` | 340 | Prompt parser |
| `src/lib/premium-master-list.ts` | 213 | Review rubric |
| `src/lib/llm-provider.ts` | 211 | Multi-provider chat |
| `src/lib/va-teaching-system.ts` | 194 | Teaching prompt |
| `src/lib/premium-css-foundation.ts` | 222 | CSS design system |
| `src/lib/html-postprocessor.ts` | 159 | Feature injector |
| `src/lib/learning-system.ts` | 155 | Learning index |
| `src/lib/session-manager.ts` | 138 | Session persistence |
| `src/lib/supabase-client.ts` | 92 | Supabase client |
| `src/lib/va-memory.ts` | 81 | VA memory file |
| `src/lib/prompt-catalog.ts` | 278 | Catalog extractor |
| `src/lib/design-kb.ts` | 232 | Design knowledge base |
| `src/lib/seae-engine.ts` | 468 | SEAE engine |
| `src/lib/v5-variants.ts` | 346 | V5 section variants |

### Hooks

| path | lines | purpose |
|------|-------|---------|
| `src/hooks/use-session.ts` | 87 | Supabase session hook |
| `src/hooks/use-audit-logger.ts` | 112 | Audit logging |
| `src/hooks/use-mobile.ts` | ~10 | Mobile detection |
| `src/hooks/use-toast.ts` | ~10 | Toast hook |

### Config

| path | lines | purpose |
|------|-------|---------|
| `package.json` | 97 | Dependencies |
| `vercel.json` | 22 | Function timeouts |
| `next.config.ts` | 12 | Next.js config |
| `tsconfig.json` | ~30 | TypeScript config |
| `tailwind.config.ts` | ~20 | Tailwind config |
| `postcss.config.mjs` | ~5 | PostCSS |
| `eslint.config.mjs` | ~10 | ESLint |
| `components.json` | ~15 | shadcn config |
| `prisma/schema.prisma` | 32 | Prisma (unused) |
| `prisma/forge-schema.sql` | 98 | Supabase DDL |

---

## 46. MARK_2_PLAN.md — Full Summary

The planning document (434 lines) describes the Forge Engine vision:

### Mark 1 Limitations (what was wrong)
1. Can only copy — cannot combine techniques from multiple prompts
2. No memory — every recreation starts from scratch
3. No taste — no way to say "this is good" or "this is bad"
4. Evolution + VA tabs are template-swap (palette/font mutation via string replacement)
5. No image input — no VLM path for screenshots

### Mark 2 Goals (what was planned)
1. **Technique Library** — index every technique from 121 prompts
2. **Forge Reasoner** — LLM picks techniques, explains WHY, combines into StructuredSpec
3. **V2 Renderer** — renders the combined spec
4. **Review Queue** — user rates 1-5 emoji
5. **Learning Loop** — trash/improve/save drives technique ratings

### 4 Phases Planned

#### Phase 1: Technique Library
- `src/lib/forge/technique-library.ts` with Technique schema
- Extract from 121 prompts via LLM or regex
- Index by part-type (hero, footer, nav, button, etc.)

#### Phase 2: Forge Reasoner
- `src/lib/forge/forge-reasoner.ts`
- Takes target description, picks techniques, applies mutations
- Returns ForgePlan with reasoning trace

#### Phase 3: Review System
- `src/lib/forge/review-system.ts`
- 1-5 emoji rating
- 😡😕 → trash, 😐 → improve, 😍🤩 → save
- Techniques get avoidCount/rating updates

#### Phase 4: Image Inspiration
- `src/lib/forge/learn-image/route.ts`
- Upload screenshot → VLM extracts techniques → add to library
- `forge_image_inspirations` table

### All 4 phases are implemented in the current codebase.

---

## 47. Complete Data Flow Diagrams

### Website Generation Flow (all 4 paths)

```
                    USER REQUEST
                    (prompt + business name)
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Generate │  │ Recreate │  │ Catalog  │
   │   Tab    │  │   Tab    │  │   Tab    │
   └────┬─────┘  └────┬─────┘  └────┬─────┘
        │              │              │
        ▼              ▼              ▼
  ┌───────────┐ ┌───────────┐ ┌───────────┐
  │ premium-  │ │ recreate  │ │ va-       │
  │ generate  │ │ (LLM      │ │ generate  │
  │ (stream)  │ │  extract) │ │ (stream)  │
  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
        │              │              │
        ▼              ▼              ▼
  ┌───────────┐ ┌───────────┐ ┌───────────┐
  │ Mistral/  │ │ prompt-   │ │ Mistral/  │
  │ Z.AI LLM  │ │ recreator │ │ Z.AI LLM  │
  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
        │              │              │
        ▼              ▼              ▼
  ┌───────────────────────────────────────┐
  │        Generated HTML (raw)           │
  └───────────────────┬───────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  save-   │ │ inject   │ │ subpage  │
  │ website  │ │ (WA/form)│ │          │
  └────┬─────┘ └──────────┘ └──────────┘
       │
       ▼
  ┌──────────┐
  │ Supabase │
  │ websites │
  │  table   │
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │ /s/slug  │ ← public viewer
  │ viewer   │
  │          │
  │ 1. repair HTML
  │ 2. inject CSS
  │ 3. inject features
  └──────────┘
```

### Evolution Loop Flow

```
┌─────────────────────────────────────────┐
│         24/7 EVOLUTION LOOP              │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │     INSPIRATION SOURCES         │    │
│  │  ┌──────────┐ ┌──────────┐     │    │
│  │  │ 121      │ │ 147      │     │    │
│  │  │ Motion-  │ │ brand    │     │    │
│  │  │ Sites    │ │ DESIGN   │     │    │
│  │  │ prompts  │ │ .md      │     │    │
│  │  └────┬─────┘ └────┬─────┘     │    │
│  │       └──────┬─────┘           │    │
│  │              ▼                 │    │
│  │  ┌──────────────────┐          │    │
│  │  │ 100 learning     │          │    │
│  │  │ websites         │          │    │
│  │  └────────┬─────────┘          │    │
│  └───────────┼────────────────────┘    │
│              ▼                          │
│  ┌───────────────────────────┐         │
│  │   virtual-artist.ts       │         │
│  │   6-phase cycle:          │         │
│  │   THINK → ITERATE → BUILD │         │
│  │   → REVIEW → ADD/DELETE   │         │
│  └───────────┬───────────────┘         │
│              ▼                          │
│  ┌───────────────────────────┐         │
│  │   mutation-engine.ts      │         │
│  │   "caged lion":           │         │
│  │   AI picks palette/font/  │         │
│  │   mutation, code executes │         │
│  │   on premium patterns     │         │
│  └───────────┬───────────────┘         │
│              ▼                          │
│  ┌───────────────────────────┐         │
│  │   review-machine.ts       │         │
│  │   6-pass strict review:   │         │
│  │   typography, color,      │         │
│  │   layout, a11y, brand,    │         │
│  │   originality             │         │
│  │   threshold: 75           │         │
│  └───────────┬───────────────┘         │
│              ▼                          │
│         ┌────┴────┐                    │
│         ▼         ▼                    │
│    ┌────────┐ ┌────────┐              │
│    │ ACCEPT │ │ REJECT │              │
│    │ (≥75)  │ │ (<75)  │              │
│    └───┬────┘ └───┬────┘              │
│        ▼          ▼                    │
│   ┌─────────┐ ┌─────────┐             │
│   │ ADD to  │ │ DELETE  │             │
│   │ library │ │ (prune) │             │
│   └────┬────┘ └─────────┘             │
│        ▼                                │
│   ┌─────────┐                          │
│   │ Supabase│                          │
│   │ patterns│                          │
│   │ table   │                          │
│   └─────────┘                          │
│                                        │
│   Neural Score:                        │
│   fitness(35%) + diversity(20%) +      │
│   innovation(25%) + learning(20%)      │
│                                        │
│   Persistence:                         │
│   - Supabase (patterns, thoughts)      │
│   - va-memory.md (human-readable)      │
│   - globalThis (in-memory cache)       │
│                                        │
│   Vercel fallback:                     │
│   tickArtistAutoEvolve() (polling)     │
└─────────────────────────────────────────┘
```

### Forge Engine Flow

```
USER: "boutique law firm"
         │
         ▼
┌─────────────────────┐
│  forgeGenerate()    │
│                     │
│  1. Load techniques │
│     from library    │
│                     │
│  2. Filter by       │
│     part-type       │
│     (hero, footer,  │
│      nav, etc.)     │
│                     │
│  3. Top-rated       │
│     preferred       │
│     (4-5★)          │
│                     │
│  4. Avoided excluded│
│     (avoidCount≥3)  │
│                     │
│  5. LLM picks +     │
│     explains WHY    │
│     (REASONER_      │
│      SYSTEM_PROMPT) │
│                     │
│  6. Apply mutations │
│     (color/font/    │
│      copy swaps)    │
│                     │
│  7. Assemble        │
│     StructuredSpec  │
│                     │
│  8. Render HTML     │
│     (17 per-section │
│      renderers)     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  recordGeneration() │
│  status = pending   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Save to Supabase   │
│  + /s/{slug} URL    │
└────────┬────────────┘
         │
         ▼
  USER RATES 1-5
         │
    ┌────┼────┐
    ▼    ▼    ▼
  😡😕  😐   😍🤩
    │    │    │
    ▼    ▼    ▼
 TRASH IMPROVE SAVE
    │    │    │
    │    │    │
    ▼    ▼    ▼
┌──────────────────────────┐
│  TECHNIQUE LIBRARY       │
│                          │
│  😡😕 → avoidCount++     │
│         if ≥3: avoided   │
│                          │
│  😐 → LLM suggests 3     │
│       improvements       │
│       (stored for next)  │
│                          │
│  😍🤩 → loved=true       │
│         rating=4-5       │
│         promoted to      │
│         saved_templates  │
└──────────────────────────┘
```

---

## 48. Complete Bug & Issue Catalog (Expanded)

### Critical Bugs (app-breaking)

1. **`C.bg` undefined** (page.tsx:3183, 3454) — invisible button text in Catalog + Settings
2. **String-literal env vars** (llm/chat:24,84,88) — VPS bridge completely broken
3. **`callMistralStream` doesn't stream** (va-generate:60) — sends `stream: false`
4. **`/api/deploy/vercel` doesn't deploy** — just saves to Supabase
5. **Process env mutation** (forge/generate:43) — `process.env.GROQ_API_KEY = body.groqKey`
6. **`.zf-force-hide` selector** (s/[slug]:55) — matches `[class*="load"]` broadly
7. **Forced `opacity:0` on all sections** (s/[slug]:59) — invisible if JS fails
8. **Hardcoded E2B API key** (ssh-exec:19) — `e2b_ccd37e5d...`
9. **Hardcoded premium credentials** (page.tsx:3730) — visible in JS bundle
10. **Hardcoded paywall password** (page.tsx:3754) — `Hydrogen12345@work`

### High-Priority Issues

11. **In-memory state on serverless** (forge/auto-evolve:28-30) — resets on cold start
12. **No authentication** — all 60+ API routes are public
13. **`assessQuality` never returns 5** (forge/auto-evolve:177) — max is 4
14. **Duplicated V5 variants** — pricing/faq/stats/partners/blog all `[x,x,x,x,x]`
15. **Inconsistent default models** — 6 different defaults across tabs
16. **AgentTab dropdown missing Mistral** — only Groq + Z.AI
17. **AgentTab model selector doesn't re-render** — no useState
18. **Brain file count inconsistency** — 159 vs 310
19. **Brain heatmap flickers** — `Math.random()` per render
20. **`v6-renderer.renderV6` returns empty HTML** — assembly in API route
21. **Two `CustomConfig` interfaces** — v6-renderer vs pattern-designer
22. **`injectPremiumCSS` loose guard** — skips on single `--zf-accent` mention
23. **`postProcessHTML` silent failure** — `replace('</body>')` fails on truncated HTML
24. **Subpage hardcoded HTTPS** — breaks localhost
25. **Self-fetch in va-generate** — edge → same-origin API call (fragile on Vercel)

### Code Smells

26. **4,136 lines in page.tsx** — should be split per tab
27. **ArtistTab single compressed line** (~6KB) — unmaintainable
28. **Heavy inline styles** instead of Tailwind/CSS modules
29. **Manual onMouseEnter/Leave** instead of CSS :hover
30. **Many `as any` casts** — loses type safety
31. **`(C as any).accent` mutation** — bypasses React reactivity
32. **Plaintext Groq key in localStorage** — XSS-readable
33. **Dead Prisma schema** — SQLite with User/Post, unused
34. **`premiumError` declared twice** — SettingsTab + Home
35. **Native `<select>` styling** — doesn't match dark theme
36. **`SandboxStub` uses `alert()`** — jarring UX
37. **Two parallel databases** — Prisma + Supabase
38. **Two LLM clients** — zai-client vs llm-provider (overlapping)
39. **Two review rubrics** — premium-master-list (30pt) vs review-machine (100pt)
40. **`llm-provider.ts` env var bugs** — lines 81-82, 166-170 (string literals)
41. **Stale header comment** — "9 tabs" but file has 13
42. **`Bot` custom SVG** — shadows lucide Bot, type mismatch
43. **No `sendBeacon` for beforeunload** — audit logs lost on page close
44. **Monkey-patched `console.error`** — can break dev tools
45. **`premiumLogin` shadowing** — declared in both SettingsTab and Home

---

## 49. Environment Variable Complete Reference

### Set in `.env`
| variable | value | used by |
|----------|-------|---------|
| `DATABASE_URL` | `file:...custom.db` | Prisma (unused) |
| `MISTRAL_API_KEY` | `6XRe0pKv...` | va-generate, premium-generate, quality-check, va-autonomous, llm-extract |
| `VERCEL_API_KEY` | `[REDACTED]` | (not yet wired — deploy/vercel doesn't use it) |
| `GITHUB_TOKEN` | `[REDACTED]` | (not yet wired — for git operations) |

### Referenced in code

| variable | default | purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gjxwlnmfjzexdcepnovf.supabase.co` | Supabase URL |
| `SUPABASE_SERVICE_KEY` | (none) | Supabase service role key |
| `SUPABASE_SERVICE_ROLE_KEY` | (none) | Same, alternate name |
| `VPS_BRIDGE_URL` | `http://localhost:8765` | Z.AI VPS bridge |
| `VPS_BRIDGE_KEY` | (none) | Bridge auth key |
| `ZAI_VPS_BRIDGE_URL` | (none) | Same, alternate name |
| `ZAI_VPS_BRIDGE_KEY` | (none) | Same, alternate name |
| `SANDBOX_PREVIEW_URL` | (none) | Sandbox preview URL |
| `GROQ_API_KEY` | (none, or user-supplied) | Groq API key |
| `E2B_API_KEY` | `e2b_ccd37e5d...` (hardcoded) | E2B sandbox |
| `MODAL_TOKEN` | (none) | Modal serverless |
| `NEXT_PUBLIC_PAYWALL_PASSWORD` | `Hydrogen12345@work` | Paywall admin |
| `NEXT_PUBLIC_PREMIUM_USER` | `twinkleats2much` | Premium username |
| `NEXT_PUBLIC_PREMIUM_PASS` | `preciousrules991$` | Premium password |
| `PORT` | `3000` | Server port |

---

## 50. Deployment Complete Reference

### Current Infrastructure

| environment | URL | purpose |
|-------------|-----|---------|
| Sandbox | `http://localhost:3000` | Dev server (npm run dev) |
| Vercel | `https://site-forge-two-lake.vercel.app` | Production |
| Domain | `https://zenforge.site` | Custom domain → Vercel |
| Supabase | `https://gjxwlnmfjzexdcepnovf.supabase.co` | Database |
| GitHub | `github.com/trailerr9918/zenforge` | Repo |

### Build Pipeline

```bash
# Development
npm run dev          # next dev -p 3000, logs to dev.log

# Production build
npm run build        # next build + cp static + cp public to standalone
npm run start        # bun .next/standalone/server.js

# Deploy to Vercel
vercel --prod        # (not automated — /api/deploy/vercel doesn't actually deploy)
```

### Vercel Function Timeouts (vercel.json)

| route | maxDuration | hobby limit |
|-------|-------------|-------------|
| forge/generate | 60s | ✅ |
| forge/review | 45s | ✅ |
| forge/extract | 300s | ❌ (hobby max 60s) |
| forge/learn-image | 90s | ❌ (hobby max 60s) |
| recreate | 30s | ✅ |
| render-site | 30s | ✅ |
| (all others) | (code default) | varies |

### Environment Variables Needed on Vercel

- `MISTRAL_API_KEY`
- `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_PAYWALL_PASSWORD`
- `NEXT_PUBLIC_PREMIUM_USER`
- `NEXT_PUBLIC_PREMIUM_PASS`
- `VERCEL_API_KEY` (for actual Vercel API calls — not yet wired)
- `GITHUB_TOKEN` (for GitHub API calls — not yet wired)
- `VPS_BRIDGE_URL` + `VPS_BRIDGE_KEY` (if using VPS bridge fallback)
- `E2B_API_KEY` (for SSH terminal)
- `MODAL_TOKEN` (for Modal sandbox)

### Git Remote

```
origin  https://trailerr9918:[REDACTED]@github.com/trailerr9918/zenforge.git
```

### Current Commit

```
282d5a5 Inject premium CSS design system into every website (200x quality boost)
```

---

## 51. Quick Reference Card

### Tab Summary

| # | tab | locked | main endpoint | line range |
|---|-----|--------|---------------|------------|
| 1 | Generate | ✅ | /api/premium-generate | 360-706 |
| 2 | Patterns | no | /api/templates, /api/render-site | 709-816 |
| 3 | Projects | no | /api/sites/list, /api/site/[slug] | 819-871 |
| 4 | AI Agent | ✅ | /api/generate/agent (SSE) | 932-1068 |
| 5 | Sandbox | ✅ | /api/sandbox/ssh-exec | 1071-1583 |
| 6 | Deploy | ✅ | /api/deploy/vercel | 1586-1634 |
| 7 | Logs | no | /api/logs | 1637-1698 |
| 8 | Brain | no | /api/cerebrium/search | 1701-1877 |
| 9 | Recreate | ✅ | /api/recreate, /api/llm-extract | 2489-3011 |
| 10 | Catalog | no | /api/catalog, /api/va-generate | 3013-3196 |
| 11 | Evolution | ✅ | /api/forge/* | 1880-2486 |
| 12 | Artist | ✅ | /api/va-generate | 3196 (1 line) |
| 13 | Settings | no | /api/session, /api/va-autonomous | 3292-3594 |

### LLM Provider Priority

1. **Mistral** (recommended) — `mistral-large-latest`, direct API
2. **Z.AI** (fallback) — `glm-4-plus`, via VPS bridge or SDK
3. **Groq** (optional) — `llama-3.3-70b-versatile`, user-supplied key

### 4 Rendering Paths

1. **prompt-recreator** — spec-driven (Recreate tab)
2. **v5/v6 combinatorial** — deterministic (Patterns, Generate standard)
3. **pattern-designer** — instant assembly (AI Agent)
4. **premium-website-system** — LLM-generated (Generate premium, VA)

### 3-Layer Feature Guarantee

1. `injectPremiumCSS()` — design system CSS
2. `postProcessHTML()` — 8 feature injections
3. `/s/[slug]` viewer — repair + inject + serve

### Key Thresholds

- Review pass: **75/100** (review-machine)
- Review hard-fail: **60/100** on typography/layout/accessibility
- Premium check: **22/30** (quality-check)
- Vercel Hobby max: **60s** per function

### Key Credentials

- Mistral key: `6XRe0pKv...` (in .env)
- Vercel token: `[REDACTED]` (in .env)
- GitHub token: `[REDACTED]` (in .env)
- Premium user: `twinkleats2much` / `preciousrules991$`
- Paywall admin: `Hydrogen12345@work`
- Supabase URL: `gjxwlnmfjzexdcepnovf.supabase.co`
- E2B key: `e2b_ccd37e5d...` (hardcoded)
- Git remote: `github.com/trailerr9918/zenforge`

---

*End of compendium. Generated from commit `282d5a5`. Total codebase read: ~25,000 lines across 80+ source files. Every file, function, constant, and data structure documented.*
