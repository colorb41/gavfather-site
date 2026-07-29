import { Suspense } from 'react'
import { cookies } from 'next/headers'
import RankingsBoard from '../../components/RankingsBoard'
import {
  getAllWeeks,
  getLiveRankings,
  getPreviewPlayers,
  getRankingsUpdatedAt,
  getYearForWeek,
  liveRankingsExists,
} from '../../lib/rankings'
import { getTrackRecord } from '../../lib/trackRecord'
import { LAUNCH_YEAR, SITE_NAME, SOCIAL_X_URL } from '../../lib/site'

function resolveLoggedIn() {
  try {
    const jar = cookies()
    return Boolean(
      jar.get('gavfather_session')?.value ||
        jar.get('gavfather_member')?.value ||
        jar.get('__session')?.value,
    )
  } catch {
    return false
  }
}

export function generateMetadata() {
  const year = getYearForWeek(0)
  const title = `THE GAVFATHER ${year} RANKINGS | Half PPR`
  const description = `${SITE_NAME} ${year} fantasy football preseason rankings — Half PPR, 12 teams.`
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
  const year = getYearForWeek(0)
  const weeks = getAllWeeks()
  const format = String(searchParams?.format || 'half_ppr').toLowerCase()
  const isLoggedIn = resolveLoggedIn()

  // Always load full live_rankings.csv — board blurs rows for freemium
  const allPlayers = liveRankingsExists() ? getLiveRankings() : []
  const previewPlayers = getPreviewPlayers()
  const updatedAt = getRankingsUpdatedAt(0, format, year)
  const track = getTrackRecord()

  if (!allPlayers.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-5xl">
          THE GAVFATHER {year} RANKINGS
        </h1>
        <p className="mt-4 text-gavfather-muted">
          Rankings board is empty. Publish live_rankings.csv to public/rankings/.
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
      <Suspense fallback={<p className="text-gavfather-muted">Loading board…</p>}>
        <RankingsBoard
          initialPlayers={allPlayers}
          previewPlayers={previewPlayers}
          weeks={weeks}
          initialWeek={0}
          initialYear={year}
          initialFormat={format}
          updatedAt={updatedAt}
          fantasyPros={track?.fantasyPros}
          isLoggedIn={isLoggedIn}
          freemiumCapped={!isLoggedIn}
        />
      </Suspense>
    </div>
  )
}
