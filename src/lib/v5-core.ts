import { NextRequest, NextResponse } from 'next/server';

/**
 * ZenForge AI — V5 Pro Premium Combinatorial Renderer
 * 8 hero × 6 features × 5 about × 5 gallery × 5 cta × 5 footer × 5 nav × 5 button
 * + 6 testimonials × 5 pricing × 5 faq × 5 stats × 4 partners × 4 blog × 4 team × 4 contact
 * × 12 palettes × 12 typography × 10 biz = 207T unique sites
 */

type Palette = { name: string; bg: string; primary: string; accent: string; dark: string; cream: string; };
type Typography = { name: string; display: string; body: string; accent: string; googleHref: string; };
type Biz = {
  names: string[]; hero: string; sub: string; tagline: string; about: string;
  features: [string, string, string][]; menu: [string, string, string][];
  quote: string; cta: string; images: string[];
};
type Ctx = {
  bn: string; biz: Biz; bt: string; p: Palette; t: Typography;
  imgs: string[]; year: number; ctaText: string; isDark: boolean;
  seed: number; rng: () => number; btnId?: string;
};
type Variant = { id: string; css: (c: Ctx) => string; html: (c: Ctx) => string; js?: (c: Ctx) => string; };

const PALETTES: Palette[] = [
  { name: 'warm-earth', bg: '#F5F0E8', primary: '#3C2415', accent: '#E67E22', dark: '#1A1A1A', cream: '#F5E6D3' },
  { name: 'golden-luxury', bg: '#0A0807', primary: '#D4AF37', accent: '#C0952E', dark: '#0A0807', cream: '#F5E6D3' },
  { name: 'ocean-blue', bg: '#CAF0F8', primary: '#0077B6', accent: '#00B4D8', dark: '#03045E', cream: '#CAF0F8' },
  { name: 'royal-purple', bg: '#240046', primary: '#9D4EDD', accent: '#C77DFF', dark: '#10002B', cream: '#E0AAFF' },
  { name: 'dark-tech', bg: '#0A0A14', primary: '#8B5CF6', accent: '#06B6D4', dark: '#0A0A14', cream: '#E0E0FF' },
  { name: 'vibrant-coral', bg: '#FFF5F5', primary: '#FF6B6B', accent: '#FFD93D', dark: '#1A1A1A', cream: '#FFE0E0' },
  { name: 'forest-green', bg: '#D8F3DC', primary: '#1B4332', accent: '#52B788', dark: '#081C15', cream: '#D8F3DC' },
  { name: 'sunset-orange', bg: '#FFF3E0', primary: '#FB8500', accent: '#FFB703', dark: '#023047', cream: '#FFF3E0' },
  { name: 'monochrome', bg: '#FFFFFF', primary: '#1A1A1A', accent: '#6366F1', dark: '#0A0A0A', cream: '#F5F5F5' },
  { name: 'candy-pink', bg: '#FCE7F3', primary: '#EC4899', accent: '#F472B6', dark: '#831843', cream: '#FCE7F3' },
  { name: 'electric-blue', bg: '#0A0A14', primary: '#06B6D4', accent: '#8B5CF6', dark: '#0A0A14', cream: '#E0E0FF' },
  { name: 'burgundy-wine', bg: '#FFF1F2', primary: '#9F1239', accent: '#E11D48', dark: '#4C0519', cream: '#FFF1F2' },
];

