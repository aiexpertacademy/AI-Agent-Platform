import { useState, useRef, useEffect } from 'react'
import {
  Globe, Loader2, Copy, Check, Download, RefreshCw, Sparkles,
  Monitor, Smartphone, Tablet, Code, Eye, ExternalLink,
  Palette, Type, Layers, ChevronDown, ChevronUp, ChevronLeft,
  Edit3, Save, RotateCcw, Film, Cpu, Braces, Columns,
  PanelLeftClose, PanelLeftOpen, Wand2, Image, Star,
  ArrowRight, Search, Filter, LayoutTemplate, Zap, X
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const API = ''

// ─── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'saas', label: 'SaaS / Tech', icon: '⚡', count: 3,
    desc: 'Software products, tools, platforms',
    gradient: 'from-violet-600/80 to-indigo-900',
    accent: '#8b5cf6', bg: '#07040f',
    defaultStyle: 'Dark Immersive', defaultAnimation: 'floating3d', defaultFont: 'Space Grotesk + DM Sans',
    defaultSections: ['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'],
    images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=600&fit=crop'],
  },
  {
    id: 'agency', label: 'Agency / Studio', icon: '◈', count: 3,
    desc: 'Creative services, design studios',
    gradient: 'from-amber-600/80 to-orange-900',
    accent: '#f59e0b', bg: '#080808',
    defaultStyle: 'Dark Immersive', defaultAnimation: 'cinematic', defaultFont: 'Clash Display + Satoshi',
    defaultSections: ['Navigation Bar','Hero / Header','Gallery / Portfolio','How It Works','Team Section','Testimonials / Social Proof','CTA Section','Footer'],
    images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&h=600&fit=crop'],
  },
  {
    id: 'portfolio', label: 'Portfolio', icon: '✦', count: 3,
    desc: 'Personal showcases, creative profiles',
    gradient: 'from-cyan-600/80 to-teal-900',
    accent: '#06b6d4', bg: '#030712',
    defaultStyle: 'Dark Immersive', defaultAnimation: 'floating3d', defaultFont: 'Space Grotesk + DM Sans',
    defaultSections: ['Navigation Bar','Hero / Header','Gallery / Portfolio','Stats / Numbers','About Section','Contact Form','Footer'],
    images: ['https://images.unsplash.com/photo-1545665277-5937489579f2?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&h=600&fit=crop'],
  },
  {
    id: 'startup', label: 'Startup / App', icon: '◕', count: 3,
    desc: 'App launches, waitlists, early access',
    gradient: 'from-green-600/80 to-emerald-900',
    accent: '#22c55e', bg: '#030a05',
    defaultStyle: 'Dark Immersive', defaultAnimation: 'floating3d', defaultFont: 'Space Grotesk + DM Sans',
    defaultSections: ['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','FAQ Accordion','CTA Section','Footer'],
    images: ['https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=1200&h=600&fit=crop'],
  },
  {
    id: 'ecommerce', label: 'E-commerce', icon: '◎', count: 3,
    desc: 'Online stores, product showcases',
    gradient: 'from-rose-600/80 to-pink-900',
    accent: '#f43f5e', bg: '#080808',
    defaultStyle: 'Elegant Luxury', defaultAnimation: 'smooth', defaultFont: 'Playfair Display + Lato',
    defaultSections: ['Navigation Bar','Hero / Header','Gallery / Portfolio','Features Grid','Testimonials / Social Proof','Newsletter Signup','Footer'],
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=600&fit=crop'],
  },
  {
    id: 'restaurant', label: 'Restaurant / Food', icon: '◉', count: 3,
    desc: 'Dining, cafes, food delivery',
    gradient: 'from-orange-600/80 to-red-900',
    accent: '#c9a96e', bg: '#0a0805',
    defaultStyle: 'Elegant Luxury', defaultAnimation: 'smooth', defaultFont: 'Playfair Display + Lato',
    defaultSections: ['Navigation Bar','Hero / Header','About Section','Gallery / Portfolio','Stats / Numbers','CTA Section','Footer'],
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=600&fit=crop'],
  },
  {
    id: 'healthcare', label: 'Healthcare', icon: '◔', count: 2,
    desc: 'Medical, wellness, health tech',
    gradient: 'from-blue-600/80 to-sky-900',
    accent: '#0284c7', bg: '#f0f9ff',
    defaultStyle: 'Corporate Clean', defaultAnimation: 'smooth', defaultFont: 'Inter + System UI',
    defaultSections: ['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Team Section','Testimonials / Social Proof','CTA Section','Footer'],
    images: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop'],
  },
  {
    id: 'finance', label: 'Finance / Fintech', icon: '▣', count: 2,
    desc: 'Banking, investment, crypto',
    gradient: 'from-blue-700/80 to-slate-900',
    accent: '#0ea5e9', bg: '#020d1a',
    defaultStyle: 'Dark Immersive', defaultAnimation: 'dynamic', defaultFont: 'Space Grotesk + DM Sans',
    defaultSections: ['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'],
    images: ['https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&h=600&fit=crop'],
  },
  {
    id: 'education', label: 'Education', icon: '◑', count: 2,
    desc: 'Courses, LMS, learning platforms',
    gradient: 'from-purple-600/80 to-violet-900',
    accent: '#7c3aed', bg: '#0f0730',
    defaultStyle: 'Gradient Heavy', defaultAnimation: 'dynamic', defaultFont: 'Space Grotesk + DM Sans',
    defaultSections: ['Navigation Bar','Hero / Header','Features Grid','How It Works','Stats / Numbers','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'],
    images: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&h=600&fit=crop'],
  },
  {
    id: 'realestate', label: 'Real Estate', icon: '⊞', count: 2,
    desc: 'Property, architecture, housing',
    gradient: 'from-teal-600/80 to-emerald-900',
    accent: '#c9a96e', bg: '#080806',
    defaultStyle: 'Elegant Luxury', defaultAnimation: 'smooth', defaultFont: 'Playfair Display + Lato',
    defaultSections: ['Navigation Bar','Hero / Header','Gallery / Portfolio','Features Grid','Stats / Numbers','Team Section','Contact Form','Footer'],
    images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop','https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&h=600&fit=crop'],
  },
]

