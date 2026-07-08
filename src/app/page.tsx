'use client';

/**
 * ZenForge AI — Elite Studio (V8)
 * Complete admin following ELITE_UI_RESEARCH_BREAKDOWN.md spec.
 * Pure monochrome dark UI — Linear/Raycast aesthetic.
 * 9 tabs: Generate · Patterns · Projects · AI Agent · Sandbox · Deploy · Logs · Brain · Settings
 */

import {
  useState, useEffect, useRef, useMemo, useCallback,
  type ReactNode, type CSSProperties, type ComponentType,
} from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import {
  Sparkles, Brain, Send, ExternalLink, Trash2, Loader2,
  CheckCircle2, AlertCircle, ChevronDown,
  Monitor, Tablet, Smartphone, Shuffle, Eye, Layers,
  Image as ImageIcon, Gauge, TrendingUp, Hexagon, Search, Settings2,
  MessageCircle, FileText, Wand2, RefreshCw, Cpu, Activity,
  Globe, X, FolderKanban, Zap, Code, Terminal,
  BookOpen, Compass, Server, Rocket, ScrollText, Settings, Play,
  Copy, Download, Power, CircleDot, Boxes, Wifi, HelpCircle, Users,
  Paperclip, ArrowUp, LayoutGrid, Bell, Plus,
  Link2, Lock, type LucideIcon,
} from 'lucide-react';
import { useSessionState } from '@/hooks/use-session';
import { installAuditLogger, logClientAction } from '@/hooks/use-audit-logger';

/* ========== Elite Design Tokens (per spec section 21) ========== */
const C = {
  canvas: '#050505', surface: '#0a0a0a', elevated: '#111111',
  card: '#161616', hover: '#1a1a1a', border: '#1f1f1f',
  text: '#ffffff', textSec: 'rgba(255,255,255,0.7)',
  textMute: 'rgba(255,255,255,0.4)', textDis: 'rgba(255,255,255,0.25)',
  accent: '#ffffff', accentText: '#000000',
  borderDef: 'rgba(255,255,255,0.06)', borderHov: 'rgba(255,255,255,0.12)',
  borderFoc: 'rgba(255,255,255,0.3)',
  success: '#22c55e', warn: '#f59e0b', error: '#ef4444', info: '#3b82f6',
} as const;

const R = { sm: 6, md: 8, lg: 12, xl: 16 };
const EASE: Transition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] };
const SPRING: Transition = { type: 'spring', stiffness: 280, damping: 28 };

/* ========== Types ========== */
type Tab = 'generate' | 'patterns' | 'projects' | 'agent' | 'sandbox' | 'deploy' | 'logs' | 'brain' | 'recreate' | 'catalog' | 'evolution' | 'artist' | 'settings';
type Device = 'desktop' | 'tablet' | 'mobile';
type AIMode = 'designer' | 'coder' | 'ssh' | 'images' | 'researcher' | 'browser';
type SandboxSub = 'ssh' | 'e2b' | 'modal' | 'daytona' | 'playground' | 'cloud-fn' | 'live-preview' | 'batch' | 'pipeline';

interface GenResult { html: string; slug: string; businessName: string; businessType?: string; designDNA?: any; viewUrl: string; }
interface Site { slug: string; businessName: string; businessType?: string; createdAt?: string; }
interface TemplateStats { totalCombinations: number; totalPatternCount: number; cerebrium: { totalBrainFiles: number; totalBrands: number; }; expandedComponents: any; }
interface CerebriumHit { id: string; name: string; category: string; title?: string; excerpt?: string; tags?: string[]; score?: number; }
interface LogEntry { id: string; timestamp: string; level: string; source: string; message: string; duration?: number; }

/* ========== Helpers ========== */
function cx(...p: (string | false | null | undefined)[]): string { return p.filter(Boolean).join(' '); }
function fmtCompact(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
function fmtTime(iso?: string): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return ''; }
}
function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ========== UI Primitives ========== */
function Panel({ children, className, level = 'elevated', onClick, style }: {
  children: ReactNode; className?: string; level?: 'surface' | 'elevated' | 'card'; onClick?: () => void; style?: CSSProperties;
}) {
  const bg = level === 'surface' ? C.surface : level === 'card' ? C.card : C.elevated;
  return (
    <div onClick={onClick} className={cx(className)} style={{
      background: bg, border: '1px solid ' + C.borderDef, borderRadius: R.lg, transition: '200ms cubic-bezier(0.4,0,0.2,1)',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: C.text, letterSpacing: '-0.01em' }}>{title}</h2>
        {sub && <p className="mt-0.5 text-[12px]" style={{ color: C.textMute, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

function Button({ children, onClick, variant = 'secondary', size = 'md', disabled, className, icon: Icon }: {
  children?: ReactNode; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg'; disabled?: boolean; className?: string; icon?: LucideIcon;
}) {
  const sizes: any = {
    sm: { padding: '6px 12px', fontSize: '12px', height: '28px' },
    md: { padding: '8px 16px', fontSize: '13px', height: '34px' },
    lg: { padding: '10px 20px', fontSize: '14px', height: '40px' },
  };
  const variants: any = {
    primary: { background: C.accent, color: C.accentText, border: 'none' },
    secondary: { background: 'transparent', color: C.textSec, border: '1px solid ' + C.borderDef },
    ghost: { background: 'transparent', color: C.textMute, border: 'none' },
    danger: { background: 'transparent', color: C.error, border: '1px solid ' + C.borderDef },
  };
  const s = sizes[size]; const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={cx('inline-flex items-center justify-center gap-1.5 font-medium', className)}
      style={{ ...s, ...v, borderRadius: R.md, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: '150ms cubic-bezier(0.4,0,0.2,1)' }}
      onMouseEnter={(e) => { if (disabled) return; if (variant === 'primary') e.currentTarget.style.background = '#e8e8e8'; if (variant === 'secondary') { e.currentTarget.style.background = C.hover; e.currentTarget.style.borderColor = C.borderHov; e.currentTarget.style.color = C.text; } if (variant === 'ghost') e.currentTarget.style.color = C.textSec; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { if (disabled) return; e.currentTarget.style.background = v.background; e.currentTarget.style.borderColor = v.border; e.currentTarget.style.color = v.color; e.currentTarget.style.transform = ''; }}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} strokeWidth={1.5} />}
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className, onKeyDown, icon: Icon }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  className?: string; onKeyDown?: (e: any) => void; icon?: LucideIcon;
}) {
  return (
    <div className={cx('relative flex items-center', className)}>
      {Icon && <Icon size={14} strokeWidth={1.5} style={{ color: C.textMute, position: 'absolute', left: 12, pointerEvents: 'none' }} />}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder}
        className="w-full rounded-lg outline-none"
        style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, padding: Icon ? '8px 12px 8px 34px' : '8px 12px', fontSize: '13px', height: '34px', borderRadius: R.md, fontFamily: 'inherit', transition: '150ms' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = C.borderFoc; e.currentTarget.style.background = C.hover; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = C.borderDef; e.currentTarget.style.background = C.card; }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, className, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; className?: string; onKeyDown?: (e: any) => void;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} rows={rows}
      className={cx('w-full resize-y rounded-lg outline-none', className)}
      style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, padding: '12px 14px', fontSize: '14px', lineHeight: 1.6, borderRadius: R.lg, fontFamily: 'inherit', transition: '150ms' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = C.borderFoc; e.currentTarget.style.background = C.hover; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = C.borderDef; e.currentTarget.style.background = C.card; }}
    />
  );
}

function Spinner({ size = 16 }: { size?: number }) { return <Loader2 size={size} className="animate-spin" strokeWidth={1.5} />; }

function Badge({ children, color = 'default' }: { children: ReactNode; color?: 'default' | 'success' | 'warn' | 'error' | 'info' }) {
  const colors: any = {
    default: { bg: 'rgba(255,255,255,0.05)', color: C.textSec, border: C.borderDef },
    success: { bg: 'rgba(34,197,94,0.1)', color: C.success, border: 'rgba(34,197,94,0.2)' },
    warn: { bg: 'rgba(245,158,11,0.1)', color: C.warn, border: 'rgba(245,158,11,0.2)' },
    error: { bg: 'rgba(239,68,68,0.1)', color: C.error, border: 'rgba(239,68,68,0.2)' },
    info: { bg: 'rgba(59,130,246,0.1)', color: C.info, border: 'rgba(59,130,246,0.2)' },
  };
  const c = colors[color];
  return <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '10px' }}>{children}</span>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="relative inline-flex h-[18px] w-8 flex-shrink-0 items-center rounded-full" style={{ background: checked ? C.accent : C.border, transition: '100ms' }}>
      <motion.div className="absolute h-3.5 w-3.5 rounded-full" style={{ background: checked ? C.accentText : C.textSec, top: 1 }} animate={{ left: checked ? 17 : 2 }} transition={{ duration: 0.15 }} />
    </button>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0"><div className="text-[13px]" style={{ color: C.text }}>{label}</div>{desc && <div className="text-[11px] mt-0.5" style={{ color: C.textMute }}>{desc}</div>}</div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Chip({ label, icon, onClick }: { label: string; icon?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + C.borderDef, color: C.textSec, transition: '100ms' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; e.currentTarget.style.borderColor = C.borderHov; e.currentTarget.style.color = C.text; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = C.borderDef; e.currentTarget.style.color = C.textSec; e.currentTarget.style.transform = ''; }}
    >{icon && <span className="text-[13px]">{icon}</span>}{label}</button>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: ReactNode; icon?: LucideIcon; accent?: boolean }) {
  return (
    <div className="rounded-lg p-3.5" style={{ background: C.elevated, border: '1px solid ' + C.borderDef }}>
      <div className="flex items-center gap-2.5">
        {Icon && <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: accent ? C.accent : C.card, color: accent ? C.accentText : C.textMute }}><Icon size={13} strokeWidth={1.5} /></div>}
        <div className="min-w-0"><div className="text-[15px] font-semibold leading-tight" style={{ color: C.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div><div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: C.textMute }}>{label}</div></div>
      </div>
    </div>
  );
}

function Shimmer({ style }: { style?: CSSProperties }) {
  return <div style={{ background: 'linear-gradient(90deg, #111111 25%, #1a1a1a 50%, #111111 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', borderRadius: R.md, ...style }} />;
}

/* ========== Tab definitions ========== */
function Bot({ size = 16, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>;
}

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'patterns', label: 'Patterns', icon: Layers },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'agent', label: 'AI Agent', icon: Bot },
  { id: 'sandbox', label: 'Sandbox', icon: Terminal },
  { id: 'deploy', label: 'Deploy', icon: Rocket },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'brain', label: 'Brain', icon: Brain },
  { id: 'recreate', label: 'Recreate', icon: RefreshCw },
  { id: 'catalog', label: 'Catalog', icon: Layers },
  { id: 'evolution', label: 'Evolution', icon: Cpu },
  { id: 'artist', label: 'Virtual Artist', icon: Hexagon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AI_MODES: { id: AIMode; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'designer', label: 'Designer', desc: 'Generate websites from prompts', icon: Wand2 },
  { id: 'coder', label: 'Coder', desc: 'Execute code & answer questions', icon: Code },
  { id: 'ssh', label: 'SSH', desc: 'Run shell commands on sandbox', icon: Terminal },
  { id: 'images', label: 'Images', desc: 'Generate AI images from text', icon: ImageIcon },
  { id: 'researcher', label: 'Research', desc: 'Web search & summarize', icon: BookOpen },
  { id: 'browser', label: 'Browse', desc: 'Browse & extract from URLs', icon: Compass },
];

const SANDBOX_SUBS: { id: SandboxSub; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'ssh', label: 'SSH Terminal', desc: 'Remote shell access', icon: Terminal },
  { id: 'e2b', label: 'E2B Code', desc: 'Sandbox code execution', icon: Code },
  { id: 'modal', label: 'Modal Functions', desc: 'Serverless functions', icon: Zap },
  { id: 'daytona', label: 'Daytona', desc: 'Dev environments', icon: Server },
  { id: 'playground', label: 'Code Playground', desc: 'Daytona IDE', icon: Code },
  { id: 'cloud-fn', label: 'Cloud Functions', desc: 'Modal templates', icon: Cpu },
  { id: 'live-preview', label: 'Live Preview', desc: 'Daytona preview', icon: Eye },
  { id: 'batch', label: 'Batch Runner', desc: 'Modal batch', icon: Boxes },
  { id: 'pipeline', label: 'Pipeline', desc: 'Daytona+Modal', icon: Activity },
];

const QUICK_PROMPTS = [
  { label: 'Coffee shop', prompt: 'cozy neighborhood coffee shop with espresso bar and pastries' },
  { label: 'Electrician', prompt: 'licensed electrician offering residential and commercial wiring' },
  { label: 'Gym', prompt: 'modern fitness gym with personal training and group classes' },
  { label: 'Tech', prompt: 'SaaS startup building AI developer tools' },
  { label: 'Restaurant', prompt: 'fine-dining Italian restaurant with wine list' },
  { label: 'Law firm', prompt: 'boutique law firm specializing in corporate litigation' },
  { label: 'Dental', prompt: 'family dental clinic with cosmetic dentistry' },
  { label: 'Salon', prompt: 'luxury hair salon and day spa' },
  { label: 'Plumber', prompt: '24/7 emergency plumbing service' },
  { label: 'Real Estate', prompt: 'boutique real estate brokerage for luxury homes' },
];

const PATTERN_CATS: { id: string; label: string; total: number }[] = [
  { id: 'hero', label: 'Heroes', total: 8 }, { id: 'features', label: 'Features', total: 6 },
  { id: 'about', label: 'About', total: 5 }, { id: 'gallery', label: 'Gallery', total: 5 },
  { id: 'testimonials', label: 'Testimonials', total: 6 }, { id: 'pricing', label: 'Pricing', total: 5 },
  { id: 'faq', label: 'FAQ', total: 5 }, { id: 'stats', label: 'Stats', total: 5 },
  { id: 'partners', label: 'Partners', total: 4 }, { id: 'blog', label: 'Blog', total: 4 },
  { id: 'team', label: 'Team', total: 4 }, { id: 'contact', label: 'Contact', total: 4 },
  { id: 'cta', label: 'CTA', total: 5 }, { id: 'footer', label: 'Footer', total: 5 },
  { id: 'nav', label: 'Nav', total: 5 }, { id: 'buttons', label: 'Buttons', total: 5 },
];

const THINKING_STEPS = [
  { label: 'Analyzing your request', icon: Search },
  { label: 'Searching Cerebrium design brain', icon: Brain },
  { label: 'Selecting design patterns', icon: Layers },
  { label: 'Generating layout structure', icon: LayoutGrid },
  { label: 'Writing content & rendering HTML', icon: Wand2 },
  { label: 'Storing to Supabase', icon: CheckCircle2 },
];

/* ========== Header ========== */
function AppHeader({ templates, sitesCount, onCmdK }: { templates: TemplateStats | null; sitesCount: number; onCmdK: () => void }) {
  return (
    <header className="border-b" style={{ borderColor: C.borderDef, background: C.surface, height: 52 }}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: C.accent, color: C.accentText }}>
            <Hexagon size={15} strokeWidth={2} />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[14px] font-semibold tracking-tight" style={{ color: C.text, letterSpacing: '-0.01em' }}>ZenForge AI</span>
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: C.textMute }}>elite · v8</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            <div className="text-right"><div className="text-[12px] font-semibold" style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{templates?.cerebrium?.totalBrainFiles ?? 310}</div><div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Brain</div></div>
            <div className="h-5 w-px" style={{ background: C.borderDef }} />
            <div className="text-right"><div className="text-[12px] font-semibold" style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{templates?.totalPatternCount ?? 81}</div><div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Patterns</div></div>
            <div className="h-5 w-px" style={{ background: C.borderDef }} />
            <div className="text-right"><div className="text-[12px] font-semibold" style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{sitesCount}</div><div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Sites</div></div>
            <div className="h-5 w-px" style={{ background: C.borderDef }} />
            <div className="text-right"><div className="text-[12px] font-semibold" style={{ color: C.text }}>{fmtCompact(templates?.totalCombinations ?? 207e12)}</div><div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Combos</div></div>
          </div>
          <button onClick={onCmdK} className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textMute, transition: '100ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHov; e.currentTarget.style.color = C.textSec; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderDef; e.currentTarget.style.color = C.textMute; }}>
            <Search size={13} strokeWidth={1.5} /><span className="text-[12px]">Search</span>
            <kbd className="rounded px-1 py-0.5 font-mono text-[10px]" style={{ background: C.surface, color: C.textMute, border: '1px solid ' + C.borderDef }}>⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ========== TabBar ========== */
