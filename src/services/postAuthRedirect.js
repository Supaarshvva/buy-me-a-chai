import supabase from './supabase.js'

const POST_AUTH_REDIRECT_KEY = 'postAuthRedirect'

async function getPostAuthRedirectPath() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('SESSION:', session ?? null)

  if (!session?.user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  console.log('PROFILE:', profile ?? null)

  return profile ? '/dashboard' : '/create-profile'
}

export { POST_AUTH_REDIRECT_KEY, getPostAuthRedirectPath }
