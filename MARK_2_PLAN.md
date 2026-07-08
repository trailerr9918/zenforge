# ZenForge — Mark 2 Master Plan
## The Forge Engine: Reasoning Hybrid of Evolution × Virtual Artist

> **Status**: Planning document. Mark 1 (prompt recreation engine V2) is committed at `25db82e`, tagged `mark-1-site-forge`, live at https://site-forge-two-lake-kappa.vercel.app/.
>
> **Goal**: ZenForge stops being a "swap-colors-on-fixed-template" randomizer and becomes a **reasoning designer** that learns from the 121 MotionSites prompts + your screenshots + your 1–5 emoji ratings, then combines techniques from multiple sources into novel, premium websites you can review, rate, and save as templates.

---

## What's Wrong Today (Mark 1 Limitations)

Mark 1 fixed the recreation problem — given a prompt slug, it extracts the exact spec via LLM and renders only the sections the prompt describes. But:

1. **It can only copy.** It cannot *combine*. Aethera's hero + Innovation's stats + a custom footer from a screenshot — impossible today.
2. **It has no memory.** Every recreation starts from scratch. Nothing is learned across runs.
3. **It has no taste.** No way for you to say "this is good, do more like this" or "this is bad, never do this again."
4. **Evolution + VA tabs are still template-swap.** They pick palette + font + mutation from lists and apply via string replacement. They don't use the StructuredSpec extractor that Mark 1 proved works.
5. **No image input.** You uploaded screenshots you want ZenForge to learn from, but there's no VLM (vision) path wired in.

Mark 2 fixes all five.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    SITEFORGE FORGE ENGINE                     │
│                  (Mark 2 — hybrid Evolution × VA)             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  PROMPT LIBRARY  │    │  IMAGE LIBRARY   │               │
│  │  121 MotionSites │    │  User screenshots│               │
│  │  prompts parsed  │    │  (VLM-extracted) │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                       │                          │
│           └───────────┬───────────┘                          │
│                       ▼                                      │
│           ┌─────────────────────────┐                        │
│           │  TECHNIQUE LIBRARY      │                        │
│           │  Indexed by part-type:  │                        │
│           │  hero, footer, nav,     │                        │
│           │  button, section,       │                        │
│           │  background, animation, │                        │
│           │  interaction, 3D, JS    │                        │
│           └────────┬────────────────┘                        │
│                    ▼                                         │
│           ┌─────────────────────────┐                        │
│           │  FORGE REASONER (LLM)   │                        │
│           │  Picks techniques,      │                        │
│           │  explains WHY, combines │                        │
│           │  into a StructuredSpec  │                        │
│           └────────┬────────────────┘                        │
│                    ▼                                         │
│           ┌─────────────────────────┐                        │
│           │  V2 RENDERER (existing) │                        │
│           │  Renders StructuredSpec │                        │
│           │  → full HTML website    │                        │
│           └────────┬────────────────┘                        │
│                    ▼                                         │
│           ┌─────────────────────────┐                        │
│           │  REVIEW QUEUE (UI)      │                        │
│           │  You rate 1–5 emoji     │                        │
│           └────────┬────────────────┘                        │
│                    ▼                                         │
│     ┌──────────────┴──────────────┐                         │
│     ▼                ▼            ▼                          │
│  😡😕 TRASH     😐 IMPROVE    😍🤩 SAVE                     │
│  mark avoid     LLM suggests   → Saved Templates             │
│  patterns       improvements   → recallable later            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Technique Library  *(estimated effort: 1 session)*

### Goal
Index every technique from the 121 MotionSites prompts so the Forge Reasoner can pick from them.

### Tasks

