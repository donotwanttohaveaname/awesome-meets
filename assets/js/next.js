/* Awesome Meets, the new homepage (/next/). Runs after config.js and site.js, which have already decided which round
   is running and filled the shared placeholders. This file only adds what this page has of its own:
   the answer to the question, the texts with the round's dates, the swipe dots and the button docked on a phone.
   Nothing here is stored or sent anywhere. Without JavaScript the three bars are plain links to the reply. */
(function () {
  var AM = window.AM || {};
  var round = AM.round || {};
  var next = AM.nextRound || null;   // the round after this one, when config.js already names it
  var open = !!(AM.state && AM.state() === 'open');
  var doc = document.documentElement;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function all(sel) { return [].slice.call(document.querySelectorAll(sel)); }

  // ---- texts that carry the round's dates. An empty value leaves the sentence already in the page.
  // "Monday 30 November" -> "Mon 30 Nov"
  function short(s) { return String(s || '').split(' ').map(function (w) { return /^\d/.test(w) ? w : w.slice(0, 3); }).join(' '); }
  var extra = (round.extraActivities || []).map(function (a) { return a.toLowerCase(); });
  var cut = String(round.closesShort || '').split(', ');   // "Fri 27 Nov, 10AM" -> the day and the time
  var text = !open ? {} : {
    roundShort: round.closesShort ? (round.label ? round.label + ' round: sign up by ' : 'Sign up by ') + round.closesShort : '',
    signBy: round.closesShort ? (round.label ? round.label + ' round: sign up by' : 'Sign up by') : '',   // the two halves of roundShort, for the sign-up page's side menu
    closesAt: round.closesShort || '',
    closesDay: cut[0] || '',                                    // "Fri 27 Nov"
    matchedByShort: short(round.matchedByLong),
    meetWindow: round.meetWindow || '',
    cutoffLead: round.label ? (cut[1] ? cut[1] + ': the' : 'The') + ' cut-off for ' + round.label + '.' : '',   // "10AM: the cut-off for December."
    cutoffText: 'I check every sign-up, then match everyone who’s in.' + (next ? ' Sign up after this and you’re in for\u00a0' + next.label + '.' : ' There’s a new round every\u00a0month.'),
    meetHow: 'You pick the day and the place together: lunch, an after-work coffee' + (extra.length ? ', a walk or a ' + extra[0].replace(' ', '\u00a0') + '.' : ' or a\u00a0walk.')
  };
  all('[data-nx]').forEach(function (n) { var v = text[n.getAttribute('data-nx')]; if (v) n.textContent = v; });

  // ---- the answer
  var reply = document.getElementById('reply'), title = document.getElementById('replyTitle');
  var bars = all('.nx-bar[data-answer]');
  var flood = null, busy = false;

  function setAnswer(a) {
    doc.setAttribute('data-answer', a);
    title.textContent = title.getAttribute('data-' + a) || title.getAttribute('data-default');
    bars.forEach(function (b) {
      var on = b.getAttribute('data-answer') === a;
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    track();
  }
  function toReply() {
    var head = document.querySelector('.nx-header');
    var sticky = head && getComputedStyle(head).position === 'sticky' ? head.offsetHeight : 0;
    window.scrollTo({ top: reply.getBoundingClientRect().top + window.scrollY - sticky, behavior: 'instant' });
    title.focus({ preventScroll: true });
  }
  function arrive() {
    reply._arrived = true;
    reply.classList.remove('nx-wait');   // it may still be waiting below the screen (see "arriving" further down)
    reply.classList.remove('is-arriving');
    void reply.offsetWidth;   // restart the animation when a second answer is picked
    reply.classList.add('is-arriving');
  }

  bars.forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (busy) return;
      setAnswer(bar.getAttribute('data-answer'));
      if (calm) { toReply(); return; }
      busy = true;
      // the colour of the answer spreads from where the bar was pressed (from its middle for a keyboard press)
      var box = bar.getBoundingClientRect();
      var x = e.clientX || box.left + box.width / 2, y = e.clientY || box.top + box.height / 2;
      if (!flood) { flood = document.createElement('div'); flood.className = 'nx-flood'; flood.setAttribute('aria-hidden', 'true'); document.body.appendChild(flood); }
      flood.className = 'nx-flood';
      flood.style.setProperty('--x', x + 'px');
      flood.style.setProperty('--y', y + 'px');
      setTimeout(function () {
        flood.classList.add('is-on');
        setTimeout(function () {
          toReply();
          arrive();
          flood.classList.add('is-out');
          setTimeout(function () { flood.className = 'nx-flood'; busy = false; }, 260);
        }, 380);   // the colour has reached every corner by now
      }, 220);   // long enough to see the bar you pressed turn dark and move
    });
  });

  // ---- the header sits on the yellow of the first screen and turns into the usual light bar after it; the browser's own
  //      colour (the bar around the page on a phone) follows the screen that is at the top
  var ask = document.getElementById('top'), head = document.querySelector('.nx-header');
  var theme = document.querySelector('meta[name="theme-color"]');
  var screens = all('.nx-ask, .nx-view'), lastTheme = '';
  function track() {
    if (!ask || !head) return;
    var sticky = getComputedStyle(head).position === 'sticky';
    var past = ask.getBoundingClientRect().bottom <= head.offsetHeight + 4;
    doc.classList.toggle('nx-past', past);
    if (!theme) return;
    var colour = '';
    if (sticky) colour = past ? '#FFFDFB' : '#FFD166';
    else {
      colour = '#FFD166';   // the header's yellow, while it is still at the top
      for (var i = 0; i < screens.length; i++) {
        var r = screens[i].getBoundingClientRect();
        if (r.top <= 1 && r.bottom > 1) { colour = getComputedStyle(screens[i]).backgroundColor; break; }
      }
      if (window.scrollY > 10 && screens.length && screens[screens.length - 1].getBoundingClientRect().bottom <= 1) colour = '#FFFFFF';   // the footer
    }
    if (colour !== lastTheme) { theme.setAttribute('content', colour); lastTheme = colour; }
  }
  window.addEventListener('scroll', track, { passive: true });
  window.addEventListener('resize', track);
  track();

  // ---- phones: dots under the messages, so it is clear there are more to swipe to
  var chat = document.querySelector('.nx-chat');
  if (chat) {
    var msgs = [].slice.call(chat.children);
    var dots = document.createElement('div');
    dots.className = 'nx-dots';
    dots.setAttribute('aria-hidden', 'true');
    msgs.forEach(function () { dots.appendChild(document.createElement('i')); });
    chat.parentNode.insertBefore(dots, chat.nextSibling);
    var paint = function () {
      // the photo is shown first on a phone (CSS order), so sort by where each message really is
      var order = msgs.slice().sort(function (a, b) { return a.offsetLeft - b.offsetLeft; });
      var at = 0, best = Infinity, left = chat.scrollLeft + chat.getBoundingClientRect().left;
      order.forEach(function (m, i) { var d = Math.abs(m.getBoundingClientRect().left + chat.scrollLeft - left); if (d < best) { best = d; at = i; } });
      [].forEach.call(dots.children, function (d, i) { d.classList.toggle('is-on', i === at); });
    };
    var waiting = false;
    chat.addEventListener('scroll', function () { if (waiting) return; waiting = true; requestAnimationFrame(function () { waiting = false; paint(); }); }, { passive: true });
    paint();
    if (chat.scrollWidth > chat.clientWidth + 4) chat.tabIndex = 0;   // a swipe row on a phone: reachable with the keyboard too
  }

  // ---- phones: the button docked at the bottom. It shows after the first screen and steps aside whenever the first
  //      screen, the reply's own button, the last screen or the footer is on screen.
  var dock = document.getElementById('nxDock');
  if (dock && 'IntersectionObserver' in window) {
    dock.hidden = false;
    var seen = 0;
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen += e.isIntersecting ? 1 : (e.target._in ? -1 : 0); e.target._in = e.isIntersecting; });
      dock.classList.toggle('is-up', seen === 0);
    }, { threshold: 0.05 });
    all('#top, .nx-ticket, #where, .site-footer').forEach(function (n) { watch.observe(n); });
  }

  // =================================================================================================================
  // MOTION AND THINGS TO PRESS (Anna, 27 Nov 2026: "more interactable and moving things if possible across main pages").
  // The movements themselves are in next.css ("MOTION AND THINGS TO PRESS"); this part only says when. It runs on every
  // preview page. Nothing here hides anything unless it can also show it again, and nothing is stored or sent.
  var canWatch = 'IntersectionObserver' in window, canChange = 'MutationObserver' in window, canMove = !calm && !!document.body.animate;

  // ---- hearts: a small burst from a point on the screen (a message someone loved, a sign-up that went through)
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5C9.2 16.6 3.5 13.9 3.5 8.9 3.5 6.2 5.6 4.3 8 4.3c1.7 0 3.1.9 4 2.4.9-1.5 2.3-2.4 4-2.4 2.4 0 4.5 1.9 4.5 4.6 0 5-5.7 7.7-8.5 11.6z"/></svg>';
  var sky = null, heartColours = ['#FF8C42', '#FF5FA2', '#D11E6E', '#FF8C42'];
  function hearts(x, y, n, wide) {
    if (!canMove) return;
    if (!sky) { sky = document.createElement('div'); sky.className = 'nx-sky'; sky.setAttribute('aria-hidden', 'true'); document.body.appendChild(sky); }
    for (var i = 0; i < n; i++) (function (i) {
      var h = document.createElement('i'), size = 14 + Math.random() * 18;
      h.innerHTML = HEART;
      h.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px;color:' + heartColours[i % heartColours.length];
      sky.appendChild(h);
      var angle = (-90 + (Math.random() - .5) * (wide || 110)) * Math.PI / 180, far = 70 + Math.random() * (wide ? 190 : 90);
      var dx = Math.cos(angle) * far, dy = Math.sin(angle) * far, turn = (Math.random() - .5) * 70;
      var run = h.animate([
        { transform: 'translate(-50%, -50%) scale(.2) rotate(0deg)', opacity: 0 },
        { transform: 'translate(calc(-50% + ' + (dx * .7).toFixed(1) + 'px), calc(-50% + ' + (dy * .7).toFixed(1) + 'px)) scale(1) rotate(' + (turn * .6).toFixed(1) + 'deg)', opacity: 1, offset: .3 },
        { transform: 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + (dy - 26).toFixed(1) + 'px)) scale(.7) rotate(' + turn.toFixed(1) + 'deg)', opacity: 0 }
      ], { duration: 900 + Math.random() * 500, delay: i * 22, easing: 'cubic-bezier(.2, .7, .3, 1)', fill: 'both' });
      run.onfinish = run.oncancel = function () { if (h.parentNode) h.parentNode.removeChild(h); };
    })(i);
  }
  function heartsFrom(el, n, wide) { var r = el.getBoundingClientRect(); hearts(r.left + r.width / 2, r.top + r.height / 2, n, wide); }

  // ---- a heart on the corner of every message, as in any chat. It only shows on your own screen.
  all('.nx-msg').forEach(function (msg) {
    var who = msg.querySelector('.nx-who strong');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'nx-love';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Love this message' + (who ? ' from ' + who.textContent : ''));
    b.innerHTML = HEART;
    msg.appendChild(b);
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (!on) return;
      heartsFrom(b, 7);
      var bubble = msg.querySelector('blockquote, .nx-photo');
      if (bubble && canMove) bubble.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2, 1.2, .4, 1)' });
    });
  });
  // ... and the last line of "Why bother?" answers a press too
  var happy = document.querySelector('.nx-why__last mark');
  if (happy) happy.addEventListener('click', function (e) { hearts(e.clientX, e.clientY, 9); });

  // ---- the messages drift a little apart as the pointer moves over them (a mouse only)
  if (chat && canMove && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var aim = { x: 0, y: 0 }, now = { x: 0, y: 0 }, drifting = 0;
    var drift = function () {
      now.x += (aim.x - now.x) * .09;
      now.y += (aim.y - now.y) * .09;
      chat.style.setProperty('--mx', now.x.toFixed(3));
      chat.style.setProperty('--my', now.y.toFixed(3));
      drifting = Math.abs(aim.x - now.x) + Math.abs(aim.y - now.y) > .002 ? requestAnimationFrame(drift) : 0;
    };
    chat.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = chat.getBoundingClientRect();
      aim.x = (e.clientX - r.left) / r.width * 2 - 1;
      aim.y = (e.clientY - r.top) / r.height * 2 - 1;
      if (!drifting) drifting = requestAnimationFrame(drift);
    });
    chat.addEventListener('pointerleave', function () { aim.x = 0; aim.y = 0; if (!drifting) drifting = requestAnimationFrame(drift); });
  }

  // ---- a number counts up to itself once, when its screen arrives. The line keeps its width while it runs.
  function countUp(el) {
    var m = /^(\d+)(.*)$/.exec(el.textContent);
    if (!m || !canMove) return;
    var to = +m[1], num = document.createElement('span');
    num.className = 'nx-num';
    num.textContent = m[1];
    el.textContent = '';
    el.appendChild(num);
    el.appendChild(document.createTextNode(m[2]));
    num.style.width = num.getBoundingClientRect().width + 'px';
    num.textContent = '0';
    var ended = false;
    var end = function () { ended = true; num.textContent = m[1]; num.style.width = ''; };
    setTimeout(function () {
      var t0 = 0;
      requestAnimationFrame(function tick(t) {
        if (ended) return;
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1100);
        num.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick); else end();
      });
    }, 300);
    setTimeout(end, 2000);   // whatever the browser does with the frames (a tab in the background), the real number is there
  }

  // ---- arriving: what is still below the screen waits there and arrives when it is scrolled to. What is already on
  //      screen when the page opens is left alone (the first screen moves by itself, see next.css).
  function arriveOn(nodes, onGo) {
    if (calm || !canWatch || !nodes.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.remove('nx-wait');
        e.target.classList.add('nx-go');
        if (onGo) onGo(e.target);
      });
    }, { rootMargin: '0px 0px -18% 0px' });
    nodes.forEach(function (n) {
      if (n.getBoundingClientRect().top < window.innerHeight * .92) return;
      n.classList.add('nx-wait');
      io.observe(n);
    });
  }
  arriveOn(all('.nx-view'), function (scene) {
    if (scene === reply) { scene.classList.remove('nx-go'); if (!reply._arrived) arrive(); }
    if (scene.id === 'said') all('.nx-answer strong').forEach(countUp);
  });
  arriveOn(all('.nx .prose > h2'));

  // ---- "today" on the timeline keeps a quiet pulse, only while that screen is in view
  var how = document.getElementById('how');
  if (how && canWatch && !calm) new IntersectionObserver(function (es) { how.classList.toggle('is-live', es[0].isIntersecting); }, { threshold: .3 }).observe(how);

  // ---- the first screen: if nobody has pressed anything after a few seconds, the three arrows nudge, one after the other
  var askBars = all('.nx-ask .nx-bar');
  if (askBars.length && canMove) {
    var nudges = 0, nudgeTimer = 0;
    var stopNudge = function () { nudges = 9; clearTimeout(nudgeTimer); };
    var nudge = function () {
      if (nudges >= 3 || doc.hasAttribute('data-answer') || window.scrollY > 40) return;
      nudges++;
      askBars.forEach(function (b, i) {
        var arrow = b.querySelector('svg');
        if (arrow) arrow.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 620, delay: i * 130, easing: 'cubic-bezier(.3, 0, .2, 1)' });
      });
      nudgeTimer = setTimeout(nudge, 5200);
    };
    nudgeTimer = setTimeout(nudge, 3600);
    ['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, stopNudge, { once: true, passive: true }); });
    askBars.forEach(function (b) { b.addEventListener('pointerenter', stopNudge, { once: true }); });
  }

  // ---- forms: an answer you pick gives a little under the finger; the next step slides in from the side you are going to
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!canMove || !t || !t.matches || !t.matches('input[type="radio"], input[type="checkbox"]') || !t.checked) return;
    var face = t.closest('.am-chip') ? t.nextElementSibling : t.closest('.am-option');
    if (face) face.animate([{ transform: 'scale(.95)' }, { transform: 'scale(1.03)', offset: .55 }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.2, .9, .3, 1)' });
    if (face && t.name === 'keepIn' && t.value === 'yes') heartsFrom(face, 7);   // a yes to staying in gets a few hearts
  });
  var amForm = document.getElementById('amForm'), amSteps = all('.am-step');
  function activeStep() { var at = -1; amSteps.forEach(function (s, i) { if (s.classList.contains('is-active')) at = i; }); return at; }

  // ---- sign-up, from step 2 on: another page look and a side menu of the steps (next.css, "SIGN-UP, FROM STEP 2 ON").
  //      The body carries .nx-later while a step after the first is showing, and after "Count me in".
  var way = all('.nx-way ol > li');   // the steps only: the dates under them are list items too, without a button
  function syncWay() {
    var box = document.getElementById('amDone'), sent = !!(box && !box.hidden), at = activeStep();
    document.body.classList.toggle('nx-later', at > 0 || sent);
    document.body.classList.toggle('nx-sent', sent);
    way.forEach(function (li, i) {
      var b = li.querySelector('button');
      li.setAttribute('data-state', sent || i < at ? 'done' : (i === at ? 'now' : 'next'));
      b.disabled = sent || i >= at;   // only a step you have been through takes you back
      if (i === at && !sent) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }
  way.forEach(function (li, i) {
    li.querySelector('button').addEventListener('click', function () {
      var back = document.getElementById('amBack');
      for (var n = activeStep() - i; back && n > 0; n--) back.click();   // the form's own Back, as many times as it takes
    });
  });
  if (amForm && amSteps.length) {
    var lastStep = activeStep();
    syncWay();
    if (canChange) new MutationObserver(function () {
      var at = activeStep();
      if (at < 0 || at === lastStep) return;
      var from = at > lastStep ? 30 : -30;
      lastStep = at;
      syncWay();
      // The form scrolls its card to the top of the screen on every step, and works that place out before the page changes
      // its look (the title band comes and goes between step 1 and the rest), so it lands in the wrong spot. On a
      // computer every step starts at the top of the page, so go there. A phone keeps the form's own scrolling.
      if (window.matchMedia('(min-width: 901px)').matches) window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
      if (canMove) amSteps[at].animate([{ opacity: 0, transform: 'translateX(' + from + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    }).observe(amForm, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  // ---- hearts when something went through: "You're in!" after the sign-up form, and the two small forms
  var amDone = document.getElementById('amDone');
  if (amDone && canChange) new MutationObserver(function () {
    var ok = document.getElementById('amDoneOk');
    syncWay();
    if (amDone.hidden) { amDone._cheered = false; return; }
    if (amDone._cheered || !ok || ok.hidden) return;
    amDone._cheered = true;
    setTimeout(function () { heartsFrom(document.getElementById('amDoneTitle') || amDone, 22, 320); }, 450);   // after the page has scrolled to it
  }).observe(amDone, { attributes: true, attributeFilter: ['hidden'] });
  if (canChange) all('.js-waitlist, .js-citylist').forEach(function (w) {
    new MutationObserver(function () {
      if (!w.classList.contains('is-done') || w._cheered) return;
      w._cheered = true;
      heartsFrom(w.querySelector('.nx-form__done, .am-wait__done') || w, 14, 200);
    }).observe(w, { attributes: true, attributeFilter: ['class'] });
  });
})();
