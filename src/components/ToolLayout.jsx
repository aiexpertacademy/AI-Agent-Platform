import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ToolLayout({ icon: Icon, title, description, color, children }) {
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