// ─── Animation presets ────────────────────────────────────────────────────────
const ANIMATION_PRESETS = [
  { id: 'static',     label: 'Static',        icon: '○', desc: 'Clean, no motion' },
  { id: 'smooth',     label: 'Smooth',         icon: '◔', desc: 'Subtle fade & slide-ins' },
  { id: 'dynamic',    label: 'Dynamic',        icon: '◑', desc: 'Scroll reveals + stagger' },
  { id: 'floating3d', label: '3D Floating',    icon: '◕', desc: 'Depth + parallax + orbs' },
  { id: 'cinematic',  label: 'Cinematic',      icon: '●', desc: 'Epic reveals + split text' },
  { id: 'particle',   label: 'Particle Field', icon: '⊹', desc: 'Canvas particle background' },
  { id: 'morphing',   label: 'Morphing',       icon: '◌', desc: 'Blob + liquid transitions' },
  { id: 'typewriter', label: 'Typewriter',     icon: '▷', desc: 'Text scramble + counters' },
]

const DESIGN_STYLES = ['Modern Minimal','Bold Typographic','Glassmorphism','Dark Immersive','Neobrutalism','Elegant Luxury','Gradient Heavy','Corporate Clean']
const COLOR_PRESETS = [
  { id:'auto',   label:'AI Picks',     colors:[] },
  { id:'violet', label:'Violet Night', colors:['#8b5cf6','#4c1d95','#0f0a1e'] },
  { id:'blue',   label:'Ocean Blue',   colors:['#0ea5e9','#0369a1','#020d1a'] },
  { id:'green',  label:'Matrix Green', colors:['#22c55e','#15803d','#021a0a'] },
  { id:'orange', label:'Warm Sunset',  colors:['#f97316','#c2410c','#1a0a02'] },
  { id:'pink',   label:'Rose Neon',    colors:['#ec4899','#be185d','#1a0214'] },
  { id:'teal',   label:'Teal Pulse',   colors:['#14b8a6','#0f766e','#021a18'] },
  { id:'white',  label:'Clean White',  colors:['#6366f1','#4f46e5','#fafafa'] },
  { id:'gold',   label:'Luxury Gold',  colors:['#d4af37','#92400e','#0a0800'] },
]
const FONT_PAIRS = ['AI Picks','Inter + System UI','Clash Display + Satoshi','Playfair Display + Lato','Space Grotesk + DM Sans','Syne + Nunito','Cabinet Grotesk + Inter','Boska + Synonym']
const PAGE_SECTIONS = ['Hero / Header','Navigation Bar','Features Grid','How It Works','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Team Section','Stats / Numbers','Gallery / Portfolio','Newsletter Signup','About Section','Contact Form','Footer']

