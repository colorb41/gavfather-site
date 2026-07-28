import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const RANKINGS_DIR = path.join(process.cwd(), 'public', 'rankings')
const META_PATHS = [
  path.join(process.cwd(), 'public', 'data', 'meta.json'),
  path.join(process.cwd(), 'data', 'meta.json'),
]

const FILE_RE = /^rankings_week_(\d+)_(\d{4})(?:_([a-z0-9_]+))?\.csv$/i

/** Preseason / draft board uses week index 0. */
export function isPreseasonWeek(week) {
  return Number(week) === 0
}

/**
 * Parse a rankings filename into week / year / format.
 */
export function parseRankingsFilename(filename) {
  const match = FILE_RE.exec(filename)
  if (!match) return null
  return {
    week: Number(match[1]),
    year: Number(match[2]),
    format: (match[3] || 'ppr').toLowerCase(),
    filename,
  }
}

function listRankingFiles() {
  if (!fs.existsSync(RANKINGS_DIR)) return []
  return fs
    .readdirSync(RANKINGS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .map(parseRankingsFilename)
    .filter(Boolean)
}

/**
 * Publish metadata from public/data/meta.json (last_updated, week, year).
 */
export function getPublishMeta() {
  for (const filePath of META_PATHS) {
    try {
      if (!fs.existsSync(filePath)) continue
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
      // try next path
    }
  }
  return null
}

function normalizePlayer(row, index) {
  const outlook = String(row.Outlook || row.outlook || 'NEUTRAL')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

  const finalScore = num(row.Final_Score ?? row['Final Score'] ?? row.final_score)
  const edge = num(row.Edge_Score ?? row['Edge Score'] ?? row.edge_score)
  const hidden = num(row.Hidden_Score ?? row['Hidden Score'] ?? row.hidden_score)
  const research = num(row.Research_Score ?? row['Research Score'] ?? row.research_score)
  const contextual = num(
    row.Contextual_Score ?? row['Contextual Score'] ?? row.contextual_score,
  )
  const matchup = num(row.Matchup_Grade ?? row['Matchup Grade'] ?? row.matchup_grade, 50)

  return {
    rank: Number(row.Rank ?? row.rank ?? index + 1),
    name: String(row.Name ?? row.name ?? '').trim(),
    team: String(row.Team ?? row.team ?? '').trim().toUpperCase(),
    position: String(row.Position ?? row.position ?? '').trim().toUpperCase(),
    opponent: String(row.Opponent ?? row.opponent ?? row['Upcoming Opponent'] ?? '')
      .trim()
      .toUpperCase(),
    matchupGrade: matchup,
    edgeScore: edge,
    hiddenScore: hidden,
    researchScore: research,
    contextualScore: contextual,
    finalScore,
    outlook: outlook || 'NEUTRAL',
    injury: String(
      row.Live_Injury_Status ?? row['Live Injury Status'] ?? row.injury ?? 'Healthy',
    ).trim(),
    topFactor1: String(row.Top_Factor_1 ?? row['Top Factor 1'] ?? row.Top_Factors ?? '').trim(),
    topFactor2: String(row.Top_Factor_2 ?? row['Top Factor 2'] ?? '').trim(),
    byeWeek: String(row.Bye_Week ?? row['Bye Week'] ?? row.bye ?? '').trim(),
    adpDiff: num(row.ADP_Diff ?? row['ADP Diff'] ?? row.adp_diff, 0),
  }
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function readCsvFile(filename) {
  const fullPath = path.join(RANKINGS_DIR, filename)
  const raw = fs.readFileSync(fullPath, 'utf8')
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  if (parsed.errors?.length) {
    console.warn(`[rankings] parse warnings for ${filename}:`, parsed.errors.slice(0, 3))
  }
  return (parsed.data || []).map(normalizePlayer).filter((p) => p.name)
}

/**
 * Current board week: prefer meta.json, else newest year then highest week.
 * Defaults to preseason (week 0) when nothing is published yet.
 */
export function getLatestWeek() {
  const meta = getPublishMeta()
  if (meta && Number.isFinite(Number(meta.week))) {
    return Number(meta.week)
  }
  const files = listRankingFiles()
  if (!files.length) return 0
  const bestYear = Math.max(...files.map((f) => f.year))
  const yearFiles = files.filter((f) => f.year === bestYear)
  return Math.max(...yearFiles.map((f) => f.week))
}

/**
 * Year associated with the latest week (or a preferred week).
 */
export function getYearForWeek(week) {
  const meta = getPublishMeta()
  if (
    meta &&
    Number.isFinite(Number(meta.year)) &&
    (meta.week == null || Number(meta.week) === Number(week))
  ) {
    return Number(meta.year)
  }
  const files = listRankingFiles().filter((f) => f.week === Number(week))
  if (!files.length) return Number(meta?.year) || 2026
  return Math.max(...files.map((f) => f.year))
}

/**
 * Human-readable board label. Week 0 is the draft / preseason board.
 */
export function formatWeekLabel(week, year) {
  if (isPreseasonWeek(week)) return `${year} Draft Rankings`
  return `Week ${week} (${year})`
}

/**
 * Short label for cards / subtitles.
 */
export function formatWeekShort(week) {
  if (isPreseasonWeek(week)) return 'Preseason 2026'
  return `Week ${week}`
}

/**
 * All available weeks for the selector, newest first.
 */
export function getAllWeeks() {
  const map = new Map()
  for (const f of listRankingFiles()) {
    const key = `${f.year}-${f.week}`
    if (!map.has(key)) {
      map.set(key, {
        week: f.week,
        year: f.year,
        formats: new Set([f.format]),
        label: formatWeekLabel(f.week, f.year),
      })
    } else {
      map.get(key).formats.add(f.format)
    }
  }
  return Array.from(map.values())
    .map((w) => ({ ...w, formats: Array.from(w.formats) }))
    .sort((a, b) => b.year - a.year || b.week - a.week)
}

/**
 * Load rankings for a week + scoring format.
 * Falls back to ppr / un-suffixed file when format-specific CSV is missing.
 */
export function getRankingsByWeek(week, format = 'ppr', year) {
  const w = Number(week)
  const fmt = String(format || 'ppr').toLowerCase()
  const files = listRankingFiles().filter((f) => f.week === w)
  if (!files.length) return []

  const y = year ? Number(year) : Math.max(...files.map((f) => f.year))
  const yearFiles = files.filter((f) => f.year === y)

  const preferred =
    yearFiles.find((f) => f.format === fmt) ||
    yearFiles.find((f) => f.format === 'ppr') ||
    yearFiles[0]

  if (!preferred) return []
  return readCsvFile(preferred.filename)
}

/**
 * Top N SMASH/PLAY offers with position diversity (avoid five RBs in a row).
 */
export function getTopPlays(week, n = 5, format = 'ppr', year) {
  const players = getRankingsByWeek(week, format, year)
  const pool = players
    .filter((p) => p.outlook === 'SMASH' || p.outlook === 'PLAY')
    .sort((a, b) => {
      if (a.outlook === 'SMASH' && b.outlook !== 'SMASH') return -1
      if (b.outlook === 'SMASH' && a.outlook !== 'SMASH') return 1
      return b.finalScore - a.finalScore
    })

  const source = pool.length ? pool : [...players].sort((a, b) => b.finalScore - a.finalScore)
  return pickDiverse(source, n)
}

/**
 * Only true FADE / HARD_FADE plays — never pad with NEUTRAL/PLAY.
 * Sorted by Final_Score so the most notable (high-ranked) fades surface first.
 */
export function getTopFades(week, n = 5, format = 'ppr', year) {
  const players = getRankingsByWeek(week, format, year)
  return players
    .filter((p) => String(p.outlook).includes('FADE'))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, n)
}

/** Round-robin across positions so homepage cards aren't all one position. */
function pickDiverse(players, n) {
  const byPos = { QB: [], RB: [], WR: [], TE: [], OTHER: [] }
  for (const p of players) {
    const key = byPos[p.position] ? p.position : 'OTHER'
    byPos[key].push(p)
  }
  const order = ['RB', 'WR', 'QB', 'TE', 'OTHER']
  const picked = []
  const used = new Set()

  while (picked.length < n) {
    let added = false
    for (const pos of order) {
      if (picked.length >= n) break
      const next = byPos[pos].find((p) => !used.has(p.name))
      if (next) {
        picked.push(next)
        used.add(next.name)
        added = true
      }
    }
    if (!added) break
  }
  return picked
}

/**
 * "Updated" label — prefer public/data/meta.json last_updated, else CSV mtime.
 */
export function getRankingsUpdatedAt(week, format = 'ppr', year) {
  const meta = getPublishMeta()
  if (meta?.last_updated) {
    return String(meta.last_updated)
  }

  const w = Number(week)
  const fmt = String(format || 'ppr').toLowerCase()
  const files = listRankingFiles().filter((f) => f.week === w)
  if (!files.length) return null
  const y = year ? Number(year) : Math.max(...files.map((f) => f.year))
  const yearFiles = files.filter((f) => f.year === y)
  const preferred =
    yearFiles.find((f) => f.format === fmt) ||
    yearFiles.find((f) => f.format === 'ppr') ||
    yearFiles[0]
  if (!preferred) return null
  const stat = fs.statSync(path.join(RANKINGS_DIR, preferred.filename))
  return stat.mtime.toISOString()
}
