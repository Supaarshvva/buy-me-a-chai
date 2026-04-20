import {
  loadStoredLikedPostIds,
  loadStoredPosts,
  saveStoredLikedPostIds,
  saveStoredPosts,
} from './creatorStorage.js'

function normalizeTimestamp(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedTimestamp = Date.parse(value)

    if (Number.isFinite(parsedTimestamp)) {
      return parsedTimestamp
    }
  }

  return Date.now()
}

function normalizePost(rawPost) {
  if (!rawPost || typeof rawPost !== 'object') {
    return null
  }

  const imageUrl = typeof rawPost.imageUrl === 'string'
    ? rawPost.imageUrl
    : typeof rawPost.image === 'string'
      ? rawPost.image
      : ''
  const content = typeof rawPost.content === 'string'
    ? rawPost.content
    : typeof rawPost.caption === 'string'
      ? rawPost.caption
      : ''

  return {
    id: rawPost.id ?? rawPost._id ?? null,
    type: rawPost.type === 'photo' || imageUrl ? 'photo' : 'text',
    title: typeof rawPost.title === 'string' ? rawPost.title : '',
    content,
    caption: typeof rawPost.caption === 'string' ? rawPost.caption : '',
    imageUrl,
    imageName: typeof rawPost.imageName === 'string' ? rawPost.imageName : '',
    createdAt: normalizeTimestamp(rawPost.createdAt),
    engagement: {
      likes: Number.isFinite(rawPost?.engagement?.likes)
        ? rawPost.engagement.likes
        : Number.isFinite(rawPost?.likes)
          ? rawPost.likes
          : 0,
    },
    comments: Array.isArray(rawPost?.comments)
      ? [...rawPost.comments]
        .map((comment) => ({
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
          createdAt: normalizeTimestamp(comment?.createdAt),
        }))
        .sort((left, right) => right.createdAt - left.createdAt)
      : [],
  }
}

function extractPostPayload(payload) {
  if (payload && typeof payload === 'object') {
    if (payload.post && typeof payload.post === 'object') {
      return payload.post
    }

    if (payload.data && typeof payload.data === 'object') {
      return payload.data
    }
  }

  return payload
}

async function requestPost(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const payload = await response.json()
  const normalizedPost = normalizePost(extractPostPayload(payload))

  if (!normalizedPost?.id) {
    throw new Error('Invalid post payload')
  }

  return normalizedPost
}

function buildPublicPostPath(username, postId) {
  return `/${username}/post/${postId}`
}

function loadStoredPost(scope, postId) {
  if (!scope) {
    return null
  }

  return loadStoredPosts(scope).find((post) => String(post.id) === String(postId)) || null
}

function mergeStoredPost(scope, updatedPost) {
  if (!scope || !updatedPost?.id) {
    return
  }

  const storedPosts = loadStoredPosts(scope)
  const nextPosts = storedPosts.map((post) =>
    String(post.id) === String(updatedPost.id) ? updatedPost : post
  )

  saveStoredPosts(scope, nextPosts)
}

async function getPostById({ postId, scope }) {
  const storedPost = loadStoredPost(scope, postId)

  if (storedPost) {
    return storedPost
  }

  if (scope) {
    throw new Error('Post not found')
  }

  try {
    return await requestPost(`/api/posts/${postId}`)
  } catch {
    throw new Error('Post not found')
  }
}

async function likePostById({ postId, scope }) {
  try {
    const updatedPost = await requestPost(`/api/posts/${postId}/like`, {
      method: 'POST',
    })

    mergeStoredPost(scope, updatedPost)
    return updatedPost
  } catch {
    const storedPosts = loadStoredPosts(scope)
    let updatedPost = null

    const nextPosts = storedPosts.map((post) => {
      if (String(post.id) !== String(postId)) {
        return post
      }

      updatedPost = {
        ...post,
        engagement: {
          ...post.engagement,
          likes: post.engagement.likes + 1,
        },
      }

      return updatedPost
    })

    if (!updatedPost) {
      throw new Error('Unable to like post')
    }

    saveStoredPosts(scope, nextPosts)
    return updatedPost
  }
}