// ─── Animation prompt builders ────────────────────────────────────────────────
function getAnimationInstructions(preset, category) {
  const catImages = {
    saas: 'tech dashboards, abstract data visualizations, code snippets, circuit patterns',
    agency: 'creative studio work, bold typography mockups, portfolio screenshots, design tools',
    portfolio: 'project showcases, personal branding, creative work samples, design portfolios',
    startup: 'mobile app screens, product mockups, growth charts, user interface screenshots',
    ecommerce: 'product photography, fashion items, lifestyle shots, shopping imagery',
    restaurant: 'food photography, restaurant interiors, chef portraits, plated dishes, drinks',
    healthcare: 'medical professionals, health technology, wellness lifestyle, clean clinic environments',
    finance: 'financial charts, data visualizations, city skylines, business professionals',
    education: 'students learning, books, digital education tools, online learning interfaces',
    realestate: 'luxury properties, modern architecture, interiors, neighborhood aerial views',
  }
  const imgHint = catImages[category] || 'relevant high-quality photography'
  const imgNote = `For all images use: https://picsum.photos/seed/UNIQUE_SEED/WIDTH/HEIGHT where UNIQUE_SEED is a descriptive word. Category image themes: ${imgHint}.`

  if (preset === 'static') return `No animations. Clean static layout.\n${imgNote}`

  if (preset === 'smooth') return `
ANIMATIONS — Smooth style:
- Fade-in on scroll: IntersectionObserver triggers opacity 0→1, translateY 30px→0, duration 0.6s ease-out
- All cards: subtle hover scale(1.02) with box-shadow lift, 0.3s transition
- Staggered list items: each child gets animation-delay: calc(var(--i) * 0.1s)
- Smooth anchor scroll, active nav link underline animation
- Button hover: background shift + slight translateY(-2px)
${imgNote}`

  if (preset === 'dynamic') return `
ANIMATIONS — Dynamic style (implement all of these):
1. SCROLL REVEALS: IntersectionObserver on every section — slide-up (Y+60px→0) + fade, 0.7s cubic-bezier(0.16,1,0.3,1)
2. STAGGER GRID: Feature/card grids — each card gets --i CSS var, delay = i * 120ms
3. GRADIENT TEXT SHIMMER: Hero headline uses animated gradient background-clip:text, 3s infinite
4. COUNTER ANIMATION: Stats count up from 0 when scrolled into view with requestAnimationFrame easing
5. HOVER 3D TILT: Cards get JS mousemove listener — perspective:800px, rotateX/Y max ±10deg
6. FLOATING BADGE: Small "New" or stat badge floats with keyframes (Y: 0→-8px→0, 2.5s ease-in-out infinite)
7. PROGRESS BARS: Skill/feature bars animate width 0→X% on scroll
8. CURSOR GLOW: Small radial-gradient follows mouse in hero section (mousemove JS)
9. TYPEWRITER: Sub-heading types character by character on load
${imgNote}`

  if (preset === 'floating3d') return `
ANIMATIONS — 3D Floating style (match modern award-winning site aesthetic):
1. HERO 3D SCENE: CSS perspective:1200px on hero. Multiple layered elements at different translateZ depths
   - Background layer: translateZ(-100px) scale(1.1) — slow parallax
   - Main content: translateZ(0px) — normal
   - Foreground elements: translateZ(40px) — float forward, subtle bobbing animation
2. ANIMATED GRADIENT MESH: 4 large blurred orbs (blur:120px, 400px diameter) positioned at corners
   Each orb moves in slow circular path: @keyframes orbit{0%{transform:translate(0,0)} 25%{transform:translate(30px,-20px)} 50%{transform:translate(-10px,30px)} 100%{transform:translate(0,0)}} 8-12s infinite
3. FLOATING CARDS: Feature/product cards have infinite float animation
   card1: translateY(0→-15px→0) 3s ease-in-out infinite
   card2: translateY(0→-10px→0) 4s ease-in-out infinite delay:-1s
   card3: translateY(0→-20px→0) 5s ease-in-out infinite delay:-2s
4. GLASSMORPHISM PANELS: background:rgba(255,255,255,0.03), backdrop-filter:blur(20px), border:1px solid rgba(255,255,255,0.08)
5. PARALLAX SCROLL: JS scroll listener — hero bg moves at 0.3x speed, foreground at 0.6x
6. WORD REVEAL: Hero title split into words, each word slides up from translateY(100%) with overflow:hidden, stagger 60ms per word
7. CURSOR MAGNETIC: Buttons repel/attract cursor slightly on hover (JS mousemove on button)
8. SCROLL PROGRESS BAR: Fixed top bar shows page scroll progress (width: scrollY/docHeight * 100%)
9. SECTION TRANSITIONS: clip-path wipe for section reveals
10. GLOW LINES: Subtle animated diagonal gradient lines in background (opacity 0.03-0.06)
${imgNote}`

  if (preset === 'cinematic') return `
ANIMATIONS — Cinematic style (blockbuster-level first impression):
1. INTRO SEQUENCE: On page load — black overlay fades out over 1.2s after 0.3s delay. Logo/name appears first.
2. HERO TYPOGRAPHY: Main headline split letter by letter. Each letter animates from translateY(80px)+opacity(0) with stagger 30ms. Use clip-path:inset(0 0 0 0) on letter wrappers.
3. CINEMATIC BARS: Fixed top/bottom bars (height:6vw, background:black) that slide away on load
4. FULL-BLEED HERO: 100vh hero with high-contrast image/gradient, parallax on scroll
5. SECTION WIPE: Every section reveals with clip-path: inset(100% 0 0 0) → inset(0%), 0.9s cubic-bezier(0.77,0,0.175,1) on scroll
6. CUSTOM CURSOR: 12px dot + 36px ring, ring follows dot with 8-frame lag (requestAnimationFrame). Ring scales on hover.
7. HORIZONTAL SCROLL: One section (gallery/portfolio) uses horizontal scroll-snap with CSS overflow-x:scroll + scroll-snap-type:x mandatory
8. TEXT SCRAMBLE: A stat or tagline uses JS to randomly scramble characters then resolve to real text (setTimeout chain)
9. VIDEO AMBIENT: Hero has a CSS-animated pseudo-video effect using multiple layered gradients animating opacity/position
10. MAGNETIC BUTTONS: CTA buttons attract cursor (JS mousemove → translate toward cursor by 30% of distance)
11. NOISE TEXTURE: Subtle SVG noise overlay on sections (opacity 0.025) for filmic grain
${imgNote}`

  if (preset === 'particle') return `
ANIMATIONS — Particle Field style:
1. CANVAS PARTICLES: <canvas> fixed background. 120 particles, each: size 1-2.5px, color from palette, move at random velocities (speed 0.2-0.8), bounce off edges. Draw connecting lines between particles <100px apart (opacity = 1 - dist/100).
2. MOUSE REPEL: Particles within 120px of cursor are pushed away with force = 1/(dist²) * 3000
3. HERO FLOAT: Product/app mockup image floats on particle field — rotate(-3deg) with gentle bob animation
4. GLOW NODES: 8 larger glowing circles (12-20px, blur:8px) scattered in hero, pulse opacity 0.4→1 with staggered timing
5. SCROLL SPARKS: When sections enter viewport, 20-30 "spark" elements shoot outward from section edge
6. ALL SCROLL REVEALS + STAGGER from dynamic preset also apply
7. TEXT FLICKER: Headings have subtle opacity flicker (0.95→1) on keyframe, evoking a screen effect
${imgNote}`

  if (preset === 'morphing') return `
ANIMATIONS — Morphing style:
1. MORPHING BLOB: Large SVG blob in hero. Use CSS border-radius animation:
   @keyframes morph{0%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} 100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}} 8s ease-in-out infinite
2. LIQUID TRANSITIONS: Section background clips morph between shapes on scroll (SVG clipPath animation)
3. COLOR SHIFT: Hero gradient slowly shifts hue using @keyframes on hue-rotate filter, 20s infinite
4. ELASTIC HOVER: Cards and buttons have spring-like elastic scale: transform:scale(1.05) cubic-bezier(0.34,1.56,0.64,1)
5. PATH DRAWING: Decorative SVG lines in hero section have stroke-dashoffset animated to 0 on load
6. FLUID BACKGROUND: Multiple gradient orbs with individual morph + movement animations, blurred to create liquid effect
7. RIPPLE EFFECT: Clicking any button creates expanding circle ripple (pure CSS :after pseudo-element)
8. ALL SCROLL REVEALS + WORD REVEAL from floating3d preset also apply
${imgNote}`

  if (preset === 'typewriter') return `
ANIMATIONS — Typewriter & Text Effect style:
1. TYPEWRITER HERO: Main tagline types out character by character (JS setInterval, 60ms per char). Cursor blinks after.
2. TEXT SCRAMBLE: A secondary line scrambles random characters before resolving — cycle 15 random chars then reveal real text
3. ROTATING WORDS: One word in headline rotates through 4-5 variations (e.g., "Build / Design / Launch / Grow") — slide up out, slide in new word, 2s interval
4. COUNTER ANIMATION: All stat numbers count from 0 to final value with easeOutExpo over 2s on scroll
5. GLITCH EFFECT: Logo or headline has occasional glitch: rapid clip-path splits, color channel offset (CSS animation, rare trigger every 8s)
6. GRADIENT TRACE: Decorative underlines under key words animate from width:0→100%, 0.6s ease
7. NEON GLOW PULSE: Accent-colored elements pulse their text-shadow/box-shadow: 0→12px glow→0, 2s infinite
8. MAGNETIC LINKS: Navigation links have text that fills bottom-to-top on hover (clip-path reveal)
9. ALL SCROLL REVEALS from dynamic preset also apply
${imgNote}`
}

