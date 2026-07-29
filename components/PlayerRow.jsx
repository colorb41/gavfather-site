'use client'

import PositionBadge from './PositionBadge'

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

function LockOverlay() {
  return (
    <span className="inline-flex items-center gap-1 text-gavfather-gold/80">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z" />
      </svg>
    </span>
  )
}

export default function PlayerRow({
  player,
  compact = false,
  locked = false,
  displayRank,
}) {
  const rank = displayRank ?? player.rank
  const rankGold = rank <= 5 ? 'text-gavfather-gold' : 'text-gavfather-muted'
  const ppg = Number(player.score ?? player.projectedPpg ?? 0)
  const sit =
    player.situation == null || Number.isNaN(Number(player.situation))
      ? '—'
      : Number(player.situation).toFixed(1)

  if (compact) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-gavfather-border bg-gavfather-slate p-4 text-left ${
          locked ? 'select-none' : ''
        }`}
      >
        <div className={`flex items-start justify-between gap-3 ${locked ? 'blur-sm' : ''}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-display text-xl font-semibold ${rankGold}`}>
                {rank}
              </span>
              <PositionBadge position={player.position} />
            </div>
            <p className="mt-1 truncate font-semibold text-gavfather-text">{player.name}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-gavfather-gold">
              {ppg.toFixed(1)}
            </p>
            <div className="mt-1 flex justify-end">
              <InjuryBadge injury={player.injury} />
            </div>
          </div>
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-gavfather-navy/40">
            <LockOverlay />
          </div>
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
      <td className={`px-3 py-3 font-display text-lg font-semibold ${rankGold} ${locked ? 'blur-sm' : ''}`}>
        {locked ? <LockOverlay /> : rank}
      </td>
      <td className={`px-3 py-3 ${locked ? 'blur-sm' : ''}`}>
        <div className="font-semibold text-gavfather-text">{player.name}</div>
      </td>
      <td className={`hidden px-3 py-3 md:table-cell ${locked ? 'blur-sm' : ''}`}>
        <PositionBadge position={player.position} />
      </td>
      <td className={`hidden px-3 py-3 text-sm text-gavfather-muted md:table-cell ${locked ? 'blur-sm' : ''}`}>
        {player.team || '—'}
      </td>
      <td className={`px-3 py-3 font-mono text-base font-bold text-gavfather-gold ${locked ? 'blur-sm' : ''}`}>
        {ppg.toFixed(1)}
      </td>
      <td className={`hidden px-3 py-3 md:table-cell ${locked ? 'blur-sm' : ''}`}>
        <ReliabilityBadge value={player.reliability} />
      </td>
      <td className={`hidden px-3 py-3 font-mono text-sm text-gavfather-text md:table-cell ${locked ? 'blur-sm' : ''}`}>
        {sit}
      </td>
      <td className={`px-3 py-3 text-xs ${locked ? 'blur-sm' : ''}`}>
        <InjuryBadge injury={player.injury} />
      </td>
      <td className={`hidden px-3 py-3 md:table-cell ${locked ? 'blur-sm' : ''}`}>
        <TierText tier={player.tier} />
      </td>
    </tr>
  )
}
