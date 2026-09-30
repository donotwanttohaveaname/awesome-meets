# Awesome Meets

The website for Awesome Meets, the matching format by the creators of The Awesome Marketers.
Marketers in Helsinki fill in a short form, Anna matches them with 1 or 2 marketers, and they meet over lunch, an after-work coffee or a walk.

- **Live:** https://awesomemeets.com/ (the old address donotwanttohaveaname.github.io/awesome-meets forwards there)
- **Domain:** awesomemeets.com, DNS in cPanel at hostingpalvelu: four A records to GitHub (185.199.108.153, .109.153, .110.153, .111.153) and `www` as a CNAME to `donotwanttohaveaname.github.io`. The `CNAME` file in this repo tells GitHub the name; do not delete it.
- **Hosting:** GitHub Pages, straight from the `main` branch. A push is a publish. It takes a minute or two, and browsers keep the old version for up to 10 minutes.
- **No build step.** Plain HTML, CSS and JavaScript. No cookies, no analytics. The data policy (`data/`) lists the services that handle sign-up data (Google, Resend, Anthropic, LinkedIn). Hosting and fonts are deliberately not listed (Anna, 30 Sep).
- **Backend:** the same Google Apps Script web app and private Google Sheet as before. The script lives in `networking-app/` on Anna's computer, not in this repo. No keys or secrets are in this repo, and none should ever be added.

## What is where

| File | What it is |
|---|---|
| `assets/js/config.js` | **The one file to edit when a round opens or closes.** Dates, texts, mode, version. |
| `index.html` | Home |
| `join/index.html` | The waitlist, or the 5-step sign-up form while a round is open |
| `data/index.html` | The data policy: a short version on top, then the full policy in ten sections |
| `about/index.html` | About the creators |
| `404.html` | Shown for any wrong address |
| `assets/css/site.css` | All styles, built on the brand kit tokens |
| `assets/js/site.js` | Waitlist or open, the live strip, the counter, the waitlist forms |
| `assets/js/form.js` | The sign-up form: questions, validation, sending |
| `assets/css/home.css`, `assets/js/home.js` | Homepage only: the big question, the text that lights up, the two city cards |
| `assets/img/` | Logo files, favicon, and the share thumbnails: `og-<page>.png` (1200×630 link previews) and `square-<page>.png` (1080×1080, for posts) |
| `tools/thumb.html`, `tools/render_thumbs.sh` | The thumbnail design and the script that renders all eight PNGs. Change the text in `thumb.html`, run `./tools/render_thumbs.sh`. |
| `release.py` | Sets a new version number everywhere, including the `?v=` on stylesheet and script links. Run before every commit. |

## The homepage (v2)

Four views, and **each one fits a single screen** (sizes follow the height of the window as well as its width). No eyebrows: no small label above a heading, no pill.

1. **The question**, one line on what Awesome Meets is, and one button: "When did you last meet someone from your field who isn't a colleague?" / "Awesome Meets introduces you to someone new for a one-to-one conversation."
2. **The case.** Four short paragraphs, each opening with a bold sentence. The point is meeting someone genuinely new, not finding a job: "We all know people at work" · "Networking isn't saying 'Hello, my name is'" · "It might never lead to a job" · "It's the part of work life you can't turn into KPIs". It ends on "So, again: when was the last time you truly networked?"
3. **What we do.** "We match. You meet." and four step cards side by side, each with a small moving picture: tell us a little about yourself · we check everyone · we find your match · you meet in person. On phones they become four short rows without pictures.
4. **Where are you?** Two cards:
   - **Helsinki:** the waitlist for November (email only), or a "Sign up" button while a round is open.
   - **Another city:** email, LinkedIn profile, city and country, all four required. They land in the Sheet tab `Other cities waitlist`. (On a phone these two cards are taller than one screen.)

People who have "reduce motion" switched on, or no JavaScript, get everything at once and readable.
Homepage v1 (animated match cards, the try-it card builder, how it works, questions) is in the git history at commit `d38d0e9`.

## The two modes

The site is always in one of two states, decided by `config.js`:

- **waitlist**: collects emails for the next round. They land in the `November waitlist` tab of the Sheet. (The waitlist for another city is always there, in both modes, and lands in `Other cities waitlist`.)
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
- [x] Domain attached 30 Sep 2026: awesomemeets.com (`CNAME` file, share addresses in the four pages point at it)

## Rules

Brand kit: https://claude.ai/artifact/Aj3ijuYQ3r8evhUy9vzM7q

- Three colours: yellow `#FFD166`, orange `#FF8C42`, pink `#FF5FA2`. Deep pink `#D11E6E` is the only brand colour that may be text. No purple.
- Buttons: white text on the deep gradient, never an emoji inside.
- Never a coloured stripe down the left edge of a card, quote or row.
- The logo heart is the text glyph ♥ in `#FF8C42`. In the header and on horizontal logos it sits straight on the background, with no tile around it.
- The credit is always "by the creators of The Awesome Marketers".
- Awesome Meets is **not only for marketers** (Anna, 30 Sep 2026). Say "people", "someone new", "someone from your field". "Marketers" only when talking about round one or The Awesome Marketers community. The sign-up form (topics, "how many marketers") and the emails still need rewriting before a round opens for everyone.
- The top navigation has no "Your data" link (Anna, 30 Sep). It lives in the footer.
- No em dashes. British spelling. Never promise a round every month.
- No capitalised eyebrows or labels, ever. Every small label is sentence case; `text-transform: uppercase` is not used anywhere.
- The waitlist is always called "the waitlist for <month>" ("Join the waitlist for November"), never just "the waitlist". In the HTML write the month as `<span data-am="label">November</span>` so it follows `round.label` in config.js.
- **No visible version number on the site** (Anna, 30 Sep 2026): the footer says "© 2026 Awesome Meets". The version lives in `config.js`, in a hidden `<meta name="am-version">` tag and in the `?v=` of the asset links. **Before every commit run `python3 release.py 2.5`** (the next number): it updates all three, so a visitor never gets a new page with an old stylesheet. Change the year in the five footers each January.
- **Thumbnails:** everything that matters sits inside the white card in the middle, because several apps crop link previews to a square. After changing a thumbnail, LinkedIn keeps the old one until the link is run through its Post Inspector.
- The data note inside the form is what people agree to. Change a word of it and `consentVersion` in `config.js` goes up.

