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
  Phone,
  Zap,
} from 'lucide-react'
import { useCredits } from '../contexts/CreditContext'

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
  { to: '/tools/whatsapp-chatbot', icon: Phone, label: 'WhatsApp Chatbot' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { coins, plan, planLimit } = useCredits()
  const usedPct = Math.min(100, Math.round(((planLimit - coins) / planLimit) * 100))

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-800">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-indigo-600">
          <img
            src="/logo.png"
            alt="AI Expert Academy"
            className="w-full h-full object-contain"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <Bot className="w-5 h-5 text-white hidden" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-bold text-white leading-tight block truncate">AI Expert Academy</span>
          <span className="text-xs text-indigo-400 leading-tight">AI Platform</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Coin balance + plan */}
      <div className="px-4 py-4 border-t border-gray-800 space-y-3">
        {/* Coin balance card */}
        <div className="px-3 py-3 rounded-xl bg-gradient-to-r from-yellow-600/15 to-orange-600/15 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-300">{coins.toLocaleString()} Coins</span>
            </div>
            <span className="text-xs text-gray-500 capitalize">{plan}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${100 - usedPct}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{coins} / {planLimit} remaining</p>
        </div>

        {/* Plan badge */}
        <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
          <p className="text-xs font-medium text-indigo-300 capitalize">{plan} Plan</p>
          <p className="text-xs text-gray-400 mt-0.5">Unlimited access</p>
        </div>
      </div>
    </aside>
  )
}
