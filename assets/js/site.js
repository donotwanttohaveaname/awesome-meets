/* Awesome Meets: everything that depends on whether a round is open.
   Reads assets/js/config.js (window.AM). No cookies, no analytics. */
(function () {
  var AM = window.AM || {};
  var loadedAt = Date.now();

  // Preview of an open round, for checking the form before a launch. Works ONLY on this computer
  // (localhost), never on the live site, and sends nothing: the endpoint is blanked.
  //   http://localhost:<port>/join/?preview=open
  var isLocal = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) > -1;
  if (isLocal && location.search.indexOf('preview=open') > -1) {
    AM.mode = 'open';
    AM.endpoint = '';
    AM.round = {
      key: 'december', label: 'December', name: 'Awesome Meets',
      opensAt: loadedAt - 2 * 86400000, closesAt: loadedAt + 9 * 86400000 + 3600000,
      closesLong: 'Friday 27 November at 10AM', closesShort: 'Fri 27 Nov, 10AM',
      matchedByLong: 'Monday 30 November', meetWindow: 'December', weeks: []
    };
    AM.preview = true;
  }

  // Preview of the moment a round's cut-off has passed and the next round takes over (localhost only, sends nothing):
  //   http://localhost:<port>/?preview=next      http://localhost:<port>/join/?preview=next
  if (isLocal && location.search.indexOf('preview=next') > -1 && AM.round && AM.nextRound) {
    AM.endpoint = '';
    AM.round.closesAt = loadedAt - 60000;
    AM.nextRound.opensAt = loadedAt - 60000;
    AM.preview = true;
  }

  // Rounds follow each other without a gap (Anna, 26 Nov 2026: "sign ups are open all the time but the nearest matching
  // date changes"). When the running round's cut-off has passed and config.js names the next round, that round takes
  // over by itself: its dates, its counter, its extra form options. The round that just closed becomes the last round.
  if (AM.mode === 'open' && AM.round && AM.nextRound && AM.nextRound.closesAt && loadedAt >= AM.round.closesAt && loadedAt < AM.nextRound.closesAt) {
    AM.lastRound = { key: AM.round.key, label: AM.round.label, name: AM.round.name, month: AM.round.label, signups: 0, countLabel: 'people signed up for ' + AM.round.label };
    AM.round = AM.nextRound;
    AM.nextRound = null;
  }

  var round = AM.round || {};
  var last = AM.lastRound || {};
  var next = (AM.mode === 'open' && AM.nextRound) || null;   // the round after this one, when config.js already names it

  // 'open' only while the form should be shown. Everything else is the waitlist.
  AM.state = function () {
    var now = Date.now();
    if (AM.mode === 'open' && round.closesAt && now < round.closesAt && (!round.opensAt || now >= round.opensAt)) return 'open';
    return 'waitlist';
  };
  AM.loadedAt = loadedAt;
  var state = AM.state();
  document.documentElement.setAttribute('data-am-state', state);

  function each(sel, fn) { [].forEach.call(document.querySelectorAll(sel), fn); }

  // ---- text placeholders: <span data-am="closesLong"></span>
  var text = {
    label: round.label || 'the next round',
    roundName: round.name || 'Awesome Meets',
    closesLong: round.closesLong || '',
    // whole sentences that only exist while a round is open: the page source holds no half-sentence
    // (a reader without JavaScript once saw "Sign-ups are open until .")
    // Anna, 26 Nov 2026: "sign ups are open all the time but the nearest matching date changes soooo this needs to be clearer".
    // So the date is the cut-off for THIS round's matching, never "sign-ups close".
    openUntil: round.closesLong ? 'Sign up by ' + round.closesLong + ' to be matched for ' + (round.label || 'this round') + '.' +
      (next ? ' Sign up after that and you\'re in for ' + next.label + '.' : '') : '',
    openLede: round.closesLong ? 'Four short steps. Sign up by ' + round.closesLong + ' to be matched for ' + (round.label || 'this round') + '.' : '',
    cutoffLine: round.closesLong ? 'The cut-off for ' + (round.label || 'this round') + ' is ' + round.closesLong + '.' +
      (next ? ' Sign up after it and you\'re in for ' + next.label + '.' : '') : '',
    closesShort: round.closesShort || '',
    matchedByLong: round.matchedByLong || '',
    meetWindow: round.meetWindow || '',
    lastName: last.name || '',
    lastLabel: last.label || 'the last round',
    lastMonth: last.month || '',
    lastSignups: String(last.signups || ''),
    email: AM.contactEmail || '',
    year: String(new Date().getFullYear())
  };
  each('[data-am]', function (n) { var k = n.getAttribute('data-am'); if (text[k] !== undefined) n.textContent = text[k]; });
  each('[data-show]', function (n) { n.hidden = n.getAttribute('data-show') !== state; });
  each('[data-am-cta]', function (n) { n.textContent = state === 'open' ? 'Sign up' : 'Join the waitlist for ' + text.label; });
  // The join page's fixed title is "Sign up | Awesome Meets" (true for every round, and what link previews show);
  // in the browser tab it names the round, or the waitlist when no round is open.
  if (/^Sign up \| /.test(document.title)) document.title = (state === 'open' ? 'Sign up for ' + text.label : 'Join the waitlist for ' + text.label) + ' | Awesome Meets';
  if (AM.preview) each('.site-version', function (n) { n.textContent += ' · PREVIEW, nothing is sent'; });

  // ---- countdown to the close of sign-ups (Anna, 6 Oct 2026: "add countdown to the website", then "say that
  // november sign ups close in")
  // <div data-countdown hidden></div> anywhere on a page: shown and ticking every second only while a round is open.
  var closesIn = (round.label ? round.label + ' cut-off' : 'Cut-off') + ' in';   // "December cut-off in 0d 13h": sign-ups stay open, the round's matching has a cut-off
  each('[data-countdown]', function (box) {
    if (state !== 'open' || !round.closesAt) return;
    var units = [['d', 'day', 'days', 86400000], ['h', 'hour', 'hours', 3600000], ['m', 'minute', 'minutes', 60000], ['s', 'second', 'seconds', 1000]];
    box.innerHTML = '<span class="countdown__label">' + closesIn + '</span><span class="countdown__units">' +
      units.map(function (u) { return '<span class="countdown__unit"><b data-u="' + u[0] + '">0</b><i data-l="' + u[0] + '">' + u[2] + '</i></span>'; }).join('') + '</span>';
    box.setAttribute('aria-label', 'Sign up by ' + (round.closesLong || '') + ' to be matched for ' + (round.label || 'this round'));
    box.hidden = false;
    function tick() {
      var left = Math.max(0, round.closesAt - Date.now());
      units.forEach(function (u) {
        var v = Math.floor(left / u[3]);
        left -= v * u[3];
        box.querySelector('[data-u="' + u[0] + '"]').textContent = u[0] === 'd' ? String(v) : (v < 10 ? '0' : '') + v;
        box.querySelector('[data-l="' + u[0] + '"]').textContent = v === 1 ? u[1] : u[2];
      });
    }
    tick();
    setInterval(tick, 1000);
  });

  // ---- the bar pinned to the top of the screen while a round is open (Anna, 6 Oct 2026: "add a sticky popup on top
  // of the screen with CTA and countdown"). It sits inside the sticky header, so it stays on screen while scrolling.
  // Not on the sign-up page itself or the feedback page. The × hides it for the rest of the visit (this tab only).
  (function topbar() {
    var header = document.querySelector('.site-header');
    var path = location.pathname;
    if (state !== 'open' || !round.closesAt || !header || /\/(join|feedback)\/?$/.test(path)) return;
    try { if (sessionStorage.getItem('amTopbarHidden') === String(round.closesAt)) return; } catch (e) {}
    var bar = document.createElement('div');
    bar.className = 'topbar';
    bar.innerHTML = '<div class="container topbar__in">' +
      '<p class="topbar__text"><span class="topbar__label">' + closesIn + '</span> <span class="topbar__time" role="timer" aria-live="off"></span></p>' +
      '<a class="btn btn--primary btn--sm topbar__cta" href="/join/">Sign up</a>' +
      '<button type="button" class="topbar__x" aria-label="Hide this bar">×</button></div>';
    header.insertBefore(bar, header.firstChild);
    document.documentElement.classList.add('has-topbar');
    var time = bar.querySelector('.topbar__time');
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var left = Math.max(0, round.closesAt - Date.now());
      var d = Math.floor(left / 86400000), h = Math.floor(left / 3600000) % 24, m = Math.floor(left / 60000) % 60, s = Math.floor(left / 1000) % 60;
      time.textContent = d + 'd ' + pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
    }
    tick();
    setInterval(tick, 1000);
    bar.querySelector('.topbar__x').addEventListener('click', function () {
      bar.remove();
      document.documentElement.classList.remove('has-topbar');
      try { sessionStorage.setItem('amTopbarHidden', String(round.closesAt)); } catch (e) {}
    });
  })();

  // A page left open across a cut-off reloads once, so it shows the next round (or the waitlist) without anyone refreshing.
  // The sign-up page is left alone while someone is typing in the form: form.js handles a late answer there.
  setInterval(function () {
    if (AM.state() === state) return;
    if (document.getElementById('amSubmit') && document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    location.reload();
  }, 20000);

  // ---- live strip
  var strip = document.getElementById('amLive');
  if (strip) {
    var countNum = document.getElementById('amCountNum'), countLabel = document.getElementById('amCountLabel');
    var rightNum = document.getElementById('amLeftNum'), rightLabel = document.getElementById('amLeftLabel');
    var bar = document.getElementById('amLiveBar'), fill = document.getElementById('amLiveFill');
    var footLeft = document.getElementById('amLiveState'), footRight = document.getElementById('amLiveClose');

    function paintStrip() {
      if (AM.state() === 'open') {
        var left = round.closesAt - Date.now();
        var days = Math.floor(left / 86400000), hours = Math.floor(left / 3600000), mins = Math.ceil(left / 60000);
        var forRound = ' left for ' + (round.label || 'this round');
        if (left > 172800000) { rightNum.textContent = days; rightLabel.textContent = 'days' + forRound; }
        else if (hours >= 1) { rightNum.textContent = hours; rightLabel.textContent = (hours === 1 ? 'hour' : 'hours') + forRound; }
        else { rightNum.textContent = Math.max(1, mins); rightLabel.textContent = 'minutes' + forRound; }   // rounded down, never promises extra time
        countLabel.textContent = 'people signed up';
        bar.hidden = false;
        if (round.opensAt) fill.style.width = Math.max(4, Math.min(100, (Date.now() - round.opensAt) / (round.closesAt - round.opensAt) * 100)).toFixed(1) + '%';
        footLeft.textContent = 'Sign-ups open';
        footRight.textContent = round.closesShort ? (round.label ? round.label + ' cut-off: ' : 'Cut-off: ') + round.closesShort : '';
      } else {
        rightNum.textContent = (round.label || 'Soon').slice(0, 3);
        rightLabel.textContent = 'next round';
        countLabel.textContent = last.countLabel || 'people signed up last round';
        bar.hidden = true;
        footLeft.textContent = 'Waitlist for ' + (round.label || 'the next round') + ' open';
        footRight.textContent = last.month ? 'Last round: ' + last.month : '';
      }
    }
    paintStrip();
    setInterval(paintStrip, 30000);

    // The count. Last known number first, then the live one. The Apps Script web app cold-starts
    // (8 seconds is normal, a failed first try happens), so: long timeout, three tries, remembered locally.
    // While a round is open the count stays hidden below MIN_TRACKER, so an empty-looking round never
    // puts anyone off. One memory slot per round, so last round's number never shows on a new one.
    var MIN_TRACKER = 5;
    var KEY = 'amCount:' + (state === 'open' ? round.closesAt : 'waitlist:' + (last.key || ''));
    var countItem = document.getElementById('amCountItem'), sep = document.getElementById('amLiveSep');
    var painted = false;
    function show(n, animate) {
      var visible = state === 'open' ? n >= MIN_TRACKER : n > 0;
      countItem.hidden = !visible;
      sep.hidden = !visible;
      if (!visible) return;
      if (!animate) { countNum.textContent = n; painted = true; return; }
      var step = Math.max(1, Math.round(n / 18)), shown = Math.max(0, n - step * 18);
      (function tick() { shown = Math.min(n, shown + step); countNum.textContent = shown; if (shown < n) setTimeout(tick, 40); })();
      painted = true;
    }
    show(state === 'open' ? 0 : (last.signups || 0), false);
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && typeof c.n === 'number' && Date.now() - c.t < 86400000) show(c.n, false);
    } catch (e) {}
    (function ask(attempt) {
      if (!AM.endpoint) return;
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 25000);
      // open: this round's tab; waitlist: the last round's tab (lastRound.key), so the number matches "signed up for November"
      var countKey = state === 'open' ? round.key : last.key;
      fetch(AM.endpoint + '?count=1' + (countKey ? '&round=' + encodeURIComponent(countKey) : ''), { signal: ctrl.signal })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          clearTimeout(timer);
          if (!res || typeof res.count !== 'number') throw new Error('no count');
          try { localStorage.setItem(KEY, JSON.stringify({ n: res.count, t: Date.now() })); } catch (e) {}
          // waitlist mode keeps the number from config if the Sheet tab was already emptied for the next round
          if (state === 'open' || res.count > 0) show(res.count, !painted);
        })
        .catch(function () { clearTimeout(timer); if (attempt < 3) setTimeout(function () { ask(attempt + 1); }, attempt * 2000); });
    })(1);
  }

  // ---- waitlist forms
  each('.js-waitlist', function (wrap) {
    var form = wrap.querySelector('form'), input = wrap.querySelector('input[type="email"]');
    var trap = wrap.querySelector('.js-trap'), btn = wrap.querySelector('button[type="submit"]');
    var status = wrap.querySelector('.am-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        status.textContent = "That email doesn't look quite right. Mind checking it?";
        input.focus();
        return;
      }
      if (!AM.endpoint) { wrap.classList.add('is-done'); return; }
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Saving…';
      var body = JSON.stringify({ waitlistEmail: email, website: trap ? trap.value : '', startedAt: loadedAt });
      // the backend ignores anything sent within 5 seconds of page load (bot guard), so hold briefly
      var wait = Math.max(0, 5500 - (Date.now() - loadedAt));
      function send(attempt) {
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 20000);
        fetch(AM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, signal: ctrl.signal })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            clearTimeout(timer);
            if (!res || !res.ok) throw new Error((res && res.error) || 'failed');
            wrap.classList.add('is-done');
          })
          .catch(function () {
            clearTimeout(timer);
            if (attempt < 3) { setTimeout(function () { send(attempt + 1); }, attempt * 1500); return; }
            btn.disabled = false;
            btn.textContent = label;
            status.textContent = 'That did not save. Please email ' + (AM.contactEmail || 'anna@awesomemarketers.fi') + ' and I will add you by hand.';
          });
      }
      setTimeout(function () { send(1); }, wait);
    });
  });

  // ---- waitlist for another city: email, LinkedIn, city and country, all four required
  each('.js-citylist', function (wrap) {
    var form = wrap.querySelector('form'), status = wrap.querySelector('.am-status');
    var trap = wrap.querySelector('.js-trap'), btn = wrap.querySelector('button[type="submit"]');
    function field(name) { return form.querySelector('[name="' + name + '"]'); }
    var asks = {
      email: "That email doesn't look quite right. Mind checking it?",
      linkedin: 'Paste the link to your LinkedIn profile, like linkedin.com/in/yourname',
      city: 'Which city are you in?',
      country: 'And which country?'
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      var d = { email: field('email').value.trim(), linkedin: field('linkedin').value.trim(), city: field('city').value.trim(), country: field('country').value.trim() };
      var bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) ? 'email' : !/linkedin\.com\/.+/i.test(d.linkedin) ? 'linkedin' : d.city.length < 2 ? 'city' : d.country.length < 2 ? 'country' : '';
      if (bad) { status.textContent = asks[bad]; field(bad).focus(); return; }
      function done() { var c = wrap.querySelector('[data-city]'); if (c) c.textContent = d.city; wrap.classList.add('is-done'); }
      if (!AM.endpoint) { done(); return; }
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Saving…';
      var body = JSON.stringify({ cityWaitlist: d, website: trap ? trap.value : '', startedAt: loadedAt });
      var wait = Math.max(0, 5500 - (Date.now() - loadedAt));   // same bot rule as the other forms
      function fail(msg) { btn.disabled = false; btn.textContent = label; status.textContent = msg; }
      function send(attempt) {
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 20000);
        fetch(AM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, signal: ctrl.signal })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            clearTimeout(timer);
            if (res && res.ok) { done(); return; }
            if (res && asks[res.error]) { fail(asks[res.error]); field(res.error).focus(); return; }
            throw new Error('failed');
          })
          .catch(function () {
            clearTimeout(timer);
            if (attempt < 3) { setTimeout(function () { send(attempt + 1); }, attempt * 1500); return; }
            fail('That did not save. Please email ' + (AM.contactEmail || 'anna@awesomemarketers.fi') + ' and I will add you by hand.');
          });
      }
      setTimeout(function () { send(1); }, wait);
    });
  });

  // ---- phones: a button docked at the bottom. It shows once you have scrolled a little,
  //      and steps aside whenever an email box or the main buttons are on screen.
  var dock = document.getElementById('dock');
  if (dock && 'IntersectionObserver' in window) {
    var seen = 0, past = false;
    var sync = function () { dock.classList.toggle('is-up', past && seen === 0); };
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen += e.isIntersecting ? 1 : (e.target._in ? -1 : 0); e.target._in = e.isIntersecting; });
      sync();
    }, { threshold: 0.1 });
    each('.js-waitlist form, .js-citylist form, .hero__cta', function (n) { watch.observe(n); });
    window.addEventListener('scroll', function () { var p = window.scrollY > 420; if (p !== past) { past = p; sync(); } }, { passive: true });
  }
})();
