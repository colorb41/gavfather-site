import Link from 'next/link'
import { getTrackRecord } from '../../lib/trackRecord'
import { LAUNCH_YEAR, SOCIAL_X_URL } from '../../lib/site'

export const metadata = {
  title: 'About',
  description:
    'What The Gavfather publishes — weekly rankings, sleepers, and hard fades for the 2026 season.',
}

export default function AboutPage() {
  const track = getTrackRecord()
  const hasTrackRecord = Boolean(track?.highlights?.length || track?.seasons?.length)

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="font-display text-4xl font-semibold tracking-wide text-gavfather-gold md:text-6xl">
        What is The Gavfather?
      </h1>

      <div className="mt-8 space-y-6 leading-relaxed text-slate-300">
        <p>A fantasy football analytics engine that looks at things other sites ignore.</p>
        <p>
          We&apos;re not going to tell you exactly what goes into it — that&apos;s the whole
          point. What we can tell you is that it&apos;s not vibes, it&apos;s not beat reporter
          takes, and it&apos;s definitely not whatever the top podcast said on Tuesday.
        </p>
        <p>
          Every week the model spits out rankings, sleeper picks, and fades. We wrap them in
          whatever pop culture theme feels right that week — TV, film, music, whatever.
          Sometimes it&apos;s highbrow. Usually it&apos;s not. The data doesn&apos;t have taste,
          it just has opinions.
        </p>
        <p>
          The team is small. The model is not. We launch with the {LAUNCH_YEAR} season —
          and we&apos;ll publish the track record as the weeks come in.
        </p>
      </div>

      {hasTrackRecord && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-gavfather-gold">
            Track record
          </h2>
          <p className="mt-2 text-sm text-gavfather-muted">
            Start/sit calls measured against consensus rankings.
          </p>
          {track.highlights?.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {track.highlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-lg border border-gavfather-border bg-gavfather-slate px-4 py-4 text-center"
                >
                  <div className="font-mono text-3xl font-bold text-gavfather-gold">{h.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-gavfather-text">
                    {h.label}
                  </div>
                  <div className="mt-1 text-[11px] text-gavfather-muted">{h.detail}</div>
                </div>
              ))}
            </div>
          )}

          {track.seasons?.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-gavfather-muted">
                  <tr>
                    <th className="py-2 pr-4">Season</th>
                    <th className="py-2 pr-4">Hit rate</th>
                    <th className="py-2 pr-4">SMASH</th>
                    <th className="py-2 pr-4">FADE avoid</th>
                    <th className="py-2">vs Consensus</th>
                  </tr>
                </thead>
                <tbody>
                  {track.seasons.map((s) => (
                    <tr key={s.year} className="border-t border-gavfather-border text-slate-300">
                      <td className="py-3 pr-4 font-medium text-gavfather-text">{s.label}</td>
                      <td className="py-3 pr-4 font-mono">
                        {(s.overallHitRate * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 pr-4 font-mono">
                        {(s.smashHitRate * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 pr-4 font-mono">
                        {(s.fadeAvoidRate * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 font-mono text-gavfather-gold">{s.vsConsensus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {track.fantasyPros?.submitted && track.fantasyPros.url && (
            <p className="mt-6">
              <a
                href={track.fantasyPros.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gavfather-gold/30 bg-gavfather-gold/10 px-3 py-1.5 text-xs font-medium text-gavfather-gold transition hover:bg-gavfather-gold/20"
              >
                {track.fantasyPros.label} ↗
              </a>
            </p>
          )}
        </section>
      )}

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-gavfather-gold">
          What we publish
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-slate-300">
          <li>Weekly rankings for QB, RB, WR, and TE</li>
          <li>Sleeper picks the market undervalued</li>
          <li>Hard fades the consensus got wrong</li>
          <li>One pop culture theme per week, applied with full commitment or not at all</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-gavfather-gold">
          What we don&apos;t do
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-slate-300">
          <li>Kicker rankings (nobody should)</li>
          <li>Guarantee anything (nobody can)</li>
          <li>Tell you how the sausage is made (that&apos;s our business)</li>
        </ul>
      </section>

      <div className="mt-14 flex flex-wrap gap-3">
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
      </div>
    </div>
  )
}
