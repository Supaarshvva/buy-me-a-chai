import AuthForm from '../components/AuthForm.jsx'

function Signup() {
  return (
    <AuthForm
      title="Create your account"
      buttonLabel="Sign up"
      footerText="Already have an account?"
      footerLinkLabel="Login"
      footerHref="/login"
    />
  )
}

export default Signup
