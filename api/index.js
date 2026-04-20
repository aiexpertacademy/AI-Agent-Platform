import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME     = process.env.MONGODB_DB || 'ai_agent_platform'

const client = new MongoClient(MONGODB_URI)
let cachedDb = null

async function connectDB() {
  if (cachedDb) return cachedDb
  await client.connect()
  cachedDb = client.db(DB_NAME)
  return cachedDb
}

function col(name) {
  return cachedDb.collection(name)
}

function toId(id) {
  try { return new ObjectId(id) } catch { return null }
}

function normalize(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...rest }
}

// Middleware to ensure DB is connected on every request
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed: ' + err.message })
  }
})

// ── USERS ──────────────────────────────────────────────────────────────────────

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

// ── RESUMES ────────────────────────────────────────────────────────────────────

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

// ── CUSTOM RESUME TEMPLATES ────────────────────────────────────────────────────

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

// ── AD TEMPLATES ───────────────────────────────────────────────────────────────

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

// ── AD VIDEO TEMPLATES ─────────────────────────────────────────────────────────

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

// ── TRANSLATIONS HISTORY ───────────────────────────────────────────────────────

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

// ── AD HISTORY ─────────────────────────────────────────────────────────────────

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

// ── VIDEO HISTORY ──────────────────────────────────────────────────────────────

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

// ── WEB TEMPLATES ──────────────────────────────────────────────────────────────

