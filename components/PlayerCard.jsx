import Link from 'next/link'
import OutlookBadge from './OutlookBadge'
import PositionBadge from './PositionBadge'
import ScarcityMeter from './ScarcityMeter'
import { formatWeekShort } from '../lib/rankings'

function factorText(text, negative = false) {
  if (!text) return null
  const clean = text.replace(/^[↑↓]\s*/, '')
  return (
    <p className={`truncate text-xs italic ${negative ? 'text-red-400' : 'text-gavfather-muted'}`}>
      {negative ? '↓' : '↑'} {clean}
    </p>
  )
}

function hasMatchup(player) {
  const opponent = player?.opponent
  if (opponent == null || opponent === '') return false
  const grade = player?.matchupGrade
  if (grade == null || grade === '' || Number(grade) === 0) return false
  return true
}

export default function PlayerCard({
  player,
  week,
  variant = 'offer',
}) {
  const isFade = variant === 'fade'
  const border = isFade ? 'border-l-gavfather-fade' : 'border-l-gavfather-gold'
  const scoreColor = isFade ? 'text-gavfather-fade' : 'text-gavfather-gold'
  const href = `/rankings?week=${week != null ? week : ''}&search=${encodeURIComponent(player.name)}`
  const showMatchup = hasMatchup(player)
  const matchupGrade = Number(player.matchupGrade)

  return (
    <Link
      href={href}
      className={`group block rounded-xl border border-gavfather-border border-l-4 ${border} bg-gavfather-slate p-4 transition duration-300 hover:-translate-y-1 hover:border-gavfather-gold/40 hover:bg-gavfather-hover hover:shadow-gold-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gavfather-gold`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-3xl font-semibold text-gavfather-gold">
            {player.rank}
          </span>
          <PositionBadge position={player.position} />
        </div>
        <OutlookBadge outlook={player.outlook} />
      </div>

      <h3 className="mt-3 text-lg font-bold text-gavfather-text">{player.name}</h3>
      <p className="mt-0.5 text-sm text-gavfather-muted">
        {player.team}
        {showMatchup ? ` vs ${player.opponent}` : ''}
        {week != null ? ` | ${formatWeekShort(week)}` : ''}
      </p>

      <p className={`mt-3 font-mono text-3xl font-bold tabular-nums ${scoreColor}`}>
        {Number(player.finalScore).toFixed(1)}
      </p>

      <div className="mt-3 space-y-1">
        {factorText(player.topFactor1, isFade)}
        {factorText(player.topFactor2, isFade)}
      </div>

      {showMatchup && (
        <div className="mt-4">
          <ScarcityMeter grade={matchupGrade} />
        </div>
      )}

      <span className="mt-3 inline-block text-xs font-medium text-gavfather-gold">
        View on board →
      </span>
    </Link>
  )
}
