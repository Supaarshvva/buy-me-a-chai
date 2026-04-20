import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CoffeeIcon,
  HeartIcon,
} from '../../components/icons/AppIcons.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import supabase from '../../services/supabase.js'
import {
  formatRelativeTime,
  loadStoredLikedPostIds,
  loadStoredPosts,
  saveStoredLikedPostIds,
  saveStoredPosts,
} from '../../services/creatorStorage.js'
import { formatCurrency } from '../../services/currency.js'
import { createNotification } from '../../services/notificationService.js'
import {
  buildPublicPostPath,
  togglePostLikeById,
} from '../../services/postService.js'
import useCreatorSupporters from '../../hooks/useCreatorSupporters.js'
import {
  completeSupport,
  formatSupportActivity,
} from '../../services/supportService.js'
import {
  FOLLOWERS_UPDATED_EVENT,
  followCreator,
  getFollowerCount,
  isFollowing,
  unfollowCreator,
} from '../../services/followerService.js'
const chaiQuantities = [1, 3, 5]
const chaiPriceInRupees = 10

function CreatorPublicPage({ showAllPosts = false }) {
  const { user: currentUser, profile: currentUserProfile } = useAuth()
  const navigate = useNavigate()
  const { username = '' } = useParams()
  const [profile, setProfile] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileMissing, setProfileMissing] = useState(false)
  const [posts, setPosts] = useState([])
  const [likedPostIds, setLikedPostIds] = useState({})
  const [dataHydrated, setDataHydrated] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(chaiQuantities[1])
  const [customQuantity, setCustomQuantity] = useState('')
  const [supporterName, setSupporterName] = useState('')
  const [supporterMessage, setSupporterMessage] = useState('')
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCreator, setFollowingCreator] = useState(false)
  const [toast, setToast] = useState(null)

  const storageScope = profile?.username || username
  const supporterScope = profile?.username || username
  const currentUsername = currentUserProfile?.username?.trim() || ''
  const {
    recentSupporters,
    supporters,
  } = useCreatorSupporters(supporterScope)
  const recentPosts = useMemo(() => posts.slice(0, 4), [posts])
  const supporterCountLabel = `${supporters.length} supporter${supporters.length === 1 ? '' : 's'}`
  const followerCountLabel = `${followerCount} follower${followerCount === 1 ? '' : 's'}`
  const publicPostsPath = `/${username}/posts`
  const parsedCustomQuantity = Number.parseInt(customQuantity, 10)
  const hasValidCustomQuantity =
    Number.isFinite(parsedCustomQuantity) && parsedCustomQuantity > 0
  const selectedSupportQuantity = hasValidCustomQuantity
    ? parsedCustomQuantity
    : selectedQuantity
  const selectedSupportAmount = selectedSupportQuantity * chaiPriceInRupees
  const formattedSupportAmount = formatCurrency(selectedSupportAmount)
  const supportButtonText = isSubmittingSupport
    ? `Sending ${formattedSupportAmount}...`
    : `Support ${formattedSupportAmount}`
  const actorName = currentUserProfile?.full_name?.trim()
    || currentUserProfile?.username?.trim()
    || 'Someone'

  useEffect(() => {
    setPosts([])
    setLikedPostIds({})
    setDataHydrated(false)
  }, [username])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      setProfileMissing(false)

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url')
        .eq('username', username)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (error || !data) {
        setProfile(null)
        setProfileMissing(true)
        setIsLoadingProfile(false)
        return
      }

      setProfile(data)
      setIsLoadingProfile(false)
    }

    if (username) {
      loadProfile()
    }

    return () => {
      isMounted = false
    }
  }, [username])

  useEffect(() => {
    if (!storageScope) {
      return
    }

    setPosts(loadStoredPosts(storageScope))
    setLikedPostIds(loadStoredLikedPostIds(storageScope))
    setDataHydrated(true)
  }, [storageScope])

  useEffect(() => {
    if (!dataHydrated || !storageScope) {
      return
    }

    saveStoredPosts(storageScope, posts)
  }, [dataHydrated, posts, storageScope])

  useEffect(() => {
    if (!dataHydrated || !storageScope) {
      return
    }

    saveStoredLikedPostIds(storageScope, likedPostIds)
  }, [dataHydrated, likedPostIds, storageScope])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const clearTimer = window.setTimeout(() => {
      setToast(null)
    }, 2200)

    return () => {
      window.clearTimeout(clearTimer)
    }
  }, [toast])

  useEffect(() => {
    const refreshFollowers = () => {
      const creatorUsername = profile?.username || username

      if (!creatorUsername) {
        setFollowerCount(0)
        setFollowingCreator(false)
        return
      }

      setFollowerCount(getFollowerCount(creatorUsername))
      setFollowingCreator(isFollowing(creatorUsername, currentUsername))
    }

    refreshFollowers()

    const handleStorage = (event) => {
      if (!event.key || event.key === 'followers') {
        refreshFollowers()
      }
    }

    window.addEventListener(FOLLOWERS_UPDATED_EVENT, refreshFollowers)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(FOLLOWERS_UPDATED_EVENT, refreshFollowers)
      window.removeEventListener('storage', handleStorage)
    }
  }, [currentUsername, profile?.username, username])

  const showToast = (message) => {
    setToast({
      id: Date.now(),
      message,
    })
  }

  const handleLikePost = (postId) => {
    try {
      const { post: updatedPost, liked } = togglePostLikeById({
        postId,
        scope: storageScope,
      })

      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === postId ? updatedPost : post))
      )
      setLikedPostIds(loadStoredLikedPostIds(storageScope))
      showToast(liked ? 'Post liked' : 'Like removed')

      if (liked && profile?.id && currentUserProfile?.id !== profile.id) {
        const postLabel = updatedPost.title?.trim()
          || (updatedPost.type === 'photo' ? 'your photo update' : 'your post')

        void createNotification({
          receiverId: profile.id,
          senderId: currentUserProfile?.id ?? null,
          type: 'like',
          message: `${actorName} liked ${postLabel}`,
        }).catch((error) => {
          console.error('[CreatorPublicPage] like notification failed:', error)
        })
      }
    } catch {
      showToast('Unable to update like')
    }
  }

  const handleOpenPost = (postId) => {
    navigate(buildPublicPostPath(username, postId))
  }

  const handleSharePost = async (post) => {
    const postUrl = `${window.location.origin}${buildPublicPostPath(username, post.id)}`

    const sharePayload = {
      title: post.title || `${profile?.full_name || 'Creator'} shared a post`,
      text: post.type === 'photo'
        ? post.caption || 'A new photo update is live.'
        : post.content,
      url: postUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(sharePayload)
        showToast('Post shared')
        return
      } catch {
        // Fall through to clipboard sharing.
      }
    }

    try {
      await navigator.clipboard.writeText(sharePayload.url)
      showToast('Share link copied')
    } catch {
      showToast('Unable to share post')
    }
  }

  const handleSupport = async () => {
    const trimmedName = supporterName.trim()
    const trimmedMessage = supporterMessage.trim()

    if (!selectedSupportAmount || selectedSupportAmount <= 0) {
      showToast('Choose how many chai cups to send')
      return
    }

    setIsSubmittingSupport(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 600))

      const createdAt = Date.now()
      await completeSupport({
        amount: selectedSupportAmount,
        creatorId: profile?.id,
        creatorUsername: profile?.username || username,
        cups: selectedSupportQuantity,
        message: trimmedMessage,
        supporterName: trimmedName,
        timestamp: createdAt,
      })

      if (profile?.id && currentUser?.id) {
        const { error } = await supabase.from('notifications').insert({
          receiver_id: profile.id,
          sender_id: currentUser.id,
          type: 'support',
          message: `${currentUserProfile?.username || 'Someone'} supported you`,
        })

        if (error) {
          console.error('[CreatorPublicPage] support notification failed:', error)
        }
      }

      setSupporterName('')
      setSupporterMessage('')
      setSelectedQuantity(chaiQuantities[1])
      setCustomQuantity('')
      showToast('Support sent')
    } catch {
      showToast('Unable to send chai right now')
    } finally {
      setIsSubmittingSupport(false)
    }
  }

  const handleToggleFollow = async () => {
    const creatorUsername = profile?.username || username

    if (!creatorUsername || !currentUsername || creatorUsername === currentUsername) {
      return
    }

    if (followingCreator) {
      const nextFollowers = unfollowCreator(creatorUsername, currentUsername)
      setFollowerCount(nextFollowers.length)
      setFollowingCreator(false)
      showToast('Unfollowed creator')
      return
    }

    const nextFollowers = followCreator(creatorUsername, currentUsername)
    setFollowerCount(nextFollowers.length)
    setFollowingCreator(true)
    showToast('Now following creator')

    if (profile?.id && currentUser?.id) {
      const { error } = await supabase.from('notifications').insert({
        receiver_id: profile.id,
        sender_id: currentUser.id,
        type: 'follow',
        message: `${currentUserProfile?.username || 'Someone'} started following you`,
      })

      if (error) {
        console.error('[CreatorPublicPage] follow notification failed:', error)
      }
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-3xl rounded-[32px] border border-stone-200/70 bg-white p-6 text-center shadow-xl shadow-stone-900/5 sm:p-10">
          <p className="text-base leading-7 text-stone-500">Loading creator profile...</p>
        </div>
      </div>
    )
  }

  if (profileMissing || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-3xl rounded-[32px] border border-stone-200/70 bg-white p-6 text-center shadow-xl shadow-stone-900/5 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
            Creator Not Found
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            This creator page does not exist yet
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-600">
            Double-check the profile link or head back to the homepage.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const fullName = profile.full_name?.trim() || 'Creator'
  const bio = profile.bio?.trim() || 'This creator has not added a bio yet.'
  const avatarUrl = profile.avatar_url?.trim() || ''
  const canFollowCreator = Boolean(currentUsername) && currentUsername !== profile.username
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    || 'CR'

  const renderPostCard = (post, compact = false) => (
    <article
      id={`post-${post.id}`}
      key={post.id}
      role="link"
      tabIndex={0}
      onClick={() => handleOpenPost(post.id)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleOpenPost(post.id)
        }
      }}
      className={`cursor-pointer rounded-[28px] border border-stone-200/70 bg-white shadow-lg shadow-stone-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 ${
        compact ? 'p-5' : 'p-5 sm:p-6'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {post.title ? (
              <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-semibold tracking-tight text-stone-950`}>
                {post.title}
              </h3>
            ) : (
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                {post.type === 'photo' ? 'Photo update' : 'Text update'}
              </p>
            )}
            <p className="text-sm text-stone-500">{formatRelativeTime(post.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>{post.engagement.likes} likes</span>
          </div>
        </div>

        {post.type === 'photo' && post.imageUrl ? (
          <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-stone-50">
            <img
              src={post.imageUrl}
              alt={post.imageName || post.caption || 'Public post image'}
              className={`${compact ? 'max-h-[220px]' : 'max-h-[420px]'} w-full object-contain`}
            />
          </div>
        ) : null}

        <p className={`${compact ? 'text-sm' : 'text-base'} leading-7 text-stone-600`}>
          {post.type === 'photo'
            ? post.caption || 'A photo update shared with supporters.'
            : post.content}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/70 pt-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleLikePost(post.id)
            }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-200 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed ${
              likedPostIds[String(post.id)]
                ? 'bg-amber-50 text-amber-700'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950'
            }`}
          >
            <HeartIcon size={16} />
            <span>{post.engagement.likes}</span>
          </button>

          {!compact ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                void handleSharePost(post)
              }}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              Share
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )

  if (showAllPosts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-6 text-stone-900 sm:px-8 sm:py-10 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-20 w-20 rounded-full border border-stone-200 object-cover shadow-md shadow-stone-900/10"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-900 text-xl font-semibold text-white shadow-md shadow-stone-900/10">
                    {initials}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                    All Posts
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                    {fullName}
                  </h1>
                  <p className="mt-2 text-sm text-stone-500">
                    @{profile.username} | {supporterCountLabel} | {followerCountLabel}
                  </p>
                </div>
              </div>

              <Link
                to={`/${profile.username}`}
                className="inline-flex w-full rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 focus:outline-none focus:ring-4 focus:ring-amber-100 sm:w-auto"
              >
                Back to profile
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Latest First
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
                  Posts from {fullName}
                </h2>
                <p className="mt-2 max-w-2xl text-base leading-7 text-stone-600">
                  Browse every post, leave a heart, and share the ones you love.
                </p>
              </div>

              {posts.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-12 text-center">
                  <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                    No posts yet
                  </h3>
                  <p className="mt-3 text-base leading-7 text-stone-600">
                    This creator has not shared any public updates yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {posts.map((post) => renderPostCard(post))}
                </div>
              )}
            </div>
          </section>

          {toast ? (
            <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6">
              <div className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-2xl shadow-stone-900/10">
                {toast.message}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-6 text-stone-900 sm:px-8 sm:py-10 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-24 w-24 rounded-full border border-stone-200 object-cover shadow-md shadow-stone-900/10"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-stone-900 text-2xl font-semibold text-white shadow-md shadow-stone-900/10">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                {fullName}
              </h1>
              <p className="mt-2 text-base text-stone-500">@{profile.username}</p>
              <p className="mt-2 text-sm font-medium text-amber-700">
                {supporterCountLabel} | {followerCountLabel}
              </p>
            </div>

            {canFollowCreator ? (
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`w-full rounded-2xl px-5 py-3 text-sm font-medium transition duration-200 focus:outline-none focus:ring-4 focus:ring-amber-100 sm:ml-auto sm:w-auto ${
                  followingCreator
                    ? 'border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950'
                    : 'bg-stone-900 text-white shadow-lg shadow-stone-900/10 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl'
                }`}
              >
                {followingCreator ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_360px]">
          <div className="space-y-8">
            <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                About
              </p>
              <p className="mt-4 text-base leading-7 text-stone-600">{bio}</p>
            </section>

            <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Recent Posts
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                    Latest updates
                  </h2>
                  <p className="mt-2 max-w-2xl text-base leading-7 text-stone-600">
                    A quick look at the newest things this creator has shared.
                  </p>
                </div>

                <Link
                  to={publicPostsPath}
                  className="inline-flex w-full rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 focus:outline-none focus:ring-4 focus:ring-amber-100 sm:w-auto"
                >
                  View all posts
                </Link>
              </div>

              <div className="mt-6 max-h-[44rem] space-y-4 overflow-y-auto pr-2">
                {recentPosts.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-10 text-center">
                    <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                      No posts yet
                    </h3>
                    <p className="mt-3 text-base leading-7 text-stone-600">
                      Check back soon for fresh updates from this creator.
                    </p>
                  </div>
                ) : (
                  recentPosts.map((post) => renderPostCard(post, true))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                Support
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
                Buy {fullName.split(' ')[0] || 'this creator'} a chai
              </h2>
              <p className="mt-2 text-base leading-7 text-stone-600">
                Choose a few cups, add your name, and send a one-time chai treat.
              </p>

              <div className="mt-6 rounded-[28px] border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm shadow-stone-200/70">
                    <CoffeeIcon size={18} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm shadow-stone-200/60">
                        x
                      </span>
                      {chaiQuantities.map((quantity) => {
                        const isActive =
                          !hasValidCustomQuantity && selectedQuantity === quantity

                        return (
                          <button
                            key={quantity}
                            type="button"
                            onClick={() => {
                              setSelectedQuantity(quantity)
                              setCustomQuantity('')
                            }}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 focus:outline-none focus:ring-4 focus:ring-amber-100 ${
                              isActive
                                ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                                : 'border border-stone-300 bg-white text-stone-700 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950'
                            }`}
                          >
                            {quantity}
                          </button>
                        )
                      })}
                    </div>

                    <label className="grid gap-2" htmlFor="custom-support-quantity">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Custom Cups
                      </span>
                      <div
                        className={`flex items-center rounded-2xl border px-4 py-3 transition duration-200 focus-within:ring-4 focus-within:ring-amber-100 ${
                          hasValidCustomQuantity
                            ? 'border-stone-900 bg-white shadow-sm shadow-stone-900/5'
                            : 'border-stone-300 bg-white focus-within:border-amber-500'
                        }`}
                      >
                        <span className="text-sm font-semibold text-stone-500">x</span>
                        <input
                          id="custom-support-quantity"
                          type="text"
                          inputMode="numeric"
                          value={customQuantity}
                          onChange={(event) => {
                            const nextValue = event.target.value.replace(/[^\d]/g, '')
                            setCustomQuantity(nextValue)
                          }}
                          placeholder="Enter cups"
                          className="ml-2 w-full border-0 bg-transparent p-0 text-sm text-stone-900 outline-none placeholder:text-stone-400"
                        />
                        <span className="text-sm font-medium text-stone-500">
                          = {formattedSupportAmount}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="grid gap-2" htmlFor="supporter-name">
                  <span className="text-sm font-medium text-stone-700">
                    Your name (optional)
                  </span>
                  <input
                    id="supporter-name"
                    type="text"
                    value={supporterName}
                    onChange={(event) => setSupporterName(event.target.value)}
                    placeholder="Someone kind"
                    className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  />
                </label>

                <label className="grid gap-2" htmlFor="supporter-message">
                  <span className="text-sm font-medium text-stone-700">
                    Message (optional)
                  </span>
                  <textarea
                    id="supporter-message"
                    rows={4}
                    value={supporterMessage}
                    onChange={(event) => setSupporterMessage(event.target.value)}
                    placeholder="Say something nice..."
                    className="resize-none rounded-[24px] border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleSupport}
                disabled={isSubmittingSupport}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <CoffeeIcon size={16} />
                <span>{supportButtonText}</span>
              </button>
            </section>

            <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
                Recent support
              </h2>

              {recentSupporters.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-10 text-center">
                  <h3 className="text-xl font-semibold tracking-tight text-stone-950">
                    No chai sent yet
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">
                    Be the first supporter to send a cup.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {recentSupporters.map((supporter) => (
                    <article
                      key={supporter.id}
                      className="rounded-[24px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-white p-5 shadow-sm shadow-stone-200/60"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-start gap-2 text-base font-semibold leading-7 text-stone-950">
                            <CoffeeIcon size={16} className="mt-1 shrink-0 text-amber-700" />
                            <p>{formatSupportActivity(supporter)}</p>
                          </div>

                          {supporter.message ? (
                            <p className="mt-2 text-sm leading-7 text-stone-600">
                              {supporter.message}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-amber-700">
                            {formatCurrency(supporter.amount)}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {formatRelativeTime(supporter.createdAt)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>

        {toast ? (
          <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6">
            <div className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-2xl shadow-stone-900/10">
              {toast.message}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CreatorPublicPage
