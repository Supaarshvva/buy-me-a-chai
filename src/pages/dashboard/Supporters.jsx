import { useState } from 'react'
import { CoffeeIcon } from '../../components/icons/AppIcons.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useCreatorSupporters from '../../hooks/useCreatorSupporters.js'
import { formatRelativeTime } from '../../services/creatorStorage.js'
import { formatCurrency } from '../../services/currency.js'
import {
  formatSupportActivity,
  getSupporterDisplayName,
} from '../../services/supportService.js'

const avatarColorClasses = [
  'bg-amber-100 text-amber-800',
  'bg-orange-100 text-orange-800',
  'bg-stone-200 text-stone-800',
  'bg-rose-100 text-rose-800',
  'bg-lime-100 text-lime-800',
]

function getAvatarColorClass(name) {
  const hash = name.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return avatarColorClasses[hash % avatarColorClasses.length]
}

function Supporters() {
  const { profile } = useAuth()
  const [copyStatus, setCopyStatus] = useState('Copy Public Link')

  const username = profile?.username?.trim() || ''
  const { supporters, totalAmount, totalSupporters } = useCreatorSupporters(username)
  const publicProfileLink = username
    ? `${window.location.origin}/${username}`
    : ''

  const handleCopyLink = async () => {
    if (!publicProfileLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(publicProfileLink)
      setCopyStatus('Copied!')
      window.setTimeout(() => setCopyStatus('Copy Public Link'), 2000)
    } catch {
      setCopyStatus('Copy failed')
      window.setTimeout(() => setCopyStatus('Copy Public Link'), 2000)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-xl shadow-stone-900/5">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
              Supporters Stats
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
              Your supporter overview
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-stone-600">
              Track how many people have supported your page and how much they have
              contributed so far.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-[28px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-amber-50 p-5 shadow-lg shadow-stone-900/5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                Total Supporters
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {totalSupporters}
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Everyone who has sent you support will appear here.
              </p>
            </article>

            <article className="rounded-[28px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-amber-50 p-5 shadow-lg shadow-stone-900/5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                Supporters Earnings
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {formatCurrency(totalAmount)}
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Total earnings received from supporters on your public page.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-xl shadow-stone-900/5">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
              Supporters List
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
              Recent supporters
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-stone-600">
              See the latest people who have supported your work and the messages they
              left for you.
            </p>
          </div>

          {supporters.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-12 text-center">
              <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                No supporters yet
              </h3>
              <p className="mt-3 max-w-md text-base leading-7 text-stone-600">
                Share your page to start receiving support
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!publicProfileLink}
                className="mt-6 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {copyStatus}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {supporters.map((supporter) => {
                const displayName = getSupporterDisplayName(supporter.name)
                const initials = displayName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? '')
                  .join('')
                  || 'S'

                return (
                  <article
                    key={supporter.id}
                    className="rounded-[28px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-white p-6 shadow-lg shadow-stone-900/5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm ${getAvatarColorClass(displayName)}`}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <h3 className="text-xl font-semibold tracking-tight text-stone-950">
                              {displayName}
                            </h3>
                            <p className="text-sm text-stone-500">
                              {formatRelativeTime(supporter.createdAt)}
                            </p>
                          </div>

                          <div className="mt-3 flex max-w-2xl items-start gap-2 text-sm font-medium leading-7 text-stone-700">
                            <CoffeeIcon size={16} className="mt-1 shrink-0 text-amber-700" />
                            <p>{formatSupportActivity(supporter)}</p>
                          </div>

                          {supporter.message ? (
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                              {supporter.message}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="pl-16 sm:pl-0 sm:text-right">
                        <p className="text-2xl font-semibold tracking-tight text-stone-950">
                          {formatCurrency(supporter.amount)}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Supporters
