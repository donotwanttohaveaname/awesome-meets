# Awesome Meets

The website for Awesome Meets, the matching format by the creators of The Awesome Marketers.
Marketers in Helsinki fill in a short form, Anna matches them with 1 or 2 marketers, and they meet over lunch, an after-work coffee or a walk.

- **Live:** https://donotwanttohaveaname.github.io/awesome-meets/
- **Hosting:** GitHub Pages, straight from the `main` branch. A push is a publish. It takes a minute or two, and browsers keep the old version for up to 10 minutes.
- **No build step.** Plain HTML, CSS and JavaScript. No cookies, no analytics.
- **Backend:** the same Google Apps Script web app and private Google Sheet as before. The script lives in `networking-app/` on Anna's computer, not in this repo. No keys or secrets are in this repo, and none should ever be added.

## What is where

| File | What it is |
|---|---|
| `assets/js/config.js` | **The one file to edit when a round opens or closes.** Dates, texts, mode, version. |
| `index.html` | Home |
| `join/index.html` | The waitlist, or the 5-step sign-up form while a round is open |
| `data/index.html` | Your data (the data note) |
| `about/index.html` | About the creators |
| `404.html` | Shown for any wrong address |
| `assets/css/site.css` | All styles, built on the brand kit tokens |
| `assets/js/site.js` | Waitlist or open, the live strip, the counter, the waitlist forms |
| `assets/js/form.js` | The sign-up form: questions, validation, sending |
| `assets/img/` | Logo files, favicon, share image |

## The two modes

The site is always in one of two states, decided by `config.js`:

- **waitlist**: collects emails for the next round. They land in the `November waitlist` tab of the Sheet.
- **open**: shows the sign-up form. This needs `mode: 'open'` **and** a `closesAt` in the future. At `closesAt` the site turns itself back into the waitlist, to the minute, with nobody touching anything.

## Opening a round

1. **`assets/js/config.js`**: fill in `round` (label, `opensAt`, `closesAt`, the four date texts, `weeks`) and set `mode: 'open'`. Times are UTC, the file explains how.
2. **Backend script** (`networking-app/awesome-meets-backend.gs`):
   - put the same days into `OPTIONS.days`. The script refuses days it does not know.
   - update everything that still says October or round one: the confirmation email (close date, match date, meeting dates, "round one of our brand new format"), the email subjects with "Awesome Autumn Meets", the match email, the one-click answer page ("in October"), and the feedback email subject.
   - if the waitlist should collect for a later month, rename `WAITLIST_SHEET`.
   - publish it: `./deploy.sh --deploy "open <month> round"` in `networking-app/`.
3. **Google Sheet**: rename the tab `Sign-ups` to `Sign-ups <last month>`. The script makes a fresh `Sign-ups` tab on the first sign-up, so the counter starts from zero. Only do this once the last round's match and feedback emails have all gone out: those look people up in the `Sign-ups` tab.
4. **Check it on your own computer first**: see "Looking at it locally" below. Send yourself one real test sign-up once it is live, then delete the row.
5. Bump `version` in `config.js`, commit, push.
6. Email the waitlist. That is a send to real people, so it is Anna's call every time.

## After a round closes

Nothing is urgent, the site has already switched itself. When there is a minute, in `config.js`: set `mode: 'waitlist'`, move the finished round into `lastRound` (name, month, sign-up count, label), put the next month into `round.label`, empty the dates. Bump the version, commit, push.

## Looking at it locally

```bash
cd awesome-meets
python3 -m http.server 8763
```

- http://localhost:8763/ is the site as it is live.
- http://localhost:8763/join/?preview=open shows the sign-up form with sample November dates. This works only on localhost, never on the live site, and sends nothing: at the end it prints what it would have sent.

## Launch checklist (not done yet)

The site is live on the GitHub address but deliberately quiet until Anna says go:

- [ ] Anna has read every page, the data page most of all
- [ ] Remove `<meta name="robots" content="noindex">` from `index.html`, `join/`, `data/` and `about/`
- [ ] Redirect `awesomemarketers.fi/awesome-meets/` to this site (keep `awesome-meets/thanks/` alive: the one-click links in sent emails point at it)
- [ ] Point the banner on awesomemarketers.fi at this site
- [ ] If a domain is attached: add a `CNAME` file, set the domain in the repo's Pages settings, and replace `donotwanttohaveaname.github.io/awesome-meets` in the `og:image` and `og:url` tags of the four pages. Everything else uses relative paths and keeps working.

## Rules

Brand kit: https://claude.ai/artifact/Aj3ijuYQ3r8evhUy9vzM7q

- Three colours: yellow `#FFD166`, orange `#FF8C42`, pink `#FF5FA2`. Deep pink `#D11E6E` is the only brand colour that may be text. No purple.
- Buttons: white text on the deep gradient, never an emoji inside.
- Never a coloured stripe down the left edge of a card, quote or row.
- The logo heart is the text glyph ♥ in `#FF8C42`. In the header and on horizontal logos it sits straight on the background, with no tile around it.
- The credit is always "by the creators of The Awesome Marketers".
- No em dashes. British spelling. Never promise a round every month.
- Every page shows the version and date at the bottom. Bump it with every change.
- The data note inside the form is what people agree to. Change a word of it and `consentVersion` in `config.js` goes up.

## Versions

| Version | Date | What changed |
|---|---|---|
| v1.0 | 29 Sep 2026 | First version: home, join (waitlist and form), your data, about the creators, 404. Launched in waitlist mode. |
