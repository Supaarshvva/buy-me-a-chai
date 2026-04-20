const FOLLOWERS_STORAGE_KEY = 'followers'
const FOLLOWERS_UPDATED_EVENT = 'buy-me-a-chai:followers-updated'

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function loadFollowersMap() {
  if (!canUseStorage()) {
    return {}
  }

  try {
    const rawFollowers = window.localStorage.getItem(FOLLOWERS_STORAGE_KEY)
    const parsedFollowers = rawFollowers ? JSON.parse(rawFollowers) : {}

    if (!parsedFollowers || typeof parsedFollowers !== 'object' || Array.isArray(parsedFollowers)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsedFollowers).map(([creatorUsername, followers]) => [
        normalizeUsername(creatorUsername),
        Array.isArray(followers)
          ? [...new Set(followers.map(normalizeUsername).filter(Boolean))]
          : [],
      ])
    )
  } catch {
    return {}
  }
}

function saveFollowersMap(followersMap) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(FOLLOWERS_STORAGE_KEY, JSON.stringify(followersMap))
  window.dispatchEvent(new CustomEvent(FOLLOWERS_UPDATED_EVENT))
}

function getCreatorFollowers(creatorUsername) {
  const normalizedCreatorUsername = normalizeUsername(creatorUsername)

  if (!normalizedCreatorUsername) {
    return []
  }

  return loadFollowersMap()[normalizedCreatorUsername] || []
}

function getFollowerCount(creatorUsername) {
  return getCreatorFollowers(creatorUsername).length
}

function isFollowing(creatorUsername, currentUser) {
  const normalizedCreatorUsername = normalizeUsername(creatorUsername)
  const normalizedCurrentUser = normalizeUsername(currentUser)

  if (!normalizedCreatorUsername || !normalizedCurrentUser) {
    return false
  }

  return getCreatorFollowers(normalizedCreatorUsername).includes(normalizedCurrentUser)
}

function followCreator(creatorUsername, currentUser) {
  const normalizedCreatorUsername = normalizeUsername(creatorUsername)
  const normalizedCurrentUser = normalizeUsername(currentUser)

  if (
    !normalizedCreatorUsername
    || !normalizedCurrentUser
    || normalizedCreatorUsername === normalizedCurrentUser
  ) {
    return getCreatorFollowers(normalizedCreatorUsername)
  }

  const followersMap = loadFollowersMap()
  const currentFollowers = followersMap[normalizedCreatorUsername] || []

  followersMap[normalizedCreatorUsername] = [...new Set([...currentFollowers, normalizedCurrentUser])]
  saveFollowersMap(followersMap)

  return followersMap[normalizedCreatorUsername]
}

function unfollowCreator(creatorUsername, currentUser) {
  const normalizedCreatorUsername = normalizeUsername(creatorUsername)
  const normalizedCurrentUser = normalizeUsername(currentUser)

  if (!normalizedCreatorUsername || !normalizedCurrentUser) {
    return getCreatorFollowers(normalizedCreatorUsername)
  }

  const followersMap = loadFollowersMap()
  const currentFollowers = followersMap[normalizedCreatorUsername] || []

  followersMap[normalizedCreatorUsername] = currentFollowers.filter(
    (username) => username !== normalizedCurrentUser
  )
  saveFollowersMap(followersMap)

  return followersMap[normalizedCreatorUsername]
}

function getFollowedCreatorUsernames(currentUser) {
  const normalizedCurrentUser = normalizeUsername(currentUser)

  if (!normalizedCurrentUser) {
    return []
  }

  return Object.entries(loadFollowersMap())
    .filter(([, followers]) => followers.includes(normalizedCurrentUser))
    .map(([creatorUsername]) => creatorUsername)
}

export {
  FOLLOWERS_STORAGE_KEY,
  FOLLOWERS_UPDATED_EVENT,
  followCreator,
  getCreatorFollowers,
  getFollowedCreatorUsernames,
  getFollowerCount,
  isFollowing,
  unfollowCreator,
}
