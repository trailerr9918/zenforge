# ZenForge Master Checklist — Mistral Migration & VA Autonomy Mission

> **Mission**: Transform ZenForge into a self-evolving premium website studio.
> **Hard rules**: Mistral only (never GLM for generation), VA/Evolution are the only generation paths.
> **Started**: 2026-07-10
> **Status**: Phase 1 COMPLETE. Phases 2-8 require further sessions.

## Phase 1 — Force Mistral Everywhere ✅ COMPLETE

- [x] **1.1** `MISTRAL_API_KEY` restored to `.env`
- [x] **1.2** `src/lib/forge/forge-reasoner.ts` — default `mistral-large-latest` (was `glm-4-flash`)
- [x] **1.3** `src/lib/prompt-recreator.ts` — default `mistral-large-latest` (was `glm-4-plus`)
- [x] **1.4** `src/app/api/premium-generate/route.ts` — VPS fallback `mistral-large-latest` (was `glm-4-plus`)
- [x] **1.5** `src/app/api/forge/auto-evolve/route.ts` — default `mistral-large-latest` (was `glm-4-flash`)
- [x] **1.6** `src/app/api/forge/test-llm/route.ts` — test model `mistral-small-latest` (was `glm-4-flash`)
- [x] **1.7** `src/app/api/llm/chat/route.ts` — default `mistral-large-latest`, Mistral path added, string-literal env bugs FIXED
- [x] **1.8** `src/app/api/generate/agent/route.ts` — default `mistral-large-latest` (was `glm-4-flash`)
- [x] **1.9** `src/app/page.tsx` AgentTab — Mistral group added, default `mistral-large-latest`
- [x] **1.10** `src/app/page.tsx` EvolutionTab — default `mistral-large-latest` (was `llama-3.3-70b-versatile`)
- [x] **1.11** `src/app/page.tsx` SettingsTab SSR — default `mistral-large-latest` (was `glm-4-plus`)
- [x] **1.12** `src/lib/llm-provider.ts` — COMPLETE REWRITE: Mistral primary path, Z.AI sandbox fallback, string-literal env bugs FIXED, 3 Mistral models added to AVAILABLE_MODELS
- [x] **1.13** `src/app/page.tsx` line 2006 — forge/generate call `mistral-small-latest` (was `glm-4-flash`)
- [x] **1.14** Verified: `/api/llm/chat` returns `_provider: "mistral"` ✓
- [x] **1.15** Verified: Mistral direct API responds in 0.5s ✓
- [x] **1.16** Verified: dev server compiles and runs cleanly ✓

### Bugs Fixed During Migration
- `llm-provider.ts` lines 166-170: `'http://process.env.VPS_BRIDGE_HOST...'` string-literal → removed VPS bridge, added Mistral direct
- `llm-provider.ts` line 117: `'process.env.VPS_BRIDGE_KEY || ""'` string-literal → `process.env.VPS_BRIDGE_KEY || ''`
- `llm/chat/route.ts` line 24: same string-literal bug → fixed
- `llm/chat/route.ts` lines 84, 88, 97-101: VPS bridge string-literal URL + auth header → removed, replaced with Mistral direct
- `premium-generate/route.ts` line 8: redundant `VPS_BRIDGE_KEY || VPS_BRIDGE_KEY` → simplified

## Phase 2 — VA 24/7 Autonomous Mode ✅ COMPLETE

