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
const WEEKLY_RANKINGS_FILE = 'weekly_rankings.csv'
const BOARD_IDS = ['weekly', 'ros']
const META_PATHS = [
  path.join(process.cwd(), 'public', 'data', 'meta.json'),
  path.join(process.cwd(), 'data', 'meta.json'),
]

/** Normalize URL / meta board id → weekly | ros */
export function normalizeBoard(raw, { week } = {}) {
  const b = String(raw || '').toLowerCase().replace(/-/g, '_')
  if (b === 'weekly' || b === 'week' || b === 'this_week') return 'weekly'
  if (b === 'ros' || b === 'rest_of_season' || b === 'season' || b === 'rest') {
    return 'ros'
  }
  // Default: in-season → weekly, otherwise ROS
  const w = Number(week ?? getLatestWeek())
  return Number.isFinite(w) && w >= 1 ? 'weekly' : 'ros'
}

export function boardLabel(board, week, year) {
  const b = normalizeBoard(board, { week })
  if (b === 'weekly') {
    const w = Number(week ?? getLatestWeek())
    return Number.isFinite(w) && w >= 1
      ? `Week ${w} Rankings`
      : 'Weekly Rankings'
  }
  return `${year || getYearForWeek(0)} Rest of Season`
}

export function boardShortLabel(board, week) {
  const b = normalizeBoard(board, { week })
  if (b === 'weekly') {
    const w = Number(week ?? getLatestWeek())
    return Number.isFinite(w) && w >= 1 ? `Week ${w}` : 'Weekly'
  }
  return 'Rest of Season'
}

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

function weeklyPath() {
  return path.join(RANKINGS_DIR, WEEKLY_RANKINGS_FILE)
}

export function liveRankingsExists() {
  return fs.existsSync(livePath())
}

export function weeklyRankingsExists() {
  return fs.existsSync(weeklyPath())
}

export function availableBoards() {
  const boards = []
  if (weeklyRankingsExists()) boards.push('weekly')
  if (liveRankingsExists()) boards.push('ros')
  return boards.length ? boards : BOARD_IDS.filter((id) => id === 'ros')
}

/**
 * Map a live_rankings.csv row to the board player object.
 *
 * Reads per-format columns:
 *   projected_ppg_std / half_ppr / ppr  → displayed Proj PPG
 *   draft_value_score_std / half_ppr / ppr → half/ppr board sort key
 *   overall_rank → standard board order (authoritative for std)
 *
 * Default format = Standard (std).
 */