- [ ] **1.1** Create `src/lib/forge/technique-library.ts` with the schema:
  ```ts
  interface Technique {
    id: string;                    // 'aethera-hero-video-fade-rise'
    sourcePromptId: string;        // 'aethera-hero'
    sourcePromptTitle: string;
    partType: PartType;            // 'hero' | 'footer' | 'nav' | 'button' | 'section' | 'background' | 'animation' | 'interaction' | '3d' | 'js'
    subtype?: string;              // 'video-bg' | 'centered' | 'split' | etc.
    name: string;                  // human label
    spec: Partial<Section>;        // the actual rendered spec snippet
    fonts: string[];               // fonts used
    colors: string[];              // colors used
    mediaUrls: string[];           // video/image URLs
    tags: string[];                // 'cinematic', 'glassmorphic', 'minimal', etc.
    userRating?: 1 | 2 | 3 | 4 | 5; // from review system
    usageCount: number;            // how many times picked
    avoidCount: number;            // how many times led to bad reviews
  }
  ```
- [ ] **1.2** Build `extractTechniquesFromPrompt(prompt: MotionPrompt): Technique[]` — for each prompt, walk the LLM-extracted StructuredSpec and emit one Technique per section (with `partType` derived from section.type).
- [ ] **1.3** Build `extractTechniquesFromImage(imageUrl: string, userNote?: string): Promise<Technique[]>` — uses `zaiVision()` to analyze a screenshot, extract visual techniques (color palette, layout structure, hero treatment, animation hints), returns techniques with `partType` guessed by VLM.
- [ ] **1.4** Run extraction across all 121 prompts → persist to `technique_library` table in Supabase (or local JSON file as fallback).
- [ ] **1.5** Build query helpers: `techniquesByPartType(part)`, `techniquesByTag(tag)`, `topRatedTechniques(part, n)`, `randomTechnique(part, exclude=[])`.
- [ ] **1.6** Wire the 4 screenshots you uploaded (Jul 5 ones: `09-55-03.png`, `09-55-11.png`, `09-55-22.png`, `12-48-01.png`) through `extractTechniquesFromImage()` — these seed the library with your visual taste.

### Acceptance criteria
- `getTechniqueStats()` returns counts per partType (should be ~50 heroes, ~30 sections, ~20 footers, ~15 navs, etc.)
- An image URL can be POSTed to `/api/forge/learn-image` and the technique count goes up.
- All 121 prompts have at least 1 technique extracted.

---

## Phase 2 — Forge Reasoner  *(estimated effort: 1 session)*

### Goal
The LLM-driven brain that picks techniques, explains why, and assembles a novel StructuredSpec.

### Tasks

- [ ] **2.1** Create `src/lib/forge/forge-reasoner.ts` with:
  ```ts
  interface ForgePlan {
    targetPrompt: string;          // "warm coffee shop" | "random" | "Aethera-inspired"
    sections: Array<{
      partType: PartType;
      pickedTechniqueId: string;
      reason: string;              // "Aethera's hero-video-fade-rise because you rated it 5★"
      mutations: string[];         // ["swapped Inter → Source Sans 3", "darkened bg by 8%"]
    }>;
    palette: { bg, text, muted, accent };
    fonts: { display, body };
    overallReason: string;         // summary for UI display
  }

  export async function planForgeGeneration(opts: {
    target?: string;               // business description | "random"
    inspirationIds?: string[];     // technique IDs to bias toward
    avoidIds?: string[];           // technique IDs to avoid (from bad reviews)
    imageInspiration?: string;     // image URL to bias toward
  }): Promise<ForgePlan>
  ```
- [ ] **2.2** LLM prompt for the reasoner (glm-4-plus, temperature 0.7 for creativity):
  - Input: target description, top-rated techniques for each partType, recently-avoided techniques, any image inspiration summary.
  - Output: structured JSON plan with `pickedTechniqueId` per section + `reason` + `mutations`.
  - Constraint: must pick at least 2 sections, max 6. Must include at least 1 hero. Must explain every pick.
- [ ] **2.3** Build `applyForgePlan(plan: ForgePlan): StructuredSpec` — walks the plan, loads each picked technique's spec, applies mutations (color swap, font swap, copy swap), assembles final StructuredSpec.
- [ ] **2.4** Build `forgeGenerate(opts): Promise<{ html, spec, plan }>` — orchestrates plan → apply → render via existing V2 renderer.
- [ ] **2.5** Persist every generation to `forge_generations` table with: plan, spec, html, timestamp, status='pending_review'.
- [ ] **2.6** Track reasoning trace — every plan is stored with its reasons so the UI can show "I picked this hero because…", "I picked this footer because…", etc.