## Versions

| Version | Date | What changed |
|---|---|---|
| v1.0 | 29 Sep 2026 | First version: home, join (waitlist and form), your data, about the creators, 404. Launched in waitlist mode. |
| v2.5 | 30 Sep 2026 | Copy fixes after outside feedback: the hero now says what Awesome Meets is and has a button; the networking text is about meeting someone new rather than the job market; "We match. You meet."; clearer step wording; "40 people joined round one. Round two opens in November."; "Bring Awesome Meets to my city". |
| v2.6 | 30 Sep 2026 | Search and AI-search pass (b2b-saas-seo-geo skill): keyword-first titles, 143 to 147 character descriptions, canonical tags, `robots.txt`, `sitemap.xml`, `llms.txt`, Organization + WebSite + FAQPage structured data, "Questions people ask" on the About page, one H1 on the Join page, and the category ("one-to-one networking in Helsinki") said in the first lines of every page. `noindex` is still on. |
| v2.4 | 30 Sep 2026 | New share thumbnails, one per page, designed so the middle square survives a square crop, plus true square versions. The footer no longer shows the version: it says "© 2026 Awesome Meets". |
| v2.3 | 30 Sep 2026 | The second, third and fourth views each fit one screen: the networking text is four short paragraphs, the steps are four compact cards in a row, "Where are you?" is its own view. |
| v2.2 | 30 Sep 2026 | Stylesheet and script links carry the version (`?v=2.2`), set by `release.py`. Fixes the page looking broken for up to ten minutes after an update. |
| v2.1 | 30 Sep 2026 | Awesome Meets is not only for marketers: visible pages, the share image and the counter now say "people" or "someone new". The "We do the introducing" screen is now four illustrated steps. "Your data" removed from the top navigation (still in the footer). The sign-up form itself is unchanged and still written for marketers. |
| v2.0 | 30 Sep 2026 | Homepage v2: one massive question, Anna's text on real networking, what we do, and two waitlists (Helsinki for November, another city with email + LinkedIn + city + country). Minimal, no eyebrows. The old "How it works" links on other pages now go to "What we do". Data policy covers the waitlist for another city. |
| v1.6 | 30 Sep 2026 | Every mention of the waitlist now reads "waitlist for November" (the month comes from `round.label` in config.js). The docked phone button moved from the homepage to `site.js`, so About and the data policy have it too. |
| v1.5 | 30 Sep 2026 | Data policy: the GitHub and Google Fonts row removed from the list of services, at Anna's request. |
| v1.4 | 30 Sep 2026 | Data page rewritten as a proper data policy with a short version on top. The "This website" block (no cookies, saved counter, hosting and fonts) was removed at Anna's request; hosting and fonts are still named in the list of services. |
| v1.3 | 30 Sep 2026 | Footer links to Awesome Meets on LinkedIn and to Anna's website (awesomemarketer.fi), on every page; both also on the About page. |
| v1.2 | 30 Sep 2026 | Domain awesomemeets.com: share-image and page addresses moved to it. No visible change. |
| v1.1 | 29 Sep 2026 | Homepage rebuilt as an interactive one-pager: animated hero with example matches, "Try it" card builder with a match reveal, timeline that fills in, scroll progress, a button that stays within reach on phones. All capitalised labels changed to sentence case. |

## Search and AI search (v2.6)

- **The category phrase is "one-to-one networking in Helsinki".** It sits in the homepage title, the hero subline, the first lines of Join and About, `llms.txt` and the structured data. Keep the wording identical everywhere: search engines and AI systems learn what Awesome Meets is from the repetition.
- **Every page has**: a `<title>` of at most 60 characters with the topic first and the brand last, a description of 105 to 155 characters that makes sense on its own, a `<link rel="canonical">` with the full https address, and exactly one `<h1>`.
- **`robots.txt`** lets every crawler in (AI crawlers too) and keeps them out of `/tools/`. **`sitemap.xml`** lists the four pages: change `lastmod` when a page changes. **`llms.txt`** is the plain-text summary for AI systems: update it when a round opens or closes.
- **Structured data**: the homepage has `Organization` + `WebSite`; the About page has `Organization` + `FAQPage`. The FAQPage answers must stay word for word the same as the visible "Questions people ask" answers (both live in `about/index.html`), and must agree with the data policy.
- **`noindex` is still on all four pages** until Anna says go. While it is on, Google and Bing will not list the site, whatever else is done. At launch: remove the four `<meta name="robots" content="noindex">` lines (keep the one in `404.html`), then in Search Console submit `https://awesomemeets.com/sitemap.xml` and press "Request indexing" on the homepage.
- **Known gap**: the sign-up form on `join/` is hidden in waitlist mode but still in the page source, and it is still worded for marketers. Crawlers read it. Fix when the form is rewritten for everyone.