const TYPOGRAPHIES: Typography[] = [
  { name: 'Playfair+Montserrat+Dancing', display: "'Playfair Display', Georgia, serif", body: "'Montserrat', system-ui, sans-serif", accent: "'Dancing Script', cursive", googleHref: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Montserrat:wght@300;400;500;600;700&family=Dancing+Script:wght@500;600;700&display=swap" },
  { name: 'Cormorant+Lato+GreatVibes', display: "'Cormorant Garamond', Georgia, serif", body: "'Lato', system-ui, sans-serif", accent: "'Great Vibes', cursive", googleHref: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lato:wght@300;400;700&family=Great+Vibes&display=swap" },
  { name: 'SpaceGrotesk+Inter', display: "'Space Grotesk', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" },
  { name: 'Anton+Inter', display: "'Anton', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&display=swap" },
  { name: 'DMSerif+Inter', display: "'DM Serif Display', Georgia, serif", body: "'Inter', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap" },
  { name: 'Poppins+Nunito+Pacifico', display: "'Poppins', system-ui, sans-serif", body: "'Nunito', system-ui, sans-serif", accent: "'Pacifico', cursive", googleHref: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Nunito:wght@300;400;600;700&family=Pacifico&display=swap" },
  { name: 'Fraunces+SourceSans3', display: "'Fraunces', Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" },
  { name: 'Syne+Inter', display: "'Syne', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" },
  { name: 'ArchivoBlack+Inter', display: "'Archivo Black', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@300;400;500;600;700&display=swap" },
  { name: 'Merriweather+OpenSans', display: "'Merriweather', Georgia, serif", body: "'Open Sans', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Open+Sans:wght@300;400;500;600;700&display=swap" },
  { name: 'Bricolage+Inter', display: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Inter:wght@300;400;500;600;700&display=swap" },
  { name: 'Outfit+DMSans', display: "'Outfit', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif", accent: "", googleHref: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" },
];

const BIZ_TYPES: Record<string, Biz> = {
  cafe: {
    names: ['Velvet Bean', 'The Golden Bean', 'Brew & Co', 'The Roastery', 'Morning Cup', 'Artisan Cafe', 'The Copper Kettle'],
    hero: 'Where Coffee Meets Craft',
    sub: 'Artisan Roasters · Specialty Brews · Community Hub',
    tagline: 'Eat. Drink. Love.',
    about: 'was born from a simple belief: that a great cup of coffee can transform your day. Our beans are sourced from ethical farms, roasted in small batches, and brewed by hands that genuinely care.',
    features: [
      ['coffee', 'Specialty Coffee', 'Single-origin beans from ethical farms. Fresh roasted weekly in our flagship roastery.'],
      ['pastry', 'Artisan Pastries', 'Fresh-baked every morning by our in-house pastry chef using local, seasonal ingredients.'],
      ['toast', 'Community Hub', 'A welcoming space for remote workers, friends, and neighbors to gather and connect.'],
    ],
    menu: [
      ['1497366216548-37526070297c', 'Espresso Bar', 'Single-origin pours, lattes, cappuccinos'],
      ['1454165804606-c3d57bc86b40', 'Fresh Pastries', 'Croissants, scones, and seasonal bakes'],
      ['1499750310107-5fef28a66643', 'Pour-Over Bar', 'Hand-brewed single-origin selections'],
      ['1521017432531-fbd92d768814', 'Cold Brew', 'Slow-steeped 18 hours, smooth finish'],
    ],
    quote: "A great cup of coffee can transform your day.",
    cta: 'Visit Us',
    images: ['1495474472287-4d71bcdd2085', '1453614512568-c4024d13c247', '1559496417-e7f25cb247f3', '1442512595331-e89e73853f31', '1442975631115-c4f7b05b8a2c', '1495774856032-8b90bbb32b32', '1554118811-1e0d58224f24', '1453614512568-c4024d13c247', '1495474472287-4d71bcdd2085', '1509042239860-f550ce710b93'],
  },
  restaurant: {
    names: ['Saveur', 'La Maison', 'Bella Tavola', 'The Gilded Fork', 'Verde', 'Osaka'],
    hero: 'A Culinary Experience',
    sub: 'Farm-to-table · Seasonal menus · Crafted with passion',
    tagline: 'Taste the difference.',
    about: 'is more than a restaurant — it is a celebration of flavor, craft, and community. Our chef sources ingredients from local farms and transforms them into dishes that surprise and delight.',
    features: [
      ['utensils', 'Seasonal Menu', 'A rotating menu that follows the seasons and the harvest.'],
      ['wine', 'Curated Wine List', 'Hand-selected vintages from small-batch producers.'],
      ['chef', 'Chef\'s Tasting', 'A multi-course journey through the chef\'s imagination.'],
    ],
    menu: [
      ['1414235077428-338989a2e8c0', 'Seasonal Starters', 'Fresh from the farm'],
      ['1551218808-94e220e084d2', 'Main Courses', 'Chef\'s signatures'],
      ['1551024506-0bccd828d307', 'Desserts', 'House-made daily'],
      ['1510812431401-41d2bd2722f3', 'Wine Pairings', 'Curated selections'],
    ],
    quote: "Good food is the foundation of genuine happiness.",
    cta: 'Reserve',
    images: ['1414235077428-338989a2e8c0', '1517248135467-4c7edcad34c4', '1551218808-94e220e084d2', '1559339352-11d035aa65de', '1424847781670-fd4f29ae8f0c', '1551024506-0bccd828d307', '1510812431401-41d2bd2722f3', '1466978913421-dad2ebd01d17'],
  },
  tech: {
    names: ['Apex Studio', 'Lumina', 'Vertex', 'Stellar', 'Forge', 'Nexora'],
    hero: 'Bring Your Vision to Life',
    sub: 'Design · Strategy · Engineering · Results',
    tagline: 'Create. Innovate. Elevate.',
    about: 'combines creativity, strategy, and technology to help ambitious teams ship work that matters. We partner end-to-end — from first sketch to launched product.',
    features: [
      ['code', 'Strategy', 'Research-led positioning, brand, and go-to-market.'],
      ['palette', 'Design', 'Beautiful design systems that scale across every surface.'],
      ['zap', 'Engineering', 'Production-grade web, mobile, and backend applications.'],
    ],
    menu: [
      ['1497366216548-37526070297c', 'Web Design', 'Beautiful & Functional'],
      ['1454165804606-c3d57bc86b40', 'Branding', 'Identity Systems'],
      ['1499750310107-5fef28a66643', 'Development', 'Production-Grade'],
      ['1522071820081-009f0129c71c', 'Strategy', 'Research & Positioning'],
    ],
    quote: "Great design is not just what it looks like — it's how it works.",
    cta: 'Get Started',
    images: ['1497366216548-37526070297c', '1454165804606-c3d57bc86b40', '1499750310107-5fef28a66643', '1486312338219-ce68d2c6f44d', '1551434678-e076c223a692', '1542751371-adc38448a05e', '1460925895917-afdab827c52f', '1521791136064-7986c2920216', '1556761175-5973dc0f32e7', '1497366811353-6870744d04b2'],
  },
  gym: {
    names: ['PowerHouse', 'Iron Forge', 'Apex Fitness', 'The Strength Lab', 'CrossRadius'],
    hero: 'Stronger Every Day',
    sub: 'Personal Training · Group Classes · State-of-the-art Equipment',
    tagline: 'Push. Pull. Progress.',
    about: 'is where champions are made. Our coaches are athletes, our equipment is competition-grade, and our community will push you further than you thought possible.',
    features: [
      ['dumbbell', 'Personal Training', '1-on-1 coaching tailored to your goals and your body.'],
      ['users', 'Group Classes', 'HIIT, yoga, spin, and strength — 50+ classes weekly.'],
      ['heart', 'Recovery Zone', 'Sauna, cold plunge, and massage therapy on-site.'],
    ],
    menu: [
      ['1517836357463-d25dfeac3438', 'Strength Training', 'Free weights & machines'],
      ['1571902943202-507ec2618e8f', 'Group Fitness', '50+ weekly classes'],
      ['1540497077202-7c8a3999166f', 'Personal Training', '1-on-1 coaching'],
      ['1534258936925-c58bed479fcb', 'Recovery', 'Sauna & cold plunge'],
    ],
    quote: "The body achieves what the mind believes.",
    cta: 'Join Now',
    images: ['1517836357463-d25dfeac3438', '1571902943202-7c8a3999166f', '1540497077202-7c8a3999166f', '1534258936925-c58bed479fcb', '1571019613454-1cb2f99b2d8b', '1517963879433-6ad2b056d712', '1549060279-7e168fcee0c2', '1599058917212-d750089bc07e'],
  },
  law: {
    names: ['Beacon Attorneys', 'Sterling Law', 'Crestwell & Associates', 'The Vanguard Firm'],
    hero: 'Counsel You Can Trust',
    sub: 'Corporate · Litigation · Intellectual Property',
    tagline: 'Justice. Diligence. Results.',
    about: 'has built its reputation on relentless advocacy and personal attention. We treat every client as our only client, every case as our most important case.',
    features: [
      ['scale', 'Corporate Law', 'M&A, contracts, governance, and compliance.'],
      ['gavel', 'Litigation', 'Trial-tested advocates in state and federal courts.'],
      ['shield', 'IP Protection', 'Patents, trademarks, and trade secret strategy.'],
    ],
    menu: [
      ['1589994965851-a8f479c573a9', 'Corporate', 'M&A and governance'],
      ['1521587760476-6c12a4b040da', 'Litigation', 'Trial advocacy'],
      ['1450101499163-c8848c66ca85', 'IP Law', 'Patents and trademarks'],
      ['1505664194779-8beaceb93744', 'Employment', 'Workplace matters'],
    ],
    quote: "The law is reason, free from passion.",
    cta: 'Schedule Consultation',
    images: ['1589994965851-a8f479c573a9', '1521587760476-6c12a4b040da', '1450101499163-c8848c66ca85', '1505664194779-8beaceb93744', '1473177104440-ffee2f376098', '1423592707950-ec81a91f2626'],
  },
  dental: {
    names: ['Pearl Dental Studio', 'Bright Smile Dental', 'Lumina Dental Care', 'The Smile Studio'],
    hero: 'Your Best Smile Awaits',
    sub: 'Cosmetic · Family · Emergency Care',
    tagline: 'Healthy smiles, happy lives.',
    about: 'combines gentle care with cutting-edge technology. From routine cleanings to full smile makeovers, we make every visit comfortable and every smile confident.',
    features: [
      ['smile', 'Cosmetic Dentistry', 'Veneers, whitening, and complete smile design.'],
      ['heart', 'Family Care', 'Gentle, friendly care for patients of all ages.'],
      ['plus', 'Emergency Service', 'Same-day appointments for dental emergencies.'],
    ],
    menu: [
      ['1588776814546-1ffcf47267a5', 'Cleaning', 'Routine hygiene'],
      ['1606811841689-23a771ad6654', 'Whitening', 'Brighter smiles'],
      ['1612277795421-9bc730df0461', 'Implants', 'Permanent solutions'],
      ['1629909613654-28e377c37b09', 'Orthodontics', 'Straight teeth'],
    ],
    quote: "A smile is the universal welcome.",
    cta: 'Book Appointment',
    images: ['1588776814546-1ffcf47267a5', '1606811841689-23a771ad6654', '1612277795421-9bc730df0461', '1629909613654-28e377c37b09', '1551601651-2a8555f1a136', '1581585504050-3a150bb4cc48'],
  },
  electrician: {
    names: ['CurrentTech Electric', 'VoltEdge', 'BrightWire Electrical', 'PowerLine Services'],
    hero: 'Powering Your World, Safely',
    sub: 'Licensed · Insured · 24/7 Emergency Service',
    tagline: 'Wired right, the first time.',
    about: 'has been the trusted name in electrical services for over 15 years. From residential rewiring to commercial installations, our licensed electricians deliver safe, code-compliant work.',
    features: [
      ['bolt', 'Residential Wiring', 'Panel upgrades, rewiring, and smart home installs.'],
      ['building', 'Commercial Service', 'Tenant build-outs, maintenance contracts, and code corrections.'],
      ['phone', '24/7 Emergency', 'Round-the-clock response for electrical emergencies.'],
    ],
    menu: [
      ['1621905251189-08b45d6a269e', 'Panel Upgrades', 'Modern electrical panels'],
      ['1581094288338-2314dddb7ece', 'EV Chargers', 'Home charging stations'],
      ['1565607444198-46c42b27c4c6', 'Lighting', 'Indoor and outdoor'],
      ['1517059797802-452f1a4c4c95', 'Inspections', 'Code compliance'],
    ],
    quote: "Safety is no accident.",
    cta: 'Call Now',
    images: ['1621905251189-08b45d6a269e', '1581094288338-2314dddb7ece', '1565607444198-46c42b27c4c6', '1517059797802-452f1a4c4c95', '1565514020179-026b92b84bb6'],
  },
  salon: {
    names: ['Lumiere Salon', 'Bloom Beauty', 'The Strand Studio', 'Verdant Hair Co'],
    hero: 'Where Beauty Meets Artistry',
    sub: 'Cuts · Color · Spa · Bridal',
    tagline: 'Reveal your radiance.',
    about: 'is a sanctuary for self-care. Our master stylists and estheticians blend technical mastery with an artist\'s eye, leaving you looking and feeling your absolute best.',
    features: [
      ['scissors', 'Master Cuts', 'Precision cutting by senior stylists with 10+ years experience.'],
      ['palette', 'Color Artistry', 'Balayage, vivids, and dimensional color tailored to you.'],
      ['sparkles', 'Spa Services', 'Facials, waxing, and lashes in our private spa suite.'],
    ],
    menu: [
      ['1521590832167-7bcbfaa6381f', 'Haircuts', 'Precision styling'],
      ['1560066984-138dadb4c035', 'Color', 'Balayage & vivids'],
      ['1600334129229-707e2e4c2c0c', 'Spa', 'Facials & waxing'],
      ['1633681926022-84c800e0f79c', 'Bridal', 'Wedding packages'],
    ],
    quote: "Beauty begins the moment you decide to be yourself.",
    cta: 'Book Now',
    images: ['1521590832167-7bcbfaa6381f', '1560066984-138dadb4c035', '1600334129229-707e2e4c2c0c', '1633681926022-84c800e0f79c', '1633681926035-ec1ac8ec2c68', '1522335789203-aabd1fc54bc9'],
  },
  plumber: {
    names: ['FlowRight Plumbing', 'AquaPro Services', 'DrainWorks', 'TrustPipe'],
    hero: 'When Water Flows, We\'re There',
    sub: 'Residential · Commercial · 24/7 Emergency',
    tagline: 'Fixing flow, restoring peace.',
    about: 'has kept homes and businesses flowing for 20+ years. From leaky faucets to main line replacements, our master plumbers deliver clean, courteous, code-compliant service.',
    features: [
      ['wrench', 'Repairs', 'Faucets, toilets, disposals — fixed right the first time.'],
      ['droplet', 'Drain Cleaning', 'Hydro-jetting and camera inspection for tough clogs.'],
      ['pipe', 'Repiping', 'Whole-home repiping with minimal disruption.'],
    ],
    menu: [
      ['1585704032915-c140017199cd', 'Drain Cleaning', 'Hydro-jet service'],
      ['1607472586896-edb3bee95f1d', 'Water Heaters', 'Tankless installs'],
      ['1558618666-fcd25c85cd64', 'Repairs', 'Faucets & toilets'],
      ['1607400268515-9b2e4c4c4c8d', 'Emergency', '24/7 response'],
    ],
    quote: "An ounce of prevention is worth a pound of cure.",
    cta: 'Schedule Service',
    images: ['1585704032915-c140017199cd', '1607472586896-edb3bee95f1d', '1558618666-fcd25c85cd64', '1607400268515-9b2e4c4c4c8d'],
  },
  default: {
    names: ['Apex Studio', 'Lumina', 'Vertex', 'Stellar', 'Forge'],
    hero: 'Bring Your Vision to Life',
    sub: 'Design · Strategy · Engineering · Results',
    tagline: 'Create. Innovate. Elevate.',
    about: 'combines creativity, strategy, and technology to help ambitious teams ship work that matters. We partner end-to-end — from first sketch to launched product.',
    features: [
      ['coffee', 'Strategy', 'Research-led positioning, brand, and go-to-market.'],
      ['pastry', 'Design', 'Beautiful design systems that scale across every surface.'],
      ['toast', 'Engineering', 'Production-grade web, mobile, and backend applications.'],
    ],
    menu: [
      ['1497366216548-37526070297c', 'Web Design', 'Beautiful & Functional'],
      ['1454165804606-c3d57bc86b40', 'Branding', 'Identity Systems'],
      ['1499750310107-5fef28a66643', 'Development', 'Production-Grade'],
      ['1522071820081-009f0129c71c', 'Strategy', 'Research & Positioning'],
    ],
    quote: "Great design is not just what it looks like — it's how it works.",
    cta: 'Get Started',
    images: ['1497366216548-37526070297c', '1454165804606-c3d57bc86b40', '1499750310107-5fef28a66643', '1486312338219-ce68d2c6f44d', '1551434678-e076c223a692', '1542751371-adc38448a05e', '1460925895917-afdab827c52f', '1521791136064-7986c2920216', '1556761175-5973dc0f32e7', '1497366811353-6870744d04b2', '1522071820081-009f0129c71c'],
  },
};

function detectBiz(p: string): string {
  const l = (p || '').toLowerCase();
  if (l.match(/cafe|coffee|espresso|latte|brew|roast/)) return 'cafe';
  if (l.match(/electric|wiring|electrical/)) return 'electrician';
  if (l.match(/restaurant|dining|food|chef|bistro|eatery/)) return 'restaurant';
  if (l.match(/gym|fitness|workout|crossfit|training/)) return 'gym';
  if (l.match(/\b(tech|software|startup|saas|app|ai)\b|\bartificial intelligence\b/)) return 'tech';
  if (l.match(/law|legal|attorney|lawyer|litigation/)) return 'law';
  if (l.match(/salon|haircut|beauty|barber|stylist/)) return 'salon';
  if (l.match(/dental|dentist|teeth|orthodont/)) return 'dental';
  if (l.match(/plumb|pipe|drain|sewer/)) return 'plumber';
  return 'default';
}

function pick<T>(a: T[], s: number): T {
  return a[((s % a.length) + a.length) % a.length];
}

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

function isDarkBg(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

function mulberry32(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickImages(pool: string[], seed: number, count: number): string[] {
  const n = Math.min(count, pool.length);
  if (n <= 0) return [];
  const rng = mulberry32(seed ^ 0x9E3779B9);
  const arr = pool.slice();
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

function imgUrl(id: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

// ============================================================================
// SHARED CSS
// ============================================================================
function sharedCss(c: Ctx): string {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:${c.t.body};background:${c.p.bg};color:${c.isDark ? c.p.cream : c.p.primary};line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
.v5-reveal{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}
.v5-visible{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){.v5-reveal{opacity:1;transform:none;transition:none}*{animation:none!important;transition:none!important}}
`;
}

// ============================================================================
// BUTTON VARIANTS (5)
// ============================================================================
const btnSolidPill: Variant = {
  id: 'solid-pill',
  css: (c) => `.v5-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:${c.p.accent};color:#fff;border-radius:99px;font-family:${c.t.body};font-weight:600;font-size:15px;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s}.v5-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px ${c.p.accent}40}`,
  html: () => '',
};
const btnOutlineRect: Variant = {
  id: 'outline-rect',
  css: (c) => `.v5-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:transparent;color:${c.p.primary};border:2px solid ${c.p.primary};border-radius:8px;font-family:${c.t.body};font-weight:600;font-size:15px;cursor:pointer;transition:background .2s,color .2s}.v5-btn:hover{background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'}}`,
  html: () => '',
};
const btnTextArrow: Variant = {
  id: 'text-arrow',
  css: (c) => `.v5-btn{display:inline-flex;align-items:center;gap:6px;padding:12px 0;background:transparent;color:${c.p.accent};border:none;font-family:${c.t.body};font-weight:600;font-size:15px;cursor:pointer;transition:gap .2s}.v5-btn:hover{gap:12px}.v5-btn::after{content:'→'}`,
  html: () => '',
};
const btnGradientFill: Variant = {
  id: 'gradient-fill',
  css: (c) => `.v5-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:linear-gradient(135deg,${c.p.accent},${c.p.primary});color:#fff;border-radius:12px;font-family:${c.t.body};font-weight:600;font-size:15px;border:none;cursor:pointer;transition:transform .2s,filter .2s}.v5-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}`,
  html: () => '',
};
const btnGlass: Variant = {
  id: 'glass',
  css: (c) => `.v5-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:rgba(255,255,255,0.1);backdrop-filter:blur(12px);color:${c.isDark ? c.p.cream : '#fff'};border:1px solid rgba(255,255,255,0.2);border-radius:99px;font-family:${c.t.body};font-weight:600;font-size:15px;cursor:pointer;transition:background .2s,transform .2s}.v5-btn:hover{background:rgba(255,255,255,0.2);transform:translateY(-2px)}`,
  html: () => '',
};
const BUTTON_VARIANTS: Variant[] = [btnSolidPill, btnOutlineRect, btnTextArrow, btnGradientFill, btnGlass];

// ============================================================================
// NAV VARIANTS (5)
// ============================================================================
function navBase(ctx: Ctx): string {
  return `.v5-nav{position:sticky;top:0;z-index:100;background:${ctx.isDark ? ctx.p.dark + 'EE' : ctx.p.bg + 'EE'};backdrop-filter:blur(12px);border-bottom:1px solid ${ctx.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}}.v5-nav-inner{max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}.v5-nav-logo{font-family:${ctx.t.display};font-size:20px;font-weight:700;color:${ctx.p.primary};letter-spacing:-0.02em}.v5-nav-links{display:flex;gap:28px;align-items:center}.v5-nav-link{font-family:${ctx.t.body};font-size:14px;color:${ctx.isDark ? ctx.p.cream + 'CC' : ctx.p.primary + 'CC'};transition:color .2s;cursor:pointer}.v5-nav-link:hover{color:${ctx.p.accent}}@media(max-width:768px){.v5-nav-links{display:none}}`;
}
const navFixedTransparent: Variant = {
  id: 'fixed-transparent', css: navBase,
  html: (c) => `<nav class="v5-nav"><div class="v5-nav-inner"><a class="v5-nav-logo" href="#">${esc(c.bn)}</a><div class="v5-nav-links"><a class="v5-nav-link" href="#about">About</a><a class="v5-nav-link" href="#features">Features</a><a class="v5-nav-link" href="#gallery">Gallery</a><a class="v5-nav-link" href="#contact">Contact</a><button class="v5-btn">${esc(c.ctaText)}</button></div></div></nav>`,
};
const navSolidBar: Variant = {
  id: 'solid-bar',
  css: (c) => navBase(c) + `.v5-nav{background:${c.p.primary};border-bottom:none}.v5-nav-logo{color:${c.isDark ? c.p.cream : '#fff'}}.v5-nav-link{color:rgba(255,255,255,0.7)}.v5-nav-link:hover{color:#fff}`,
  html: (c) => `<nav class="v5-nav"><div class="v5-nav-inner"><a class="v5-nav-logo" href="#">${esc(c.bn)}</a><div class="v5-nav-links"><a class="v5-nav-link" href="#about">About</a><a class="v5-nav-link" href="#features">Features</a><a class="v5-nav-link" href="#gallery">Gallery</a><a class="v5-nav-link" href="#contact">Contact</a><button class="v5-btn">${esc(c.ctaText)}</button></div></div></nav>`,
};
const navFloatingPill: Variant = {
  id: 'floating-pill',
  css: (c) => `.v5-nav-wrap{padding:16px 24px;position:sticky;top:0;z-index:100}.v5-nav{max-width:1100px;margin:0 auto;background:${c.isDark ? c.p.dark : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};border-radius:99px;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 20px rgba(0,0,0,0.08)}${navBase(c).replace('.v5-nav{position:sticky;top:0;z-index:100;', '').replace('.v5-nav-inner{max-width:1200px;margin:0 auto;padding:16px 24px;', '')}`,
  html: (c) => `<div class="v5-nav-wrap"><nav class="v5-nav"><a class="v5-nav-logo" href="#">${esc(c.bn)}</a><div class="v5-nav-links"><a class="v5-nav-link" href="#about">About</a><a class="v5-nav-link" href="#features">Features</a><a class="v5-nav-link" href="#gallery">Gallery</a><button class="v5-btn">${esc(c.ctaText)}</button></div></nav></div>`,
};
const navCenteredSplit: Variant = {
  id: 'centered-split',
  css: (c) => navBase(c) + `.v5-nav-inner{flex-direction:column;gap:12px;padding:20px 24px}.v5-nav-links{gap:32px}`,
  html: (c) => `<nav class="v5-nav"><div class="v5-nav-inner"><a class="v5-nav-logo" href="#">${esc(c.bn)}</a><div class="v5-nav-links"><a class="v5-nav-link" href="#about">About</a><a class="v5-nav-link" href="#features">Features</a><a class="v5-nav-link" href="#gallery">Gallery</a><a class="v5-nav-link" href="#contact">Contact</a></div><button class="v5-btn">${esc(c.ctaText)}</button></div></nav>`,
};
const navSideDrawer: Variant = {
  id: 'side-drawer',
  css: (c) => navBase(c) + `.v5-nav-mobile{display:none}@media(max-width:768px){.v5-nav-links{display:none}.v5-nav-mobile{display:block}}`,
  html: (c) => `<nav class="v5-nav"><div class="v5-nav-inner"><a class="v5-nav-logo" href="#">${esc(c.bn)}</a><div class="v5-nav-links"><a class="v5-nav-link" href="#about">About</a><a class="v5-nav-link" href="#features">Features</a><a class="v5-nav-link" href="#gallery">Gallery</a><a class="v5-nav-link" href="#contact">Contact</a><button class="v5-btn">${esc(c.ctaText)}</button></div><div class="v5-nav-mobile"><button class="v5-btn">Menu</button></div></div></nav>`,
};
const NAV_VARIANTS: Variant[] = [navFixedTransparent, navSolidBar, navFloatingPill, navCenteredSplit, navSideDrawer];

export { PALETTES, TYPOGRAPHIES, BIZ_TYPES, detectBiz, mulberry32, pickImages, imgUrl, esc, isDarkBg, sharedCss, BUTTON_VARIANTS, NAV_VARIANTS, type Ctx, type Variant, type Palette, type Typography, type Biz };
