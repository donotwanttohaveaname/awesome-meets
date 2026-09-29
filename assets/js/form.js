/* Awesome Meets: the 5-step sign-up form. Only runs while a round is open (see config.js).
   Option lists must match OPTIONS in networking-app/awesome-meets-backend.gs letter for letter:
   the script refuses any value it does not know. */
(function () {
  var AM = window.AM || {};
  var form = document.getElementById('amForm');
  if (!form || !AM.state || AM.state() !== 'open') return;

  var ENDPOINT = AM.endpoint;
  var OPTIONS = {
    employmentType: ['In-house', 'Agency', 'Freelance', 'Student or intern', 'Between jobs'],
    industry: ['B2B SaaS', 'B2B services', 'E-commerce and retail', 'Consumer brands', 'Finance and insurance', 'Health', 'Public sector and non-profit', 'Media and entertainment', 'Gaming', 'Industrial and manufacturing', 'Travel and hospitality', 'Agency', 'Other'],
    seniority: ['Junior', 'Mid', 'Senior', 'Lead', 'Head of / Director', 'CMO / VP', 'Founder'],
    activities: ['Have lunch', 'After-work coffee', 'Walk and talk'],
    matchCount: ['1 marketer', '2 marketers'],
    preferredArea: ['Helsinki center', 'Ruoholahti and Jätkäsaari', 'Espoo Keilaniemi', 'Vantaa Tikkurila', 'Pasila', 'Hakaniemi', 'Sörnäinen', 'Kalasatama'],
    areas: ['Helsinki center', 'Ruoholahti and Jätkäsaari', 'Espoo Keilaniemi', 'Vantaa Tikkurila', 'Pasila', 'Hakaniemi', 'Sörnäinen', 'Kalasatama'],
    meetingCriteria: [
      'I would prefer to meet people in my industry',
      'I would prefer to meet people outside my industry',
      'I would prefer to meet people around my seniority (one level up or down)',
      'Similar topics are the most important criteria for my choice of match',
      'No criteria, match me with anyone as long as they\'re awesome'
    ]
  };
  var TOPICS = [
    ['Channels', ['SEO', 'AEO and AI search', 'LinkedIn Ads', 'Google Ads', 'Meta and TikTok Ads', 'Organic social', 'Content marketing', 'Email and CRM', 'Video and podcasts', 'Influencer and creator marketing', 'PR and comms', 'Events and webinars', 'ABM', 'Community building']],
    ['Strategy and craft', ['Brand', 'Positioning and messaging', 'Copywriting', 'Product marketing', 'Customer marketing and advocacy', 'Landing pages and CRO', 'Growth experiments', 'Market and customer research', 'Analytics and attribution', 'Marketing automation and ops', 'Using AI in marketing']],
    ['Career and leadership', ['Leading a marketing team', 'Being a marketing team of one', 'How to hire good marketing talent', 'Building a personal brand on LinkedIn', 'Job hunting in marketing', 'Changing careers', 'Freelancing and pricing', 'Budgets and reporting to management', 'Women in marketing careers 🔒', 'LGBTQ+ at work 🔒', 'Expat life and careers in Finland 🔒', 'Coming back from parental leave 🔒', 'Avoiding burnout 🔒']]
  ];
  var WEEKS = (AM.round && AM.round.weeks) || [];
  var TIMES = ['11AM', '12PM', '1PM', '4PM', '5PM', '6PM'];
  var NOT_THIS_DAY = 'Not this day';
  var LUNCH = ['11AM', '12PM', '1PM'], AFTER = ['4PM', '5PM', '6PM'];
  var MIN_DAYS = 4;
  var MAX_TOPICS = 5, NO_CRITERIA = 'No criteria, match me with anyone as long as they\'re awesome';
  var OPPOSITES = [['I would prefer to meet people in my industry', 'I would prefer to meet people outside my industry']];
  var SUBMIT_LABEL = 'Count me in';   // no emoji inside a button

  var steps = [].slice.call(form.querySelectorAll('.am-step'));
  var current = 0;
  var startedAt = AM.loadedAt || Date.now();

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  }
  function chip(name, value, label, extraClass) {
    var l = el('label', { 'class': 'am-chip' + (extraClass ? ' ' + extraClass : '') });
    l.appendChild(el('input', { type: 'checkbox', name: name, value: value }));
    l.appendChild(el('span', {}, label || value));
    return l;
  }

  [].forEach.call(form.querySelectorAll('[data-options]'), function (box) {
    var name = box.getAttribute('data-options');
    var type = box.getAttribute('data-type');
    OPTIONS[name].forEach(function (value) {
      var label = el('label', { 'class': 'am-option' });
      label.appendChild(el('input', { type: type, name: name, value: value }));
      label.appendChild(document.createTextNode(' ' + value));
      box.appendChild(label);
    });
  });

  [].forEach.call(form.querySelectorAll('[data-topics]'), function (box) {
    var name = box.getAttribute('data-topics');
    TOPICS.forEach(function (group) {
      box.appendChild(el('p', { 'class': 'am-group-title' }, group[0]));
      var chips = el('div', { 'class': 'am-chips' });
      group[1].forEach(function (topic) { chips.appendChild(chip(name, topic)); });
      box.appendChild(chips);
    });
  });

  var days = document.getElementById('amDays');
  WEEKS.forEach(function (week) {
    var w = el('div', { 'class': 'am-week' });
    w.appendChild(el('p', { 'class': 'am-group-title' }, week[0]));
    week[1].forEach(function (day) {
      var row = el('div', { 'class': 'am-day', 'data-day': day[0] });
      row.appendChild(el('span', { 'class': 'am-day__label' }, day[1]));
      var chips = el('div', { 'class': 'am-chips' });
      TIMES.forEach(function (t) { chips.appendChild(chip('day:' + day[0], t)); });
      chips.appendChild(chip('day:' + day[0], NOT_THIS_DAY, NOT_THIS_DAY, 'am-chip--no'));
      row.appendChild(chips);
      w.appendChild(row);
    });
    days.appendChild(w);
  });

  function checked(name) {
    return [].slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; });
  }
  function value(id) { return (document.getElementById(id).value || '').trim(); }
  // A day counts when at least one real time is ticked ("Not this day" doesn't count).
  function daysPicked() {
    var n = 0;
    WEEKS.forEach(function (week) { week[1].forEach(function (day) { if (checked('day:' + day[0]).some(function (v) { return v !== NOT_THIS_DAY; })) n++; }); });
    return n;
  }
  function syncDays() {
    var n = daysPicked(), counter = document.getElementById('amDayCount');
    counter.textContent = n >= MIN_DAYS ? n + ' days picked ✓' : n + ' of ' + MIN_DAYS + ' days picked';
    if (n >= MIN_DAYS) setError('availability', false);
  }

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'topics') {
      var picked = checked('topics').length;
      form.querySelector('[data-counter="topics"]').textContent = picked + ' of ' + MAX_TOPICS + ' picked';
      [].forEach.call(form.querySelectorAll('input[name="topics"]'), function (i) { i.disabled = !i.checked && picked >= MAX_TOPICS; });
    }
    if (t.name && t.name.indexOf('day:') === 0 && t.checked) {
      [].forEach.call(form.querySelectorAll('input[name="' + t.name + '"]'), function (i) {
        if (t.value === NOT_THIS_DAY ? i !== t : i.value === NOT_THIS_DAY) i.checked = false;
      });
    }
    if (t.name && t.name.indexOf('day:') === 0) syncDays();
    if (t.name === 'preferredArea' && t.checked) {
      var match = [].slice.call(form.querySelectorAll('input[name="areas"]')).filter(function (i) { return i.value === t.value; })[0];
      if (match) match.checked = true;
      setError('areas', false);
    }
    if (t.name === 'meetingCriteria' && t.checked) {
      var boxes = [].slice.call(form.querySelectorAll('input[name="meetingCriteria"]'));
      if (t.value === NO_CRITERIA) boxes.forEach(function (b) { if (b !== t) b.checked = false; });
      else boxes.forEach(function (b) { if (b.value === NO_CRITERIA) b.checked = false; });
      OPPOSITES.forEach(function (pair) {
        var i = pair.indexOf(t.value);
        if (i > -1) boxes.forEach(function (b) { if (b.value === pair[1 - i]) b.checked = false; });
      });
    }
  });

  [].forEach.call(form.querySelectorAll('[data-fill]'), function (b) {
    b.addEventListener('click', function () {
      var mode = b.getAttribute('data-fill');
      [].forEach.call(days.querySelectorAll('input'), function (i) {
        if (mode === 'clear') i.checked = false;
        else if ((mode === 'lunch' ? LUNCH : AFTER).indexOf(i.value) > -1) i.checked = true;
        else if (i.value === NOT_THIS_DAY) i.checked = false;
      });
      syncDays();
    });
  });

  function setError(q, bad) { var n = form.querySelector('[data-q="' + q + '"]'); if (n) n.classList.toggle('has-error', bad); return bad; }
  var checks = {
    1: function () {
      var bad = false;
      bad = setError('fullName', value('fullName').length < 2) || bad;
      bad = setError('email', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value('email'))) || bad;
      bad = setError('linkedin', value('linkedin') !== '' && !/linkedin\.com\/.+/i.test(value('linkedin'))) || bad;
      return !bad;
    },
    2: function () {
      var bad = false;
      bad = setError('employmentType', !checked('employmentType').length) || bad;
      bad = setError('industry', !checked('industry').length) || bad;
      bad = setError('seniority', !checked('seniority').length) || bad;
      return !bad;
    },
    3: function () { return !setError('topics', !checked('topics').length); },
    4: function () {
      var bad = setError('matchCount', !checked('matchCount').length);
      bad = setError('activities', !checked('activities').length) || bad;
      bad = setError('preferredArea', !checked('preferredArea').length) || bad;
      bad = setError('areas', !checked('areas').length) || bad;
      bad = setError('availability', daysPicked() < MIN_DAYS) || bad;
      return !bad;
    },
    5: function () { return !setError('agreeData', !document.getElementById('agreeData').checked); }
  };

  var back = document.getElementById('amBack'), next = document.getElementById('amNext'), submit = document.getElementById('amSubmit');
  function show(i, scroll) {
    steps[current].classList.remove('is-active');
    current = i;
    steps[current].classList.add('is-active');
    back.hidden = current === 0;
    next.hidden = current === steps.length - 1;
    submit.hidden = current !== steps.length - 1;
    document.getElementById('amProgress').style.width = ((current + 1) / steps.length * 100) + '%';
    document.getElementById('amProgressLabel').textContent = 'Step ' + (current + 1) + ' of ' + steps.length;
    if (scroll) form.closest('.am-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function focusFirstError() { var q = steps[current].querySelector('.has-error input, .has-error textarea'); if (q) q.focus(); }
  next.addEventListener('click', function () { if (checks[current + 1]()) show(current + 1, true); else focusFirstError(); });
  back.addEventListener('click', function () { show(current - 1, true); });
  show(0, false);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = document.getElementById('amStatus');
    status.textContent = '';
    if (!checks[5]()) { focusFirstError(); return; }
    var availability = {};
    WEEKS.forEach(function (week) {
      week[1].forEach(function (day) {
        var picked = checked('day:' + day[0]);
        if (picked.length) availability[day[0]] = picked;
      });
    });
    var payload = {
      website: value('amWebsite'),
      startedAt: startedAt,
      fullName: value('fullName'),
      email: value('email'),
      linkedin: value('linkedin'),
      employmentType: checked('employmentType')[0],
      jobTitle: value('jobTitle'),
      company: value('company'),
      industry: checked('industry')[0],
      seniority: checked('seniority')[0],
      topics: checked('topics'),
      preferredArea: checked('preferredArea')[0],
      areas: checked('areas'),
      activities: checked('activities'),
      matchCount: checked('matchCount')[0],
      availability: availability,
      noneOfTheseDays: false,
      meetingCriteria: checked('meetingCriteria'),
      feedback: value('feedback'),
      agreeData: true,
      consentVersion: AM.consentVersion
    };
    if (!ENDPOINT) {
      status.style.color = 'var(--gray-700)';
      status.textContent = 'Test mode, nothing was sent: ' + JSON.stringify(payload);
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Sending…';
    // Retrying is safe: the script ignores a repeat sign-up from the same email for 10 minutes.
    // Each try gives up after 15 seconds. The last try doesn't wait to read Google's reply, which is the part that can hang.
    function send(attempt) {
      var opts = { method: 'POST', body: JSON.stringify(payload) };
      var timer = null;
      if (window.AbortController) {
        var ctrl = new AbortController();
        opts.signal = ctrl.signal;
        timer = setTimeout(function () { ctrl.abort(); }, 15000);
      }
      if (attempt === 3) opts.mode = 'no-cors';
      fetch(ENDPOINT, opts)
        .then(function (r) { return attempt === 3 ? { ok: true } : r.json(); })
        .then(function (res) {
          clearTimeout(timer);
          if (res.ok) {
            form.hidden = true;
            document.getElementById('amDone').hidden = false;
            document.getElementById('amDone').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
          if (res.error === 'server') throw new Error('server');
          fail('Some answers could not be accepted (' + res.error + '). Please check them and try again.');
        })
        .catch(function () {
          clearTimeout(timer);
          if (attempt < 3) setTimeout(function () { send(attempt + 1); }, 1500 * attempt);
          else fail('Something went wrong and your answers may not have been saved. Please try again, or email ' + (AM.contactEmail || 'anna@awesomemarketers.fi') + '.');
        });
    }
    function fail(message) {
      submit.disabled = false;
      submit.textContent = SUBMIT_LABEL;
      status.style.color = '';
      status.textContent = message;
    }
    send(1);
  });
})();
