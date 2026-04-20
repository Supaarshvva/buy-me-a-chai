import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HeartIcon } from '../../components/icons/AppIcons.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import supabase from '../../services/supabase.js'
import {
  formatRelativeTime,
  loadStoredLikedPostIds,
  saveStoredLikedPostIds,
} from '../../services/creatorStorage.js'
import { createNotification } from '../../services/notificationService.js'
import {
  addCommentToPost,
  buildPublicPostPath,
  deleteCommentFromPost,
  getPostById,
  togglePostLikeById,
} from '../../services/postService.js'

function formatPublishedDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function getInitials(profile) {
  return (
    (profile?.full_name || profile?.username || 'Creator')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'CR'
  )
}

function PostDetailPage() {
  const { profile: currentUserProfile } = useAuth()
  const { username = '', postId = '' } = useParams()
  const [profile, setProfile] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileMissing, setProfileMissing] = useState(false)
  const [post, setPost] = useState(null)
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [postMissing, setPostMissing] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState({})
  const [likesHydrated, setLikesHydrated] = useState(false)
  const [shareButtonLabel, setShareButtonLabel] = useState('Share')
  const [manualCopyVisible, setManualCopyVisible] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [toast, setToast] = useState(null)

  const storageScope = profile?.username || username
  const publishedDate = useMemo(
    () => (post ? formatPublishedDate(post.createdAt) : ''),
    [post]
  )
  const isLiked = Boolean(likedPostIds[String(post?.id)])
  const postTitle = post?.title?.trim() || (post?.type === 'photo' ? 'Photo update' : 'Creator update')
  const postContent = post?.type === 'photo'
    ? post?.caption || 'A photo update shared with supporters.'
    : post?.content || ''
  const comments = Array.isArray(post?.comments) ? post.comments : []
  const commenterUsername = currentUserProfile?.username?.trim() || ''
  const commenterAvatar = currentUserProfile?.avatar_url?.trim() || ''
  const postPath = buildPublicPostPath(username, postId)
  const postUrl = useMemo(() => {
    const origin = window.location.origin
    return `${origin}/${username}/post/${postId}`
  }, [postId, username])
  const actorName = currentUserProfile?.full_name?.trim()
    || currentUserProfile?.username?.trim()
    || 'Someone'

  useEffect(() => {
    setProfile(null)
    setProfileMissing(false)
    setPost(null)
    setPostMissing(false)
    setLikedPostIds({})
    setLikesHydrated(false)
  }, [postId, username])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      setProfileMissing(false)

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
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
      return () => {
        isMounted = false
      }
    }

    setIsLoadingProfile(false)
    return () => {
      isMounted = false
    }
  }, [username])

  useEffect(() => {
    if (isLoadingProfile || !storageScope) {
      return
    }

    setLikedPostIds(loadStoredLikedPostIds(storageScope))
    setLikesHydrated(true)
  }, [isLoadingProfile, storageScope])

  useEffect(() => {
    if (!likesHydrated || !storageScope) {
      return
    }

    saveStoredLikedPostIds(storageScope, likedPostIds)
  }, [likedPostIds, likesHydrated, storageScope])

  useEffect(() => {
    if (isLoadingProfile || !postId) {
      return
    }

    let isMounted = true

    const loadPost = async () => {
      setIsLoadingPost(true)
      setPostMissing(false)

      try {
        const loadedPost = await getPostById({
          postId,
          scope: storageScope,
        })

        if (!isMounted) {
          return
        }

        setPost(loadedPost)
      } catch {
        if (!isMounted) {
          return
        }

        setPost(null)
        setPostMissing(true)
      } finally {
        if (isMounted) {
          setIsLoadingPost(false)
        }
      }
    }

    loadPost()

    return () => {
      isMounted = false
    }
  }, [isLoadingProfile, postId, storageScope])

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

  const showToast = (message) => {
    setToast({
      id: Date.now(),
      message,
    })
  }

  const handleLikePost = () => {
    if (!post) {
      return
    }

    try {
      const { post: updatedPost, liked } = togglePostLikeById({
        postId: post.id,
        scope: storageScope,
      })

      setPost(updatedPost)
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
          console.error('[PostDetailPage] like notification failed:', error)
        })
      }
    } catch {
      showToast('Unable to update like')
    }
  }

  const handleSharePost = async () => {
    try {
      await navigator.clipboard.writeText(postUrl)
      setManualCopyVisible(false)
      setShareButtonLabel('Link copied!')
      showToast('Link copied!')
      window.setTimeout(() => setShareButtonLabel('Share'), 1800)
    } catch {
      setManualCopyVisible(true)
      setShareButtonLabel('Copy manually')
      showToast('Copy failed. Use the link below.')
      window.setTimeout(() => setShareButtonLabel('Share'), 1800)
    }
  }

  const handlePostComment = () => {
    if (!post) {
      return
    }

    try {
      const updatedPost = addCommentToPost({
        postId: post.id,
        scope: storageScope,
        name: commenterUsername || 'Anonymous',
        username: commenterUsername || 'Anonymous',
        avatar: commenterAvatar,
        text: commentText,
      })

      setPost(updatedPost)
      setCommentText('')
      showToast('Comment posted')
    } catch (error) {
      showToast(
        error instanceof Error && error.message === 'Comment text is required'
          ? 'Write a comment first'
          : 'Unable to post comment'
      )
    }
  }

  const handleDeleteComment = (commentId) => {
    if (!post) {
      return
    }

    const confirmed = window.confirm('Are you sure you want to delete this comment?')

    if (!confirmed) {
      return
    }

    try {
      const updatedPost = deleteCommentFromPost({
        postId: post.id,
        scope: storageScope,
        commentId,
      })

      setPost(updatedPost)
      showToast('Comment deleted')
    } catch {
      showToast('Unable to delete comment')
    }
  }

  if (isLoadingProfile || isLoadingPost) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-10">
        <div className="w-full max-w-3xl rounded-[32px] border border-stone-200/70 bg-white p-10 text-center shadow-xl shadow-stone-900/5">
          <p className="text-base leading-7 text-stone-500">Loading post...</p>
        </div>
      </div>
    )
  }

  if (profileMissing || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-10">
        <div className="w-full max-w-3xl rounded-[32px] border border-stone-200/70 bg-white p-10 text-center shadow-xl shadow-stone-900/5">
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

  if (postMissing || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-10">
        <div className="w-full max-w-3xl rounded-[32px] border border-stone-200/70 bg-white p-10 text-center shadow-xl shadow-stone-900/5">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            Post not found
          </h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/${username}`}
              className="inline-flex rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              Back to profile
            </Link>
            <Link
              to={`/${username}/posts`}
              className="inline-flex rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              View all posts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-10 text-stone-900 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <Link
            to={`/${username}`}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 focus:outline-none focus:ring-4 focus:ring-amber-100"
          >
            @{profile.username}
          </Link>
          <Link
            to={`/${username}/posts`}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 focus:outline-none focus:ring-4 focus:ring-amber-100"
          >
            All posts
          </Link>
        </div>

        <article className="rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-xl shadow-stone-900/5 sm:p-10">
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            <header className="space-y-6">
              <div className="flex items-center justify-center gap-4 text-left">
                {profile.avatar_url?.trim() ? (
                  <img
                    src={profile.avatar_url.trim()}
                    alt={profile.full_name || profile.username}
                    className="h-16 w-16 rounded-full border border-stone-200 object-cover shadow-md shadow-stone-900/10"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-900 text-lg font-semibold text-white shadow-md shadow-stone-900/10">
                    {getInitials(profile)}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Creator
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                    {profile.full_name?.trim() || 'Creator'}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">@{profile.username}</p>
                </div>
              </div>

              <div className="space-y-3 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Published {formatRelativeTime(post.createdAt)}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                  {postTitle}
                </h1>
                <p className="text-sm text-stone-500">{publishedDate}</p>
              </div>
            </header>

            {post.imageUrl ? (
              <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-stone-50">
                <img
                  src={post.imageUrl}
                  alt={post.imageName || postTitle}
                  className="max-h-[520px] w-full object-contain"
                />
              </div>
            ) : null}

            <div className="space-y-6 text-lg leading-8 text-stone-700">
              <p className="whitespace-pre-wrap">{postContent}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-stone-200/70 pt-6">
              <button
                type="button"
                onClick={handleLikePost}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition duration-200 focus:outline-none focus:ring-4 focus:ring-amber-100 ${
                  isLiked
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-stone-900 text-white shadow-lg shadow-stone-900/10 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl'
                }`}
              >
                <HeartIcon size={16} />
                <span>{post.engagement.likes}</span>
              </button>

              <button
                type="button"
                onClick={handleSharePost}
                className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 focus:outline-none focus:ring-4 focus:ring-amber-100"
              >
                {shareButtonLabel}
              </button>
            </div>

            {manualCopyVisible ? (
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
                <label className="grid gap-2" htmlFor="post-share-link">
                  <span className="text-sm font-medium text-stone-700">
                    Copy this link manually
                  </span>
                  <input
                    id="post-share-link"
                    type="text"
                    readOnly
                    value={postUrl}
                    onFocus={(event) => event.target.select()}
                    className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none"
                  />
                </label>
              </div>
            ) : null}

            <section className="border-t border-stone-200/70 pt-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Comments
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
                  Join the conversation
                </h2>
              </div>

              <div className="mt-6 grid gap-4">
                <p className="text-sm font-medium text-stone-600">
                  Commenting as {commenterUsername ? `@${commenterUsername}` : 'Anonymous'}
                </p>

                <label className="grid gap-2" htmlFor="comment-text">
                  <span className="text-sm font-medium text-stone-700">
                    Comment
                  </span>
                  <textarea
                    id="comment-text"
                    rows={4}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Write a comment..."
                    className="resize-none rounded-[24px] border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  />
                </label>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handlePostComment}
                    className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100"
                  >
                    Post comment
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {comments.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-10 text-center">
                    <p className="text-base font-medium text-stone-700">No comments yet</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-[24px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-white p-5 shadow-sm shadow-stone-200/60 transition duration-200 hover:bg-white"
                    >
                      <div className="flex items-start gap-4">
                        {comment.avatar ? (
                          <img
                            src={comment.avatar}
                            alt={comment.username || comment.name || 'Comment avatar'}
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">
                            {(comment.username || comment.name || 'Anonymous')
                              .trim()
                              .charAt(0)
                              .toUpperCase() || 'A'}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                              <p className="text-sm font-semibold text-stone-950">
                                {comment.username || comment.name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-stone-500">
                                {formatRelativeTime(comment.createdAt)}
                              </p>
                            </div>

                            {comment.username === commenterUsername ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="shrink-0 text-xs font-medium text-stone-400 transition duration-200 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-amber-100"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </article>

        {toast ? (
          <div className="pointer-events-none fixed bottom-6 right-6 z-40">
            <div className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-2xl shadow-stone-900/10">
              {toast.message}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PostDetailPage
