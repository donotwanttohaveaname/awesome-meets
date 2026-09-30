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
  version: 'v2.16 · 30 Sep 2026',

  // Same Apps Script web app as the sign-up page on awesomemarketers.fi. Saves to the private Sheet.
  endpoint: 'https://script.google.com/macros/s/AKfycbxtaKFKri4vSEVKIYB3x26mPwqlUhfttJb2140a12CwglzSUaJkGkIJ9X_Kt9nRFGAW/exec',

  // 'waitlist' = collect emails for the next round. 'open' = show the sign-up form until closesAt.
  mode: 'waitlist',

  // The round that already happened. Shown while the waitlist is open.
  lastRound: {
    name: 'Awesome Autumn Meets',
    month: 'October 2026',
    signups: 40,           // shown if the live count cannot be reached
    countLabel: 'people in round one'
  },

  // The round being announced or running.
  round: {
    label: 'November',     // "Want in for November?"
    name: 'Awesome Meets',
    opensAt: null,         // Date.UTC(...)  when sign-ups opened, for the progress bar
    closesAt: null,        // Date.UTC(...)  the form closes itself at this moment
    closesLong: '',        // 'Monday 9 November at 4PM'
    closesShort: '',       // 'Mon 9 Nov, 4PM'
    matchedByLong: '',     // 'Friday 13 November'
    meetWindow: '',        // '16 and 27 November'
    // One entry per week: [label, [[value sent to the Sheet, label on the page], ...]]
    // The value must match OPTIONS.days in the backend script letter for letter.
    weeks: [
      // ['Week 47', [['November 16, Monday', 'Mon 16 Nov'], ['November 17, Tuesday', 'Tue 17 Nov']]]
    ]
  },

  // Recorded with every sign-up. Bump it whenever the data note on the form changes.
  // v5 (29 Sep 2026): same note as v4, heading now says "Awesome Meets" instead of "Awesome Autumn Meets".
  consentVersion: '2026-09-29-v5',

  contactEmail: 'anna@awesomemarketers.fi'
};
