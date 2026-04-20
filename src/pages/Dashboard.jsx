import {
  MessageSquare,
  Image,
  Code,
  FileText,
  Database,
  Mic,
  Video,
  Globe,
  Shield,
  Zap,
  Brain,
  PenTool,
  BarChart3,
  Search,
  Mail,
  Workflow,
  Bug,
  Languages,
  Compass,
  Wand2,
  Hexagon,
  Sparkles,
  Layout,
  Terminal,
  Newspaper,
  TrendingUp,
  ShieldAlert,
  ScanEye,
  Megaphone,
  Film,
  Cpu,
  Layers,
  Activity,
} from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { useAuth } from '../contexts/AuthContext'

const tools = [
  { icon: MessageSquare, title: 'AI Chatbot', description: 'Conversational AI assistant for general-purpose Q&A and brainstorming.', color: '#6366f1', path: '/tools/chatbot' },
  { icon: Image, title: 'Image Generator', description: 'Create stunning images from text prompts using diffusion models.', color: '#ec4899', path: '/tools/image-generator' },
  { icon: Code, title: 'Code Assistant', description: 'Write, debug, and refactor code with AI-powered suggestions.', color: '#10b981', path: '/tools/code-assistant' },
  { icon: FileText, title: 'Doc Summarizer', description: 'Extract key insights and summaries from long documents.', color: '#f59e0b', path: '/tools/doc-summarizer' },
  { icon: Database, title: 'Data Analyzer', description: 'Upload datasets and get instant visual analytics and insights.', color: '#8b5cf6', path: '/tools/data-analyzer' },
  { icon: Mic, title: 'Speech to Text', description: 'Transcribe audio files and live speech with high accuracy.', color: '#ef4444', path: '/tools/speech-to-text' },
  { icon: Video, title: 'Video Generator', description: 'Generate short video clips from text descriptions and scripts.', color: '#14b8a6', path: '/tools/video-generator' },
  { icon: Globe, title: 'Web Scraper', description: 'Extract structured data from any website automatically.', color: '#06b6d4', path: '/tools/web-scraper' },
  { icon: Shield, title: 'Content Moderator', description: 'Detect and filter harmful or inappropriate content.', color: '#f97316', path: '/tools/content-moderator' },
  { icon: Zap, title: 'Automation Builder', description: 'Create automated workflows connecting multiple AI tools.', color: '#eab308', path: '/tools/automation-builder' },
  { icon: Brain, title: 'Knowledge Base', description: 'Build and query a custom AI knowledge base from your docs.', color: '#a855f7', path: '/tools/knowledge-base' },
  { icon: PenTool, title: 'Content Writer', description: 'Generate blog posts, emails, and marketing copy.', color: '#3b82f6', path: '/tools/content-writer' },
  { icon: BarChart3, title: 'SEO Optimizer', description: 'Analyze and optimize content for search engine rankings.', color: '#22c55e', path: '/tools/seo-optimizer' },
  { icon: Search, title: 'Research Agent', description: 'Deep-dive research on any topic with sourced citations.', color: '#64748b', path: '/tools/research-agent' },
  { icon: Mail, title: 'Email Composer', description: 'Draft professional emails with context-aware AI suggestions.', color: '#e11d48', path: '/tools/email-composer' },
  { icon: Workflow, title: 'API Connector', description: 'Integrate external APIs and build custom data pipelines.', color: '#0ea5e9', path: '/tools/api-connector' },
  { icon: Bug, title: 'Bug Detective', description: 'Analyze error logs and stack traces to pinpoint root causes.', color: '#dc2626', path: '/tools/bug-detective' },
  { icon: Languages, title: 'Translator', description: 'Translate text between 100+ languages with natural fluency.', color: '#7c3aed', path: '/tools/translator' },
  { icon: Compass, title: 'Career Advisor', description: 'Get a personalized AI career roadmap with skills and job targets.', color: '#f59e0b', path: '/tools/career-advisor' },
  { icon: Wand2, title: 'Prompt Generator', description: 'Generate optimized prompts for Midjourney, DALL-E, Sora & more.', color: '#8b5cf6', path: '/tools/prompt-generator' },
  { icon: Hexagon, title: 'Logo Generator', description: 'AI-powered brand logo design with SVG, images & design brief.', color: '#f97316', path: '/tools/logo-generator' },
  { icon: Sparkles, title: 'Anime Art Maker', description: 'Transform photos or descriptions into stunning anime art.', color: '#e879f9', path: '/tools/anime-art-maker' },
  { icon: Layout, title: 'App UI/UX Designer', description: 'Generate wireframes, color palettes, components & Figma prompts.', color: '#06b6d4', path: '/tools/app-ui-designer' },
  { icon: Terminal, title: 'App Code Generator', description: 'Generate full app boilerplate with file structure & setup guide.', color: '#22c55e', path: '/tools/app-code-generator' },
  { icon: Globe, title: 'Web Designer', description: 'Generate complete websites with live preview & instant download.', color: '#6366f1', path: '/tools/web-designer' },
  { icon: Newspaper, title: 'Latest News', description: 'AI-summarized Indian & international news from the last 24 hours.', color: '#ef4444', path: '/tools/latest-news' },
  { icon: TrendingUp, title: 'AI Trend Analyst', description: 'Industry trend analysis with stats, predictions & PDF export.', color: '#8b5cf6', path: '/tools/trend-analyst' },
  { icon: ShieldAlert, title: 'Fake News Detector', description: 'AI credibility analysis with fact-checks, bias & fallacy detection.', color: '#ef4444', path: '/tools/fake-news-detector' },
  { icon: ScanEye, title: 'Instagram Spam Detector', description: 'Detect spam, bots & deception in Instagram comments and bios.', color: '#e11d48', path: '/tools/spam-detector' },
  { icon: Megaphone, title: 'AI Ad Generator', description: 'Generate complete ads with AI copy, design brief & live preview.', color: '#f43f5e', path: '/tools/ad-generator' },
  { icon: Film, title: 'AI Ad Video Generator', description: 'Generate stunning ad videos with AI using templates & Veo 3.1.', color: '#14b8a6', path: '/tools/ad-video-generator' },
]

const stats = [
  { icon: Cpu, label: 'AI Models', value: '12+', color: '#6366f1' },
  { icon: Layers, label: 'Tools Available', value: '31', color: '#ec4899' },
  { icon: Activity, label: 'Powered by', value: 'Gemini', color: '#10b981' },
  { icon: Zap, label: 'Generation', value: 'Real-time', color: '#f59e0b' },
]

export default function Dashboard() {
  const { currentUser } = useAuth()
  const firstName = currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'there'

  return (
    <div>
      {/* Hero header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden p-7"
        style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #13111f 40%, #0d1117 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 0 60px rgba(99,102,241,0.07)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)', transform: 'translateY(40%)' }} />
        <div className="absolute top-4 left-1/2 w-96 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, <span style={{
              background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{firstName}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm">Choose from {tools.length} AI-powered tools below — all running on Gemini</p>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-3 mt-5">
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

      {/* Tools grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </div>
  )
}
