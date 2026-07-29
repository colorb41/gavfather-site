import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const RANKINGS_DIR = path.join(process.cwd(), 'public', 'rankings')
const LIVE_RANKINGS_FILE = 'live_rankings.csv'
const META_PATHS = [
  path.join(process.cwd(), 'public', 'data', 'meta.json'),
  path.join(process.cwd(), 'data', 'meta.json'),
]

/**
 * Publish metadata from public/data/meta.json.
 */
export function getPublishMeta() {
  for (const filePath of META_PATHS) {
    try {
      if (!fs.existsSync(filePath)) continue
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
      // try next
    }
  }
  return null
}

function num(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function str(value) {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

function livePath() {
  return path.join(RANKINGS_DIR, LIVE_RANKINGS_FILE)
}

export function liveRankingsExists() {
  return fs.existsSync(livePath())
}

/**
 * Map a live_rankings.csv row to the board player object.
 * score === projected_ppg (never edge score).
 */
function normalizeLiveRow(row, index) {
  const projectedPpg = num(row.projected_ppg, 0) ?? 0
  const liveStatus = str(row.live_status || row.Injury_Flag || row.injury_flag)
  const tier = str(row.tier) || '—'
  const reliability = str(row.reliability_tier) || '—'

  return {
    rank: num(row.overall_rank, index + 1) ?? index + 1,
    name: str(row.player_name),
    team: str(row.recent_team || row.team).toUpperCase(),
    position: str(row.position).toUpperCase(),
    // Main score column — projected PPG only
    score: projectedPpg,
    projectedPpg,
    scoreLabel: projectedPpg.toFixed(1),
    reliability,
    situation: num(row.situation_score, null),
    careerSeasons: num(row.career_seasons, 0) ?? 0,
    tier,
    injury: liveStatus,
    liveStatus,
    age: num(row.age, null),
    basis: str(row.data_basis || row.projection_basis),
    draftValueScore: num(row.draft_value_score, projectedPpg) ?? projectedPpg,
    // aliases used by older board code
    finalScore: projectedPpg,
    outlook: tier.toUpperCase().replace(/\s+/g, '_'),
    reliabilityTier: reliability,
    situationScore: num(row.situation_score, null),
    dataBasis: str(row.data_basis || row.projection_basis),
  }
}

function readLiveCsv() {
  const fullPath = livePath()
  if (!fs.existsSync(fullPath)) return []
  const raw = fs.readFileSync(fullPath, 'utf8')
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  if (parsed.errors?.length) {
    console.warn('[rankings] live_rankings parse warnings:', parsed.errors.slice(0, 3))
  }

  const players = (parsed.data || [])
    .map(normalizeLiveRow)
    .filter((p) => p.name)

  // Sort by overall_rank ascending (1 = best)
  players.sort((a, b) => a.rank - b.rank)

  // Assign positional ranks by projected PPG within each position
  const byPos = { QB: [], RB: [], WR: [], TE: [] }
  for (const p of players) {
    if (byPos[p.position]) byPos[p.position].push(p)
  }
  for (const pos of Object.keys(byPos)) {
    const group = [...byPos[pos]].sort((a, b) => b.projectedPpg - a.projectedPpg)
    group.forEach((p, i) => {
      p.positionalRank = i + 1
    })
  }

  return players
}

/**
 * Primary loader — always reads public/rankings/live_rankings.csv
 */
export function getLiveRankings() {
  return readLiveCsv()
}

/**
 * Main data loading function used by the rankings page.
 * Always prefers live_rankings.csv.
 */
export function getRankingsByWeek(_week, _format = 'half_ppr', _year) {
  return getLiveRankings()
}

/**
 * Elite tier smash list for homepage / cards.
 */
export function getTopPlays(_week, n = 5) {
  return getLiveRankings()
    .filter((p) => String(p.tier).toLowerCase() === 'elite')
    .sort((a, b) => b.projectedPpg - a.projectedPpg)
    .slice(0, n)
}

/**
 * Position board sorted by overall_rank (then positional PPG rank).
 */
export function getByPosition(position) {
  const pos = String(position || '').toUpperCase()
  return getLiveRankings()
    .filter((p) => p.position === pos)
    .sort((a, b) => a.rank - b.rank)
}

/**
 * Freemium preview: top 10 per position = 40 players.
 */
export function getPreviewPlayers() {
  const all = getLiveRankings()
  const kept = []
  for (const pos of ['QB', 'RB', 'WR', 'TE']) {
    const subset = all
      .filter((p) => p.position === pos)
      .sort((a, b) => (a.positionalRank || a.rank) - (b.positionalRank || b.rank))
      .slice(0, 10)
    kept.push(...subset)
  }
  return kept.sort((a, b) => a.rank - b.rank)
}

/** @deprecated alias — prefer getPreviewPlayers */
export function applyFreemiumGate(players, isLoggedIn = false) {
  if (isLoggedIn) return players
  if (!Array.isArray(players) || !players.length) return getPreviewPlayers()
  const kept = []
  for (const pos of ['QB', 'RB', 'WR', 'TE']) {
    kept.push(
      ...players
        .filter((p) => p.position === pos)
        .sort((a, b) => (a.positionalRank || a.rank) - (b.positionalRank || b.rank))
        .slice(0, 10),
    )
  }
  return kept.sort((a, b) => a.rank - b.rank)
}

export function getLatestWeek() {
  const meta = getPublishMeta()
  if (meta && Number.isFinite(Number(meta.week))) return Number(meta.week)
  return 0
}

export function getYearForWeek(_week) {
  const meta = getPublishMeta()
  if (meta && Number.isFinite(Number(meta.year))) return Number(meta.year)
  return 2026
}

export function isPreseasonWeek(week) {
  return Number(week) === 0
}

export function formatWeekLabel(week, year) {
  if (isPreseasonWeek(week)) return `${year} Preseason Rankings`
  return `Week ${week} (${year})`
}

export function formatWeekShort(week) {
  if (isPreseasonWeek(week)) return 'Preseason 2026'
  return `Week ${week}`
}

export function getAllWeeks() {
  const year = getYearForWeek(0)
  return [
    {
      week: 0,
      year,
      formats: ['half_ppr', 'ppr', 'standard', 'superflex'],
      label: formatWeekLabel(0, year),
      source: LIVE_RANKINGS_FILE,
    },
  ]
}

/**
 * File date for "Updated …" label — live_rankings.csv mtime preferred.
 */
export function getRankingsUpdatedAt(_week, _format, _year) {
  if (liveRankingsExists()) {
    return fs.statSync(livePath()).mtime.toISOString()
  }
  const meta = getPublishMeta()
  return meta?.last_updated ? String(meta.last_updated) : null
}

export function getTopFades(_week, n = 5) {
  return getLiveRankings()
    .filter((p) => /fade|avoid|streamable/i.test(String(p.tier)))
    .sort((a, b) => a.projectedPpg - b.projectedPpg)
    .slice(0, n)
}
