import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' })) // large limit for resume HTML templates

// ── MongoDB connection ─────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME     = process.env.MONGODB_DB || 'ai_agent_platform'

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in .env')
  process.exit(1)
}

const client = new MongoClient(MONGODB_URI)
let db

async function connectDB() {
  await client.connect()
  db = client.db(DB_NAME)
  console.log(`✅ Connected to MongoDB Atlas — database: "${DB_NAME}"`)
}

const col = (name) => db.collection(name)

// ── Helper: safe ObjectId ──────────────────────────────────────────────────────
function toId(id) {
  try { return new ObjectId(id) } catch { return null }
}

// ── Normalize doc: convert _id → id ───────────────────────────────────────────
function normalize(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...rest }
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/users/sync', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body
    const existing = await col('users').findOne({ uid })
    if (!existing) {
      await col('users').insertOne({
        uid,
        email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        createdAt: new Date(),
      })
    } else {
      await col('users').updateOne({ uid }, { $set: { lastLogin: new Date() } })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// RESUMES
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/resumes/:userId', async (req, res) => {
  try {
    const docs = await col('resumes')
      .find({ userId: req.params.userId })
      .sort({ updatedAt: -1 })
      .toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/resumes/:userId', async (req, res) => {
  try {
    const { resumeId, formData, generated, templateId, templateName } = req.body
    const data = {
      userId: req.params.userId,
      formData,
      generated: generated || null,
      templateId,
      templateName,
      updatedAt: new Date(),
    }
    if (resumeId) {
      const oid = toId(resumeId)
      if (oid) await col('resumes').updateOne({ _id: oid }, { $set: data })
      res.json({ id: resumeId })
    } else {
      const result = await col('resumes').insertOne({ ...data, createdAt: new Date() })
      res.json({ id: result.insertedId.toString() })
    }
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.delete('/api/resumes/:userId/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('resumes').deleteOne({ _id: oid, userId: req.params.userId })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOM RESUME TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/custom-templates/:userId', async (req, res) => {
  try {
    const docs = await col('customResumeTemplates')
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/custom-templates/:userId', async (req, res) => {
  try {
    const result = await col('customResumeTemplates').insertOne({
      ...req.body,
      userId: req.params.userId,
      createdAt: new Date(),
    })
    res.json({ id: result.insertedId.toString() })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.delete('/api/custom-templates/:userId/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('customResumeTemplates').deleteOne({ _id: oid, userId: req.params.userId })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// AD TEMPLATES  (admin writes, all authenticated users read)
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/ad-templates', async (req, res) => {
  try {
    const docs = await col('adTemplates').find({}).sort({ createdAt: -1 }).toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/ad-templates', async (req, res) => {
  try {
    const result = await col('adTemplates').insertOne({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    res.json({ id: result.insertedId.toString() })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.put('/api/ad-templates/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('adTemplates').updateOne({ _id: oid }, { $set: { ...req.body, updatedAt: new Date() } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.delete('/api/ad-templates/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('adTemplates').deleteOne({ _id: oid })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// AD VIDEO TEMPLATES  (admin writes, all users read)
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/ad-video-templates', async (req, res) => {
  try {
    const docs = await col('adVideoTemplates').find({}).sort({ createdAt: -1 }).toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/ad-video-templates', async (req, res) => {
  try {
    const result = await col('adVideoTemplates').insertOne({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    res.json({ id: result.insertedId.toString() })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.put('/api/ad-video-templates/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('adVideoTemplates').updateOne({ _id: oid }, { $set: { ...req.body, updatedAt: new Date() } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.delete('/api/ad-video-templates/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('adVideoTemplates').deleteOne({ _id: oid })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS HISTORY
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/translations/:userId', async (req, res) => {
  try {
    const docs = await col('translations')
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/translations/:userId', async (req, res) => {
  try {
    const result = await col('translations').insertOne({
      ...req.body,
      userId: req.params.userId,
      createdAt: new Date(),
    })
    res.json({ id: result.insertedId.toString() })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.delete('/api/translations/:userId/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('translations').deleteOne({ _id: oid, userId: req.params.userId })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// AD GENERATION HISTORY
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/ad-history/:userId', async (req, res) => {
  try {
    const docs = await col('adHistory')
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/ad-history/:userId', async (req, res) => {
  try {
    const result = await col('adHistory').insertOne({
      ...req.body,
      userId: req.params.userId,
      createdAt: new Date(),
    })
    res.json({ id: result.insertedId.toString() })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.delete('/api/ad-history/:userId/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('adHistory').deleteOne({ _id: oid, userId: req.params.userId })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION HISTORY
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/video-history/:userId', async (req, res) => {
  try {
    const docs = await col('videoHistory')
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/video-history/:userId', async (req, res) => {
  try {
    const result = await col('videoHistory').insertOne({
      ...req.body,
      userId: req.params.userId,
      createdAt: new Date(),
    })
    res.json({ id: result.insertedId.toString() })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.delete('/api/video-history/:userId/:id', async (req, res) => {
  try {
    const oid = toId(req.params.id)
    if (oid) await col('videoHistory').deleteOne({ _id: oid, userId: req.params.userId })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// WEB TEMPLATES  (landing page templates stored in MongoDB)
// ══════════════════════════════════════════════════════════════════════════════

const WEB_TEMPLATE_SEED = [
  // ── SaaS / Tech ──
  { slug:'neural-dashboard', name:'Neural Dashboard', category:'saas', style:'Dark Immersive', animationPreset:'floating3d', tags:['dark','3d','glassmorphism','violet'], accent:'#8b5cf6', bg:'#07040f', thumbnail:'https://picsum.photos/seed/neural-dashboard/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'violet', extraNotes:'3D floating glassmorphism cards in hero, gradient mesh background, animated stat counters', brandPlaceholder:'NeuralAI' } },
  { slug:'devflow-pro', name:'DevFlow Pro', category:'saas', style:'Modern Minimal', animationPreset:'dynamic', tags:['minimal','code','blue','clean'], accent:'#0ea5e9', bg:'#020d1a', thumbnail:'https://picsum.photos/seed/devflow-pro/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Pricing Table','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'blue', extraNotes:'Code editor mockup in hero, terminal animation, dark developer aesthetic', brandPlaceholder:'DevFlow' } },
  { slug:'cloudsync', name:'CloudSync', category:'saas', style:'Glassmorphism', animationPreset:'smooth', tags:['glass','blue','soft','cloud'], accent:'#38bdf8', bg:'#0c1a2e', thumbnail:'https://picsum.photos/seed/cloudsync/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Syne + Nunito', colorPreset:'blue', extraNotes:'Dashboard mockup floating in hero, glassmorphism panels, soft glow effects', brandPlaceholder:'CloudSync' } },
  // ── Agency / Creative ──
  { slug:'studio-noir', name:'Studio Noir', category:'agency', style:'Dark Immersive', animationPreset:'cinematic', tags:['dark','cinematic','luxury','bold'], accent:'#f59e0b', bg:'#080808', thumbnail:'https://picsum.photos/seed/studio-noir/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','How It Works','Team Section','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Clash Display + Satoshi', colorPreset:'auto', extraNotes:'Full-screen video-style hero, massive typography, horizontal scroll portfolio gallery', brandPlaceholder:'Noir Studio' } },
  { slug:'bold-and-co', name:'Bold&Co', category:'agency', style:'Neobrutalism', animationPreset:'dynamic', tags:['neobrutalism','orange','bold','playful'], accent:'#f97316', bg:'#fafaf0', thumbnail:'https://picsum.photos/seed/bold-and-co/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Gallery / Portfolio','Team Section','CTA Section','Footer'], fonts:'Cabinet Grotesk + Inter', colorPreset:'orange', extraNotes:'Thick borders, offset shadows, bold chunky typography, bright accent colors', brandPlaceholder:'Bold&Co' } },
  { slug:'crafted-works', name:'Crafted Works', category:'agency', style:'Elegant Luxury', animationPreset:'smooth', tags:['luxury','minimal','serif','gold'], accent:'#d4af37', bg:'#0a0a0a', thumbnail:'https://picsum.photos/seed/crafted-works/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Stats / Numbers','Team Section','Testimonials / Social Proof','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Serif typography, gold accents on dark, minimal elegant layout, full-width portfolio images', brandPlaceholder:'Crafted' } },
  // ── Portfolio ──
  { slug:'digital-space', name:'Digital Space', category:'portfolio', style:'Dark Immersive', animationPreset:'floating3d', tags:['dark','3d','portfolio','creative'], accent:'#06b6d4', bg:'#030712', thumbnail:'https://picsum.photos/seed/digital-space/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Stats / Numbers','About Section','Contact Form','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'teal', extraNotes:'3D perspective grid, floating project cards, particle field background, skill percentage bars', brandPlaceholder:'Alex Morgan' } },
  { slug:'visual-archive', name:'Visual Archive', category:'portfolio', style:'Bold Typographic', animationPreset:'cinematic', tags:['typographic','black','bold','editorial'], accent:'#ffffff', bg:'#0a0a0a', thumbnail:'https://picsum.photos/seed/visual-archive/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','About Section','Contact Form','Footer'], fonts:'Boska + Synonym', colorPreset:'auto', extraNotes:'Giant editorial typography, full-bleed images, minimal color palette, hover cursor effects', brandPlaceholder:'Visual' } },
  { slug:'motion-works', name:'Motion Works', category:'portfolio', style:'Gradient Heavy', animationPreset:'morphing', tags:['gradient','motion','colorful','creative'], accent:'#ec4899', bg:'#0f0014', thumbnail:'https://picsum.photos/seed/motion-works/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Stats / Numbers','About Section','Contact Form','Footer'], fonts:'Syne + Nunito', colorPreset:'pink', extraNotes:'Morphing gradient blobs, colorful project thumbnails, fluid animations throughout', brandPlaceholder:'Motion' } },
  // ── Startup / App ──
  { slug:'app-launch', name:'AppLaunch', category:'startup', style:'Dark Immersive', animationPreset:'floating3d', tags:['app','mobile','dark','violet'], accent:'#8b5cf6', bg:'#07040f', thumbnail:'https://picsum.photos/seed/app-launch/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'violet', extraNotes:'Phone mockup floating in 3D hero, app screenshots carousel, download badges for iOS/Android', brandPlaceholder:'AppName' } },
  { slug:'growth-kit', name:'GrowthKit', category:'startup', style:'Modern Minimal', animationPreset:'dynamic', tags:['startup','green','metrics','growth'], accent:'#22c55e', bg:'#030a05', thumbnail:'https://picsum.photos/seed/growth-kit/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Stats / Numbers','Features Grid','Testimonials / Social Proof','Pricing Table','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'green', extraNotes:'Animated metric counters in hero, growth chart graphic, social proof logos wall', brandPlaceholder:'GrowthKit' } },
  { slug:'waitlist-hero', name:'Waitlist Hero', category:'startup', style:'Dark Immersive', animationPreset:'cinematic', tags:['waitlist','launch','dark','exclusive'], accent:'#f59e0b', bg:'#080500', thumbnail:'https://picsum.photos/seed/waitlist-hero/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Newsletter Signup','Footer'], fonts:'Clash Display + Satoshi', colorPreset:'auto', extraNotes:'Countdown timer, early access waitlist form, exclusive launch feel, anticipation building', brandPlaceholder:'Exclusive' } },
  // ── E-commerce ──
  { slug:'luxe-shop', name:'Luxe Shop', category:'ecommerce', style:'Elegant Luxury', animationPreset:'smooth', tags:['luxury','dark','fashion','premium'], accent:'#d4af37', bg:'#080808', thumbnail:'https://picsum.photos/seed/luxe-shop/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Features Grid','Testimonials / Social Proof','Newsletter Signup','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Fashion/luxury product hero, editorial photography layout, elegant gold accents, refined typography', brandPlaceholder:'Luxe' } },
  { slug:'bold-market', name:'Bold Market', category:'ecommerce', style:'Neobrutalism', animationPreset:'dynamic', tags:['ecommerce','neobrutalism','bold','fun'], accent:'#ef4444', bg:'#fffaf0', thumbnail:'https://picsum.photos/seed/bold-market/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Gallery / Portfolio','CTA Section','Footer'], fonts:'Cabinet Grotesk + Inter', colorPreset:'red', extraNotes:'Product grid with thick borders, bold price display, cart interaction, playful hover states', brandPlaceholder:'BoldMart' } },
  { slug:'minimal-store', name:'Minimal Store', category:'ecommerce', style:'Modern Minimal', animationPreset:'smooth', tags:['minimal','white','clean','product'], accent:'#171717', bg:'#fafafa', thumbnail:'https://picsum.photos/seed/minimal-store/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Features Grid','Testimonials / Social Proof','Newsletter Signup','Footer'], fonts:'Inter + System UI', colorPreset:'white', extraNotes:'Pure white minimal aesthetic, product-first layout, subtle hover zoom, clean typography', brandPlaceholder:'Minimal' } },
  // ── Restaurant / Food ──
  { slug:'fine-table', name:'Fine Table', category:'restaurant', style:'Elegant Luxury', animationPreset:'smooth', tags:['restaurant','luxury','dark','food'], accent:'#c9a96e', bg:'#0a0805', thumbnail:'https://picsum.photos/seed/fine-table/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','About Section','Gallery / Portfolio','Stats / Numbers','CTA Section','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Full-screen food photography hero, elegant serif typography, reservation CTA, menu preview section, warm candlelit color palette', brandPlaceholder:'Maison' } },
  { slug:'street-eats', name:'Street Eats', category:'restaurant', style:'Bold Typographic', animationPreset:'dynamic', tags:['food','bold','vibrant','street'], accent:'#ef4444', bg:'#1a0000', thumbnail:'https://picsum.photos/seed/street-eats/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Gallery / Portfolio','CTA Section','Footer'], fonts:'Syne + Nunito', colorPreset:'red', extraNotes:'Vibrant food photos, bold chunky menu items, order online CTA, energetic street food vibe', brandPlaceholder:'StreetEats' } },
  { slug:'cafe-bloom', name:'Café Bloom', category:'restaurant', style:'Modern Minimal', animationPreset:'smooth', tags:['cafe','warm','cozy','minimal'], accent:'#92400e', bg:'#fdf6f0', thumbnail:'https://picsum.photos/seed/cafe-bloom/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','About Section','Gallery / Portfolio','Newsletter Signup','Footer'], fonts:'Boska + Synonym', colorPreset:'orange', extraNotes:'Warm earthy tones, cozy café atmosphere, coffee photography, serif typography, soft ambient feel', brandPlaceholder:'Bloom Café' } },
  // ── Healthcare / Medical ──
  { slug:'medcore', name:'MedCore', category:'healthcare', style:'Corporate Clean', animationPreset:'smooth', tags:['medical','clean','blue','professional'], accent:'#0284c7', bg:'#f0f9ff', thumbnail:'https://picsum.photos/seed/medcore/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Team Section','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'blue', extraNotes:'Clean medical professional layout, trust signals, doctor team photos, health statistics, appointment booking CTA', brandPlaceholder:'MedCore' } },
  { slug:'wellnessx', name:'WellnessX', category:'healthcare', style:'Modern Minimal', animationPreset:'smooth', tags:['wellness','green','calm','health'], accent:'#16a34a', bg:'#f0fdf4', thumbnail:'https://picsum.photos/seed/wellnessx/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','Newsletter Signup','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'green', extraNotes:'Calming green palette, wellness app mockup, breathing animation in hero, mindfulness-focused copy', brandPlaceholder:'WellnessX' } },
  // ── Finance / Fintech ──
  { slug:'finvault', name:'FinVault', category:'finance', style:'Dark Immersive', animationPreset:'dynamic', tags:['fintech','dark','blue','trust'], accent:'#0ea5e9', bg:'#020d1a', thumbnail:'https://picsum.photos/seed/finvault/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'blue', extraNotes:'Animated financial chart in hero, security trust badges, portfolio dashboard mockup, dark professional fintech aesthetic', brandPlaceholder:'FinVault' } },
  { slug:'wealth-pro', name:'WealthPro', category:'finance', style:'Elegant Luxury', animationPreset:'smooth', tags:['wealth','luxury','gold','premium'], accent:'#d4af37', bg:'#0a0800', thumbnail:'https://picsum.photos/seed/wealth-pro/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Premium wealth management feel, gold accents, serif typography, trust and exclusivity, private banking aesthetic', brandPlaceholder:'WealthPro' } },
  // ── Education / Course ──
  { slug:'course-flow', name:'CourseFlow', category:'education', style:'Gradient Heavy', animationPreset:'dynamic', tags:['education','course','violet','lms'], accent:'#7c3aed', bg:'#0f0730', thumbnail:'https://picsum.photos/seed/course-flow/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Stats / Numbers','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'violet', extraNotes:'Course curriculum preview, video player mockup, student testimonials with photos, progress visualization, enrollment CTA', brandPlaceholder:'CourseFlow' } },
  { slug:'learn-kit', name:'LearnKit', category:'education', style:'Modern Minimal', animationPreset:'smooth', tags:['education','minimal','clean','learning'], accent:'#0284c7', bg:'#f8faff', thumbnail:'https://picsum.photos/seed/learn-kit/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Stats / Numbers','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'blue', extraNotes:'Clean educational platform, course cards grid, instructor profiles, learning path visualization', brandPlaceholder:'LearnKit' } },
  // ── Real Estate ──
  { slug:'prop-lux', name:'PropLux', category:'realestate', style:'Elegant Luxury', animationPreset:'smooth', tags:['realestate','luxury','dark','premium'], accent:'#c9a96e', bg:'#080806', thumbnail:'https://picsum.photos/seed/prop-lux/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Features Grid','Stats / Numbers','Team Section','Contact Form','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Luxury property photography, aerial shots, property features grid, agent profile, property search mockup, gold accents on dark', brandPlaceholder:'PropLux' } },
  { slug:'home-find', name:'HomeFind', category:'realestate', style:'Modern Minimal', animationPreset:'smooth', tags:['realestate','clean','search','modern'], accent:'#0f766e', bg:'#f0fdfc', thumbnail:'https://picsum.photos/seed/home-find/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','Contact Form','Footer'], fonts:'Inter + System UI', colorPreset:'teal', extraNotes:'Property search interface in hero, neighborhood stats, map integration placeholder, clean property cards', brandPlaceholder:'HomeFind' } },
]

app.get('/api/web-templates', async (req, res) => {
  try {
    const query = {}
    if (req.query.category) query.category = req.query.category
    if (req.query.featured === 'true') query.featured = true
    const docs = await col('webTemplates').find(query).sort({ featured: -1, createdAt: -1 }).toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.get('/api/web-templates/categories', async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: '$category', count: { $sum: 1 }, featured: { $sum: { $cond: ['$featured', 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]
    const result = await col('webTemplates').aggregate(pipeline).toArray()
    res.json(result)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.get('/api/web-templates/:id', async (req, res) => {
  try {
    const doc = await col('webTemplates').findOne({ slug: req.params.id }) ||
                await col('webTemplates').findOne({ _id: toId(req.params.id) })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json(normalize(doc))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/web-templates/seed', async (req, res) => {
  try {
    const existing = await col('webTemplates').countDocuments()
    if (existing > 0 && !req.query.force) {
      return res.json({ message: `Already seeded (${existing} templates). Use ?force=true to re-seed.`, count: existing })
    }
    if (req.query.force) await col('webTemplates').deleteMany({})
    const docs = WEB_TEMPLATE_SEED.map(t => ({ ...t, createdAt: new Date() }))
    await col('webTemplates').insertMany(docs)
    await col('webTemplates').createIndex({ category: 1 })
    await col('webTemplates').createIndex({ slug: 1 }, { unique: true })
    res.json({ message: `Seeded ${docs.length} templates`, count: docs.length })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
connectDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 API server running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('MongoDB connection failed:', err); process.exit(1) })
