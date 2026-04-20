const POSTS_STORAGE_KEY = 'posts'
const LEGACY_POSTS_STORAGE_PREFIX = 'buy-me-a-chai:posts'
const POST_LIKES_STORAGE_PREFIX = 'buy-me-a-chai:post-likes'
const SUPPORTERS_STORAGE_PREFIX = 'buy-me-a-chai:supporters'
const POSTS_UPDATED_EVENT = 'buy-me-a-chai:posts-updated'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getPostLikesStorageKey(scope) {
  return `${POST_LIKES_STORAGE_PREFIX}:${scope || 'local'}`
}

function getSupportersStorageKey(scope) {
  return `${SUPPORTERS_STORAGE_PREFIX}:${scope || 'local'}`
}

function sortLatestFirst(items) {
  return [...items].sort((left, right) => right.createdAt - left.createdAt)
}

function sanitizeComment(comment) {
  return {
    id: comment?.id ?? Date.now(),
    name: typeof comment?.name === 'string' && comment.name.trim()
      ? comment.name.trim()
      : 'Anonymous',
    username: typeof comment?.username === 'string' && comment.username.trim()
      ? comment.username.trim()
      : typeof comment?.name === 'string' && comment.name.trim()
        ? comment.name.trim()
        : 'Anonymous',
    avatar: typeof comment?.avatar === 'string' ? comment.avatar : '',
    text: typeof comment?.text === 'string' ? comment.text : '',
    createdAt: typeof comment?.createdAt === 'number' ? comment.createdAt : Date.now(),
  }
}

function sanitizePost(post) {
  return {
    id: post.id,
    creatorUsername:
      typeof post.creatorUsername === 'string'
        ? post.creatorUsername.trim()
        : typeof post.username === 'string'
          ? post.username.trim()
          : '',
    type: post.type === 'photo' ? 'photo' : 'text',
    title: typeof post.title === 'string' ? post.title : '',
    content: typeof post.content === 'string' ? post.content : '',
    caption: typeof post.caption === 'string' ? post.caption : '',
    imageUrl: typeof post.imageUrl === 'string' ? post.imageUrl : '',
    imageName: typeof post.imageName === 'string' ? post.imageName : '',
    createdAt: typeof post.createdAt === 'number' ? post.createdAt : Date.now(),
    engagement: {
      likes: Number.isFinite(post?.engagement?.likes) ? post.engagement.likes : 0,
    },
    comments: Array.isArray(post?.comments)
      ? sortLatestFirst(post.comments.map(sanitizeComment))
      : [],
  }
}

function sanitizeSupporter(supporter) {
  return {
    id: supporter.id ?? Date.now(),
    name: typeof supporter.name === 'string' ? supporter.name : '',
    creatorUsername:
      typeof supporter.creatorUsername === 'string' ? supporter.creatorUsername : '',
    cups: Number.isFinite(supporter.cups) ? supporter.cups : 0,
    amount: Number.isFinite(supporter.amount) ? supporter.amount : 0,
    message: typeof supporter.message === 'string' ? supporter.message : '',
    monthly: Boolean(supporter.monthly),
    createdAt:
      typeof supporter.createdAt === 'number' ? supporter.createdAt : Date.now(),
  }
}

function mergePostsById(posts) {
  const postMap = new Map()

  posts.forEach((post) => {
    if (!post?.id) {
      return
    }

    postMap.set(String(post.id), sanitizePost(post))
  })

  return sortLatestFirst(Array.from(postMap.values()))
}

function readGlobalPosts() {
  const rawPosts = window.localStorage.getItem(POSTS_STORAGE_KEY)
  const parsedPosts = rawPosts ? JSON.parse(rawPosts) : []

  return Array.isArray(parsedPosts) ? mergePostsById(parsedPosts) : []
}

