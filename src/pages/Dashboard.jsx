import { useState, useMemo } from 'react'
import {
  MessageSquare, Image, Code, FileText, Database, Mic, Video, Globe, Shield, Zap,
  Brain, PenTool, BarChart3, Search, Mail, Workflow, Bug, Languages, Compass, Wand2,
  Hexagon, Sparkles, Layout, Terminal, Newspaper, TrendingUp, ShieldAlert, ScanEye,
  Megaphone, Film, Cpu, Layers, Phone, Filter, Star, Clock, ArrowRight,
} from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = [
  { id: 'all', label: 'All Tools' },
  { id: 'content', label: 'Content & Writing' },
  { id: 'image', label: 'Image & Design' },
  { id: 'code', label: 'Code & Dev' },
  { id: 'analysis', label: 'Analysis & Research' },
  { id: 'voice', label: 'Voice & Video' },
  { id: 'business', label: 'Business & Marketing' },
]

const tools = [
  { icon: MessageSquare, title: 'AI Chatbot', description: 'Conversational AI assistant for general-purpose Q&A and brainstorming.', color: '#6366f1', path: '/tools/chatbot', category: 'content' },
  { icon: Image, title: 'Image Generator', description: 'Create stunning images from text prompts using diffusion models.', color: '#ec4899', path: '/tools/image-generator', category: 'image' },
  { icon: Code, title: 'Code Assistant', description: 'Write, debug, and refactor code with AI-powered suggestions.', color: '#10b981', path: '/tools/code-assistant', category: 'code' },
  { icon: FileText, title: 'Doc Summarizer', description: 'Extract key insights and summaries from long documents.', color: '#f59e0b', path: '/tools/doc-summarizer', category: 'content' },
  { icon: Database, title: 'Data Analyzer', description: 'Upload datasets and get instant visual analytics and insights.', color: '#8b5cf6', path: '/tools/data-analyzer', category: 'analysis' },
  { icon: Mic, title: 'Speech to Text', description: 'Transcribe audio files and live speech with high accuracy.', color: '#ef4444', path: '/tools/speech-to-text', category: 'voice' },
  { icon: Video, title: 'Video Generator', description: 'Generate short video clips from text descriptions and scripts.', color: '#14b8a6', path: '/tools/video-generator', category: 'voice' },
  { icon: Globe, title: 'Web Scraper', description: 'Extract structured data from any website automatically.', color: '#06b6d4', path: '/tools/web-scraper', category: 'code' },
  { icon: Shield, title: 'Content Moderator', description: 'Detect and filter harmful or inappropriate content.', color: '#f97316', path: '/tools/content-moderator', category: 'analysis' },
  { icon: Zap, title: 'Automation Builder', description: 'Create automated workflows connecting multiple AI tools.', color: '#eab308', path: '/tools/automation-builder', category: 'business' },
  { icon: Brain, title: 'Knowledge Base', description: 'Build and query a custom AI knowledge base from your docs.', color: '#a855f7', path: '/tools/knowledge-base', category: 'analysis' },
  { icon: PenTool, title: 'Content Writer', description: 'Generate blog posts, emails, and marketing copy.', color: '#3b82f6', path: '/tools/content-writer', category: 'content' },
  { icon: BarChart3, title: 'SEO Optimizer', description: 'Analyze and optimize content for search engine rankings.', color: '#22c55e', path: '/tools/seo-optimizer', category: 'business' },
  { icon: Search, title: 'Research Agent', description: 'Deep-dive research on any topic with sourced citations.', color: '#64748b', path: '/tools/research-agent', category: 'analysis' },
  { icon: Mail, title: 'Email Composer', description: 'Draft professional emails with context-aware AI suggestions.', color: '#e11d48', path: '/tools/email-composer', category: 'business' },
  { icon: Workflow, title: 'API Connector', description: 'Integrate external APIs and build custom data pipelines.', color: '#0ea5e9', path: '/tools/api-connector', category: 'code' },
  { icon: Bug, title: 'Bug Detective', description: 'Analyze error logs and stack traces to pinpoint root causes.', color: '#dc2626', path: '/tools/bug-detective', category: 'code' },
  { icon: Languages, title: 'Translator', description: 'Translate text between 100+ languages with natural fluency.', color: '#7c3aed', path: '/tools/translator', category: 'content' },
  { icon: Compass, title: 'Career Advisor', description: 'Get a personalized AI career roadmap with skills and job targets.', color: '#f59e0b', path: '/tools/career-advisor', category: 'business' },
  { icon: Wand2, title: 'Prompt Generator', description: 'Generate optimized prompts for Midjourney, DALL-E, Sora & more.', color: '#8b5cf6', path: '/tools/prompt-generator', category: 'content' },
  { icon: Hexagon, title: 'Logo Generator', description: 'AI-powered brand logo design with SVG, images & design brief.', color: '#f97316', path: '/tools/logo-generator', category: 'image' },
  { icon: Sparkles, title: 'Anime Art Maker', description: 'Transform photos or descriptions into stunning anime art.', color: '#e879f9', path: '/tools/anime-art-maker', category: 'image' },
  { icon: Layout, title: 'App UI/UX Designer', description: 'Generate wireframes, color palettes, components & Figma prompts.', color: '#06b6d4', path: '/tools/app-ui-designer', category: 'image' },
  { icon: Terminal, title: 'App Code Generator', description: 'Generate full app boilerplate with file structure & setup guide.', color: '#22c55e', path: '/tools/app-code-generator', category: 'code' },
  { icon: Globe, title: 'Web Designer', description: 'Generate complete websites with live preview & instant download.', color: '#6366f1', path: '/tools/web-designer', category: 'code' },
  { icon: Newspaper, title: 'Latest News', description: 'AI-summarized Indian & international news from the last 24 hours.', color: '#ef4444', path: '/tools/latest-news', category: 'analysis' },
  { icon: TrendingUp, title: 'AI Trend Analyst', description: 'Industry trend analysis with stats, predictions & PDF export.', color: '#8b5cf6', path: '/tools/trend-analyst', category: 'analysis' },
  { icon: ShieldAlert, title: 'Fake News Detector', description: 'AI credibility analysis with fact-checks, bias & fallacy detection.', color: '#ef4444', path: '/tools/fake-news-detector', category: 'analysis' },
  { icon: ScanEye, title: 'Instagram Spam Detector', description: 'Detect spam, bots & deception in Instagram comments and bios.', color: '#e11d48', path: '/tools/spam-detector', category: 'analysis' },
  { icon: Megaphone, title: 'AI Ad Generator', description: 'Generate complete ads with AI copy, design brief & live preview.', color: '#f43f5e', path: '/tools/ad-generator', category: 'business' },
  { icon: Film, title: 'AI Ad Video Generator', description: 'Generate stunning ad videos with AI using templates & Veo 3.1.', color: '#14b8a6', path: '/tools/ad-video-generator', category: 'voice' },
  { icon: Phone, title: 'WhatsApp AI Chatbot', description: 'Build & deploy AI-powered WhatsApp bots for your business — no code required.', color: '#25D366', path: '/tools/whatsapp-chatbot', category: 'business' },
]