### Acceptance criteria
- Calling `forgeGenerate({ target: 'random' })` returns a unique website every time (no two identical).
- The plan includes a human-readable reason for every technique pick.
- Mutations are real (color actually changes, not just claimed).

---

## Phase 3 — Review System  *(estimated effort: 1 session)*

### Goal
The 1–5 emoji rating flow that drives learning.

### Tasks

- [ ] **3.1** Create `src/lib/forge/review-system.ts` with:
  ```ts
  type EmojiRating = 1 | 2 | 3 | 4 | 5;
  // 1 = 😡, 2 = 😕, 3 = 😐, 4 = 😍, 5 = 🤩

  export async function reviewGeneration(generationId: string, rating: EmojiRating, note?: string): Promise<{
    action: 'trashed' | 'improvement-suggested' | 'saved-as-template';
    improvements?: string[];   // for rating 3
    templateId?: string;       // for rating 4-5
  }>
  ```
- [ ] **3.2** **Trash path (rating 1–2)**:
  - Mark every technique used in this generation with `avoidCount++`.
  - If a technique's `avoidCount >= 3` and `userRating < 3`, mark it `avoided=true` — Forge Reasoner will never pick it again.
  - Delete the generation HTML (or move to `trash` table for forensic analysis).
  - Log: "Trashed generation X because user rated 😡. Techniques A, B, C got avoidCount++."
- [ ] **3.3** **Improve path (rating 3)**:
  - Call LLM with the generation HTML + spec + your note (if any) → ask "what 3 specific changes would make this better?"
  - Store improvements as `improvement_suggestions` on the generation record.
  - Next time the Forge Reasoner runs, it sees these suggestions and biases away from the patterns that led to them.
  - The generation stays in "needs improvement" queue, not promoted to templates.
- [ ] **3.4** **Save path (rating 4–5)**:
  - Mark every technique used with `userRating = max(existing, rating)` and `usageCount++`.
  - Promote the generation to `saved_templates` table.
  - Template record includes: name (auto-generated from business name + style), full HTML, StructuredSpec, source generation ID, saved-at timestamp.
- [ ] **3.5** Build `/api/forge/review` POST endpoint — accepts `{ generationId, rating, note }`.
- [ ] **3.6** Build `/api/forge/templates` GET endpoint — lists all saved templates for the UI panel.

### Acceptance criteria
- After rating a generation 😡, the techniques it used get `avoidCount++`.
- After rating 😍🤩, the generation appears in the Saved Templates panel.
- After rating 😐, the LLM returns 3 improvement suggestions visible in the UI.

---

## Phase 4 — Saved Templates Library  *(estimated effort: 0.5 session)*

### Goal
Loved websites become recallable templates you can deploy with swapped info.

### Tasks

- [ ] **4.1** Schema for saved templates:
  ```ts
  interface SavedTemplate {
    id: string;
    name: string;                  // "Cinematic dark hero with serif type"
    sourcePromptIds: string[];     // techniques' origin prompts
    html: string;                  // full rendered HTML
    spec: StructuredSpec;          // for re-rendering with mutations
    savedAt: string;
    userRating: 4 | 5;
    usageCount: number;            // times deployed
    variables: string[];           // ['businessName', 'headline', 'ctaText'] — fields user can swap
  }
  ```
- [ ] **4.2** Build `/api/forge/templates/use` POST — accepts `{ templateId, variables: { businessName, headline, ctaText, ... } }`, re-renders the template with swapped variables, saves as a new website, returns view URL.
- [ ] **4.3** Variables auto-detection: scan the spec for `businessName`, `headline`, `ctaText`, `navItems`, `body` — surface these as editable fields in the UI.
- [ ] **4.4** Templates are searchable by name, filterable by rating, sortable by usageCount.

