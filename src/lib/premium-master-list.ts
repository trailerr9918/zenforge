/**
 * Premium Website Master List
 * ============================
 *
 * The definitive guide to what makes a premium website.
 * Used as the review criteria for the Virtual Artist's strict AI reviewer.
 *
 * A truly premium website executes 10-15 of these with flawless polish,
 * consistent visual language, and sub-2-second load times.
 * Quality of execution beats quantity of features.
 */

export const PREMIUM_MASTER_LIST = `# PREMIUM WEBSITE MASTER LIST — 15 Categories, 100+ Features

## 1. GLOBAL ARCHITECTURE & LAYOUT
- CSS Grid / Flexbox systems — complex asymmetric layouts
- Container queries — component-level responsiveness
- Fluid spacing scale — continuous scaling, not just breakpoints
- Max-width containers with generous side padding (breathing room)
- Z-index management system — layers for modals, nav, overlays
- Sticky/Fixed elements — persistent navigation, sidebars, CTAs
- Full-bleed sections alternating with contained sections
- Split-screen layouts — 50/50 text and visual
- Offset/Overlapping grids — elements breaking the container
- Custom scrollbars — styled to match the brand

## 2. PRE-ENTRY & LOADING
- Preloader/Intro animation — brand reveal, not just a spinner
- Progressive loading — skeleton screens for content
- Lazy loading — images, videos, iframes with blur-up placeholders
- Page transition animations — smooth exits and entrances

## 3. NAVIGATION (HEADER)
- Sticky/Fixed header — hides on scroll down, reveals on scroll up
- Transparent-to-solid transition — glassmorphism or blur backdrop
- Mega menu — multi-column with images/icons
- Full-screen overlay menu — for minimal aesthetics
- Hamburger animation — custom SVG morphing
- Active section indicator — scrollspy highlighting current section
- Search overlay — command palette style (Cmd+K)
- Breadcrumb navigation — for deep pages

## 4. HERO SECTION VARIANTS
- Full-viewport hero — 100vh with centered content
- Video background hero — ambient looping video
- Split hero — text left, visual right
- Text-only typographic hero — massive display type
- Scroll-triggered video hero — plays as you scroll
- Interactive mouse hero — elements follow cursor, parallax layers
- Gradient/mesh gradient backgrounds — animated color flows
- Particle systems — subtle ambient movement

## 5. TYPOGRAPHY SYSTEM
- Custom/Variable fonts — unique typefaces
- Fluid typography — clamp() for responsive scaling
- Display headings — oversized, tight leading, negative letter-spacing
- Body text hierarchy — clear H1→H6 with distinct treatments
- Text reveal animations — line-by-line or word-by-word fade-ins
- Kinetic/Marquee text — infinite scrolling headlines
- Mixed typography — serif + sans-serif pairing

## 6. VISUAL MEDIA & TREATMENTS
- High-resolution photography — retina/4K optimized
- Cinematic video — background, inline, and lightbox
- SVG illustrations — scalable, animatable graphics
- Micro-animations — icons that animate on hover
- Parallax layers — foreground/background moving at different speeds
- Image hover zoom — subtle scale transforms
- Color grading consistency — unified photo treatment

## 7. CONTENT SECTIONS
- About/Story — narrative with timeline or milestones
- Services/Features — icon-based cards with hover lifts
- Process/How it works — numbered steps, connected with lines
- Portfolio/Work — masonry, grid, or horizontal scroll with filtering
- Team/People — portrait cards with bio expansions
- Pricing — tiered cards with highlighted "recommended" plan
- Stats/Counters — animated numbers that count up on scroll
- Clients/Logos — grayscale-to-color hover, infinite marquee
- FAQ — accordion with smooth height transitions
- Blog/News — editorial card layouts, featured posts

## 8. SOCIAL PROOF & TRUST
- Testimonials — slider, grid, or marquee with star ratings and photos
- Trust badges — security seals, certifications, awards
- Case study results — metrics, ROI data

## 9. INTERACTIVE ELEMENTS & MICRO-INTERACTIONS
- Magnetic buttons — elements attract to cursor on proximity
- Custom cursor — branded dot, ring, or contextual icons
- Hover states — underline animations, color shifts, image swaps
- Scroll-triggered reveals — fade, slide, scale, blur-in
- Horizontal scroll sections — pinning vertical scroll to move sideways
- Sticky stacking cards — cards stack on top of each other
- Progress indicators — reading progress bar, scroll percentage
- Back-to-top button — appears after scrolling, smooth scroll
- Toast notifications — success/error messages
- Drawers/Modals — slide-out panels for forms/details

## 10. FORMS & INPUT EXPERIENCES
- Contact forms — with validation
- Newsletter signup — minimal inline or modal popup
- Custom form styling — floating labels, custom checkboxes/radio
- Input animations — border draws, label transitions
- Success states — confirmation animations, thank you messages
- Error handling — inline validation, shake animations

## 11. E-COMMERCE SPECIFIC (if applicable)
- Product cards — quick view, wishlist, color swatches
- Cart drawer — slide-out without leaving page
- Related products — algorithmic or manual upsells

## 12. ADVANCED JAVASCRIPT EFFECTS
- Smooth scroll library — Lenis
- GSAP animations — timelines, staggers, scrubbing
- Three.js / WebGL — 3D scenes, shaders, particle systems
- SVG path animations — line drawing, morphing shapes
- Intersection Observer API — performant scroll detection

## 13. TECHNICAL POLISH
- Dark/Light mode toggle — system preference detection
- Reduced motion support — prefers-reduced-motion respect
- Accessibility (WCAG AA/AAA) — screen reader support, ARIA labels
- SEO markup — Schema.org, Open Graph, Twitter Cards
- Performance — Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- Cookie consent — GDPR/CCPA compliant banner
- 404 page — custom designed with navigation help

## 14. FOOTER (The "Mega Footer")
- Multi-column layout — sitemap, services, contact, social
- Newsletter capture — final conversion opportunity
- Social links — with hover animations
- Address/contact info — with clickable phone/email
- Legal links — Privacy, Terms, Accessibility, Sitemap
- Copyright — with dynamic year
- Back to top — integrated into footer or floating

## 15. THE "INVISIBLE" PREMIUM DETAILS
- Custom 404/500 pages — on-brand error experiences
- Loading skeletons — instead of spinners
- Empty states — beautiful "no results" illustrations
- Copy-to-clipboard — for code, addresses, links
- Print stylesheets — for clean printing
- Search functionality — instant, fuzzy search across content

---

REVIEW RULES (for the strict AI reviewer):
- Score each category 0-2 (0=missing, 1=present but weak, 2=well-executed)
- Maximum score: 30 (15 categories × 2)
- Minimum passing score: 22/30 (73%)
- If score < 22: REJECT and list specific improvements needed
- If score ≥ 22: PASS and send to Evolution
- A website must have REAL CONTENT (not lorem ipsum)
- A website must have REAL INTERACTIONS (not just static HTML)
- A website must NOT have infinite loading (preloader must hide)
- A website must be mobile responsive
- A website must use custom fonts (not system fonts)`;