// ─── Edit mode injector ───────────────────────────────────────────────────────
function injectEditScript(html) {
  const script = `
<style id="__edit_styles__">
  [data-editable]:hover{outline:2px dashed rgba(99,102,241,0.6)!important;cursor:text!important;background:rgba(99,102,241,0.04)!important;border-radius:2px}
  [data-editable]:focus{outline:2px solid #6366f1!important;cursor:text!important;background:rgba(99,102,241,0.06)!important;border-radius:2px}
  .__edit_badge__{position:fixed;bottom:16px;right:16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:6px 14px;border-radius:20px;font-size:11px;font-family:sans-serif;font-weight:600;z-index:2147483647;box-shadow:0 4px 20px rgba(99,102,241,0.4)}
</style>
<script id="__edit_mode__">
(function(){
  ['h1','h2','h3','h4','h5','h6','p','a','button','li','span','label','td','th','blockquote','figcaption'].forEach(tag=>{
    document.querySelectorAll(tag).forEach(el=>{
      if(!el.querySelector('img,svg,video,iframe')&&el.textContent.trim().length>0){
        el.setAttribute('data-editable','');el.contentEditable='true';el.spellcheck=false;
      }
    });
  });
  const b=document.createElement('div');b.className='__edit_badge__';
  b.innerHTML='<span style="opacity:.7">✏</span> Edit Mode — click any text';
  document.body.appendChild(b);
  window.addEventListener('message',e=>{
    if(e.data==='__getHTML__'){
      document.querySelectorAll('[data-editable]').forEach(el=>{el.removeAttribute('data-editable');el.removeAttribute('contenteditable');el.removeAttribute('spellcheck')});
      ['__edit_styles__','__edit_mode__'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove()});
      document.querySelector('.__edit_badge__')?.remove();
      window.parent.postMessage({type:'__html__',html:'<!DOCTYPE html>'+document.documentElement.outerHTML},'*');
    }
  });
})();
<\/script>`
  return html.replace(/<\/body>/i, script + '</body>')
}

