import { useNavigate } from 'react-router-dom'

export default function ToolCard({ icon: Icon, title, description, color, path }) {
  const navigate = useNavigate()

  // Derive a slightly darker shade for the gradient stop
  const glowStyle = {
    '--card-color': color,
  }

  return (
    <div
      className="group relative bg-gray-900 rounded-2xl p-px overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
      style={glowStyle}
      onClick={() => navigate(path)}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${color}60 0%, transparent 70%)`,
        }}
      />

      {/* Card body */}
      <div className="relative bg-gray-900 rounded-2xl p-5 h-full flex flex-col overflow-hidden">
        {/* Subtle background glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 20%, ${color}12 0%, transparent 60%)`,
          }}
        />

        {/* Top border glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(90deg, transparent, ${color}90, transparent)` }}
        />

        {/* Icon */}
        <div
          className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
            boxShadow: `0 0 0 1px ${color}25`,
          }}
        >
          <Icon className="w-6 h-6 transition-all duration-300" style={{ color }} />
          {/* Icon glow on hover */}
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: `0 0 16px ${color}50, inset 0 0 12px ${color}20` }}
          />
        </div>

        {/* Text */}
        <h3 className="relative text-white font-semibold text-[15px] mb-1.5 leading-snug">{title}</h3>
        <p className="relative text-gray-500 text-xs leading-relaxed mb-5 flex-1 line-clamp-2 group-hover:text-gray-400 transition-colors duration-200">
          {description}
        </p>

        {/* Launch button */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(path) }}
          className="relative w-full py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${color}22, ${color}12)`,
            border: `1px solid ${color}35`,
            color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${color}50, ${color}35)`
            e.currentTarget.style.boxShadow = `0 0 12px ${color}40`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${color}22, ${color}12)`
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Launch →
        </button>
      </div>
    </div>
  )
}
