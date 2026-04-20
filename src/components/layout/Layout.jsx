import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'

function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 text-stone-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />

          <main className="flex-1 px-6 py-6 sm:px-8 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