function normalizeLiveRow(row, index) {
  const legacyPpg = num(row.projected_ppg ?? row.Proj_PPG ?? row.proj_ppg, null)
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

  const liveStatus = str(
    row.live_status || row.Live_Status || row.Injury_Flag || row.injury_flag,
  )
  const tier = str(row.tier || row.Tier) || '—'
  const reliability = str(row.reliability_tier) || '—'

  // Accept live schema (player_name) and legacy bot schema (Name / Rank)
  const csvOverallRank =
    num(row.overall_rank ?? row.Rank ?? row.rank, index + 1) ?? index + 1

  return {
    rank: csvOverallRank,
    overall_rank: csvOverallRank,
    // Preserved CSV overall_rank — authoritative for Standard board order
    csvOverallRank,
    name: str(row.player_name || row.Name || row.name),
    team: str(row.recent_team || row.team || row.Team).toUpperCase(),
    position: str(row.position || row.Position).toUpperCase(),
    adp_signal: str(row.adp_signal || row.ADP_Signal || row.adpSignal),
    consensus_adp: num(row.consensus_adp ?? row.Consensus_ADP ?? row.consensusAdp, null),
    consensus_adp_overall: num(
      row.consensus_adp_overall ?? row.consensusAdpOverall,
      null,
    ),
    consensus_adp_positional: num(
      row.consensus_adp_positional ?? row.consensusAdpPositional,
      null,
    ),
    our_positional_rank: num(
      row.our_positional_rank ?? row.ourPositionalRank,
      null,
    ),
    adp_diff_positional: num(
      row.adp_diff_positional ?? row.adpDiffPositional,
      null,
    ),
    adp_diff_overall: num(row.adp_diff_overall ?? row.adpDiffOverall, null),
    outlookRaw: str(row.outlook || row.Outlook),

    // CamelCase ADP mirrors for components
    adpSignal: str(row.adp_signal || row.ADP_Signal || row.adpSignal).toUpperCase(),
    consensusAdpOverall: num(
      row.consensus_adp_overall ?? row.consensusAdpOverall,
      null,
    ),
    consensusAdpPositional: num(
      row.consensus_adp_positional ?? row.consensusAdpPositional,
      null,
    ),
    ourPositionalRank: num(
      row.our_positional_rank ?? row.ourPositionalRank,
      null,
    ),
    adpDiffPositional: num(
      row.adp_diff_positional ?? row.adpDiffPositional,
      null,
    ),

    projected_ppg,

    projected_ppg_std,
    projected_ppg_half_ppr,
    projected_ppg_ppr,

    draft_value_score,
    draft_value_score_std,
    draft_value_score_half_ppr,
    draft_value_score_ppr,

    projectedPpgStd: projected_ppg_std,
    projectedPpgHalfPpr: projected_ppg_half_ppr,
    projectedPpgPpr: projected_ppg_ppr,
    draftValueScoreStd: draft_value_score_std,
    draftValueScoreHalfPpr: draft_value_score_half_ppr,
    draftValueScorePpr: draft_value_score_ppr,

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
    age: num(row.age ?? row.Age, null),
    basis: str(row.data_basis || row.Data_Basis || row.projection_basis),
    outlook: str(row.outlook || row.Outlook) || tier.toUpperCase().replace(/\s+/g, '_'),
    reliabilityTier: reliability,
    situationScore: num(row.situation_score, null),
    dataBasis: str(row.data_basis || row.Data_Basis || row.projection_basis),
    opponent: str(row.opponent || row.Opponent || row.opp),
    matchupGrade: num(row.matchup_grade ?? row.matchupGrade ?? row.Matchup_Grade, null),
    board: 'ros',
  }
}

/**
 * Map weekly_rankings.csv (engine export) → board player object.
 * Sort order comes from Rank; displayed score prefers Edge Score when
 * Weekly Score is on the broken large scale.
 */
function normalizeWeeklyRow(row, index) {
  const csvOverallRank =
    num(row.Rank ?? row.rank ?? row.overall_rank, index + 1) ?? index + 1
  const weeklyScore = num(row['Weekly Score'] ?? row.weekly_score, 0) ?? 0
  const edgeScore = num(row['Edge Score'] ?? row.edge_score, null)
  const display =
    weeklyScore > 100 && edgeScore != null ? edgeScore : weeklyScore || edgeScore || 0
  const outlook = str(row.Outlook || row.outlook) || 'NEUTRAL'
  const opponent = str(
    row['Upcoming Opponent'] || row.opponent || row.Opponent || row.opp,
  ).toUpperCase()
  const matchupGrade = num(
    row['Matchup Grade'] ?? row.matchup_grade ?? row.matchupGrade,
    null,
  )

  return {
    rank: csvOverallRank,
    overall_rank: csvOverallRank,
    csvOverallRank,
    name: str(row.Name || row.player_name || row.name),
    team: str(row.Team || row.recent_team || row.team).toUpperCase(),
    position: str(row.Position || row.position).toUpperCase(),
    board: 'weekly',
    adp_signal: '',
    adpSignal: '',
    consensus_adp: null,
    consensus_adp_overall: null,
    consensus_adp_positional: null,
    our_positional_rank: null,
    adp_diff_positional: null,
    adp_diff_overall: null,
    outlookRaw: outlook,
    projected_ppg: display,
    projected_ppg_std: display,
    projected_ppg_half_ppr: display,
    projected_ppg_ppr: display,
    draft_value_score: display,
    draft_value_score_std: display,
    draft_value_score_half_ppr: display,
    draft_value_score_ppr: display,
    projectedPpgStd: display,
    projectedPpgHalfPpr: display,
    projectedPpgPpr: display,
    draftValueScoreStd: display,
    draftValueScoreHalfPpr: display,
    draftValueScorePpr: display,
    score: display,
    projectedPpg: display,
    scoreLabel: Number(display).toFixed(1),
    draftValueScore: display,
    finalScore: display,
    weeklyScore,
    edgeScore,
    reliability: '—',
    situation: matchupGrade,
    careerSeasons: 0,
    tier: outlook,
    injury: '',
    liveStatus: '',
    age: null,
    basis: 'weekly',
    outlook,
    reliabilityTier: '—',
    situationScore: matchupGrade,
    dataBasis: 'weekly',
    opponent,
    matchupGrade,
  }
}

