'use client'

import Link from 'next/link'

const UNLOCK_ITEMS = [
  'Complete rankings — all {n} players',
  'Full positional rankings at every position',
  'Live injury status and depth chart flags',
  'Reliability tier and situation scores',
  'Customize for your exact league scoring',
]

function AuthButtons() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-md bg-gavfather-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light"
      >
        Create Free Account
      </Link>
      <Link
        href="/signin"
        className="inline-flex items-center justify-center rounded-md border border-gavfather-gold/50 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gavfather-gold transition hover:border-gavfather-gold hover:bg-gavfather-gold/10"
      >
        Sign In
      </Link>
    </div>
  )
}

function LockIcon({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z" />
    </svg>
  )
}

/**
 * Full gate — shown after overall top 20 on the ALL tab.
 */
function FullGate({ totalPlayers }) {
  const n = Number(totalPlayers) || 0
  return (
    <div className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gavfather-gold/50 text-gavfather-gold">
        <LockIcon className="h-6 w-6" />
      </div>
      <p className="font-display text-sm font-semibold tracking-[0.12em] text-gavfather-gold sm:text-base">
        THE GAVFATHER HAS RANKED {n.toLocaleString()} PLAYERS.
      </p>
      <p className="mt-3 text-base text-gavfather-text sm:text-lg">
        You&apos;ve seen the top 20. The offer gets better.
      </p>
      <p className="mt-5 text-left text-xs font-semibold uppercase tracking-wider text-gavfather-muted">
        Sign in free to unlock:
      </p>
      <ul className="mt-2 space-y-1.5 text-left text-sm text-gavfather-text">
        {UNLOCK_ITEMS.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-gavfather-gold" aria-hidden>
              ✓
            </span>
            <span>{item.replace('{n}', n.toLocaleString())}</span>
          </li>
        ))}
      </ul>
      <AuthButtons />
      <p className="mt-4 text-[11px] text-gavfather-muted">Free to join. No credit card required.</p>
    </div>
  )
}

/**
 * Compact gate — shown after top 5 on a position tab.
 */
function PositionGate({ position }) {
  const pos = String(position || 'players').toUpperCase()
  const label =
    pos === 'QB'
      ? 'QBs'
      : pos === 'RB'
        ? 'RBs'
        : pos === 'WR'
          ? 'WRs'
          : pos === 'TE'
            ? 'TEs'
            : 'players'

  return (
    <div className="mx-auto max-w-md px-4 py-6 text-center sm:px-6">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-gavfather-gold/50 text-gavfather-gold">
        <LockIcon className="h-5 w-5" />
      </div>
      <p className="text-sm text-gavfather-text sm:text-base">
        Sign in free to see all {label}
        <br />
        ranked with full data.
      </p>
      <AuthButtons />
    </div>
  )
}

/**
 * Freemium paywall card for the rankings board.
 *
 * @param {'full'|'position'} variant
 * @param {string} [position] — QB/RB/WR/TE when variant=position
 * @param {number} totalPlayers
 * @param {boolean} [asTableRow] — wrap in <tr><td colSpan> for desktop table
 * @param {number} [colSpan=9]
 */
export default function FreemiumGate({
  variant = 'full',
  position = 'ALL',
  totalPlayers = 0,
  asTableRow = false,
  colSpan = 9,
}) {
  const inner = (
    <div className="rounded-xl border border-gavfather-gold/40 bg-gavfather-slate/95 shadow-[0_-8px_40px_rgba(10,12,20,0.65)]">
      {variant === 'position' ? (
        <PositionGate position={position} />
      ) : (
        <FullGate totalPlayers={totalPlayers} />
      )}
    </div>
  )

  if (asTableRow) {
    return (
      <tr className="border-0">
        <td colSpan={colSpan} className="px-2 pb-4 pt-0 md:px-3">
          {inner}
        </td>
      </tr>
    )
  }

  return <div className="mt-1">{inner}</div>
}

/** Free preview limits */
export const FREE_ALL_LIMIT = 20
export const FREE_POS_LIMIT = 5
export const FREE_BLUR_COUNT = 10

/**
 * Whether a player row is unlocked for free users.
 */
export function isFreemiumUnlocked(player, position, isLoggedIn) {
  if (isLoggedIn) return true
  if (position === 'ALL') return (Number(player.rank) || 999) <= FREE_ALL_LIMIT
  return (Number(player.positionalRank) || 999) <= FREE_POS_LIMIT
}

/**
 * Split a filtered list into unlocked + blurred teaser rows for free users.
 * Does not return the remaining locked players (stop after blur teaser).
 */
export function splitFreemiumRows(filtered, position, isLoggedIn) {
  if (isLoggedIn) {
    return { unlocked: filtered, blurred: [], showGate: false }
  }
  const unlocked = []
  const lockedRest = []
  for (const p of filtered) {
    if (isFreemiumUnlocked(p, position, false)) unlocked.push(p)
    else lockedRest.push(p)
  }
  const blurred = lockedRest.slice(0, FREE_BLUR_COUNT)
  return {
    unlocked,
    blurred,
    // Show gate whenever free users still have locked players behind the teaser
    showGate: lockedRest.length > 0,
  }
}
