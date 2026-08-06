import fs from 'fs'
import path from 'path'
import { getLiveRankings } from './rankings'

const DATA_PATH = path.join(process.cwd(), 'public', 'data', 'offers.json')
const ARTICLES_DIR = path.join(process.cwd(), 'public', 'articles')
const DAY_MS = 24 * 60 * 60 * 1000

let cachedFile = null
let cachedPipeline = null

function loadOffersFile() {
  if (cachedFile) return cachedFile
  if (!fs.existsSync(DATA_PATH)) {
    cachedFile = {
      epochSunday: '2026-07-26',
      timezone: 'America/New_York',
      pipelineArticle: '2026-big-calls',
      offers: [],
    }
    return cachedFile
  }
  cachedFile = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  return cachedFile
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number)
  return Date.UTC(y, m - 1, d, 12, 0, 0)
}

function toZonedYmd(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

function sundayOnOrBefore(ymd) {
  const ms = parseYmd(ymd)
  const day = new Date(ms).getUTCDay()
  return ms - day * DAY_MS
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findPlayerByName(name) {
  const target = normalizeName(name)
  if (!target) return null
  const players = getLiveRankings()
  return (
    players.find((p) => normalizeName(p.name) === target) ||
    players.find((p) => {
      const n = normalizeName(p.name)
      return n.includes(target) || target.includes(n)
    }) ||
    null
  )
}

function compactText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function firstSentences(text, max = 2) {
  const clean = compactText(text).replace(/\n+/g, ' ')
  const parts = clean.split(/(?<=[.!?])\s+/).filter(Boolean)
  return parts.slice(0, max).join(' ')
}

function getArticlePipeline() {
  if (cachedPipeline) return cachedPipeline

  const { pipelineArticle = '2026-big-calls' } = loadOffersFile()
  const file = path.join(ARTICLES_DIR, `${pipelineArticle}.md`)
  if (!fs.existsSync(file)) {
    cachedPipeline = []
    return cachedPipeline
  }

  const raw = fs.readFileSync(file, 'utf8')
  const sections = raw.split(/^## Call\s+\d+:/im).slice(1)
  const headers = [...raw.matchAll(/^## Call\s+(\d+):\s*(.+)$/gim)]

  const pipeline = []
  headers.forEach((match, i) => {
    const callNum = Number(match[1])
    const headline = String(match[2] || '').trim()
    const nameMatch = headline.match(/^(.+?)\s+is\s+/i)
    if (!nameMatch) return

    const playerName = nameMatch[1].trim()
    const body = sections[i] || ''
    const callLine = body.match(/\*\*The call:\*\*\s*(.+)/i)?.[1]?.trim()
    const player = findPlayerByName(playerName)

    const paragraphs = compactText(body)
      .split(/\n{2,}/)
      .map((p) => p.replace(/^#+\s*.*$/m, '').replace(/\*.*?\*/g, '').trim())
      .filter((p) => p && !p.startsWith('**The call'))

    const marketPara = paragraphs.find((p) => /market/i.test(p)) || paragraphs[1] || paragraphs[0]
    const modelPara =
      paragraphs.find((p) => /model|applies|situation|projected/i.test(p) && p !== marketPara) ||
      paragraphs[2] ||
      paragraphs[1]

    pipeline.push({
      week: callNum,
      player: player?.name || playerName,
      position: player?.position || guessPosition(headline, callLine),
      team: player?.team || '—',
      blurb: buildBlurb(player, callLine, firstSentences(marketPara, 1)),
      body: firstSentences(modelPara || marketPara, 2),
      articleSlug: pipelineArticle,
      source: 'pipeline',
    })
  })

  cachedPipeline = pipeline
  return cachedPipeline
}

function guessPosition(headline, callLine) {
  const fromCall = String(callLine || '').match(/\b(QB|RB|WR|TE)\d*\b/i)
  if (fromCall) return fromCall[1].toUpperCase()
  const fromHead = String(headline || '').match(
    /\b(quarterback|running back|wide receiver|tight end|QB|RB|WR|TE)\b/i,
  )
  if (!fromHead) return '—'
  const t = fromHead[1].toLowerCase()
  if (t.startsWith('quarter') || t === 'qb') return 'QB'
  if (t.startsWith('running') || t === 'rb') return 'RB'
  if (t.startsWith('wide') || t === 'wr') return 'WR'
  if (t.startsWith('tight') || t === 'te') return 'TE'
  return fromHead[1].toUpperCase()
}

function formatPosRank(position, rank) {
  if (!position || rank == null || !Number.isFinite(Number(rank))) return null
  return `${position}${Math.round(Number(rank))}`
}

function buildBlurb(player, callLine, fallback) {
  if (player?.ourPositionalRank != null && player?.consensusAdpPositional != null) {
    const ours = formatPosRank(player.position, player.ourPositionalRank)
    const market = formatPosRank(player.position, player.consensusAdpPositional)
    if (ours && market && ours !== market) {
      return `The market has him ${market}. We have him ${ours}.`
    }
  }
  if (callLine) return callLine.replace(/\.$/, '') + '.'
  return fallback || 'One call. The data is confident.'
}

function buildRankingsBlurb(player) {
  const ours = formatPosRank(player.position, player.ourPositionalRank)
  const market = formatPosRank(player.position, player.consensusAdpPositional)
  if (ours && market) return `The market has him ${market}. We have him ${ours}.`
  if (player.tier && player.tier !== '—') {
    return `${player.tier} tier. Overall board rank ${player.csvOverallRank ?? player.overall_rank}.`
  }
  return 'The model sees value the market is still pricing wrong.'
}

function buildRankingsBody(player) {
  const gap = player.adpDiffPositional
  if (gap != null && Number.isFinite(gap) && gap !== 0) {
    const direction = gap > 0 ? 'above' : 'below'
    return `Largest available model-vs-market gap this week: ${Math.abs(gap)} spots ${direction} consensus at the position. Draft accordingly.`
  }
  if (player.adpSignal === 'BUY') {
    return 'Marked BUY vs consensus ADP. The board says take him before the market catches up.'
  }
  return 'Auto-selected as this week’s strongest unused edge on the live board.'
}

function playerKey(offerOrPlayer) {
  return normalizeName(offerOrPlayer?.player || offerOrPlayer?.name)
}

function getCuratedByWeek() {
  const map = new Map()
  for (const offer of loadOffersFile().offers || []) {
    map.set(Number(offer.week), { ...offer, source: 'curated' })
  }
  return map
}

function getRankingsCandidates() {
  const players = getLiveRankings().filter((p) => p.name)
  const withBuy = players.filter((p) => p.adpSignal === 'BUY' && p.adpDiffPositional != null)
  if (withBuy.length) {
    return [...withBuy].sort(
      (a, b) => (b.adpDiffPositional ?? 0) - (a.adpDiffPositional ?? 0),
    )
  }

  const withGap = players.filter(
    (p) =>
      p.adpDiffPositional != null &&
      Number.isFinite(p.adpDiffPositional) &&
      p.adpDiffPositional > 0,
  )
  if (withGap.length) {
    return [...withGap].sort((a, b) => b.adpDiffPositional - a.adpDiffPositional)
  }

  return players
    .filter((p) => String(p.tier).toLowerCase() === 'elite')
    .sort(
      (a, b) =>
        (a.csvOverallRank ?? a.overall_rank ?? 999) -
        (b.csvOverallRank ?? b.overall_rank ?? 999),
    )
}

function offerFromPlayer(player, week, source = 'rankings') {
  return {
    week,
    player: player.name,
    position: player.position || '—',
    team: player.team || '—',
    blurb: buildRankingsBlurb(player),
    body: buildRankingsBody(player),
    articleSlug: null,
    source,
  }
}

/**
 * Resolve offer for a specific week.
 * Priority: curated JSON → article pipeline → rankings auto.
 * Never repeats a player already used in an earlier week.
 */
export function resolveOfferForWeek(week) {
  const w = Number(week)
  if (!Number.isFinite(w) || w < 1) return null

  const curated = getCuratedByWeek()
  const pipeline = getArticlePipeline()
  const used = new Set()

  let resolved = null
  for (let i = 1; i <= w; i++) {
    let pick = curated.get(i) || null

    if (!pick) {
      const unusedPipeline = pipeline.filter((p) => !used.has(playerKey(p)))
      pick = unusedPipeline.find((p) => p.week === i) || unusedPipeline[0] || null
    }

    if (!pick) {
      const candidate = getRankingsCandidates().find((p) => !used.has(playerKey(p)))
      if (candidate) pick = offerFromPlayer(candidate, i)
    }

    if (!pick) {
      resolved = null
      continue
    }

    const normalized = {
      ...pick,
      week: i,
      player: pick.player,
      position: pick.position,
      team: pick.team,
    }
    used.add(playerKey(normalized))
    if (i === w) resolved = normalized
  }

  return resolved
}

export function getOfferWeekNumber(now = new Date()) {
  const { epochSunday, timezone = 'America/New_York' } = loadOffersFile()
  const todayYmd = toZonedYmd(now, timezone)
  const thisSunday = sundayOnOrBefore(todayYmd)
  const epoch = parseYmd(epochSunday)
  if (thisSunday < epoch) return 1
  return Math.floor((thisSunday - epoch) / (7 * DAY_MS)) + 1
}

export function getAllOffers(now = new Date()) {
  const current = getOfferWeekNumber(now)
  const maxPipeline = Math.max(
    0,
    ...getArticlePipeline().map((p) => p.week),
    ...[...getCuratedByWeek().keys()],
  )
  const through = Math.max(current, maxPipeline)
  const list = []
  for (let w = 1; w <= through; w++) {
    const offer = resolveOfferForWeek(w)
    if (offer) list.push(offer)
  }
  return list
}

export function getOfferByWeek(week) {
  return resolveOfferForWeek(week)
}

export function getCurrentOffer(now = new Date()) {
  const week = getOfferWeekNumber(now)
  const offer = resolveOfferForWeek(week)
  if (!offer) return null
  return { ...offer, offerWeek: week, isLive: true }
}

export function getOfferHistory(now = new Date()) {
  const week = getOfferWeekNumber(now)
  const list = []
  for (let w = 1; w < week; w++) {
    const offer = resolveOfferForWeek(w)
    if (offer) list.push(offer)
  }
  return list.sort((a, b) => b.week - a.week)
}

export function formatOfferTitle(offer) {
  if (!offer) return ''
  return `${offer.player}, ${offer.position} — ${offer.team}`
}
