'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PlayerRow from './PlayerRow'
import ShareButtons from './ShareButtons'
import {
  rankPlayersByFormat,
  normalizeScoringFormat,
  FORMAT_META,
  FORMAT_IDS,
  previewIdsFromRanked,
} from '../lib/rankPlayersByFormat'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE']
const DEFAULT_FORMAT = 'std'
const DEFAULT_TEAMS = '12 TEAMS'
const DEFAULT_ROSTER = 'Standard Roster'

const FORMAT_PRESETS = FORMAT_IDS.map((id) => FORMAT_META[id])

function formatUpdated(updatedAt) {
  if (!updatedAt) return 'Updated July 28, 2026'
  try {
    const d = new Date(updatedAt)
    if (Number.isNaN(d.getTime())) return 'Updated July 28, 2026'
    return `Updated ${d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`
  } catch {
    return 'Updated July 28, 2026'
  }
}

function normalizePos(raw) {
  const p = String(raw || 'ALL').toUpperCase()
  return POSITIONS.includes(p) ? p : 'ALL'
}

/**
 * Freemium: first 10 at the active position are unlocked.
 * On ALL tab, unlock the preview set (top 10 per position).
 */
function isRowLocked(player, position, isLoggedIn, previewIds) {
  if (isLoggedIn) return false
  if (position === 'ALL') return !previewIds.has(`${player.position}:${player.name}`)
  return (player.positionalRank || 999) > 10
}