function migrateLegacyScopedPosts() {
  const migratedPosts = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)

    if (!key || !key.startsWith(`${LEGACY_POSTS_STORAGE_PREFIX}:`)) {
      continue
    }

    try {
      const rawPosts = window.localStorage.getItem(key)
      const parsedPosts = rawPosts ? JSON.parse(rawPosts) : []
      const scope = key.slice(`${LEGACY_POSTS_STORAGE_PREFIX}:`.length)

      if (Array.isArray(parsedPosts)) {
        migratedPosts.push(
          ...parsedPosts.map((post) => ({
            ...post,
            creatorUsername:
              typeof post?.creatorUsername === 'string' && post.creatorUsername.trim()
                ? post.creatorUsername.trim()
                : scope === 'local'
                  ? ''
                  : scope,
          }))
        )
      }

      window.localStorage.removeItem(key)
    } catch {
      // Ignore malformed legacy entries.
    }
  }

  if (migratedPosts.length === 0) {
    return []
  }

  const nextPosts = mergePostsById(migratedPosts)
  window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts))
  return nextPosts
}

function loadStoredPosts(scope) {
  if (!canUseStorage()) {
    return []
  }

  try {
    let parsedPosts = readGlobalPosts()

    if (parsedPosts.length === 0) {
      parsedPosts = migrateLegacyScopedPosts()
    }

    const normalizedScope = typeof scope === 'string' ? scope.trim() : ''

    if (!normalizedScope) {
      return parsedPosts
    }

    return parsedPosts.filter((post) => post.creatorUsername === normalizedScope)
  } catch {
    return []
  }
}

function saveStoredPosts(scopeOrPosts, postsArg) {
  if (!canUseStorage()) {
    return
  }

  const hasScope = Array.isArray(postsArg)
  const scope = hasScope && typeof scopeOrPosts === 'string' ? scopeOrPosts.trim() : ''
  const nextScopePosts = hasScope ? postsArg : scopeOrPosts

  if (!Array.isArray(nextScopePosts)) {
    return
  }

  const sanitizedScopePosts = sortLatestFirst(nextScopePosts.map(sanitizePost))
  let nextPosts

  if (hasScope) {
    const existingPosts = loadStoredPosts()
    nextPosts = mergePostsById([
      ...existingPosts.filter((post) => post.creatorUsername !== scope),
      ...sanitizedScopePosts.map((post) => ({
        ...post,
        creatorUsername: post.creatorUsername || scope,
      })),
    ])
  } else {
    nextPosts = mergePostsById(sanitizedScopePosts)
  }

  window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts))
  window.dispatchEvent(new CustomEvent(POSTS_UPDATED_EVENT))
}

function loadStoredLikedPostIds(scope) {
  if (!canUseStorage()) {
    return {}
  }

  try {
    const rawLikedPostIds = window.localStorage.getItem(getPostLikesStorageKey(scope))
    const parsedLikedPostIds = rawLikedPostIds ? JSON.parse(rawLikedPostIds) : []

    return Array.isArray(parsedLikedPostIds)
      ? Object.fromEntries(parsedLikedPostIds.map((postId) => [String(postId), true]))
      : {}
  } catch {
    return {}
  }
}

function saveStoredLikedPostIds(scope, likedPostIds) {
  if (!canUseStorage()) {
    return
  }

  const serializedLikedPostIds = Object.entries(likedPostIds)
    .filter(([, liked]) => liked)
    .map(([postId]) => postId)

  window.localStorage.setItem(
    getPostLikesStorageKey(scope),
    JSON.stringify(serializedLikedPostIds)
  )
}

function loadStoredSupporters(scope) {
  if (!canUseStorage()) {
    return []
  }

  try {
    const rawSupporters = window.localStorage.getItem(getSupportersStorageKey(scope))
    const parsedSupporters = rawSupporters ? JSON.parse(rawSupporters) : []
    return Array.isArray(parsedSupporters)
      ? sortLatestFirst(parsedSupporters.map(sanitizeSupporter))
      : []
  } catch {
    return []
  }
}

function saveStoredSupporters(scope, supporters) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    getSupportersStorageKey(scope),
    JSON.stringify(supporters)
  )
}

function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)))

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(hours / 24)

  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  const months = Math.floor(days / 30)

  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`
  }

  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export {
  formatRelativeTime,
  POSTS_UPDATED_EVENT,
  loadStoredLikedPostIds,
  loadStoredPosts,
  loadStoredSupporters,
  saveStoredLikedPostIds,
  saveStoredPosts,
  saveStoredSupporters,
}
