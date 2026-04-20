import { FileText, PenTool, BarChart3, Mail, Brain, Languages, FileEdit } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import HubHeader from '../components/HubHeader'

const tools = [
  { icon: FileText, title: 'Doc Summarizer', description: 'Extract key insights and summaries from long documents.', color: '#f59e0b', path: '/tools/doc-summarizer' },
  { icon: PenTool, title: 'Content Writer', description: 'Generate blog posts, emails, and marketing copy.', color: '#3b82f6', path: '/tools/content-writer' },
  { icon: BarChart3, title: 'SEO Optimizer', description: 'Analyze and optimize content for search engine rankings.', color: '#22c55e', path: '/tools/seo-optimizer' },
  { icon: Mail, title: 'Email Composer', description: 'Draft professional emails with context-aware AI suggestions.', color: '#e11d48', path: '/tools/email-composer' },
  { icon: Brain, title: 'Knowledge Base', description: 'Build and query a custom AI knowledge base from your docs.', color: '#a855f7', path: '/tools/knowledge-base' },
  { icon: Languages, title: 'Translator', description: 'Translate text between 100+ languages with natural fluency.', color: '#7c3aed', path: '/tools/translator' },
]

export default function DocumentsHub() {
  return (
    <div>
      <HubHeader
        icon={FileEdit}
        title="Documents"
        subtitle="Summarize, write, translate, and optimize your documents with AI"
        color="#f59e0b"
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
