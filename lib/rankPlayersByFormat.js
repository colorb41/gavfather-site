/**
 * Client-safe format re-ranking (no Node/fs).
 * Used by RankingsBoard and re-exported from lib/rankings.js.
 *
 * Overall board order  → draft_value_score_{format} (desc)
 * Positional ranks     → projected_ppg (stable across formats)
 * Displayed Proj PPG   → projected_ppg_{format}
 */

export const FORMAT_IDS = ['std', 'half_ppr', 'ppr']

export const SCORE_COLUMN = {
  std: 'projected_ppg_std',
  half_ppr: 'projected_ppg_half_ppr',
  ppr: 'projected_ppg_ppr',
}

export const DRAFT_VALUE_COLUMN = {
  std: 'draft_value_score_std',
  half_ppr: 'draft_value_score_half_ppr',
  ppr: 'draft_value_score_ppr',
}

export const FORMAT_META = {
  std: {
    id: 'std',
    label: 'Standard',
    badge: 'STANDARD',
    ppgHeader: 'Proj PPG (Std)',
  },
  half_ppr: {
    id: 'half_ppr',
    label: 'Half PPR',
    badge: 'HALF PPR',
    ppgHeader: 'Proj PPG (Half PPR)',
  },
  ppr: {
    id: 'ppr',
    label: 'PPR',
    badge: 'PPR',
    ppgHeader: 'Proj PPG (PPR)',
  },
}

/** Normalize URL / legacy ids → std | half_ppr | ppr */
export function normalizeScoringFormat(raw) {
  const f = String(raw || 'std').toLowerCase().replace(/-/g, '_')
  if (f === 'standard' || f === 'std' || f === 'non_ppr' || f === 'non-ppr') return 'std'
  if (f === 'half' || f === 'half_ppr' || f === 'halfppr') return 'half_ppr'
  if (f === 'ppr' || f === 'full_ppr' || f === 'fullppr') return 'ppr'
  // Superflex is roster construction, not scoring — fall back to standard
  if (f === 'superflex' || f === 'sf' || f === '2qb') return 'std'
  return FORMAT_IDS.includes(f) ? f : 'std'
}

function numVal(player, key, fallback = 0) {
  const n = Number(player?.[key])
  return Number.isFinite(n) ? n : fallback
}

/**
 * Superflex (2-QB): apply QB premium to overall draft order only.
 */
function effectiveDraftValue(player, draftValue, superflex) {
  if (!superflex || String(player.position).toUpperCase() !== 'QB') {
    return draftValue
  }
  return draftValue * 1.35
}

/**
 * Re-rank players for a scoring format.
 *
 * Overall: sort by draft_value_score_{format} descending, reassign overall_rank.
 * Positional: sort by projected_ppg (format-invariant — Chase is WR1 in every format).
 * Display: projected_ppg_{format} to one decimal.
 *
 * @param {Array<object>} players
 * @param {'std'|'half_ppr'|'ppr'|string} format
 * @param {{ superflex?: boolean }} [options]
 */
export function rankPlayersByFormat(players, format, options = {}) {
  const { superflex = false } = options
  const fmt = normalizeScoringFormat(format)

  const sortColumn =
    {
      std: 'draft_value_score_std',
      half_ppr: 'draft_value_score_half_ppr',
      ppr: 'draft_value_score_ppr',
    }[fmt] || 'draft_value_score_std'

  const displayColumn =
    {
      std: 'projected_ppg_std',
      half_ppr: 'projected_ppg_half_ppr',
      ppr: 'projected_ppg_ppr',
    }[fmt] || 'projected_ppg_std'

  // Positional ranks never switch with format
  const positionalColumn = 'projected_ppg'

  const list = (Array.isArray(players) ? players : []).map((p) => ({ ...p }))

  // 1. Sort by format draft-value column descending (NOT projected PPG)
  list.sort((a, b) => {
    const dvA = effectiveDraftValue(
      a,
      numVal(a, sortColumn, numVal(a, 'draft_value_score', numVal(a, 'draftValueScore', 0))),
      superflex,
    )
    const dvB = effectiveDraftValue(
      b,
      numVal(b, sortColumn, numVal(b, 'draft_value_score', numVal(b, 'draftValueScore', 0))),
      superflex,
    )
    if (dvB !== dvA) return dvB - dvA

    // Tie-break: higher display PPG, then name — still not the overall sort key
    const ppgA = numVal(a, displayColumn, numVal(a, 'projected_ppg', 0))
    const ppgB = numVal(b, displayColumn, numVal(b, 'projected_ppg', 0))
    if (ppgB !== ppgA) return ppgB - ppgA
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

  // 2. Reassign overall_rank from this sort (1 = best)
  list.forEach((p, i) => {
    const display = numVal(p, displayColumn, numVal(p, 'projected_ppg', 0))
    const draftValue = numVal(
      p,
      sortColumn,
      numVal(p, 'draft_value_score', numVal(p, 'draftValueScore', display)),
    )

    p.overall_rank = i + 1
    p.rank = i + 1
    p.projectedPpg = display
    p.score = display
    p.scoreLabel = display.toFixed(1)
    p.finalScore = display
    p.draftValueScore = draftValue
    p.scoringFormat = fmt
    p.superflex = Boolean(superflex)
  })

  // 3. Positional rank by projected_ppg (same in every format)
  const byPos = {}
  for (const p of list) {
    const pos = String(p.position || '').toUpperCase()
    if (!byPos[pos]) byPos[pos] = []
    byPos[pos].push(p)
  }
  for (const pos of Object.keys(byPos)) {
    const group = [...byPos[pos]].sort((a, b) => {
      const sa = numVal(a, positionalColumn, numVal(a, 'projectedPpg', 0))
      const sb = numVal(b, positionalColumn, numVal(b, 'projectedPpg', 0))
      if (sb !== sa) return sb - sa
      return (a.rank || 0) - (b.rank || 0)
    })
    group.forEach((p, i) => {
      p.positional_rank = i + 1
      p.positionalRank = i + 1
    })
  }

  return list
}

/**
 * Build freemium preview ids — overall top 20 (primary free hook).
 */
export function previewIdsFromRanked(rankedPlayers, limit = 20) {
  const ids = new Set()
  const sorted = [...(rankedPlayers || [])].sort(
    (a, b) => (a.rank || 999) - (b.rank || 999),
  )
  for (const p of sorted.slice(0, limit)) {
    ids.add(`${p.position}:${p.name}`)
  }
  return ids
}
