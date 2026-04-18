import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 shadow-sm sm:px-8 lg:px-10">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-stone-900 transition hover:text-amber-700"
        >
          Buy Me a Chai {'\u2615'}
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-md"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