function parseCsvPlayers(fullPath, normalizeFn, label) {
  if (!fs.existsSync(fullPath)) return []
  const raw = fs.readFileSync(fullPath, 'utf8')
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  if (parsed.errors?.length) {
    console.warn(`[rankings] ${label} parse warnings:`, parsed.errors.slice(0, 3))
  }
  return (parsed.data || []).map(normalizeFn).filter((p) => p.name)
}

function parseLivePlayers() {
  return parseCsvPlayers(livePath(), normalizeLiveRow, 'live_rankings')
}

function parseWeeklyPlayers() {
  return parseCsvPlayers(weeklyPath(), normalizeWeeklyRow, 'weekly_rankings')
}

/**
 * Sort players by CSV overall_rank ascending (1 = best).
 * Used for Standard default board — never by projected PPG.
 */
function sortByOverallRank(players) {
  return players.slice().sort((a, b) => {
    const ra = parseInt(a.csvOverallRank ?? a.overall_rank ?? a.rank, 10) || 9999
    const rb = parseInt(b.csvOverallRank ?? b.overall_rank ?? b.rank, 10) || 9999
    if (ra !== rb) return ra - rb
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}

function readLiveCsv() {
  const players = parseLivePlayers()
  // Default format = std → CSV overall_rank order (Allen #12, not PPG order)
  return rankPlayersByFormat(sortByOverallRank(players), 'std', { superflex: false })
}

/**
 * Rest-of-season board — public/rankings/live_rankings.csv
 * Returns players in Standard board order (CSV overall_rank).
 */
export function getLiveRankings() {
  return readLiveCsv()
}

export function getRosRankings() {
  return getLiveRankings()
}

/**
 * Weekly start/sit board — public/rankings/weekly_rankings.csv
 */
export function getWeeklyRankings() {
  const players = parseWeeklyPlayers()
  return rankPlayersByFormat(sortByOverallRank(players), 'std', {
    superflex: false,
  }).map((p) => ({ ...p, board: 'weekly' }))
}

/**
 * Load board players for Weekly or Rest of Season.
 */
export function getBoardRankings(board, format = 'std', options = {}) {
  const b = normalizeBoard(board)
  if (b === 'weekly') {
    if (!weeklyRankingsExists()) return []
    return getWeeklyRankings()
  }
  const players = parseLivePlayers()
  const fmt = normalizeScoringFormat(format || 'std')
  const superflex = Boolean(options.superflex)
  return rankPlayersByFormat(sortByOverallRank(players), fmt, { superflex }).map(
    (p) => ({ ...p, board: 'ros' }),
  )
}

/**
 * Load live rankings and re-rank for the requested scoring format.
 * Default format = 'std' (CSV overall_rank).
 * half_ppr / ppr → draft_value_score_{format} descending.
 */
export function getRankingsByWeek(_week, format = 'std', _year, options = {}) {
  const board = normalizeBoard(options.board, { week: _week })
  return getBoardRankings(board, format, options)
}

/**
 * Elite tier smash list for homepage / cards.
 * Sort by CSV overall_rank (standard draft board order).
 */
export function getTopPlays(_week, n = 5) {
  return getLiveRankings()
    .filter((p) => String(p.tier).toLowerCase() === 'elite')
    .sort(
      (a, b) =>
        (a.csvOverallRank ?? a.overall_rank ?? a.rank) -
        (b.csvOverallRank ?? b.overall_rank ?? b.rank),
    )
    .slice(0, n)
    .map((p, i) => ({
      ...p,
      rank: p.csvOverallRank ?? p.overall_rank ?? i + 1,
      overall_rank: p.csvOverallRank ?? p.overall_rank ?? i + 1,
    }))
}

/**
 * Position board sorted by positional rank.
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
    .sort(
      (a, b) =>
        parseInt(a.csvOverallRank ?? a.rank, 10) -
        parseInt(b.csvOverallRank ?? b.rank, 10),
    )
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
      .sort(
        (a, b) =>
          parseInt(a.csvOverallRank ?? a.rank, 10) -
          parseInt(b.csvOverallRank ?? b.rank, 10),
      )
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
  const y = year || getYearForWeek(week)
  if (isPreseasonWeek(week)) return `${y} Rest of Season`
  return `Week ${week} (${y})`
}

export function formatWeekShort(week) {
  if (isPreseasonWeek(week)) return 'Rest of Season'
  return `Week ${week}`
}

export function getAllWeeks() {
  const year = getYearForWeek(0)
  const week = getLatestWeek()
  const boards = availableBoards()
  return [
    {
      week,
      year,
      formats: ['std', 'half_ppr', 'ppr'],
      boards,
      label: formatWeekLabel(week, year),
      source: LIVE_RANKINGS_FILE,
      weeklySource: WEEKLY_RANKINGS_FILE,
    },
  ]
}

/**
 * Publish date for "Updated …" — meta.json only.
 * Never use CSV mtime: Vercel clones stamp files at 2018-10-19.
 */
export function getRankingsUpdatedAt(_week, _format, _year) {
  const meta = getPublishMeta()
  const raw = meta?.last_updated ? String(meta.last_updated) : null
  if (raw) {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() >= 2026) {
      return raw
    }
  }
  return null
}

const HARDCODED_FADES = [
  'Patrick Mahomes',
  'Jalen Hurts',
  'Davante Adams',
  'Sam Darnold',
  'David Montgomery',
]

/**
 * Draft-with-caution list for homepage.
 * Prefer outlook/adp fade signals among top-100; fall back to curated names.
 */
export function getTopFades(_week, n = 5) {
  const players = getLiveRankings()
  const csvRank = (p) => p.csvOverallRank ?? p.overall_rank ?? p.rank ?? 9999

  const relevant = players.filter((p) => csvRank(p) <= 100)

  const hasOutlookFade = relevant.some((p) =>
    /FADE|HARD_FADE/i.test(String(p.outlookRaw || p.outlook || '')),
  )
  const hasAdpSignal = relevant.some((p) => Boolean(str(p.adp_signal)))
  const hasConsensusAdp = relevant.some(
    (p) => p.consensus_adp != null && Number.isFinite(Number(p.consensus_adp)),
  )

  let fades = []

  if (hasOutlookFade || hasAdpSignal) {
    fades = relevant.filter((p) => {
      const outlook = String(p.outlookRaw || p.outlook || '')
      const signal = String(p.adp_signal || '')
      return /FADE|HARD_FADE/i.test(outlook) || /^FADE$/i.test(signal)
    })
  } else if (hasConsensusAdp) {
    fades = relevant.filter((p) => {
      const adp = Number(p.consensus_adp)
      const ours = csvRank(p)
      return Number.isFinite(adp) && ours - adp >= 12
    })
  }

  if (!fades.length) {
    const byName = new Map(
      players.map((p) => [String(p.name).toLowerCase(), p]),
    )
    fades = HARDCODED_FADES.map((name) => byName.get(name.toLowerCase())).filter(
      Boolean,
    )
  }

  return fades
    .sort((a, b) => csvRank(a) - csvRank(b))
    .slice(0, n)
    .map((p) => ({
      ...p,
      rank: csvRank(p),
      overall_rank: csvRank(p),
    }))
}

/** Badge / header label for a scoring format */
export function formatBadgeLabel(format) {
  const fmt = normalizeScoringFormat(format)
  return FORMAT_META[fmt]?.badge || 'STANDARD'
}
