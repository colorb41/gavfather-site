import Link from 'next/link'
import ArticleCard from '../components/ArticleCard'
import EmailCapture from '../components/EmailCapture'
import HeroParticles from '../components/HeroParticles'
import { getAllArticles } from '../lib/articles'

export const dynamic = 'force-static'

export default function HomePage() {
  const articles = getAllArticles().slice(0, 3)

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
        <div className="rounded-xl border border-gavfather-border border-l-4 border-l-gavfather-gold bg-gavfather-slate px-6 py-10 text-center shadow-gold-sm md:px-12 md:py-14">
          <p className="font-display text-sm font-semibold tracking-[0.2em] text-gavfather-gold md:text-base">
            THE OFFER THIS WEEK
          </p>
          <p className="mt-2 text-sm text-gavfather-muted">
            One call. The data is confident.
          </p>

          <h2 className="mt-8 font-display text-2xl font-semibold text-gavfather-text md:text-4xl">
            Justin Herbert, QB — LAC
          </h2>

          <div className="mx-auto mt-6 max-w-xl space-y-4 text-left text-sm leading-relaxed text-slate-300 md:text-base">
            <p>
              The market has him QB6. We have him QB3.
            </p>
            <p>
              Mike McDaniel left his head coaching job to be Herbert&apos;s offensive
              coordinator. The model applies +9% for the scheme upgrade. The gap between
              what the market thinks and what the data says is the largest at any position.
            </p>
          </div>

          <Link
            href="/articles/2026-big-calls"
            className="mt-9 inline-flex items-center justify-center rounded-md bg-gavfather-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light"
          >
            Read the Full Analysis →
          </Link>
        </div>
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
