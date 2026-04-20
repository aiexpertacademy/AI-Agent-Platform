import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-8">
        <Outlet />
      </main>
    </div>
  )
}
