'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PlayerRow from './PlayerRow'
import ShareButtons from './ShareButtons'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE']
const FORMAT_LABELS = {
  ppr: 'PPR',
  half_ppr: 'Half PPR',
  standard: 'Standard',
}
const SORTS = [
  { id: 'final', label: 'Final Score' },
  { id: 'edge', label: 'Edge Score' },
  { id: 'matchup', label: 'Matchup Grade' },
  { id: 'adp', label: 'ADP Diff' },
]

export default function RankingsBoard({
  initialPlayers,
  weeks,
  initialWeek,
  initialYear,
  initialFormat,
  updatedAt,
  fantasyPros,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [position, setPosition] = useState('ALL')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sort, setSort] = useState('final')
  const [format, setFormat] = useState(initialFormat || 'ppr')
  const [weekKey, setWeekKey] = useState(`${initialYear}-${initialWeek}`)

  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])

  useEffect(() => {
    setFormat(initialFormat || 'ppr')
    setWeekKey(`${initialYear}-${initialWeek}`)
  }, [initialFormat, initialWeek, initialYear])

  const availableFormats = useMemo(() => {
    const week = weeks.find((w) => w.week === initialWeek && w.year === initialYear)
    const formats = week?.formats?.length ? week.formats : ['ppr']
    return formats.map((id) => ({
      id,
      label: FORMAT_LABELS[id] || id.toUpperCase(),
    }))
  }, [weeks, initialWeek, initialYear])

  const filtered = useMemo(() => {
    let list = [...initialPlayers]
    if (position !== 'ALL') {
      list = list.filter((p) => p.position === position)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      if (sort === 'edge') return b.edgeScore - a.edgeScore
      if (sort === 'matchup') return b.matchupGrade - a.matchupGrade
      if (sort === 'adp') return b.adpDiff - a.adpDiff
      return b.finalScore - a.finalScore
    })
    return list
  }, [initialPlayers, position, search, sort])

  function onWeekChange(value) {
    setWeekKey(value)
    const [year, week] = value.split('-')
    const nextWeek = weeks.find((w) => String(w.year) === year && String(w.week) === week)
    const nextFormat =
      nextWeek?.formats?.includes(format) ? format : nextWeek?.formats?.[0] || 'ppr'
    setFormat(nextFormat)
    const params = new URLSearchParams()
    params.set('week', week)
    params.set('year', year)
    params.set('format', nextFormat)
    router.push(`/rankings?${params.toString()}`)
  }

  function onFormatChange(next) {
    setFormat(next)
    const [year, week] = weekKey.split('-')
    const params = new URLSearchParams()
    params.set('week', week)
    params.set('year', year)
    params.set('format', next)
    router.push(`/rankings?${params.toString()}`)
  }

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  const sharePath = `/rankings?week=${initialWeek}&year=${initialYear}&format=${format}`
  const isDraft = Number(initialWeek) === 0
  const shareTitle = isDraft
    ? `The Gavfather Rankings — ${initialYear} Draft Rankings`
    : `The Gavfather Rankings — Week ${initialWeek} (${initialYear})`
  const boardLabel = isDraft
    ? `${initialYear} Draft Rankings`
    : `Week ${initialWeek}`

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-gavfather-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-5xl">
            THE GAVFATHER RANKINGS
          </h1>
          <p className="mt-2 text-sm text-gavfather-muted">
            {boardLabel} | Updated {updatedLabel}
          </p>
          {fantasyPros?.submitted && (
            fantasyPros.url ? (
              <a
                href={fantasyPros.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-gavfather-gold/30 bg-gavfather-gold/10 px-3 py-1 text-xs font-medium text-gavfather-gold transition hover:bg-gavfather-gold/20"
              >
                {fantasyPros.label || 'Submitted to FantasyPros ECR'} ↗
              </a>
            ) : (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-gavfather-gold/30 bg-gavfather-gold/10 px-3 py-1 text-xs font-medium text-gavfather-gold">
                {fantasyPros.label || 'Submitted to FantasyPros ECR'}
              </p>
            )
          )}
        </div>
        <ShareButtons title={shareTitle} path={sharePath} label="Copy week link" />
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-gavfather-border bg-gavfather-slate p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="text-xs uppercase tracking-wider text-gavfather-muted">
            Week
            <select
              value={weekKey}
              onChange={(e) => onWeekChange(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gavfather-border bg-gavfather-navy px-3 py-2 text-sm text-gavfather-text outline-none focus:border-gavfather-gold lg:w-48"
            >
              {weeks.map((w) => (
                <option key={`${w.year}-${w.week}`} value={`${w.year}-${w.week}`}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex-1 text-xs uppercase tracking-wider text-gavfather-muted">
            Search
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter players…"
              className="mt-1 block w-full rounded-md border border-gavfather-border bg-gavfather-navy px-3 py-2 text-sm text-gavfather-text outline-none placeholder:text-gavfather-muted/50 focus:border-gavfather-gold"
            />
          </label>

          <label className="text-xs uppercase tracking-wider text-gavfather-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gavfather-border bg-gavfather-navy px-3 py-2 text-sm text-gavfather-text outline-none focus:border-gavfather-gold lg:w-44"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex items-center gap-2">
            {availableFormats.length === 1 ? (
              <span className="rounded-md bg-gavfather-gold px-3 py-1.5 text-xs font-bold text-gavfather-navy">
                {availableFormats[0].label}
              </span>
            ) : (
              availableFormats.map((f) => (
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
              ))
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gavfather-muted">
        Showing {filtered.length} players · click a row to expand scores
      </p>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gavfather-border md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gavfather-slate text-[11px] uppercase tracking-wider text-gavfather-muted">
            <tr>
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Player</th>
              <th className="px-3 py-3">Pos</th>
              <th className="px-3 py-3">Opp</th>
              <th className="px-3 py-3">Matchup</th>
              <th className="px-3 py-3">Injury</th>
              <th className="px-3 py-3">Score</th>
              <th className="px-3 py-3">Outlook</th>
              <th className="px-3 py-3">Top Factor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <PlayerRow key={`${p.rank}-${p.name}`} player={p} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((p) => (
          <PlayerRow key={`${p.rank}-${p.name}-m`} player={p} compact />
        ))}
      </div>

      {!filtered.length && (
        <p className="mt-10 text-center text-gavfather-muted">
          No players match these filters.
        </p>
      )}
    </div>
  )
}
