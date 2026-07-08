# Premium Video & 3D Effect Resources for ZenForge

## Research Summary
This document catalogs packages, libraries, and resources for adding premium video backgrounds and 3D interactive effects to ZenForge-generated websites.

---

## 1. Animation Libraries (CDN-installable, no build step)

### GSAP (GreenSock Animation Platform)
- **What**: Industry-standard animation library. Used by award-winning websites.
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`
- **Use case**: ScrollTrigger animations, timeline sequences, morphing, text animations
- **Integration**: Add `<script src="...">` in generated HTML, no npm install needed
- **License**: Free for most uses (Club GreenSock for advanced plugins)
- **Example**: `gsap.from('.hero h1', { y: 100, opacity: 0, duration: 1, ease: 'power3.out' })`

### Lenis (Smooth Scroll)
- **What**: Lightweight smooth scrolling library. Creates buttery-smooth scroll feel.
- **CDN**: `https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js`
- **Use case**: Premium smooth scrolling, parallax effects, scroll-driven animations
- **Integration**: Add script, init with `new Lenis()`, use with GSAP ScrollTrigger
- **License**: MIT (free)

### Anime.js
- **What**: Lightweight animation library, simpler than GSAP
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js`
- **Use case**: SVG animations, number counters, staggered reveals
- **License**: MIT (free)

---

## 2. 3D Libraries (CDN-installable)

### Three.js
- **What**: Full 3D rendering library. Creates interactive 3D scenes, particles, shaders.
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- **Use case**: 3D hero backgrounds, particle systems, wave effects, gradient orbs
- **Integration**: Add script, create scene/camera/renderer, animate with requestAnimationFrame
- **License**: MIT (free)
- **Example effects**: Floating particles, gradient waves, 3D text, morphing shapes

### OGL (Minimal WebGL)
- **What**: Minimalist WebGL library, simpler than Three.js
- **CDN**: `https://unpkg.comogl@0.0.92/dist/ogl.umd.js`
- **Use case**: Lightweight 3D effects, shader backgrounds
- **License**: MIT (free)

---

## 3. CSS-Only 3D Effects (No libraries needed)

### CSS 3D Transforms
- `transform: perspective(1000px) rotateY(45deg) rotateX(15deg)`
- `transform-style: preserve-3d`
- `backface-visibility: hidden`
- **Use case**: Card flip effects, 3D hover tilts, perspective hero sections

### CSS Particles
- Pure CSS animated particles using `::before`/`::after` pseudo-elements
- CSS keyframe animations for floating, rotating, pulsing
- **Use case**: Ambient background effects without JavaScript

### CSS Gradient Mesh
- `background: radial-gradient(circle at 20% 50%, color1, transparent), radial-gradient(circle at 80% 80%, color2, transparent)`
- Animated with `@keyframes` shifting background-position
- **Use case**: Aurora backgrounds, premium hero sections

---

## 4. Premium Video Sources (Alternatives to CloudFront)

### Coverr (coverr.co)
- **What**: Free HD/4K stock videos for websites
- **URL**: https://coverr.co
- **License**: Free for commercial use, no attribution required
- **Use case**: Hero backgrounds, section dividers, CTA backgrounds
- **Categories**: Nature, Tech, Abstract, Business, City, Food

### Pexels Videos (pexels.com/videos)
- **What**: Free stock videos, large library
- **URL**: https://www.pexels.com/videos/
- **License**: Free for commercial use
- **API**: Available (free API key)
- **Use case**: Varied video backgrounds

### Mixkit (mixkit.co)
- **What**: Free stock videos, music, templates
- **URL**: https://mixkit.co/free-stock-video/
- **License**: Free for commercial use (with attribution for some)
- **Use case**: Video backgrounds, transitions

### Pixabay Videos (pixabay.com/videos)
- **What**: Free stock videos and animations
- **URL**: https://pixabay.com/videos/
- **License**: Pixabay License (free for commercial use, no attribution)
- **API**: Available (free API key)
- **Use case**: Nature, tech, abstract video backgrounds

### Videvo (videvo.net)
- **What**: Free and premium stock videos
- **URL**: https://www.videvo.net
- **License**: Mixed (free with attribution, or premium)
- **Use case**: High-quality 4K video backgrounds

---

## 5. Implementation Strategy for ZenForge

### Phase 1: CSS-Only Effects (Immediate)
Add these to the premium generation prompt so every website includes them:
- CSS gradient mesh backgrounds (aurora effect)
- CSS 3D card transforms on hover
- CSS particle animations
- CSS scroll progress bar

### Phase 2: GSAP + Lenis (CDN)
Add GSAP and Lenis CDN scripts to generated HTML:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
```
This gives every generated website:
- Professional scroll-triggered animations
- Buttery smooth scrolling
- Timeline-based hero animations
- Parallax effects

### Phase 3: Three.js 3D Effects (CDN)
For tech/startup websites, add Three.js for:
- Particle systems in hero backgrounds
- 3D gradient orbs
- Wave/liquid effects
- Interactive 3D objects on hover

### Phase 4: Video URL Pool Expansion
- Fetch video URLs from Pexels/Pixabay APIs
- Build a pool of 50+ categorized video URLs
- Auto-select appropriate videos based on business type
- Allow users to upload their own videos

---

## 6. Recommended CDN Snippets for Premium Generation

### GSAP + ScrollTrigger + Lenis (add to <head> of generated HTML)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
```

### Three.js (add for 3D effects)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

### Initialization Pattern
```javascript
// Smooth scroll
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Hero animation
gsap.from('.hero-content > *', { y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out' });

// Section reveals
gsap.utils.toArray('section').forEach(section => {
  gsap.from(section.querySelectorAll('.reveal'), {
    scrollTrigger: { trigger: section, start: 'top 80%' },
    y: 40, opacity: 0, duration: 0.8, stagger: 0.1
  });
});
```

---

## Conclusion
The fastest path to premium quality is:
1. **Immediately**: Add CSS-only effects (gradient mesh, 3D transforms) to the prompt
2. **Next**: Add GSAP + Lenis CDN scripts to every generated website
3. **Then**: Add Three.js for tech/startup sites
4. **Finally**: Expand video URL pool with Pexels/Pixabay API integration
