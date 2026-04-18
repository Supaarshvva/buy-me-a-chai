import { Navigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthForm
      mode="login"
      title="Welcome back"
      buttonLabel="Login"
      footerText="Don't have an account?"
      footerLinkLabel="Sign up"
      footerHref="/signup"
    />
  )
}

export default Login
