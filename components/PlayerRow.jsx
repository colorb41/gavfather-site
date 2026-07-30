'use client'

import PositionBadge from './PositionBadge'
import OutlookBadge from './OutlookBadge'

const RELIABILITY_STYLES = {
  PROVEN_ELITE: 'bg-gavfather-gold/20 text-gavfather-gold border-gavfather-gold/40',
  EMERGING_ELITE: 'bg-gavfather-gold/20 text-gavfather-gold border-gavfather-gold/40',
  PROVEN_SOLID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  EMERGING: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  INJURY_RISK: 'bg-red-500/20 text-red-300 border-red-500/40',
  UNPROVEN: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
  VOLATILE: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  BASELINE: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
}

const TIER_STYLES = {
  Elite: 'text-gavfather-gold',
  QB1: 'text-emerald-300',
  'RB1/2': 'text-emerald-300',
  'WR1/2': 'text-emerald-300',
  TE1: 'text-emerald-300',
  'TE1/2': 'text-emerald-300',
  QB2: 'text-sky-300',
  RB3: 'text-sky-300',
  WR3: 'text-sky-300',
  TE2: 'text-sky-300',
  Streamable: 'text-gavfather-muted',
  Streamer: 'text-gavfather-muted',
  Flex: 'text-gavfather-muted',
  Handcuff: 'text-gavfather-muted',
  Deep: 'text-gavfather-muted',
  Avoid: 'text-gavfather-fade',
}

function ReliabilityBadge({ value }) {
  const key = String(value || '').toUpperCase().replace(/\s+/g, '_')
  if (!key || key === '—' || key === '-') {
    return <span className="text-gavfather-muted/50">—</span>
  }
  const style = RELIABILITY_STYLES[key] || RELIABILITY_STYLES.UNPROVEN
  const label = key.replace(/_/g, ' ')
  return (
    <span
      className={`inline-flex max-w-[140px] truncate rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style}`}
      title={label}
    >
      {label}
    </span>
  )
}

function InjuryBadge({ injury }) {
  const raw = String(injury || '').trim()
  if (!raw || /^healthy$/i.test(raw) || /^active$/i.test(raw)) {
    return <span className="text-gavfather-muted/40">—</span>
  }
  const lower = raw.toLowerCase()
  if (lower.includes('questionable') || lower === 'q') {
    return (
      <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300">
        Q
      </span>
    )
  }
  if (lower.includes('doubtful') || lower === 'd') {
    return (
      <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">
        D
      </span>
    )
  }
  if (
    lower.includes('out') ||
    lower === 'ir' ||
    lower.includes('injured reserve') ||
    lower.includes('pup')
  ) {
    return (
      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
        OUT
      </span>
    )
  }
  return (
    <span className="rounded bg-gavfather-fade/20 px-1.5 py-0.5 text-[10px] font-medium text-gavfather-fade">
      {raw.length > 12 ? `${raw.slice(0, 12)}…` : raw}
    </span>
  )
}

function TierText({ tier }) {
  const t = String(tier || '—')
  const style = TIER_STYLES[t] || 'text-gavfather-muted'
  return <span className={`text-xs font-semibold ${style}`}>{t}</span>
}

function LockIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z" />
    </svg>
  )
}

function Blur({ children, active }) {
  if (!active) return children
  return (
    <span className="inline-block select-none blur-[6px] saturate-50" aria-hidden>
      {children}
    </span>
  )
}

function lastNameOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return parts.length ? parts[parts.length - 1] : 'This player'
}

/**
 * vs Market ADP pill — BUY (green) / FADE (red). Hidden for NEUTRAL / missing ADP.
 */
export function AdpVsMarketPill({ player }) {
  const signal = String(player?.adpSignal || player?.adp_signal || '')
    .trim()
    .toUpperCase()
  const marketRaw =
    player?.consensusAdpPositional ?? player?.consensus_adp_positional
  const ourRaw = player?.ourPositionalRank ?? player?.our_positional_rank
  const pos = String(player?.position || '').toUpperCase()

  if (signal !== 'BUY' && signal !== 'FADE') return null
  if (marketRaw == null || marketRaw === '') return null
  if (ourRaw == null || ourRaw === '') return null

  const market = Math.round(Number(marketRaw))
  const ours = Math.round(Number(ourRaw))
  if (!Number.isFinite(market) || !Number.isFinite(ours)) return null
  if (!pos) return null

  const isBuy = signal === 'BUY'
  const label = isBuy
    ? `▲ ${pos}${ours} vs ${pos}${market}`
    : `▼ ${pos}${ours} vs ${pos}${market}`

  const who = lastNameOf(player?.name)
  const title = isBuy
    ? `The Gavfather ranks ${who} as ${pos}${ours}. The market drafts them as ${pos}${market}. We think they're being undervalued.`
    : `The Gavfather ranks ${who} as ${pos}${ours}. The market drafts them as ${pos}${market}. We think they're being overvalued.`

  return (
    <span
      title={title}
      className={`inline-flex max-w-full cursor-help truncate rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
        isBuy
          ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
          : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
      }`}
    >
      {label}
    </span>
  )
}

