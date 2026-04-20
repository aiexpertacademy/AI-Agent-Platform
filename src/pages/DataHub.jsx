import { Database, Globe, Search, Newspaper, TrendingUp, ShieldAlert, ScanEye, DatabaseZap } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import HubHeader from '../components/HubHeader'

const tools = [
  { icon: Database, title: 'Data Analyzer', description: 'Upload datasets and get instant visual analytics and insights.', color: '#8b5cf6', path: '/tools/data-analyzer' },
  { icon: Globe, title: 'Web Scraper', description: 'Extract structured data from any website automatically.', color: '#06b6d4', path: '/tools/web-scraper' },
  { icon: Search, title: 'Research Agent', description: 'Deep-dive research on any topic with sourced citations.', color: '#64748b', path: '/tools/research-agent' },
  { icon: Newspaper, title: 'Latest News', description: 'AI-summarized Indian & international news from the last 24 hours.', color: '#ef4444', path: '/tools/latest-news' },
  { icon: TrendingUp, title: 'AI Trend Analyst', description: 'Industry trend analysis with stats, predictions & PDF export.', color: '#8b5cf6', path: '/tools/trend-analyst' },
  { icon: ShieldAlert, title: 'Fake News Detector', description: 'AI credibility analysis with fact-checks, bias & fallacy detection.', color: '#ef4444', path: '/tools/fake-news-detector' },
  { icon: ScanEye, title: 'Instagram Spam Detector', description: 'Detect spam, bots & deception in Instagram comments and bios.', color: '#e11d48', path: '/tools/spam-detector' },
]

export default function DataHub() {
  return (
    <div>
      <HubHeader
        icon={DatabaseZap}
        title="Data & Intelligence"
        subtitle="Analyze datasets, scrape the web, and extract real-world intelligence"
        color="#8b5cf6"
        count={tools.length}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </div>
  )
}
