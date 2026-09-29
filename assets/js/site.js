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
      label: 'November', name: 'Awesome Meets',
      opensAt: loadedAt - 5 * 86400000, closesAt: loadedAt + 9 * 86400000 + 3600000,
      closesLong: 'Monday 9 November at 4PM', closesShort: 'Mon 9 Nov, 4PM',
      matchedByLong: 'Friday 13 November', meetWindow: '16 and 27 November',
      weeks: [
        ['Week 47', [['November 16, Monday', 'Mon 16 Nov'], ['November 17, Tuesday', 'Tue 17 Nov'], ['November 18, Wednesday', 'Wed 18 Nov'], ['November 19, Thursday', 'Thu 19 Nov'], ['November 20, Friday', 'Fri 20 Nov']]],
        ['Week 48', [['November 23, Monday', 'Mon 23 Nov'], ['November 24, Tuesday', 'Tue 24 Nov'], ['November 25, Wednesday', 'Wed 25 Nov'], ['November 26, Thursday', 'Thu 26 Nov'], ['November 27, Friday', 'Fri 27 Nov']]]
      ]
    };
    AM.preview = true;
  }

  var round = AM.round || {};
  var last = AM.lastRound || {};

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
    closesShort: round.closesShort || '',
    matchedByLong: round.matchedByLong || '',
    meetWindow: round.meetWindow || '',
    lastName: last.name || '',
    lastMonth: last.month || '',
    lastSignups: String(last.signups || ''),
    email: AM.contactEmail || '',
    version: 'Awesome Meets site ' + (AM.version || '')
  };
  each('[data-am]', function (n) { var k = n.getAttribute('data-am'); if (text[k] !== undefined) n.textContent = text[k]; });
  each('[data-show]', function (n) { n.hidden = n.getAttribute('data-show') !== state; });
  each('[data-am-cta]', function (n) { n.textContent = state === 'open' ? 'Sign up' : 'Join the waitlist'; });
  if (AM.preview) each('[data-am="version"]', function (n) { n.textContent += ' · PREVIEW, nothing is sent'; });

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
        if (left > 172800000) { rightNum.textContent = days; rightLabel.textContent = 'days left to join'; }
        else if (hours >= 1) { rightNum.textContent = hours; rightLabel.textContent = hours === 1 ? 'hour left to join' : 'hours left to join'; }
        else { rightNum.textContent = Math.max(1, mins); rightLabel.textContent = 'minutes left to join'; }   // rounded down, never promises extra time
        countLabel.textContent = 'marketers signed up';
        bar.hidden = false;
        if (round.opensAt) fill.style.width = Math.max(4, Math.min(100, (Date.now() - round.opensAt) / (round.closesAt - round.opensAt) * 100)).toFixed(1) + '%';
        footLeft.textContent = 'Sign-ups open';
        footRight.textContent = round.closesShort ? 'Closes ' + round.closesShort : '';
      } else {
        rightNum.textContent = (round.label || 'Soon').slice(0, 3);
        rightLabel.textContent = 'next round';
        countLabel.textContent = last.countLabel || 'marketers signed up last round';
        bar.hidden = true;
        footLeft.textContent = 'Waitlist open';
        footRight.textContent = last.month ? 'Round one: ' + last.month : '';
      }
    }
    paintStrip();
    setInterval(function () {
      paintStrip();
      if (AM.state() !== state) location.reload();   // the round just closed: show the waitlist
    }, 30000);

    // The count. Last known number first, then the live one. The Apps Script web app cold-starts
    // (8 seconds is normal, a failed first try happens), so: long timeout, three tries, remembered locally.
    // While a round is open the count stays hidden below MIN_TRACKER, so an empty-looking round never
    // puts anyone off. One memory slot per round, so last round's number never shows on a new one.
    var MIN_TRACKER = 5;
    var KEY = 'amCount:' + (state === 'open' ? round.closesAt : 'waitlist');
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
      fetch(AM.endpoint + '?count=1', { signal: ctrl.signal })
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
})();
