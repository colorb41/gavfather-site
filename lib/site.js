/** Canonical site origin used for metadata, sitemap, and share links. */
export const SITE_URL = 'https://thegavfather.com'

export const SITE_NAME = 'The Gavfather'

/** First season we publish live rankings. */
export const LAUNCH_YEAR = 2026

/**
 * Public X profile. Update this to your real handle before launch.
 * @example 'https://x.com/yourhandle'
 */
export const SOCIAL_X_URL = 'https://x.com/thegavfather'

const EASTERN = 'America/New_York'

/** Calendar date in Eastern — the site's publish timezone. */
export function formatEasternDate(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value || '')
  return d.toLocaleDateString('en-US', {
    timeZone: EASTERN,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
