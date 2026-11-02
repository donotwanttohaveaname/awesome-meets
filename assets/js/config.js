/*
 * Awesome Meets: the ONE file to edit when a round opens or closes.
 *
 * TO OPEN A NEW ROUND
 *   1. Fill in `round` below (dates, texts, weeks).
 *   2. Set mode to 'open'.
 *   3. Put the same days into OPTIONS.days in networking-app/awesome-meets-backend.gs,
 *      then run  ./deploy.sh --deploy "open <month> round"  in networking-app/.
 *      (The script refuses days it does not know, so this step is not optional.)
 *   4. In the Google Sheet, rename the tab "Sign-ups" to "Sign-ups <last month>" so the new
 *      round starts from an empty tab and the counter starts from zero.
 *   5. Bump `version`, commit, push.
 *   The full checklist, including the emails that mention dates, is in README.md.
 *
 * The site closes itself at `closesAt` and turns back into the waitlist. Nothing to do on the day.
 * Afterwards, when you have a minute: set mode back to 'waitlist', move the round's name, month and
 * sign-up count into `lastRound`, and put the next month into round.label.
 *
 * TIMES are UTC. Helsinki is UTC+3 until the last Sunday of October and UTC+2 after it.
 *   4PM Helsinki in November = 14:00 UTC  ->  Date.UTC(2026, 10, 9, 14, 0, 0)
 *   (months count from 0: 9 = October, 10 = November)
 */
window.AM = {
  version: 'v2.41 · 2 Nov 2026',

  // Same Apps Script web app as the sign-up page on awesomemarketers.fi. Saves to the private Sheet.
  endpoint: 'https://script.google.com/macros/s/AKfycbxtaKFKri4vSEVKIYB3x26mPwqlUhfttJb2140a12CwglzSUaJkGkIJ9X_Kt9nRFGAW/exec',

  // 'waitlist' = collect emails for the next round. 'open' = show the sign-up form until closesAt.
  mode: 'waitlist',   // November sign-ups closed Mon 26 Oct 4PM; waitlist for December since 28 Oct 2026 (Anna: "make buttons join waitlist for december now")

  // The round that already happened. Shown while the waitlist is open.
  // Round one was Awesome Autumn Meets, October 2026, 40 sign-ups (tab "Sign-ups").
  lastRound: {
    key: 'november',       // the live count is read from this round's tab ("Sign-ups November")
    label: 'November',
    name: 'Awesome Meets',
    month: 'November 2026',
    signups: 42,           // shown if the live count cannot be reached (42 on 28 Oct 2026, TEST rows not counted)
    countLabel: 'people signed up for November'
  },

  // The round being announced or running.
  // December dates are not set yet. To open it: add key 'december' to the backend (like R2 for November),
  // fill in opensAt, closesAt, closesLong, closesShort, matchedByLong and meetWindow, then set mode to 'open'.
  // November's values, for reference: opened 6 Oct 14:45, closed Mon 26 Oct 4PM, matched by Mon 2 Nov.
  round: {
    key: 'december',
    label: 'December',     // "Want in for December?", "Join the waitlist for December"
    name: 'Awesome Meets',
    weeks: []
  },

  // Recorded with every sign-up. Bump it whenever the data note on the form changes.
  // v5 (29 Sep 2026): same note as v4, heading now says "Awesome Meets" instead of "Awesome Autumn Meets".
  // v6 (6 Oct 2026): November form. Note rewritten: one person or two for a trio, what your match sees, no topics, emails only.
  consentVersion: '2026-10-06-v6',

  contactEmail: 'anna@awesomemarketers.fi'
};