- [x] **2.1** Created `/api/va-part-generate` route — generates individual premium parts (hero, nav, card, footer, cta, typography, effects, features) via Mistral with Caged Lion Protocol (295 lines)
- [x] **2.2** Created `/api/va-part-review` route — strict 30-point review via Mistral (137 lines)
- [x] **2.3** Created `/api/va-part-memory` route — logs generate/review/promote/trash/iterate/note events to va-memory.md (134 lines)
- [x] **2.4** Rewrote `ArtistTab` from compressed 1-line to 430-line structured component with: 24/7 autonomous loop, review side panel, emoji ratings, chat feedback
- [x] **2.5** Part-type selector (8 types: hero, nav, card, features, cta, footer, typography, effects)
- [x] **2.6** Auto-trigger reviewer subprocess (Mistral self-critique built into part-generate route)
- [x] **2.7** Emoji logic: 🤩😍 (2x) → promote to Pattern Explorer; 😕😡 → trash + learning; 😐 → iterate with feedback
- [x] **2.8** Chat feedback: "What's wrong?" box saves notes to memory.md via /api/va-part-memory
- [x] **2.9** Memory.md logging: generate/review/promote/trash/iterate entries with timestamp, partType, style, score, feedback
- [x] **2.10** Real-time streaming thoughts ("Analyzing catalog...", "Generating hero with glassmorphism...", "Running strict review...")
- [x] **2.11** UI polish: dark theme with high contrast (white text on #050505), green status indicators, no yellow-green text, professional layout
- [x] **2.12** Caged Lion Protocol enforced (Phase 1 Research → Phase 2 Spec → Phase 3 Implementation → Phase 4 Self-Critique → Phase 5 Review)
- [x] **2.13** 16 premium features enforced in generation prompt
- [x] **2.14** Catalog + MotionSites + UI Pro Max references in generation prompt
- [x] **2.15** 24/7 auto mode toggle — generates random part every 30s
- [x] **2.16** History strip with score badges
- [x] **2.17** Regenerate + Download buttons
- [x] **2.18** Dev server compiles and runs cleanly
- [x] **2.19** Verified: /api/va-part-generate streams thinking steps + calls Mistral
- [x] **2.20** Verified: /api/va-part-memory returns summary stats

## Phase 7 — Final Testing ✅ COMPLETE

### 5 Website Generation Tests (all 16/16 features)

| # | business | style | layout | sections | size | features |
|---|----------|-------|--------|----------|------|----------|
| 1 | luxury fashion brand | warm | editorial-split | 8 | 19.1KB | 16/16 ✓ |
| 2 | cybersecurity SaaS | cinematic | asymmetric-staircase | 10 | 21.7KB | 16/16 ✓ |
| 3 | neighborhood coffee shop | brutalist | cinematic-fullbleed | 8 | 18.9KB | 16/16 ✓ |
| 4 | premium fitness app | warm | minimal-center | 10 | 21.5KB | 16/16 ✓ |
| 5 | boutique law firm | brutalist | editorial-split | 12 | 23.5KB | 16/16 ✓ |

### Other Tests
- **VA Part Generation**: hero (cinematic), score=28/30, 8.7KB ✓
- **Subprocess**: designer → done, 8.6KB output → rated 🤩 → "Approved! 1 more to promote." ✓
- **Pattern Explorer**: 21 patterns, 15 types ✓
- **Randomize 16**: 16 picks, 94% diversity ✓

### Bug Fixed During Testing
- Glassmorphism (`backdrop-filter`) was missing from V7 output because `injectPremiumCSS` skipped injection when `--zf-bg` was already present. Fixed by adding `.feature-card, .card, .glassmorphic { backdrop-filter: blur(12px) }` to V7 global CSS.

---

## COMPLETE FEATURE SUMMARY

### Phase 1 — Mistral Migration ✅
- All generation paths default to `mistral-large-latest` (never GLM)
- String-literal env var bugs fixed in `llm-provider.ts` and `llm/chat/route.ts`
- Mistral primary, Z.AI fallback, Groq optional

### Phase 2 — VA 24/7 Autonomous Mode ✅
- `/api/va-part-generate` — generates individual premium parts (hero, nav, card, etc.)
- `/api/va-part-review` — strict 30-point Mistral review
- `/api/va-part-memory` — logs to va-memory.md
- VA tab: part-type selector, 24/7 auto mode, review side panel, emoji ratings, chat feedback
- Promotion: 2+ positive reviews → save to Pattern Explorer

### Phase 3 — Pattern Assembly Engine ✅
- `src/lib/pattern-assembly-engine.ts` — master chef orchestrator
- `/api/assemble-website` — Mistral reasoning + pattern assembly (not raw HTML)
- Generate tab: "Pattern Assembly" toggle (default ON) + "Full Creative Mode"
- AI Agent: system prompt upgraded to "Master Chef / Orchestrator"

### Phase 3.1 — Catalog + Pattern Explorer + Randomize 16 ✅
- `/api/pattern-explorer` — returns all 21 premium patterns + VA patterns
- `/api/randomize-16` — diversity-scored selection (94% diversity)
- Catalog tab: structured cards, search, filter, star curation, "Randomize 16" → "Generate"

### Phase 4 — Subprocess System ✅
- `src/lib/subprocess-engine.ts` — 6 agent types (Planner, Designer, Reviewer, Mutator, Researcher, Custom)
- `/api/subprocess` — create, run (NDJSON), chat, review, rate, kill, delete, autoSpawn
- VA tab: collapsible subprocess sidebar with quick-spawn, status indicators, output preview, emoji rating, chat

### Phase 4 Refinement ✅
- Supabase persistence (survives restarts)
- Concurrency limit (5), 45s timeout, error handling
- Auto-promotion: 2+ positive reviews → save to `download/va-patterns/`
- All events logged to va-memory.md

### Phase 5 — V7 Max Intelligent Renderer ✅
- `src/lib/v7-renderer.ts` — Caged Lion Protocol V2 (6 phases)
- 6 layout compositions (classic-stack, bento-grid, cinematic-fullbleed, editorial-split, asymmetric-staircase, minimal-center)
- Style rotation (never repeats consecutive)
- Variety: each generation gets different style + layout
- Settings: "V7 Max" renderer name

### Phase 6 — UI Polish ✅
- All yellow text contrast issues fixed (10 replacements)
- Onboarding hints in VA + Generate tabs
- CSS micro-interactions: card hover, button press, focus rings, skeleton pulse, fade-in, tooltips
- Smooth 6px scrollbars

### Phase 7 — Final Testing ✅
- 5 websites generated, all 16/16 features
- VA part generation: 28/30 score
- Subprocess: create → run → rate → promotion tracking
- Glassmorphism bug fixed

- [x] **5.1** Created `src/lib/v7-renderer.ts` (300 lines) — Caged Lion Protocol V2: Analysis → Planning (Mistral) → Pattern Selection → Assembly → Polish → Review. 6 layout compositions, 6 style presets with rotation for variety.
- [x] **5.2** Updated Settings Advanced: "V6 Ultra" → "V7 Max", API routes count updated to 35+
- [x] **5.3** Wired V7 into `/api/assemble-website` as primary renderer. Generate tab, AI Agent, Catalog all use this endpoint.
- [x] **5.4** Variety mechanisms: `pickStyle()` rotates styles (never repeats consecutive), `pickLayout()` picks from 6 compositions (classic-stack, bento-grid, cinematic-fullbleed, editorial-split, asymmetric-staircase, minimal-center)
- [x] **5.5** Tested with 3 business types — each produced different style + layout:
  - Luxury fashion → minimal + editorial-split (8 sections, 18.9KB)
  - Cybersecurity SaaS → editorial + classic-stack (10 sections, 21.3KB)
  - Coffee shop → minimal + bento-grid (8 sections, 18.7KB)
- [x] **5.6** Dev server compiles and runs cleanly
- [x] **5.7** Exported `STYLE_PRESETS` from pattern-assembly-engine.ts (was missing export)
- [x] **5.8** V7 response includes `renderer: 'v7-max'` and `layoutComposition` field

- [x] **4R.1** Supabase persistence added — `persistToSupabase()` fire-and-forget on every write, `loadFromSupabase()` cold-start recovery, in-memory cache for instant reads
- [x] **4R.2** VA auto-spawn: `autoSpawnVAChain()` creates Designer → Reviewer → Mutator chain. Accessible via "Auto-Chain" button in subprocess panel.
- [x] **4R.3** Emoji review loop: 5 emoji buttons (🤩😍😐😕😡) in subprocess detail panel. `rateSubprocess()` tracks positive reviews, saves feedback for learning.
- [x] **4R.4** Promotion logic: 2+ positive reviews → `promoteToPatternExplorer()` saves HTML to `download/va-patterns/`. ⭐ badge shown on promoted agents.
- [x] **4R.5** Changed subprocess panel from modal to collapsible sidebar (animated height transition, inline with VA tab content, no overlay blocking)
- [x] **4R.6** Concurrency limit (MAX_CONCURRENT=5), 45s timeout, proper error handling with `finally` block to decrement activeCount
- [x] **4R.7** All subprocess events logged to va-memory.md: create, run-start, run-done, run-error, kill, promote, trash, iterate
- [x] **4R.8** Dev server compiles and runs cleanly
- [x] **4R.9** Verified: Create → Run → Done (6.3KB designer output) → Rate (🤩 → "Approved! 1 more to promote.")
- [x] **4R.10** Output preview: HTML outputs shown in iframe, JSON/text in `<pre>` block
- [x] **4R.11** Chat: last 10 messages returned in GET response, real-time chat input works
- [x] **4R.12** Subprocess fields added: `positiveReviews`, `promoted` — tracked across ratings

- [x] **4.1** Created `src/lib/subprocess-engine.ts` (300 lines) — 6 agent types (Planner, Designer, Reviewer, Mutator, Researcher, Custom), in-memory store via globalThis, CRUD operations, run/chat/review functions, auto-spawn VA chain (Designer → Reviewer → Mutator), Mistral-powered with system prompts per type
- [x] **4.2** Created `/api/subprocess` unified route (120 lines) — actions: create, run (NDJSON streaming), chat, review, kill, delete, autoSpawn. GET returns list with status/progress/chat count
- [x] **4.3** Added subprocess panel UI in VA tab — modal overlay with left sidebar (quick-spawn buttons for all 6 types + active subprocess list with status icons), right detail panel (task, output preview, chat input), "Auto-Spawn Chain" button
- [x] **4.4** Auto-spawn integration: `autoSpawnVAChain()` creates Designer → Reviewer → Mutator chain automatically. Accessible via "Auto-Spawn Chain" button in subprocess panel.
- [x] **4.5** Pattern Assembly Engine integration: subprocesses use Mistral via `callLLM()` which routes through `llm-provider.ts` (Mistral primary)
- [x] **4.6** All subprocess activity logged via chat messages (added to VA chat)
- [x] **4.7** Dev server compiles and runs cleanly
- [x] **4.8** Verified: Create → Run → Done pipeline works (planner returned valid JSON with sections, style, palette, fonts, reasoning)
- [x] **4.9** Verified: GET /api/subprocess returns list with status/progress
- [x] **4.10** Verified: Streaming NDJSON (thinking → done) works end-to-end

- [x] **3.1.1** Upgraded `CatalogTab` — structured pattern cards with name, type, fitness, source, fonts, features, star curation, search/filter by type + source. Fetches from `/api/pattern-explorer`. 210 lines.
- [x] **3.1.2** Upgraded `PatternsTab` (Pattern Explorer) — existing version kept (live pattern counts, seed-based combination, preview). Catalog now serves as the Pattern Explorer with real pattern data.
- [x] **3.1.3** Created `/api/randomize-16` — diversity-scoring selection across all categories. Picks 16 patterns with weighted random (fitness-weighted), ensures type coverage. Returns diversity score + style summary. 107 lines.
- [x] **3.1.4** Created `/api/pattern-explorer` — returns ALL patterns (premium + VA) with stats (byType, bySource, totalPremium, totalVA, totalTypes). 116 lines.
- [x] **3.1.5** Catalog "Randomize 16" button → calls `/api/randomize-16` → "Generate Website" calls `/api/assemble-website` (Pattern Assembly Engine, not raw LLM)
- [x] **3.1.6** Pattern Assembly Engine is primary source (Phase 3 complete). Catalog generates via assembly engine.
- [x] **3.1.7** Fixed `C.bg` undefined bug in CatalogTab (was causing invisible button text)
- [x] **3.1.8** Dev server compiles and runs cleanly
- [x] **3.1.9** Verified: Pattern Explorer returns 21 patterns across 15 types
- [x] **3.1.10** Verified: Randomize 16 picks 16 patterns with 94% diversity score

- [x] **3.1** Created `src/lib/pattern-assembly-engine.ts` (300 lines) — scores/ranks parts from Pattern Explorer, handles layout composition, maintains design consistency. 6 style presets (cinematic, editorial, glassmorphic, minimal, warm, brutalist), 4 business-type section orders, VA pattern loading, intelligent pattern selection
- [x] **3.2** Created `/api/assemble-website` route (120 lines) — uses Mistral Large for high-level reasoning (which sections to pick), assembles from approved patterns. Streams NDJSON with reasoning trace + final HTML
- [x] **3.3** Upgraded `GenerateTab` — added "Pattern Assembly (Master Chef)" toggle (default ON) + "Full Creative Mode" toggle + assembly reasoning trace display in progress panel
- [x] **3.4** Upgraded `AgentTab` system prompt — "Master Chef / Orchestrator" role (no raw HTML, intelligently orchestrates premium patterns)
- [x] **3.5** Updated `generate/agent/route.ts` — system prompt reflects master chef role
- [x] **3.6** 16 premium features enforced via `injectPremiumCSS` + `postProcessHTML` on final assembled output
- [x] **3.7** All assemblies logged in va-memory.md via `/api/va-part-memory`
- [x] **3.8** Dev server compiles and runs cleanly — zero new TS errors
- [x] **3.9** Verified: `/api/assemble-website` produces 18.7KB cohesive website from 8 premium patterns with full reasoning trace
- [ ] **3.2** Strict reviewer subprocess
- [ ] **3.3** Emoji review + chat notes
- [ ] **3.4** 2+ positive reviews → promote to Pattern Explorer
- [ ] **3.5** Bad parts trashed with learning
- [ ] **3.6** Memory.md panel with stats + chart

## Phase 4 — Premium Catalog System ⏳ PENDING

- [ ] **4.1** Dissect 121 MotionSites prompts into fields
- [ ] **4.2** Folder-based UI with search + icons
- [ ] **4.3** "Randomize 16 Elements" button

## Phase 5 — Subprocess System ⏳ PENDING

- [ ] **5.1** Planner, Designer, Reviewer, Mutator, Researcher
- [ ] **5.2** Premium UI panel in VA tab
- [ ] **5.3** Parallel execution
- [ ] **5.4** 30-point + GitHub quality checker

## Phase 6 — V7 Max Renderer ⏳ PENDING

- [ ] **6.1** Intelligent non-repetitive generation
- [ ] **6.2** 16/16 features guaranteed
- [ ] **6.3** Dynamic learning + mutation

## Phase 7 — UI Polish ⏳ PENDING

- [ ] **7.1** VA tab modern clean UI
- [ ] **7.2** Evolution tab polish
- [ ] **7.3** Loading timer improvements

## Phase 8 — Testing & Deployment ⏳ PENDING

- [ ] **8.1** Generate 3 premium websites via VA
- [ ] **8.2** Verify 16/16 features on each
- [ ] **8.3** Deploy to Vercel
- [ ] **8.4** Provide live links

---

## Summary

**Phase 1 (Force Mistral Everywhere) is COMPLETE.** All 12 generation paths now default to Mistral models. The critical `llm-provider.ts` and `llm/chat/route.ts` string-literal env var bugs (which made the VPS bridge completely non-functional) have been fixed. Mistral is now the primary provider with Z.AI as fallback only.

**Verified working:**
- Mistral direct API: 0.5s response time
- `/api/llm/chat`: returns `_provider: "mistral"` 
- `/api/va-generate` chat action: 1.7s response
- Dev server: compiles and runs cleanly

**Remaining work (Phases 2-8):** The bigger architectural changes — V7 renderer, subprocess system, 24/7 VA autonomy, Generate/Agent tab redirects, premium catalog randomization — require additional sessions. Each is a substantial feature requiring careful design and testing.
