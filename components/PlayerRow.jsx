'use client'

import { useState } from 'react'
import OutlookBadge from './OutlookBadge'
import PositionBadge from './PositionBadge'
import StatTooltip from './StatTooltip'

function matchupLetter(grade) {
  const g = Number(grade) || 0
  if (g >= 80) return { letter: 'A', className: 'text-gavfather-smash' }
  if (g >= 65) return { letter: 'B', className: 'text-gavfather-play' }
  if (g >= 50) return { letter: 'C', className: 'text-orange-400' }
  return { letter: g >= 35 ? 'D' : 'F', className: 'text-gavfather-fade' }
}

function rowAccent(player) {
  const injured = player.injury && !/healthy|active/i.test(player.injury)
  if (injured) return 'border-l-gavfather-fade'
  if (player.outlook === 'SMASH') return 'border-l-gavfather-smash'
  if (String(player.outlook).includes('FADE')) return 'border-l-gavfather-fade'
  if (player.rank <= 5) return 'border-l-gavfather-gold'
  return 'border-l-transparent'
}

export default function PlayerRow({ player, compact = false }) {
  const [open, setOpen] = useState(false)
  const matchup = matchupLetter(player.matchupGrade)
  const injured = player.injury && !/healthy|active/i.test(player.injury)
  const accent = rowAccent(player)
  const rankGold = player.rank <= 5 ? 'text-gavfather-gold' : 'text-gavfather-muted'

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-xl border border-gavfather-border border-l-4 ${accent} bg-gavfather-slate p-4 text-left transition hover:bg-gavfather-hover`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-display text-xl font-semibold ${rankGold}`}>
                {player.rank}
              </span>
              <PositionBadge position={player.position} />
              <OutlookBadge outlook={player.outlook} />
            </div>
            <p className="mt-1 truncate font-semibold text-gavfather-text">{player.name}</p>
            <p className="text-xs text-gavfather-muted">
              {player.team}
              {player.opponent ? ` vs ${player.opponent}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-gavfather-gold">
              {Number(player.finalScore).toFixed(1)}
            </p>
            <p className={`text-xs font-semibold ${matchup.className}`}>
              {matchup.letter} ({Number(player.matchupGrade).toFixed(0)})
            </p>
          </div>
        </div>
        {injured && (
          <p className="mt-2 text-xs font-medium text-gavfather-fade">{player.injury}</p>
        )}
        {player.topFactor1 && (
          <p className="mt-2 truncate text-xs italic text-gavfather-muted">{player.topFactor1}</p>
        )}
        {open && <ExpandedScores player={player} />}
      </button>
    )
  }

  return (
    <>
      <tr
        onClick={() => setOpen((v) => !v)}
        className={`cursor-pointer border-b border-gavfather-border border-l-4 ${accent} transition hover:bg-gavfather-hover/80`}
      >
        <td className={`px-3 py-3 font-display text-lg font-semibold ${rankGold}`}>
          {player.rank}
        </td>
        <td className="px-3 py-3">
          <div className="font-semibold text-gavfather-text">{player.name}</div>
          <div className="text-xs text-gavfather-muted">{player.team}</div>
        </td>
        <td className="px-3 py-3">
          <PositionBadge position={player.position} />
        </td>
        <td className="px-3 py-3 text-sm text-gavfather-muted">
          {player.opponent || '—'}
        </td>
        <td className={`px-3 py-3 font-mono text-sm font-semibold ${matchup.className}`}>
          <StatTooltip label={`Matchup grade ${Number(player.matchupGrade).toFixed(1)} / 100`}>
            {matchup.letter}
          </StatTooltip>
        </td>
        <td className="px-3 py-3 text-xs">
          {injured ? (
            <span className="rounded bg-gavfather-fade/20 px-1.5 py-0.5 font-medium text-gavfather-fade">
              {player.injury}
            </span>
          ) : (
            <span className="text-gavfather-muted/50">—</span>
          )}
        </td>
        <td className="px-3 py-3 font-mono text-base font-bold text-gavfather-gold">
          {Number(player.finalScore).toFixed(1)}
        </td>
        <td className="px-3 py-3">
          <OutlookBadge outlook={player.outlook} />
        </td>
        <td className="max-w-[220px] truncate px-3 py-3 text-xs italic text-gavfather-muted">
          {player.topFactor1 || '—'}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-gavfather-border bg-gavfather-navy/60">
          <td colSpan={9} className="px-4 py-4">
            <ExpandedScores player={player} />
          </td>
        </tr>
      )}
    </>
  )
}

function ExpandedScores({ player }) {
  const scores = [
    { label: 'Edge', value: player.edgeScore },
    { label: 'Hidden', value: player.hiddenScore },
    { label: 'Research', value: player.researchScore },
    { label: 'Contextual', value: player.contextualScore },
    { label: 'Final', value: player.finalScore, highlight: true },
  ]

  return (
    <div className="animate-[fadeIn_0.2s_ease]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {scores.map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border px-3 py-2 ${
              s.highlight
                ? 'border-gavfather-gold/40 bg-gavfather-gold/10'
                : 'border-gavfather-border bg-gavfather-slate'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-gavfather-muted">
              {s.label}
            </div>
            <div
              className={`font-mono text-lg font-bold ${
                s.highlight ? 'text-gavfather-gold' : 'text-gavfather-text'
              }`}
            >
              {Number(s.value).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-sm text-gavfather-muted md:grid-cols-2">
        <p>
          <span className="text-gavfather-gold">Factor 1:</span>{' '}
          {player.topFactor1 || '—'}
        </p>
        <p>
          <span className="text-gavfather-gold">Factor 2:</span>{' '}
          {player.topFactor2 || '—'}
        </p>
        {player.byeWeek && (
          <p>
            <span className="text-gavfather-gold">Bye:</span> Week {player.byeWeek}
          </p>
        )}
        {player.injury && (
          <p>
            <span className="text-gavfather-gold">Injury:</span> {player.injury}
          </p>
        )}
      </div>
    </div>
  )
}
