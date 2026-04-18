import AuthForm from '../components/AuthForm.jsx'

function Login() {
  return (
    <AuthForm
      mode="login"
      title="Welcome back"
      subtitle="Login to your account"
      buttonLabel="Login"
      footerText="Don't have an account?"
      footerLinkLabel="Sign up"
      footerHref="/signup"
    />
  )
}

export default Login
