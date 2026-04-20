import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartIcon } from '../../components/icons/AppIcons.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  formatRelativeTime,
  loadStoredLikedPostIds,
  loadStoredPosts,
  saveStoredLikedPostIds,
  saveStoredPosts,
} from '../../services/creatorStorage.js'
import {
  buildPublicPostPath,
  togglePostLikeById,
} from '../../services/postService.js'

const PUBLISH_DELAY_MS = 700
const SUCCESS_CARD_DISPLAY_MS = 4500
const SUCCESS_CARD_EXIT_MS = 300
const TOAST_DISPLAY_MS = 2200
const composerModes = [
  {
    id: 'text',
    label: 'Text Post',
    description: 'Share an update, note, or story with your supporters.',
  },
  {
    id: 'photo',
    label: 'Photo Post',
    description: 'Upload a visual moment and add a short caption.',
  },
]

function Posts() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const textContentRef = useRef(null)
  const photoCaptionRef = useRef(null)
  const fileInputRef = useRef(null)
  const [activeMode, setActiveMode] = useState('text')
  const [textTitle, setTextTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFileName, setPhotoFileName] = useState('')
  const [posts, setPosts] = useState([])
  const [likedPostIds, setLikedPostIds] = useState({})
  const [postsHydrated, setPostsHydrated] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [latestPublishedPost, setLatestPublishedPost] = useState(null)
  const [successCardVisible, setSuccessCardVisible] = useState(false)
  const [copyStatus, setCopyStatus] = useState('Copy link')
  const [shareStatus, setShareStatus] = useState('Share post')
  const [highlightedPostId, setHighlightedPostId] = useState(null)
  const [toast, setToast] = useState(null)

  const username = profile?.username?.trim() || ''
  const storageScope = username || 'local'

  useEffect(() => {
    if (!latestPublishedPost) {
      return undefined
    }

    setSuccessCardVisible(false)

    const enterTimer = window.setTimeout(() => {
      setSuccessCardVisible(true)
    }, 20)

    const hideTimer = window.setTimeout(() => {
      setSuccessCardVisible(false)
    }, SUCCESS_CARD_DISPLAY_MS)

    const clearTimer = window.setTimeout(() => {
      setLatestPublishedPost(null)
    }, SUCCESS_CARD_DISPLAY_MS + SUCCESS_CARD_EXIT_MS)

    return () => {
      window.clearTimeout(enterTimer)
      window.clearTimeout(hideTimer)
      window.clearTimeout(clearTimer)
    }
  }, [latestPublishedPost?.id])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const clearTimer = window.setTimeout(() => {
      setToast(null)
    }, TOAST_DISPLAY_MS)

    return () => {
      window.clearTimeout(clearTimer)
    }
  }, [toast])

  useEffect(() => {
    try {
      setPosts(loadStoredPosts(storageScope))
      setLikedPostIds(loadStoredLikedPostIds(storageScope))
    } catch {
      setPosts([])
      setLikedPostIds({})
    } finally {
      setPostsHydrated(true)
    }
  }, [storageScope])

  useEffect(() => {
    if (!postsHydrated) {
      return
    }

    saveStoredPosts(storageScope, posts)
  }, [posts, postsHydrated, storageScope])

  useEffect(() => {
    if (!postsHydrated) {
      return
    }

    saveStoredLikedPostIds(storageScope, likedPostIds)
  }, [likedPostIds, postsHydrated, storageScope])

  const createPostLink = (postId) => {
    if (username) {
      return `${window.location.origin}${buildPublicPostPath(username, postId)}`
    }

    return `${window.location.origin}/dashboard/posts#post-${postId}`
  }

  const showToast = (message) => {
    setToast({
      id: Date.now(),
      message,
    })
  }

  const handleComposerModeChange = (modeId) => {
    setActiveMode(modeId)

    window.setTimeout(() => {
      if (modeId === 'text') {
        textContentRef.current?.focus()
        return
      }

      if (photoPreview) {
        photoCaptionRef.current?.focus()
      } else {
        fileInputRef.current?.focus()
      }
    }, 0)
  }

  const handlePhotoSelection = (event) => {
    const [file] = event.target.files ?? []

    if (!file) {
      setPhotoPreview('')
      setPhotoFileName('')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setPhotoPreview(typeof reader.result === 'string' ? reader.result : '')
      setPhotoFileName(file.name)
    }

    reader.readAsDataURL(file)
  }

  const handleCopyLink = async (post = latestPublishedPost) => {
    if (!post) {
      return
    }

    try {
      await navigator.clipboard.writeText(createPostLink(post.id))
      setCopyStatus('Copied!')
      showToast('Post link copied')
      window.setTimeout(() => setCopyStatus('Copy link'), 2000)
    } catch {
      setCopyStatus('Copy failed')
      showToast('Unable to copy link')
      window.setTimeout(() => setCopyStatus('Copy link'), 2000)
    }
  }

  const handleSharePost = async (post = latestPublishedPost) => {
    if (!post) {
      return
    }

    const sharePayload = {
      title: post.title || (post.type === 'photo' ? 'New photo post' : 'New post'),
      text:
        post.type === 'photo'
          ? post.caption || 'A new photo update is live.'
          : post.content,
      url: createPostLink(post.id),
    }

    if (navigator.share) {
      try {
        await navigator.share(sharePayload)
        setShareStatus('Shared')
        showToast('Post shared')
        window.setTimeout(() => setShareStatus('Share post'), 2000)
        return
      } catch {
        setShareStatus('Share post')
      }
    }

    try {
      await navigator.clipboard.writeText(sharePayload.url)
      setShareStatus('Link copied')
      showToast('Share link copied')
      window.setTimeout(() => setShareStatus('Share post'), 2000)
    } catch {
      setShareStatus('Share unavailable')
      showToast('Share unavailable')
      window.setTimeout(() => setShareStatus('Share post'), 2000)
    }
  }

  const handleOpenPost = (post = latestPublishedPost) => {
    if (!post || !username) {
      return
    }

    navigate(buildPublicPostPath(username, post.id))
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
    } catch {
      showToast('Unable to update like')
    }
  }

  const closeSuccessCard = () => {
    setSuccessCardVisible(false)
    window.setTimeout(() => setLatestPublishedPost(null), SUCCESS_CARD_EXIT_MS)
  }

  const publishTextPost = async () => {
    const trimmedTitle = textTitle.trim()
    const trimmedContent = textContent.trim()

    if (!trimmedContent) {
      return
    }

    setIsPublishing(true)
    await new Promise((resolve) => window.setTimeout(resolve, PUBLISH_DELAY_MS))

    const newPost = {
      id: Date.now(),
      creatorUsername: username,
      type: 'text',
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: Date.now(),
      engagement: {
        likes: 0,
      },
    }

    setPosts((currentPosts) => [newPost, ...currentPosts])
    setLatestPublishedPost(newPost)
    setTextTitle('')
    setTextContent('')
    setCopyStatus('Copy link')
    setShareStatus('Share post')
    showToast('Text post published')
    setIsPublishing(false)
  }

  const publishPhotoPost = async () => {
    const trimmedCaption = photoCaption.trim()

    if (!photoPreview) {
      return
    }

    setIsPublishing(true)
    await new Promise((resolve) => window.setTimeout(resolve, PUBLISH_DELAY_MS))

    const newPost = {
      id: Date.now(),
      creatorUsername: username,
      type: 'photo',
      title: '',
      caption: trimmedCaption,
      imageUrl: photoPreview,
      imageName: photoFileName,
      createdAt: Date.now(),
      engagement: {
        likes: 0,
      },
    }

    setPosts((currentPosts) => [newPost, ...currentPosts])
    setLatestPublishedPost(newPost)
    setPhotoCaption('')
    setPhotoPreview('')
    setPhotoFileName('')
    setCopyStatus('Copy link')
    setShareStatus('Share post')
    showToast('Photo post published')
    setIsPublishing(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePublish = async () => {
    if (isPublishing) {
      return
    }

    if (activeMode === 'photo') {
      await publishPhotoPost()
      return
    }

    await publishTextPost()
  }

  const handleFocusComposer = () => {
    if (activeMode === 'photo') {
      if (photoPreview) {
        photoCaptionRef.current?.focus()
      } else {
        fileInputRef.current?.click()
      }
      return
    }

    textContentRef.current?.focus()
  }

  const publishDisabled = isPublishing || (activeMode === 'photo' ? !photoPreview : !textContent.trim())

  return (
    <div className="space-y-8 pb-6">
      <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                Publishing Studio
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
                Create something worth sharing
              </h1>
            </div>

            <div className="w-full rounded-[28px] border border-stone-200 bg-gradient-to-br from-stone-50 to-amber-50 px-5 py-4 lg:w-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Publishing Tip
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-700">
                Short, regular updates help supporters feel closer to your work and keep
                your page feeling active.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {composerModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleComposerModeChange(mode.id)}
                className={`rounded-2xl px-5 py-3 text-sm font-medium transition duration-200 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100 ${
                  activeMode === mode.id
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                    : 'border border-stone-300 bg-white text-stone-700 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="rounded-[28px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-amber-50 p-5 shadow-sm shadow-stone-200/60 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {composerModes.find((mode) => mode.id === activeMode)?.label}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              {composerModes.find((mode) => mode.id === activeMode)?.description}
            </p>

            {activeMode === 'text' ? (
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2" htmlFor="post-title">
                  <span className="text-sm font-medium text-stone-700">
                    Title (optional)
                  </span>
                  <input
                    id="post-title"
                    type="text"
                    value={textTitle}
                    onChange={(event) => setTextTitle(event.target.value)}
                    placeholder="Give your update a headline"
                    className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                </label>

                <label className="grid gap-2" htmlFor="post-content">
                  <span className="text-sm font-medium text-stone-700">Content</span>
                  <textarea
                    id="post-content"
                    ref={textContentRef}
                    value={textContent}
                    onChange={(event) => setTextContent(event.target.value)}
                    placeholder="Share a milestone, preview, or behind-the-scenes note..."
                    rows={7}
                    className="resize-none rounded-[24px] border border-stone-300 bg-white px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-stone-700">Image</span>
                  <div className="rounded-[24px] border border-dashed border-stone-300 bg-white p-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelection}
                      className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-amber-700"
                    />

                    {photoPreview ? (
                      <div className="mt-4 overflow-hidden rounded-[24px] border border-stone-200 bg-stone-50">
                        <img
                          src={photoPreview}
                          alt={photoFileName || 'Selected preview'}
                          className="max-h-[360px] w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mt-4 flex h-48 items-center justify-center rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 text-center">
                        <p className="max-w-sm text-sm leading-6 text-stone-500">
                          Upload a clean visual, workspace shot, or sneak peek to make your
                          post feel more alive.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <label className="grid gap-2" htmlFor="photo-caption">
                  <span className="text-sm font-medium text-stone-700">
                    Caption (optional)
                  </span>
                  <textarea
                    id="photo-caption"
                    ref={photoCaptionRef}
                    value={photoCaption}
                    onChange={(event) => setPhotoCaption(event.target.value)}
                    placeholder="Add a short caption for the image..."
                    rows={4}
                    className="resize-none rounded-[24px] border border-stone-300 bg-white px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                </label>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishDisabled}
                className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isPublishing ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </div>

          {latestPublishedPost ? (
            <div
              className={`rounded-[28px] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-lg shadow-amber-100/70 transition duration-300 sm:p-6 ${
                successCardVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-3 opacity-0'
              }`}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg shadow-stone-900/10">
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 12.5L10 16.5L18 8.5"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                        Your post is live!
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        Nice work. Your supporters now have something fresh to engage with.
                      </p>
                    </div>
                  </div>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
                    {latestPublishedPost.title
                      || (latestPublishedPost.type === 'photo'
                        ? 'Photo post published'
                        : 'Update published')}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    Your newest post is ready to share. Copy the link, preview it in the
                    feed, or use a quick share action to spread the word.
                  </p>

                  <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm shadow-stone-200/60">
                    {createPostLink(latestPublishedPost.id)}
                  </div>
                </div>

                <div className="flex w-full max-w-sm flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopyLink()}
                    className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100"
                  >
                    {copyStatus}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPost()}
                    className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100"
                  >
                    Open Post
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSharePost()}
                    className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100"
                  >
                    {shareStatus}
                  </button>
                  <button
                    type="button"
                    onClick={closeSuccessCard}
                    className="rounded-2xl border border-transparent px-5 py-3 text-sm font-medium text-stone-500 transition duration-200 hover:text-stone-700 focus:outline-none focus:ring-4 focus:ring-amber-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[32px] border border-stone-200/70 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
              Posts List
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
              Your latest updates
            </h2>
          </div>

          {postsHydrated && posts.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-12 text-center">
              <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                No posts yet
              </h3>
              <p className="mt-3 max-w-md text-base leading-7 text-stone-600">
                Start sharing updates with your supporters
              </p>
              <button
                type="button"
                onClick={handleFocusComposer}
                className="mt-6 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100"
              >
                Create your first post
              </button>
            </div>
          ) : !postsHydrated ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-12 text-center">
              <p className="text-base leading-7 text-stone-500">Loading posts...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <article
                  id={`post-${post.id}`}
                  key={post.id}
                  role={username ? 'link' : undefined}
                  tabIndex={username ? 0 : undefined}
                  onClick={username ? () => handleOpenPost(post) : undefined}
                  onKeyDown={username
                    ? (event) => {
                        if (event.target !== event.currentTarget) {
                          return
                        }

                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleOpenPost(post)
                        }
                      }
                    : undefined}
                  className={`rounded-[28px] border p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${
                    highlightedPostId === post.id
                      ? 'border-amber-300 bg-amber-50 shadow-amber-100'
                      : 'border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-white shadow-stone-900/5'
                  } ${username ? 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-100' : ''}`}
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                            {post.type === 'photo' ? 'Photo Post' : 'Text Post'}
                          </span>
                          <span className="text-sm text-stone-500">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>

                        {post.title ? (
                          <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                            {post.title}
                          </h3>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                        <span>{post.engagement.likes} likes</span>
                      </div>
                    </div>

                    {post.type === 'photo' && post.imageUrl ? (
                      <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-stone-50">
                        <img
                          src={post.imageUrl}
                          alt={post.imageName || post.caption || 'Published post image'}
                          className="max-h-[360px] w-full object-contain"
                        />
                      </div>
                    ) : null}

                    <p className="text-base leading-7 text-stone-600">
                      {post.type === 'photo'
                        ? post.caption || 'A photo update shared with supporters.'
                        : post.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 border-t border-stone-200/70 pt-1 text-sm">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleLikePost(post.id)
                        }}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-medium transition duration-200 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed ${
                          likedPostIds[String(post.id)]
                            ? 'border border-amber-200 bg-amber-50 text-amber-700'
                            : 'border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950'
                        }`}
                      >
                        <HeartIcon size={16} />
                        <span>{post.engagement.likes}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleCopyLink(post)
                        }}
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100"
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleSharePost(post)
                        }}
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-100"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </article>
              ))}
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
  )
}

export default Posts
