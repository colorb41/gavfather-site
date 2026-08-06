import Link from 'next/link'
import OfferFeature from '../../components/OfferFeature'
import {
  getCurrentOffer,
  getOfferHistory,
  getOfferWeekNumber,
  formatOfferTitle,
} from '../../lib/offers'

export const revalidate = 3600

export const metadata = {
  title: 'Weekly Offers',
  description:
    'The Gavfather offer of the week — one model call every Sunday, with full history.',
}

export default function OffersPage() {
  const currentWeek = getOfferWeekNumber()
  const current = getCurrentOffer()
  const past = getOfferHistory()
  const offers = [...(current ? [current] : []), ...past]

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
      <p className="font-display text-sm font-semibold tracking-[0.2em] text-gavfather-gold">
        THE ARCHIVE
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-wide text-gavfather-text md:text-5xl">
        Weekly Offers
      </h1>
      <p className="mt-4 max-w-xl text-gavfather-muted">
        One call every Sunday. New offer drops automatically — past calls stay here.
      </p>

      {current ? (
        <div className="mt-12" id={`week-${current.week}`}>
          <OfferFeature offer={current} />
        </div>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-gavfather-gold">
          History
        </h2>
        <p className="mt-2 text-sm text-gavfather-muted">
          Calendar week {currentWeek}. Offers roll every Sunday from the model pipeline.
        </p>

        <ol className="mt-8 space-y-6">
          {offers.map((offer) => {
            const isCurrent = current && offer.week === current.week
            return (
              <li
                key={offer.week}
                id={`week-${offer.week}`}
                className="border-b border-gavfather-border pb-6 last:border-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-sm font-semibold tracking-[0.15em] text-gavfather-gold">
                    WEEK {offer.week}
                  </span>
                  {isCurrent ? (
                    <span className="text-xs font-medium uppercase tracking-wider text-gavfather-muted">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 font-display text-xl font-semibold text-gavfather-text">
                  {formatOfferTitle(offer)}
                </p>
                {offer.blurb ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{offer.blurb}</p>
                ) : null}
                {offer.articleSlug ? (
                  <Link
                    href={`/articles/${offer.articleSlug}`}
                    className="mt-3 inline-block text-sm font-medium text-gavfather-gold hover:text-gavfather-gold-light"
                  >
                    Read the analysis →
                  </Link>
                ) : null}
              </li>
            )
          })}
        </ol>

        {!offers.length ? (
          <p className="mt-8 text-gavfather-muted">No offers published yet.</p>
        ) : null}
      </section>
    </div>
  )
}