export default function RankingsBoard({
  initialPlayers,
  previewPlayers = [],
  weeks,
  initialWeek,
  initialYear,
  initialFormat,
  initialSuperflex = false,
  initialPos = 'ALL',
  updatedAt,
  fantasyPros,
  isLoggedIn = false,
  freemiumCapped = false,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [position, setPosition] = useState(() => normalizePos(initialPos))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [format, setFormat] = useState(() =>
    normalizeScoringFormat(initialFormat || DEFAULT_FORMAT),
  )
  const [superflex, setSuperflex] = useState(() => Boolean(initialSuperflex))
  const [customizeOpen, setCustomizeOpen] = useState(false)

  useEffect(() => {
    const q = searchParams.get('search')
    if (q != null) setSearch(q)
    const pos = searchParams.get('pos')
    if (pos != null) setPosition(normalizePos(pos))
    const fmt = searchParams.get('format')
    if (fmt != null) setFormat(normalizeScoringFormat(fmt))
    const sf = searchParams.get('superflex')
    if (sf != null) setSuperflex(sf === '1' || sf === 'true')
  }, [searchParams])

  useEffect(() => {
    setFormat(normalizeScoringFormat(initialFormat || DEFAULT_FORMAT))
  }, [initialFormat])

  useEffect(() => {
    setSuperflex(Boolean(initialSuperflex))
  }, [initialSuperflex])

  // Re-rank instantly when scoring format or Superflex roster toggle changes
  const rankedPlayers = useMemo(
    () => rankPlayersByFormat(initialPlayers, format, { superflex }),
    [initialPlayers, format, superflex],
  )

  const previewIds = useMemo(() => {
    // Prefer format-aware top-10; fall back to server preview set
    if (rankedPlayers.length) return previewIdsFromRanked(rankedPlayers)
    const set = new Set()
    for (const p of previewPlayers) {
      set.add(`${p.position}:${p.name}`)
    }
    return set
  }, [rankedPlayers, previewPlayers])

  const filtered = useMemo(() => {
    let list = [...rankedPlayers]
    if (position !== 'ALL') {
      list = list.filter((p) => p.position === position)
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
          p.team.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q),
      )
    }
    return list
  }, [rankedPlayers, position, search])

  const pushUrl = useCallback(
    ({ nextFormat, nextPos, nextSearch, nextSuperflex } = {}) => {
      const params = new URLSearchParams()
      const fmt = normalizeScoringFormat(nextFormat ?? format)
      const pos = nextPos ?? position
      const q = nextSearch !== undefined ? nextSearch : search
      const sf = nextSuperflex !== undefined ? nextSuperflex : superflex

      if (fmt && fmt !== DEFAULT_FORMAT) params.set('format', fmt)
      if (sf) params.set('superflex', '1')
      if (pos && pos !== 'ALL') params.set('pos', pos)
      if (q && String(q).trim()) params.set('search', String(q).trim())

      const qs = params.toString()
      router.replace(qs ? `/rankings?${qs}` : '/rankings', { scroll: false })
    },
    [format, position, search, superflex, router],
  )

  function onFormatChange(next) {
    const fmt = normalizeScoringFormat(next)
    setFormat(fmt)
    pushUrl({ nextFormat: fmt })
  }

  function onSuperflexChange(next) {
    setSuperflex(next)
    pushUrl({ nextSuperflex: next })
  }

  function onResetDefaults() {
    setFormat(DEFAULT_FORMAT)
    setSuperflex(false)
    pushUrl({ nextFormat: DEFAULT_FORMAT, nextSuperflex: false })
  }

  function onPositionChange(pos) {
    setPosition(pos)
    pushUrl({ nextPos: pos })
  }

  function onSearchChange(value) {
    setSearch(value)
  }

  // Debounce search → URL so shareable links don't fight typing
  useEffect(() => {
    const t = setTimeout(() => {
      pushUrl({ nextSearch: search })
    }, 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const isCustomized = format !== DEFAULT_FORMAT || superflex
  const formatMeta = FORMAT_META[format] || FORMAT_META.std
  const updatedLabel = formatUpdated(updatedAt)
  const sharePath = `/rankings?format=${format}${superflex ? '&superflex=1' : ''}${
    position !== 'ALL' ? `&pos=${position}` : ''
  }`
  const shareTitle = `The Gavfather ${initialYear} Rankings — ${formatMeta.label}${
    superflex ? ' Superflex' : ''
  }`

  const unlockedCount = filtered.filter(
    (p) => !isRowLocked(p, position, isLoggedIn, previewIds),
  ).length

  return (
    <div>
      {/* SECTION 1 — Rankings identifier (static) */}
      <div
        className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
        style={{
          background: '#141824',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        }}
      >
        <h1
          className="font-display text-xs font-semibold tracking-[0.14em] text-gavfather-gold sm:text-sm"
          style={{ fontVariant: 'small-caps' }}
        >
          {initialYear} PRESEASON RANKINGS
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gavfather-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gavfather-navy">
            {formatMeta.badge}
          </span>
          {superflex && (
            <span className="rounded-full border border-gavfather-gold/60 bg-gavfather-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gavfather-gold">
              SUPERFLEX
            </span>
          )}
          <span className="rounded-full bg-gavfather-navy px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gavfather-muted">
            {DEFAULT_TEAMS}
          </span>
          <span className="rounded-full bg-gavfather-navy px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gavfather-muted">
            {DEFAULT_ROSTER}
          </span>
          <span className="text-[11px] text-gavfather-muted">{updatedLabel}</span>
        </div>
      </div>

      {fantasyPros?.submitted && (
        <div className="mt-2">
          {fantasyPros.url ? (
            <a
              href={fantasyPros.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gavfather-gold/80 transition hover:text-gavfather-gold"
            >
              {fantasyPros.label || 'Submitted to FantasyPros ECR'} ↗
            </a>
          ) : (
            <p className="text-[11px] font-medium text-gavfather-gold/80">
              {fantasyPros.label || 'Submitted to FantasyPros ECR'}
            </p>
          )}
        </div>
      )}

      {/* SECTION 2 — Scoring format (always visible) */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gavfather-muted">
          Scoring format
        </p>
        <div className="flex flex-wrap gap-2">
          {FORMAT_PRESETS.map((f) => {
            const active = format === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFormatChange(f.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'border-2 border-gavfather-gold bg-gavfather-gold/15 text-gavfather-gold'
                    : 'border border-gavfather-border bg-gavfather-navy text-gavfather-muted hover:text-gavfather-text'
                }`}
                aria-pressed={active}
              >
                {f.label}
                {active ? ' ✓' : ''}
              </button>
            )
          })}
        </div>

        {/* Superflex = roster construction, not scoring */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gavfather-muted">
            Roster
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={superflex}
            onClick={() => onSuperflexChange(!superflex)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold transition ${
              superflex
                ? 'border-gavfather-gold bg-gavfather-gold/15 text-gavfather-gold'
                : 'border-gavfather-border bg-gavfather-navy text-gavfather-muted hover:text-gavfather-text'
            }`}
          >
            <span
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition ${
                superflex ? 'bg-gavfather-gold' : 'bg-gavfather-border'
              }`}
              aria-hidden
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-gavfather-navy transition ${
                  superflex ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
            Superflex (2-QB) {superflex ? 'ON' : 'OFF'}
          </button>
          <span className="text-[11px] text-gavfather-muted">
            Affects draft order, not points scoring
          </span>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-gavfather-muted">
          Rankings recalculate instantly for your format. Sign in free to customize
          league size and roster slots.
        </p>
      </div>

      {/* SECTION 2b — Customize panel (collapsed by default) */}
      <div className="mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCustomizeOpen((o) => !o)}
            className="rounded-md border border-gavfather-border bg-transparent px-3 py-1.5 text-xs text-gavfather-muted transition hover:border-gavfather-muted hover:text-gavfather-text"
          >
            {customizeOpen
              ? '⚙ Customize for your league scoring ↑'
              : '⚙ Customize for your league scoring →'}
          </button>
          {isCustomized && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="text-xs text-gavfather-gold underline-offset-2 hover:underline"
            >
              Reset to default
            </button>
          )}
          <div className="ml-auto hidden sm:block">
            <ShareButtons title={shareTitle} path={sharePath} label="Copy link" />
          </div>
        </div>

        {customizeOpen && (
          <div className="mt-2 rounded-lg border border-gavfather-border bg-gavfather-slate p-3">
            <p className="text-xs text-gavfather-muted">
              Default board: <span className="text-gavfather-text">Standard</span>,
              12 teams, 1-QB roster. Switch scoring above — Superflex only changes
              where QBs are drafted, not how points are scored.
            </p>
            {isCustomized && (
              <p className="mt-2 text-xs text-gavfather-gold">
                Showing {formatMeta.label}
                {superflex ? ' · Superflex (2-QB)' : ''} rankings
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3 — Search + position filter */}
      <div className="mt-3 space-y-2">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search players (e.g. Josh Allen, Chiefs RB...)"
          className="block w-full rounded-md border border-gavfather-border bg-gavfather-slate px-3 py-2 text-sm text-gavfather-text outline-none placeholder:text-gavfather-muted/50 focus:border-gavfather-gold"
          aria-label="Search players"
        />

        <div className="flex flex-wrap gap-1.5">
          {POSITIONS.map((pos) => {
            const active = position === pos
            return (
              <button
                key={pos}
                type="button"
                onClick={() => onPositionChange(pos)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide transition ${
                  active
                    ? 'bg-gavfather-gold text-gavfather-navy'
                    : 'bg-gavfather-slate text-gavfather-muted hover:text-gavfather-text'
                }`}
              >
                {pos}
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-gavfather-muted">
        Showing {unlockedCount}
        {freemiumCapped ? ` of ${filtered.length}` : ''} players
        {freemiumCapped ? ' · free preview = top 10 per position' : ''}
      </p>

      {/* Desktop table */}
      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-gavfather-border md:block">
        <table className="w-full min-w-[960px] text-left">
          <thead className="bg-gavfather-slate text-[11px] uppercase tracking-wider text-gavfather-muted">
            <tr>
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Player</th>
              <th className="px-3 py-3">Pos</th>
              <th className="px-3 py-3">Team</th>
              <th className="px-3 py-3">{formatMeta.ppgHeader}</th>
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
      <div className="mt-3 space-y-3 md:hidden">
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
