import AuthForm from '../components/AuthForm.jsx'

function Login() {
  return (
    <AuthForm
      title="Welcome back"
      buttonLabel="Login"
      footerText="Don't have an account?"
      footerLinkLabel="Sign up"
      footerHref="/signup"
    />
  )
}

export default Login
