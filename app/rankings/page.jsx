import { Suspense } from 'react'
import RankingsBoard from '../../components/RankingsBoard'
import {
  getAllWeeks,
  getLatestWeek,
  getRankingsByWeek,
  getRankingsUpdatedAt,
  getYearForWeek,
} from '../../lib/rankings'
import { getTrackRecord } from '../../lib/trackRecord'
import { LAUNCH_YEAR, SITE_NAME, SOCIAL_X_URL } from '../../lib/site'

function resolveWeekParams(searchParams) {
  const weeks = getAllWeeks()
  const latest = getLatestWeek()
  const week = Number(searchParams?.week || latest || 1)
  const year = Number(searchParams?.year || getYearForWeek(week))
  const requestedFormat = String(searchParams?.format || 'ppr').toLowerCase()
  const weekMeta = weeks.find((w) => w.week === week && w.year === year)
  const format = weekMeta?.formats?.includes(requestedFormat)
    ? requestedFormat
    : weekMeta?.formats?.[0] || 'ppr'
  return { weeks, week, year, format }
}

export function generateMetadata({ searchParams }) {
  const { week, year } = resolveWeekParams(searchParams)
  const isLiveSeason = year >= LAUNCH_YEAR
  const title =
    Number(week) === 3
      ? '2026 Draft Rankings'
      : `Week ${week} Rankings (${year})`
  const description =
    Number(week) === 3
      ? `${SITE_NAME} 2026 fantasy football draft rankings — sleepers, fades, and the full board.`
      : isLiveSeason
        ? `${SITE_NAME} fantasy football rankings for Week ${week}, ${year} — sleepers, fades, and the full board.`
        : `${SITE_NAME} board preview — live ${LAUNCH_YEAR} rankings launch with Preseason 2026.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ['/images/og_image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/og_image.png'],
    },
  }
}

export default function RankingsPage({ searchParams }) {
  const { weeks, week, year, format } = resolveWeekParams(searchParams)
  const players = getRankingsByWeek(week, format, year)
  const updatedAt = getRankingsUpdatedAt(week, format, year)
  const track = getTrackRecord()
  const isLiveSeason = year >= LAUNCH_YEAR

  if (!weeks.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-5xl">
          Rankings
        </h1>
        <p className="mt-4 text-gavfather-muted">
          The board opens with Preseason {LAUNCH_YEAR}.
        </p>
        <a
          href={SOCIAL_X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-gavfather-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light"
        >
          Follow on X
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      {!isLiveSeason && (
        <div className="mb-6 rounded-md border border-gavfather-gold/30 bg-gavfather-gold/10 px-4 py-3 text-sm text-gavfather-gold">
          Preview board — sample data for building the site. Live season starts {LAUNCH_YEAR}.
        </div>
      )}
      <Suspense fallback={<p className="text-gavfather-muted">Loading board…</p>}>
        <RankingsBoard
          initialPlayers={players}
          weeks={weeks}
          initialWeek={week}
          initialYear={year}
          initialFormat={format}
          updatedAt={updatedAt}
          fantasyPros={track?.fantasyPros}
        />
      </Suspense>
    </div>
  )
}