// ─── DeviceFrame ──────────────────────────────────────────────────────────────
function DeviceFrame({ children, device }) {
  if (device === 'mobile') return (
    <div className="mx-auto" style={{ width: 375 }}>
      <div className="bg-gray-800 rounded-[2.2rem] p-2 border border-gray-700 shadow-2xl">
        <div className="relative bg-black rounded-[1.8rem] overflow-hidden" style={{ height: 720 }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />
          {children}
        </div>
      </div>
    </div>
  )
  if (device === 'tablet') return (
    <div className="mx-auto" style={{ width: 768 }}>
      <div className="bg-gray-800 rounded-2xl p-2 border border-gray-700 shadow-2xl">
        <div className="overflow-hidden rounded-xl" style={{ height: 580 }}>{children}</div>
      </div>
    </div>
  )
  return <div className="w-full rounded-xl overflow-hidden border border-gray-800">{children}</div>
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({ brandName }) {
  const steps = ['Crafting layout structure…','Designing visual hierarchy…','Building animations…','Adding depth & effects…','Polishing every detail…']
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % steps.length), 1800)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-950 text-center p-8 select-none">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
          <Wand2 className="w-9 h-9 text-white" />
        </div>
        <div className="absolute -inset-2 rounded-3xl border-2 border-indigo-500/30 animate-ping" />
      </div>
      <p className="text-lg font-semibold text-white mb-2">Building {brandName ? `"${brandName}"` : 'your website'}</p>
      <p className="text-sm text-indigo-400 mb-6">{steps[step]}</p>
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-gray-700'}`} />
        ))}
      </div>
    </div>
  )
}