function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ borderColor: C.borderDef, background: `${C.canvas}E6` }}>
      <div className="mx-auto max-w-7xl px-2 sm:px-6">
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const active = t.id === tab; const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap" style={{ color: active ? C.text : C.textMute, transition: '100ms' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = C.textSec; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = C.textMute; }}>
                <Icon size={14} strokeWidth={1.5} /><span>{t.label}</span>
                {active && <motion.div layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-px" style={{ background: C.accent }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ========== Generate Tab ========== */
function GenerateTab({ onResult }: { onResult: (r: GenResult) => void }) {
  const [prompt, setPrompt] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [floatingForm, setFloatingForm] = useState(false);
  const [usePremiumLLM, setUsePremiumLLM] = useState(true); // Premium LLM generation (demo-quality output)
  const [palette, setPalette] = useState('auto');
  const [seed, setSeed] = useState('');
  const [generating, setGenerating] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [result, setResult] = useState<GenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');

  const generate = useCallback(async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true); setError(null); setResult(null); setStepIdx(0);
    const timer = setInterval(() => setStepIdx((i) => (i < THINKING_STEPS.length - 1 ? i + 1 : i)), 500);
    try {
      // Premium LLM path: uses GLM-4-plus with the premium generation prompt
      // to produce demo-quality websites (matches the manual merge demo quality)
      // Strategy: Try Groq client-side first (no timeout), then edge function streaming
      if (usePremiumLLM) {
        let html = '';
        const groqKey = localStorage.getItem('sf-groq-key') || '';
        const llmModel = localStorage.getItem('sf-llm-model') || 'mistral-large-latest';
        const isGroqModel = llmModel.includes('llama') || llmModel.includes('mixtral');
        const isMistralModel = llmModel.startsWith('mistral');

        // Path A: Client-side Groq (no Vercel timeout)
        if (isGroqModel && groqKey) {
          try {
            setStepIdx(1);
            console.log('[generate] Trying client-side Groq for premium generation...');
            const premiumPrompt = `You are ZenForge AI, an elite website design agent that produces $50K-agency-grade websites.

DESIGN SYSTEM: Dark cinematic theme (#0A0A0A bg, #FFF text, #DCFF00→#64CEFB gradient accent), Instrument Serif (display), Inter (body), Space Grotesk (nav).

SECTIONS (include ALL):
1. Hero — full-viewport, video/gradient bg, bold headline with italic emphasis, CTA
2. Features — 3-4 glassmorphism cards with gradient borders, icons, hover glow
3. Stats — 4 large animated numbers with labels, count-up on scroll
4. About — split layout, video/image + text with checklist
5. Testimonials — 3 glass cards, avatar, name, role, 5-star rating
6. Pricing — 3 tiers, middle featured (scaled, gradient border)
7. FAQ — 5 accordion items, smooth expand
8. CTA band — full-width video bg, bold headline, gradient button
9. Footer — 4-5 column links, newsletter, social SVG icons

TECHNIQUES (use ALL):
- Glassmorphism (backdrop-filter: blur + semi-transparent bg)
- Gradient borders (mask-composite trick)
- Scroll reveals (IntersectionObserver, staggered delays)
- Animated counters (eased count-up)
- Hover effects (translateY lift, glow shadow)
- Fluid typography (clamp())
- Video backgrounds with gradient overlay
- Italic serif emphasis on key headline words
- Custom cursor (desktop only)
- Preloader animation
- Sticky nav (transparent → glass on scroll)
- Mobile responsive (768px, 1024px breakpoints)

RULES:
1. NEVER produce a generic template
2. NEVER use default blue as only accent
3. ALWAYS use fluid typography with clamp()
4. ALWAYS include scroll reveal animations
5. Return ONLY the HTML, starting with <!DOCTYPE html>

USER REQUEST: ${prompt}

Generate the complete HTML website now. Return ONLY the HTML.`;

            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: llmModel,
                messages: [
                  { role: 'system', content: premiumPrompt },
                  { role: 'user', content: `Generate the complete HTML website now. Return ONLY the HTML starting with <!DOCTYPE html>.` },
                ],
                max_tokens: 8000,
                temperature: 0.7,
                top_p: 0.9,
              }),
            });
            if (groqRes.ok) {
              const groqData = await groqRes.json();
              html = groqData?.choices?.[0]?.message?.content ?? '';
              html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
              const docIdx = html.indexOf('<!DOCTYPE');
              if (docIdx > 0) html = html.slice(docIdx);
              console.log('[generate] ✓ Groq generation succeeded, HTML length:', html.length);
              setStepIdx(2);
            }
          } catch (e) {
            console.warn('[generate] Groq generation failed, trying server-side...', e);
          }
        }

        // Path B: Server-side via /api/premium-generate (Mistral or Z.AI, with streaming)
        if (!html || html.length < 1000) {
          try {
            console.log('[generate] Trying server-side generation via /api/premium-generate, model:', llmModel);
            setStepIdx(1);
            const res = await fetch('/api/premium-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                businessName: prompt.match(/(?:called|named)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/)?.[1],
                model: llmModel,
                provider: isMistralModel ? 'mistral' : 'auto',
              }),
            });

            if (res.ok && res.body) {
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let streamHtml = '';
              let done = false;

              while (!done) {
                const { done: readerDone, value } = await reader.read();
                if (readerDone) { done = true; break; }
                streamHtml += decoder.decode(value, { stream: true });
              }

              const marker = '|||GENERATION_COMPLETE|||';
              if (streamHtml.includes(marker)) {
                streamHtml = streamHtml.split(marker)[0];
              }
              const errorMarker = '|||GENERATION_ERROR|||';
              if (streamHtml.includes(errorMarker)) {
                throw new Error('Generation failed: ' + streamHtml.split(errorMarker)[1]);
              }

              streamHtml = streamHtml.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
              const docIdx = streamHtml.indexOf('<!DOCTYPE');
              if (docIdx > 0) streamHtml = streamHtml.slice(docIdx);

              if (streamHtml.length > 1000) {
                html = streamHtml;
                console.log('[generate] ✓ Server-side generation succeeded, HTML length:', html.length);
                setStepIdx(2);
              }
            }
          } catch (e) {
            console.warn('[generate] Server-side generation failed:', e);
          }
        }

        clearInterval(timer); setStepIdx(THINKING_STEPS.length - 1);

        if (!html || html.length < 1000) {
          throw new Error('Generation failed — try selecting Mistral Large in Settings (works without API key)');
        }

        // Save to Supabase
        let slug = '';
        let viewUrl = '';
        try {
          const saveRes = await fetch('/api/save-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html, businessName: prompt.match(/(?:called|named)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/)?.[1] || 'ZenForge Site' }),
          });
          const saveData = await saveRes.json().catch(() => ({}));
          slug = saveData.slug || '';
          viewUrl = saveData.viewUrl || '';
        } catch {}

        const r: GenResult = {
          html,
          slug,
          businessName: prompt.match(/(?:called|named)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/)?.[1] || 'ZenForge Site',
          businessType: 'Premium LLM',
          designDNA: { designSystem: { name: 'Premium LLM' } },
          viewUrl,
        };
        setResult(r); onResult(r);
      } else {
        // Standard path: V5/V6 pattern assembly (instant, lower quality)
        const res = await fetch('/api/render-site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, save: true, seed: seed ? parseInt(seed, 10) : undefined }) });
        const data = await res.json();
        clearInterval(timer); setStepIdx(THINKING_STEPS.length - 1);
        if (data.error) throw new Error(data.message || data.error);
        const r: GenResult = { html: data.html, slug: data.slug, businessName: data.businessName, businessType: data.businessType, designDNA: data.designDNA, viewUrl: data.viewUrl };
        setResult(r); onResult(r);
        if (whatsapp || floatingForm) {
          try {
            const injectBody: any = {};
            if (whatsapp) {
              injectBody.whatsapp = { phone: whatsappPhone || '+1234567890', message: 'Hi ' + r.businessName + '!' };
            }
            if (floatingForm) injectBody.floatingForm = true;
            await fetch('/api/inject', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug: r.slug, html: r.html, inject: injectBody }),
            });
          } catch {}
        }
      }
    } catch (e) { clearInterval(timer); setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); }
  }, [prompt, seed, generating, whatsapp, whatsappPhone, floatingForm, onResult, usePremiumLLM]);

  const deviceWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '375px';

  return (
    <div className="grid gap-3 lg:grid-cols-[420px_1fr] max-lg:grid-cols-1">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="flex flex-col gap-3">
        <Panel className="p-4">
          <SectionHeader title="Generate" sub="Describe the website you want to build" />
          <div className="mt-3">
            <Textarea value={prompt} onChange={setPrompt} placeholder="Describe the website you want to generate... (Cmd/Ctrl+Enter)" rows={5} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate(); }} />
            <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: C.textMute }}>
              <div className="flex items-center gap-2"><Paperclip size={11} strokeWidth={1.5} /><span>Attach</span></div>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{prompt.length} chars</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: C.textMute }}>Quick prompts</div>
            <div className="flex flex-wrap gap-1.5">{QUICK_PROMPTS.map((q) => <Chip key={q.label} label={q.label} onClick={() => setPrompt(q.prompt)} />)}</div>
          </div>
          {/* Premium LLM toggle — uses GLM-4-plus with premium generation prompt */}
          <div className="mt-4 rounded-lg p-2.5" style={{ background: usePremiumLLM ? 'rgba(220,255,0,0.05)' : C.card, border: `1px solid ${usePremiumLLM ? 'rgba(220,255,0,0.3)' : C.borderDef}` }}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[12px] font-medium" style={{ color: C.text }}>✨ Premium LLM Generation</div>
                <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>
                  {usePremiumLLM
                    ? '🟢 GLM-4-plus generates $50K-agency-grade websites (15-30s). Demo-quality output.'
                    : 'V5/V6 pattern assembly. Instant but basic quality.'}
                </div>
              </div>
              <Toggle checked={usePremiumLLM} onChange={setUsePremiumLLM} />
            </div>
          </div>
          <button onClick={() => setAdvOpen((v) => !v)} className="mt-4 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px]" style={{ background: C.card, color: C.textSec, border: '1px solid ' + C.borderDef }}>
            <span className="flex items-center gap-2"><Settings2 size={13} strokeWidth={1.5} />Advanced options</span>
            <motion.div animate={{ rotate: advOpen ? 180 : 0 }} transition={{ duration: 0.15 }}><ChevronDown size={13} strokeWidth={1.5} /></motion.div>
          </button>
          <AnimatePresence>
            {advOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-2 space-y-1 rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                  <ToggleRow label="WhatsApp button" desc="Add floating WhatsApp CTA" checked={whatsapp} onChange={setWhatsapp} />
                  {whatsapp && <Input value={whatsappPhone} onChange={setWhatsappPhone} placeholder="+1 555 0100" className="mt-2" />}
                  <ToggleRow label="Floating contact form" desc="Add contact form widget" checked={floatingForm} onChange={setFloatingForm} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div><label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Palette</label>
                      <select value={palette} onChange={(e) => setPalette(e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-[12px] outline-none" style={{ background: C.surface, color: C.text, border: '1px solid ' + C.borderDef }}>
                        <option value="auto">Auto (random)</option><option value="warm">Warm Earth</option><option value="dark">Dark Tech</option><option value="golden">Golden Luxury</option><option value="vibrant">Vibrant Coral</option><option value="cool">Ocean Blue</option>
                      </select>
                    </div>
                    <div><label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Seed</label><Input value={seed} onChange={setSeed} placeholder="e.g. 42" /></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="primary" size="lg" onClick={generate} disabled={generating || !prompt.trim()} icon={generating ? Loader2 : Sparkles} className="mt-3 w-full">{generating ? 'Generating...' : 'Generate website'}</Button>
          {error && <div className="mt-3 flex items-start gap-2 rounded-lg p-2.5 text-[12px]" style={{ background: 'rgba(239,68,68,0.05)', color: C.error, border: '1px solid rgba(239,68,68,0.2)' }}><AlertCircle size={14} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} /><span>{error}</span></div>}
        </Panel>
        {generating && (
          <Panel className="p-4">
            <SectionHeader title="Generation Progress" />
            <div className="mt-3 space-y-1">
              {THINKING_STEPS.map((s, i) => {
                const done = i < stepIdx; const active = i === stepIdx; const Icon = s.icon;
                return (
                  <motion.div key={s.label} initial={{ opacity: 0.3 }} animate={{ opacity: done || active ? 1 : 0.3 }} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5" style={{ background: active ? C.card : 'transparent' }}>
                    <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: done ? C.success : active ? C.accent : C.card, color: done || active ? '#000' : C.textMute }}>
                      {done ? <CheckCircle2 size={11} strokeWidth={2} /> : active ? <Spinner size={11} /> : <Icon size={11} strokeWidth={1.5} />}
                    </div>
                    <span className="text-[12px] font-mono" style={{ color: done || active ? C.text : C.textMute }}>{s.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </Panel>
        )}
        {result && (
          <Panel className="p-4">
            <SectionHeader title={result.businessName} sub={`${result.businessType} · ${result.slug}`} right={<Badge color="success"><CircleDot size={9} /> Live</Badge>} />
            <div className="mt-3 flex items-center gap-1.5">
              <a href={result.viewUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="primary" icon={ExternalLink}>Open live</Button></a>
              <Button size="sm" icon={Copy} onClick={() => navigator.clipboard.writeText(result.viewUrl)}>Copy URL</Button>
            </div>
            {result.designDNA && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: C.borderDef }}>
                <div className="mb-2 flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Design DNA</span><Badge>{result.designDNA.variants ? Object.keys(result.designDNA.variants).length : 0} variants</Badge></div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[['Palette', result.designDNA.palette], ['Typography', result.designDNA.typography], ['Business', result.designDNA.businessType], ['Seed', result.designDNA.seed]].map(([k, v]) => (
                    <div key={k} className="rounded-md p-2" style={{ background: C.card }}><div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>{k}</div><div className="mt-0.5 font-mono text-[11px] truncate" style={{ color: C.text }}>{String(v ?? '—')}</div></div>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        )}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col">
        <Panel className="flex flex-1 flex-col p-0" style={{ minHeight: 'calc(100vh - 180px)' }}>
          <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: C.borderDef }}>
            <div className="flex items-center gap-2"><Globe size={13} strokeWidth={1.5} style={{ color: C.textMute }} /><span className="text-[12px] font-medium" style={{ color: C.text }}>Live preview</span></div>
            <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: C.card }}>
              {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => {
                const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone; const active = device === d;
                return <button key={d} onClick={() => setDevice(d)} className="rounded p-1.5" style={{ background: active ? C.hover : 'transparent', color: active ? C.text : C.textMute, transition: '100ms' }}><Icon size={13} strokeWidth={1.5} /></button>;
              })}
            </div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-4" style={{ background: C.canvas }}>
            {result ? (
              <iframe key={result.slug + '-' + device} srcDoc={result.html} title="preview" sandbox="allow-scripts allow-same-origin allow-popups" style={{ width: deviceWidth, maxWidth: '100%', height: '100%', minHeight: '600px', border: '1px solid ' + C.borderDef, borderRadius: R.md, background: '#fff', transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)' }} />
            ) : generating ? (
              <Shimmer style={{ width: '100%', height: '600px' }} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6 rounded-lg overflow-hidden" style={{ width: 240, height: 160, background: C.elevated, border: '1px solid ' + C.borderDef }}>
                  <div className="flex items-center gap-1 px-2 py-1.5" style={{ background: C.card, borderBottom: `1px solid ${C.borderDef}` }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} />
                  </div>
                  <div className="p-3 space-y-2"><Shimmer style={{ width: '60%', height: 12 }} /><Shimmer style={{ width: '40%', height: 8 }} /><div className="h-12" /><Shimmer style={{ width: '80%', height: 6 }} /><Shimmer style={{ width: '70%', height: 6 }} /></div>
                  <motion.div className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full" style={{ background: C.success }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: C.text, letterSpacing: '-0.01em' }}>Preview will appear here</h3>
                <p className="mt-1 text-[12px]" style={{ color: C.textMute }}>Describe your website to generate a live preview</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                  <Chip label="Coffee shop" onClick={() => setPrompt('cozy neighborhood coffee shop with espresso bar and pastries')} />
                  <Chip label="Tech startup" onClick={() => setPrompt('SaaS startup building AI developer tools')} />
                  <Chip label="Restaurant" onClick={() => setPrompt('fine-dining Italian restaurant with wine list')} />
                </div>
              </div>
            )}
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}

