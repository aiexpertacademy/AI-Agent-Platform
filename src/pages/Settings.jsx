import { useState } from 'react'
import {
  User, Zap, Palette, Bell, Shield,
  Save, Check, RefreshCw, TrendingUp,
  TrendingDown, Sun, Moon, Zap, Crown, Star, Plus, Trash2,
  Upload, Mail, Lock, Globe, AlertTriangle, CheckCircle,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCredits } from '../contexts/CreditContext'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'credits', label: 'Credits & Coins', icon: Zap },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
]

const COIN_PACKS = [
  { coins: 100, price: '₹99', badge: null },
  { coins: 500, price: '₹399', badge: 'Popular' },
  { coins: 1500, price: '₹999', badge: 'Best Value' },
  { coins: 5000, price: '₹2999', badge: null },
]

const PLANS = [
  { id: 'free', label: 'Free', price: '₹0/mo', coins: 100, color: '#6b7280', features: ['100 coins/month', '5 tools', 'Community support'] },
  { id: 'pro', label: 'Pro', price: '₹999/mo', coins: 2000, color: '#6366f1', features: ['2,000 coins/month', 'All 32 tools', 'Priority support', 'API access'] },
  { id: 'enterprise', label: 'Enterprise', price: '₹4,999/mo', coins: 10000, color: '#f59e0b', features: ['10,000 coins/month', 'Custom models', 'Dedicated support', 'White-label', 'Team management'] },
]

function SectionCard({ children }) {
  return <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">{children}</div>
}

