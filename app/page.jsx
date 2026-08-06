import Link from 'next/link'
import OfferFeature from '../components/OfferFeature'
import ArticleCard from '../components/ArticleCard'
import EmailCapture from '../components/EmailCapture'
import HeroParticles from '../components/HeroParticles'
import { getAllArticles } from '../lib/articles'
import { getCurrentOffer, getOfferHistory, formatOfferTitle } from '../lib/offers'

/** Revalidate hourly so the Sunday rollover picks up without a redeploy. */
export const revalidate = 3600

export default function HomePage() {
  const articles = getAllArticles().slice(0, 3)
  const offer = getCurrentOffer()
  const history = getOfferHistory().slice(0, 3)

  return (
    <div>
      {/* SECTION 1 — Hero */}
      <section className="relative overflow-hidden border-b border-gavfather-border">
        <HeroParticles />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <h1 className="font-display text-5xl font-bold tracking-wide text-gavfather-gold md:text-7xl">
            THE GAVFATHER
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-gavfather-text md:text-2xl">
            An offer your roster can&apos;t refuse.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/rankings"
              className="inline-flex min-w-[200px] items-center justify-center rounded-md bg-gavfather-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light"
            >
              View Rankings
            </Link>
            <Link
              href="/articles"
              className="inline-flex min-w-[200px] items-center justify-center rounded-md border border-gavfather-gold bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-gold transition hover:bg-gavfather-gold/10"
            >
              Read the Research
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2 — One big call */}
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
        {offer ? (
          <OfferFeature offer={offer} />
        ) : (
          <p className="text-center text-gavfather-muted">No offer published yet.</p>
        )}

        {history.length > 0 ? (
          <div className="mt-10 border-t border-gavfather-border pt-8">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-sm font-semibold tracking-[0.18em] text-gavfather-muted">
                PREVIOUS OFFERS
              </h3>
              <Link
                href="/offers"
                className="text-sm font-medium text-gavfather-gold hover:text-gavfather-gold-light"
              >
                Full history →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {history.map((past) => (
                <li key={past.week}>
                  <Link
                    href={`/offers#week-${past.week}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-slate-300 transition hover:text-gavfather-gold"
                  >
                    <span>
                      <span className="text-gavfather-muted">Week {past.week}</span>
                      <span className="mx-2 text-gavfather-border">·</span>
                      {formatOfferTitle(past)}
                    </span>
                    {past.blurb ? (
                      <span className="max-w-md truncate text-gavfather-muted">{past.blurb}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* SECTION 3 — Latest articles */}
      <section className="border-y border-gavfather-border bg-gavfather-slate/40">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-4xl">
            LATEST
          </h2>
          <p className="mt-2 text-gavfather-muted">
            From The Gavfather — rankings, sleepers, and takes the consensus missed.
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
        </div>
      </section>

      {/* SECTION 4 — Email capture */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <EmailCapture />
      </section>
    </div>
  )
}