const WEB_TEMPLATE_SEED = [
  { slug:'neural-dashboard', name:'Neural Dashboard', category:'saas', style:'Dark Immersive', animationPreset:'floating3d', tags:['dark','3d','glassmorphism','violet'], accent:'#8b5cf6', bg:'#07040f', thumbnail:'https://picsum.photos/seed/neural-dashboard/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'violet', extraNotes:'3D floating glassmorphism cards in hero, gradient mesh background, animated stat counters', brandPlaceholder:'NeuralAI' } },
  { slug:'devflow-pro', name:'DevFlow Pro', category:'saas', style:'Modern Minimal', animationPreset:'dynamic', tags:['minimal','code','blue','clean'], accent:'#0ea5e9', bg:'#020d1a', thumbnail:'https://picsum.photos/seed/devflow-pro/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Pricing Table','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'blue', extraNotes:'Code editor mockup in hero, terminal animation, dark developer aesthetic', brandPlaceholder:'DevFlow' } },
  { slug:'cloudsync', name:'CloudSync', category:'saas', style:'Glassmorphism', animationPreset:'smooth', tags:['glass','blue','soft','cloud'], accent:'#38bdf8', bg:'#0c1a2e', thumbnail:'https://picsum.photos/seed/cloudsync/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Syne + Nunito', colorPreset:'blue', extraNotes:'Dashboard mockup floating in hero, glassmorphism panels, soft glow effects', brandPlaceholder:'CloudSync' } },
  { slug:'studio-noir', name:'Studio Noir', category:'agency', style:'Dark Immersive', animationPreset:'cinematic', tags:['dark','cinematic','luxury','bold'], accent:'#f59e0b', bg:'#080808', thumbnail:'https://picsum.photos/seed/studio-noir/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','How It Works','Team Section','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Clash Display + Satoshi', colorPreset:'auto', extraNotes:'Full-screen video-style hero, massive typography, horizontal scroll portfolio gallery', brandPlaceholder:'Noir Studio' } },
  { slug:'bold-and-co', name:'Bold&Co', category:'agency', style:'Neobrutalism', animationPreset:'dynamic', tags:['neobrutalism','orange','bold','playful'], accent:'#f97316', bg:'#fafaf0', thumbnail:'https://picsum.photos/seed/bold-and-co/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Gallery / Portfolio','Team Section','CTA Section','Footer'], fonts:'Cabinet Grotesk + Inter', colorPreset:'orange', extraNotes:'Thick borders, offset shadows, bold chunky typography, bright accent colors', brandPlaceholder:'Bold&Co' } },
  { slug:'crafted-works', name:'Crafted Works', category:'agency', style:'Elegant Luxury', animationPreset:'smooth', tags:['luxury','minimal','serif','gold'], accent:'#d4af37', bg:'#0a0a0a', thumbnail:'https://picsum.photos/seed/crafted-works/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Stats / Numbers','Team Section','Testimonials / Social Proof','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Serif typography, gold accents on dark, minimal elegant layout, full-width portfolio images', brandPlaceholder:'Crafted' } },
  { slug:'digital-space', name:'Digital Space', category:'portfolio', style:'Dark Immersive', animationPreset:'floating3d', tags:['dark','3d','portfolio','creative'], accent:'#06b6d4', bg:'#030712', thumbnail:'https://picsum.photos/seed/digital-space/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Stats / Numbers','About Section','Contact Form','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'teal', extraNotes:'3D perspective grid, floating project cards, particle field background, skill percentage bars', brandPlaceholder:'Alex Morgan' } },
  { slug:'visual-archive', name:'Visual Archive', category:'portfolio', style:'Bold Typographic', animationPreset:'cinematic', tags:['typographic','black','bold','editorial'], accent:'#ffffff', bg:'#0a0a0a', thumbnail:'https://picsum.photos/seed/visual-archive/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','About Section','Contact Form','Footer'], fonts:'Boska + Synonym', colorPreset:'auto', extraNotes:'Giant editorial typography, full-bleed images, minimal color palette, hover cursor effects', brandPlaceholder:'Visual' } },
  { slug:'motion-works', name:'Motion Works', category:'portfolio', style:'Gradient Heavy', animationPreset:'morphing', tags:['gradient','motion','colorful','creative'], accent:'#ec4899', bg:'#0f0014', thumbnail:'https://picsum.photos/seed/motion-works/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Stats / Numbers','About Section','Contact Form','Footer'], fonts:'Syne + Nunito', colorPreset:'pink', extraNotes:'Morphing gradient blobs, colorful project thumbnails, fluid animations throughout', brandPlaceholder:'Motion' } },
  { slug:'app-launch', name:'AppLaunch', category:'startup', style:'Dark Immersive', animationPreset:'floating3d', tags:['app','mobile','dark','violet'], accent:'#8b5cf6', bg:'#07040f', thumbnail:'https://picsum.photos/seed/app-launch/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'violet', extraNotes:'Phone mockup floating in 3D hero, app screenshots carousel, download badges for iOS/Android', brandPlaceholder:'AppName' } },
  { slug:'growth-kit', name:'GrowthKit', category:'startup', style:'Modern Minimal', animationPreset:'dynamic', tags:['startup','green','metrics','growth'], accent:'#22c55e', bg:'#030a05', thumbnail:'https://picsum.photos/seed/growth-kit/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Stats / Numbers','Features Grid','Testimonials / Social Proof','Pricing Table','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'green', extraNotes:'Animated metric counters in hero, growth chart graphic, social proof logos wall', brandPlaceholder:'GrowthKit' } },
  { slug:'waitlist-hero', name:'Waitlist Hero', category:'startup', style:'Dark Immersive', animationPreset:'cinematic', tags:['waitlist','launch','dark','exclusive'], accent:'#f59e0b', bg:'#080500', thumbnail:'https://picsum.photos/seed/waitlist-hero/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Newsletter Signup','Footer'], fonts:'Clash Display + Satoshi', colorPreset:'auto', extraNotes:'Countdown timer, early access waitlist form, exclusive launch feel, anticipation building', brandPlaceholder:'Exclusive' } },
  { slug:'luxe-shop', name:'Luxe Shop', category:'ecommerce', style:'Elegant Luxury', animationPreset:'smooth', tags:['luxury','dark','fashion','premium'], accent:'#d4af37', bg:'#080808', thumbnail:'https://picsum.photos/seed/luxe-shop/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Features Grid','Testimonials / Social Proof','Newsletter Signup','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Fashion/luxury product hero, editorial photography layout, elegant gold accents, refined typography', brandPlaceholder:'Luxe' } },
  { slug:'bold-market', name:'Bold Market', category:'ecommerce', style:'Neobrutalism', animationPreset:'dynamic', tags:['ecommerce','neobrutalism','bold','fun'], accent:'#ef4444', bg:'#fffaf0', thumbnail:'https://picsum.photos/seed/bold-market/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Gallery / Portfolio','CTA Section','Footer'], fonts:'Cabinet Grotesk + Inter', colorPreset:'red', extraNotes:'Product grid with thick borders, bold price display, cart interaction, playful hover states', brandPlaceholder:'BoldMart' } },
  { slug:'minimal-store', name:'Minimal Store', category:'ecommerce', style:'Modern Minimal', animationPreset:'smooth', tags:['minimal','white','clean','product'], accent:'#171717', bg:'#fafafa', thumbnail:'https://picsum.photos/seed/minimal-store/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Gallery / Portfolio','Features Grid','Testimonials / Social Proof','Newsletter Signup','Footer'], fonts:'Inter + System UI', colorPreset:'white', extraNotes:'Pure white minimal aesthetic, product-first layout, subtle hover zoom, clean typography', brandPlaceholder:'Minimal' } },
  { slug:'fine-table', name:'Fine Table', category:'restaurant', style:'Elegant Luxury', animationPreset:'smooth', tags:['restaurant','luxury','dark','food'], accent:'#c9a96e', bg:'#0a0805', thumbnail:'https://picsum.photos/seed/fine-table/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','About Section','Gallery / Portfolio','Stats / Numbers','CTA Section','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Full-screen food photography hero, elegant serif typography, reservation CTA, menu preview section, warm candlelit color palette', brandPlaceholder:'Maison' } },
  { slug:'street-eats', name:'Street Eats', category:'restaurant', style:'Bold Typographic', animationPreset:'dynamic', tags:['food','bold','vibrant','street'], accent:'#ef4444', bg:'#1a0000', thumbnail:'https://picsum.photos/seed/street-eats/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Gallery / Portfolio','CTA Section','Footer'], fonts:'Syne + Nunito', colorPreset:'red', extraNotes:'Vibrant food photos, bold chunky menu items, order online CTA, energetic street food vibe', brandPlaceholder:'StreetEats' } },
  { slug:'cafe-bloom', name:'Café Bloom', category:'restaurant', style:'Modern Minimal', animationPreset:'smooth', tags:['cafe','warm','cozy','minimal'], accent:'#92400e', bg:'#fdf6f0', thumbnail:'https://picsum.photos/seed/cafe-bloom/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','About Section','Gallery / Portfolio','Newsletter Signup','Footer'], fonts:'Boska + Synonym', colorPreset:'orange', extraNotes:'Warm earthy tones, cozy café atmosphere, coffee photography, serif typography, soft ambient feel', brandPlaceholder:'Bloom Café' } },
  { slug:'medcore', name:'MedCore', category:'healthcare', style:'Corporate Clean', animationPreset:'smooth', tags:['medical','clean','blue','professional'], accent:'#0284c7', bg:'#f0f9ff', thumbnail:'https://picsum.photos/seed/medcore/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Team Section','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'blue', extraNotes:'Clean medical professional layout, trust signals, doctor team photos, health statistics, appointment booking CTA', brandPlaceholder:'MedCore' } },
  { slug:'wellnessx', name:'WellnessX', category:'healthcare', style:'Modern Minimal', animationPreset:'smooth', tags:['wellness','green','calm','health'], accent:'#16a34a', bg:'#f0fdf4', thumbnail:'https://picsum.photos/seed/wellnessx/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Testimonials / Social Proof','Newsletter Signup','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'green', extraNotes:'Calming green palette, wellness app mockup, breathing animation in hero, mindfulness-focused copy', brandPlaceholder:'WellnessX' } },
  { slug:'finvault', name:'FinVault', category:'finance', style:'Dark Immersive', animationPreset:'dynamic', tags:['fintech','dark','blue','trust'], accent:'#0ea5e9', bg:'#020d1a', thumbnail:'https://picsum.photos/seed/finvault/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'blue', extraNotes:'Animated financial chart in hero, security trust badges, portfolio dashboard mockup, dark professional fintech aesthetic', brandPlaceholder:'FinVault' } },
  { slug:'wealth-pro', name:'WealthPro', category:'finance', style:'Elegant Luxury', animationPreset:'smooth', tags:['wealth','luxury','gold','premium'], accent:'#d4af37', bg:'#0a0800', thumbnail:'https://picsum.photos/seed/wealth-pro/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','Stats / Numbers','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Playfair Display + Lato', colorPreset:'auto', extraNotes:'Premium wealth management feel, gold accents, serif typography, trust and exclusivity, private banking aesthetic', brandPlaceholder:'WealthPro' } },
  { slug:'course-flow', name:'CourseFlow', category:'education', style:'Gradient Heavy', animationPreset:'dynamic', tags:['education','course','violet','lms'], accent:'#7c3aed', bg:'#0f0730', thumbnail:'https://picsum.photos/seed/course-flow/400/260', featured:true, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Stats / Numbers','Testimonials / Social Proof','Pricing Table','FAQ Accordion','CTA Section','Footer'], fonts:'Space Grotesk + DM Sans', colorPreset:'violet', extraNotes:'Course curriculum preview, video player mockup, student testimonials with photos, progress visualization, enrollment CTA', brandPlaceholder:'CourseFlow' } },
  { slug:'learn-kit', name:'LearnKit', category:'education', style:'Modern Minimal', animationPreset:'smooth', tags:['education','minimal','clean','learning'], accent:'#0284c7', bg:'#f8faff', thumbnail:'https://picsum.photos/seed/learn-kit/400/260', featured:false, config:{ sections:['Navigation Bar','Hero / Header','Features Grid','How It Works','Stats / Numbers','Testimonials / Social Proof','CTA Section','Footer'], fonts:'Inter + System UI', colorPreset:'blue', extraNotes:'Clean educational platform, course cards grid, instructor profiles, learning path visualization', brandPlaceholder:'LearnKit' } },
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

// ══════════════════════════════════════════════════════════════════════════════
// RESUME TEMPLATES  (pre-defined professional styles, seeded to MongoDB)
// ══════════════════════════════════════════════════════════════════════════════

const RESUME_TEMPLATE_SEED = [
  // ── Professional ──────────────────────────────────────────────────────────
  { slug:'classic-pro', name:'Classic Professional', category:'Professional', style:'Timeline Classic', layout:'timeline', description:'Traditional timeline CV with navy accents. Ideal for corporate and management roles.', accentColor:'#1a3a5c', headerBg:'#ffffff', sidebarBg:null, headerText:'#1a3a5c', featured:true, tags:['classic','serif','timeline','corporate'], promptStyle:'SINGLE-COLUMN MODERNCV CLASSIC STYLE: Full-width header — large name left-aligned in navy (#1a3a5c), contact info right-aligned. A thick horizontal navy rule spans full width below header. Each experience entry: date range on LEFT (width ~90px) in navy, a vertical navy left border line, then role bold + company in navy, then bullet points. Section headers uppercase with navy underline. Serif fonts Georgia/Times. White background. Formal, professional tone.' },
  { slug:'executive-blue', name:'Executive Blue', category:'Professional', style:'Banking Style', layout:'single', description:'Bold navy header with clean white body. Perfect for senior management and finance.', accentColor:'#0c2461', headerBg:'#0c2461', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['navy','executive','banking','formal'], promptStyle:'SINGLE-COLUMN EXECUTIVE STYLE: Bold full-width navy (#0c2461) header — name large white serif, job title smaller white, contact row in light gray below name. Body: white background, navy uppercase section titles with full-width thin navy underline rule. Clean Cambria/Georgia serif. Generous spacing. Perfect for banking, finance, law.' },
  { slug:'clean-minimal', name:'Clean Minimal', category:'Professional', style:"Jake's Resume Style", layout:'single', description:'Ultra-clean ATS-friendly resume. No colors — pure black and white for maximum compatibility.', accentColor:'#000000', headerBg:'#ffffff', sidebarBg:null, headerText:'#000000', featured:true, tags:['minimal','ats-friendly','clean','black-white'], promptStyle:'ULTRA-MINIMAL ATS STYLE: No colors — only black and white. Name centered large bold at top, contact info on one line separated by | pipes. Section headers: bold uppercase with simple thin horizontal rule. No borders, columns, or decorative elements. Pure Helvetica/Arial sans-serif. Max whitespace. Bullet points with consistent indentation. Designed to pass ATS systems perfectly.' },
  { slug:'european-cv', name:'European CV', category:'Professional', style:'Europass Style', layout:'single', description:'Standard European Curriculum Vitae format with structured layout and photo section.', accentColor:'#003399', headerBg:'#003399', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['europass','european','structured','formal'], promptStyle:'EUROPASS EUROPEAN CV STYLE: Blue (#003399) header bar with white "Curriculum Vitae" label above name. Name in large bold white. Photo placeholder circle on right of header. Two-column info section below header: left personal details table, right contact table. Section labels in blue bold left column (~25%), content right column. Blue horizontal rule separates each section. Arial font. Very structured.' },
  { slug:'corporate-gray', name:'Corporate Gray', category:'Professional', style:'Clean Corporate', layout:'single', description:'Sophisticated charcoal-toned design for business professionals and managers.', accentColor:'#4a5568', headerBg:'#2d3748', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['gray','corporate','sophisticated','neutral'], promptStyle:'CORPORATE GRAY STYLE: Dark charcoal (#2d3748) header with white bold name and light gray job title. Body: warm white background, gray (#4a5568) section titles with thin gray bottom border. Contact details bar below header shows info with pipe separators. Clean Inter/System UI sans-serif. Balanced, mature, business-focused look.' },
  { slug:'academic-traditional', name:'Academic Traditional', category:'Professional', style:'Academic Standard', layout:'single', description:'Clean academic CV for faculty, researchers, and postdocs. Publication-ready format.', accentColor:'#7b341e', headerBg:'#ffffff', sidebarBg:null, headerText:'#1a1a1a', featured:false, tags:['academic','research','publications','traditional'], promptStyle:'ACADEMIC TRADITIONAL: Left-aligned header — name large bold serif, then title/department, institution, contact stacked. Section headers in bold small caps with brick-red (#7b341e) and full-width hairline underline. Sections: Education, Research/Publications, Teaching, Presentations, Awards. Publications in bibliography format (Author, Title, Journal, Year). Times New Roman/Georgia serif. Generous line spacing.' },
  { slug:'financial-pro', name:'Financial Pro', category:'Professional', style:'Finance & Consulting', layout:'single', description:'Dark navy design for investment banking, private equity, and consulting analysts.', accentColor:'#1B4F72', headerBg:'#1B4F72', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['finance','banking','consulting','metrics'], promptStyle:'FINANCIAL PRO STYLE: Deep navy (#1B4F72) full-width header, white bold name, white job title, contact in one line. Body: white background with navy section title bars — full-width colored band with white section name text inside (height ~20px). Every bullet has metrics and impact numbers. Diamond dash markers. Cambria serif, very precise layout. Reads like an investment banking analyst wrote it.' },
  { slug:'consulting-elite', name:'Consulting Elite', category:'Professional', style:'McKinsey/BCG Style', layout:'single', description:'Achievement-focused design used by top consulting firm candidates worldwide.', accentColor:'#153060', headerBg:'#153060', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['consulting','achievement','structured','dense'], promptStyle:'CONSULTING ELITE: Dark navy (#153060) header, white name + title. Experience entries: bold role + company on same line, date right-aligned on same line. CRITICAL: every bullet uses Impact-Action-Context format with quantified metrics. Em-dash (—) bullet markers. Dense text, small font. Maximum information per line. No whitespace waste. This looks exactly like a McKinsey/BCG formatted resume.' },

  // ── Creative ──────────────────────────────────────────────────────────────
  { slug:'awesome-cv', name:'Awesome CV', category:'Creative', style:'Colored Sidebar', layout:'sidebar', description:'The most popular resume template on GitHub. Teal sidebar with clean structured content.', accentColor:'#00ADB5', headerBg:'#00ADB5', sidebarBg:'#00ADB5', headerText:'#ffffff', featured:true, tags:['teal','sidebar','popular','modern'], promptStyle:'AWESOME-CV STYLE: Teal (#00ADB5) LEFT sidebar (30% width) — white name, white contact info each line with icon prefix, white skill tags. Right main: white background, each section has teal uppercase header. Experience entries: bold role, teal company name, gray date right-aligned, teal dash bullet markers. Helvetica Neue sans-serif. Very clean and modern.' },
  { slug:'friggeri-dark', name:'Friggeri Dark', category:'Creative', style:'Dark Sidebar', layout:'sidebar', description:'Striking dark left sidebar with vibrant section accents. Bold and memorable.', accentColor:'#e74c3c', headerBg:'#2c3e50', sidebarBg:'#2c3e50', headerText:'#ffffff', featured:true, tags:['dark','sidebar','striking','bold'], promptStyle:'FRIGGERI DARK STYLE: Dark (#2c3e50) left sidebar — name in large white font across multiple lines, white contact info below. Right main: white body, section titles in RED (#e74c3c) uppercase. Experience: role bold, company in red, date gray small. Thin colored rule separates sections. Sidebar flows naturally without section labels. Lato/Roboto sans-serif.' },
  { slug:'creative-vivid', name:'Creative Vivid', category:'Creative', style:'Gradient Header', layout:'single', description:'Vivid purple gradient header with modern typography for creative professionals.', accentColor:'#8B5CF6', headerBg:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['gradient','creative','purple','modern'], promptStyle:'CREATIVE VIVID STYLE: Full-width purple gradient header (from #667eea to #764ba2), white name large bold, job title in lighter purple-white, contact icons row. Body: white background, purple (#8B5CF6) section titles with subtle purple left border. Skills shown as purple-tinted pill chips. Modern Poppins or Space Grotesk sans-serif. For designers, marketers, creatives.' },
  { slug:'designer-portfolio', name:'Designer Portfolio', category:'Creative', style:'Portfolio Focus', layout:'two-column', description:'Two-column layout designed to showcase creative work and visual design projects.', accentColor:'#F59E0B', headerBg:'#1a1a1a', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['designer','portfolio','amber','two-column'], promptStyle:'DESIGNER PORTFOLIO STYLE: Dark (#1a1a1a) full-width header, white name, amber (#F59E0B) accent on subtitle. Two-column body: LEFT (35%): Skills in amber-bordered groups, Tools, Languages. RIGHT (65%): Experience with amber dot markers, Projects highlighted with amber left border. Ultra-modern design-forward aesthetic. Montserrat or geometric sans-serif.' },
  { slug:'bold-statement', name:'Bold Statement', category:'Creative', style:'Bold Typography', layout:'single', description:'Make a statement with massive bold typography and dramatic visual contrast.', accentColor:'#E53E3E', headerBg:'#ffffff', sidebarBg:null, headerText:'#1a1a1a', featured:false, tags:['bold','typography','red','dramatic'], promptStyle:'BOLD STATEMENT STYLE: White background throughout. Name in MASSIVE black font (48-60pt), dominating the header. Red (#E53E3E) thin horizontal rule below name. Contact info tiny and minimal. Section headers use large bold numbers (01, 02, 03) with section name beside. Very generous whitespace between sections. Small clean body text. Dramatic contrast between huge headers and small content. Editorial/luxury feel.' },

  // ── Tech ─────────────────────────────────────────────────────────────────
  { slug:'deedy-tech', name:'Deedy Resume', category:'Tech', style:'Two-Column Tech', layout:'two-column', description:'Iconic two-column resume popular in software engineering. Dark header, equal columns.', accentColor:'#2b2b2b', headerBg:'#2b2b2b', sidebarBg:null, headerText:'#ffffff', featured:true, tags:['two-column','tech','software','popular'], promptStyle:'DEEDY-CV STYLE: Full-width dark (#2b2b2b) header — name VERY LARGE centered in white, contact info small centered below. Body: EQUAL two columns with thin vertical separator. LEFT column: Education most prominent (school, degree, GPA), optional coursework. RIGHT column: Experience (most space), then Skills by category (Languages, Technologies, Tools). Section headers in small ALL-CAPS with thin horizontal rule. Lato + Raleway fonts. Engineer aesthetic.' },
  { slug:'dev-minimal', name:'Developer Minimal', category:'Tech', style:'Developer Clean', layout:'single', description:'Clean minimalist design optimized for software engineers. GitHub-ready format.', accentColor:'#38A169', headerBg:'#ffffff', sidebarBg:null, headerText:'#1a1a1a', featured:false, tags:['developer','minimal','green','engineer'], promptStyle:'DEVELOPER MINIMAL STYLE: Left-aligned header — name bold black, title in green (#38A169), contact on one line with | separators and GitHub/Portfolio links prominent. Section headers: uppercase green with bottom border. Experience: company bold + role italic, date right-aligned, arrow (→) bullet markers. SKILLS section prominent with tech grouped: "Languages: Python, JS" "Frameworks: React..." Monospace for skill names, sans-serif for prose.' },
  { slug:'altacv-modern', name:'AltaCV Modern', category:'Tech', style:'AltaCV Two-Column', layout:'two-column', description:'Popular two-column layout with light sidebar and colored accent markers.', accentColor:'#0097A7', headerBg:'#ffffff', sidebarBg:'#f5f5f5', headerText:'#1a1a1a', featured:false, tags:['altacv','two-column','teal','sidebar'], promptStyle:'ALTACV MODERN STYLE: Header: large name left, colorful tagline right. LEFT column (30%, light gray #f5f5f5 bg): Contact at top, Skills with optional thin bar fill per skill, Languages. RIGHT column (70%, white): Summary paragraph, Experience with teal (#0097A7) event markers on timeline, Education. Teal accent for section headers and decorative elements. Section headers use colored prefix symbol. Roboto/Inter.' },
  { slug:'tech-dark', name:'Tech Dark Mode', category:'Tech', style:'Dark Terminal', layout:'sidebar', description:'Full dark-mode CV for developers who want a unique, eye-catching technical design.', accentColor:'#68D391', headerBg:'#1a202c', sidebarBg:'#171923', headerText:'#ffffff', featured:false, tags:['dark','terminal','developer','green'], promptStyle:'TECH DARK MODE STYLE: ENTIRELY dark-themed. Dark sidebar (#171923) — name in green (#68D391), @ and > prefixes on contact items for terminal feel. Main area dark (#1a202c), light gray text. Green (#68D391) section headers. Experience entries styled like terminal prompts. Skills as code snippets. Fira Code/Courier for headers and skill names, sans-serif for descriptions. For developers who code at night.' },
  { slug:'startup-modern', name:'Startup Modern', category:'Tech', style:'Startup Culture', layout:'single', description:'Energetic modern design for founders, PMs, and growth professionals.', accentColor:'#7C3AED', headerBg:'#7C3AED', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['startup','product','violet','modern'], promptStyle:'STARTUP MODERN STYLE: Bold violet (#7C3AED) header, white name + italic job title. Body white with violet accents. Each experience: company name large violet bold, role smaller black, date gray right-aligned. Bold formatting on metrics/impact numbers inside bullets. Tech stack shown as rounded violet-outlined chips. LinkedIn + GitHub as styled link badges in header. Space Grotesk/DM Sans. Energetic, growth-focused.' },

  // ── Academic ──────────────────────────────────────────────────────────────
  { slug:'phd-full', name:'Full PhD CV', category:'Academic', style:'Academic Complete', layout:'single', description:'Comprehensive academic CV with all sections for faculty and research positions.', accentColor:'#2C5F8A', headerBg:'#2C5F8A', sidebarBg:null, headerText:'#ffffff', featured:true, tags:['phd','academic','publications','comprehensive'], promptStyle:'FULL ACADEMIC PhD CV: Blue (#2C5F8A) header with name and academic title. ALL academic sections: Education, Research Experience, Publications (numbered bibliography format), Conference Presentations, Teaching Experience, Grants & Fellowships, Awards, Professional Service, Skills, References. Blue section headers with full-width underline rule. Dense clean font. Times New Roman/Garamond. This CV is 2+ pages long.' },
  { slug:'research-scholar', name:'Research Scholar', category:'Academic', style:'Scholar Format', layout:'single', description:'Focused on research output with publication-ready bibliography formatting.', accentColor:'#8B2252', headerBg:'#ffffff', sidebarBg:null, headerText:'#1a1a1a', featured:false, tags:['research','scholar','crimson','publications'], promptStyle:'RESEARCH SCHOLAR STYLE: Left-aligned header — name bold large, institution italic gray below, email | ResearchGate | Google Scholar links. Crimson (#8B2252) section headers in small caps with hairline underline. "Research Interests" as first section (1-2 sentences). Publications in numbered APA/MLA citation format. Teaching, Service, Skills follow. Text-dense, Georgia/Palatino serif typography.' },
  { slug:'twenty-seconds', name:'Twenty Seconds', category:'Academic', style:'Quick-Read Sidebar', layout:'sidebar', description:'Communicates your profile in 20 seconds. Sidebar with visual skill progress bars.', accentColor:'#009688', headerBg:'#009688', sidebarBg:'#009688', headerText:'#ffffff', featured:false, tags:['sidebar','skill-bars','teal','quick-read'], promptStyle:'TWENTY-SECONDS CV STYLE: Teal (#009688) left sidebar — circular photo placeholder at top, name white bold, "About Me" 2-3 sentence blurb, then SKILLS with visual progress bar per skill (CSS width bar showing percentage), Languages with similar bars. Right area: white background, Experience (most space), Education, other sections. Teal markers on entries. The sidebar makes this scannable in 20 seconds. Roboto font.' },
  { slug:'mediterranean-blue', name:'Mediterranean Blue', category:'Academic', style:'European Academic', layout:'single', description:'Elegant European-style academic CV with structured blue accents.', accentColor:'#1565C0', headerBg:'#ffffff', sidebarBg:null, headerText:'#1565C0', featured:false, tags:['european','academic','blue','elegant'], promptStyle:'MEDITERRANEAN BLUE STYLE: Large name in deep blue (#1565C0), contact info in blue. Each section has a blue left accent border (4px solid #1565C0 on section header). Alternating subtle background tints (white / #F3F6FB) per section for readability. Structured table-like layout for dates/institutions. Book Antiqua/Palatino serif. Elegant European academic feel.' },

  // ── Executive ─────────────────────────────────────────────────────────────
  { slug:'premium-executive', name:'Premium Executive', category:'Executive', style:'Luxury Executive', layout:'single', description:'Sophisticated dark design with gold accents for C-level executives and board members.', accentColor:'#D4AF37', headerBg:'#1C2833', sidebarBg:null, headerText:'#ffffff', featured:true, tags:['executive','gold','dark','luxury','ceo'], promptStyle:'PREMIUM EXECUTIVE STYLE: Very dark navy (#1C2833) header — name large white serif, gold (#D4AF37) horizontal rule below name, job title in gold italic. Body: white background, dark navy section titles, gold decorative elements. Executive Summary first (2-3 impactful sentences). Experience shows board/P&L language. Key Achievements highlighted in gold-bordered box. Skills as elegant text list. Playfair Display/EB Garamond serif.' },
  { slug:'leadership-bold', name:'Leadership Bold', category:'Executive', style:'Leadership Profile', layout:'single', description:'Designed for VP, Director, and executive roles with leadership achievement focus.', accentColor:'#B7410E', headerBg:'#B7410E', sidebarBg:null, headerText:'#ffffff', featured:false, tags:['leadership','executive','rust','director','vp'], promptStyle:'LEADERSHIP BOLD STYLE: Burnt orange/rust (#B7410E) bold header, white name serif, white job title. "Executive Profile" summary first — 3 impactful leadership sentences. "Core Competencies" section: 3-column grid of 9-12 leadership skills in bordered cells. Experience shows P&L/team/budget scope prominently. Achievements quantified: "Led 200-person organization, $50M budget". Rust left-border section headers. Crimson Text/Libre Baskerville serif.' },
  { slug:'csuite-minimal', name:'C-Suite Minimal', category:'Executive', style:'Ultra Premium', layout:'single', description:'Ultra-minimal luxury design where every word earns its place. For CEOs and board level.', accentColor:'#2C2C2C', headerBg:'#ffffff', sidebarBg:null, headerText:'#2C2C2C', featured:false, tags:['ceo','minimal','ultra-premium','board'], promptStyle:'C-SUITE MINIMAL STYLE: Completely white background. Name in MASSIVE thin/light-weight black font (editorial large, almost full page width). Single thin black horizontal line below name. Contact in tiny gray text, minimal. ALL section headers: thin all-caps with extreme letter-spacing. Maximum whitespace — each section breathes. Content extremely selective: only major milestones, board roles, major exits. No skill lists — only impact statements. Cormorant Garamond / Didact Gothic. Truly premium.' },
]

app.get('/api/resume-templates', async (req, res) => {
  try {
    const query = {}
    if (req.query.category) query.category = req.query.category
    if (req.query.featured === 'true') query.featured = true
    const docs = await col('resumeTemplates').find(query).sort({ featured: -1, createdAt: 1 }).toArray()
    res.json(docs.map(normalize))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

app.post('/api/resume-templates/seed', async (req, res) => {
  try {
    const existing = await col('resumeTemplates').countDocuments()
    if (existing > 0 && !req.query.force) {
      return res.json({ message: `Already seeded (${existing} templates). Use ?force=true to re-seed.`, count: existing })
    }
    if (req.query.force) await col('resumeTemplates').deleteMany({})
    const docs = RESUME_TEMPLATE_SEED.map(t => ({ ...t, createdAt: new Date() }))
    await col('resumeTemplates').insertMany(docs)
    await col('resumeTemplates').createIndex({ category: 1 })
    await col('resumeTemplates').createIndex({ slug: 1 }, { unique: true })
    res.json({ message: `Seeded ${docs.length} resume templates`, count: docs.length })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default app
