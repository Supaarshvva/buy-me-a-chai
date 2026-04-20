import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon } from '../../components/icons/AppIcons.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  FOLLOWERS_UPDATED_EVENT,
  getFollowedCreatorUsernames,
} from '../../services/followerService.js'
import supabase from '../../services/supabase.js'
import { fetchAllCreatorSupportCounts } from '../../services/supportService.js'

const TRENDING_CREATORS_LIMIT = 10

function getCreatorInitials(creator) {
  const label = creator?.full_name?.trim() || creator?.username?.trim() || 'Creator'

  return (
    label
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'CR'
  )
}

function normalizeTimestamp(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function formatSupporterCount(count) {
  return `${count} supporter${count === 1 ? '' : 's'}`
}

/* Isolated Creator Row Components */
/* All size-critical properties use inline `style` props so they cannot be */
/* overridden by Tailwind's @base reset, global CSS, or any flex/grid parent. */


/** Hard-coded avatar dimensions - never touched by external CSS. */
const AVATAR_SIZE = 40 // px

const avatarWrapStyle = {
  width: `${AVATAR_SIZE}px`,
  height: `${AVATAR_SIZE}px`,
  minWidth: `${AVATAR_SIZE}px`,
  minHeight: `${AVATAR_SIZE}px`,
  maxWidth: `${AVATAR_SIZE}px`,
  maxHeight: `${AVATAR_SIZE}px`,
  flexShrink: 0,
  flexGrow: 0,
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const avatarImgStyle = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  flexShrink: 0,
  aspectRatio: '1 / 1',
}

function CreatorAvatarImg({ creator }) {
  const fullName = creator.full_name?.trim() || creator.username?.trim() || 'Creator'

  if (creator.avatar_url?.trim()) {
    return (
      <span
        style={{
          ...avatarWrapStyle,
          border: '1px solid #e7e5e4', // stone-200
          background: '#f5f5f4',       // stone-100
        }}
      >
        <img
          src={creator.avatar_url.trim()}
          alt={fullName}
          style={avatarImgStyle}
        />
      </span>
    )
  }

  const initials = getCreatorInitials(creator)

  return (
    <span
      style={{
        ...avatarWrapStyle,
        background: '#1c1917',  // stone-900
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </span>
  )
}

/** Rank badge - shown only for trending list; constrained to a fixed-width block. */
function RankBadge({ rank }) {
  if (typeof rank !== 'number') {
    return <span style={{ width: '32px', flexShrink: 0 }} aria-hidden="true" />
  }

  return (
    <span
      style={{
        width: '32px',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1c1917',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '2px 4px',
      }}
    >
      #{rank}
    </span>
  )
}

/** A single compact creator row - no cards, no grid, no vertical stretch. */
function CreatorDirectoryRow({ creator, rank }) {
  const fullName = creator.full_name?.trim() || 'Creator'
  const creatorUsername = creator.username.trim()
  const bio = creator.bio?.trim() || ''

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 0',
        listStyle: 'none',
        borderBottom: '1px solid #f5f5f4', // stone-100 hairline
      }}
    >
      {/* Rank column - always present, empty spacer when no rank */}
      <RankBadge rank={rank} />

      <Link
        to={`/${creatorUsername}`}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          flex: '1 1 0%',
          minWidth: 0,
          textDecoration: 'none',
          borderRadius: '10px',
          padding: '4px 6px',
          outline: 'none',
        }}
        className="focus:ring-4 focus:ring-amber-100"
      >
        {/* Avatar - vertically centered to the name+handle pair, not to all 4 lines */}
        <span style={{ paddingTop: '1px', flexShrink: 0 }}>
          <CreatorAvatarImg creator={creator} />
        </span>

        {/* Text stack */}
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            minWidth: 0,
            flex: '1 1 0%',
          }}
        >
          {/* 1 - Full name (primary) */}
          <span
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: '1.4',
              color: '#0c0a09', // stone-950
            }}
          >
            {fullName}
          </span>

          {/* 2 - Handle + supporter count (secondary) */}
          <span
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              lineHeight: '1.5',
              color: '#78716c', // stone-500
            }}
          >
            @{creatorUsername}
            <span style={{ margin: '0 5px', color: '#d6d3d1' }} aria-hidden="true">&middot;</span>
            <span
              style={{
                fontWeight: 500,
                color: '#57534e',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <HeartIcon size={12} className="text-amber-700" />
              {formatSupporterCount(creator.supporterCount || 0)}
            </span>
          </span>

          {/* 3 - Bio / About (tertiary, only when present) */}
          {bio ? (
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '11px',
                lineHeight: '1.35',
                marginTop: '3px',
                color: '#a8a29e', // stone-400 - lightest tier
                fontStyle: 'italic',
              }}
            >
              {bio}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  )
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-[18px] border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
      <h2 className="text-lg font-semibold tracking-tight text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
    </div>
  )
}

