import AuthForm from '../components/AuthForm.jsx'

function Signup() {
  return (
    <AuthForm
      mode="signup"
      title="Create your account"
      subtitle="Start receiving support"
      buttonLabel="Sign up"
      footerText="Already have an account?"
      footerLinkLabel="Login"
      footerHref="/login"
    />
  )
}

export default Signup
