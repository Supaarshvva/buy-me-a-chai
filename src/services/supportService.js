import supabase from './supabase.js'

const CHAI_PRICE_IN_RUPEES = 10

/**
 * Parse a Supabase timestamp string as UTC.
 * Supabase may return timestamps without timezone info (e.g. "2026-04-20T16:40:00")
 * which JavaScript's Date() would interpret as local time. This helper ensures
 * such timestamps are always treated as UTC.
 */
function parseTimestampUtc(value) {
  if (!value) return Date.now()
  const str = String(value).trim()
  // Check if the string already has timezone info (Z, +HH:MM, -HH:MM)
  const hasTz = str.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(str)
  const ms = new Date(hasTz ? str : `${str}Z`).getTime()
  return Number.isFinite(ms) ? ms : Date.now()
}

function getSupporterDisplayName(name) {
  return typeof name === 'string' && name.trim() ? name.trim() : 'Someone'
}

function formatSupportActivity(supporter) {
  const displayName = getSupporterDisplayName(supporter?.supporter_name ?? supporter?.name)
  const cupCount = Number.isFinite(supporter?.cups) && supporter.cups > 0
    ? supporter.cups
    : Math.max(1, Math.round((supporter?.amount || 0) / CHAI_PRICE_IN_RUPEES))

  return `${displayName} bought ${cupCount} chai`
}

/**
 * Fetch all supports for a given creator by their user ID.
 * RLS policy: SELECT allowed when auth.uid() = creator_id OR supporter_id.
 */
async function fetchSupportsByCreatorId(creatorId) {
  if (!creatorId) {
    return []
  }

  const { data, error } = await supabase
    .from('supports')
    .select('id, creator_id, supporter_id, amount, cups, reference_number, supporter_name, message, created_at')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[supportService] fetchSupportsByCreatorId error:', error.message)
    return []
  }

  return (data ?? []).map(normalizeSupportRow)
}

/**
 * Fetch all supports given by a specific supporter.
 * RLS policy: SELECT allowed when auth.uid() = supporter_id.
 */
async function fetchSupportsBySupporterId(supporterId) {
  if (!supporterId) {
    return []
  }

  const { data, error } = await supabase
    .from('supports')
    .select('id, creator_id, supporter_id, amount, cups, reference_number, supporter_name, message, created_at')
    .eq('supporter_id', supporterId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[supportService] fetchSupportsBySupporterId error:', error.message)
    return []
  }

  return (data ?? []).map(normalizeSupportRow)
}

/**
 * Insert a support record into Supabase.
 * RLS policy: INSERT allowed when auth.uid() = supporter_id.
 */
async function insertSupport({
  creatorId,
  supporterId,
  amount,
  cups,
  referenceNumber,
  supporterName = '',
  message = '',
}) {
  if (!creatorId || !supporterId) {
    console.error('[supportService] insertSupport: missing creatorId or supporterId')
    return null
  }

  const { data, error } = await supabase
    .from('supports')
    .insert({
      creator_id: creatorId,
      supporter_id: supporterId,
      amount,
      cups,
      reference_number: referenceNumber,
      supporter_name: (supporterName || '').trim(),
      message: (message || '').trim(),
    })
    .select('id, creator_id, supporter_id, amount, cups, reference_number, supporter_name, message, created_at')
    .single()

  if (error) {
    console.error('[supportService] insertSupport error:', error.message, error)
    throw error
  }

  return normalizeSupportRow(data)
}

/**
 * Fetch supports for a creator, accessible by ANY authenticated user.
 * Uses the get_creator_supports RPC function (SECURITY DEFINER) which
 * bypasses RLS. Falls back to direct query if the RPC doesn't exist
 * (works when the viewer IS the creator).
 */
async function fetchCreatorSupportsPublic(creatorId) {
  if (!creatorId) return []

  // Try RPC first (works for any viewer)
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_creator_supports', { target_creator_id: creatorId })

  if (!rpcError && Array.isArray(rpcData)) {
    return rpcData.map(normalizeSupportRow)
  }

  if (rpcError) {
    console.warn('[supportService] get_creator_supports RPC not available, falling back to direct query:', rpcError.message)
  }

  // Fallback: direct query (only works when auth.uid() = creator_id per RLS)
  return fetchSupportsByCreatorId(creatorId)
}

/**
 * Fetch aggregate support counts for ALL creators in a single query.
 * Uses the get_creator_support_counts RPC function (SECURITY DEFINER).
 * Returns a Map<creatorId, { supporterCount, totalAmount }>.
 */
async function fetchAllCreatorSupportCounts() {
  const { data, error } = await supabase.rpc('get_creator_support_counts')

  if (error || !Array.isArray(data)) {
    console.warn('[supportService] get_creator_support_counts RPC not available:', error?.message)
    return new Map()
  }

  const map = new Map()
  for (const row of data) {
    map.set(row.creator_id, {
      supporterCount: Number(row.supporter_count) || 0,
      totalAmount: Number(row.total_amount) || 0,
    })
  }
  return map
}

/**
 * Compute summary totals from a list of support records.
 */
function computeSupportSummary(supporters) {
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

/**
 * Normalize a Supabase support row to a consistent shape used by the UI.
 */
function normalizeSupportRow(row) {
  const createdAtMs = parseTimestampUtc(row?.created_at)

  return {
    id: row?.id ?? '',
    creatorId: row?.creator_id ?? '',
    supporterId: row?.supporter_id ?? '',
    amount: Number.isFinite(row?.amount) ? row.amount : 0,
    cups: Number.isFinite(row?.cups) ? row.cups : 0,
    referenceNumber: row?.reference_number ?? '',
    supporter_name: row?.supporter_name ?? '',
    name: row?.supporter_name ?? '',
    message: row?.message ?? '',
    createdAt: createdAtMs,
    created_at: row?.created_at ?? '',
  }
}

export {
  CHAI_PRICE_IN_RUPEES,
  computeSupportSummary,
  fetchAllCreatorSupportCounts,
  fetchCreatorSupportsPublic,
  fetchSupportsByCreatorId,
  fetchSupportsBySupporterId,
  formatSupportActivity,
  getSupporterDisplayName,
  insertSupport,
  normalizeSupportRow,
}