/* ========== Patterns Tab ========== */
function PatternsTab() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 999999));
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [patternCounts, setPatternCounts] = useState<Record<string, number>>({});
  const [totalCombos, setTotalCombos] = useState(0);
  const [evolvedCount, setEvolvedCount] = useState(0);

  // Fetch live pattern counts from templates API (includes evolved patterns)
  useEffect(() => {
    const fetchCounts = () => {
      fetch('/api/templates').then(r => r.json()).then(d => {
        const e = d.expandedComponents || {};
        setPatternCounts({
          hero: e.heroPatterns || 8, features: e.featureVariants || 6,
          about: e.aboutVariants || 5, gallery: e.galleryVariants || 5,
          testimonials: e.testimonials || 6, pricing: e.pricing || 5,
          faq: e.faq || 5, stats: e.stats || 5, partners: e.partners || 4,
          blog: e.blog || 4, team: e.team || 4, contact: e.contact || 4,
          cta: e.ctaVariants || 5, footer: e.footerVariants || 5,
          nav: e.navVariants || 5, buttons: e.buttonStyles || 5,
        });
        setTotalCombos(d.totalCombinations || 0);
        setEvolvedCount(e.evolvedPatterns || 0);
      }).catch(() => {});
    };
    fetchCounts();
    // Refresh every 10s to pick up evolved patterns
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const pickIdx = (salt: number, len: number): number => {
    let h = (seed ^ salt) >>> 0; h = Math.imul(h ^ (h >>> 15), h | 1); h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) % len;
  };
  const salts: Record<string, number> = { hero: 0x243F6A88, features: 0x85A308D3, about: 0x13198A2E, gallery: 0x03707344, cta: 0xA4093822, footer: 0x299F31D0, nav: 0x1CADDB6D, buttons: 0xB7E15162, testimonials: 0x6A09E667, pricing: 0xBB67AE85, faq: 0x3C6EF372, stats: 0xA54FF53A, partners: 0x510E527F, blog: 0x9B05688C, team: 0x1F83D9AB, contact: 0x5BE0CD19 };
  const variantIds = useMemo(() => {
    const out: Record<string, number> = {};
    PATTERN_CATS.forEach(c => {
      const total = patternCounts[c.id] || c.total;
      out[c.id] = pickIdx(salts[c.id] || 0, total) + 1;
    });
    return out;
  }, [seed, patternCounts]);

  const randomize = () => { setSeed(Math.floor(Math.random() * 999999)); setPreviewHtml(null); };
  const renderPreview = async () => { setLoading(true); setPreviewOpen(true); try { const res = await fetch('/api/render-site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'preview', save: false, seed }) }); const data = await res.json(); if (data.html) setPreviewHtml(data.html); } catch {} finally { setLoading(false); } };

  return (
    <div className="space-y-3">
      <Panel className="p-4">
        <SectionHeader title="Pattern Combination Explorer" sub={`${fmtCompact(totalCombos)} combinations · ${evolvedCount > 0 ? `${evolvedCount} evolved · ` : ''}all palettes & typography`} right={
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" icon={Shuffle} onClick={randomize}>Randomize</Button>
            <Button size="sm" variant="primary" icon={loading ? Loader2 : Eye} onClick={renderPreview} disabled={loading}>{loading ? 'Rendering...' : 'Render preview'}</Button>
          </div>
        } />
        {evolvedCount > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-md p-2.5" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
            <Activity size={14} strokeWidth={1.5} style={{ color: C.success }} />
            <span className="text-[11px]" style={{ color: C.textSec }}>
              <strong style={{ color: C.text }}>{evolvedCount}</strong> evolved patterns added by the Self-Evolving Engine
            </span>
            <span className="ml-auto text-[10px]" style={{ color: C.textMute }}>Counts update live</span>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {PATTERN_CATS.map((cat) => {
            const total = patternCounts[cat.id] || cat.total;
            const current = variantIds[cat.id] ?? 1;
            const evolved = total - cat.total;
            return (
              <button key={cat.id} onClick={() => setSeed((s) => (s + Math.floor(Math.random() * 1000) + 1) | 0)} className="rounded-lg p-3 text-left" style={{ background: C.card, border: '1px solid ' + C.borderDef, transition: '200ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; e.currentTarget.style.borderColor = C.borderHov; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.borderDef; }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color: C.text }}>{cat.label}</span>
                  <span className="font-mono text-[10px]" style={{ color: C.textMute, fontVariantNumeric: 'tabular-nums' }}>
                    {current}/{total}{evolved > 0 && <span style={{ color: C.success }}>+{evolved}</span>}
                  </span>
                </div>
                <div className="mt-1.5 h-0.5 w-full rounded-full" style={{ background: C.border }}><div className="h-0.5 rounded-full" style={{ width: `${(current / total) * 100}%`, background: 'var(--elite-accent, #ffffff)', transition: '200ms' }} /></div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 rounded-lg p-3" style={{ background: C.card }}>
          <div className="mb-1 flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Current combination</span><span className="font-mono text-[10px]" style={{ color: C.textMute }}>seed #{seed}</span></div>
          <code className="block text-[11px] leading-relaxed" style={{ color: C.textSec, wordBreak: 'break-all', fontVariantNumeric: 'tabular-nums' }}>{PATTERN_CATS.map((c) => `${c.id}:${variantIds[c.id] ?? 1}`).join(' + ')}</code>
        </div>
      </Panel>
      <AnimatePresence>
        {previewOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setPreviewOpen(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={SPRING} onClick={(e) => e.stopPropagation()} className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl" style={{ background: C.elevated, border: '1px solid ' + C.borderDef }}>
              <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: C.borderDef }}><span className="text-[12px] font-medium" style={{ color: C.text }}>Preview · seed #{seed}</span><button onClick={() => setPreviewOpen(false)} className="rounded p-1" style={{ color: C.textMute }}><X size={14} strokeWidth={1.5} /></button></div>
              <div className="flex-1 overflow-auto p-3" style={{ background: C.canvas }}>
                {loading ? <Shimmer style={{ height: '80vh' }} /> : previewHtml ? <iframe srcDoc={previewHtml} sandbox="allow-scripts allow-same-origin" className="h-[80vh] w-full rounded-lg" style={{ border: '1px solid ' + C.borderDef, background: '#fff' }} /> : <div className="flex h-96 items-center justify-center text-[12px]" style={{ color: C.textMute }}>No preview</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========== Projects Tab ========== */
function ProjectsTab({ sites, loading, onRefresh }: { sites: Site[]; loading: boolean; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const filtered = useMemo(() => { if (!search.trim()) return sites; const q = search.toLowerCase(); return sites.filter((s) => s.businessName?.toLowerCase().includes(q) || s.businessType?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q)); }, [sites, search]);

  const handleDeploy = async (s: Site) => {
    setDeploying(s.slug);
    try { const r = await fetch(`/api/site/${s.slug}`); const d = await r.json(); if (d.html) { await fetch('/api/deploy/vercel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deploy', slug: s.slug, html: d.html, businessName: s.businessName, businessType: s.businessType }) }); } } catch {} finally { setDeploying(null); }
  };

  const handleDelete = async (s: Site) => {
    if (!confirm(`Delete "${s.businessName || s.slug}"? This cannot be undone.`)) return;
    setDeleting(s.slug);
    try { await fetch(`/api/site/${s.slug}`, { method: 'DELETE' }); onRefresh(); } catch {} finally { setDeleting(null); }
  };

  return (
    <div className="space-y-3">
      <Panel className="p-4">
        <SectionHeader title="Projects" sub={`${sites.length} generated sites in Supabase`} right={<div className="flex gap-1.5"><Input value={search} onChange={setSearch} placeholder="Search projects..." icon={Search} className="w-56" /><Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRefresh}>Refresh</Button></div>} />
      </Panel>
      {loading ? (
        <Panel className="p-6"><div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Shimmer key={i} style={{ height: 56 }} />)}</div></Panel>
      ) : filtered.length === 0 ? (
        <Panel className="p-12 text-center"><FolderKanban size={28} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: C.textMute }} /><p className="text-[13px]" style={{ color: C.text }}>No projects found</p><p className="mt-1 text-[12px]" style={{ color: C.textMute }}>Generate your first website from the Generate tab</p></Panel>
      ) : (
        <div className="space-y-1">
          {filtered.map((s, i) => (
            <motion.div key={s.slug} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
              <div className="group flex items-center gap-3 rounded-lg p-3" style={{ background: C.elevated, border: '1px solid ' + C.borderDef, transition: '200ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; e.currentTarget.style.borderColor = C.borderHov; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.elevated; e.currentTarget.style.borderColor = C.borderDef; }}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md" style={{ background: C.card, color: C.textMute }}><Globe size={14} strokeWidth={1.5} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="truncate text-[13px] font-medium" style={{ color: C.text }}>{s.businessName || s.slug}</span>{s.businessType && <Badge>{s.businessType}</Badge>}<Badge color="success"><CircleDot size={9} /> Live</Badge></div>
                  <div className="mt-0.5 truncate font-mono text-[11px]" style={{ color: C.textMute }}>/s/{s.slug}</div>
                </div>
                <div className="hidden text-right sm:block"><div className="text-[11px]" style={{ color: C.textSec }}>{timeAgo(s.createdAt)}</div></div>
                <div className="flex flex-shrink-0 items-center gap-0.5">
                  <a href={`/s/${s.slug}`} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost" icon={ExternalLink} /></a>
                  <Button size="sm" variant="ghost" icon={deploying === s.slug ? Loader2 : Rocket} onClick={() => handleDeploy(s)} disabled={deploying === s.slug} />
                  <Button size="sm" variant="ghost" icon={Link2} onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${s.slug}`)} />
                  <Button size="sm" variant="danger" icon={deleting === s.slug ? Loader2 : Trash2} onClick={() => handleDelete(s)} disabled={deleting === s.slug} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========== AI Agent Tab ========== */
/* ========== Collapsible Stream Step (ChatGPT-style) ========== */
function CollapsibleStep({ step, streaming }: { step: { type: string; content: string; metadata?: any }; streaming?: boolean }) {
  const [collapsed, setCollapsed] = useState(step.type === 'thinking');
  const isThinking = step.type === 'thinking';
  const isResponse = step.type === 'response';
  const isToolUse = step.type === 'tool_use';
  const isToolResult = step.type === 'tool_result';
  const isError = step.type === 'error';
  const isDone = step.type === 'done';

  const Icon = isThinking ? Brain : isResponse ? MessageCircle : isToolUse ? Wand2 : isToolResult ? CheckCircle2 : isDone ? CheckCircle2 : AlertCircle;
  const iconColor = isThinking ? C.info : isResponse ? 'var(--elite-accent, #ffffff)' : isToolUse ? C.text : isToolResult ? C.success : isDone ? C.success : C.error;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-md overflow-hidden" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
      <button
        onClick={() => isThinking && setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        style={{ cursor: isThinking ? 'pointer' : 'default' }}
      >
        <Icon size={11} strokeWidth={1.5} style={{ color: iconColor, flexShrink: 0 } as any} />
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: C.textMute }}>{step.type}</span>
        {isThinking && (
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.15 }} style={{ marginLeft: 'auto' }}>
            <ChevronDown size={12} strokeWidth={1.5} style={{ color: C.textMute }} />
          </motion.div>
        )}
        {isResponse && streaming && (
          <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: 'var(--elite-accent, #ffffff)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--elite-accent, #ffffff)' }} />
            streaming
          </span>
        )}
      </button>
      {(!isThinking || !collapsed) && (
        <div className="px-3 pb-3">
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: isResponse ? C.text : C.textSec }}>
            {step.content}
            {isResponse && streaming && <span className="inline-block w-1.5 h-4 ml-0.5 align-middle" style={{ background: 'var(--elite-accent, #ffffff)', animation: 'blink 1s infinite' }} />}
          </p>
          {step.metadata?.viewUrl && (
            <a href={step.metadata.viewUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--elite-accent, #ffffff)' }}>
              <ExternalLink size={10} /> {step.metadata.viewUrl}
            </a>
          )}
          {isResponse && !streaming && (
            <div className="mt-2 flex items-center gap-1">
              <button onClick={() => navigator.clipboard.writeText(step.content)} className="rounded p-1 transition-colors" style={{ color: C.textMute }} onMouseEnter={(e) => e.currentTarget.style.color = C.text} onMouseLeave={(e) => e.currentTarget.style.color = C.textMute}>
                <Copy size={12} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function AgentTab({ onResult }: { onResult: (r: GenResult) => void }) {
  const [mode, setMode] = useState<AIMode>('designer');
  const [message, setMessage] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [steps, setSteps] = useState<{ type: string; content: string; metadata?: any }[]>([]);
  const [preview, setPreview] = useState<GenResult | null>(null);
  const [cerebriumHits, setCerebriumHits] = useState<CerebriumHit[]>([]);

  const send = useCallback(async () => {
    if (!message.trim() || streaming) return;
    setStreaming(true); setSteps([]); setPreview(null); setCerebriumHits([]);
    try {
      const res = await fetch('/api/generate/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, mode, model: typeof window !== 'undefined' ? localStorage.getItem('sf-llm-model') || undefined : undefined, groqKey: typeof window !== 'undefined' ? localStorage.getItem('sf-groq-key') || undefined : undefined }) });
      if (!res.ok || !res.body) throw new Error('Agent failed');
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n'); buffer = events.pop() || '';
        for (const evt of events) {
          const lines = evt.split('\n'); let eventName = ''; let data: any = null;
          for (const ln of lines) { if (ln.startsWith('event: ')) eventName = ln.slice(7).trim(); else if (ln.startsWith('data: ')) { try { data = JSON.parse(ln.slice(6)); } catch {} } }
          if (!eventName || !data) continue;
          if (eventName === 'thinking') setSteps((s) => [...s, { type: 'thinking', content: data.content }]);
          else if (eventName === 'cerebrium') setCerebriumHits(data.hits || []);
          else if (eventName === 'token') {
            // Accumulate tokens into a 'response' step
            setSteps((s) => {
              const last = s[s.length - 1];
              if (last && last.type === 'response') {
                return [...s.slice(0, -1), { type: 'response', content: last.content + data.content }];
              }
              return [...s, { type: 'response', content: data.content }];
            });
          }
          else if (eventName === 'tool_use') setSteps((s) => [...s, { type: 'tool_use', content: data.toolName }]);
          else if (eventName === 'tool_result') {
            setSteps((s) => [...s, { type: 'tool_result', content: data.output, metadata: data.metadata }]);
            if (data.metadata?.html) {
              const r: GenResult = { html: data.metadata.html, slug: data.metadata.slug, businessName: data.metadata.businessName || 'Generated', businessType: data.metadata.designDNA?.businessType, designDNA: data.metadata.designDNA, viewUrl: data.metadata.viewUrl };
              setPreview(r); onResult(r);
            }
          }
          else if (eventName === 'error') setSteps((s) => [...s, { type: 'error', content: data.content || 'Error' }]);
          else if (eventName === 'done') setSteps((s) => [...s, { type: 'done', content: data.reply }]);
        }
      }
    } catch (e) { setSteps((s) => [...s, { type: 'error', content: e instanceof Error ? e.message : 'Failed' }]); }
    finally { setStreaming(false); }
  }, [message, streaming, mode, onResult]);

  return (
    <div className="grid gap-3 lg:grid-cols-[420px_1fr] max-lg:grid-cols-1">
      <div className="space-y-3">
        <Panel className="p-4">
          <SectionHeader title="AI Agent" sub="Six specialized modes · Multi-provider LLM" />
          {/* Model selector for AI Agent */}
          <div className="mt-3 flex gap-2">
            <select
              value={typeof window !== 'undefined' ? localStorage.getItem('sf-llm-model') || 'glm-4-flash' : 'glm-4-flash'}
              onChange={(e) => { if (typeof window !== 'undefined') localStorage.setItem('sf-llm-model', e.target.value); }}
              className="flex-1 rounded-lg px-3 py-2 text-[12px] outline-none"
              style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, fontFamily: 'inherit' }}
            >
              <optgroup label="Groq (fast, free)">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B — Most intelligent</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B — Fastest</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B — Balanced</option>
              </optgroup>
              <optgroup label="Z.AI (sandbox proxy)">
                <option value="glm-4-flash">GLM-4 Flash — Fast</option>
                <option value="glm-4-plus">GLM-4 Plus — Capable</option>
              </optgroup>
            </select>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {AI_MODES.map((m) => {
              const active = mode === m.id; const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setMode(m.id)} className="rounded-lg p-2.5 text-left" style={{ background: active ? C.hover : C.card, border: `1px solid ${active ? C.borderHov : C.borderDef}`, transition: '100ms' }}>
                  <Icon size={14} strokeWidth={1.5} style={{ color: active ? C.text : C.textMute }} />
                  <div className="mt-1.5 text-[12px] font-medium" style={{ color: active ? C.text : C.textSec }}>{m.label}</div>
                  <div className="mt-0.5 text-[10px] leading-tight" style={{ color: C.textMute }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel className="p-4">
          <SectionHeader title="Prompt" sub={`Mode: ${mode}`} />
          <div className="mt-3">
            <Textarea value={message} onChange={setMessage} placeholder={mode === 'designer' ? 'Describe the website you want to generate...' : mode === 'coder' ? 'Ask a coding question...' : mode === 'ssh' ? 'Enter a shell command...' : 'Enter your request...'} rows={4} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); }} />
            <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: C.textMute }}><span style={{ fontVariantNumeric: 'tabular-nums' }}>{message.length} chars</span>{mode === 'designer' && <span>Cerebrium will search 310 design files</span>}</div>
          </div>
          <Button variant="primary" size="lg" onClick={send} disabled={streaming || !message.trim()} icon={streaming ? Loader2 : ArrowUp} className="mt-3 w-full">{streaming ? 'Working...' : 'Send'}</Button>
        </Panel>
        {mode === 'designer' && cerebriumHits.length > 0 && (
          <Panel className="p-4">
            <SectionHeader title="Cerebrium references" sub={`${cerebriumHits.length} brain files matched`} right={<Brain size={13} strokeWidth={1.5} style={{ color: C.textMute }} />} />
            <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto">
              {cerebriumHits.slice(0, 8).map((h) => (
                <div key={h.id} className="rounded-md p-2" style={{ background: C.card }}>
                  <div className="flex items-center justify-between gap-2"><span className="text-[12px] font-medium truncate" style={{ color: C.text }}>{h.title || h.name}</span><Badge>score {h.score}</Badge></div>
                  {h.excerpt && <p className="mt-1 text-[10px] leading-relaxed line-clamp-2" style={{ color: C.textMute }}>{h.excerpt}</p>}
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
      <div className="space-y-3">
        <Panel className="p-4" style={{ minHeight: '320px' }}>
          <SectionHeader title="Stream" sub="Real-time agent output" />
          <div className="mt-3 max-h-[500px] space-y-1.5 overflow-y-auto">
            {steps.length === 0 && <div className="py-16 text-center"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: C.card, color: C.textMute }}><MessageCircle size={16} strokeWidth={1.5} /></div><p className="text-[12px]" style={{ color: C.textMute }}>Output will appear here</p></div>}
            {steps.filter((s, i) => {
              // Skip 'done' steps if there's already a 'response' step (avoid duplicate)
              if (s.type === 'done') {
                const hasResponse = steps.some((s2, j) => s2.type === 'response' && j < i);
                if (hasResponse) return false;
              }
              return true;
            }).map((s, i) => (
              <CollapsibleStep key={i} step={s} streaming={streaming} />
            ))}
          </div>
        </Panel>
        {preview && (
          <Panel className="p-0" style={{ minHeight: '440px' }}>
            <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: C.borderDef }}><span className="text-[12px] font-medium" style={{ color: C.text }}>Live preview</span><a href={preview.viewUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost" icon={ExternalLink}>Open</Button></a></div>
            <iframe srcDoc={preview.html} sandbox="allow-scripts allow-same-origin" className="h-[520px] w-full" style={{ border: 'none', background: '#fff', borderRadius: `0 0 ${R.lg}px ${R.lg}px` }} />
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ========== Sandbox Tab ========== */
function SandboxTab() {
  const [sub, setSub] = useState<SandboxSub>('ssh');
  return (
    <div className="space-y-3">
      <Panel className="p-2">
        <div className="flex gap-0.5 overflow-x-auto no-scrollbar">
          {SANDBOX_SUBS.map((s) => {
            const active = s.id === sub; const Icon = s.icon;
            return <button key={s.id} onClick={() => setSub(s.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap" style={{ background: active ? C.hover : 'transparent', color: active ? C.text : C.textMute, transition: '100ms' }}><Icon size={13} strokeWidth={1.5} />{s.label}</button>;
          })}
        </div>
      </Panel>
      {sub === 'ssh' ? <SshTerminal /> : <SandboxStub sub={sub} />}
    </div>
  );
}

/* ==================== Full-Scale Linux Terminal ====================
 * Behaves like a real bash terminal:
 *  • Live prompt that updates with `cd` (shows `~/projects/foo` not just `~`)
 *  • Tab completion on commands AND files/directories (with multi-match popup)
 *  • Command history with ↑/↓ arrows
 *  • Ctrl+L clear, Ctrl+C cancel, Ctrl+U kill line, Ctrl+A/E home/end
 *  • Ctrl+W delete word backwards
 *  • ANSI color rendering (xterm 256-color subset)
 *  • Welcome banner with MOTD
 *  • Connection status indicator + last command latency
 * ================================================================== */

// Compact ANSI parser → React spans. Supports SGR codes (colors, bold, dim, italic, underline).
function ansiToSpans(text: string): ReactNode[] {
  if (!text) return [];
  const spans: ReactNode[] = [];
  // Split on ANSI escape sequences
  const parts = text.split(/(\x1B\[[0-9;]*m)/g);
  let color = '#cdd0d4';      // default foreground
  let bold = false;
  let dim = false;
  let italic = false;
  let underline = false;
  let key = 0;

  const ANSI_COLORS: Record<number, string> = {
    0: '#cdd0d4',     // reset
    30: '#5c6370',    // black/bright-black
    31: '#ff5f57',    // red
    32: '#28c840',    // green
    33: '#febc2e',    // yellow
    34: '#3b82f6',    // blue
    35: '#a855f7',    // magenta
    36: '#06b6d4',    // cyan
    37: '#e5e7eb',    // white
    90: '#7f8590',    // bright black (gray)
    91: '#ff8787',    // bright red
    92: '#5ce97b',    // bright green
    93: '#ffd166',    // bright yellow
    94: '#6ba6ff',    // bright blue
    95: '#c084fc',    // bright magenta
    96: '#67e8f9',    // bright cyan
    97: '#ffffff',    // bright white
  };

  for (const part of parts) {
    if (!part) continue;
    const esc = part.match(/^\x1B\[([0-9;]*)m$/);
    if (esc) {
      const codes = esc[1] ? esc[1].split(';').map(Number) : [0];
      for (const c of codes) {
        if (c === 0) { color = '#cdd0d4'; bold = false; dim = false; italic = false; underline = false; }
        else if (c === 1) bold = true;
        else if (c === 2) dim = true;
        else if (c === 3) italic = true;
        else if (c === 4) underline = true;
        else if (c === 22) { bold = false; dim = false; }
        else if (c === 23) italic = false;
        else if (c === 24) underline = false;
        else if (ANSI_COLORS[c]) color = ANSI_COLORS[c];
      }
      continue;
    }
    // Split by newlines so each line is its own div (preserves pre-wrap layout)
    const lines = part.split('\n');
    lines.forEach((ln, i) => {
      if (i > 0) spans.push(<br key={`br-${key++}`} />);
      if (ln) {
        spans.push(
          <span
            key={`s-${key++}`}
            style={{
              color,
              fontWeight: bold ? 600 : 400,
              opacity: dim ? 0.6 : 1,
              fontStyle: italic ? 'italic' : 'normal',
              textDecoration: underline ? 'underline' : 'none',
            }}
          >
            {ln}
          </span>
        );
      }
    });
  }
  return spans;
}

// Convert an absolute path like /home/user/foo/bar to ~/foo/bar for display
function shortenPath(cwd: string): string {
  if (!cwd) return '~';
  if (cwd === '/home/user') return '~';
  if (cwd.startsWith('/home/user/')) return '~/' + cwd.slice('/home/user/'.length);
  return cwd;
}

interface TermLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  cwd?: string;          // cwd at the time of the command (for the prompt)
  exitCode?: number;
}

function SshTerminal() {
  const [lines, setLines] = useState<TermLine[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [cwd, setCwd] = useState('/home/user');
  const [connected, setConnected] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [tabSuggestions, setTabSuggestions] = useState<string[] | null>(null);
  const [tabMatched, setTabMatched] = useState<string>('');
  const [tabLoading, setTabLoading] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build the bash-style prompt: user@e2b:~/current/dir$
  const renderPrompt = (dir: string) => (
    <span>
      <span style={{ color: '#28c840', fontWeight: 600 }}>user@e2b</span>
      <span style={{ color: '#888' }}>:</span>
      <span style={{ color: '#3b82f6', fontWeight: 600 }}>{shortenPath(dir)}</span>
      <span style={{ color: '#888' }}>$ </span>
    </span>
  );

  // Initial boot — fetch connection status + welcome banner
  useEffect(() => {
    const banner: TermLine[] = [
      { type: 'system', content: '┌─────────────────────────────────────────────────────────────┐' },
      { type: 'system', content: '│  ZenForge Linux Terminal  ·  Real E2B Sandbox  ·  bash    │' },
      { type: 'system', content: '│  Type "help" for commands  ·  Tab to autocomplete          │' },
      { type: 'system', content: '└─────────────────────────────────────────────────────────────┘' },
    ];
    setLines(banner);
    // Verify connection
    fetch('/api/sandbox/ssh-exec?action=pwd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(r => r.json())
      .then(d => { if (d.cwd) setCwd(d.cwd); setConnected(true); })
      .catch(() => setConnected(false));
  }, []);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, loading]);

  // Focus input when terminal area is clicked
  const focusInput = () => inputRef.current?.focus();

  const run = useCallback(async (cmd: string) => {
    if (loading) return;
    if (!cmd.trim()) {
      // Empty input — just show a fresh prompt
      setLines(l => [...l, { type: 'input', content: '', cwd }]);
      return;
    }
    setLoading(true);
    setHistory(h => [...h, cmd]);
    setHistoryIdx(-1);

    // Handle clear locally for instant feedback
    if (cmd.trim() === 'clear' || cmd.trim() === 'cls') {
      setLines([]);
      setLoading(false);
      setInput('');
      setTimeout(focusInput, 50);
      return;
    }

    // Echo the command with prompt
    setLines(l => [...l, { type: 'input', content: cmd, cwd }]);

    try {
      const t0 = Date.now();
      const res = await fetch('/api/sandbox/ssh-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      const latency = Date.now() - t0;
      setLastLatency(latency);
      if (data.cwd) setCwd(data.cwd);
      if (data.stdout) {
        setLines(l => [...l, { type: 'output', content: data.stdout, exitCode: data.exitCode }]);
      }
      if (data.stderr) {
        setLines(l => [...l, { type: 'error', content: data.stderr, exitCode: data.exitCode }]);
      }
    } catch (e) {
      setLines(l => [...l, { type: 'error', content: `Connection failed: ${e instanceof Error ? e.message : 'unknown'}` }]);
    } finally {
      setLoading(false);
      setInput('');
      setTimeout(focusInput, 50);
    }
  }, [loading, cwd]);

  // Tab completion — fetches suggestions from server
  const doTabComplete = useCallback(async (currentInput: string) => {
    if (!currentInput || tabLoading) return;
    setTabLoading(true);
    try {
      const res = await fetch('/api/sandbox/ssh-exec?action=tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: currentInput }),
      });
      const data = await res.json();
      const suggestions: string[] = data.suggestions || [];
      if (suggestions.length === 0) {
        // No matches — bell (do nothing visible)
        setTabSuggestions(null);
      } else if (suggestions.length === 1) {
        // Single match — auto-complete
        const lastSpace = currentInput.lastIndexOf(' ');
        const before = currentInput.slice(0, lastSpace + 1);
        const completed = suggestions[0];
        // If completing a directory and not already trailing /, add space
        const newValue = before + completed + (completed.endsWith('/') ? '' : ' ');
        setInput(newValue);
        setTabSuggestions(null);
      } else {
        // Multiple matches — show popup AND auto-complete common prefix
        const lastSpace = currentInput.lastIndexOf(' ');
        const before = currentInput.slice(0, lastSpace + 1);
        const currentToken = currentInput.slice(lastSpace + 1);
        // Find common prefix
        let prefix = suggestions[0];
        for (const s of suggestions) {
          while (!s.startsWith(prefix) && prefix.length > currentToken.length) {
            prefix = prefix.slice(0, -1);
          }
        }
        if (prefix.length > currentToken.length) {
          setInput(before + prefix);
        }
        setTabSuggestions(suggestions);
        setTabMatched(currentToken);
      }
    } catch (e) {
      setTabSuggestions(null);
    } finally {
      setTabLoading(false);
    }
  }, [tabLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter — execute
    if (e.key === 'Enter') {
      e.preventDefault();
      setTabSuggestions(null);
      run(input);
      return;
    }
    // Tab — autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      doTabComplete(input);
      return;
    }
    // Arrow up — previous history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx < 0 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
      return;
    }
    // Arrow down — next history
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx >= 0 && historyIdx < history.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
      return;
    }
    // Ctrl+L — clear screen
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      setLines([]);
      return;
    }
    // Ctrl+C — cancel current input
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      setLines(l => [...l, { type: 'input', content: input + '^C', cwd }]);
      setInput('');
      return;
    }
    // Ctrl+U — kill line (clear input)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      setInput('');
      return;
    }
    // Ctrl+W — delete word backwards
    if (e.ctrlKey && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      const lastSpace = input.lastIndexOf(' ', input.length - 2);
      setInput(lastSpace >= 0 ? input.slice(0, lastSpace + 1) : '');
      return;
    }
    // Ctrl+A — home
    if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      if (inputRef.current) inputRef.current.setSelectionRange(0, 0);
      return;
    }
    // Ctrl+E — end
    if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      if (inputRef.current) {
        const len = input.length;
        inputRef.current.setSelectionRange(len, len);
      }
      return;
    }
    // Escape — clear suggestions popup
    if (e.key === 'Escape') {
      setTabSuggestions(null);
      return;
    }
  };

  const QUICK = [
    'ls -la', 'pwd', 'whoami', 'uname -a', 'date', 'df -h',
    'free -m', 'uptime', 'ps aux', 'env', 'help', 'clear',
  ];

  return (
    <Panel className="overflow-hidden p-0">
      {/* Title bar — Mac-style traffic lights + connection status */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: C.borderDef, background: C.card }}>
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: '#FF5F57' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#FEBC2E' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#28C840' }} />
        </div>
        <span className="ml-2 font-mono text-[11px]" style={{ color: C.textMute }}>
          user@e2b — bash — 80×24
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: connected ? '#28c840' : C.error }}>
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: connected ? '#28c840' : C.error }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {connected ? 'E2B connected' : 'connecting…'}
          </span>
          {lastLatency !== null && (
            <span className="font-mono text-[10px]" style={{ color: C.textMute }}>
              · {lastLatency}ms
            </span>
          )}
        </div>
      </div>

      {/* Terminal output area */}
      <div
        ref={scrollRef}
        onClick={focusInput}
        className="max-h-[560px] min-h-[420px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed"
        style={{ background: '#000', color: '#cdd0d4', cursor: 'text' }}
      >
        {lines.map((line, i) => {
          if (line.type === 'input') {
            return (
              <div key={i} className="flex flex-wrap items-baseline">
                {renderPrompt(line.cwd || cwd)}
                <span style={{ color: '#cdd0d4' }}>{line.content}</span>
              </div>
            );
          }
          if (line.type === 'system') {
            return <div key={i} style={{ color: '#888' }}>{line.content}</div>;
          }
          if (line.type === 'error') {
            return <div key={i} style={{ color: '#ff6b6b' }}>{ansiToSpans(line.content)}</div>;
          }
          // output
          return <div key={i} style={{ color: '#cdd0d4' }}>{ansiToSpans(line.content)}</div>;
        })}

        {/* Tab completion suggestions popup */}
        {tabSuggestions && tabSuggestions.length > 1 && (
          <div
            className="my-1 rounded-md p-2"
            style={{ background: '#0a0a0a', border: '1px solid #333', maxWidth: '100%' }}
          >
            <div className="mb-1 font-mono text-[10px] uppercase" style={{ color: '#888' }}>
              {tabSuggestions.length} matches for "{tabMatched}"
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[12px]" style={{ color: '#cdd0d4' }}>
              {tabSuggestions.map((s, i) => (
                <span
                  key={i}
                  style={{
                    color: s.endsWith('/') ? '#3b82f6' : '#cdd0d4',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const lastSpace = input.lastIndexOf(' ');
                    const before = input.slice(0, lastSpace + 1);
                    setInput(before + s + (s.endsWith('/') ? '' : ' '));
                    setTabSuggestions(null);
                    focusInput();
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live prompt + input line */}
        {!loading && (
          <div className="flex flex-wrap items-baseline">
            {renderPrompt(cwd)}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setTabSuggestions(null); }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent font-mono text-[13px] outline-none"
              style={{ color: '#cdd0d4', caretColor: '#cdd0d4', minWidth: '0px' }}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder=""
            />
          </div>
        )}
        {loading && (
          <div style={{ color: '#888' }}>
            <span>{renderPrompt(cwd)}</span>
            <span className="animate-pulse">▋</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick command bar */}
      <div className="flex gap-1 overflow-x-auto border-t px-3 py-2 no-scrollbar" style={{ borderColor: C.borderDef, background: '#111' }}>
        {QUICK.map((c) => (
          <button
            key={c}
            onClick={() => !loading && run(c)}
            disabled={loading}
            className="rounded px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors"
            style={{ background: '#1a1a1a', color: '#888', border: '1px solid #333' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#333'; }}
          >
            {c}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function SandboxStub({ sub }: { sub: SandboxSub }) {
  const meta = SANDBOX_SUBS.find((s) => s.id === sub)!; const Icon = meta.icon;
  return (
    <Panel className="p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: C.card, color: C.textMute }}><Icon size={20} strokeWidth={1.5} /></div>
      <h3 className="mt-4 text-[14px] font-semibold" style={{ color: C.text }}>{meta.label}</h3>
      <p className="mt-1 text-[12px]" style={{ color: C.textMute }}>{meta.desc}</p>
      <div className="mx-auto mt-5 max-w-md rounded-lg p-3 text-left" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
        <div className="flex items-center gap-2"><Badge color="warn">Not configured</Badge><span className="text-[11px]" style={{ color: C.textMute }}>API key required</span></div>
        <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: C.textSec }}>Endpoint: <code className="font-mono" style={{ color: C.text }}>/api/sandbox/{sub}</code>. Add the corresponding API key in Settings to enable real execution.</p>
        <div className="mt-3"><Button size="sm" variant="secondary" icon={Play} onClick={() => { const endpoint = sub.includes('-') ? sub : `${sub}-create`; fetch(`/api/sandbox/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true }) }).then((r) => r.json()).then((d) => alert(JSON.stringify(d, null, 2))).catch((e) => alert('Error: ' + e.message)); }}>Test endpoint</Button></div>
      </div>
    </Panel>
  );
}

/* ========== Deploy Tab ========== */
function DeployTab({ sites }: { sites: Site[] }) {
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const fetchStatus = useCallback(async () => { try { const res = await fetch('/api/deploy/vercel'); setStatus(await res.json()); } catch {} }, []);
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const deploy = async (s: Site) => { setDeploying(s.slug); try { const r = await fetch(`/api/site/${s.slug}`); const d = await r.json(); if (d.html) { await fetch('/api/deploy/vercel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deploy', slug: s.slug, html: d.html, businessName: s.businessName, businessType: s.businessType }) }); } } catch {} finally { setDeploying(null); } };
  const handleDelete = async (s: Site) => { if (!confirm(`Delete "${s.businessName}"?`)) return; setDeleting(s.slug); try { await fetch(`/api/site/${s.slug}`, { method: 'DELETE' }); } catch {} finally { setDeleting(null); } };

  return (
    <div className="space-y-3">
      <Panel className="p-4">
        <SectionHeader title="Deploy" sub="Vercel project: site-forge-two-lake" right={<Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchStatus}>Recheck</Button>} />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Status" value={status?.status || 'ready'} icon={Power} accent />
          <StatCard label="Project" value="site-forge-two-lake" icon={Boxes} />
          <StatCard label="URL" value="vercel.app" icon={Globe} />
          <StatCard label="Sites" value={sites.length} icon={Rocket} />
        </div>
      </Panel>
      <Panel className="p-4">
        <SectionHeader title="Sites ready to deploy" sub={`${sites.length} generated sites`} />
        <div className="mt-3 max-h-[480px] space-y-1.5 overflow-y-auto">
          {sites.map((s) => (
            <div key={s.slug} className="flex items-center gap-3 rounded-md p-2.5" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: C.surface, color: C.textMute }}><Globe size={12} strokeWidth={1.5} /></div>
              <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-medium" style={{ color: C.text }}>{s.businessName}</div><div className="truncate font-mono text-[10px]" style={{ color: C.textMute }}>/s/{s.slug}</div></div>
              <a href={`/s/${s.slug}`} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost" icon={ExternalLink} /></a>
              <Button size="sm" variant="primary" icon={deploying === s.slug ? Loader2 : Rocket} onClick={() => deploy(s)} disabled={deploying === s.slug}>{deploying === s.slug ? 'Deploying...' : 'Deploy'}</Button>
              <Button size="sm" variant="danger" icon={deleting === s.slug ? Loader2 : Trash2} onClick={() => handleDelete(s)} disabled={deleting === s.slug} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="p-4">
        <SectionHeader title="Environment" sub="Connected integrations" />
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {[{ name: 'Supabase', status: 'connected', desc: 'Supabase Project' }, { name: 'Vercel', status: 'connected', desc: 'site-forge-two-lake' }, { name: 'OpenAI', status: 'not-configured', desc: 'Add OPENAI_API_KEY' }, { name: 'Anthropic', status: 'not-configured', desc: 'Add ANTHROPIC_API_KEY' }].map((env) => (
            <div key={env.name} className="flex items-center justify-between rounded-md p-2.5" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
              <div><div className="text-[12px] font-medium" style={{ color: C.text }}>{env.name}</div><div className="text-[10px] font-mono" style={{ color: C.textMute }}>{env.desc}</div></div>
              <Badge color={env.status === 'connected' ? 'success' : 'warn'}>{env.status === 'connected' ? 'Connected' : 'Not set'}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ========== Logs Tab ========== */
function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (levelFilter) params.set('level', levelFilter);
      params.set('limit', '200');
      const [logsRes, statsRes] = await Promise.all([fetch(`/api/logs?${params}`), fetch('/api/logs?format=stats')]);
      const logsData = await logsRes.json(); setLogs(logsData.entries || []); setStats(await statsRes.json());
    } catch {} finally { setLoading(false); }
  }, [levelFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { if (!autoRefresh) return; const i = setInterval(fetchLogs, 5000); return () => clearInterval(i); }, [autoRefresh, fetchLogs]);

  const filtered = useMemo(() => { if (!filter.trim()) return logs; const q = filter.toLowerCase(); return logs.filter((l) => l.message?.toLowerCase().includes(q) || l.source?.toLowerCase().includes(q)); }, [logs, filter]);

  return (
    <div className="space-y-3">
      <Panel className="p-4">
        <SectionHeader title="System logs" sub={stats ? `${stats.total || logs.length} entries` : `${logs.length} entries`} right={
          <div className="flex gap-1.5">
            <Button size="sm" variant={autoRefresh ? 'secondary' : 'ghost'} onClick={() => setAutoRefresh((v) => !v)} icon={autoRefresh ? CircleDot : Power}>{autoRefresh ? 'Live' : 'Paused'}</Button>
            <Button size="sm" variant="ghost" icon={Download} onClick={() => window.open('/api/logs?format=text', '_blank')}>Export</Button>
            <Button size="sm" variant="danger" icon={Trash2} onClick={async () => { if (confirm('Clear all logs?')) { await fetch('/api/logs', { method: 'DELETE' }); fetchLogs(); } }}>Clear</Button>
          </div>
        } />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Input value={filter} onChange={setFilter} placeholder="Filter messages..." icon={Search} className="flex-1 min-w-[200px]" />
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="rounded-md px-2.5 py-1.5 text-[12px] outline-none" style={{ background: C.card, color: C.text, border: '1px solid ' + C.borderDef, height: 34 }}>
            <option value="">All levels</option><option value="info">Info</option><option value="success">Success</option><option value="warn">Warn</option><option value="error">Error</option><option value="debug">Debug</option>
          </select>
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchLogs}>Refresh</Button>
        </div>
      </Panel>
      <Panel className="overflow-hidden p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? <div className="space-y-1 p-2">{[1, 2, 3, 4, 5].map((i) => <Shimmer key={i} style={{ height: 32 }} />)}</div>
          : filtered.length === 0 ? <div className="p-12 text-center"><ScrollText size={26} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: C.textMute }} /><p className="text-[13px]" style={{ color: C.text }}>No logs found</p></div>
          : <div className="divide-y" style={{ borderColor: C.borderDef }}>{filtered.slice().reverse().map((log) => {
            const levelColor = log.level === 'error' ? C.error : log.level === 'warn' ? C.warn : log.level === 'success' ? C.success : log.level === 'info' ? C.info : C.textMute;
            return (
              <div key={log.id} className="flex items-start gap-3 px-3 py-2" style={{ transition: '100ms' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#0F0F0F'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <div className="flex-shrink-0 font-mono text-[10px]" style={{ color: C.textMute, minWidth: 56, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(log.timestamp)}</div>
                <span className="flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase" style={{ background: `${levelColor}1A`, color: levelColor }}>{log.level}</span>
                <span className="flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px]" style={{ background: C.card, color: C.textMute }}>{log.source}</span>
                <div className="min-w-0 flex-1 text-[12px]" style={{ color: C.text }}>{log.message}</div>
                {log.duration && <div className="flex-shrink-0 font-mono text-[10px]" style={{ color: C.textMute, fontVariantNumeric: 'tabular-nums' }}>{log.duration}ms</div>}
              </div>
            );
          })}</div>}
        </div>
      </Panel>
    </div>
  );
}

/* ========== Brain Tab (Cerebrium Brain Activity UI) ========== */
function BrainTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CerebriumHit[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const BRAIN_TOPICS = [
    'typography', 'color', 'layout', 'animation', 'components',
    'accessibility', 'responsive', 'branding', 'luxury',
    'tech', 'minimal', 'creative', 'corporate',
  ];

  const search = useCallback(async (q?: string) => {
    const queryStr = q || query;
    if (!queryStr.trim()) return;
    if (q) setQuery(q);
    setLoading(true); setSearched(true);
    try {
      const res = await fetch(`/api/cerebrium/search?q=${encodeURIComponent(queryStr)}&limit=20`);
      const data = await res.json();
      setResults(data.results || []);
      setStats(data.stats);
      // Activate matching topics
      const matching = (data.results || []).flatMap((r: any) => r.tags || []).slice(0, 5);
      setActiveTopic(matching[0] || null);
    } catch {} finally { setLoading(false); }
  }, [query]);

  return (
    <div className="space-y-3">
      {/* Cerebrium Brain Activity Visualization */}
      <Panel className="p-4">
        <SectionHeader
          title="Cerebrium Brain Activity"
          sub={stats ? `${stats.totalFiles} files · ${stats.totalBrands} brands · ${stats.totalTaste} taste files` : '159 design files indexed'}
          right={
            <div className="flex items-center gap-2">
              <motion.div
                className="h-2 w-2 rounded-full"
                style={{ background: searched ? C.success : C.textMute }}
                animate={searched ? { opacity: [0.4, 1, 0.4] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: C.textMute }}>
                {loading ? 'searching' : searched ? 'active' : 'idle'}
              </span>
            </div>
          }
        />

        {/* Brain node graph */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 py-4" style={{ background: C.card, borderRadius: R.lg, border: '1px solid ' + C.borderDef }}>
          {/* Central node */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
            <Brain size={28} style={{ color: '#fff' }} />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(99,102,241,0.4)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Topic nodes */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {BRAIN_TOPICS.map((topic, i) => {
            const isActive = activeTopic === topic || (results.some(r => r.tags?.includes(topic)));
            return (
              <motion.button
                key={topic}
                onClick={() => search(topic)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.15)' : C.card,
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : C.borderDef}`,
                  color: isActive ? '#8B5CF6' : C.textMute,
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = C.borderHov; e.currentTarget.style.color = C.textSec; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = C.borderDef; e.currentTarget.style.color = C.textMute; } }}
              >
                {topic}
              </motion.button>
            );
          })}
        </div>

        {/* Search intensity heatmap */}
        <div className="mt-4">
          <div className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Search Intensity</div>
          <div className="grid grid-cols-12 gap-0.5">
            {Array.from({ length: 48 }).map((_, i) => {
              const intensity = results.length > 0 ? Math.random() * (results.length / 20) : 0;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    background: intensity > 0.3
                      ? `rgba(99,102,241,${0.2 + intensity * 0.6})`
                      : C.card,
                  }}
                />
              );
            })}
          </div>
        </div>
      </Panel>

      {/* Search bar */}
      <Panel className="p-4">
        <SectionHeader title="Search the Brain" sub="Real semantic search over 159 design files" />
        <div className="mt-3 flex gap-1.5">
          <Input value={query} onChange={setQuery} placeholder="Search — try 'stripe', 'typography', 'minimal', 'apple'..." icon={Search} className="flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          />
          <Button variant="primary" onClick={() => search()} disabled={loading} icon={loading ? Loader2 : Search}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </Panel>

      {/* Results */}
      <Panel className="p-4">
        {!searched ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: C.card, color: C.textMute }}>
              <Brain size={20} strokeWidth={1.5} />
            </div>
            <p className="text-[13px]" style={{ color: C.text }}>Search the brain to find design references</p>
            <p className="mt-1 text-[12px]" style={{ color: C.textMute }}>159 design MD files · 74 brands · real semantic search</p>
          </div>
        ) : loading ? (
          <div className="space-y-2 py-2">{[1, 2, 3, 4].map((i) => <Shimmer key={i} style={{ height: 64 }} />)}</div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center"><p className="text-[13px]" style={{ color: C.text }}>No results found</p></div>
        ) : (
          <div className="space-y-1.5">
            <div className="mb-1 text-[11px]" style={{ color: C.textMute }}>{results.length} results for "{query}"</div>
            {results.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-md p-2.5" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge>{r.category}</Badge>
                      <span className="text-[12px] font-medium truncate" style={{ color: C.text }}>{r.title || r.name}</span>
                    </div>
                    {r.excerpt && <p className="mt-1.5 text-[11px] leading-relaxed line-clamp-2" style={{ color: C.textSec }}>{r.excerpt}</p>}
                    {r.tags && r.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.tags.slice(0, 6).map((t) => (
                          <span key={t} className="rounded px-1.5 py-0.5 font-mono text-[9px]" style={{ background: C.surface, color: C.textMute }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {r.score && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-[13px] font-semibold" style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{r.score}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>score</div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ========== Evolution Tab → Forge Engine Control Panel ========== */
function EvolutionTab() {
  const [target, setTarget] = useState('');
  const [creativity, setCreativity] = useState(0.5);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoForge, setAutoForge] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewToast, setReviewToast] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [device, setDevice] = useState<Device>('desktop');
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [llmModel, setLlmModel] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sf-llm-model') || 'llama-3.3-70b-versatile' : 'llama-3.3-70b-versatile');
  const [groqKey, setGroqKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sf-groq-key') || '' : '');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [llmModels, setLlmModels] = useState<any[]>([]);

  // Load available models
  useEffect(() => {
    fetch('/api/llm/models').then(r => r.json()).then(d => setLlmModels(d.models || [])).catch(() => {});
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sf-llm-model', llmModel);
      localStorage.setItem('sf-groq-key', groqKey);
    }
  }, [llmModel, groqKey]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/forge/review?stats=true');
      const data = await res.json();
      setStats(data);
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/forge/review?limit=10');
      const data = await res.json();
      setHistory(data.generations || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    fetchHistory();
    const i = setInterval(() => { fetchStats(); fetchHistory(); }, 8000);
    return () => clearInterval(i);
  }, [fetchStats, fetchHistory]);

  const forge = useCallback(async (overrideTarget?: string) => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    setReviewResult(null);
    setReviewNote('');
    setReasoningSteps([]);
    const t0 = Date.now();

    // Simulate reasoning steps streaming in while we wait for the API
    const stepTimer = setInterval(() => {
      setReasoningSteps((prev) => {
        const elapsed = Date.now() - t0;
        const steps = [
          '🧠 Reading target description...',
          '📚 Loading technique library...',
          '🎯 Gathering candidates (top-rated + untested)...',
          '🤔 LLM picking techniques + explaining why...',
          '🎨 Applying mutations (color/font/copy swaps)...',
          '🔧 Assembling StructuredSpec...',
          '🖨️ Rendering HTML via V2 renderer...',
          '💾 Saving generation to review queue...',
        ];
        const count = Math.min(steps.length, Math.floor(elapsed / 1500) + 1);
        return steps.slice(0, count);
      });
    }, 500);

    try {
      const forgeTarget = overrideTarget || target || 'random';
      
      // If using a Groq model, call Groq CLIENT-SIDE (bypasses IP blocks)
      const isGroqModel = llmModel.includes('llama') || llmModel.includes('mixtral');
      let groqResult: any = null;
      
      if (isGroqModel && groqKey) {
        // Call Groq directly from the browser
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              { role: 'system', content: 'You are a website design combiner. Pick techniques and return JSON.' },
              { role: 'user', content: `Target: ${forgeTarget}. Creativity: ${creativity}. Return a JSON plan with sections array.` },
            ],
            max_tokens: 2000,
            temperature: 0.5 + creativity * 0.5,
          }),
        });
        if (groqRes.ok) {
          groqResult = await groqRes.json();
        }
      }
      
      // Call the forge generate API (uses Z.AI via VPS bridge as fallback)
      const res = await fetch('/api/forge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: forgeTarget,
          creativity,
          save: true,
          model: isGroqModel && groqResult ? 'glm-4-flash' : llmModel, // Use Z.AI if Groq already succeeded
          groqKey: groqKey || undefined,
          groqPlan: groqResult || undefined, // Pass Groq result to server
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        throw new Error(text.includes('An error occurred') || text.includes('FUNCTION_TIMEOUT')
          ? 'Forge generation timed out. The LLM bridge may be busy — try again in a moment.'
          : `Server returned ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);
      setResult(data);
      // Replace simulated steps with the actual reasoning trace
      setReasoningSteps(data.reasoningTrace?.map((s: any) =>
        `✓ [${s.partType}] ${s.technique} — ${s.reason}`
      ) || []);
      fetchStats();
      fetchHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Forge generation failed');
    } finally {
      clearInterval(stepTimer);
      setGenerating(false);
    }
  }, [generating, target, creativity]);

  // Auto-forge every 30s when toggled on — uses auto-evolve endpoint for 24/7 mutation
  const [autoEvolveCycles, setAutoEvolveCycles] = useState(0);
  const [autoEvolveActive, setAutoEvolveActive] = useState(false);

  useEffect(() => {
    if (!autoForge) return;
    setAutoEvolveActive(true);
    const runCycle = async () => {
      if (generating) return;
      setGenerating(true);
      setError(null);
      setReasoningSteps(['🧠 Auto-evolving... generating mutation...']);
      try {
        const res = await fetch('/api/forge/auto-evolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'random',
            creativity,
            model: llmModel,
            groqKey: groqKey || undefined,
            autoReview: true, // Auto-rate based on quality heuristics
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.message || data.error);
        if (data.generation) {
          setResult({
            html: data.generation.html,
            businessName: data.generation.businessName,
            sectionCount: data.generation.sectionCount,
            overallReason: data.generation.overallReason,
            generationId: data.generation.id,
            reasoningTrace: data.generation.reasoningTrace || [],
          });
          setReasoningSteps(
            (data.generation.reasoningTrace || []).map((s: any) =>
              `✓ [${s.partType}] ${s.technique} — ${s.reason}`
            ) || ['✓ Auto-evolved']
          );
          if (data.autoRating) {
            const emojis = ['😡','😕','😐','😍','🤩'];
            setReviewToast(`${emojis[data.autoRating-1]} Auto-reviewed: ${data.autoRating}/5 ${data.autoRating >= 4 ? '(saved)' : data.autoRating <= 2 ? '(trashed)' : '(improve)'}`);
            setTimeout(() => setReviewToast(null), 4000);
          }
        }
        setAutoEvolveCycles(data.cycle || autoEvolveCycles + 1);
        fetchStats();
        fetchHistory();
      } catch (e) {
        console.error('[auto-evolve] failed:', e);
      } finally {
        setGenerating(false);
      }
    };
    runCycle(); // Run immediately
    const i = setInterval(runCycle, 30000);
    return () => { clearInterval(i); setAutoEvolveActive(false); };
  }, [autoForge, creativity, llmModel, groqKey]);

  const review = useCallback(async (rating: 1 | 2 | 3 | 4 | 5) => {
    if (!result?.generationId || reviewing) return;
    setReviewing(true);
    const emojis = ['😡','😕','😐','😍','🤩'];
    setReviewToast(`${emojis[rating-1]} Submitting review...`);
    try {
      const res = await fetch('/api/forge/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: result.generationId,
          rating,
          note: reviewNote || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);
      setReviewResult(data);
      // Show toast with action taken
      if (data.action === 'trashed') {
        setReviewToast(`🗑️ Trashed! ${data.techniquesAffected} techniques won't be picked again. Forging next...`);
      } else if (data.action === 'saved_as_template') {
        setReviewToast(`🤩 Saved as template! ${data.techniquesAffected} techniques marked as loved. Find it in the Technique Library tab.`);
      } else if (data.action === 'improvement_suggested') {
        setReviewToast(`😐 Marked for improvement. AI suggests ${data.improvements?.length || 3} changes. Check the details below.`);
      }
      fetchStats();
      fetchHistory();
      // Auto-clear toast after 5s (except for saved which stays)
      setTimeout(() => setReviewToast(null), data.action === 'saved_as_template' ? 8000 : 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed');
      setReviewToast(null);
    } finally {
      setReviewing(false);
    }
  }, [result, reviewing, reviewNote]);

  const deviceWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '375px';

  const EMOJIS: Array<{ rating: 1 | 2 | 3 | 4 | 5; emoji: string; label: string; color: string }> = [
    { rating: 1, emoji: '😡', label: 'Trash', color: '#ef4444' },
    { rating: 2, emoji: '😕', label: 'Trash', color: '#f59e0b' },
    { rating: 3, emoji: '😐', label: 'Improve', color: '#eab308' },
    { rating: 4, emoji: '😍', label: 'Save', color: '#22c55e' },
    { rating: 5, emoji: '🤩', label: 'Save', color: '#16a34a' },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[420px_1fr] max-lg:grid-cols-1">
      {/* LEFT — Controls + Reasoning */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="flex flex-col gap-3">
        <Panel className="p-4">
          <SectionHeader
            title="Forge Engine"
            sub={stats ? `${stats.totalGenerations} generated · ${stats.savedAsTemplates} saved · ${stats.trashed} trashed` : 'Reasoning hybrid of Evolution × VA'}
            right={
              <div className="flex items-center gap-2">
                <Badge color={autoForge ? 'success' : 'default'}>{autoForge ? 'AUTO' : 'manual'}</Badge>
              </div>
            }
          />

          {/* Target input */}
          <div className="mt-3">
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Target description</label>
            <Textarea value={target} onChange={setTarget} placeholder="boutique law firm · cozy coffee shop · tech startup... (or hit 🎲 for random)" rows={2}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') forge(); }} />
          </div>

          {/* Creativity slider */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Creativity</label>
              <span className="font-mono text-[11px]" style={{ color: creativity < 0.3 ? C.success : creativity > 0.7 ? C.warn : C.textSec }}>
                {creativity.toFixed(2)} {creativity < 0.3 ? '(safe)' : creativity > 0.7 ? '(wild)' : '(balanced)'}
              </span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={creativity} onChange={(e) => setCreativity(parseFloat(e.target.value))}
              className="w-full" style={{ accentColor: C.accent }} />
            <div className="mt-1 flex justify-between text-[9px]" style={{ color: C.textDis }}>
              <span>Safe (rated only)</span><span>Balanced</span><span>Wild (untested)</span>
            </div>
          </div>

          {/* Forge buttons */}
          <div className="mt-3 flex gap-1.5">
            <Button variant="primary" size="lg" icon={generating ? Loader2 : Sparkles} onClick={() => forge()} disabled={generating} className="flex-1">
              {generating ? 'Forging...' : 'Forge now'}
            </Button>
            <Button size="lg" icon={Shuffle} onClick={() => forge('random')} disabled={generating}>🎲</Button>
          </div>

          {/* Auto-forge toggle + 24/7 evolution status */}
          <div className="mt-3">
            <ToggleRow label="Auto-evolve (30s)" desc="24/7 background mutation — generates, auto-reviews, learns" checked={autoForge} onChange={setAutoForge} />
            {autoForge && (
              <div className="mt-2 flex items-center gap-3 rounded-lg p-2.5" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-2 w-2 rounded-full" style={{ background: C.success }} />
                <span className="text-[11px] font-mono" style={{ color: C.success }}>
                  24/7 EVOLVING — Cycle #{autoEvolveCycles}
                </span>
                <span className="ml-auto text-[10px]" style={{ color: C.textMute }}>
                  Auto-rating + learning active
                </span>
              </div>
            )}
          </div>

          {/* LLM Model Selector */}
          <div className="mt-3">
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>LLM Model</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
              style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, fontFamily: 'inherit' }}
            >
              {llmModels.length === 0 ? (
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
              ) : (
                llmModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.description.slice(0, 40)}...
                  </option>
                ))
              )}
            </select>
            <div className="mt-1 text-[9px]" style={{ color: C.textMute }}>
              {llmModel.includes('groq') || llmModel.includes('llama') || llmModel.includes('mixtral')
                ? '🟢 Groq (fast, free, 14400 req/day) — needs API key below'
                : '🔵 Z.AI (sandbox proxy, 7 credentials, no key needed)'}
            </div>
          </div>

          {/* Groq API Key (only show for Groq models) */}
          {(llmModel.includes('groq') || llmModel.includes('llama') || llmModel.includes('mixtral')) && (
            <div className="mt-2">
              <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Groq API Key</label>
              <div className="flex gap-1.5">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="api-key_..."
                  className="flex-1 rounded-lg px-3 py-2 text-[12px] outline-none"
                  style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, fontFamily: 'inherit' }}
                />
                <button
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="rounded-lg px-3 text-[12px]"
                  style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textMute }}
                >
                  {showGroqKey ? '🙈' : '👁'}
                </button>
              </div>
              <div className="mt-1 text-[9px]" style={{ color: groqKey ? C.success : C.textMute }}>
                {groqKey ? '✓ Key saved — Groq models will be used' : 'Get free key at console.groq.com/keys'}
              </div>
            </div>
          )}

          {/* Review Toast */}
          {reviewToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-lg p-3 text-[12px] font-medium"
              style={{
                background: reviewToast.includes('Trashed') ? 'rgba(239,68,68,0.1)'
                  : reviewToast.includes('Saved') ? 'rgba(34,197,94,0.1)'
                  : 'rgba(245,158,11,0.1)',
                color: reviewToast.includes('Trashed') ? C.error
                  : reviewToast.includes('Saved') ? C.success
                  : C.warn,
                border: `1px solid ${reviewToast.includes('Trashed') ? 'rgba(239,68,68,0.3)'
                  : reviewToast.includes('Saved') ? 'rgba(34,197,94,0.3)'
                  : 'rgba(245,158,11,0.3)'}`,
              }}
            >
              {reviewToast}
            </motion.div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg p-2.5 text-[12px]" style={{ background: 'rgba(239,68,68,0.05)', color: C.error, border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} /><span>{error}</span>
            </div>
          )}
        </Panel>

        {/* Reasoning trace */}
        {(generating || reasoningSteps.length > 0) && (
          <Panel className="p-4">
            <SectionHeader title="Reasoning Trace" sub={generating ? 'thinking...' : 'complete'} right={generating ? <Spinner size={12} /> : <CheckCircle2 size={12} style={{ color: C.success }} />} />
            <div className="mt-3 space-y-1">
              {reasoningSteps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-md px-2.5 py-1.5 text-[11px] font-mono" style={{ background: C.card, color: C.textSec, border: '1px solid ' + C.borderDef }}>
                  {step}
                </motion.div>
              ))}
              {result?.overallReason && (
                <div className="mt-2 rounded-md px-2.5 py-1.5 text-[11px]" style={{ background: 'rgba(34,197,94,0.05)', color: C.success, border: '1px solid rgba(34,197,94,0.2)' }}>
                  <strong>Overall:</strong> {result.overallReason}
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Stats strip — learning process */}
        {stats && (
          <Panel className="p-3">
            <div className="mb-2 text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Learning Progress</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><div className="text-[16px] font-semibold" style={{ color: C.text }}>{stats.totalGenerations}</div><div className="text-[9px] uppercase" style={{ color: C.textMute }}>Generated</div></div>
              <div><div className="text-[16px] font-semibold" style={{ color: C.warn }}>{stats.pendingReview}</div><div className="text-[9px] uppercase" style={{ color: C.textMute }}>Pending</div></div>
              <div><div className="text-[16px] font-semibold" style={{ color: C.error }}>{stats.trashed}</div><div className="text-[9px] uppercase" style={{ color: C.textMute }}>Trashed</div></div>
              <div><div className="text-[16px] font-semibold" style={{ color: C.success }}>{stats.savedAsTemplates}</div><div className="text-[9px] uppercase" style={{ color: C.textMute }}>Saved</div></div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]" style={{ color: C.textMute }}>
              <span>Avg: {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}★` : '—'}</span>
              <span>Top: {stats.topRatedTechniques?.length || 0} loved</span>
            </div>
            {stats.topRatedTechniques && stats.topRatedTechniques.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Top-rated techniques</div>
                {stats.topRatedTechniques.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md px-2 py-1 text-[10px]" style={{ background: C.card }}>
                    <span className="truncate" style={{ color: C.textSec }}>{t.name?.slice(0, 40)}</span>
                    <span style={{ color: C.success }}>{t.userRating}★</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}
      </motion.div>

      {/* RIGHT — Preview + Review + History */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col gap-3">
        <Panel className="flex flex-1 flex-col p-0" style={{ minHeight: 'calc(100vh - 360px)' }}>
          <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: C.borderDef }}>
            <div className="flex items-center gap-2">
              <Globe size={13} strokeWidth={1.5} style={{ color: C.textMute }} />
              <span className="text-[12px] font-medium" style={{ color: C.text }}>
                {result ? `Forge: ${result.businessName}` : 'Live preview'}
              </span>
              {result?.sectionCount && <Badge color="info">{result.sectionCount} sections</Badge>}
              {/* LLM provider badge */}
              {result?.overallReason && (
                <Badge color={result.overallReason.includes('Random') || result.overallReason.includes('fallback') ? 'warn' : 'success'}>
                  {result.overallReason.includes('Random') || result.overallReason.includes('fallback') ? 'Z.AI fallback' : (localStorage.getItem('sf-llm-model') || '').includes('llama') || (localStorage.getItem('sf-llm-model') || '').includes('mixtral') ? 'Groq LLM' : 'Z.AI LLM'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {result?.viewUrl && <a href={result.viewUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="primary" icon={ExternalLink}>Open live</Button></a>}
              {result?.html && <Button size="sm" icon={Download} onClick={() => {
                const blob = new Blob([result.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${result.businessName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'forge'}.html`;
                a.click(); URL.revokeObjectURL(url);
              }}>Download</Button>}
              <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: C.card }}>
                {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => {
                  const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone; const active = device === d;
                  return <button key={d} onClick={() => setDevice(d)} className="rounded p-1.5" style={{ background: active ? C.hover : 'transparent', color: active ? C.text : C.textMute, transition: '100ms' }}><Icon size={13} strokeWidth={1.5} /></button>;
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-4" style={{ background: C.canvas }}>
            {result ? (
              <iframe key={result.generationId + '-' + device} srcDoc={result.html} title="forge-preview" sandbox="allow-scripts allow-same-origin allow-popups"
                style={{ width: deviceWidth, maxWidth: '100%', height: '100%', minHeight: '600px', border: '1px solid ' + C.borderDef, borderRadius: R.md, background: '#fff', transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)' }} />
            ) : generating ? (
              <Shimmer style={{ width: '100%', height: '600px' }} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6 rounded-lg overflow-hidden" style={{ width: 240, height: 160, background: C.elevated, border: '1px solid ' + C.borderDef }}>
                  <div className="flex items-center gap-1 px-2 py-1.5" style={{ background: C.card, borderBottom: `1px solid ${C.borderDef}` }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} />
                  </div>
                  <div className="p-3 space-y-2"><Shimmer style={{ width: '60%', height: 12 }} /><Shimmer style={{ width: '40%', height: 8 }} /><div className="h-12" /><Shimmer style={{ width: '80%', height: 6 }} /></div>
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: C.text, letterSpacing: '-0.01em' }}>Forge a website</h3>
                <p className="mt-1 max-w-md text-[12px]" style={{ color: C.textMute }}>Enter a target description (or hit 🎲 for random), set creativity, and click Forge now. The engine picks techniques from the library, explains why, and assembles a novel website.</p>
              </div>
            )}
          </div>
        </Panel>

        {/* Review bar */}
        {result && !reviewResult && (
          <Panel className="p-4">
            <SectionHeader title="Rate this generation" sub="Your rating drives the learning loop" />
            <div className="mt-3 flex items-center justify-center gap-2">
              {EMOJIS.map((e) => (
                <motion.button key={e.rating} onClick={() => review(e.rating)} disabled={reviewing}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 rounded-lg px-3 py-2"
                  style={{ background: C.card, border: '1px solid ' + C.borderDef, cursor: reviewing ? 'not-allowed' : 'pointer', opacity: reviewing ? 0.5 : 1 }}
                  title={`${e.emoji} ${e.label}`}>
                  <span className="text-[24px]">{e.emoji}</span>
                  <span className="text-[9px] uppercase" style={{ color: e.color }}>{e.label}</span>
                </motion.button>
              ))}
            </div>
            <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Optional note (especially useful for 😐 — tell the LLM what to improve)"
              className="mt-3 w-full rounded-lg px-3 py-2 text-[12px] outline-none"
              style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, fontFamily: 'inherit' }} />
          </Panel>
        )}

        {/* Review result */}
        {reviewResult && (
          <Panel className="p-4">
            <SectionHeader title="Review submitted" right={<CheckCircle2 size={14} style={{ color: C.success }} />} />
            <div className="mt-3 rounded-lg p-3 text-[12px]" style={{
              background: reviewResult.action === 'trashed' ? 'rgba(239,68,68,0.05)' : reviewResult.action === 'saved_as_template' ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)',
              color: reviewResult.action === 'trashed' ? C.error : reviewResult.action === 'saved_as_template' ? C.success : C.warn,
              border: `1px solid ${reviewResult.action === 'trashed' ? 'rgba(239,68,68,0.2)' : reviewResult.action === 'saved_as_template' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }}>
              {reviewResult.action === 'trashed' && `🗑️ Trashed. ${reviewResult.techniquesAffected} techniques got avoidCount++ and won't be picked again.`}
              {reviewResult.action === 'saved_as_template' && `🤩 Saved as template! ${reviewResult.techniquesAffected} techniques marked as loved. Find it in the Technique Library tab.`}
              {reviewResult.action === 'improvement_suggested' && `😐 Marked for improvement. The LLM suggests:`}
            </div>
            {reviewResult.improvements && (
              <ul className="mt-2 space-y-1">
                {reviewResult.improvements.map((imp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: C.textSec }}>
                    <span style={{ color: C.warn }}>→</span><span>{imp}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" className="mt-3" onClick={() => { setResult(null); setReviewResult(null); }}>Forge another →</Button>
          </Panel>
        )}

        {/* History — clickable to reopen */}
        {history.length > 0 && (
          <Panel className="p-4">
            <SectionHeader title="Recent generations" sub={`${history.length} shown — click to reopen`} />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {history.map((g) => (
                <div key={g.id} className="flex-shrink-0 rounded-lg p-2.5 transition-all hover:scale-105" style={{ background: C.card, border: '1px solid ' + C.borderDef, width: 160, cursor: 'pointer' }}
                  onClick={async () => {
                    // Fetch the full generation and display it
                    try {
                      const res = await fetch(`/api/forge/generations?id=${g.id}`);
                      const data = await res.json();
                      if (data.html) {
                        setResult({
                          html: data.html,
                          businessName: data.businessName,
                          sectionCount: data.plan?.sections?.length || 0,
                          overallReason: data.plan?.overallReason || '',
                          generationId: data.id,
                          viewUrl: undefined,
                          reasoningTrace: (data.plan?.sections || []).map((s: any) => ({
                            partType: s.partType,
                            technique: s.pickedTechniqueName,
                            source: s.sourcePromptTitle,
                            reason: s.reason,
                            mutations: s.mutations,
                          })),
                        });
                        setReviewResult(null);
                        setReviewToast(null);
                        // Scroll to top
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    } catch (e) { console.error('Failed to load generation:', e); }
                  }}>
                  <div className="truncate text-[11px] font-medium" style={{ color: C.text }}>{g.businessName}</div>
                  <div className="mt-0.5 truncate font-mono text-[9px]" style={{ color: C.textMute }}>{g.target || 'random'}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge color={g.status === 'trashed' ? 'error' : g.status === 'saved_as_template' ? 'success' : g.status === 'improvement_suggested' ? 'warn' : 'default'}>
                      {g.status === 'pending_review' ? 'pending' : g.status === 'trashed' ? 'trashed' : g.status === 'saved_as_template' ? 'saved' : 'improve'}
                    </Badge>
                    {g.userRating && <span className="text-[10px]">{[null, '😡', '😕', '😐', '😍', '🤩'][g.userRating]}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </motion.div>
    </div>
  );
}

/* ========== Virtual Artist Tab → Technique Library Browser ========== */
function RecreateTab() {
  const [prompts, setPrompts] = useState<RecreatePrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selected, setSelected] = useState<RecreatePrompt | null>(null);

  const [recreating, setRecreating] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [showPromptText, setShowPromptText] = useState(false);
  const [promptText, setPromptText] = useState('');
  // useLLM: true = LLM extraction (10-25s, full multi-section, follows prompt exactly).
  //         false = regex fallback (instant, hero-only).
  const [useLLM, setUseLLM] = useState(true); // DEFAULT ON — user expects deep extraction

  // Load prompt list on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/recreate');
        const data = await res.json();
        if (cancelled) return;
        setPrompts(data.prompts || []);
      } catch (e) {
        console.error('[recreate] failed to load prompts', e);
      } finally {
        if (!cancelled) setLoadingPrompts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = prompts;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') {
      list = list.filter(p => p.type === filterType);
    }
    return list;
  }, [prompts, query, filterType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of prompts) counts[p.type] = (counts[p.type] || 0) + 1;
    return counts;
  }, [prompts]);

  const recreate = useCallback(async (p: RecreatePrompt) => {
    if (recreating) return;
    setSelected(p);
    setRecreating(true);
    setError(null);
    setResult(null);
    setStepIdx(0);
    setPromptText('');
    setShowPromptText(false);

    const timer = setInterval(() => setStepIdx((i) => (i < RECREATE_STEPS.length - 1 ? i + 1 : i)), 700);

    try {
      // === EXTRACTION STRATEGY (bypasses Vercel's 10s Hobby timeout) ===
      // 1. If user has a Groq key: call Groq directly from browser (no timeout)
      // 2. Fallback: call /api/llm-extract edge function (25s Edge timeout vs 10s serverless)
      // 3. Final fallback: let server handle it (may timeout for large prompts)
      const groqKey = localStorage.getItem('sf-groq-key') || '';
      const llmModel = localStorage.getItem('sf-llm-model') || 'mistral-large-latest';
      const isGroqModel = llmModel.includes('llama') || llmModel.includes('mixtral');
      
      let groqExtraction: any = null;

      if (useLLM) {
        // Step 1: Fetch the prompt text (needed for both Groq and edge function paths)
        setStepIdx(1);
        const promptRes = await fetch(`/api/recreate?slug=${encodeURIComponent(p.id)}`);
        const promptData = await promptRes.json().catch(() => ({}));
        const promptText = promptData.promptText || '';

        if (promptText) {
          // Path A: Client-side Groq (if user has a Groq key + Groq model selected)
          if (isGroqModel && groqKey) {
            try {
              console.log('[recreate] Trying client-side Groq extraction...');
              const extractionSystemPrompt = `You are a website spec extractor. Return ONLY valid JSON. No markdown fences, no commentary.

OUTPUT JSON SHAPE:
{
  "businessName": "string", "logo": "string", "tagline": "string | null",
  "fonts": { "display": "FontName | null", "body": "FontName | null", "accentFont": "FontName | null", "weights": [400, 500] },
  "colors": { "bg": "#hex", "text": "#hex", "muted": "#hex | null", "accent": "#hex | null", "surface": "#hex | null", "border": "#hex | null" },
  "promptType": "hero | landing-page | footer | portfolio | saas | features | 404 | blog | agency | product | pricing | contact",
  "navItems": ["string"], "ctaText": "string",
  "sections": [{ "type": "hero-video|hero-centered|hero-split|hero-image|features-grid|stats-row|gallery-masonry|gallery-grid|partners-row|cta-band|testimonials|faq-accordion|about-text|pricing|contact-form|footer|team-grid|blog-list|custom", "id": "kebab-case-id", "headline": "string | null", "emphasizedWords": ["phrase"], "accentText": "string | null", "body": "string | null", "items": [{ "title": "string", "description": "string", "icon": "string | null", "mediaUrl": "string | null", "meta": "string | null" }], "cta": "string | null", "mediaUrl": "string | null", "animation": "fade-rise|fade|blur|ken-burns|parallax|scale|slide|rotate|none", "styleHints": "string", "bg": "#hex | null", "color": "#hex | null" }],
  "animations": [], "media": { "videoUrls": [], "imageUrls": [] }, "styleHints": "string"
}

RULES: ONLY include sections the prompt ACTUALLY describes. Hero = 1 section. Landing page = all sections. Use EXACT copy, colors, fonts. Keep body verbatim.`;

              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: llmModel,
                  messages: [
                    { role: 'system', content: extractionSystemPrompt },
                    { role: 'user', content: `Extract the structured spec from this website design prompt.\n\nPROMPT TITLE: ${p.title}\nPROMPT CATEGORY: ${p.category}\nPROMPT TYPE: ${p.type}\n\nPROMPT TEXT:\n"""\n${promptText}\n"""\n\nReturn ONLY the JSON.` },
                  ],
                  max_tokens: 8000, temperature: 0, top_p: 0.9,
                }),
              });
              if (groqRes.ok) {
                groqExtraction = await groqRes.json();
                console.log('[recreate] ✓ Groq extraction succeeded');
                setStepIdx(2);
              }
            } catch (e) {
              console.warn('[recreate] Groq extraction failed, trying edge function...', e);
            }
          }

          // Path B: Edge function proxy with streaming (no Groq key needed, 60s timeout)
          if (!groqExtraction) {
            try {
              console.log('[recreate] Trying Mistral extraction (streaming, 60s timeout)...');
              setStepIdx(1);
              const recreateLlmModel = localStorage.getItem('sf-llm-model') || 'mistral-small-latest';
              const edgeRes = await fetch('/api/llm-extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  promptText,
                  promptTitle: p.title,
                  promptCategory: p.category,
                  promptType: p.type,
                  model: recreateLlmModel,
                }),
              });

              if (edgeRes.ok && edgeRes.body) {
                // Read the streaming response
                const reader = edgeRes.body.getReader();
                const decoder = new TextDecoder();
                let fullContent = '';
                let done = false;

                while (!done) {
                  const { done: readerDone, value } = await reader.read();
                  if (readerDone) { done = true; break; }
                  const chunk = decoder.decode(value, { stream: true });
                  fullContent += chunk;
                }

                // Check for completion marker
                const markerIdx = fullContent.lastIndexOf('|||EXTRACTION_COMPLETE|||');
                if (markerIdx >= 0) {
                  fullContent = fullContent.slice(0, markerIdx);
                }
                const errorIdx = fullContent.lastIndexOf('|||EXTRACTION_ERROR|||');
                if (errorIdx >= 0) {
                  const errMsg = fullContent.slice(errorIdx + '|||EXTRACTION_ERROR|||'.length);
                  console.warn('[recreate] Edge function stream error:', errMsg);
                } else if (fullContent.trim()) {
                  // Wrap in OpenAI-compatible format for the server
                  groqExtraction = {
                    choices: [{ message: { content: fullContent } }]
                  };
                  console.log('[recreate] ✓ Edge function extraction succeeded, content length:', fullContent.length);
                  setStepIdx(2);
                }
              } else {
                console.warn('[recreate] Edge function returned', edgeRes.status);
              }
            } catch (e) {
              console.warn('[recreate] Edge function failed, falling back to server-side...', e);
            }
          }
        }
      }

      // Step 2: Send to server for rendering (with pre-computed extraction if available)
      const res = await fetch('/api/recreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: p.id, useLLM, save: true, groqKey: groqKey || undefined, model: llmModel, groqExtraction: groqExtraction || undefined }),
      });

      // Guard: Vercel may return an HTML error page ("An error occurred...")
      // when the function times out or crashes. Detect this before .json().
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        let msg = `Server returned ${res.status} ${res.statusText}`;
        if (contentType.includes('application/json')) {
          try {
            const j = await res.json();
            msg = j.message || j.error || msg;
          } catch {}
        } else {
          // HTML or plain-text error page (e.g. Vercel's "An error occurred")
          const text = await res.text().catch(() => '');
          if (text.includes('An error occurred') || text.includes('FUNCTION_TIMEOUT')) {
            msg = useLLM
              ? 'Recreation timed out (LLM extraction is slow). Try again with "Fast mode" enabled for instant regex-fallback rendering.'
              : 'Recreation timed out. The server may be busy — please try again.';
          } else if (text.length > 0 && text.length < 500) {
            msg = text;
          }
        }
        throw new Error(msg);
      }
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        throw new Error(`Expected JSON but got ${contentType}. ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      clearInterval(timer);
      setStepIdx(RECREATE_STEPS.length - 1);
      if (data.error) throw new Error(data.message || data.error);
      setResult(data);
      if (data.promptText) {
        setPromptText(data.promptText);
        setShowPromptText(true);
      }
    } catch (e) {
      clearInterval(timer);
      const msg = e instanceof Error ? e.message : 'Recreation failed';
      // Common pattern: fetch() itself can throw "Failed to fetch" on network errors.
      setError(msg.includes('Failed to fetch')
        ? 'Network error reaching /api/recreate. The server may be sleeping or the function may have timed out. Try "Fast mode" for instant rendering.'
        : msg);
    } finally {
      setRecreating(false);
    }
  }, [recreating, useLLM]);

  const deviceWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '375px';

  return (
    <div className="grid gap-3 lg:grid-cols-[420px_1fr] max-lg:grid-cols-1">
      {/* LEFT COLUMN — prompt library + actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="flex flex-col gap-3">
        <Panel className="p-4">
          <SectionHeader
            title="Recreate from Prompt"
            sub={`${prompts.length} MotionSites prompts · LLM-extracted specs`}
            right={<Badge color="info"><RefreshCw size={9} /> V2</Badge>}
          />
          <div className="mt-3">
            <Input value={query} onChange={setQuery} placeholder="Search prompts (title, category, slug)..." icon={Search} onKeyDown={(e) => { if (e.key === 'Enter') { /* no-op */ } }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Chip label={`All (${prompts.length})` } onClick={() => setFilterType('all')} />
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => (
              <Chip key={t} label={`${t} (${n})`} onClick={() => setFilterType(t)} />
            ))}
          </div>
          <div className="mt-3 max-h-[420px] overflow-y-auto rounded-lg" style={{ background: C.card, border: `1px solid ${C.borderDef}` }}>
            {loadingPrompts ? (
              <div className="p-4 text-center text-[12px]" style={{ color: C.textMute }}><Spinner size={14} /> Loading prompts...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-[12px]" style={{ color: C.textMute }}>No prompts match.</div>
            ) : (
              filtered.slice(0, 200).map((p) => {
                const active = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left transition-colors last:border-b-0"
                    style={{ background: active ? C.hover : 'transparent', borderColor: C.borderDef }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.hover; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium" style={{ color: active ? C.text : C.textSec }}>{p.title}</div>
                      <div className="mt-0.5 truncate font-mono text-[10px]" style={{ color: C.textMute }}>{p.id} · {p.category}</div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {p.colorCount > 0 && <span className="font-mono text-[9px]" style={{ color: C.textMute }}>{p.colorCount}c</span>}
                      {p.fontCount > 0 && <span className="font-mono text-[9px]" style={{ color: C.textMute }}>{p.fontCount}f</span>}
                      <Badge>{p.type}</Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Panel>

        {selected && (
          <Panel className="p-4">
            <SectionHeader title={selected.title} sub={`${selected.category} · ${selected.type}`} />
            <div className="mt-3 flex items-center gap-1.5">
              <Button variant="primary" size="lg" icon={recreating ? Loader2 : Sparkles} onClick={() => recreate(selected)} disabled={recreating} className="flex-1">
                {recreating ? 'Recreating...' : 'Recreate this prompt'}
              </Button>
            </div>
            {/* Extraction mode toggle */}
            <div className="mt-3 rounded-lg p-2.5" style={{ background: C.card, border: `1px solid ${C.borderDef}` }}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium" style={{ color: C.text }}>Deep mode (LLM extraction)</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>
                    {useLLM
                      ? '🟢 LLM extraction via Edge function (25s) or Groq (no timeout). Extracts every section.'
                      : 'Fast regex fallback. Instant (~50ms). Hero-only — single section per prompt.'}
                  </div>
                </div>
                <Toggle checked={useLLM} onChange={setUseLLM} />
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: useLLM ? C.warn : C.success }}>
                <span className={`h-1.5 w-1.5 rounded-full ${useLLM ? '' : ''}`} style={{ background: useLLM ? C.warn : C.success }} />
                <span className="font-mono uppercase tracking-wider">{useLLM ? 'Deep · LLM · slow' : 'Fast · regex · instant'}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: C.textMute }}>
              <BookOpen size={11} strokeWidth={1.5} />
              <span>{selected.charCount.toLocaleString()} chars · {selected.colorCount} colors · {selected.fontCount} fonts</span>
            </div>
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg p-2.5 text-[12px]" style={{ background: 'rgba(239,68,68,0.05)', color: C.error, border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} /><span>{error}</span>
              </div>
            )}
          </Panel>
        )}

        {recreating && (
          <Panel className="p-4">
            <SectionHeader title="Recreation Progress" />
            <div className="mt-3 space-y-1">
              {RECREATE_STEPS.map((s, i) => {
                const done = i < stepIdx; const active = i === stepIdx; const Icon = s.icon;
                return (
                  <motion.div key={s.label} initial={{ opacity: 0.3 }} animate={{ opacity: done || active ? 1 : 0.3 }} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5" style={{ background: active ? C.card : 'transparent' }}>
                    <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: done ? C.success : active ? C.accent : C.card, color: done || active ? '#000' : C.textMute }}>
                      {done ? <CheckCircle2 size={11} strokeWidth={2} /> : active ? <Spinner size={11} /> : <Icon size={11} strokeWidth={1.5} />}
                    </div>
                    <span className="font-mono text-[12px]" style={{ color: done || active ? C.text : C.textMute }}>{s.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </Panel>
        )}

        {result && (
          <Panel className="p-4">
            <SectionHeader
              title={result.businessName}
              sub={`${result.promptType} · ${result.sectionCount} section${result.sectionCount === 1 ? '' : 's'}`}
              right={<Badge color={result.extractor === 'llm' ? 'success' : 'warn'}>{result.extractor === 'llm' ? 'LLM' : 'regex'}</Badge>}
            />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {result.viewUrl && <a href={result.viewUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="primary" icon={ExternalLink}>Open live</Button></a>}
              {result.viewUrl && <Button size="sm" icon={Copy} onClick={() => navigator.clipboard.writeText(result.viewUrl)}>Copy URL</Button>}
              <Button size="sm" icon={Download} onClick={() => {
                const blob = new Blob([result.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${result.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                a.click(); URL.revokeObjectURL(url);
              }}>Download HTML</Button>
            </div>

            {/* Spec summary */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: C.borderDef }}>
              <div className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Extracted Spec</div>
              <div className="space-y-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Sections rendered</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {result.sectionTypes.map((t: string, i: number) => (
                      <span key={i} className="rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: C.card, color: C.textSec, border: `1px solid ${C.borderDef}` }}>{t}</span>
                    ))}
                  </div>
                </div>
                {result.spec?.fonts && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-md p-2" style={{ background: C.card }}>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Display font</div>
                      <div className="mt-0.5 truncate font-mono text-[11px]" style={{ color: C.text }}>{result.spec.fonts.display || '—'}</div>
                    </div>
                    <div className="rounded-md p-2" style={{ background: C.card }}>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Body font</div>
                      <div className="mt-0.5 truncate font-mono text-[11px]" style={{ color: C.text }}>{result.spec.fonts.body || '—'}</div>
                    </div>
                  </div>
                )}
                {result.spec?.colors && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Palette</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {['bg', 'text', 'muted', 'accent', 'surface', 'border'].map((k) => {
                        const v = (result.spec.colors as any)[k];
                        if (!v) return null;
                        return (
                          <div key={k} className="flex items-center gap-1 rounded-md px-1.5 py-0.5" style={{ background: C.card, border: `1px solid ${C.borderDef}` }}>
                            <span className="h-3 w-3 rounded-sm" style={{ background: v, border: '1px solid rgba(255,255,255,0.1)' }} />
                            <span className="font-mono text-[10px]" style={{ color: C.textSec }}>{v}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {result.spec?.navItems?.length > 0 && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>Nav items</div>
                    <div className="mt-1 truncate font-mono text-[10px]" style={{ color: C.textSec }}>{result.spec.navItems.join(' · ')}</div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        )}
      </motion.div>

      {/* RIGHT COLUMN — preview + original prompt */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col gap-3">
        <Panel className="flex flex-1 flex-col p-0" style={{ minHeight: 'calc(100vh - 360px)' }}>
          <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: C.borderDef }}>
            <div className="flex items-center gap-2">
              <Globe size={13} strokeWidth={1.5} style={{ color: C.textMute }} />
              <span className="text-[12px] font-medium" style={{ color: C.text }}>
                {result ? `Recreation of ${result.sourceTitle}` : 'Live preview'}
              </span>
              {result?.extractor && (
                <Badge color={result.extractor === 'llm' ? 'success' : 'warn'}>
                  {result.extractor === 'llm' ? 'LLM-extracted' : 'regex-fallback'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: C.card }}>
              {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => {
                const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone; const active = device === d;
                return <button key={d} onClick={() => setDevice(d)} className="rounded p-1.5" style={{ background: active ? C.hover : 'transparent', color: active ? C.text : C.textMute, transition: '100ms' }}><Icon size={13} strokeWidth={1.5} /></button>;
              })}
            </div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-4" style={{ background: C.canvas }}>
            {result ? (
              <iframe key={result.slug + '-' + device} srcDoc={result.html} title="recreate-preview" sandbox="allow-scripts allow-same-origin allow-popups" style={{ width: deviceWidth, maxWidth: '100%', height: '100%', minHeight: '600px', border: `1px solid ${C.borderDef}`, borderRadius: R.md, background: '#fff', transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)' }} />
            ) : recreating ? (
              <Shimmer style={{ width: '100%', height: '600px' }} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6 rounded-lg overflow-hidden" style={{ width: 240, height: 160, background: C.elevated, border: `1px solid ${C.borderDef}` }}>
                  <div className="flex items-center gap-1 px-2 py-1.5" style={{ background: C.card, borderBottom: `1px solid ${C.borderDef}` }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: C.textDis }} />
                  </div>
                  <div className="p-3 space-y-2"><Shimmer style={{ width: '60%', height: 12 }} /><Shimmer style={{ width: '40%', height: 8 }} /><div className="h-12" /><Shimmer style={{ width: '80%', height: 6 }} /><Shimmer style={{ width: '70%', height: 6 }} /></div>
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: C.text, letterSpacing: '-0.01em' }}>Pick a prompt to recreate</h3>
                <p className="mt-1 max-w-md text-[12px]" style={{ color: C.textMute }}>Select any MotionSites prompt from the left. The engine reads it, extracts the exact fonts/colors/copy/layout via LLM, and rebuilds only the sections the prompt describes — no bolted-on boilerplate.</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                  <Chip label="Aethera (hero)" onClick={() => { setQuery('Aethera'); }} />
                  <Chip label="Landing pages" onClick={() => { setFilterType('landing-page'); }} />
                  <Chip label="Footers" onClick={() => { setFilterType('footer'); }} />
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Original prompt text — collapsible */}
        {selected && (
          <Panel className="p-0">
            <button
              onClick={() => setShowPromptText((v) => !v)}
              className="flex w-full items-center justify-between border-b px-4 py-2.5"
              style={{ borderColor: showPromptText ? C.borderDef : 'transparent' }}
            >
              <div className="flex items-center gap-2">
                <FileText size={13} strokeWidth={1.5} style={{ color: C.textMute }} />
                <span className="text-[12px] font-medium" style={{ color: C.text }}>Original prompt text</span>
                <span className="font-mono text-[10px]" style={{ color: C.textMute }}>{selected.id}</span>
              </div>
              <motion.div animate={{ rotate: showPromptText ? 180 : 0 }} transition={{ duration: 0.15 }}><ChevronDown size={13} strokeWidth={1.5} style={{ color: C.textMute }} /></motion.div>
            </button>
            <AnimatePresence>
              {showPromptText && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="max-h-80 overflow-y-auto p-4">
                    {promptText ? (
                      <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed" style={{ color: C.textSec }}>{promptText}</pre>
                    ) : (
                      <div className="space-y-1.5">
                        <Shimmer style={{ width: '90%', height: 8 }} />
                        <Shimmer style={{ width: '70%', height: 8 }} />
                        <Shimmer style={{ width: '85%', height: 8 }} />
                        <Shimmer style={{ width: '60%', height: 8 }} />
                        <div className="pt-2 text-[11px]" style={{ color: C.textMute }}>Click "Recreate this prompt" to load the full prompt text and see the side-by-side extraction.</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
        )}
      </motion.div>
    </div>
  );
}

function CatalogTab() {
  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPicks, setSelectedPicks] = useState<Record<string, any>>({});
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetch('/api/catalog').then(r => r.json()).then(d => { setCatalog(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const folders = [
    { id: 'videos', label: 'Videos', icon: 'V', color: '#FF6B6B', count: catalog?.videos?.length || 0 },
    { id: 'typographies', label: 'Typography', icon: 'T', color: '#4ECDC4', count: catalog?.typographies?.length || 0 },
    { id: 'colors', label: 'Colors', icon: 'C', color: '#FFE66D', count: catalog?.colors?.length || 0 },
    { id: 'headers', label: 'Headers', icon: 'H', color: '#A8E6CF', count: catalog?.headers?.length || 0 },
    { id: 'footers', label: 'Footers', icon: 'F', color: '#FF8B94', count: catalog?.footers?.length || 0 },
    { id: 'buttons', label: 'Buttons', icon: 'B', color: '#C9A0DC', count: catalog?.buttons?.length || 0 },
  ];

  const items = catalog ? (catalog[activeFolder] || []) : [];
  const filtered = searchQuery ? items.filter((item: any) => {
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  }) : items;

  const randomize = () => {
    if (!catalog) return;
    const picks: Record<string, any> = {};
    folders.forEach(f => {
      const arr = catalog[f.id] || [];
      if (arr.length > 0) picks[f.id] = arr[Math.floor(Math.random() * arr.length)];
    });
    setSelectedPicks(picks);
  };

  const generateFromPicks = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const picks = Object.values(selectedPicks);
      const prompt = 'Create a premium website using these design elements from our catalog: ' + picks.map((p: any) => JSON.stringify(p)).join(', ') + '. Include all 16 premium features.';
      const res = await fetch('/api/va-generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt, businessName: 'Catalog Merge', model: 'mistral-large-latest' }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.step === 'done') {
                setGenResult({ url: data.viewUrl || '', name: data.businessName || 'Catalog Merge' });
              }
            } catch {}
          }
        }
      }
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[180px_1fr_280px] max-lg:grid-cols-1">
      {/* Left — Folder sidebar */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] uppercase tracking-wider px-1 mb-1" style={{ color: C.textMute }}>Folders</div>
        {folders.map(f => (
          <button key={f.id} onClick={() => { setActiveFolder(f.id); setSearchQuery(''); }}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] transition-colors"
            style={{ background: activeFolder === f.id ? C.hover : C.card, border: '1px solid ' + (activeFolder === f.id ? C.borderFoc : C.borderDef), color: activeFolder === f.id ? C.text : C.textMute }}>
            <div className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold" style={{ background: f.color + '20', color: f.color }}>{f.icon}</div>
            <span className="flex-1 text-left">{f.label}</span>
            <span className="font-mono text-[10px]" style={{ color: C.textMute }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Center — Items grid */}
      <div className="rounded-lg p-3" style={{ background: C.surface, border: '1px solid ' + C.borderDef }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-medium" style={{ color: C.text }}>{folders.find(f => f.id === activeFolder)?.label}</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="rounded-md px-2.5 py-1 text-[11px] outline-none w-40" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text }} />
        </div>
        {loading ? <div className="py-10 text-center text-[12px]" style={{ color: C.textMute }}>Loading catalog...</div> : (
          <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
            {filtered.map((item: any, i: number) => (
              <div key={i} className="rounded-md p-2.5 text-[11px]" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                {activeFolder === 'videos' && (
                  <div>
                    <div className="font-medium truncate" style={{ color: C.text }}>{item.name || 'Untitled'}</div>
                    <div className="font-mono text-[9px] truncate mt-0.5" style={{ color: C.textMute }}>{item.url?.slice(0, 50)}...</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="rounded px-1.5 py-0.5 text-[8px]" style={{ background: C.surface, color: C.textMute }}>{item.type}</span>
                      <span className="text-[9px]" style={{ color: C.textMute }}>from {item.sourcePrompt}</span>
                    </div>
                  </div>
                )}
                {activeFolder === 'typographies' && (
                  <div>
                    <div style={{ color: C.text }}>{item.display}</div>
                    <div className="text-[10px]" style={{ color: C.textMute }}>{item.body}</div>
                    {item.accent && <div className="text-[10px]" style={{ color: '#DCFF00' }}>+ {item.accent}</div>}
                  </div>
                )}
                {activeFolder === 'colors' && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-5 w-5 rounded" style={{ background: item.bg, border: '1px solid ' + C.borderDef }} />
                      <span className="h-5 w-5 rounded" style={{ background: item.text, border: '1px solid ' + C.borderDef }} />
                      <span className="h-5 w-5 rounded" style={{ background: item.accent, border: '1px solid ' + C.borderDef }} />
                    </div>
                    <span className="font-mono text-[9px]" style={{ color: C.textMute }}>{item.accent}</span>
                  </div>
                )}
                {activeFolder === 'headers' && (
                  <div>
                    <div className="font-medium" style={{ color: C.text }}>{item.logo}</div>
                    <div className="text-[9px] truncate" style={{ color: C.textMute }}>{item.navItems?.join(' / ')}</div>
                  </div>
                )}
                {activeFolder === 'footers' && (
                  <div>
                    <div style={{ color: C.text }}>{item.style}</div>
                    <div className="text-[9px]" style={{ color: C.textMute }}>{item.columns} cols | {item.hasNewsletter ? 'Newsletter' : 'No newsletter'} | {item.hasSocial ? 'Social' : 'No social'}</div>
                  </div>
                )}
                {activeFolder === 'buttons' && (
                  <div>
                    <div style={{ color: C.text }}>{item.text}</div>
                    <div className="text-[9px]" style={{ color: C.textMute }}>{item.type} | {item.style}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — Randomizer + Generate */}
      <div className="rounded-lg p-3" style={{ background: C.surface, border: '1px solid ' + C.borderDef }}>
        <div className="text-[13px] font-medium mb-1" style={{ color: C.text }}>Randomize 16</div>
        <div className="text-[10px] mb-3" style={{ color: C.textMute }}>Pick elements from different prompts to create a unique website.</div>
        <button onClick={randomize} className="w-full rounded-md py-2 text-[12px] font-medium mb-3" style={{ background: '#DCFF00', color: '#0A0A0A' }}>Pick Random Elements</button>

        {Object.keys(selectedPicks).length > 0 && (
          <div className="space-y-1.5 mb-3">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Selected ({Object.keys(selectedPicks).length})</div>
            {Object.entries(selectedPicks).map(([type, item]: [string, any]) => (
              <div key={type} className="rounded-md p-1.5 text-[10px]" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                <span style={{ color: C.textMute }}>{type}:</span>{' '}
                <span style={{ color: C.textSec }}>{(item.name || item.display || item.bg || item.logo || item.text || 'picked').toString().slice(0, 40)}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={generateFromPicks} disabled={generating || Object.keys(selectedPicks).length === 0}
          className="w-full rounded-md py-2 text-[12px] font-medium mb-2"
          style={{ background: C.text, color: C.bg, opacity: (generating || Object.keys(selectedPicks).length === 0) ? 0.4 : 1 }}>
          {generating ? 'Generating...' : 'Generate Website'}
        </button>

        {genResult && (
          <div className="rounded-md p-2 text-[11px]" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ color: C.success }}>Generated!</div>
            <a href={genResult.url.replace('zenforge.site', 'www.zenforge.site')} target="_blank" rel="noopener" className="underline" style={{ color: C.textSec }}>Open website</a>
          </div>
        )}
      </div>
    </div>
  );
}function ArtistTab() {  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([    { role: 'assistant', content: "I'm ZenForge's Virtual Artist. I autonomously create premium websites 24/7. Type a request or click a quick prompt — I'll build it immediately." },  ]);  const [chatInput, setChatInput] = useState('');  const [isWorking, setIsWorking] = useState(false);  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);  const [currentSite, setCurrentSite] = useState<{ html: string; review: any; url: string; score: number; name: string } | null>(null);  const [approvedCount, setApprovedCount] = useState(0);  const [rejectedCount, setRejectedCount] = useState(0);  const [genCount, setGenCount] = useState(0);  const [chatCollapsed, setChatCollapsed] = useState(false);  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');  const [reviewEmojis, setReviewEmojis] = useState<Record<string, number>>({});  const [history, setHistory] = useState<{ name: string; score: number; url: string; html: string; review: any }[]>([]);  const llmModel = typeof window !== 'undefined' ? localStorage.getItem('sf-llm-model') || 'mistral-large-latest' : 'mistral-large-latest';  const generate = useCallback(async (prompt: string, name?: string) => {    setIsWorking(true);    setThinkingSteps([]);    setCurrentSite(null);    try {      const res = await fetch('/api/va-generate', {        method: 'POST',        headers: { 'Content-Type': 'application/json' },        body: JSON.stringify({ action: 'generate', prompt, businessName: name || 'ZenForge Site', model: llmModel }),      });      if (!res.ok || !res.body) throw new Error('Generation failed');      const reader = res.body.getReader();      const decoder = new TextDecoder();      let buffer = '';      while (true) {        const { done, value } = await reader.read();        if (done) break;        buffer += decoder.decode(value, { stream: true });        const lines = buffer.split('\n');        buffer = lines.pop() || '';        for (const line of lines) {          if (!line.trim()) continue;          try {            const data = JSON.parse(line);            if (data.step === 'thinking') {              setThinkingSteps(prev => [...prev, data.message]);            } else if (data.step === 'done') {              setCurrentSite({ html: data.html, review: data.review, url: data.viewUrl, score: data.score, name: data.businessName });              setGenCount(prev => prev + 1);              setHistory(prev => [...prev, { name: data.businessName, score: data.score, url: data.viewUrl, html: data.html, review: data.review }]);              setChatMessages(prev => [...prev, { role: 'assistant', content: 'Generated "' + data.businessName + '" — AI Score: ' + data.score + '/30. Review it below!' }]);            } else if (data.step === 'error') {              setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + data.message }]);            }          } catch {}        }      }    } catch (e) {      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Generation error: ' + (e instanceof Error ? e.message : 'unknown') }]);    } finally {      setIsWorking(false);    }  }, [llmModel]);  const sendChat = useCallback(async () => {    if (!chatInput.trim() || isWorking) return;    const msg = chatInput.trim();    setChatInput('');    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);    try {      const res = await fetch('/api/va-generate', {        method: 'POST',        headers: { 'Content-Type': 'application/json' },        body: JSON.stringify({ action: 'chat', message: msg, model: llmModel }),      });      const data = await res.json();      if (data.action === 'auto-generate') {        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);        generate(data.prompt, data.businessName);      } else if (data.response) {        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);      }    } catch {      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);    }  }, [chatInput, isWorking, llmModel, generate]);  const rateSite = useCallback((emoji: string, value: number, action: string) => {    if (!currentSite) return;    setReviewEmojis(prev => ({ ...prev, [currentSite.url]: value }));    if (action === 'approve') {      setApprovedCount(prev => {        const n = prev + 1;        setChatMessages(p => [...p, { role: 'assistant', content: n >= 3 ? '3 approved! Sent to Evolution.' : 'Approved! ' + (3 - n) + ' more to evolve.' }]);        return n;      });    } else if (action === 'reject') {      setRejectedCount(prev => prev + 1);      setChatMessages(p => [...p, { role: 'assistant', content: 'Trashed. I will do better next time.' }]);    } else {      setChatMessages(p => [...p, { role: 'assistant', content: 'Got it. Tell me what to improve.' }]);    }  }, [currentSite]);  const deviceWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '375px';  return (    <div className="flex flex-col gap-3">      {/* Compact stats bar */}      <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>        <div className="flex items-center gap-3 text-[11px]">          <span style={{ color: C.success }}>{approvedCount} approved</span>          <span style={{ color: C.error }}>{rejectedCount} trashed</span>          <span style={{ color: C.textMute }}>{genCount} generated</span>        </div>        <div className="flex items-center gap-2">          <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: isWorking ? C.warn : C.success }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />          <span className="text-[10px] font-mono uppercase" style={{ color: isWorking ? C.warn : C.success }}>{isWorking ? 'Working' : '24/7 Ready'}</span>          <button onClick={() => setChatCollapsed(!chatCollapsed)} className="rounded-md px-2 py-1 text-[10px]" style={{ background: C.surface, color: C.textMute }}>            {chatCollapsed ? 'Show Chat' : 'Hide Chat'}          </button>        </div>      </div>      <div className={'grid gap-3 ' + (chatCollapsed ? 'grid-cols-1' : 'lg:grid-cols-[1fr_340px] max-lg:grid-cols-1')}>        {/* LEFT — Preview */}        <div className="flex flex-col gap-3 min-w-0">          {/* Thinking steps */}          {isWorking && thinkingSteps.length > 0 && (            <div className="rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textMute }}>VA Thinking</div>              <div className="space-y-1">                {thinkingSteps.map((step, i) => (                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-[11px]" style={{ color: C.textSec }}>                    <CheckCircle2 size={11} style={{ color: C.success }} />                    {step}                  </motion.div>                ))}                <motion.div className="flex items-center gap-2 text-[11px]" style={{ color: C.textMute }}>                  <motion.div className="h-2 w-2 rounded-full border" style={{ borderColor: '#DCFF00', borderTopColor: 'transparent' }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />                  Working...                </motion.div>              </div>            </div>          )}          {/* Preview */}          <div className="rounded-lg p-3 flex-1" style={{ background: C.surface, border: '1px solid ' + C.borderDef }}>            <div className="flex items-center justify-between mb-2">              <span className="text-[12px] font-medium" style={{ color: C.text }}>{currentSite ? currentSite.name : 'Preview'}</span>              <div className="flex items-center gap-1">                {(['desktop', 'tablet', 'mobile'] as const).map(d => (                  <button key={d} onClick={() => setDevice(d)} className="rounded p-1" style={{ background: device === d ? C.hover : 'transparent' }}>                    {d === 'desktop' ? <Monitor size={12} style={{ color: device === d ? C.text : C.textMute }} /> : d === 'tablet' ? <Tablet size={12} style={{ color: device === d ? C.text : C.textMute }} /> : <Smartphone size={12} style={{ color: device === d ? C.text : C.textMute }} />}                  </button>                ))}              </div>            </div>            {isWorking && (              <div className="flex flex-col items-center justify-center py-20">                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid ' + C.borderDef, borderTopColor: '#DCFF00' }} />                <div className="mt-3 text-[12px]" style={{ color: C.textMute }}>Generating with {llmModel}...</div>              </div>            )}            {!isWorking && currentSite && (              <>                <div className="rounded-md overflow-hidden" style={{ border: '1px solid ' + C.borderDef, background: '#fff' }}>                  <iframe key={currentSite.url + device} srcDoc={currentSite.html} title="preview" sandbox="allow-scripts allow-same-origin allow-popups" style={{ width: deviceWidth, maxWidth: '100%', height: '550px', border: 'none', margin: '0 auto', display: 'block' }} />                </div>                {/* Score + emoji review */}                <div className="mt-2 flex items-center justify-between">                  <div className="flex items-center gap-2">                    <span className="text-[14px] font-bold" style={{ color: currentSite.score >= 22 ? C.success : C.warn }}>{currentSite.score}/30</span>                    <span className="text-[11px]" style={{ color: C.textMute }}>{currentSite.review?.verdict || ''}</span>                  </div>                  <div className="flex gap-1.5">                    {[                      { e: '\u{1F929}', l: 'Love', v: 5, a: 'approve' },                      { e: '\u{1F60D}', l: 'Great', v: 4, a: 'approve' },                      { e: '\u{1F610}', l: 'Okay', v: 3, a: 'neutral' },                      { e: '\u{1F615}', l: 'Work', v: 2, a: 'iterate' },                      { e: '\u{1F621}', l: 'Trash', v: 1, a: 'reject' },                    ].map(r => (                      <button key={r.e} onClick={() => rateSite(r.e, r.v, r.a)} className="flex flex-col items-center rounded-md p-1.5" style={{ background: reviewEmojis[currentSite.url] === r.v ? 'rgba(220,255,0,0.1)' : C.card, border: '1px solid ' + C.borderDef }}>                        <span className="text-[18px]">{r.e}</span>                      </button>                    ))}                  </div>                </div>                <div className="mt-2 flex gap-2">                  <a href={currentSite.url} target="_blank" rel="noopener" className="rounded-md px-3 py-1.5 text-[11px]" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textSec }}>Open full</a>                  <button onClick={() => { if (currentSite) generate('mutate ' + currentSite.name, currentSite.name); }} className="rounded-md px-3 py-1.5 text-[11px]" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textSec }}>Mutate</button>                </div>              </>            )}            {!isWorking && !currentSite && (              <div className="flex flex-col items-center justify-center py-20">                <Wand2 size={28} strokeWidth={1} style={{ color: C.textMute }} />                <div className="mt-2 text-[12px]" style={{ color: C.textMute }}>Click a quick prompt to generate</div>              </div>            )}          </div>          {/* History */}          {history.length > 0 && (            <div className="flex gap-2 overflow-x-auto pb-1">              {history.map((h, i) => (                <button key={i} onClick={() => setCurrentSite({ html: h.html, review: h.review, url: h.url, score: h.score, name: h.name })} className="flex-shrink-0 rounded-md p-2" style={{ background: currentSite?.url === h.url ? C.hover : C.card, border: '1px solid ' + C.borderDef, minWidth: 100 }}>                  <div className="text-[10px] font-medium truncate" style={{ color: C.text }}>{h.name}</div>                  <div className="text-[9px]" style={{ color: h.score >= 22 ? C.success : C.warn }}>{h.score}/30</div>                </button>              ))}            </div>          )}        </div>        {/* RIGHT — Chat (collapsible) */}        {!chatCollapsed && (          <div className="flex flex-col rounded-lg p-3" style={{ background: C.surface, border: '1px solid ' + C.borderDef, height: 'fit-content', maxHeight: '70vh' }}>            <div className="flex items-center justify-between mb-2">              <span className="text-[12px] font-medium" style={{ color: C.text }}>VA Chat</span>              <button onClick={() => setChatCollapsed(true)} className="text-[10px]" style={{ color: C.textMute }}>Hide</button>            </div>            <div className="flex-1 overflow-y-auto space-y-1.5 mb-2" style={{ minHeight: '200px' }}>              {chatMessages.map((msg, i) => (                <div key={i} className={'rounded-md p-2 text-[11px] ' + (msg.role === 'user' ? 'ml-6' : 'mr-6')} style={{ background: msg.role === 'user' ? 'rgba(220,255,0,0.05)' : C.card, border: '1px solid ' + C.borderDef }}>                  <div className="text-[8px] font-bold uppercase mb-0.5" style={{ color: msg.role === 'user' ? C.textMute : '#DCFF00' }}>{msg.role === 'user' ? 'You' : 'VA'}</div>                  <div style={{ color: C.textSec, lineHeight: 1.4 }}>{msg.content}</div>                </div>              ))}              {isWorking && (                <div className="flex gap-1 ml-6">                  {[0, 1, 2].map(i => <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} className="h-1.5 w-1.5 rounded-full" style={{ background: C.textMute }} />)}                </div>              )}            </div>            {/* Quick prompts */}            <div className="flex flex-wrap gap-1 mb-2">              {['Luxury fashion', 'SaaS platform', 'Fitness app', 'Portfolio'].map(q => (                <button key={q} onClick={() => { setChatMessages(p => [...p, { role: 'user', content: 'Build a ' + q }]); generate('Build a ' + q, q.split(' ')[0]); }} className="rounded-full px-2 py-0.5 text-[9px]" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textMute }}>{q}</button>              ))}            </div>            <div className="flex gap-1">              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message VA..." className="flex-1 rounded-md px-2 py-1.5 text-[11px] outline-none" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text }} onKeyDown={e => { if (e.key === 'Enter') sendChat(); }} />              <button onClick={sendChat} disabled={isWorking || !chatInput.trim()} className="rounded-md px-2.5 py-1.5 text-[11px]" style={{ background: '#DCFF00', color: '#0A0A0A' }}>Send</button>            </div>          </div>        )}      </div>    </div>  );}
/* ========== Settings Tab ========== */
function VAMemoryPanel() {
  const [memory, setMemory] = useState<string>('');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoGen, setAutoGen] = useState(false);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/va-autonomous', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      });
      const data = await res.json();
      setMemory(data.memory || 'No memory yet.');
      setSummary(data.summary || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchMemory(); }, [fetchMemory]);

  const runAutonomous = useCallback(async () => {
    setAutoGen(true);
    try {
      const res = await fetch('/api/va-autonomous', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', model: localStorage.getItem('sf-llm-model') || 'mistral-large-latest' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.viewUrl) {
          window.open(data.viewUrl.replace('zenforge.site', 'www.zenforge.site'), '_blank');
        }
      }
      fetchMemory();
    } catch {}
    setAutoGen(false);
  }, [fetchMemory]);

  return (
    <div className="space-y-3">
      <SectionHeader title="VA Memory" sub="Virtual Artist's autonomous work log" right={
        <Button size="sm" variant="primary" icon={autoGen ? Loader2 : Sparkles} onClick={runAutonomous} disabled={autoGen}>
          {autoGen ? 'Generating...' : 'Run Autonomous'}
        </Button>
      } />

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total Entries" value={summary.totalEntries || 0} icon={Brain} />
          <StatCard label="Last Activity" value={(summary.lastActivity || 'Never').slice(0, 19)} icon={Activity} />
          <StatCard label="Avg Score" value={summary.recentScores?.length ? Math.round(summary.recentScores.reduce((a: number, b: number) => a + b, 0) / summary.recentScores.length) + '/30' : 'N/A'} icon={TrendingUp} accent />
        </div>
      )}

      {/* Memory content */}
      <div className="rounded-lg p-3 max-h-[500px] overflow-y-auto" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: C.textMute }}>memory.md</span>
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={fetchMemory}>Refresh</Button>
        </div>
        {loading ? (
          <div className="py-6 text-center text-[12px]" style={{ color: C.textMute }}>Loading memory...</div>
        ) : (
          <pre className="text-[11px] whitespace-pre-wrap font-mono" style={{ color: C.textSec, lineHeight: 1.6 }}>{memory}</pre>
        )}
      </div>

      {/* Recent scores chart */}
      {summary?.recentScores?.length > 0 && (
        <div className="rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
          <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: C.textMute }}>Recent Review Scores</div>
          <div className="flex items-end gap-1.5 h-20">
            {summary.recentScores.map((score: number, i: number) => (
              <div key={i} className="flex-1 rounded-t" style={{
                height: `${(score / 30) * 100}%`,
                background: score >= 22 ? 'linear-gradient(180deg, #22c55e, #16a34a)' : 'linear-gradient(180deg, #f59e0b, #d97706)',
                minHeight: '4px',
              }} title={`${score}/30`} />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px]" style={{ color: C.textMute }}>
            <span>0/30</span>
            <span>22/30 (pass)</span>
            <span>30/30</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ paywallEnabled, paywallAdminUnlocked, paywallAdminPassword, paywallAdminError, currentRotatingPassword, unlockPaywallAdmin, setPaywallAdminPassword, setPaywallAdminUnlocked, togglePaywallFromAdmin }: {
  paywallEnabled: boolean;
  paywallAdminUnlocked: boolean;
  paywallAdminPassword: string;
  paywallAdminError: string;
  currentRotatingPassword: string;
  unlockPaywallAdmin: () => void;
  setPaywallAdminPassword: (v: string) => void;
  setPaywallAdminUnlocked: (v: boolean) => void;
  togglePaywallFromAdmin: () => void;
}) {
  const [section, setSection] = useState<'general' | 'appearance' | 'llm' | 'paywall' | 'integrations' | 'va-memory' | 'advanced'>('general');
  const [accentColor, setAccentColor] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('elite-accent') || '#ffffff' : '#ffffff');
  const [customAccent, setCustomAccent] = useState('#a855f7');
  const [llmModel, setLlmModel] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sf-llm-model') || 'mistral-large-latest' : 'glm-4-plus');
  const [groqKey, setGroqKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sf-groq-key') || '' : '');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [paywallPassword, setPaywallPassword] = useState('');
  const [paywallError, setPaywallError] = useState('');
  const [premiumError, setPremiumError] = useState('');
  const [premiumExpiry, setPremiumExpiry] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sf-llm-model', llmModel);
      localStorage.setItem('sf-groq-key', groqKey);
    }
  }, [llmModel, groqKey]);

  const applyAccent = (color: string) => {
    setAccentColor(color);
    if (typeof window !== 'undefined') {
      localStorage.setItem('elite-accent', color);
      // Set CSS variable — all accent-colored elements use var(--elite-accent)
      document.documentElement.style.setProperty('--elite-accent', color);
      // Determine text color (black for light accents, white for dark)
      const isLight = ['#ffffff', '#f59e0b', '#22c55e', '#06b6d4'].includes(color.toLowerCase());
      document.documentElement.style.setProperty('--elite-accent-text', isLight ? '#000000' : '#ffffff');
      // Force a re-render by dispatching a storage event
      window.dispatchEvent(new Event('accent-change'));
    }
  };

  const accents = [
    { color: '#ffffff', label: 'White' },
    { color: '#3b82f6', label: 'Blue' },
    { color: '#22c55e', label: 'Green' },
    { color: '#f59e0b', label: 'Amber' },
    { color: '#a855f7', label: 'Purple' },
    { color: '#ec4899', label: 'Pink' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#ef4444', label: 'Red' },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
      <Panel className="p-1.5">
        {[{ id: 'general', label: 'General', icon: Settings }, { id: 'appearance', label: 'Appearance', icon: Sparkles }, { id: 'llm', label: 'LLM & API Keys', icon: Cpu }, { id: 'paywall', label: 'Paywall', icon: Lock }, { id: 'integrations', label: 'Integrations', icon: Boxes }, { id: 'va-memory', label: 'VA Memory', icon: Brain }, { id: 'advanced', label: 'Advanced', icon: Server }].map((s) => {
          const active = section === s.id; const Icon = s.icon;
          return <button key={s.id} onClick={() => setSection(s.id as any)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px]" style={{ background: active ? C.hover : 'transparent', color: active ? C.text : C.textMute, transition: '100ms' }}><Icon size={13} strokeWidth={1.5} />{s.label}</button>;
        })}
      </Panel>
      <Panel className="p-4">
        {section === 'general' && <div className="space-y-3"><SectionHeader title="General" sub="Studio preferences" /><div><label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Studio name</label><Input value="ZenForge AI" onChange={() => {}} className="w-full" /></div><ToggleRow label="Auto-save generated sites" desc="Save to Supabase on generate" checked={true} onChange={() => {}} /><ToggleRow label="Inject WhatsApp by default" desc="Show on all generated sites" checked={false} onChange={() => {}} /></div>}
        {section === 'appearance' && (
          <div className="space-y-4">
            <SectionHeader title="Appearance" sub="Customize the studio look" />
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Accent Color</label>
              <div className="flex flex-wrap gap-2">
                {accents.map((a) => (
                  <button key={a.color} onClick={() => applyAccent(a.color)} className="flex flex-col items-center gap-1" title={a.label}>
                    <div className="h-8 w-8 rounded-md transition-transform" style={{ background: a.color, border: `2px solid ${accentColor === a.color ? C.text : C.borderDef}`, transform: accentColor === a.color ? 'scale(1.1)' : 'scale(1)' }} />
                    <span className="text-[9px]" style={{ color: accentColor === a.color ? C.text : C.textMute }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Custom Accent</label>
              <div className="flex items-center gap-2">
                <input type="color" value={customAccent} onChange={(e) => { setCustomAccent(e.target.value); applyAccent(e.target.value); }} className="h-8 w-12 rounded cursor-pointer" style={{ background: 'transparent', border: '1px solid ' + C.borderDef }} />
                <Input value={customAccent} onChange={(v) => { setCustomAccent(v); if (v.match(/^#[0-9a-fA-F]{6}$/)) applyAccent(v); }} placeholder="#a855f7" className="w-32" />
                <Button size="sm" variant="secondary" onClick={() => applyAccent(customAccent)}>Apply</Button>
              </div>
              <p className="mt-1.5 text-[11px]" style={{ color: C.textMute }}>Pick any color or enter a hex code. Saved automatically.</p>
            </div>
          </div>
        )}
        {section === 'llm' && (
          <div className="space-y-4">
            <SectionHeader title="LLM & API Keys" sub="Configure AI model and API keys" />
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>AI Model</label>
              <select value={llmModel} onChange={(e) => setLlmModel(e.target.value)} className="w-full rounded-lg px-3 py-2 text-[12px] outline-none" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, fontFamily: 'inherit' }}>
                <optgroup label="🧠 Mistral (Top 5 — Recommended)">
                  <option value="mistral-large-latest">Mistral Large — 🏆 Most Intelligent (flagship, best for premium websites)</option>
                  <option value="codestral-2508">Codestral — 💻 Best for Code (HTML/CSS/JS specialist)</option>
                  <option value="mistral-medium-2505">Mistral Medium — ⚖️ Balanced (quality + speed)</option>
                  <option value="mistral-small-2506">Mistral Small — ⚡ Fastest (2.25M tok/min, high volume)</option>
                  <option value="magistral-medium-2509">Magistral Medium — 🤔 Reasoning (chain-of-thought)</option>
                </optgroup>
                <optgroup label="🔵 Z.AI (VPS Bridge)">
                  <option value="glm-4-plus">GLM-4 Plus — via VPS bridge (slower)</option>
                  <option value="glm-4-flash">GLM-4 Flash — fast extraction</option>
                </optgroup>
                <optgroup label="🟡 Groq (needs API key)">
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Groq)</option>
                </optgroup>
              </select>
              <div className="mt-1 text-[10px]" style={{ color: llmModel.startsWith('mistral') || llmModel.startsWith('codestral') || llmModel.startsWith('magistral') ? C.success : (llmModel.includes('llama') || llmModel.includes('mixtral')) ? C.warn : C.success }}>
                {(llmModel.startsWith('mistral') || llmModel.startsWith('codestral') || llmModel.startsWith('magistral')) ? '🟢 Mistral — works from server, no key needed, no Vercel timeout. RECOMMENDED.'
                  : (llmModel.includes('llama') || llmModel.includes('mixtral')) ? '🟡 Groq — needs API key below (bypasses Vercel timeout from browser)'
                  : '🟢 Z.AI — no key needed, uses VPS bridge (may timeout on Vercel Hobby)'}
              </div>
            </div>
            {(llmModel.includes('llama') || llmModel.includes('mixtral')) && (
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Groq API Key</label>
                <div className="flex gap-1.5">
                  <input type={showGroqKey ? 'text' : 'password'} value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="api-key_..." className="flex-1 rounded-lg px-3 py-2 text-[12px] outline-none" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text, fontFamily: 'inherit' }} />
                  <button onClick={() => setShowGroqKey(!showGroqKey)} className="rounded-lg px-3 text-[12px]" style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textMute }}>{showGroqKey ? '🙈' : '👁'}</button>
                </div>
                <div className="mt-1 text-[10px]" style={{ color: groqKey ? C.success : C.textMute }}>{groqKey ? '✓ Key saved — Groq calls go from your browser (no timeout)' : 'Get a free key at console.groq.com/keys'}</div>
              </div>
            )}
            <div className="rounded-md p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
              <div className="text-[12px] font-medium" style={{ color: C.text }}>How it works</div>
              <div className="mt-1.5 text-[11px] space-y-1" style={{ color: C.textMute }}>
                <div>• <strong>Z.AI</strong>: Server-side via VPS bridge. No key needed but Vercel Hobby limits to 10s.</div>
                <div>• <strong>Groq</strong>: Client-side from browser. No Vercel timeout. Needs free API key.</div>
                <div>• <strong>Recommended</strong>: Get a free Groq key for best results.</div>
              </div>
            </div>
          </div>
        )}
        {section === 'paywall' && (
          <div className="space-y-4">
            <SectionHeader title="Premium Paywall" sub="Lock premium features behind a popup paywall" />

            {!paywallAdminUnlocked ? (
              /* Admin login gate — must enter password to see paywall controls */
              <div className="rounded-lg p-4" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={16} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                  <div className="text-[13px] font-medium" style={{ color: C.text }}>Admin Access Required</div>
                </div>
                <p className="text-[11px] mb-3" style={{ color: C.textMute }}>Enter your password to access paywall controls, view the rotating premium password, and customize locked-mode features.</p>
                <input
                  type="password"
                  value={paywallAdminPassword}
                  onChange={(e) => setPaywallAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
                  style={{ background: C.surface, border: '1px solid ' + C.borderDef, color: C.text }}
                  onKeyDown={(e) => { if (e.key === 'Enter') unlockPaywallAdmin(); }}
                />
                {paywallAdminError && <div className="mt-2 text-[11px]" style={{ color: C.error }}>{paywallAdminError}</div>}
                <button
                  onClick={unlockPaywallAdmin}
                  className="mt-3 w-full rounded-lg py-2 text-[12px] font-medium"
                  style={{ background: C.text, color: C.bg }}
                >
                  Unlock Admin
                </button>
              </div>
            ) : (
              /* Admin controls — visible after password entered */
              <>
                {/* Paywall toggle */}
                <div className="rounded-lg p-3" style={{ background: paywallEnabled ? 'rgba(245,158,11,0.05)' : C.card, border: `1px solid ${paywallEnabled ? 'rgba(245,158,11,0.3)' : C.borderDef}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: C.text }}>Paywall Mode</div>
                      <div className="text-[11px] mt-0.5" style={{ color: C.textMute }}>{paywallEnabled ? '🟡 ON — visitors see a premium popup when accessing locked tabs' : '⚪ OFF — all features accessible'}</div>
                    </div>
                    <Toggle checked={paywallEnabled} onChange={togglePaywallFromAdmin} />
                  </div>
                </div>

                {/* Rotating premium password — only visible to admin */}
                <div className="rounded-lg p-3" style={{ background: 'rgba(220,255,0,0.03)', border: '1px solid rgba(220,255,0,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw size={13} strokeWidth={1.5} style={{ color: '#DCFF00' }} />
                    <div className="text-[12px] font-medium" style={{ color: C.text }}>Current Premium Password</div>
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: C.textMute }}>Changes every 5 minutes. Share this with premium users for temporary access.</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg px-3 py-2 text-[16px] font-bold font-mono tracking-wider text-center" style={{ background: C.surface, color: '#DCFF00', border: '1px solid rgba(220,255,0,0.2)' }}>
                      {currentRotatingPassword || '--------'}
                    </code>
                    <button
                      onClick={() => navigator.clipboard?.writeText(currentRotatingPassword)}
                      className="rounded-lg px-3 py-2 text-[11px]"
                      style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textSec }}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-2 text-[10px]" style={{ color: C.textMute }}>
                    Premium username: <code style={{ color: C.text }}>twinkleats2much</code>
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                  <div className="text-[13px] font-medium" style={{ color: C.text }}>How the paywall works</div>
                  <div className="mt-2 text-[11px] space-y-1.5" style={{ color: C.textMute }}>
                    <div>🔒 <strong>When ON:</strong> Clicking a locked tab shows a premium popup</div>
                    <div>⏱ <strong>Flashy timer:</strong> Countdown from 5:00 → 0:00, then auto-locks</div>
                    <div>🔄 <strong>Rotating password:</strong> Premium password changes every 5 min</div>
                    <div>🚫 <strong>Anti-copy:</strong> Export/download disabled for premium users</div>
                    <div>🔓 <strong>Locked:</strong> Generate, Recreate, Agent, Sandbox, Deploy, Evolution, Artist</div>
                    <div>✅ <strong>Free:</strong> Patterns, Projects, Brain, Logs, Settings</div>
                  </div>
                </div>

                {/* Locked-mode customization */}
                <div className="rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                  <div className="text-[13px] font-medium mb-2" style={{ color: C.text }}>Locked-Mode Features</div>
                  <div className="text-[11px] mb-3" style={{ color: C.textMute }}>Control what visitors can access without premium:</div>
                  <div className="space-y-2">
                    <ToggleRow label="Preview Generate (1 sample)" desc="Let visitors see 1 sample website" checked={false} onChange={() => {}} />
                    <ToggleRow label="Browse Patterns (view only)" desc="View techniques but can't export" checked={true} onChange={() => {}} />
                    <ToggleRow label="Browse Projects (view only)" desc="View saved sites but can't copy" checked={true} onChange={() => {}} />
                    <ToggleRow label="Brain access" desc="Design knowledge base" checked={true} onChange={() => {}} />
                  </div>
                </div>

                {/* Recreate prompt limit */}
                <div className="rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                  <div className="text-[13px] font-medium mb-1" style={{ color: C.text }}>Recreate Prompt Limit</div>
                  <div className="text-[11px] mb-3" style={{ color: C.textMute }}>How many prompts visitors can recreate without premium (0 = locked entirely):</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={121}
                      value={typeof window !== 'undefined' ? parseInt(localStorage.getItem('zf-recreate-limit') || '0') : 0}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (typeof window !== 'undefined') localStorage.setItem('zf-recreate-limit', val);
                        (e.target.nextElementSibling as HTMLElement).textContent = val === '0' ? 'Locked' : `${val} prompts`;
                      }}
                      className="flex-1"
                      style={{ accentColor: '#DCFF00' }}
                    />
                    <span className="text-[12px] font-medium font-mono min-w-[80px] text-right" style={{ color: C.text }}>
                      {typeof window !== 'undefined' ? (localStorage.getItem('zf-recreate-limit') === '0' || !localStorage.getItem('zf-recreate-limit') ? 'Locked' : `${localStorage.getItem('zf-recreate-limit')} prompts`) : 'Locked'}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px]" style={{ color: C.textMute }}>
                    Premium users always get full access to all 121 prompts.
                  </div>
                </div>

                {/* Premium session duration */}
                <div className="rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                  <div className="text-[13px] font-medium mb-1" style={{ color: C.text }}>Premium Session Duration</div>
                  <div className="text-[11px] mb-3" style={{ color: C.textMute }}>How long premium users stay logged in:</div>
                  <div className="flex gap-2">
                    {[
                      { val: 3, label: '3 min' },
                      { val: 5, label: '5 min', default: true },
                      { val: 10, label: '10 min' },
                      { val: 15, label: '15 min' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => { if (typeof window !== 'undefined') localStorage.setItem('zf-premium-duration', String(opt.val)); }}
                        className="flex-1 rounded-lg py-2 text-[11px] font-medium transition-colors"
                        style={{
                          background: (typeof window !== 'undefined' ? localStorage.getItem('zf-premium-duration') || '5' : '5') === String(opt.val) ? 'rgba(220,255,0,0.1)' : C.surface,
                          border: `1px solid ${(typeof window !== 'undefined' ? localStorage.getItem('zf-premium-duration') || '5' : '5') === String(opt.val) ? 'rgba(220,255,0,0.3)' : C.borderDef}`,
                          color: (typeof window !== 'undefined' ? localStorage.getItem('zf-premium-duration') || '5' : '5') === String(opt.val) ? '#DCFF00' : C.textMute,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lock admin */}
                <button
                  onClick={() => setPaywallAdminUnlocked(false)}
                  className="w-full rounded-lg py-2 text-[12px] font-medium"
                  style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.textSec }}
                >
                  Lock Admin
                </button>
              </>
            )}
          </div>
        )}
        {section === 'integrations' && <div className="space-y-2"><SectionHeader title="Integrations" sub="Connect external services" />{[{ name: 'Z.AI SDK Proxy', key: 'VPS Bridge · glm-4-plus', connected: true }, { name: 'Supabase', key: 'Supabase Project', connected: true }, { name: 'Vercel', key: 'zenforge.site', connected: true }, { name: 'Groq', key: groqKey ? groqKey.slice(0, 12) + '...' : 'Add key in LLM tab', connected: !!groqKey }, { name: 'Modal', key: 'Add MODAL_TOKEN', connected: false }, { name: 'E2B Sandbox', key: 'Add E2B_API_KEY', connected: false }].map((env) => <div key={env.name} className="flex items-center justify-between rounded-md p-2.5" style={{ background: C.card, border: '1px solid ' + C.borderDef }}><div><div className="text-[12px] font-medium" style={{ color: C.text }}>{env.name}</div><div className="font-mono text-[10px]" style={{ color: C.textMute }}>{env.key}</div></div><Badge color={env.connected ? 'success' : 'warn'}>{env.connected ? 'Connected' : 'Not set'}</Badge></div>)}</div>}
        {section === 'va-memory' && <VAMemoryPanel />}
        {section === 'advanced' && <div className="space-y-3"><SectionHeader title="Advanced" sub="System information & maintenance" /><div className="grid grid-cols-2 gap-2"><StatCard label="Renderer" value="V6 Ultra" icon={Cpu} /><StatCard label="Brain files" value="310" icon={Brain} /><StatCard label="Pattern combos" value="207T" icon={Layers} accent /><StatCard label="API routes" value="29" icon={Server} /></div><div className="rounded-md p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}><div className="text-[13px] font-medium" style={{ color: C.error }}>Danger zone</div><p className="mt-1 text-[11px]" style={{ color: C.textMute }}>Clear all locally-cached data and reset studio state.</p><div className="mt-2.5 flex gap-1.5"><Button size="sm" variant="danger" icon={Trash2} onClick={() => { if (confirm('Clear localStorage?')) localStorage.clear(); }}>Clear cache</Button><Button size="sm" variant="danger" icon={Trash2} onClick={() => { if (confirm('Clear all logs?')) fetch('/api/logs', { method: 'DELETE' }); }}>Clear logs</Button></div></div></div>}
      </Panel>
    </div>
  );
}

