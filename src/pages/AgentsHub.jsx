import {
  MessageSquare,
  Search,
  Compass,
  Brain,
  Zap,
  Workflow,
  Mail,
  Bot,
} from 'lucide-react'
import ToolCard from '../components/ToolCard'
import HubHeader from '../components/HubHeader'

const agents = [
  { icon: MessageSquare, title: 'AI Chatbot', description: 'Conversational AI assistant for general-purpose Q&A and brainstorming.', color: '#6366f1', path: '/tools/chatbot' },
  { icon: Search, title: 'Research Agent', description: 'Deep-dive research on any topic with sourced citations.', color: '#64748b', path: '/tools/research-agent' },
  { icon: Compass, title: 'Career Advisor', description: 'Get a personalized AI career roadmap with skills and job targets.', color: '#f59e0b', path: '/tools/career-advisor' },
  { icon: Brain, title: 'Knowledge Base', description: 'Build and query a custom AI knowledge base from your docs.', color: '#a855f7', path: '/tools/knowledge-base' },
  { icon: Zap, title: 'Automation Builder', description: 'Create automated workflows connecting multiple AI tools.', color: '#eab308', path: '/tools/automation-builder' },
  { icon: Workflow, title: 'API Connector', description: 'Integrate external APIs and build custom data pipelines.', color: '#0ea5e9', path: '/tools/api-connector' },
  { icon: Mail, title: 'Email Composer', description: 'Draft professional emails with context-aware AI suggestions.', color: '#e11d48', path: '/tools/email-composer' },
]

export default function AgentsHub() {
  return (
    <div>
      <HubHeader
        icon={Bot}
        title="AI Agents"
        subtitle="Autonomous agents for research, automation, and intelligent assistance"
        color="#6366f1"
        count={agents.length}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </div>
  )
}
