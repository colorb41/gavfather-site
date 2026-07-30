import Link from 'next/link'
import { LAUNCH_YEAR, SOCIAL_X_URL } from '../../lib/site'

export const metadata = {
  title: 'About',
  description:
    'How The Gavfather started — and how machine learning finds fantasy football edges others miss.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="font-display text-4xl font-semibold tracking-wide text-gavfather-gold md:text-6xl">
        About The Gavfather
      </h1>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-gavfather-gold md:text-3xl">
          HOW THIS STARTED
        </h2>
        <div className="mt-5 space-y-4 leading-relaxed text-slate-300">
          <p>
            I won my first fantasy football championship in high school knowing nothing about
            football. My first question when I started watching games was genuinely why the
            players&apos; pants didn&apos;t fall down when they got tackled. I still won.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-gavfather-gold md:text-3xl">
          WHAT THE GAVFATHER SYSTEM IS
        </h2>
        <div className="mt-5 space-y-4 leading-relaxed text-slate-300">
          <p>
            I work in tech. I spend my days thinking about AI, data, and how to find signal in
            noise. At some point the obvious question hit me: why is nobody applying real
            machine learning to fantasy football data?
          </p>
          <p>
            22 years of NFL data. 777,000 individual plays. 11,054 player-seasons. 175 features
            engineered from scratch. Machine learning models trained to answer one question:
            what actually predicts fantasy performance next year?
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-gavfather-gold md:text-3xl">
          WHY FANTASY FOOTBALL
        </h2>
        <div className="mt-5 space-y-4 leading-relaxed text-slate-300">
          <p>
            People ask me why I didn&apos;t use this for something more important. The same
            analytical frameworks that find edges in fantasy football find edges everywhere.
            Signal vs noise. What the market overvalues. Where conventional wisdom is quietly
            wrong.
          </p>
          <p>
            I just happen to care about this particular problem. And I&apos;m good at it. My
            pants-question rookie year championship says so.
          </p>
        </div>
      </section>

      <p className="mt-16 text-center text-sm italic text-gavfather-gold/80">
        Built by someone who still isn&apos;t entirely sure how the pants stay up.
      </p>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <a
          href={SOCIAL_X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-gavfather-gold px-4 py-2 text-sm font-bold text-gavfather-navy transition hover:bg-gavfather-gold-light"
        >
          Follow on X
        </a>
        <Link
          href="/rankings"
          className="rounded-md border border-gavfather-gold px-4 py-2 text-sm font-semibold text-gavfather-gold transition hover:bg-gavfather-gold/10"
        >
          View Rankings
        </Link>
        <Link
          href="/articles"
          className="rounded-md border border-gavfather-border px-4 py-2 text-sm font-semibold text-gavfather-muted transition hover:border-gavfather-gold/40 hover:text-gavfather-gold"
        >
          Read Articles
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-gavfather-muted">
        Launching with the {LAUNCH_YEAR} season.
      </p>
    </div>
  )
}
