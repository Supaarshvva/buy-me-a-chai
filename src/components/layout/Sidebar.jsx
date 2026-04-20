import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

/* Nav items with inline SVG outline icons */
const navItems = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8.5L10 3l7 5.5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5Z" />
        <path d="M7.5 18v-5.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V18" />
      </svg>
    ),
  },
  {
    to: '/dashboard/supporters',
    label: 'Supporters',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 17s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.65-7 9-7 9Z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/posts',
    label: 'Posts',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="14" rx="2" />
        <path d="M7 7h6M7 10h6M7 13h4" />
      </svg>
    ),
  },
  {
    to: '/dashboard/explore',
    label: 'Explore',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="7" />
        <path d="M13.5 6.5l-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
      </svg>
    ),
  },
]

/* Logout icon (door with arrow) */
function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3" />
      <path d="M8 13l3-3-3-3" />
      <path d="M11 10H3" />
    </svg>
  )
}

/* Tea brand mark */
function TeaBrandMark() {
  return (
    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-100 text-amber-700 shadow-md shadow-amber-100/60">
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 28H42C42 37.9411 37.0751 44 30 44C22.9249 44 18 37.9411 18 28Z"
          className="fill-current opacity-90"
        />
        <path
          d="M41 30H45.5C49.0899 30 52 32.9101 52 36.5C52 40.0899 49.0899 43 45.5 43H42"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M16 26H44" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M20 49H46" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="opacity-80" />
        <path d="M24 16C21.5 19 21.5 21.5 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-70" />
        <path d="M32 13C29.5 16 29.5 18.5 32 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-70" />
      </svg>
    </div>
  )
}

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/80 bg-white/95 px-4 py-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <TeaBrandMark />
          <span className="text-sm font-semibold tracking-tight text-stone-900">
            Buy Me a Chai
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white p-2.5 text-stone-700 shadow-sm transition duration-150 hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-amber-100"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h12M4 10h12M4 14h12" />
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/25 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="relative h-full w-72 max-w-[82vw] border-r border-stone-200/80 bg-white/95 backdrop-blur">
            <div className="flex h-full flex-col px-4 py-5">
              <div className="flex items-center justify-between gap-3 px-2">
                <div className="flex items-center gap-2.5">
                  <TeaBrandMark />
                  <span className="text-sm font-semibold tracking-tight text-stone-900">
                    Buy Me a Chai
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white p-2 text-stone-600 transition duration-150 hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-amber-100"
                  aria-label="Close navigation"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M5 5l10 10M15 5L5 15" />
                  </svg>
                </button>
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition duration-150 ${
                        isActive
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-white' : 'text-stone-400'}>
                          {item.icon}
                        </span>
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      ) : null}

      <aside className="hidden min-h-screen w-60 shrink-0 border-r border-stone-200/80 bg-white/90 backdrop-blur lg:block">
        <div className="flex h-full flex-col px-4 py-5">

          {/* Brand */}
          <div className="flex items-center gap-2.5 px-2">
            <TeaBrandMark />
            <span className="text-sm font-semibold tracking-tight text-stone-900">
              Buy Me a Chai
            </span>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-150 ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-white' : 'text-stone-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
