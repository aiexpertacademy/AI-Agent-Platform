import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, ChevronDown, Search, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'
  const photoURL = currentUser?.photoURL

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search tools..."
          className="bg-transparent text-gray-300 placeholder-gray-500 text-sm focus:outline-none w-full"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer mr-2"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors cursor-pointer"
        >
          {photoURL ? (
            <img src={photoURL} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-sm text-gray-300 hidden sm:block">{displayName}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2">
            <div className="px-4 py-2 border-b border-gray-800">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