// ─── Phase 1: Category Picker ─────────────────────────────────────────────────
function CategoryPicker({ onSelect }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-white mb-2">What type of website do you want to build?</h2>
        <p className="text-gray-400 text-sm">Choose a category to see curated templates and tailored settings</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="group relative rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/40 cursor-pointer text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60 group-hover:opacity-80 transition-opacity`} />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
            <div className="relative p-5 h-36 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-3xl leading-none">{cat.icon}</span>
                <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{cat.count} templates</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{cat.label}</p>
                <p className="text-[11px] text-white/60 mt-0.5">{cat.desc}</p>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: cat.accent, filter: 'blur(20px)', transform: 'translate(30%,30%)' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Phase 2: Template Gallery ────────────────────────────────────────────────
function TemplateGallery({ category, onUseTemplate, onScratch, onBack }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [previewId, setPreviewId] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/web-templates?category=${category.id}`)
      .then(r => r.json())
      .then(data => { setTemplates(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setTemplates([]); setLoading(false) })
  }, [category.id])

  const filtered = filter === 'all' ? templates : templates.filter(t => t.animationPreset === filter)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <div>
            <h2 className="text-lg font-bold text-white">{category.label} Templates</h2>
            <p className="text-xs text-gray-500">{templates.length} templates · click any to use</p>
          </div>
        </div>
        <button
          onClick={onScratch}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
        >
          <Wand2 className="w-4 h-4" /> Start from scratch
        </button>
      </div>

      {/* Animation filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}>
          All styles
        </button>
        {ANIMATION_PRESETS.filter(a => a.id !== 'static').map(a => (
          <button key={a.id} onClick={() => setFilter(a.id)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === a.id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <LayoutTemplate className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No templates found. <button onClick={onScratch} className="text-indigo-400 hover:underline cursor-pointer">Start from scratch instead.</button></p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const animPreset = ANIMATION_PRESETS.find(a => a.id === t.animationPreset)
            return (
              <div key={t.id} className="group bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5">
                {/* Thumbnail */}
                <div className="relative overflow-hidden" style={{ height: 180 }}>
                  <img
                    src={t.thumbnail}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { e.target.style.display='none'; e.target.parentNode.style.background=`linear-gradient(135deg, ${t.bg || '#0a0a0a'} 0%, ${t.accent || '#6366f1'}33 100%)` }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => onUseTemplate(t)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-lg">
                      <Sparkles className="w-4 h-4" /> Use Template
                    </button>
                  </div>
                  {t.featured && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                      <Star className="w-3 h-3" /> Featured
                    </div>
                  )}
                  {animPreset && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-gray-300 text-[10px] rounded-full border border-gray-700">
                      {animPreset.icon} {animPreset.label}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{t.style}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: t.accent }} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(t.tags || []).slice(0, 4).map(tag => (
                      <span key={tag} className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                  <button onClick={() => onUseTemplate(t)} className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold rounded-xl border border-indigo-600/30 hover:border-indigo-500 transition-all cursor-pointer">
                    Use This Template
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Phase 3: Builder ─────────────────────────────────────────────────────────
function Builder({ category, template, onBack }) {
  // Config state — pre-filled from category/template
  const init = template?.config || {}
  const [brandName, setBrandName] = useState(init.brandPlaceholder || '')
  const [animPreset, setAnimPreset] = useState(template?.animationPreset || category?.defaultAnimation || 'floating3d')
  const [designStyle, setDesignStyle] = useState(template?.style || category?.defaultStyle || 'Dark Immersive')
  const [colorPreset, setColorPreset] = useState(init.colorPreset || 'auto')
  const [customColor, setCustomColor] = useState(category?.accent || '#6366f1')
  const [selectedSections, setSelectedSections] = useState(init.sections || category?.defaultSections || ['Hero / Header','Navigation Bar','Features Grid','CTA Section','Footer'])
  const [fontPair, setFontPair] = useState(init.fonts || category?.defaultFont || 'AI Picks')
  const [extraNotes, setExtraNotes] = useState(init.extraNotes || '')

  // Canvas state
  const [loading, setLoading] = useState(false)
  const [htmlCode, setHtmlCode] = useState('')
  const [viewMode, setViewMode] = useState('preview')
  const [device, setDevice] = useState('desktop')
  const [copied, setCopied] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [showSections, setShowSections] = useState(false)
  const [activePanel, setActivePanel] = useState('design')
  const [editMode, setEditMode] = useState(false)
  const [savingEdits, setSavingEdits] = useState(false)
  const [editableHtml, setEditableHtml] = useState('')

  const iframeRef = useRef(null)

  // Listen for HTML save from iframe
  useEffect(() => {
    function handler(e) {
      if (e.data?.type === '__html__') {
        setHtmlCode(e.data.html)
        setEditMode(false)
        setSavingEdits(false)
        setEditableHtml('')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  function toggleSection(s) {
    setSelectedSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const cp = COLOR_PRESETS.find(c => c.id === colorPreset)
  const colorHint = colorPreset === 'auto'
    ? `Use accent color ${customColor}. Choose complementary background and text colors.`
    : `Exact palette — primary: ${cp.colors[0]}, secondary: ${cp.colors[1]}, background: ${cp.colors[2]}`

  async function handleGenerate(e) {
    if (e?.preventDefault) e.preventDefault()
    if (loading) return
    setLoading(true)
    setHtmlCode('')
    setEditMode(false)
    setEditableHtml('')

    const categoryLabel = category?.label || 'Website'
    const catImages = (category?.images || []).join(', ')
    const animInstructions = getAnimationInstructions(animPreset, category?.id)

    try {
      const reply = await callGemini(
        `You are an elite web designer creating award-winning landing pages (Awwwards, CSS Design Awards level).

Generate a COMPLETE, production-quality, single-file HTML page.

CATEGORY: ${categoryLabel}
BRAND NAME: ${brandName || 'Nova'}
DESIGN STYLE: ${designStyle}
COLORS: ${colorHint}
FONT PAIRING: ${fontPair}
SECTIONS TO INCLUDE: ${selectedSections.join(', ')}
${extraNotes ? `EXTRA REQUIREMENTS: ${extraNotes}` : ''}
${catImages ? `CATEGORY HERO IMAGES (use these Unsplash URLs for real photography): ${catImages}` : ''}

${animInstructions}

ABSOLUTE RULES:
1. Return ONLY raw HTML — no markdown, no code fences, no explanation at all
2. Complete document: <!DOCTYPE html>…</html>
3. ALL CSS in a single <style> tag in <head> using CSS custom properties (--color-primary, --color-bg, etc.)
4. ALL JavaScript at bottom of <body>
5. Google Fonts via @import in the style tag
6. Fully responsive: 320px mobile → 1440px desktop
7. Realistic placeholder content — compelling copy that fits the ${categoryLabel} industry, not generic lorem ipsum
8. Semantic HTML5: <header> <nav> <main> <section> <article> <footer>
9. Meta viewport tag
10. Minimum 700 lines of beautiful, optimized code

QUALITY MANDATE — this should look like it costs $15,000 to build:
• CSS Grid + Flexbox layouts, generous whitespace
• Glassmorphism where appropriate: backdrop-filter:blur(20px)
• Gradient borders and glow effects
• Every interactive element has a thoughtful hover/focus state
• Typography with proper scale (clamp() for fluid type sizes)
• Smooth cubic-bezier transitions throughout
• The hero is SPECTACULAR — it must make an immediate strong impression
• Category-appropriate imagery and color psychology

Generate the most impressive, visually stunning, fully animated website possible for the ${categoryLabel} category.`,
        {
          systemInstruction: 'Return ONLY the raw HTML document. No markdown fences, no explanations. Start with <!DOCTYPE html> and end with </html>.',
          temperature: 0.82,
          maxTokens: 8192,
        }
      )

      let html = reply.trim()
      if (html.startsWith('```')) html = html.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '').trim()
      if (!html.toLowerCase().startsWith('<!doctype')) {
        const idx = html.toLowerCase().indexOf('<!doctype')
        if (idx > 0) html = html.slice(idx)
      }
      setHtmlCode(html)
    } catch (err) {
      setHtmlCode(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;background:#0a0a0a;color:#ef4444"><h1>Error</h1><p>${err.message}</p></body></html>`)
    }
    setLoading(false)
  }

  function enterEditMode() {
    setEditableHtml(injectEditScript(htmlCode))
    setEditMode(true)
    setViewMode('preview')
  }

  function saveEdits() {
    setSavingEdits(true)
    iframeRef.current?.contentWindow?.postMessage('__getHTML__', '*')
  }

  function cancelEdits() {
    setEditMode(false)
    setEditableHtml('')
    setSavingEdits(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(htmlCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!htmlCode) return
    const blob = new Blob([htmlCode], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(brandName || 'website').toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
  }

  const currentHtml = editMode ? editableHtml : htmlCode
  const lineCount = htmlCode ? htmlCode.split('\n').length : 0
  const iframeHeight = device === 'mobile' ? 720 : device === 'tablet' ? 580 : 640

  return (
    <div className="flex gap-0 min-h-[820px] -mx-1">
      {/* Left Panel */}
      <div className={`flex-shrink-0 transition-all duration-300 ${leftOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
        <div className="w-72 h-full flex flex-col border-r border-gray-800 bg-gray-950">
          {/* Panel tabs */}
          <div className="flex border-b border-gray-800 flex-shrink-0">
            {[{ id:'design', icon:Palette, label:'Design' }, { id:'layers', icon:Layers, label:'Layers' }, { id:'assets', icon:Image, label:'Images' }].map(t => (
              <button key={t.id} onClick={() => setActivePanel(t.id)}
                className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-[10px] font-medium transition-colors cursor-pointer ${activePanel === t.id ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}>
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activePanel === 'design' && (
              <form onSubmit={handleGenerate} className="p-4 space-y-5">
                {/* Category badge */}
                {category && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">
                      <ChevronLeft className="w-3.5 h-3.5" /> Categories
                    </button>
                    <span className="text-xs text-gray-600">/</span>
                    <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                      {category.icon} {category.label}
                    </span>
                  </div>
                )}

                {/* Brand name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Brand / Site Name</label>
                  <input value={brandName} onChange={e => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nova, Bloom, Orbit…" />
                </div>

                {/* Animation preset */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Film className="w-3 h-3 text-indigo-400" /> Animation Style
                  </label>
                  <div className="space-y-1.5">
                    {ANIMATION_PRESETS.map(a => (
                      <button key={a.id} type="button" onClick={() => setAnimPreset(a.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${animPreset === a.id ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' : 'bg-gray-900 border border-transparent hover:border-gray-700 text-gray-400'}`}>
                        <span className={`text-lg leading-none ${animPreset === a.id ? 'text-indigo-400' : 'text-gray-600'}`}>{a.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold leading-tight">{a.label}</p>
                          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{a.desc}</p>
                        </div>
                        {a.id === 'floating3d' && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold flex-shrink-0">HOT</span>}
                        {a.id === 'particle' && <span className="text-[9px] bg-green-700 text-white px-1.5 py-0.5 rounded font-bold flex-shrink-0">NEW</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Design style */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Design Style</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DESIGN_STYLES.map(s => (
                      <button key={s} type="button" onClick={() => setDesignStyle(s)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${designStyle === s ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-500 hover:text-gray-200 border border-gray-800 hover:border-gray-600'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color scheme */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Color Scheme</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.id} type="button" onClick={() => setColorPreset(c.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${colorPreset === c.id ? 'bg-indigo-600/20 border border-indigo-500/40' : 'bg-gray-900 border border-transparent hover:border-gray-700'}`}>
                        {c.colors.length > 0 ? (
                          <div className="flex -space-x-1.5">
                            {c.colors.map((col, i) => <div key={i} className="w-4 h-4 rounded-full border border-gray-900 shadow-sm" style={{ backgroundColor: col }} />)}
                          </div>
                        ) : <Sparkles className="w-4 h-4 text-indigo-400" />}
                        <span className={`text-[11px] font-medium truncate ${colorPreset === c.id ? 'text-indigo-300' : 'text-gray-500'}`}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                  {colorPreset === 'auto' && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-600">Accent:</span>
                      <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="w-7 h-7 rounded-md cursor-pointer bg-transparent border-0" />
                      <span className="text-xs text-gray-600 font-mono">{customColor}</span>
                    </div>
                  )}
                </div>

                {/* Typography */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Typography</label>
                  <select value={fontPair} onChange={e => setFontPair(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {FONT_PAIRS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>

                {/* Sections */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setShowSections(v => !v)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer">
                    <Columns className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sections ({selectedSections.length})</span>
                    {showSections ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
                  </button>
                  {showSections && (
                    <div className="px-3 pb-3 flex flex-wrap gap-1.5 border-t border-gray-800 pt-3">
                      {PAGE_SECTIONS.map(s => (
                        <button key={s} type="button" onClick={() => toggleSection(s)}
                          className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${selectedSections.includes(s) ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Extra notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Extra Notes</label>
                  <textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)} rows={3}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    placeholder="Dark/light toggle, countdown timer, booking form, video background…" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/25">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {loading ? 'Generating…' : 'Generate Website'}
                </button>
              </form>
            )}

            {activePanel === 'layers' && (
              <div className="p-4">
                {!htmlCode ? (
                  <div className="text-center py-12 text-gray-600">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Generate a website first</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 mb-3 font-medium">Page Structure</p>
                    {selectedSections.map((s, i) => (
                      <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 group cursor-pointer">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs text-gray-300 flex-1">{s}</span>
                        <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePanel === 'assets' && (
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-500 font-medium">Category Images</p>
                {category && category.images.map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-gray-800">
                    <img src={img} alt="" className="w-full h-24 object-cover" onError={e => e.target.style.display='none'} />
                  </div>
                ))}
                <p className="text-[10px] text-gray-600 leading-relaxed">These images are automatically included in your generated site via Unsplash.</p>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                  <p className="text-xs text-indigo-400 font-medium mb-1">Auto-included in generation</p>
                  <p className="text-[10px] text-gray-500">The AI uses category-specific Unsplash photography for realistic, professional imagery.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-950 flex-shrink-0 flex-wrap">
          <button onClick={() => setLeftOpen(v => !v)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer">
            {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* URL bar */}
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 font-mono truncate">
              {brandName ? `https://${brandName.toLowerCase().replace(/\s+/g, '')}.com` : 'https://your-website.com'}
            </span>
          </div>

          {/* View mode */}
          <div className="flex gap-0.5 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            {[{ id:'preview', icon:Eye }, { id:'code', icon:Braces }, { id:'split', icon:Columns }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`p-1.5 rounded cursor-pointer transition-colors ${viewMode === v.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                <v.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Device */}
          <div className="flex gap-0.5 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            {[{ id:'desktop', icon:Monitor }, { id:'tablet', icon:Tablet }, { id:'mobile', icon:Smartphone }].map(d => (
              <button key={d.id} onClick={() => setDevice(d.id)}
                className={`p-1.5 rounded cursor-pointer transition-colors ${device === d.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                <d.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Edit mode */}
          {htmlCode && !loading && (
            editMode ? (
              <div className="flex gap-1">
                <button onClick={saveEdits} disabled={savingEdits}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                  {savingEdits ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingEdits ? 'Saving…' : 'Save'}
                </button>
                <button onClick={cancelEdits}
                  className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={enterEditMode}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg cursor-pointer transition-colors border border-gray-700 hover:border-gray-500">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )
          )}

          {/* Export */}
          {htmlCode && !loading && (
            <div className="flex gap-1">
              <button onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg cursor-pointer transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg cursor-pointer transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { const b=new Blob([htmlCode],{type:'text/html'}); window.open(URL.createObjectURL(b),'_blank') }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border-b border-indigo-500/30 flex-shrink-0">
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-xs text-indigo-400 font-medium">Edit Mode — click any text on the page to edit it directly</p>
            <div className="ml-auto flex gap-2 text-xs text-indigo-300 opacity-60">
              <kbd className="px-1.5 py-0.5 bg-indigo-500/20 rounded text-[10px]">Click</kbd> select
              <kbd className="px-1.5 py-0.5 bg-indigo-500/20 rounded text-[10px]">Type</kbd> edit
            </div>
          </div>
        )}

        {/* Canvas content */}
        <div className="flex-1 overflow-auto bg-[#0d0d0d] p-4">
          {loading && (
            <div className="rounded-2xl overflow-hidden border border-gray-800" style={{ height: 640 }}>
              <LoadingScreen brandName={brandName} />
            </div>
          )}

          {!loading && !htmlCode && (
            <div className="rounded-2xl border border-gray-800 flex items-center justify-center bg-gray-950" style={{ height: 640 }}>
              <div className="text-center px-8 max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-10 h-10 text-indigo-400 opacity-60" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Ready to generate</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Configure your settings in the left panel then click <span className="text-indigo-400 font-medium">Generate Website</span>.
                  {category && <span className="text-gray-400"> Your <span className="text-indigo-300">{category.label}</span> site will include category-specific imagery and animations.</span>}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[{ icon:Film, label:'8 Animation Styles' }, { icon:Edit3, label:'Click-to-Edit Text' }, { icon:Smartphone, label:'3 Device Previews' }, { icon:Download, label:'Export HTML' }].map(f => (
                    <div key={f.label} className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400">
                      <f.icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />{f.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && htmlCode && (
            <div className={`${viewMode === 'split' ? 'grid grid-cols-2 gap-4' : ''}`}>
              {(viewMode === 'preview' || viewMode === 'split') && (
                <DeviceFrame device={viewMode === 'split' ? 'desktop' : device}>
                  <iframe ref={iframeRef} srcDoc={currentHtml} title="Preview" className="w-full border-0 bg-white"
                    style={{ height: iframeHeight, display: 'block' }} sandbox="allow-scripts allow-same-origin" />
                </DeviceFrame>
              )}
              {(viewMode === 'code' || viewMode === 'split') && (
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#090d12] border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-xs text-gray-500 font-mono">index.html</span>
                      <span className="text-[10px] text-gray-700">{lineCount} lines</span>
                    </div>
                    <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-white rounded cursor-pointer transition-colors">
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="overflow-auto p-4" style={{ height: iframeHeight }}>
                    <pre className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">{htmlCode}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        {htmlCode && !loading && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-800 bg-gray-950 flex-shrink-0">
            <button onClick={handleGenerate} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50 border border-gray-700">
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
            <div className="flex-1" />
            <span className="text-xs text-gray-600">{lineCount} lines · {(htmlCode.length / 1024).toFixed(1)} KB</span>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
              <Download className="w-3.5 h-3.5" /> Download HTML
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function WebDesigner() {
  const [phase, setPhase] = useState('category')
  const [category, setCategory] = useState(null)
  const [template, setTemplate] = useState(null)

  // Seed templates on first load
  useEffect(() => {
    fetch(`${API}/api/web-templates/seed`, { method: 'POST' }).catch(() => {})
  }, [])

  function handleSelectCategory(cat) {
    setCategory(cat)
    setTemplate(null)
    setPhase('templates')
  }

  function handleUseTemplate(t) {
    setTemplate(t)
    setPhase('builder')
  }

  function handleScratch() {
    setTemplate(null)
    setPhase('builder')
  }

  function handleBackToCategories() {
    setPhase('category')
    setCategory(null)
    setTemplate(null)
  }

  function handleBackToTemplates() {
    setPhase('templates')
    setTemplate(null)
  }

  return (
    <ToolLayout icon={Globe} title="Web Designer" description="AI-powered animated website builder with 100+ templates" color="#6366f1">
      {phase === 'category' && <CategoryPicker onSelect={handleSelectCategory} />}
      {phase === 'templates' && category && (
        <TemplateGallery
          category={category}
          onUseTemplate={handleUseTemplate}
          onScratch={handleScratch}
          onBack={handleBackToCategories}
        />
      )}
      {phase === 'builder' && (
        <Builder
          category={category}
          template={template}
          onBack={handleBackToTemplates}
        />
      )}
    </ToolLayout>
  )
}
