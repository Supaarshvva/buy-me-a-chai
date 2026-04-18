import { Navigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Signup() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthForm
      mode="signup"
      title="Create your account"
      buttonLabel="Sign up"
      footerText="Already have an account?"
      footerLinkLabel="Login"
      footerHref="/login"
    />
  )
}

export default Signup