### Acceptance criteria
- A saved template can be deployed with new business info in <2 seconds.
- The variable list correctly identifies every user-editable field.

---

## Phase 5 — UI Upgrade (Evolution + VA tabs only)  *(estimated effort: 1.5 sessions)*

> **CRITICAL CONSTRAINT**: Per your instruction, the **Recreate tab stays exactly as it is**. Only Evolution and VA tabs get rebuilt.

### 5A — Evolution Tab → "Forge Engine" Control Panel

The Evolution tab currently shows patterns being mutated (palette/font swaps). Replace it with the Forge Engine control panel:

- [ ] **5A.1** **Header section**: "Forge Engine" title, generation count badge, "Auto-forge" toggle (generates one every N seconds), "Forge now" button.
- [ ] **5A.2** **Target input**: text field for business description ("warm coffee shop"), or "🎲 Random" button, or "📸 From image" button (upload screenshot → VLM extracts target spec).
- [ ] **5A.3** **Reasoning trace panel** (left column, real-time):
  - Shows the current generation's plan as it builds:
    ```
    🧠 Reasoning…
    ✓ Picked hero: Aethera's video-bg-fade-rise (rated 5★ by you)
    ✓ Picked stats: Innovation's stat-row (new — exploring)
    ✓ Picked footer: Lithos's dark-band-footer (rated 4★ by you)
    ✓ Mutated: bg #000 → #0a0a0a, Inter → Source Sans 3
    ✓ Overall: combining cinematic hero with editorial stats
    ```
  - Each step streams in as the LLM emits it (use SSE or polling).
- [ ] **5A.4** **Live preview** (right column, top): iframe of the generated HTML, with device-size switcher.
- [ ] **5A.5** **Review bar** (right column, middle): 5 emoji buttons 😡 😕 😐 😍 🤩 + optional note field. Click → submits to `/api/forge/review` → fades to next generation in queue.
- [ ] **5A.6** **Generation history** (right column, bottom): horizontal scroll of last 10 generations as thumbnails, click to re-review or re-open.
- [ ] **5A.7** **Stats strip**: total generated, total saved, total trashed, average rating, top-rated technique this week.

### 5B — VA Tab → "Technique Library" Browser

The VA tab currently shows the virtual artist's "thoughts" stream. Replace it with the technique library browser:

- [ ] **5B.1** **Header section**: "Technique Library" title, total technique count, "extract from new prompt" button, "extract from image" button.
- [ ] **5B.2** **Filter sidebar** (left): partType chips (hero / footer / nav / button / section / background / animation / interaction / 3D / JS), tag chips (cinematic / glassmorphic / minimal / bold / etc.), rating filter (only 4–5★).
- [ ] **5B.3** **Technique grid** (center): cards showing each technique — preview thumbnail (rendered snippet), name, source prompt, rating, usage count. Click → detail drawer.
- [ ] **5B.4** **Detail drawer**: full preview, the spec snippet, the source prompt link, rating buttons (you can rate individual techniques, not just full websites), "use in next forge generation" button.
- [ ] **5B.5** **Saved Templates panel** (right): vertical list of all saved templates from Phase 4. Click → opens preview + "Use this template" action with variable-swap form.
- [ ] **5B.6** **Avoided patterns panel** (bottom): list of techniques you've trashed (avoidCount >= 3). Each has "Restore" button if you change your mind.

### 5C — Visual / interaction polish (both tabs)

- [ ] **5C.1** Real-time streaming: when Forge is generating, the reasoning trace types out token-by-token (use the existing `zaiChatStream` from `zai-client.ts`).
- [ ] **5C.2** Toast notifications: "✓ Generation saved as template", "🗑 Generation trashed — 3 techniques avoided", "💾 Template deployed to /s/xyz".
- [ ] **5C.3** Animated emoji reaction: when you click a rating, the emoji floats up and fades (Framer Motion).
- [ ] **5C.4** Dark mode (the existing UI is already dark — keep it).
- [ ] **5C.5** Mobile-responsive: the 2-column layout collapses to 1 on narrow screens.