const featured = ['AI Chatbot', 'Image Generator', 'Web Designer', 'App Code Generator', 'AI Trend Analyst', 'WhatsApp AI Chatbot']

const stats = [
  { icon: Cpu, label: 'AI Models', value: '12+', color: '#6366f1' },
  { icon: Layers, label: 'Tools', value: `${tools.length}`, color: '#ec4899' },
  { icon: Zap, label: 'Generation', value: 'Real-time', color: '#f59e0b' },
  { icon: Star, label: 'Powered by', value: 'Gemini 2.5', color: '#22c55e' },
]

export default function Dashboard() {
  const { currentUser } = useAuth()
  const firstName = currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'there'
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = useMemo(() => {
    let list = tools
    if (activeCategory !== 'all') list = list.filter(t => t.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    return list
  }, [search, activeCategory])

  const featuredTools = tools.filter(t => featured.includes(t.title))

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-7"
        style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #13111f 40%, #0d1117 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 0 80px rgba(99,102,241,0.08)',
        }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-24 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', transform: 'translateY(40%)' }} />
        <div className="absolute top-6 left-1/3 w-96 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome back,{' '}
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {firstName}
            </span>{' '}👋
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {tools.length} AI-powered tools at your fingertips — all running on Gemini 2.5 Flash
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-bold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured tools */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-white">Featured Tools</h2>
          <span className="text-xs text-gray-600">— most popular</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredTools.map(tool => {
            const Icon = tool.icon
            return (
              <a key={tool.title} href={tool.path}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-[1.04] hover:shadow-lg"
                style={{ background: `${tool.color}10`, border: `1px solid ${tool.color}25` }}
                onClick={e => { e.preventDefault(); window.location.href = tool.path }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${tool.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: tool.color }} />
                </div>
                <span className="text-xs font-medium text-gray-300 leading-tight group-hover:text-white transition-colors">{tool.title}</span>
              </a>
            )
          })}
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 cursor-pointer">
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(search || activeCategory !== 'all') && (
        <p className="text-xs text-gray-600 -mt-4">
          Showing {filtered.length} of {tools.length} tools
          {search && <> matching "<span className="text-gray-400">{search}</span>"</>}
        </p>
      )}

      {/* Tools grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium mb-1">No tools found</p>
          <p className="text-gray-600 text-sm mb-4">Try a different search term or category</p>
          <button onClick={() => { setSearch(''); setActiveCategory('all') }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg cursor-pointer transition-colors">
            <ArrowRight className="w-3.5 h-3.5" /> Show all tools
          </button>
        </div>
      )}
    </div>
  )
}
