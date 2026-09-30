/* Awesome Meets homepage: the moving hero, the try-it app, scroll effects.
   The try-it app is a preview only. Nothing a visitor taps in it is saved or sent anywhere,
   and the data page says so: keep it that way.
   The marketers on the cards are made-up examples (a role and an industry, never a name). */
(function () {
  'use strict';
  window.AMHome = true;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function pickOne(list, not) {
    var pool = list.filter(function (x) { return x !== not; });
    if (!pool.length) pool = list;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---- scroll progress
  var fill = $('#scrollFill');
  if (fill) {
    var ticking = false;
    var paint = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0) + ')';
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  // ---- things that arrive as you scroll
  var watched = $$('.reveal, .watch');
  if (reduce || !('IntersectionObserver' in window)) {
    watched.forEach(function (n) { n.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    watched.forEach(function (n) { io.observe(n); });
  }

  // ---- two cards, a heart and an invitation
  function fillCard(card, p, shared) {
    $('.pcard__role', card).textContent = p.role;
    $('.pcard__where', card).textContent = p.where;
    var ul = $('.pcard__tags', card);
    ul.textContent = '';
    p.topics.forEach(function (t) { ul.appendChild(el('li', t === shared ? 'is-shared' : '', t)); });
  }
  function fillTicket(root, what, when) {
    $('.ticket__what', root).textContent = what;
    $('.ticket__when', root).textContent = when;
  }
  // Fade out, swap the words, start apart, come together.
  function meet(root, update, then) {
    if (reduce) { update(); root.classList.remove('is-apart', 'is-leaving'); return; }
    root.classList.add('is-leaving');
    setTimeout(function () {
      update();
      root.classList.add('no-anim', 'is-apart');
      root.classList.remove('is-leaving');
      void root.offsetWidth;
      root.classList.remove('no-anim');
      // a timer, not requestAnimationFrame: it also fires when the tab is in the background
      setTimeout(function () { root.classList.remove('is-apart'); if (then) then(); }, 40);
    }, 380);
  }

  var stage = $('#stage');
  if (stage) {
    var PAIRS = [
      { shared: 'Positioning and messaging', what: 'Lunch', when: 'Hakaniemi · Tuesday at 12PM',
        a: { role: 'Brand lead', where: 'Consumer brands', topics: ['Positioning and messaging', 'Brand'] },
        b: { role: 'Freelance copywriter', where: 'Freelance', topics: ['Positioning and messaging', 'Copywriting'] } },
      { shared: 'Using AI in marketing', what: 'Walk and talk', when: 'Kalasatama · Thursday at 5PM',
        a: { role: 'Marketing team of one', where: 'B2B SaaS', topics: ['Using AI in marketing', 'SEO'] },
        b: { role: 'Head of growth', where: 'Gaming', topics: ['Using AI in marketing', 'Growth experiments'] } },
      { shared: 'Building a personal brand on LinkedIn', what: 'After-work coffee', when: 'Pasila · Wednesday at 4PM',
        a: { role: 'Marketing student', where: 'Student or intern', topics: ['Building a personal brand on LinkedIn', 'Content marketing'] },
        b: { role: 'CMO', where: 'Finance and insurance', topics: ['Building a personal brand on LinkedIn', 'Leading a marketing team'] } },
      { shared: 'Analytics and attribution', what: 'Lunch', when: 'Ruoholahti and Jätkäsaari · Friday at 11AM',
        a: { role: 'Performance marketer', where: 'E-commerce and retail', topics: ['Analytics and attribution', 'Google Ads'] },
        b: { role: 'Product marketing manager', where: 'B2B SaaS', topics: ['Analytics and attribution', 'Product marketing'] } }
    ];
    var at = 0, timer = null, inView = true;
    var show = function (i) {
      at = (i + PAIRS.length) % PAIRS.length;
      var p = PAIRS[at];
      meet(stage, function () {
        fillCard($('.pcard--a', stage), p.a, p.shared);
        fillCard($('.pcard--b', stage), p.b, p.shared);
        fillTicket(stage, p.what, p.when);
      });
    };
    var schedule = function () {
      clearTimeout(timer);
      if (reduce || !inView || document.hidden) return;
      timer = setTimeout(function () { show(at + 1); schedule(); }, 5400);
    };
    stage.addEventListener('click', function () { show(at + 1); schedule(); });
    var more = $('#stageMore');
    if (more) more.addEventListener('click', function () { show(at + 1); schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; schedule(); }, { threshold: 0.2 }).observe(stage);
    }
    if (!reduce) {
      stage.classList.add('no-anim', 'is-apart');
      void stage.offsetWidth;
      stage.classList.remove('no-anim');
      setTimeout(function () { stage.classList.remove('is-apart'); }, 300);
    }
    schedule();

    // the cards lean away from the pointer, the bubbles drift with it
    var hero = stage.closest('.hero');
    if (hero && fine && !reduce) {
      var raf = 0, px = 0, py = 0;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        px = ((e.clientX - r.left) / r.width - 0.5) * 2;
        py = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; stage.style.setProperty('--px', px.toFixed(3)); stage.style.setProperty('--py', py.toFixed(3)); });
      });
      hero.addEventListener('pointerleave', function () { stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); });
    }
  }

  // ---- try it: build your card, see an example match
  var app = $('#app');
  if (app) {
    var TOPICS = ['SEO', 'AEO and AI search', 'LinkedIn Ads', 'Content marketing', 'Community building', 'Events and webinars', 'Brand', 'Positioning and messaging', 'Copywriting', 'Product marketing', 'Using AI in marketing', 'Analytics and attribution', 'Being a marketing team of one', 'Leading a marketing team', 'Job hunting in marketing', 'Freelancing and pricing', 'Expat life and careers in Finland 🔒', 'Avoiding burnout 🔒'];
    var AREAS = ['Helsinki center', 'Ruoholahti and Jätkäsaari', 'Espoo Keilaniemi', 'Vantaa Tikkurila', 'Pasila', 'Hakaniemi', 'Sörnäinen', 'Kalasatama'];
    var SHORT = { 'Have lunch': 'Lunch', 'After-work coffee': 'After-work coffee', 'Walk and talk': 'Walk and talk' };
    var PERSONAS = [
      { role: 'Brand lead', where: 'Consumer brands', topics: ['Brand', 'Positioning and messaging', 'Influencer and creator marketing', 'Organic social'] },
      { role: 'Freelance copywriter', where: 'Freelance', topics: ['Copywriting', 'Freelancing and pricing', 'Content marketing', 'Positioning and messaging'] },
      { role: 'Head of growth', where: 'Gaming', topics: ['Growth experiments', 'Analytics and attribution', 'Meta and TikTok Ads', 'Using AI in marketing'] },
      { role: 'Product marketing manager', where: 'B2B SaaS', topics: ['Product marketing', 'Customer marketing and advocacy', 'Market and customer research', 'Positioning and messaging'] },
      { role: 'Content marketer', where: 'Media and entertainment', topics: ['Content marketing', 'SEO', 'Video and podcasts', 'AEO and AI search'] },
      { role: 'Performance marketer', where: 'E-commerce and retail', topics: ['Google Ads', 'Meta and TikTok Ads', 'Landing pages and CRO', 'Analytics and attribution'] },
      { role: 'CMO', where: 'Finance and insurance', topics: ['Leading a marketing team', 'Budgets and reporting to management', 'How to hire good marketing talent', 'Brand'] },
      { role: 'Community manager', where: 'Public sector and non-profit', topics: ['Community building', 'Events and webinars', 'Organic social', 'PR and comms'] }
    ];
    var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    var LUNCH = ['11AM', '12PM', '1PM'], AFTER = ['4PM', '5PM', '6PM'];
    var MAX_TOPICS = 5;

    var state = { acts: [], topics: [], area: '' };
    var step = 1, lastPersona = null;
    var build = $('#appBuild'), result = $('#appResult');
    var steps = $$('.app__step', app), segs = $$('.app__seg', app);
    var count = $('#appCount'), hint = $('#appHint'), back = $('#appBack'), next = $('#appNext');
    var topicBox = $('#appTopics'), areaBox = $('#appAreas'), topicCount = $('#appTopicCount');
    var shown = { myActs: [], myTopics: [], myArea: [] };

    TOPICS.forEach(function (t) { var b = el('button', 'pick', t); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-topic', t); topicBox.appendChild(b); });
    AREAS.forEach(function (a) { var b = el('button', 'pick', a); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-area', a); areaBox.appendChild(b); });

    var row = function (id, list, empty) {
      var box = document.getElementById(id);
      box.textContent = '';
      if (!list.length) box.appendChild(el('span', 'ghost', empty));
      list.forEach(function (t) { box.appendChild(el('span', 'tag' + (shown[id].indexOf(t) < 0 ? ' is-new' : ''), t)); });
      shown[id] = list.slice();
    };
    var paintCard = function () {
      row('myActs', state.acts.map(function (a) { return SHORT[a]; }), 'your pick');
      row('myTopics', state.topics, 'up to 5 topics');
      row('myArea', state.area ? [state.area] : [], 'your area');
    };
    var toggle = function (list, value, on) { var i = list.indexOf(value); if (on && i < 0) list.push(value); if (!on && i > -1) list.splice(i, 1); };

    app.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !app.contains(b)) return;
      var on = b.getAttribute('aria-pressed') !== 'true';
      if (b.hasAttribute('data-act')) {
        b.setAttribute('aria-pressed', String(on));
        toggle(state.acts, b.getAttribute('data-act'), on);
      } else if (b.hasAttribute('data-topic')) {
        if (on && state.topics.length >= MAX_TOPICS) return;
        b.setAttribute('aria-pressed', String(on));
        toggle(state.topics, b.getAttribute('data-topic'), on);
        topicCount.textContent = state.topics.length + ' of ' + MAX_TOPICS + ' picked';
        $$('[data-topic]', topicBox).forEach(function (x) { x.disabled = x.getAttribute('aria-pressed') !== 'true' && state.topics.length >= MAX_TOPICS; });
      } else if (b.hasAttribute('data-area')) {
        $$('[data-area]', areaBox).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        state.area = b.getAttribute('data-area');
      } else return;
      hint.textContent = '';
      paintCard();
    });

    var go = function (n) {
      step = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', Number(s.getAttribute('data-app-step')) === n); });
      segs.forEach(function (s, i) { s.classList.toggle('is-done', i < n); });
      count.textContent = 'Step ' + n + ' of 3';
      back.hidden = n === 1;
      next.textContent = n === 3 ? 'Show me a match' : 'Next';
      hint.textContent = '';
    };
    var missing = function () {
      if (step === 1 && !state.acts.length) return 'Pick at least one to go on.';
      if (step === 2 && !state.topics.length) return 'Pick at least one topic you enjoy talking about.';
      if (step === 3 && !state.area) return 'Pick the area that suits you best.';
      return '';
    };

    var sparks = function () {
      var host = $('.duo', result);
      if (reduce || !host || !host.animate) return;
      var colours = ['#FFD166', '#FF8C42', '#FF5FA2'];
      for (var i = 0; i < 18; i++) {
        var dot = el('i', 'spark');
        dot.style.background = colours[i % 3];
        host.appendChild(dot);
        var angle = Math.random() * Math.PI * 2, far = 70 + Math.random() * 100;
        var x = Math.cos(angle) * far, y = Math.sin(angle) * far - 30;
        var fly = dot.animate([
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: 'translate(calc(-50% + ' + x.toFixed(0) + 'px), calc(-50% + ' + y.toFixed(0) + 'px)) scale(.3)', opacity: 0 }
        ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2, .8, .2, 1)' });
        fly.onfinish = (function (d) { return function () { d.remove(); }; })(dot);
        setTimeout((function (d) { return function () { d.remove(); }; })(dot), 1700);   // in case the animation never finishes (background tab)
      }
    };

    var match = function () {
      var act = pickOne(state.acts);
      // someone who really would talk about one of your topics, if the examples have one
      var close = PERSONAS.filter(function (p) { return p.topics.some(function (t) { return state.topics.indexOf(t) > -1; }); });
      var persona = pickOne(close.length ? close : PERSONAS, lastPersona);
      lastPersona = persona;
      var both = persona.topics.filter(function (t) { return state.topics.indexOf(t) > -1; });
      var shared = pickOne(both.length ? both : state.topics);
      var extra = shuffle(persona.topics.filter(function (t) { return state.topics.indexOf(t) < 0; })).slice(0, 2);
      var time = pickOne(act === 'Have lunch' ? LUNCH : act === 'After-work coffee' ? AFTER : LUNCH.concat(AFTER));
      var mine = [shared].concat(state.topics.filter(function (t) { return t !== shared; }));
      meet(result, function () {
        fillCard($('.pcard--a', result), { role: 'You', where: 'A marketer in Helsinki', topics: mine }, shared);
        fillCard($('.pcard--b', result), { role: persona.role, where: persona.where, topics: [shared].concat(extra) }, shared);
        $('#appShared').textContent = shared;
        fillTicket(result, SHORT[act], state.area + ' · ' + pickOne(DAYS) + ' at ' + time);
      }, function () { setTimeout(sparks, 750); });
    };

    next.addEventListener('click', function () {
      var m = missing();
      if (m) { hint.textContent = m; return; }
      if (step < 3) { go(step + 1); return; }
      build.hidden = true;
      result.hidden = false;
      match();
      var top = app.getBoundingClientRect().top;
      if (top < 70 || top > window.innerHeight * 0.4) window.scrollTo({ top: window.scrollY + top - 96, behavior: reduce ? 'auto' : 'smooth' });
    });
    back.addEventListener('click', function () { if (step > 1) go(step - 1); });
    $('#appAgain').addEventListener('click', match);
    $('#appReset').addEventListener('click', function () {
      state = { acts: [], topics: [], area: '' };
      $$('[aria-pressed]', app).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.disabled = false; });
      topicCount.textContent = '0 of ' + MAX_TOPICS + ' picked';
      result.hidden = true;
      result.classList.add('is-apart');
      build.hidden = false;
      paintCard();
      go(1);
    });

    paintCard();
    go(1);
  }

  // ---- "Join the waitlist" links land with the cursor in the email box
  $$('a[href="#waitlist"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var input = $('#waitlist input[type="email"]');
      if (input) setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }, reduce ? 50 : 700);
    });
  });
})();
