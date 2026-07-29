import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import {
  rankPlayersByFormat,
  normalizeScoringFormat,
  FORMAT_META,
} from './rankPlayersByFormat'

export {
  rankPlayersByFormat,
  normalizeScoringFormat,
  FORMAT_META,
  FORMAT_IDS,
  SCORE_COLUMN,
  DRAFT_VALUE_COLUMN,
  previewIdsFromRanked,
} from './rankPlayersByFormat'

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
 *
 * Reads per-format columns:
 *   projected_ppg_std / half_ppr / ppr  → displayed Proj PPG
 *   draft_value_score_std / half_ppr / ppr → overall board sort key
 *
 * Default format = Standard (std).
 */
function normalizeLiveRow(row, index) {
  const legacyPpg = num(row.projected_ppg, null)
  const legacyDraft = num(row.draft_value_score, null)

  const projected_ppg = legacyPpg ?? 0
  const projected_ppg_std = num(row.projected_ppg_std, null) ?? legacyPpg ?? 0
  const projected_ppg_half_ppr =
    num(row.projected_ppg_half_ppr, null) ?? legacyPpg ?? 0
  const projected_ppg_ppr = num(row.projected_ppg_ppr, null) ?? legacyPpg ?? 0

  const draft_value_score = legacyDraft ?? projected_ppg_std
  const draft_value_score_std =
    num(row.draft_value_score_std, null) ?? legacyDraft ?? projected_ppg_std
  const draft_value_score_half_ppr =
    num(row.draft_value_score_half_ppr, null) ??
    legacyDraft ??
    projected_ppg_half_ppr
  const draft_value_score_ppr =
    num(row.draft_value_score_ppr, null) ?? legacyDraft ?? projected_ppg_ppr

  // Default board = Standard
  const projectedPpg = projected_ppg_std
  const draftValueScore = draft_value_score_std

  const liveStatus = str(row.live_status || row.Injury_Flag || row.injury_flag)
  const tier = str(row.tier) || '—'
  const reliability = str(row.reliability_tier) || '—'

  return {
    rank: num(row.overall_rank, index + 1) ?? index + 1,
    overall_rank: num(row.overall_rank, index + 1) ?? index + 1,
    name: str(row.player_name),
    team: str(row.recent_team || row.team).toUpperCase(),
    position: str(row.position).toUpperCase(),

    // Base PPG used for format-invariant positional ranks
    projected_ppg,

    // Per-format display PPG (Proj PPG column)
    projected_ppg_std,
    projected_ppg_half_ppr,
    projected_ppg_ppr,

    // Per-format draft value (overall board sort key)
    draft_value_score,
    draft_value_score_std,
    draft_value_score_half_ppr,
    draft_value_score_ppr,

    // CamelCase mirrors
    projectedPpgStd: projected_ppg_std,
    projectedPpgHalfPpr: projected_ppg_half_ppr,
    projectedPpgPpr: projected_ppg_ppr,
    draftValueScoreStd: draft_value_score_std,
    draftValueScoreHalfPpr: draft_value_score_half_ppr,
    draftValueScorePpr: draft_value_score_ppr,

    // Active display fields (Standard by default — overwritten by rankPlayersByFormat)
    score: projectedPpg,
    projectedPpg,
    scoreLabel: projectedPpg.toFixed(1),
    draftValueScore,
    finalScore: projectedPpg,

    reliability,
    situation: num(row.situation_score, null),
    careerSeasons: num(row.career_seasons, 0) ?? 0,
    tier,
    injury: liveStatus,
    liveStatus,
    age: num(row.age, null),
    basis: str(row.data_basis || row.projection_basis),
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

  // Default format = std → sort by draft_value_score_std
  return rankPlayersByFormat(players, 'std', { superflex: false })
}

/**
 * Primary loader — always reads public/rankings/live_rankings.csv
 * Returns players ranked for Standard (draft_value_score_std).
 */
export function getLiveRankings() {
  return readLiveCsv()
}

/**
 * Load live rankings and re-rank for the requested scoring format.
 * Default format = 'std'.
 */
export function getRankingsByWeek(_week, format = 'std', _year, options = {}) {
  // Read raw rows without the std pre-rank so format sort is authoritative
  const fullPath = livePath()
  if (!fs.existsSync(fullPath)) return []
  const raw = fs.readFileSync(fullPath, 'utf8')
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  const players = (parsed.data || [])
    .map(normalizeLiveRow)
    .filter((p) => p.name)

  const fmt = normalizeScoringFormat(format || 'std')
  const superflex = Boolean(options.superflex)
  return rankPlayersByFormat(players, fmt, { superflex })
}

/**
 * Elite tier smash list for homepage / cards.
 */
export function getTopPlays(_week, n = 5) {
  return getLiveRankings()
    .filter((p) => String(p.tier).toLowerCase() === 'elite')
    .sort((a, b) => a.rank - b.rank)
    .slice(0, n)
}

/**
 * Position board sorted by overall_rank (draft-value order for std).
 */
export function getByPosition(position) {
  const pos = String(position || '').toUpperCase()
  return getLiveRankings()
    .filter((p) => p.position === pos)
    .sort((a, b) => (a.positionalRank || a.rank) - (b.positionalRank || b.rank))
}

/**
 * Freemium preview — overall top 20 is the primary free hook.
 */
export function getPreviewPlayers() {
  return getLiveRankings()
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 20)
}

/**
 * Server-side freemium slice.
 * ALL / default → top 20 overall.
 * Pass position=QB|RB|WR|TE → top 5 at that position.
 */
export function applyFreemiumGate(players, isLoggedIn = false, position = 'ALL') {
  if (isLoggedIn) return players
  const list = Array.isArray(players) && players.length ? players : getLiveRankings()
  const pos = String(position || 'ALL').toUpperCase()
  if (pos === 'ALL') {
    return list
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 20)
  }
  return list
    .filter((p) => p.position === pos)
    .sort((a, b) => (a.positionalRank || a.rank) - (b.positionalRank || b.rank))
    .slice(0, 5)
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
      formats: ['std', 'half_ppr', 'ppr'],
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
    .sort((a, b) => b.rank - a.rank)
    .slice(0, n)
}

/** Badge / header label for a scoring format */
export function formatBadgeLabel(format) {
  const fmt = normalizeScoringFormat(format)
  return FORMAT_META[fmt]?.badge || 'STANDARD'
}
