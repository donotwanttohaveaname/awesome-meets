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
- **No visible version number on the site** (Anna, 30 Sep 2026): the footer line is "Made with ❤️ in Helsinki. © 2026 by Anna Pogrebniak" (her wording, the same line as on awesomemarketers.fi; the name links to awesomemarketer.fi). The version lives in `config.js`, in a hidden `<meta name="am-version">` tag and in the `?v=` of the asset links. **Before every commit run `python3 release.py 2.5`** (the next number): it updates all three, so a visitor never gets a new page with an old stylesheet. Change the year in the five footers each January.
- **Thumbnails:** everything that matters sits inside the white card in the middle, because several apps crop link previews to a square. After changing a thumbnail, LinkedIn keeps the old one until the link is run through its Post Inspector.
- The data note inside the form is what people agree to. Change a word of it and `consentVersion` in `config.js` goes up.

## Versions

| Version | Date | What changed |
|---|---|---|
| v1.0 | 29 Sep 2026 | First version: home, join (waitlist and form), your data, about the creators, 404. Launched in waitlist mode. |
| v2.5 | 30 Sep 2026 | Copy fixes after outside feedback: the hero now says what Awesome Meets is and has a button; the networking text is about meeting someone new rather than the job market; "We match. You meet."; clearer step wording; "40 people joined round one. Round two opens in November."; "Bring Awesome Meets to my city". |
| v2.6 | 30 Sep 2026 | Search and AI-search pass (b2b-saas-seo-geo skill): keyword-first titles, 143 to 147 character descriptions, canonical tags, `robots.txt`, `sitemap.xml`, `llms.txt`, Organization + WebSite + FAQPage structured data, "Questions people ask" on the About page, one H1 on the Join page, and the category ("one-to-one networking in Helsinki") said in the first lines of every page. `noindex` was still on (removed in v2.13). |
| v2.7 | 30 Sep 2026 | Hero subline set as two even lines, one sentence each (it broke into three with one word alone). |
| v2.8 | 30 Sep 2026 | Thumbnails redone plain: white ground, soft warm glow, the name and one big line (the version with a card and shapes was "really really ugly and too much"). Site icon is now the plain orange heart with no tile (`favicon.ico` + `assets/img/icon-*.png`). Footer link "Anna's website" is now "Who is Anna?". |
| v2.9 | 30 Sep 2026 | Buy Me a Coffee button (Anna's embed code, account `awesomemeets`) on Home, Join, About and the data policy. On phones it is smaller and moves above the docked waitlist button. One row about it added to the services list in the data policy. |
| v2.10 | 30 Sep 2026 | Footer line is now "Made with ❤️ in Helsinki. © 2026 by Anna Pogrebniak", as on awesomemarketers.fi. |
| v2.11 | 30 Sep 2026 | Footer link "Who is Anna?" removed again (her site is linked from the About page and the footer line). Short paragraph about Anna added to "Who runs Awesome Meets" on the About page. |
| v2.12 | 30 Sep 2026 | Hero subline no longer says "in Helsinki": "Awesome Meets is one-to-one networking. We introduce you to someone new for a real conversation." |
| v2.13 | 30 Sep 2026 | `noindex` removed from Home, Join, About and the data policy so Google and Bing can list the site (Anna's Search Console test was failing on it). HTTPS on since 17:19 the same day. |
| v2.14 | 30 Sep 2026 | Copy tweaks from a second round of outside feedback: "Unless your KPI is happiness."; step 3 "No random matches."; step 2 "reviewed" instead of "validated"; new line under the steps "The goal isn't to find someone similar. It's to find someone interesting."; "Another city" card is now "Not in Helsinki?"; the half-sentence "Sign-ups are open until ." is gone from the page source (open-round sentences are now written by `site.js`). |
| v2.15 | 30 Sep 2026 | Safety net for the hero: after 3.5 s, or at once when the page is opened hidden (link preview, background tab) or with "reduce motion", the question, subline and button are simply visible. A reader had sent a screenshot of an empty hero. |
| v2.16 | 30 Sep 2026 | Data policy and About question: a match also sees your email address (the match email goes to both people at once). Changed before the first real match emails went out. |
| v2.17 | 30 Sep 2026 | Google Analytics tag (G-60GBR73KYC) in the head of all five pages, as Anna sent it. Google Analytics added to the services list in the data policy. No cookie banner yet. |
| v2.18 | 30 Sep 2026 | Ahrefs Web Analytics tag (cookieless) on all five pages, right after the Google tag; listed in the data policy. |
| v2.19 | 1 Oct 2026 | New page `feedback/` (+ `assets/js/feedback.js`): the form behind the buttons in the "how did it go?" email. It talks to the backend in the background, because a direct Google script link shows a Drive error to anyone signed into several Google accounts. No analytics tags and no coffee button on it (the address carries a personal link code), noindex, not in the sitemap. Preview without sending: `localhost:8763/feedback/?preview=form` (also `none`, `done`, `bad`, `offline`). Data policy says feedback is public only if the box is ticked. |
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

- **The category phrase is "one-to-one networking in Helsinki".** It sits in the homepage title and description, the first lines of Join and About, `llms.txt` and the structured data. **Not in the hero**: Anna had "in Helsinki" taken out of the hero subline (v2.12), which now reads "Awesome Meets is one-to-one networking." Keep the wording identical everywhere: search engines and AI systems learn what Awesome Meets is from the repetition.
- **Every page has**: a `<title>` of at most 60 characters with the topic first and the brand last, a description of 105 to 155 characters that makes sense on its own, a `<link rel="canonical">` with the full https address, and exactly one `<h1>`.
- **`robots.txt`** lets every crawler in (AI crawlers too) and keeps them out of `/tools/`. **`sitemap.xml`** lists the four pages: change `lastmod` when a page changes. **`llms.txt`** is the plain-text summary for AI systems: update it when a round opens or closes.
- **Structured data**: the homepage has `Organization` + `WebSite`; the About page has `Organization` + `FAQPage`. The FAQPage answers must stay word for word the same as the visible "Questions people ask" answers (both live in `about/index.html`), and must agree with the data policy.
- **`noindex` came off the four pages in v2.13 (30 Sep 2026)**, after Anna tested the homepage in Search Console and sent the "Excluded by noindex tag" result. Only `404.html` keeps it. To hide the site from Google again, put `<meta name="robots" content="noindex">` back in the `<head>` of the four pages. In Search Console: re-run the live test, press "Request indexing" on each page you want listed, and submit `https://awesomemeets.com/sitemap.xml` under Sitemaps.
- **Known gap**: the sign-up form on `join/` is hidden in waitlist mode but still in the page source, and it is still worded for marketers. Crawlers read it. Fix when the form is rewritten for everyone.

## Buy Me a Coffee button (v2.9)

- The `<script data-name="BMC-Widget" …>` line sits just before `</body>` on Home, Join, About and the data policy (not on the 404 page). It is Anna's embed code, unchanged: to change the message, colour or side, edit the `data-` attributes in all four pages.
- The script adds a round button (`#bmc-wbtn`) and a message that shows for a few seconds. Both are styled by the script itself; `assets/css/site.css` (last block) overrides the message font and, on phones, the size and position, so the button never sits on top of the docked waitlist button.
- What it does in a visitor's browser: loads the script, a font and the cup picture from buymeacoffee.com, and saves a one-day cookie called `visited` so the message does not pop up on every page. The payment page only loads when someone clicks the button. The data policy says this in the services list (section 5): keep the two in step.

