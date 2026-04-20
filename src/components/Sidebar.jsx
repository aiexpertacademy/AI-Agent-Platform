import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Image,
  Code,
  FileText,
  FileEdit,
  Database,
  Settings,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Bot, label: 'AI Agents' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/resume-builder', icon: FileEdit, label: 'Resume Builder' },
  { to: '/images', icon: Image, label: 'Image Gen' },
  { to: '/code', icon: Code, label: 'Code Tools' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/data', icon: Database, label: 'Data' },
  { to: '/playground', icon: Sparkles, label: 'Playground' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-20">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-800">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">AI Platform</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
          <p className="text-xs font-medium text-indigo-300">Pro Plan</p>
          <p className="text-xs text-gray-400 mt-0.5">Unlimited access</p>
        </div>
      </div>
    </aside>
  )
}
