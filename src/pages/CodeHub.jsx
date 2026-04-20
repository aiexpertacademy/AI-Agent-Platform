import { Code, Bug, Terminal, Globe, Code2 } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import HubHeader from '../components/HubHeader'

const tools = [
  { icon: Code, title: 'Code Assistant', description: 'Write, debug, and refactor code with AI-powered suggestions.', color: '#10b981', path: '/tools/code-assistant' },
  { icon: Bug, title: 'Bug Detective', description: 'Analyze error logs and stack traces to pinpoint root causes.', color: '#dc2626', path: '/tools/bug-detective' },
  { icon: Terminal, title: 'App Code Generator', description: 'Generate full app boilerplate with file structure & setup guide.', color: '#22c55e', path: '/tools/app-code-generator' },
  { icon: Globe, title: 'Web Designer', description: 'Generate complete websites with live preview & instant download.', color: '#6366f1', path: '/tools/web-designer' },
]

export default function CodeHub() {
  return (
    <div>
      <HubHeader
        icon={Code2}
        title="Code Tools"
        subtitle="AI-powered tools to write, debug, and generate code faster"
        color="#10b981"
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
