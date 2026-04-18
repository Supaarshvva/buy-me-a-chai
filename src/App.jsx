import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'
import supabase from './services/supabase.js'

function App() {
  void supabase

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}

export default App