/**
 * Rankings row.
 *
 * When locked (freemium teaser):
 * - Rank number VISIBLE
 * - Position badge VISIBLE
 * - Name / team / score / other stats BLURRED
 * - Lock icon shown beside the name
 */
export default function PlayerRow({
  player,
  compact = false,
  locked = false,
  displayRank,
  fadeOut = false,
}) {
  const rank = displayRank ?? player.rank
  const rankGold = rank <= 5 ? 'text-gavfather-gold' : 'text-gavfather-muted'
  const ppg = Number(player.score ?? player.projectedPpg ?? 0)
  const sit =
    player.situation == null || Number.isNaN(Number(player.situation))
      ? '—'
      : Number(player.situation).toFixed(1)
  const outlook =
    player.outlook ||
    String(player.tier || 'NEUTRAL')
      .toUpperCase()
      .replace(/\s+/g, '_')

  if (compact) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-gavfather-border bg-gavfather-slate p-4 text-left ${
          locked ? 'select-none' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-display text-xl font-semibold ${rankGold}`}>{rank}</span>
              <PositionBadge position={player.position} />
              {locked && (
                <span className="text-gavfather-gold/80" title="Sign in to unlock">
                  <LockIcon />
                </span>
              )}
            </div>
            <p className="mt-1 truncate font-semibold text-gavfather-text">
              <Blur active={locked}>{player.name}</Blur>
            </p>
            <p className="mt-0.5 text-xs text-gavfather-muted">
              <Blur active={locked}>{player.team || '—'}</Blur>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Blur active={locked}>
                <AdpVsMarketPill player={player} />
              </Blur>
              <Blur active={locked}>
                <OutlookBadge outlook={outlook} />
              </Blur>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-gavfather-gold">
              <Blur active={locked}>{ppg.toFixed(1)}</Blur>
            </p>
            <div className="mt-1 flex justify-end">
              <Blur active={locked}>
                <InjuryBadge injury={player.injury} />
              </Blur>
            </div>
          </div>
        </div>
        {fadeOut && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-gradient-to-b from-transparent via-gavfather-navy/40 to-gavfather-navy"
            aria-hidden
          />
        )}
      </div>
    )
  }

  return (
    <tr
      className={`relative border-b border-gavfather-border transition ${
        locked ? 'select-none' : 'hover:bg-gavfather-hover/80'
      }`}
    >
      {/* Rank — always visible */}
      <td className={`px-3 py-3 font-display text-lg font-semibold ${rankGold}`}>{rank}</td>

      {/* Player name — blurred when locked */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          {locked && (
            <span className="shrink-0 text-gavfather-gold/80" title="Sign in to unlock">
              <LockIcon />
            </span>
          )}
          <div className="font-semibold text-gavfather-text">
            <Blur active={locked}>{player.name}</Blur>
          </div>
        </div>
      </td>

      {/* Position — always visible */}
      <td className="hidden px-3 py-3 md:table-cell">
        <PositionBadge position={player.position} />
      </td>

      {/* Team — blurred when locked */}
      <td className="hidden px-3 py-3 text-sm text-gavfather-muted md:table-cell">
        <Blur active={locked}>{player.team || '—'}</Blur>
      </td>

      {/* Score — blurred when locked */}
      <td className="px-3 py-3 font-mono text-base font-bold text-gavfather-gold">
        <Blur active={locked}>{ppg.toFixed(1)}</Blur>
      </td>

      {/* vs Market ADP */}
      <td className="px-3 py-3">
        <Blur active={locked}>
          <AdpVsMarketPill player={player} />
        </Blur>
      </td>

      {/* Outlook */}
      <td className="hidden px-3 py-3 md:table-cell">
        <Blur active={locked}>
          <OutlookBadge outlook={outlook} />
        </Blur>
      </td>

      <td className="hidden px-3 py-3 md:table-cell">
        <Blur active={locked}>
          <ReliabilityBadge value={player.reliability} />
        </Blur>
      </td>
      <td className="hidden px-3 py-3 font-mono text-sm text-gavfather-text md:table-cell">
        <Blur active={locked}>{sit}</Blur>
      </td>
      <td className="px-3 py-3 text-xs">
        <Blur active={locked}>
          <InjuryBadge injury={player.injury} />
        </Blur>
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <Blur active={locked}>
          <TierText tier={player.tier} />
        </Blur>
      </td>
    </tr>
  )
}