### Acceptance criteria
- Evolution tab shows the Forge Engine generating in real-time with visible reasoning.
- VA tab shows every technique in the library, searchable and rateable.
- Saved templates are visible and deployable from the VA tab.
- Recreate tab is **untouched** (verify by diffing against Mark 1).

---

## Phase 6 — Learning Loop  *(estimated effort: 0.5 session)*

### Goal
The system actually gets better over time based on your reviews.

### Tasks

- [ ] **6.1** After every review, re-rank techniques: `score = userRating * 2 - avoidCount * 1.5 + usageCount * 0.3`.
- [ ] **6.2** Forge Reasoner's prompt includes "top 5 highest-scored techniques per partType" as candidates, plus "bottom 5 (avoided)" as negative examples.
- [ ] **6.3** Weekly digest (logged to console + UI banner): "This week: 23 generations, 4 saved as templates, 8 trashed. Top technique: Aethera's hero-video-fade-rise (used 12 times, avg rating 4.5)."
- [ ] **6.4** Improvement suggestions from 😐 reviews feed back into the Forge Reasoner's prompt as "things to avoid" (e.g. "user said 'too much animation' on generation X — reduce animation density").

### Acceptance criteria
- After 20 reviews, the Forge Reasoner's picks visibly shift toward your preferences.
- Trashed techniques stop appearing in new generations.

---

## Phase 7 — Image Input  *(estimated effort: 0.5 session)*

### Goal
You can upload a screenshot and ZenForge learns from it.

### Tasks

- [ ] **7.1** Add "📸 From image" button to Forge Engine control panel.
- [ ] **7.2** Upload flow: drag-drop or file picker → save to `/upload/forge-inspiration/` → call `extractTechniquesFromImage()`.
- [ ] **7.3** VLM prompt: "Analyze this website screenshot. Extract: color palette (hex), fonts (best guess), layout structure (sections in order), hero treatment, footer treatment, notable animations or interactions, overall style tags. Return as JSON."
- [ ] **7.4** Extracted techniques appear in the Technique Library (VA tab) with source = "user upload: filename.png".
- [ ] **7.5** Can also be used as direct inspiration: "Forge now using this image" → biases the Forge Reasoner toward the extracted techniques.

### Acceptance criteria
- Uploading a screenshot adds at least 1 technique to the library.
- The VLM extraction returns structured data (not just prose).

---

## Implementation Order

```
Phase 1 (Technique Library)         ──┐
                                       ├── Phase 2 (Forge Reasoner)
Phase 7 (Image Input) ────────────── ──┘        │
                                                  ▼
                                          Phase 3 (Review System)
                                                  │
                                       ┌──────────┴──────────┐
                                       ▼                     ▼
                                Phase 4 (Templates)   Phase 5A (Evolution UI)
                                       │                     │
                                       ▼                     ▼
                                 Phase 5B (VA UI)     Phase 5C (Polish)
                                       │                     │
                                       └──────────┬──────────┘
                                                  ▼
                                          Phase 6 (Learning Loop)
```

- **Phase 1 + 7** can run in parallel (both feed the technique library).
- **Phase 2** depends on Phase 1 (needs techniques to pick from).
- **Phase 3** depends on Phase 2 (needs generations to review).
- **Phase 4 + 5A + 5B** can run in parallel after Phase 3.
- **Phase 6** is the final loop that ties everything together.

---

## Files to Create / Modify

### New files
- `src/lib/forge/technique-library.ts` — technique schema + extraction + queries
- `src/lib/forge/forge-reasoner.ts` — LLM-driven plan generator
- `src/lib/forge/review-system.ts` — 1–5 emoji rating flow
- `src/lib/forge/saved-templates.ts` — template CRUD
- `src/lib/forge/image-extractor.ts` — VLM-driven screenshot → techniques
- `src/lib/forge/learning-loop.ts` — re-ranking + digest
- `src/app/api/forge/generate/route.ts` — POST: forge a new website
- `src/app/api/forge/review/route.ts` — POST: rate a generation
- `src/app/api/forge/templates/route.ts` — GET list, POST use template
- `src/app/api/forge/learn-image/route.ts` — POST: upload image, extract techniques
- `src/app/api/forge/techniques/route.ts` — GET list techniques
- `src/app/api/forge/status/route.ts` — GET engine status

