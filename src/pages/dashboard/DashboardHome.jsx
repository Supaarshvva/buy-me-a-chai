import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UsersIcon } from '../../components/icons/AppIcons.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { POSTS_UPDATED_EVENT, loadStoredPosts } from '../../services/creatorStorage.js'
import { formatCurrency } from '../../services/currency.js'
import {
  FOLLOWERS_UPDATED_EVENT,
  getFollowerCount,
} from '../../services/followerService.js'
import useCreatorSupporters from '../../hooks/useCreatorSupporters.js'

function DashboardHome() {
  const { profile } = useAuth()
  const [copyStatus, setCopyStatus] = useState('Copy link')
  const [postsCount, setPostsCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)

  const fullName = profile?.full_name?.trim() || 'Creator Profile'
  const username = profile?.username?.trim() || ''
  const avatarUrl = profile?.avatar_url?.trim() || ''
  const { totalAmount, totalSupporters } = useCreatorSupporters(username)
  const publicProfileLink = username
    ? `${window.location.origin}/${username}`
    : ''
  const totalEarnings = formatCurrency(totalAmount)
  const supportersCount = String(totalSupporters)

  useEffect(() => {
    const refreshPostsCount = () => {
      if (!username) {
        setPostsCount(0)
        return
      }

      setPostsCount(loadStoredPosts(username).length)
    }

    refreshPostsCount()

    const handleStorage = (event) => {
      if (!event.key || event.key === 'posts') {
        refreshPostsCount()
      }
    }

    window.addEventListener(POSTS_UPDATED_EVENT, refreshPostsCount)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(POSTS_UPDATED_EVENT, refreshPostsCount)
      window.removeEventListener('storage', handleStorage)
    }
  }, [username])

  useEffect(() => {
    const refreshFollowersCount = () => {
      if (!username) {
        setFollowersCount(0)
        return
      }

      setFollowersCount(getFollowerCount(username))
    }

    refreshFollowersCount()

    const handleStorage = (event) => {
      if (!event.key || event.key === 'followers') {
        refreshFollowersCount()
      }
    }

    window.addEventListener(FOLLOWERS_UPDATED_EVENT, refreshFollowersCount)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(FOLLOWERS_UPDATED_EVENT, refreshFollowersCount)
      window.removeEventListener('storage', handleStorage)
    }
  }, [username])

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    || 'CP'

  const handleCopyLink = async () => {
    if (!publicProfileLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(publicProfileLink)
      setCopyStatus('Copied!')
      window.setTimeout(() => setCopyStatus('Copy link'), 2000)
    } catch {
      setCopyStatus('Copy failed')
      window.setTimeout(() => setCopyStatus('Copy link'), 2000)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-xl shadow-stone-900/5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
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

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                Creator Snapshot
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {fullName}
              </h2>
              <p className="mt-2 text-lg text-stone-600">
                {username ? `@${username}` : '@username'}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-stone-500">
                <UsersIcon size={16} className="text-amber-700" />
                <span>{followersCount} follower{followersCount === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-gradient-to-br from-stone-50 to-amber-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Public Page
            </p>
            <p className="mt-2 max-w-md text-sm text-stone-700">
              {publicProfileLink || 'Add a username to generate your shareable profile link.'}
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!publicProfileLink}
              className="mt-4 rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copyStatus}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-amber-50 p-8 shadow-xl shadow-stone-900/5">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
              Earnings
            </p>
            <h2 className="mt-4 text-5xl font-semibold tracking-tight text-stone-950 sm:text-6xl">
              {totalEarnings}
            </h2>
            <p className="mt-2 text-sm text-stone-600">Total Earnings</p>
          </div>

          <Link
            to="/dashboard/posts"
            className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100"
          >
            Create Post
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/dashboard/supporters"
          className="group rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-lg shadow-stone-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10 focus:outline-none focus:ring-4 focus:ring-amber-100"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            Supporters
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            {supportersCount}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            See who is backing your page and stay on top of supporter activity.
          </p>
          <p className="mt-5 text-sm font-medium text-amber-700 transition duration-200 group-hover:text-amber-800">
            Open supporters
          </p>
        </Link>

        <Link
          to="/dashboard/posts"
          className="group rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-lg shadow-stone-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10 focus:outline-none focus:ring-4 focus:ring-amber-100"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            Posts
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            {postsCount}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Publish updates, share milestones, and keep your audience engaged.
          </p>
          <p className="mt-5 text-sm font-medium text-amber-700 transition duration-200 group-hover:text-amber-800">
            Manage posts
          </p>
        </Link>
      </section>
    </div>
  )
}

export default DashboardHome