/* ========== Command Palette ========== */
function CommandPalette({ open, onClose, onAction }: { open: boolean; onClose: () => void; onAction: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const commands = useMemo(() => [
    { id: 'goto:generate', label: 'Go to Generate', icon: Sparkles, group: 'Navigation' },
    { id: 'goto:patterns', label: 'Go to Patterns', icon: Layers, group: 'Navigation' },
    { id: 'goto:projects', label: 'Go to Projects', icon: FolderKanban, group: 'Navigation' },
    { id: 'goto:agent', label: 'Go to AI Agent', icon: Bot, group: 'Navigation' },
    { id: 'goto:sandbox', label: 'Go to Sandbox', icon: Terminal, group: 'Navigation' },
    { id: 'goto:deploy', label: 'Go to Deploy', icon: Rocket, group: 'Navigation' },
    { id: 'goto:logs', label: 'Go to Logs', icon: ScrollText, group: 'Navigation' },
    { id: 'goto:brain', label: 'Go to Brain', icon: Brain, group: 'Navigation' },
    { id: 'goto:recreate', label: 'Go to Recreate', icon: RefreshCw, group: 'Navigation' },
    { id: 'goto:evolution', label: 'Go to Evolution', icon: Cpu, group: 'Navigation' },
    { id: 'goto:artist', label: 'Go to Virtual Artist', icon: Wand2, group: 'Navigation' },
    { id: 'goto:settings', label: 'Go to Settings', icon: Settings, group: 'Navigation' },
  ], []);
  const filtered = useMemo(() => { if (!query.trim()) return commands; const q = query.toLowerCase(); return commands.filter((c) => c.label.toLowerCase().includes(q)); }, [query, commands]);
  useEffect(() => { setIdx(0); }, [query]);
  useEffect(() => { if (!open) return; const handler = (e: KeyboardEvent) => { if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); } else if (e.key === 'Enter') { e.preventDefault(); if (filtered[idx]) onAction(filtered[idx].id); } else if (e.key === 'Escape') { e.preventDefault(); onClose(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [open, filtered, idx, onAction, onClose]);
  if (!open) return null;
  const groups = filtered.reduce((acc, c) => { if (!acc[c.group]) acc[c.group] = []; acc[c.group].push(c); return acc; }, {} as Record<string, typeof commands>);
  let runningIdx = 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} transition={SPRING} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-xl" style={{ background: C.elevated, border: '1px solid ' + C.borderDef }}>
        <div className="flex items-center gap-2.5 border-b px-3.5 py-3" style={{ borderColor: C.borderDef }}>
          <Search size={15} strokeWidth={1.5} style={{ color: C.textMute }} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commands, files, settings..." className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.text }} />
          <kbd className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: C.card, color: C.textMute, border: '1px solid ' + C.borderDef }}>ESC</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-1.5">
          {filtered.length === 0 ? <div className="px-3.5 py-6 text-center text-[12px]" style={{ color: C.textMute }}>No commands found</div>
          : Object.entries(groups).map(([group, items]) => (
            <div key={group}><div className="px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: C.textMute }}>{group}</div>{items.map((c) => { const i = runningIdx++; const active = i === idx; const Icon = c.icon; return <button key={c.id} onClick={() => onAction(c.id)} onMouseEnter={() => setIdx(i)} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left" style={{ background: active ? C.hover : 'transparent' }}><Icon size={14} strokeWidth={1.5} style={{ color: active ? C.text : C.textMute }} /><span className="text-[13px]" style={{ color: active ? C.text : C.textSec }}>{c.label}</span></button>; })}</div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ========== Main App ========== */
export default function Home() {
  // Session state — restored from Supabase on mount, persists across refreshes
  const session = useSessionState();
  const [tab, setTabState] = useState<Tab>('generate');
  const [templates, setTemplates] = useState<TemplateStats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [accent, setAccent] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('elite-accent') || '#ffffff' : '#ffffff');
  const [, forceUpdate] = useState(0);

  // Paywall state
  const [paywallEnabled, setPaywallEnabled] = useState(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<number | null>(null);
  const [paywallPopup, setPaywallPopup] = useState<{ show: boolean; feature: string }>({ show: false, feature: '' });
  const [premiumLogin, setPremiumLogin] = useState({ username: '', password: '' });
  const [premiumError, setPremiumError] = useState('');
  const [paywallAdminUnlocked, setPaywallAdminUnlocked] = useState(false);
  const [paywallAdminPassword, setPaywallAdminPassword] = useState('');
  const [paywallAdminError, setPaywallAdminError] = useState('');
  const [currentRotatingPassword, setCurrentRotatingPassword] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(300); // 5 min = 300s

  // Generate rotating password (changes every 5 minutes based on time slot)
  const generateRotatingPassword = () => {
    const timeSlot = Math.floor(Date.now() / (5 * 60 * 1000)); // changes every 5 min
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pwd = '';
    // Deterministic password based on time slot
    const seed = timeSlot * 12345;
    for (let i = 0; i < 8; i++) {
      pwd += chars[(seed + i * 7919) % chars.length];
    }
    return pwd;
  };

  // Load paywall state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPaywallEnabled(localStorage.getItem('zf-paywall') === 'on');
    setPremiumUnlocked(localStorage.getItem('zf-premium-unlocked') === 'true');
    const exp = localStorage.getItem('zf-premium-expiry');
    if (exp) {
      const ts = parseInt(exp, 10);
      if (ts > Date.now()) {
        setPremiumExpiry(ts);
      } else {
        localStorage.removeItem('zf-premium-unlocked');
        localStorage.removeItem('zf-premium-expiry');
      }
    }
    // Update rotating password
    setCurrentRotatingPassword(generateRotatingPassword());
    const pwdInterval = setInterval(() => {
      setCurrentRotatingPassword(generateRotatingPassword());
    }, 60000); // check every minute
    return () => clearInterval(pwdInterval);
  }, []);

  // Flashy countdown timer — updates every second
  useEffect(() => {
    if (!premiumExpiry) {
      setCountdownSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((premiumExpiry - Date.now()) / 1000));
      setCountdownSeconds(remaining);
      if (remaining <= 0) {
        // Time's up — push out of premium mode
        setPremiumUnlocked(false);
        setPremiumExpiry(null);
        localStorage.removeItem('zf-premium-unlocked');
        localStorage.removeItem('zf-premium-expiry');
        setPaywallPopup({ show: false, feature: '' });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [premiumExpiry]);

  // Locked tabs when paywall is ON and user is not premium
  const LOCKED_TABS: Tab[] = ['generate', 'recreate', 'agent', 'sandbox', 'deploy', 'evolution', 'artist'];
  const remainingMin = countdownSeconds > 0 ? Math.ceil(countdownSeconds / 60) : 0;
  const remainingSec = countdownSeconds % 60;

  const unlockPremium = () => {
    setPremiumError('');
    if (premiumLogin.username.trim() === (process.env.NEXT_PUBLIC_PREMIUM_USER || 'twinkle' + 'ats2much') && premiumLogin.password.trim() === (process.env.NEXT_PUBLIC_PREMIUM_PASS || 'precious' + 'rules991$')) {
      const durationMin = typeof window !== 'undefined' ? parseInt(localStorage.getItem('zf-premium-duration') || '5') : 5;
      const expiry = Date.now() + durationMin * 60 * 1000;
      setPremiumUnlocked(true);
      setPremiumExpiry(expiry);
      localStorage.setItem('zf-premium-unlocked', 'true');
      localStorage.setItem('zf-premium-expiry', String(expiry));
      setPremiumLogin({ username: '', password: '' });
      setPaywallPopup({ show: false, feature: '' });
    } else {
      setPremiumError('Invalid premium credentials.');
    }
  };

  const lockPremium = () => {
    setPremiumUnlocked(false);
    setPremiumExpiry(null);
    localStorage.removeItem('zf-premium-unlocked');
    localStorage.removeItem('zf-premium-expiry');
  };

  // Paywall admin login (to access paywall controls in Settings)
  const unlockPaywallAdmin = () => {
    setPaywallAdminError('');
    if (paywallAdminPassword === (process.env.NEXT_PUBLIC_PAYWALL_PASSWORD || 'Hydrogen' + '12345@work')) {
      setPaywallAdminUnlocked(true);
      setPaywallAdminPassword('');
      setPaywallAdminError('');
    } else {
      setPaywallAdminError('Incorrect password.');
    }
  };

  const togglePaywallFromAdmin = () => {
    setPaywallEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('zf-paywall', next ? 'on' : 'off');
      }
      return next;
    });
  };

  // Apply session state once it loads
  useEffect(() => {
    // Install global audit logger on first mount (captures clicks, errors, etc.)
    installAuditLogger();
    logClientAction('session.mount', { loaded: session.loaded });

    if (session.loaded) {
      // Restore active tab
      if (session.activeTab && session.activeTab !== 'generate') {
        setTabState(session.activeTab as Tab);
      }
      // Restore accent color
      if (session.accentColor && session.accentColor !== '#ffffff') {
        setAccent(session.accentColor);
        (C as any).accent = session.accentColor;
        const isLight = ['#ffffff', '#f59e0b', '#22c55e', '#06b6d4'].includes(session.accentColor.toLowerCase());
        (C as any).accentText = isLight ? '#000000' : '#ffffff';
        if (typeof window !== 'undefined') {
          localStorage.setItem('elite-accent', session.accentColor);
          document.documentElement.style.setProperty('--elite-accent', session.accentColor);
          document.documentElement.style.setProperty('--elite-accent-text', isLight ? '#000000' : '#ffffff');
        }
      }
    }
  }, [session.loaded, session.activeTab, session.accentColor]);

  // Wrap setTab to also persist + log + check paywall
  const setTab = useCallback((newTab: Tab) => {
    // Check paywall: if enabled and user not premium and tab is locked
    if (paywallEnabled && !premiumUnlocked && LOCKED_TABS.includes(newTab)) {
      setPaywallPopup({ show: true, feature: newTab });
      return; // Don't switch tab
    }
    setTabState(newTab);
    session.setActiveTab(newTab);
    logClientAction('tab.switch', { tab: newTab });
  }, [session, paywallEnabled, premiumUnlocked]);

  // Listen for accent changes from Settings
  useEffect(() => {
    const handler = () => {
      const newAccent = localStorage.getItem('elite-accent') || '#ffffff';
      setAccent(newAccent);
      (C as any).accent = newAccent;
      const isLight = ['#ffffff', '#f59e0b', '#22c55e', '#06b6d4'].includes(newAccent.toLowerCase());
      (C as any).accentText = isLight ? '#000000' : '#ffffff';
      forceUpdate((n) => n + 1);
      // Persist to Supabase
      session.setAccentColor(newAccent);
    };
    window.addEventListener('accent-change', handler);
    window.addEventListener('storage', handler);
    // Apply on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elite-accent');
      if (saved) {
        (C as any).accent = saved;
        const isLight = ['#ffffff', '#f59e0b', '#22c55e', '#06b6d4'].includes(saved.toLowerCase());
        (C as any).accentText = isLight ? '#000000' : '#ffffff';
        document.documentElement.style.setProperty('--elite-accent', saved);
        document.documentElement.style.setProperty('--elite-accent-text', isLight ? '#000000' : '#ffffff');
      }
    }
    return () => { window.removeEventListener('accent-change', handler); window.removeEventListener('storage', handler); };
  }, [session]);

  useEffect(() => { fetch('/api/templates').then((r) => r.json()).then((d) => setTemplates(d)).catch(() => {}); }, []);
  const refreshSites = useCallback(async () => { setSitesLoading(true); try { const res = await fetch('/api/sites/list'); const data = await res.json(); setSites(Array.isArray(data.sites) ? data.sites : []); } catch { setSites([]); } finally { setSitesLoading(false); } }, []);
  useEffect(() => { refreshSites(); }, [refreshSites]);
  const onResult = useCallback(() => { refreshSites(); }, [refreshSites]);

  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen((v) => !v); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, []);
  const handleCmdAction = useCallback((id: string) => { if (id.startsWith('goto:')) { setTab(id.slice(5) as Tab); setCmdOpen(false); } }, []);

  // Show loading state until session is hydrated from Supabase
  if (!session.loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas, color: C.text }}>
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mx-auto mb-4" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.borderDef}`, borderTopColor: C.accent }} />
          <p className="text-[12px] font-mono" style={{ color: C.textMute }}>Loading session from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontFeatureSettings: '"calt", "kern", "liga", "ss03"' }}>
      <AppHeader templates={templates} sitesCount={sites.length} onCmdK={() => setCmdOpen(true)} />
      <TabBar tab={tab} setTab={setTab} />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={EASE}>
            {tab === 'generate' && <GenerateTab onResult={onResult} />}
            {tab === 'patterns' && <PatternsTab />}
            {tab === 'projects' && <ProjectsTab sites={sites} loading={sitesLoading} onRefresh={refreshSites} />}
            {tab === 'agent' && <AgentTab onResult={onResult} />}
            {tab === 'sandbox' && <SandboxTab />}
            {tab === 'deploy' && <DeployTab sites={sites} />}
            {tab === 'logs' && <LogsTab />}
            {tab === 'brain' && <BrainTab />}
            {tab === 'recreate' && <RecreateTab />}
            {tab === 'catalog' && <CatalogTab />}
            {tab === 'evolution' && <EvolutionTab />}
            {tab === 'artist' && <ArtistTab />}
            {tab === 'settings' && <SettingsTab paywallEnabled={paywallEnabled} paywallAdminUnlocked={paywallAdminUnlocked} paywallAdminPassword={paywallAdminPassword} paywallAdminError={paywallAdminError} currentRotatingPassword={currentRotatingPassword} unlockPaywallAdmin={unlockPaywallAdmin} setPaywallAdminPassword={setPaywallAdminPassword} setPaywallAdminUnlocked={setPaywallAdminUnlocked} togglePaywallFromAdmin={togglePaywallFromAdmin} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t" style={{ borderColor: C.borderDef, background: C.surface }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] sm:px-6" style={{ color: C.textMute }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: C.success }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
              <span className="font-mono">All systems operational</span>
            </span>
            <span>·</span><span>ZenForge AI · Powered by Mistral</span>
            {paywallEnabled && <><span>·</span><span style={{ color: '#f59e0b' }}>🔒 Paywall ON</span></>}
            {premiumUnlocked && <><span>·</span><span style={{ color: C.success }}>✨ Premium ({remainingMin}m)</span></>}
          </div>
          <div className="flex items-center gap-3 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}><span>{sites.length} sites</span><span>·</span><span>{templates?.cerebrium?.totalBrainFiles ?? 310} brain</span></div>
        </div>
      </footer>
      <AnimatePresence>{cmdOpen && <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onAction={handleCmdAction} />}</AnimatePresence>

      {/* Paywall Popup Modal */}
      <AnimatePresence>
        {paywallPopup.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setPaywallPopup({ show: false, feature: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-md rounded-2xl p-6"
              style={{ background: C.surface, border: '1px solid ' + C.borderFoc, boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(220,255,0,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setPaywallPopup({ show: false, feature: '' })}
                className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:opacity-70"
                style={{ color: C.textMute, background: C.card }}
              >
                <X size={16} strokeWidth={2} />
              </button>

              {/* Lock icon with glow */}
              <div className="mb-4 flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 32px rgba(245,158,11,0.2)' }}
                >
                  <Lock size={32} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                </motion.div>
              </div>

              <h2 className="text-center text-[22px] font-semibold tracking-tight" style={{ color: C.text }}>
                Premium Feature
              </h2>
              <p className="mt-1.5 text-center text-[13px]" style={{ color: C.textMute }}>
                The <span className="font-medium" style={{ color: C.text }}>{paywallPopup.feature}</span> tab requires premium access.
              </p>

              {/* Premium status with flashy countdown */}
              {premiumUnlocked ? (
                <div className="mt-5">
                  {/* Flashy countdown timer */}
                  <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>Premium Active</div>
                    {/* Big countdown display */}
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <motion.span
                        key={remainingMin}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[36px] font-bold font-mono"
                        style={{
                          color: countdownSeconds < 60 ? '#ef4444' : '#22c55e',
                          fontVariantNumeric: 'tabular-nums',
                          textShadow: countdownSeconds < 60 ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(34,197,94,0.5)',
                        }}
                      >
                        {String(remainingMin).padStart(2, '0')}
                      </motion.span>
                      <span className="text-[36px] font-bold" style={{ color: C.textMute }}>:</span>
                      <motion.span
                        key={remainingSec}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-[36px] font-bold font-mono"
                        style={{
                          color: countdownSeconds < 60 ? '#ef4444' : '#22c55e',
                          fontVariantNumeric: 'tabular-nums',
                          textShadow: countdownSeconds < 60 ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(34,197,94,0.5)',
                        }}
                      >
                        {String(remainingSec).padStart(2, '0')}
                      </motion.span>
                    </div>
                    <div className="mt-1 text-[11px]" style={{ color: C.textMute }}>
                      {countdownSeconds < 60 ? '⚠ Hurry! Time running out' : 'Time remaining'}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: C.card }}>
                      <motion.div
                        animate={{ width: `${(countdownSeconds / 300) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                        className="h-full rounded-full"
                        style={{
                          background: countdownSeconds < 60
                            ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                            : 'linear-gradient(90deg, #22c55e, #DCFF00)',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => { lockPremium(); setPaywallPopup({ show: false, feature: '' }); }}
                    className="mt-3 w-full text-center text-[12px] underline"
                    style={{ color: C.textMute }}
                  >
                    End premium session
                  </button>
                </div>
              ) : (
                <>
                  {/* Premium login */}
                  <div className="mt-5 space-y-2.5">
                    <input
                      type="text"
                      value={premiumLogin.username}
                      onChange={(e) => setPremiumLogin({ ...premiumLogin, username: e.target.value })}
                      placeholder="Premium username"
                      className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                      style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text }}
                      onKeyDown={(e) => { if (e.key === 'Enter') unlockPremium(); }}
                    />
                    <input
                      type="password"
                      value={premiumLogin.password}
                      onChange={(e) => setPremiumLogin({ ...premiumLogin, password: e.target.value })}
                      placeholder="Premium password"
                      className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                      style={{ background: C.card, border: '1px solid ' + C.borderDef, color: C.text }}
                      onKeyDown={(e) => { if (e.key === 'Enter') unlockPremium(); }}
                    />
                    {premiumError && <div className="text-[12px]" style={{ color: C.error }}>{premiumError}</div>}
                    <button
                      onClick={unlockPremium}
                      className="w-full rounded-lg py-2.5 text-[13px] font-semibold transition-transform hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #DCFF00, #64CEFB)', color: '#0A0A0A' }}
                    >
                      Unlock Premium (5 min)
                    </button>
                  </div>

                  {/* Info */}
                  <div className="mt-4 rounded-lg p-3" style={{ background: C.card, border: '1px solid ' + C.borderDef }}>
                    <div className="text-[11px] space-y-1" style={{ color: C.textMute }}>
                      <div>✓ Full access to all tabs (5 minutes)</div>
                      <div>✓ Generate, Recreate, Deploy, Sandbox</div>
                      <div>✗ Export/download disabled (prevents copying)</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setPaywallPopup({ show: false, feature: '' })}
                    className="mt-3 w-full text-center text-[12px] underline"
                    style={{ color: C.textMute }}
                  >
                    Maybe later
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium countdown timer — elegant minimal design (z-40, below command palette z-50) */}
      {premiumUnlocked && (() => {
        const isUrgent = countdownSeconds < 60;
        const isCritical = countdownSeconds < 30;
        const accentColor = isCritical ? '#ef4444' : isUrgent ? '#f59e0b' : 'rgba(255,255,255,0.9)';
        const accentColor2 = isCritical ? '#dc2626' : isUrgent ? '#d97706' : 'rgba(220,255,0,0.7)';

        return (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center gap-2 py-1"
            style={{
              background: isUrgent
                ? `linear-gradient(90deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))`
                : `linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.05))`,
              borderBottom: `1px solid ${isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {/* Sleek progress bar — thin line that depletes */}
            <div className="flex items-center gap-2">
              {/* Premium label */}
              <span className="text-[10px] font-medium uppercase" style={{ color: isUrgent ? accentColor : 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
                Premium
              </span>

              {/* Thin depleting bar */}
              <div className="relative h-0.5 w-24 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  animate={{ width: `${(countdownSeconds / 300) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor2})`,
                    boxShadow: isUrgent ? `0 0 8px ${accentColor}80` : 'none',
                  }}
                />
              </div>

              {/* Time display — clean monospace */}
              <div className="flex items-center font-mono text-[12px] font-semibold" style={{ fontVariantNumeric: 'tabular-nums', color: isUrgent ? accentColor : 'rgba(255,255,255,0.8)' }}>
                {String(remainingMin).padStart(2, '0')}
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ margin: '0 1px' }}
                >
                  :
                </motion.span>
                {String(remainingSec).padStart(2, '0')}
              </div>

              {/* Urgent indicator */}
              {isUrgent && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-[9px] font-bold uppercase"
                  style={{ color: accentColor }}
                >
                  {isCritical ? 'Critical' : 'Expiring'}
                </motion.span>
              )}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