function SectionTitle({ icon: Icon, title, desc, color = '#6366f1' }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

function ProfileSection({ currentUser }) {
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
  const [saved, setSaved] = useState(false)
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const initials = (displayName || currentUser?.email || 'U').charAt(0).toUpperCase()
  return (
    <SectionCard>
      <SectionTitle icon={User} title="Profile" desc="Manage your account information" color="#6366f1" />
      <div className="flex items-center gap-4 mb-6">
        {currentUser?.photoURL ? (
          <img src={currentUser.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">{initials}</div>
        )}
        <div>
          <p className="text-sm font-semibold text-white">{currentUser?.displayName || 'No name set'}</p>
          <p className="text-xs text-gray-500">{currentUser?.email}</p>
          <p className="text-xs text-indigo-400 mt-1">Joined via Google OAuth</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Display Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
          <input readOnly value={currentUser?.email || ''} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
          <p className="text-xs text-gray-600 mt-1">Email is managed by your Google account</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
          {saved ? <><CheckCircle className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Changes</>}
        </button>
      </div>
    </SectionCard>
  )
}

function CreditsSection() {
  const { coins, plan, setPlan, history, addCoins, planLimit } = useCredits()
  const [purchasing, setPurchasing] = useState(null)

  function handlePurchase(pack) {
    setPurchasing(pack.coins)
    setTimeout(() => {
      addCoins(pack.coins, `Purchased ${pack.coins} coin pack`)
      setPurchasing(null)
    }, 1500)
  }

  const usedPct = Math.min(100, Math.round(((planLimit - coins) / planLimit) * 100))

  return (
    <div className="space-y-5">
      <SectionCard>
        <SectionTitle icon={Zap} title="Credits & Coins" desc="Your AI usage balance and transaction history" color="#f59e0b" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-yellow-500/20">
            <p className="text-2xl font-bold text-yellow-400">{coins.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Available Coins</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-400">{planLimit.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Monthly Limit</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{usedPct}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Used This Month</p>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">Balance</span>
          <span className="text-xs text-gray-400">{coins} / {planLimit} coins</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden mb-6">
          <div className="h-2.5 rounded-full transition-all" style={{ width: `${100 - usedPct}%`, background: 'linear-gradient(90deg,#f59e0b,#f97316)' }} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 mb-3">Buy Coins</p>
          <div className="grid grid-cols-2 gap-3">
            {COIN_PACKS.map(pack => (
              <button key={pack.coins} onClick={() => handlePurchase(pack)}
                disabled={purchasing === pack.coins}
                className="relative flex flex-col items-center gap-1 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-yellow-500/40 rounded-xl transition-all">
                {pack.badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-500 text-black">{pack.badge}</span>}
                {purchasing === pack.coins ? (
                  <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                ) : (
                  <span className="text-lg font-bold text-yellow-400">+{pack.coins.toLocaleString()}</span>
                )}
                <span className="text-xs text-gray-400">{pack.price}</span>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Crown} title="Plans" desc="Upgrade for more coins and features" color="#6366f1" />
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map(p => (
            <div key={p.id} onClick={() => setPlan(p.id)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${plan === p.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'}`}>
              {plan === p.id && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
              <div className="w-6 h-6 rounded-lg mb-2 flex items-center justify-center" style={{ background: `${p.color}30` }}>
                <Star className="w-3.5 h-3.5" style={{ color: p.color }} />
              </div>
              <p className="text-sm font-bold text-white">{p.label}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: p.color }}>{p.price}</p>
              <ul className="mt-3 space-y-1">
                {p.features.map(f => <li key={f} className="text-xs text-gray-500 flex items-center gap-1"><Check className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={TrendingUp} title="Transaction History" desc="Recent coin activity" color="#10b981" />
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {history.map(h => (
            <div key={h.id} className="flex items-center gap-3 py-2 border-b border-gray-800">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${h.type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {h.type === 'credit' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white">{h.desc}</p>
                <p className="text-xs text-gray-600">{h.date}</p>
              </div>
              <span className={`text-sm font-semibold ${h.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                {h.type === 'credit' ? '+' : ''}{h.amount}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function AppearanceSection({ isDark, toggleTheme }) {
  return (
    <SectionCard>
      <SectionTitle icon={Palette} title="Appearance" desc="Customize the look and feel of the platform" color="#ec4899" />
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-white mb-3">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Easy on the eyes at night' },
              { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean and bright interface' },
            ].map(t => (
              <div key={t.id} onClick={() => t.id !== (isDark ? 'dark' : 'light') && toggleTheme()}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${(isDark ? 'dark' : 'light') === t.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-gray-700 hover:border-gray-600'}`}>
                <t.icon className="w-5 h-5 text-gray-300" />
                <div>
                  <p className="text-sm font-medium text-white">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
                {(isDark ? 'dark' : 'light') === t.id && <Check className="w-4 h-4 text-indigo-400 ml-auto" />}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-white mb-3">Language</p>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option>English (Default)</option>
            <option>Hindi</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Compact Mode</p>
            <p className="text-xs text-gray-500">Reduce spacing for more content</p>
          </div>
          <button className="relative w-11 h-6 rounded-full bg-gray-700 transition-colors">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    email_updates: true,
    email_weekly: false,
    browser_push: true,
    credit_low: true,
    new_tools: true,
    maintenance: false,
  })
  function toggle(k) { setNotifs(n => ({ ...n, [k]: !n[k] })) }

  const items = [
    { key: 'email_updates', label: 'Product Updates', desc: 'New features and improvements', group: 'Email' },
    { key: 'email_weekly', label: 'Weekly Digest', desc: 'Summary of your AI activity', group: 'Email' },
    { key: 'browser_push', label: 'Browser Notifications', desc: 'In-app alerts and reminders', group: 'Push' },
    { key: 'credit_low', label: 'Low Balance Alert', desc: 'Notify when coins drop below 50', group: 'Push' },
    { key: 'new_tools', label: 'New Tools Launch', desc: 'When new AI tools are added', group: 'Both' },
    { key: 'maintenance', label: 'Maintenance Alerts', desc: 'Scheduled downtime notices', group: 'Both' },
  ]

  return (
    <SectionCard>
      <SectionTitle icon={Bell} title="Notifications" desc="Control which alerts you receive" color="#f59e0b" />
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-800">
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <button onClick={() => toggle(item.key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${notifs[item.key] ? 'bg-indigo-600' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifs[item.key] ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function SecuritySection({ currentUser }) {
  const [sessions] = useState([
    { device: 'Chrome on Windows', location: 'Mumbai, India', time: 'Active now', current: true },
    { device: 'Safari on iPhone', location: 'Delhi, India', time: '2 hours ago', current: false },
  ])

  return (
    <div className="space-y-5">
      <SectionCard>
        <SectionTitle icon={Shield} title="Security" desc="Protect your account" color="#ef4444" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-4.5 h-4.5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Google Sign-In</p>
                <p className="text-xs text-gray-500">Your account is secured with Google OAuth</p>
              </div>
            </div>
            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Lock className="w-4.5 h-4.5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Add an extra layer of security</p>
              </div>
            </div>
            <button className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors">Enable</button>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Globe} title="Active Sessions" desc="Manage where you're signed in" color="#8b5cf6" />
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{s.device}</p>
                <p className="text-xs text-gray-500">{s.location} · {s.time}</p>
              </div>
              {s.current ? (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">This device</span>
              ) : (
                <button className="text-xs text-red-400 hover:text-red-300 transition-colors">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={AlertTriangle} title="Danger Zone" desc="Irreversible account actions" color="#ef4444" />
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
            <div>
              <p className="text-sm font-medium text-red-400">Delete All Data</p>
              <p className="text-xs text-gray-500">Remove all your generated content and history</p>
            </div>
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
            <div>
              <p className="text-sm font-medium text-red-400">Delete Account</p>
              <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

export default function Settings() {
  const { currentUser } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [active, setActive] = useState('profile')

  const content = {
    profile: <ProfileSection currentUser={currentUser} />,

    credits: <CreditsSection />,
    appearance: <AppearanceSection isDark={isDark} toggleTheme={toggleTheme} />,
    notifications: <NotificationsSection />,
    security: <SecuritySection currentUser={currentUser} />,
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account, API keys, credits, and preferences</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-52 flex-shrink-0">
          <nav className="bg-gray-900 border border-gray-800 rounded-2xl p-2 space-y-0.5 sticky top-6">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active === id ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{content[active]}</div>
      </div>
    </div>
  )
}
