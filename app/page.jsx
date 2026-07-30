import Image from 'next/image'
import Link from 'next/link'
import PlayerCard from '../components/PlayerCard'
import ArticleCard from '../components/ArticleCard'
import HeroParticles from '../components/HeroParticles'
import {
  getLatestWeek,
  getTopPlays,
  getTopFades,
  getYearForWeek,
} from '../lib/rankings'
import { getAllArticles } from '../lib/articles'
import { LAUNCH_YEAR, SOCIAL_X_URL } from '../lib/site'

export const dynamic = 'force-static'

export default function HomePage() {
  const week = getLatestWeek()
  const year = week != null ? getYearForWeek(week) : null
  const hasBoard = week != null && year != null
  const isLiveSeason = Boolean(hasBoard && year >= LAUNCH_YEAR)
  // Standard board order (CSV overall_rank) — not PPR / raw PPG
  const topPlays = hasBoard ? getTopPlays(week, 5, 'std', year) : []
  const topFades = hasBoard ? getTopFades(week, 5, 'std', year) : []
  const articles = getAllArticles().slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gavfather-border">
        <HeroParticles />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 text-center md:py-14">
          <h1 className="flex justify-center">
            <Image
              src="/images/logo_full_horizontal.png"
              alt="The Gavfather"
              width={600}
              height={213}
              className="h-auto w-full max-w-[280px] md:max-w-sm"
              priority
            />
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-gavfather-text md:text-xl">
            Fantasy football rankings, sleepers, and hard fades.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gavfather-muted md:text-base">
            {isLiveSeason
              ? 'Draft rankings from a model that ignores the podcast consensus. Preseason 2026 is live.'
              : `Launching for the ${LAUNCH_YEAR} season. Follow on X — the board below is a preview while we build.`}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/rankings"
              className="inline-flex min-w-[200px] items-center justify-center rounded-md bg-gavfather-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light"
            >
              View Rankings
            </Link>
            {isLiveSeason ? (
              <Link
                href="/articles"
                className="inline-flex min-w-[200px] items-center justify-center rounded-md border border-gavfather-gold bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-gold transition hover:bg-gavfather-gold/10"
              >
                Read the Research
              </Link>
            ) : (
              <a
                href={SOCIAL_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[200px] items-center justify-center rounded-md border border-gavfather-gold bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-gold transition hover:bg-gavfather-gold/10"
              >
                Follow on X
              </a>
            )}
          </div>
        </div>
      </section>

      {!isLiveSeason && hasBoard && (
        <div className="border-b border-gavfather-gold/30 bg-gavfather-gold/10 px-4 py-3 text-center text-sm text-gavfather-gold">
          Preview board — not a published {year} season. Live rankings start {LAUNCH_YEAR} Preseason.
        </div>
      )}

      {/* Top plays */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-4xl">
              TOP PLAYS TO DRAFT
            </h2>
            <p className="mt-2 text-gavfather-muted">
              The model&apos;s highest-conviction picks for your 2026 draft.
            </p>
          </div>
          <Link
            href="/rankings"
            className="text-sm font-medium text-gavfather-gold hover:text-gavfather-gold-light"
          >
            View all rankings →
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {topPlays.map((p) => (
            <PlayerCard key={p.name} player={p} week={week} variant="offer" />
          ))}
        </div>
        {!topPlays.length && (
          <p className="mt-8 text-gavfather-muted">
            Draft rankings aren&apos;t up yet. Check back soon.
          </p>
        )}
      </section>

      {/* Fades */}
      <section className="border-y border-gavfather-border bg-gavfather-slate/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <h2 className="font-display text-3xl font-semibold tracking-wide text-gavfather-fade md:text-4xl">
            DRAFT WITH CAUTION
          </h2>
          <p className="mt-2 text-gavfather-muted">
            Players the data thinks the market is overvaluing this year.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {topFades.map((p) => (
              <PlayerCard key={p.name} player={p} week={week} variant="fade" />
            ))}
          </div>
          {!topFades.length && (
            <p className="mt-8 text-gavfather-muted">
              No caution flags on the board yet.
            </p>
          )}
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-4xl">
          LATEST
        </h2>
        <p className="mt-2 text-gavfather-muted">
          {isLiveSeason
            ? 'Rankings, sleepers, and takes the podcast consensus missed.'
            : 'Draft writeups for layout preview — not published season content.'}
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
        {!articles.length && (
          <p className="mt-8 text-gavfather-muted">No articles published yet.</p>
        )}
        <div className="mt-8 text-right">
          <Link
            href="/articles"
            className="text-sm font-medium text-gavfather-gold hover:text-gavfather-gold-light"
          >
            All articles →
          </Link>
        </div>
      </section>
    </div>
  )
}
