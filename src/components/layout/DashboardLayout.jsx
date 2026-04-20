import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import GlobalCorner from './GlobalCorner.jsx'

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 text-stone-900">
      <div className="flex min-h-screen">
        <Sidebar />

        {/*
          position: relative -> GlobalCorner's absolute coord anchors here.
          The extra top padding (pt-16) gives the corner element breathing room
          so page headings don't sit under it on any screen size.
        */}
        <main className="relative min-w-0 flex-1 px-6 pt-16 pb-6 sm:px-8 lg:px-10">
          <GlobalCorner />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