function Explore() {
  const { profile } = useAuth()
  const [creators, setCreators] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('explore')
  const currentUsername = profile?.username?.trim() || ''

  useEffect(() => {
    let isMounted = true

    const loadCreators = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, created_at')
        .order('full_name', { ascending: true })

      if (!isMounted) {
        return
      }

      if (error || !Array.isArray(data)) {
        setCreators([])
        setIsLoading(false)
        return
      }

      // Fetch aggregate support counts in a single query (no N+1)
      const supportCountsMap = await fetchAllCreatorSupportCounts()

      const nextCreators = data
        .filter((creator) => typeof creator?.username === 'string' && creator.username.trim())
        .filter((creator) => creator.username.trim() !== currentUsername)
        .map((creator) => {
          const counts = supportCountsMap.get(creator.id)
          return {
            ...creator,
            bio: creator.bio?.trim() || '',
            createdAt: normalizeTimestamp(creator.created_at),
            latestActivityAt: 0,
            supporterCount: counts?.supporterCount || 0,
          }
        })

      setCreators(nextCreators)
      setIsLoading(false)
    }

    void loadCreators()

    const handleRefresh = () => {
      void loadCreators()
    }

    window.addEventListener(FOLLOWERS_UPDATED_EVENT, handleRefresh)

    return () => {
      isMounted = false
      window.removeEventListener(FOLLOWERS_UPDATED_EVENT, handleRefresh)
    }
  }, [currentUsername])

  const followedCreatorUsernames = useMemo(
    () => getFollowedCreatorUsernames(currentUsername),
    [currentUsername, creators]
  )

  const sortedCreators = useMemo(
    () => [...creators].sort((left, right) => {
      if (right.supporterCount !== left.supporterCount) {
        return right.supporterCount - left.supporterCount
      }

      if (right.latestActivityAt !== left.latestActivityAt) {
        return right.latestActivityAt - left.latestActivityAt
      }

      if (right.createdAt !== left.createdAt) {
        return right.createdAt - left.createdAt
      }

      return (left.full_name || left.username).localeCompare(right.full_name || right.username)
    }),
    [creators]
  )

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  const filteredCreators = useMemo(() => {
    if (!normalizedSearchQuery) {
      return sortedCreators
    }

    return sortedCreators.filter((creator) => {
      const fullName = creator.full_name?.trim().toLowerCase() || ''
      const username = creator.username?.trim().toLowerCase() || ''

      return fullName.includes(normalizedSearchQuery) || username.includes(normalizedSearchQuery)
    })
  }, [normalizedSearchQuery, sortedCreators])

  const trendingCreators = useMemo(
    () => filteredCreators.slice(0, TRENDING_CREATORS_LIMIT),
    [filteredCreators]
  )

  const followedCreators = useMemo(
    () => filteredCreators.filter((creator) => followedCreatorUsernames.includes(creator.username)),
    [filteredCreators, followedCreatorUsernames]
  )

  return (
    <div className="space-y-3">
      <section className="rounded-[20px] border border-stone-200/70 bg-white p-3.5 shadow-sm shadow-stone-900/5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition duration-200 focus:outline-none focus:ring-4 focus:ring-amber-100 ${
              activeTab === 'explore'
                ? 'bg-stone-900 text-white'
                : 'border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950'
            }`}
          >
            Explore creators
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition duration-200 focus:outline-none focus:ring-4 focus:ring-amber-100 ${
              activeTab === 'following'
                ? 'bg-stone-900 text-white'
                : 'border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950'
            }`}
          >
            Following
          </button>
        </div>

        <label className="mt-3 block" htmlFor="creator-search">
          <span className="sr-only">Search creators</span>
          <input
            id="creator-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by creator name or @handle"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
          />
        </label>
      </section>

      {isLoading ? (
        <section className="rounded-[20px] border border-stone-200/70 bg-white px-5 py-10 text-center shadow-sm shadow-stone-900/5">
          <p className="text-sm text-stone-500">Loading creators...</p>
        </section>
      ) : activeTab === 'explore' ? (
        <section className="rounded-[20px] border border-stone-200/70 bg-white p-3.5 shadow-sm shadow-stone-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Trending Creators
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-stone-950">
            Top creators right now
          </h1>

          <ul
            style={{ margin: 0, padding: 0, listStyle: 'none' }}
            className="mt-3"
          >
            {trendingCreators.length === 0 ? (
              <li style={{ listStyle: 'none' }}>
                <EmptyState
                  title={normalizedSearchQuery ? 'No matching creators' : 'No creators yet'}
                  message={
                    normalizedSearchQuery
                      ? 'Try a different creator name or handle.'
                      : 'Creator profiles will appear here once public pages are available.'
                  }
                />
              </li>
            ) : (
              trendingCreators.map((creator, index) => (
                <CreatorDirectoryRow
                  key={creator.id}
                  creator={creator}
                  rank={index + 1}
                />
              ))
            )}
          </ul>
        </section>
      ) : (
        <section className="rounded-[20px] border border-stone-200/70 bg-white p-3.5 shadow-sm shadow-stone-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Following
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-stone-950">
            Creators you follow
          </h1>

          <ul
            style={{ margin: 0, padding: 0, listStyle: 'none' }}
            className="mt-3"
          >
            {followedCreators.length === 0 ? (
              <li style={{ listStyle: 'none' }}>
                <EmptyState
                  title={
                    normalizedSearchQuery
                      ? 'No followed creators match this search'
                      : 'You are not following anyone yet'
                  }
                  message={
                    normalizedSearchQuery
                      ? 'Search by a different name or handle.'
                      : 'Follow creators from Explore to keep them here.'
                  }
                />
              </li>
            ) : (
              followedCreators.map((creator) => (
                <CreatorDirectoryRow
                  key={creator.id}
                  creator={creator}
                />
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  )
}

export default Explore
