/**
 * Client-safe format re-ranking (no Node/fs).
 * Used by RankingsBoard and re-exported from lib/rankings.js.
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

/**
 * Superflex (2-QB): apply QB premium to overall draft order.
 * Does not change projected PPG — only overall rank sort key.
 */
function effectiveDraftValue(player, draftValue, score, superflex) {
  if (!superflex || String(player.position).toUpperCase() !== 'QB') {
    return draftValue
  }
  // Elite QBs rise in SF: use the stronger of boosted 1QB value and raw PPG
  return Math.max(draftValue * 1.35, score)
}

/**
 * Re-rank players for a scoring format.
 *
 * @param {Array<object>} players — normalized player objects (with format score fields)
 * @param {'std'|'half_ppr'|'ppr'|string} format
 * @param {{ superflex?: boolean }} [options]
 * @returns {Array<object>} new array with overall_rank / positional_rank / display fields
 */
export function rankPlayersByFormat(players, format, options = {}) {
  const { superflex = false } = options
  const fmt = normalizeScoringFormat(format)
  const scoreColumn = SCORE_COLUMN[fmt]
  const draftValueColumn = DRAFT_VALUE_COLUMN[fmt]

  if (!scoreColumn || !draftValueColumn) {
    return Array.isArray(players) ? players.map((p) => ({ ...p })) : []
  }

  const list = (Array.isArray(players) ? players : []).map((p) => ({ ...p }))

  // 1. Sort by draft value descending (overall board order)
  list.sort((a, b) => {
    const scoreA = Number(a[scoreColumn] ?? a.projectedPpg ?? 0) || 0
    const scoreB = Number(b[scoreColumn] ?? b.projectedPpg ?? 0) || 0
    const rawDvA = Number(a[draftValueColumn] ?? a.draftValueScore ?? scoreA) || 0
    const rawDvB = Number(b[draftValueColumn] ?? b.draftValueScore ?? scoreB) || 0
    const dvA = effectiveDraftValue(a, rawDvA, scoreA, superflex)
    const dvB = effectiveDraftValue(b, rawDvB, scoreB, superflex)
    if (dvB !== dvA) return dvB - dvA
    // Tie-break: higher projected PPG, then name
    if (scoreB !== scoreA) return scoreB - scoreA
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

  // 2. Assign overall_rank from this sort
  list.forEach((p, i) => {
    const score = Number(p[scoreColumn] ?? p.projectedPpg ?? 0) || 0
    const draftValue = Number(p[draftValueColumn] ?? p.draftValueScore ?? score) || 0

    p.overall_rank = i + 1
    p.rank = i + 1
    p.projectedPpg = score
    p.score = score
    p.scoreLabel = score.toFixed(1)
    p.finalScore = score
    p.draftValueScore = draftValue
    p.scoringFormat = fmt
    p.superflex = Boolean(superflex)
  })

  // 3. Positional rank within each position by scoreColumn (PPG)
  const byPos = {}
  for (const p of list) {
    const pos = String(p.position || '').toUpperCase()
    if (!byPos[pos]) byPos[pos] = []
    byPos[pos].push(p)
  }
  for (const pos of Object.keys(byPos)) {
    const group = [...byPos[pos]].sort((a, b) => {
      const sa = Number(a[scoreColumn] ?? a.projectedPpg ?? 0) || 0
      const sb = Number(b[scoreColumn] ?? b.projectedPpg ?? 0) || 0
      if (sb !== sa) return sb - sa
      return (a.rank || 0) - (b.rank || 0)
    })
    group.forEach((p, i) => {
      p.positional_rank = i + 1
      p.positionalRank = i + 1
    })
  }

  // 4. Return re-ranked players
  return list
}

/**
 * Build freemium preview ids (top 10 per position) from a ranked list.
 */
export function previewIdsFromRanked(rankedPlayers) {
  const ids = new Set()
  for (const pos of ['QB', 'RB', 'WR', 'TE']) {
    const subset = rankedPlayers
      .filter((p) => String(p.position).toUpperCase() === pos)
      .sort(
        (a, b) =>
          (a.positionalRank || a.positional_rank || 999) -
          (b.positionalRank || b.positional_rank || 999),
      )
      .slice(0, 10)
    for (const p of subset) {
      ids.add(`${p.position}:${p.name}`)
    }
  }
  return ids
}
