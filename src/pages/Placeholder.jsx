import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'

export default function Placeholder() {
  const { pathname } = useLocation()
  const name = pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2)

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Construction className="w-16 h-16 text-gray-600 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
      <p className="text-gray-400">This section is coming soon.</p>
    </div>
  )
}
