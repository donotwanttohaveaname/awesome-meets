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
  version: 'v2.46 · 3 Nov 2026',

  // Same Apps Script web app as the sign-up page on awesomemarketers.fi. Saves to the private Sheet.
  endpoint: 'https://script.google.com/macros/s/AKfycbxtaKFKri4vSEVKIYB3x26mPwqlUhfttJb2140a12CwglzSUaJkGkIJ9X_Kt9nRFGAW/exec',

  // 'waitlist' = collect emails for the next round. 'open' = show the sign-up form until closesAt.
  mode: 'open',   // December sign-ups opened 3 Nov 2026 (Anna: "open sign ups for december, say we close sign ups on november 23 and will match everyone by november 30", same form as November)

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
  // November's values, for reference: opened 6 Oct 14:45, closed Mon 26 Oct 4PM, matched by Mon 2 Nov.
  // AFTER 23 Nov 4PM the site turns back into the waitlist by itself, still saying "December": then set mode to
  // 'waitlist', move December into lastRound (key 'december', its sign-up count) and put the next month into round.label.
  round: {
    key: 'december',       // sent with every sign-up; the backend saves this round to the tab "Sign-ups December" (R3)
    label: 'December',     // "Sign up for December", "December sign-ups close in"
    name: 'Awesome Meets',
    opensAt: Date.UTC(2026, 10, 3, 11, 0, 0),    // opened Tue 3 Nov 2026 1PM Helsinki, for the progress bar
    closesAt: Date.UTC(2026, 10, 23, 14, 0, 0),  // Mon 23 Nov 2026 4PM Helsinki (UTC+2)
    closesLong: 'Monday 23 November at 4PM',
    closesShort: 'Mon 23 Nov, 4PM',
    matchedByLong: 'Monday 30 November',
    meetWindow: 'December',
    // The November form again (Anna, 3 Nov 2026: "November's form"): no days or times, the group picks them.
    weeks: []
  },

  // Recorded with every sign-up. Bump it whenever the data note on the form changes.
  // v5 (29 Sep 2026): same note as v4, heading now says "Awesome Meets" instead of "Awesome Autumn Meets".
  // v6 (6 Oct 2026): November form. Note rewritten: one person or two for a trio, what your match sees, no topics, emails only.
  consentVersion: '2026-10-06-v6',

  contactEmail: 'anna@awesomemarketers.fi'
};
