import supabase from './supabase.js'

const POST_AUTH_REDIRECT_KEY = 'postAuthRedirect'

async function getPostAuthRedirectPath() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle()

  return profile ? '/dashboard' : '/create-profile'
}

export { POST_AUTH_REDIRECT_KEY, getPostAuthRedirectPath }

