import FeaturesSection from './FeaturesSection.jsx'
import Hero from './Hero.jsx'
import Navbar from './Navbar.jsx'
import StatsSection from './StatsSection.jsx'
import WhySection from './WhySection.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 text-stone-900">
      <Navbar />
      <Hero />
      <WhySection />
      <FeaturesSection />
      <StatsSection />
    </div>
  )
}

export default App
