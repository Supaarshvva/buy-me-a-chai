import { loadStoredSupporters, saveStoredSupporters } from './creatorStorage.js'

const SUPPORTERS_STORAGE_PREFIX = 'buy-me-a-chai:supporters'
const SUPPORTERS_UPDATED_EVENT = 'buy-me-a-chai:supporters-updated'
const CHAI_PRICE_IN_RUPEES = 10

function getCreatorSupportScope(username) {
  return typeof username === 'string' ? username.trim() : ''
}

function getSupportersStorageKey(username) {
  const scope = getCreatorSupportScope(username)
  return `${SUPPORTERS_STORAGE_PREFIX}:${scope || 'local'}`
}

function getSupporterDisplayName(name) {
  return typeof name === 'string' && name.trim() ? name.trim() : 'Someone'
}

function formatSupportActivity(supporter) {
  const displayName = getSupporterDisplayName(supporter?.name)
  const cupCount = Number.isFinite(supporter?.cups) && supporter.cups > 0
    ? supporter.cups
    : Math.max(1, Math.round((supporter?.amount || 0) / CHAI_PRICE_IN_RUPEES))

  return `${displayName} bought ${cupCount} chai`
}

function loadCreatorSupporters(username) {
  const scope = getCreatorSupportScope(username)

  if (!scope) {
    return []
  }

  return loadStoredSupporters(scope)
}

function getCreatorSupportSummary(username) {
  const supporters = loadCreatorSupporters(username)
  const totalAmount = supporters.reduce(
    (sum, supporter) => sum + (Number.isFinite(supporter.amount) ? supporter.amount : 0),
    0
  )

  return {
    supporters,
    totalAmount,
    totalSupporters: supporters.length,
  }
}

function notifySupportersUpdated(username) {
  const scope = getCreatorSupportScope(username)

  if (!scope || typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(SUPPORTERS_UPDATED_EVENT, {
      detail: { scope },
    })
  )
}

function createSupportRecord({
  amount,
  creatorUsername,
  cups,
  message = '',
  supporterName = '',
  timestamp = Date.now(),
}) {
  const scope = getCreatorSupportScope(creatorUsername)

  if (!scope) {
    throw new Error('Missing creator username for support record')
  }

  const nextSupporter = {
    id: timestamp,
    name: supporterName.trim(),
    creatorUsername: scope,
    cups,
    amount,
    message: message.trim(),
    monthly: false,
    createdAt: timestamp,
  }

  const currentSupporters = loadCreatorSupporters(scope)
  const nextSupporters = [nextSupporter, ...currentSupporters]

  saveStoredSupporters(scope, nextSupporters)
  notifySupportersUpdated(scope)

  return nextSupporter
}

async function completeSupport({
  amount,
  creatorId,
  creatorUsername,
  cups,
  message = '',
  supporterName = '',
  timestamp = Date.now(),
}) {
  const supportRecord = createSupportRecord({
    amount,
    creatorUsername,
    cups,
    message,
    supporterName,
    timestamp,
  })

  return supportRecord
}

function subscribeToCreatorSupportUpdates(username, onUpdate) {
  const scope = getCreatorSupportScope(username)

  if (!scope || typeof window === 'undefined') {
    return () => {}
  }

  const handleSupportersUpdated = (event) => {
    if (event.detail?.scope === scope) {
      onUpdate()
    }
  }

  const handleStorage = (event) => {
    if (!event.key || event.key === getSupportersStorageKey(scope)) {
      onUpdate()
    }
  }

  window.addEventListener(SUPPORTERS_UPDATED_EVENT, handleSupportersUpdated)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(SUPPORTERS_UPDATED_EVENT, handleSupportersUpdated)
    window.removeEventListener('storage', handleStorage)
  }
}

export {
  CHAI_PRICE_IN_RUPEES,
  completeSupport,
  createSupportRecord,
  formatSupportActivity,
  getCreatorSupportScope,
  getCreatorSupportSummary,
  getSupporterDisplayName,
  loadCreatorSupporters,
  notifySupportersUpdated,
  subscribeToCreatorSupportUpdates,
}