/**
 * The strict AI review prompt used by the Virtual Artist's review subprocess.
 * This is sent to Mistral to evaluate generated websites.
 */
export const STRICT_REVIEW_PROMPT = `You are ZenForge's Strict AI Reviewer — a ruthless perfectionist that evaluates generated websites.

Your job: Read the HTML code of a generated website and score it against the PREMIUM MASTER LIST.

${PREMIUM_MASTER_LIST}

SCORING:
- Score each of the 15 categories 0-2 points
- 0 = Missing or broken
- 1 = Present but weak/generic
- 2 = Well-executed, premium quality
- Maximum: 30 points
- Passing threshold: 22/30

OUTPUT FORMAT (JSON only):
{
  "score": <number 0-30>,
  "passed": <boolean>,
  "categoryScores": {
    "layout": <0-2>,
    "loading": <0-2>,
    "navigation": <0-2>,
    "hero": <0-2>,
    "typography": <0-2>,
    "media": <0-2>,
    "content": <0-2>,
    "socialProof": <0-2>,
    "interactions": <0-2>,
    "forms": <0-2>,
    "ecommerce": <0-2>,
    "jsEffects": <0-2>,
    "technical": <0-2>,
    "footer": <0-2>,
    "invisibleDetails": <0-2>
  },
  "issues": ["specific issue 1", "specific issue 2", ...],
  "improvements": ["specific improvement 1", "specific improvement 2", ...],
  "verdict": "PASS" | "REJECT"
}

BE RUTHLESS:
- Generic AI slop = 0 points
- Lorem ipsum = 0 points for content
- Missing preloader timeout = 0 points for loading
- No scroll animations = 0 points for interactions
- System fonts = 0 points for typography
- Missing footer = 0 points for footer
- Not responsive = automatic REJECT

Return ONLY the JSON.`;