function togglePostLikeById({ postId, scope }) {
  if (!scope) {
    throw new Error('Missing post scope')
  }

  const normalizedPostId = String(postId)
  const storedPosts = loadStoredPosts(scope)
  const likedPostIds = loadStoredLikedPostIds(scope)
  const isLiked = Boolean(likedPostIds[normalizedPostId])
  let updatedPost = null

  const nextPosts = storedPosts.map((post) => {
    if (String(post.id) !== normalizedPostId) {
      return post
    }

    const nextLikes = Math.max(
      0,
      Number(post?.engagement?.likes || 0) + (isLiked ? -1 : 1)
    )

    updatedPost = {
      ...post,
      engagement: {
        ...post.engagement,
        likes: nextLikes,
      },
    }

    return updatedPost
  })

  if (!updatedPost) {
    throw new Error('Post not found')
  }

  const nextLikedPostIds = { ...likedPostIds }

  if (isLiked) {
    delete nextLikedPostIds[normalizedPostId]
  } else {
    nextLikedPostIds[normalizedPostId] = true
  }

  saveStoredPosts(scope, nextPosts)
  saveStoredLikedPostIds(scope, nextLikedPostIds)

  return {
    post: updatedPost,
    liked: !isLiked,
  }
}

function addCommentToPost({ postId, scope, name, username, avatar, text }) {
  if (!scope) {
    throw new Error('Missing post scope')
  }

  const normalizedPostId = String(postId)
  const trimmedText = typeof text === 'string' ? text.trim() : ''

  if (!trimmedText) {
    throw new Error('Comment text is required')
  }

  const nextComment = {
    id: Date.now(),
    name: typeof name === 'string' && name.trim() ? name.trim() : 'Anonymous',
    username: typeof username === 'string' && username.trim()
      ? username.trim()
      : typeof name === 'string' && name.trim()
        ? name.trim()
        : 'Anonymous',
    avatar: typeof avatar === 'string' ? avatar : '',
    text: trimmedText,
    createdAt: Date.now(),
  }

  const storedPosts = loadStoredPosts(scope)
  let updatedPost = null

  const nextPosts = storedPosts.map((post) => {
    if (String(post.id) !== normalizedPostId) {
      return post
    }

    updatedPost = {
      ...post,
      comments: [nextComment, ...(Array.isArray(post.comments) ? post.comments : [])],
    }

    return updatedPost
  })

  if (!updatedPost) {
    throw new Error('Post not found')
  }

  saveStoredPosts(scope, nextPosts)
  return updatedPost
}

function deleteCommentFromPost({ postId, scope, commentId }) {
  if (!scope) {
    throw new Error('Missing post scope')
  }

  const normalizedPostId = String(postId)
  const normalizedCommentId = String(commentId)
  const storedPosts = loadStoredPosts(scope)
  let updatedPost = null

  const nextPosts = storedPosts.map((post) => {
    if (String(post.id) !== normalizedPostId) {
      return post
    }

    const currentComments = Array.isArray(post.comments) ? post.comments : []
    const nextComments = currentComments.filter(
      (comment) => String(comment.id) !== normalizedCommentId
    )

    if (nextComments.length === currentComments.length) {
      throw new Error('Comment not found')
    }

    updatedPost = {
      ...post,
      comments: nextComments,
    }

    return updatedPost
  })

  if (!updatedPost) {
    throw new Error('Post not found')
  }

  saveStoredPosts(scope, nextPosts)
  return updatedPost
}

export {
  addCommentToPost,
  buildPublicPostPath,
  deleteCommentFromPost,
  getPostById,
  likePostById,
  togglePostLikeById,
}
