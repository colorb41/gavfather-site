'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PlayerRow from './PlayerRow'
import ShareButtons from './ShareButtons'
import FreemiumGate, {
  FREE_ALL_LIMIT,
  FREE_POS_LIMIT,
  splitFreemiumRows,
} from './FreemiumGate'
import {
  rankPlayersByFormat,
  normalizeScoringFormat,
  FORMAT_META,
  FORMAT_IDS,
} from '../lib/rankPlayersByFormat'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE']
const ADP_FILTERS = [
  { id: 'ALL', label: 'All Players' },
  { id: 'BUY', label: '🟢 Buy' },
  { id: 'FADE', label: '🔴 Fade' },
]
const DEFAULT_FORMAT = 'std'
const DEFAULT_TEAMS = '12 Teams'
const DEFAULT_ROSTER = 'Standard Roster'
const TABLE_COL_SPAN = 11

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

function normalizeAdpFilter(raw) {
  const f = String(raw || 'ALL').toUpperCase()
  return f === 'BUY' || f === 'FADE' ? f : 'ALL'
}

function playerAdpSignal(player) {
  return String(player?.adpSignal || player?.adp_signal || '')
    .trim()
    .toUpperCase()
}

function rowDisplayRank(player, position) {
  return position === 'ALL' ? player.rank : player.positionalRank || player.rank
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
  totalPlayers: totalPlayersProp,
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
  const [adpFilter, setAdpFilter] = useState(() =>
    normalizeAdpFilter(searchParams.get('adp')),
  )

  useEffect(() => {
    const q = searchParams.get('search')
    if (q != null) setSearch(q)
    const pos = searchParams.get('pos')
    if (pos != null) setPosition(normalizePos(pos))
    const fmt = searchParams.get('format')
    if (fmt != null) setFormat(normalizeScoringFormat(fmt))
    const sf = searchParams.get('superflex')
    if (sf != null) setSuperflex(sf === '1' || sf === 'true')
    const adp = searchParams.get('adp')
    if (adp != null) setAdpFilter(normalizeAdpFilter(adp))
  }, [searchParams])

  useEffect(() => {
    setFormat(normalizeScoringFormat(initialFormat || DEFAULT_FORMAT))
  }, [initialFormat])

  useEffect(() => {
    setSuperflex(Boolean(initialSuperflex))
  }, [initialSuperflex])

  const rankedPlayers = useMemo(
    () => rankPlayersByFormat(initialPlayers, format, { superflex }),
    [initialPlayers, format, superflex],
  )

  const signalCounts = useMemo(() => {
    let buy = 0
    let fade = 0
    for (const p of rankedPlayers) {
      const sig = playerAdpSignal(p)
      if (sig === 'BUY') buy += 1
      else if (sig === 'FADE') fade += 1
    }
    return { buy, fade }
  }, [rankedPlayers])

  const totalPlayers =
    Number(totalPlayersProp) || rankedPlayers.length || previewPlayers.length || 0

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

    if (adpFilter === 'BUY' || adpFilter === 'FADE') {
      list = list.filter((p) => playerAdpSignal(p) === adpFilter)
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
  }, [rankedPlayers, position, search, adpFilter])

  const { unlocked, blurred, showGate } = useMemo(
    () => splitFreemiumRows(filtered, position, isLoggedIn || !freemiumCapped),
    [filtered, position, isLoggedIn, freemiumCapped],
  )

  const pushUrl = useCallback(
    ({ nextFormat, nextPos, nextSearch, nextSuperflex, nextAdp } = {}) => {
      const params = new URLSearchParams()
      const fmt = normalizeScoringFormat(nextFormat ?? format)
      const pos = nextPos ?? position
      const q = nextSearch !== undefined ? nextSearch : search
      const sf = nextSuperflex !== undefined ? nextSuperflex : superflex
      const adp = normalizeAdpFilter(nextAdp ?? adpFilter)

      if (fmt && fmt !== DEFAULT_FORMAT) params.set('format', fmt)
      if (sf) params.set('superflex', '1')
      if (pos && pos !== 'ALL') params.set('pos', pos)
      if (adp && adp !== 'ALL') params.set('adp', adp)
      if (q && String(q).trim()) params.set('search', String(q).trim())

      const qs = params.toString()
      router.replace(qs ? `/rankings?${qs}` : '/rankings', { scroll: false })
    },
    [format, position, search, superflex, adpFilter, router],
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
    setAdpFilter('ALL')
    pushUrl({
      nextFormat: DEFAULT_FORMAT,
      nextSuperflex: false,
      nextAdp: 'ALL',
    })
  }

  function onPositionChange(pos) {
    setPosition(pos)
    pushUrl({ nextPos: pos })
  }

  function onAdpFilterChange(next) {
    const adp = normalizeAdpFilter(next)
    setAdpFilter(adp)
    pushUrl({ nextAdp: adp })
  }

  function onSearchChange(value) {
    setSearch(value)
  }

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
  }${adpFilter !== 'ALL' ? `&adp=${adpFilter}` : ''}`
  const shareTitle = `The Gavfather ${initialYear} Rankings — ${formatMeta.label}${
    superflex ? ' Superflex' : ''
  }`

  const gated = freemiumCapped && !isLoggedIn

  const countLabel = gated
    ? position === 'ALL'
      ? `Showing top ${FREE_ALL_LIMIT} of ${totalPlayers.toLocaleString()} players — sign in to see all`
      : `Showing top ${FREE_POS_LIMIT} of ${filtered.length.toLocaleString()} ${position}s — sign in to see all`
    : adpFilter !== 'ALL'
      ? `Showing ${filtered.length.toLocaleString()} ${adpFilter} signals | ${formatMeta.label} | ${DEFAULT_TEAMS}`
      : `Showing all ${totalPlayers.toLocaleString()} players | ${formatMeta.label} | ${DEFAULT_TEAMS}`

  const gateVariant = position === 'ALL' ? 'full' : 'position'
  const showFade = gated && showGate && unlocked.length > 0

  return (
    <div className="relative">
      {/* SECTION 1 — Rankings identifier */}
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
          {isLoggedIn && (
            <span className="rounded-full border border-gavfather-gold/50 bg-gavfather-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gavfather-gold">
              Free Member
            </span>
          )}
          <span className="rounded-full bg-gavfather-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gavfather-navy">
            {formatMeta.badge}
          </span>
          {superflex && (
            <span className="rounded-full border border-gavfather-gold/60 bg-gavfather-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gavfather-gold">
              SUPERFLEX
            </span>
          )}
          <span className="rounded-full bg-gavfather-navy px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gavfather-muted">
            {DEFAULT_TEAMS.toUpperCase()}
          </span>
          <span className="rounded-full bg-gavfather-navy px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gavfather-muted">
            {DEFAULT_ROSTER}
          </span>
          <span className="text-[11px] text-gavfather-muted">{updatedLabel}</span>
        </div>
      </div>

      {/* ADP signal stats bar */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[12px] sm:px-0">
        <span className="font-semibold text-emerald-300">
          {signalCounts.buy} BUY signals
        </span>
        <span className="text-gavfather-muted">|</span>
        <span className="font-semibold text-red-300">
          {signalCounts.fade} FADE signals today
        </span>
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

      {/* SECTION 2 — Scoring format */}
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

      {/* SECTION 2b — Customize panel */}
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

      {/* SECTION 3 — Search + position + ADP filters */}
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

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-gavfather-muted">
            vs Market
          </span>
          {ADP_FILTERS.map((f) => {
            const active = adpFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onAdpFilterChange(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide transition ${
                  active
                    ? f.id === 'BUY'
                      ? 'bg-emerald-500 text-gavfather-navy'
                      : f.id === 'FADE'
                        ? 'bg-red-500 text-white'
                        : 'bg-gavfather-gold text-gavfather-navy'
                    : 'bg-gavfather-slate text-gavfather-muted hover:text-gavfather-text'
                }`}
                aria-pressed={active}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-gavfather-muted">{countLabel}</p>

      {/* Desktop table */}
      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-gavfather-border md:block">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="bg-gavfather-slate text-[11px] uppercase tracking-wider text-gavfather-muted">
            <tr>
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Player</th>
              <th className="px-3 py-3">Pos</th>
              <th className="px-3 py-3">Team</th>
              <th className="px-3 py-3">{formatMeta.ppgHeader}</th>
              <th className="px-3 py-3">vs Market</th>
              <th className="px-3 py-3">Outlook</th>
              <th className="px-3 py-3">Reliability</th>
              <th className="px-3 py-3">Situation</th>
              <th className="px-3 py-3">Injury</th>
              <th className="px-3 py-3">Tier</th>
            </tr>
          </thead>
          <tbody>
            {unlocked.map((p, i) => (
              <PlayerRow
                key={`${p.rank}-${p.name}`}
                player={p}
                locked={false}
                displayRank={rowDisplayRank(p, position)}
                fadeOut={showFade && i === unlocked.length - 1}
              />
            ))}

            {showFade && (
              <tr className="border-0">
                <td colSpan={TABLE_COL_SPAN} className="relative h-0 p-0">
                  <div
                    className="pointer-events-none absolute inset-x-0 -top-14 z-10 h-14 bg-gradient-to-b from-transparent to-gavfather-navy/80"
                    aria-hidden
                  />
                </td>
              </tr>
            )}

            {blurred.map((p) => (
              <PlayerRow
                key={`${p.rank}-${p.name}-locked`}
                player={p}
                locked
                displayRank={rowDisplayRank(p, position)}
              />
            ))}

            {gated && showGate && (
              <>
                <tr className="border-0">
                  <td colSpan={TABLE_COL_SPAN} className="relative h-0 p-0">
                    <div
                      className="pointer-events-none absolute inset-x-0 -top-24 z-10 h-24 bg-gradient-to-b from-transparent via-gavfather-navy/70 to-gavfather-navy"
                      aria-hidden
                    />
                  </td>
                </tr>
                <FreemiumGate
                  asTableRow
                  variant={gateVariant}
                  position={position}
                  totalPlayers={totalPlayers}
                  colSpan={TABLE_COL_SPAN}
                />
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="mt-3 space-y-3 md:hidden">
        {unlocked.map((p, i) => (
          <PlayerRow
            key={`${p.rank}-${p.name}-m`}
            player={p}
            compact
            locked={false}
            displayRank={rowDisplayRank(p, position)}
            fadeOut={showFade && i === unlocked.length - 1}
          />
        ))}

        {(blurred.length > 0 || (gated && showGate)) && (
          <div className="relative">
            {showFade && (
              <div
                className="pointer-events-none absolute inset-x-0 -top-10 z-10 h-10 bg-gradient-to-b from-transparent to-gavfather-navy/90"
                aria-hidden
              />
            )}
            <div className="space-y-3">
              {blurred.map((p) => (
                <PlayerRow
                  key={`${p.rank}-${p.name}-m-locked`}
                  player={p}
                  compact
                  locked
                  displayRank={rowDisplayRank(p, position)}
                />
              ))}
            </div>
            {gated && showGate && (
              <div className="relative z-20 -mt-8">
                <div
                  className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-b from-transparent to-gavfather-navy"
                  aria-hidden
                />
                <FreemiumGate
                  variant={gateVariant}
                  position={position}
                  totalPlayers={totalPlayers}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!filtered.length && (
        <p className="mt-10 text-center text-gavfather-muted">
          No players match these filters.
        </p>
      )}
    </div>
  )
}
