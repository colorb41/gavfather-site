import Link from 'next/link'
import { formatOfferTitle } from '../lib/offers'

export default function OfferFeature({ offer, showWeek = true, compact = false }) {
  if (!offer) return null

  const title = formatOfferTitle(offer)
  const href = offer.articleSlug ? `/articles/${offer.articleSlug}` : null

  return (
    <div
      className={`rounded-xl border border-gavfather-border border-l-4 border-l-gavfather-gold bg-gavfather-slate text-center shadow-gold-sm ${
        compact ? 'px-5 py-8 md:px-8 md:py-10' : 'px-6 py-10 md:px-12 md:py-14'
      }`}
    >
      <p className="font-display text-sm font-semibold tracking-[0.2em] text-gavfather-gold md:text-base">
        THE OFFER THIS WEEK
        {showWeek && offer.week != null ? (
          <span className="text-gavfather-muted"> · Week {offer.week}</span>
        ) : null}
      </p>
      <p className="mt-2 text-sm text-gavfather-muted">One call. The data is confident.</p>

      <h2
        className={`mt-8 font-display font-semibold text-gavfather-text ${
          compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'
        }`}
      >
        {title}
      </h2>

      <div
        className={`mx-auto mt-6 max-w-xl space-y-4 text-left leading-relaxed text-slate-300 ${
          compact ? 'text-sm' : 'text-sm md:text-base'
        }`}
      >
        {offer.blurb ? <p>{offer.blurb}</p> : null}
        {offer.body ? <p>{offer.body}</p> : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="mt-9 inline-flex items-center justify-center rounded-md bg-gavfather-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light"
        >
          Read the Full Analysis →
        </Link>
      ) : null}
    </div>
  )
}
