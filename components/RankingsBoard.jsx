'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PlayerRow from './PlayerRow'
import ShareButtons from './ShareButtons'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE']
const FORMAT_PRESETS = [
  { id: 'half_ppr', label: 'Half PPR' },
  { id: 'ppr', label: 'PPR' },
  { id: 'standard', label: 'Standard' },
  { id: 'superflex', label: 'Superflex' },
]

function formatUpdated(updatedAt) {
  if (!updatedAt) return 'July 2026'
  try {
    const d = new Date(updatedAt)
    if (Number.isNaN(d.getTime())) return 'July 2026'
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return 'July 2026'
  }
}

/**
 * Freemium: first 10 at the active position are unlocked.
 * On ALL tab, unlock the preview set (top 10 per position).
 */
function isRowLocked(player, position, isLoggedIn, previewIds) {
  if (isLoggedIn) return false
  if (position === 'ALL') return !previewIds.has(`${player.position}:${player.name}`)
  // Position tab — lock after positional rank 10
  return (player.positionalRank || 999) > 10
}

export default function RankingsBoard({
  initialPlayers,
  previewPlayers = [],
  weeks,
  initialWeek,
  initialYear,
  initialFormat,
  updatedAt,
  fantasyPros,
  isLoggedIn = false,
  freemiumCapped = false,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [position, setPosition] = useState('ALL')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [format, setFormat] = useState(initialFormat || 'half_ppr')

  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])

  useEffect(() => {
    setFormat(initialFormat || 'half_ppr')
  }, [initialFormat])

  const previewIds = useMemo(() => {
    const set = new Set()
    for (const p of previewPlayers) {
      set.add(`${p.position}:${p.name}`)
    }
    return set
  }, [previewPlayers])

  const filtered = useMemo(() => {
    let list = [...initialPlayers]
    if (position !== 'ALL') {
      list = list.filter((p) => p.position === position)
      // Position tab: sort by positional PPG rank (best QB first), not overall
      list.sort(
        (a, b) =>
          (a.positionalRank || 999) - (b.positionalRank || 999) ||
          b.projectedPpg - a.projectedPpg,
      )
    } else {
      list.sort((a, b) => a.rank - b.rank)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q),
      )
    }
    return list
  }, [initialPlayers, position, search])

  function onFormatChange(next) {
    setFormat(next)
    const params = new URLSearchParams()
    params.set('week', String(initialWeek ?? 0))
    params.set('year', String(initialYear ?? 2026))
    params.set('format', next)
    router.push(`/rankings?${params.toString()}`)
  }

  const updatedLabel = formatUpdated(updatedAt)
  const sharePath = `/rankings?week=${initialWeek}&year=${initialYear}&format=${format}`
  const shareTitle = `The Gavfather ${initialYear} Rankings — Half PPR`

  const unlockedCount = filtered.filter(
    (p) => !isRowLocked(p, position, isLoggedIn, previewIds),
  ).length

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-gavfather-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-5xl">
            THE GAVFATHER {initialYear} RANKINGS
          </h1>
          <p className="mt-2 text-sm text-gavfather-text">
            Half PPR | Preseason | Updated {updatedLabel}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-gavfather-gold px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gavfather-navy">
              HALF PPR
            </span>
            <span className="text-xs text-gavfather-muted">
              Adjust scoring with the panel below
            </span>
          </div>
          {fantasyPros?.submitted && (
            fantasyPros.url ? (
              <a
                href={fantasyPros.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-gavfather-gold/30 bg-gavfather-gold/10 px-3 py-1 text-xs font-medium text-gavfather-gold transition hover:bg-gavfather-gold/20"
              >
                {fantasyPros.label || 'Submitted to FantasyPros ECR'} ↗
              </a>
            ) : (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gavfather-gold/30 bg-gavfather-gold/10 px-3 py-1 text-xs font-medium text-gavfather-gold">
                {fantasyPros.label || 'Submitted to FantasyPros ECR'}
              </p>
            )
          )}
        </div>
        <ShareButtons title={shareTitle} path={sharePath} label="Copy rankings link" />
      </div>

      {/* Scoring presets */}
      <div className="mt-6 rounded-xl border border-gavfather-border bg-gavfather-slate p-4">
        <p className="text-xs uppercase tracking-wider text-gavfather-muted">
          Scoring format
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FORMAT_PRESETS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFormatChange(f.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                format === f.id
                  ? 'bg-gavfather-gold text-gavfather-navy'
                  : 'bg-gavfather-navy text-gavfather-muted hover:text-gavfather-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {format === 'superflex' && (
          <p className="mt-3 text-xs text-gavfather-gold">
            Superflex rankings coming — enter your league settings to customize
          </p>
        )}
        {format !== 'half_ppr' && format !== 'superflex' && (
          <p className="mt-3 text-xs text-gavfather-muted">
            Showing Half PPR projections — {FORMAT_PRESETS.find((x) => x.id === format)?.label}{' '}
            board customization coming soon.
          </p>
        )}
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-gavfather-border bg-gavfather-slate p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex-1 text-xs uppercase tracking-wider text-gavfather-muted">
            Search
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player name…"
              className="mt-1 block w-full rounded-md border border-gavfather-border bg-gavfather-navy px-3 py-2 text-sm text-gavfather-text outline-none placeholder:text-gavfather-muted/50 focus:border-gavfather-gold"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-1">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosition(pos)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold tracking-wide transition ${
                position === pos
                  ? 'border-b-2 border-gavfather-gold text-gavfather-gold'
                  : 'text-gavfather-muted hover:text-gavfather-text'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-gavfather-muted">
        Showing {unlockedCount}
        {freemiumCapped ? ` of ${filtered.length}` : ''} players
        {freemiumCapped ? ' · free preview = top 10 per position' : ''}
      </p>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gavfather-border md:block">
        <table className="w-full min-w-[960px] text-left">
          <thead className="bg-gavfather-slate text-[11px] uppercase tracking-wider text-gavfather-muted">
            <tr>
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Player</th>
              <th className="px-3 py-3">Pos</th>
              <th className="px-3 py-3">Team</th>
              <th className="px-3 py-3">Proj PPG</th>
              <th className="px-3 py-3">Reliability</th>
              <th className="px-3 py-3">Situation</th>
              <th className="px-3 py-3">Injury</th>
              <th className="px-3 py-3">Tier</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const locked = isRowLocked(p, position, isLoggedIn, previewIds)
              return (
                <PlayerRow
                  key={`${p.rank}-${p.name}`}
                  player={p}
                  locked={locked}
                  displayRank={
                    position === 'ALL' ? p.rank : p.positionalRank || p.rank
                  }
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Rank, Player, Proj PPG, Injury only */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((p) => {
          const locked = isRowLocked(p, position, isLoggedIn, previewIds)
          return (
            <PlayerRow
              key={`${p.rank}-${p.name}-m`}
              player={p}
              compact
              locked={locked}
              displayRank={
                position === 'ALL' ? p.rank : p.positionalRank || p.rank
              }
            />
          )
        })}
      </div>

      {freemiumCapped && (
        <div className="mt-8 rounded-xl border border-gavfather-gold/40 bg-gavfather-gold/10 px-5 py-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-gavfather-gold/50 text-gavfather-gold">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z" />
            </svg>
          </div>
          <p className="font-display text-lg text-gavfather-gold">
            Sign in free to see all rankings
          </p>
          <p className="mt-2 text-sm text-gavfather-muted">
            Free preview shows the top 10 at each position. Unlock the full board,
            reliability tiers, and draft value.
          </p>
        </div>
      )}

      {!filtered.length && (
        <p className="mt-10 text-center text-gavfather-muted">
          No players match these filters.
        </p>
      )}
    </div>
  )
}
