/**
 * HubHeader — colourful section hero for each hub page (Agents, Images, Code, etc.)
 * Props:
 *   icon      — Lucide component
 *   title     — string
 *   subtitle  — string
 *   color     — hex accent colour
 *   count     — number of tools in this hub (shown as chip)
 */
export default function HubHeader({ icon: Icon, title, subtitle, color, count }) {
  return (
    <div
      className="relative mb-8 rounded-2xl overflow-hidden p-6"
      style={{
        background: `linear-gradient(135deg, ${color}14 0%, #0d0d14 60%, #0a0a12 100%)`,
        border: `1px solid ${color}30`,
        boxShadow: `0 0 40px ${color}0a`,
      }}
    >
      {/* Radial blob top-right */}
      <div
        className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />
      {/* Radial blob bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Horizontal glow line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon badge */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}12)`,
            border: `1px solid ${color}35`,
            boxShadow: `0 0 20px ${color}25`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {count != null && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
              >
                {count} tools
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