### Modified files
- `src/app/page.tsx` — rebuild `EvolutionTab()` (→ Forge Engine panel) and `ArtistTab()` (→ Technique Library browser). **RecreateTab stays untouched.**
- `prisma/schema.prisma` — add `ForgeGeneration`, `Technique`, `SavedTemplate`, `ImageInspiration` models.
- `src/lib/supabase-client.ts` — add tables for the above.

### Untouched files (explicitly)
- `src/lib/prompt-recreator.ts` — Mark 1 V2 engine, no changes
- `src/app/api/recreate/route.ts` — Mark 1 endpoint, no changes
- The Recreate tab UI in `page.tsx` — no changes

---

## Check-in Points

Per your instruction "obviously you will check in with me if I like it":

1. **After Phase 1** — show you the technique library stats. "Extracted 340 techniques from 121 prompts + 4 screenshots. Top categories: hero (52), section (48), footer (31). Looks right?"
2. **After Phase 2 (first generation)** — show you the first Forge-generated website + its reasoning trace. "Picked Aethera's hero + Innovation's stats + Lithos's footer. Mutated palette to warm earth tones. Like this direction?"
3. **After Phase 3 (first review)** — confirm the trash/improve/save flows feel right.
4. **After Phase 5 (UI rebuild)** — confirm the Evolution + VA tabs look like what you imagined before saving templates is enabled.

If any check-in gets a "no, this isn't what I meant", we stop and re-plan before continuing.

---

## What Mark 2 Delivers (End State)

When Mark 2 is done:

1. You open the **Evolution tab** (now "Forge Engine").
2. You type "boutique law firm" or hit 🎲 Random or upload a screenshot.
3. The reasoning trace streams in: "Picked hero from prompt X because… picked footer from prompt Y because… mutated colors to…"
4. The live preview shows a unique website — not a copy of any single prompt, but a combination.
5. You rate it 😡😕😐😍🤩.
6. 😡 → trashed, techniques avoided next time.
7. 😐 → LLM suggests 3 improvements, saved for re-forging.
8. 😍 → saved as a template, appears in the **VA tab** (now "Technique Library") under Saved Templates.
9. Next time you can open the VA tab, find your saved template, hit "Use this template", swap the business name/headline/CTA, and deploy.
10. Over time, the engine gets better — it stops picking techniques you've trashed, biases toward techniques you've loved.

This is the reasoning hybrid of Evolution × VA you asked for.

---

## Open Questions (need your input before Phase 2)

1. **Forge generation cadence**: should "Auto-forge" run every 10s, 30s, 60s, or only on-demand? (Default: 30s, configurable in settings.)
2. **Image upload storage**: keep images in `/upload/forge-inspiration/` locally, or push to Supabase Storage? (Default: local for now, Supabase later.)
3. **Template variable scope**: when you "use a saved template", should it swap only `businessName + headline + ctaText`, or also `navItems + body + colors`? (Default: business name + headline + CTA + nav items. Colors stay.)
4. **Review queue limit**: how many pending generations should the queue hold before auto-trashing the oldest? (Default: 50.)
5. **Should the Forge Reasoner have a "creativity" dial** (0 = safe/rated-high-only, 1 = experimental/try-new-techniques)? (Default: 0.5, exposed as a slider in the UI.)

I'll ask these in the next message before starting Phase 2.

---

## Current State

- ✅ Mark 1 committed and tagged (`25db82e`, `mark-1-site-forge`)
- ✅ Live at https://site-forge-two-lake-kappa.vercel.app/
- ⏳ This plan written, awaiting your sign-off before Phase 1 starts
- ❌ No git remote configured (the tag is local only — if you want it on GitHub/GitLab, set up a remote and I'll push)

**Next action**: I'll start Phase 1 (Technique Library) unless you redirect.
