import { Suspense } from 'react'
import { cookies } from 'next/headers'
import RankingsBoard from '../../components/RankingsBoard'
import {
  availableBoards,
  boardLabel,
  getBoardRankings,
  getLatestWeek,
  getPreviewPlayers,
  getRankingsUpdatedAt,
  getYearForWeek,
  liveRankingsExists,
  normalizeBoard,
  normalizeScoringFormat,
  weeklyRankingsExists,
} from '../../lib/rankings'
import { getTrackRecord } from '../../lib/trackRecord'
import { SITE_NAME, SOCIAL_X_URL } from '../../lib/site'

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

function resolveSuperflex(searchParams) {
  const raw = String(searchParams?.superflex ?? '').toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes'
}

export function generateMetadata({ searchParams } = {}) {
  const year = getYearForWeek(0)
  const week = getLatestWeek()
  const board = normalizeBoard(searchParams?.board, { week })
  const format = normalizeScoringFormat(searchParams?.format || 'half_ppr')
  const formatLabel =
    format === 'ppr' ? 'PPR' : format === 'half_ppr' ? 'Half PPR' : 'Standard'
  const boardTitle = boardLabel(board, week, year)
  const title =
    board === 'weekly'
      ? `THE GAVFATHER ${boardTitle.toUpperCase()} | ${formatLabel}`
      : `THE GAVFATHER ${year} REST OF SEASON | ${formatLabel}`
  const description =
    board === 'weekly'
      ? `${SITE_NAME} Week ${week} fantasy football rankings — ${formatLabel}. Free preview: top 20 overall.`
      : `${SITE_NAME} ${year} rest-of-season fantasy football rankings — ${formatLabel}. Free preview: top 20 overall.`
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
  const week = getLatestWeek()
  const boards = availableBoards()
  const board = normalizeBoard(searchParams?.board, { week })
  // Half PPR is the board of truth in-season
  const format = normalizeScoringFormat(searchParams?.format || 'half_ppr')
  const superflex = resolveSuperflex(searchParams)
  const initialPos = String(searchParams?.pos || 'ALL').toUpperCase()
  const isLoggedIn = resolveLoggedIn()

  const hasAny = liveRankingsExists() || weeklyRankingsExists()
  const rosPlayers = liveRankingsExists()
    ? getBoardRankings('ros', format, { superflex })
    : []
  const weeklyPlayers = weeklyRankingsExists() ? getBoardRankings('weekly') : []
  const activePlayers = board === 'weekly' ? weeklyPlayers : rosPlayers
  const totalPlayers = activePlayers.length
  const previewPlayers = getPreviewPlayers()
  const updatedAt = getRankingsUpdatedAt(week, format, year)
  const track = getTrackRecord()

  if (!hasAny || !activePlayers.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-5xl">
          THE GAVFATHER {year} RANKINGS
        </h1>
        <p className="mt-4 text-gavfather-muted">
          Rankings board is empty. Publish live_rankings.csv and weekly_rankings.csv
          to public/rankings/.
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
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={<p className="text-gavfather-muted">Loading board…</p>}>
        <RankingsBoard
          rosPlayers={rosPlayers}
          weeklyPlayers={weeklyPlayers}
          availableBoards={boards}
          initialBoard={board}
          previewPlayers={previewPlayers}
          totalPlayers={totalPlayers}
          initialWeek={week}
          initialYear={year}
          initialFormat={format}
          initialSuperflex={superflex}
          initialPos={initialPos}
          updatedAt={updatedAt}
          fantasyPros={track?.fantasyPros}
          isLoggedIn={isLoggedIn}
          freemiumCapped={!isLoggedIn}
        />
      </Suspense>
    </div>
  )
}
