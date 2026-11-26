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
  version: 'v2.63 · 26 Nov 2026',

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
  // AFTER Fri 27 Nov 10AM (moved from Mon 23 Nov to Wed 25 Nov on 18 Nov, to Thu 26 Nov on 24 Nov, then to Fri 27 Nov 10AM on 25 Nov 2026; Anna) the site turns back into the waitlist by itself, still saying "December": then set mode to
  // 'waitlist', move December into lastRound (key 'december', its sign-up count) and put the next month into round.label.
  round: {
    key: 'december',       // sent with every sign-up; the backend saves this round to the tab "Sign-ups December" (R3)
    label: 'December',     // "Sign up for December", "December sign-ups close in"
    name: 'Awesome Meets',
    opensAt: Date.UTC(2026, 10, 3, 11, 0, 0),    // opened Tue 3 Nov 2026 1PM Helsinki, for the progress bar
    closesAt: Date.UTC(2026, 10, 27, 8, 0, 0),   // Fri 27 Nov 2026 10AM Helsinki (UTC+2)
    closesLong: 'Friday 27 November at 10AM',
    closesShort: 'Fri 27 Nov, 10AM',
    matchedByLong: 'Monday 30 November',
    meetWindow: 'December',
    // The November form again (Anna, 3 Nov 2026: "November's form"): no days or times, the group picks them.
    weeks: []
  },

  // The round that takes over BY ITSELF the moment `round.closesAt` passes (Anna, 26 Nov 2026: "sign ups are open all the
  // time but the nearest matching date changes" and "switch sign up form for the new form when the time comes on friday").
  // site.js swaps it in: the form stays open, the dates, the counter and the form's extra options become this round's.
  // The backend must know the same key (R4 in awesome-meets-backend.gs). BEFORE THIS ROUND'S OWN CUT-OFF: move it into
  // `round`, put the round that closed into `lastRound`, and write the round after it here. With no nextRound the site
  // falls back to the email waitlist when a round closes.
  // January (Anna, 26 Nov 2026: "close wed jan 6, match by mon jan 11"; 4PM is Claude's choice, like the earlier weekday closes).
  nextRound: {
    key: 'january',        // the backend saves this round to the tab "Sign-ups January" (R4)
    label: 'January',
    name: 'Awesome Meets',
    opensAt: Date.UTC(2026, 10, 27, 8, 0, 0),    // the moment December's cut-off passes
    closesAt: Date.UTC(2027, 0, 6, 14, 0, 0),    // Wed 6 Jan 2027 4PM Helsinki (UTC+2)
    closesLong: 'Wednesday 6 January at 4PM',
    closesShort: 'Wed 6 Jan, 4PM',
    matchedByLong: 'Monday 11 January',
    meetWindow: 'January',
    weeks: [],
    extraActivities: ['Museum visit']            // Anna: "the new form should have a new activity as an option - museum visit"
  },

  // Recorded with every sign-up. Bump it whenever the data note on the form changes.
  // v5 (29 Sep 2026): same note as v4, heading now says "Awesome Meets" instead of "Awesome Autumn Meets".
  // v6 (6 Oct 2026): November form. Note rewritten: one person or two for a trio, what your match sees, no topics, emails only.
  consentVersion: '2026-11-19-v7',

  contactEmail: 'anna@awesomemarketers.fi'
};
