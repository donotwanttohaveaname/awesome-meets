/* Awesome Meets: the 4-step sign-up form. Only runs while a round is open (see config.js).
   November round (Anna, 6 Oct 2026): no topics and no days or times; a job function, a city (with travel questions
   for people outside the Helsinki region), one-to-one or trio, and what they'd like to do.
   Option values must match R2_OPTIONS in networking-app/awesome-meets-backend.gs letter for letter: the script
   refuses any value it does not know. An option is either 'value' or ['value', 'label shown on the page'].

   NOTHING WAITS FOR GOOGLE (Anna, 14 Oct 2026: a friend waited about 5 seconds on "Sending…", refreshed the page and
   had to fill everything in again). Google's script takes 2 to 20 seconds to answer. So:
     - the answers are kept in this browser tab as a draft (sessionStorage, never sent anywhere), so a refresh brings
       them back, step included;
     - "You're in!" shows the instant "Count me in" is pressed and the answers save in the background, three tries;
       the small line under it says "Saving…" then "Saved", and only if all three tries fail does it ask to try again;
     - answers that were sent but not yet confirmed saved are sent again after a refresh (safe: the script ignores a
       repeat sign-up from the same email for 10 minutes). */
(function () {
  var AM = window.AM || {};
  var form = document.getElementById('amForm');
  if (!form || !AM.state || AM.state() !== 'open') return;

  var ENDPOINT = AM.endpoint;
  var HELSINKI = 'Helsinki region', TAMPERE = 'Tampere', OTHER = 'Other';
  var OPTIONS = {
    jobFunction: ['Founder / CEO', 'Marketing', 'Sales and business development', 'Product', 'Customer success and support', 'Communications and PR', 'HR and people', 'Design and creative', 'Engineering and IT', 'Data and analytics', 'Operations', 'Finance', 'Consulting', 'Other'],
    industry: ['B2B SaaS', 'B2B services', 'E-commerce and retail', 'Consumer brands', 'Finance and insurance', 'Health', 'Public sector and non-profit', 'Media and entertainment', 'Gaming', 'Industrial and manufacturing', 'Travel and hospitality', 'Agency', 'Other'],
    seniority: ['Junior', 'Mid', 'Senior', 'Lead', 'Head of / Director', 'C-level / VP', 'Founder'],
    city: [[HELSINKI, 'Helsinki region (Helsinki, Espoo, Vantaa)'], 'Tampere', 'Turku', 'Oulu', 'Jyväskylä', 'Kuopio', 'Lahti', 'Pori', 'Joensuu', 'Lappeenranta', 'Vaasa', [OTHER, 'Somewhere else']],
    areas: ['Helsinki center', 'Ruoholahti and Jätkäsaari', 'Espoo Keilaniemi', 'Vantaa Tikkurila', 'Pasila', 'Hakaniemi', 'Sörnäinen', 'Kalasatama'],
    travelHelsinki: ['Yes', 'No'],
    travelTampere: ['Yes', 'No'],
    format: [['One-to-one', 'One-to-one: one person, just the two of you'], ['In a trio', 'In a trio: two people, three of you together'], 'Either is fine'],
    activities: ['Have lunch', 'After-work coffee', 'Walk and talk'],
    meetingCriteria: [
      'I would prefer to meet people in my industry',
      'I would prefer to meet people outside my industry',
      'I would prefer to meet people in my job function',
      'I would prefer to meet people around my seniority (one level up or down)',
      'No criteria, match me with anyone as long as they\'re awesome'
    ]
  };
  var NO_CRITERIA = 'No criteria, match me with anyone as long as they\'re awesome';
  var OPPOSITES = [['I would prefer to meet people in my industry', 'I would prefer to meet people outside my industry']];

  var steps = [].slice.call(form.querySelectorAll('.am-step'));
  var current = 0;
  var statusEl = document.getElementById('amStatus');

  // ---- the draft in this tab. The consent box and the bot trap are never kept: consent is ticked afresh.
  var ROUND = (AM.round && AM.round.key) || 'round';
  var DRAFT = 'amDraft:' + ROUND, PENDING = 'amPending:' + ROUND;
  var NOT_KEPT = { am_hp: 1, agreeData: 1 };
  function keep(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function kept(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  var draft = kept(DRAFT);
  // When the form was first opened, not when this page loaded: the script treats anything sent within 5 seconds of
  // startedAt as a bot and quietly saves nothing, and a restored form can be sent in under 5 seconds.
  var startedAt = (draft && draft.startedAt) || AM.loadedAt || Date.now();

  [].forEach.call(form.querySelectorAll('[data-options]'), function (box) {
    var name = box.getAttribute('data-options');
    var type = box.getAttribute('data-type');
    OPTIONS[name].forEach(function (option) {
      var value = Array.isArray(option) ? option[0] : option, text = Array.isArray(option) ? option[1] : option;
      var label = document.createElement('label');
      label.className = 'am-option';
      var input = document.createElement('input');
      input.type = type; input.name = name; input.value = value;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + text));
      box.appendChild(label);
    });
  });

  function checked(name) {
    return [].slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; });
  }
  function value(id) { return (document.getElementById(id).value || '').trim(); }
  function q(name) { return form.querySelector('[data-q="' + name + '"]'); }
  function setError(name, bad) { var n = q(name); if (n) n.classList.toggle('has-error', bad); return bad; }

  // The city decides which follow-up questions show: the areas for the Helsinki region; "Which city?" for "Somewhere
  // else"; for everyone outside the Helsinki region the note that their own city isn't guaranteed and "travel to
  // Helsinki?"; "travel to Tampere?" for everyone outside the Helsinki region and Tampere.
  function city() { return checked('city')[0] || ''; }
  function needsHelsinki() { return city() !== '' && city() !== HELSINKI; }
  function needsTampere() { return city() !== '' && city() !== HELSINKI && city() !== TAMPERE; }
  function syncCity() {
    q('areas').hidden = city() !== HELSINKI;
    q('cityNote').hidden = !needsHelsinki();
    q('cityOther').hidden = city() !== OTHER;
    q('travelHelsinki').hidden = !needsHelsinki();
    q('travelTampere').hidden = !needsTampere();
  }

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'city') { syncCity(); setError('city', false); }
    if (t.name && t.type === 'radio') setError(t.name, false);
    if (t.name === 'activities') setError('activities', !checked('activities').length);
    if (t.name === 'areas') setError('areas', !checked('areas').length);
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

  function saveDraft() {
    var fields = {};
    [].forEach.call(form.elements, function (el) {
      if (!el.name || NOT_KEPT[el.name] || el.type === 'button' || el.type === 'submit') return;
      if (el.type === 'checkbox' || el.type === 'radio') { fields[el.name] = fields[el.name] || []; if (el.checked) fields[el.name].push(el.value); }
      else fields[el.name] = el.value;
    });
    keep(DRAFT, { startedAt: startedAt, step: current, fields: fields });
  }
  function restoreDraft() {
    if (!draft || !draft.fields) return 0;
    [].forEach.call(form.elements, function (el) {
      if (!el.name || NOT_KEPT[el.name] || !(el.name in draft.fields) || el.type === 'button' || el.type === 'submit') return;
      var v = draft.fields[el.name];
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = v.indexOf(el.value) > -1;
      else el.value = v;
    });
    syncCity();
    return Math.min(Math.max(0, draft.step | 0), steps.length - 1);
  }
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  var checks = {
    1: function () {
      var bad = false;
      bad = setError('fullName', value('fullName').length < 2) || bad;
      bad = setError('email', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value('email'))) || bad;
      bad = setError('linkedin', !/linkedin\.com\/.+/i.test(value('linkedin'))) || bad;   // required since November (Anna, 6 Oct 2026)
      return !bad;
    },
    2: function () {
      var bad = false;
      bad = setError('jobFunction', !checked('jobFunction').length) || bad;
      bad = setError('industry', !checked('industry').length) || bad;
      bad = setError('seniority', !checked('seniority').length) || bad;
      return !bad;
    },
    3: function () {
      var bad = setError('city', !city());
      bad = setError('areas', city() === HELSINKI && !checked('areas').length) || bad;
      bad = setError('cityOther', city() === OTHER && value('cityOther').length < 2) || bad;
      bad = setError('travelHelsinki', needsHelsinki() && !checked('travelHelsinki').length) || bad;
      bad = setError('travelTampere', needsTampere() && !checked('travelTampere').length) || bad;
      bad = setError('format', !checked('format').length) || bad;
      bad = setError('activities', !checked('activities').length) || bad;
      return !bad;
    },
    4: function () { return !setError('agreeData', !document.getElementById('agreeData').checked); }
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
    statusEl.textContent = '';
    saveDraft();
    if (scroll) form.closest('.am-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // A missing answer can sit above the screen, and focusing a radio button does not scroll on an iPhone, so pressing
  // Next looked like it did nothing (Anna's friend, 14 Oct 2026: "I keep pressing next, it doesn't change anything").
  // So: say it under the buttons and scroll the first missing answer into view.
  function pointAtError() {
    statusEl.textContent = 'One of the answers above still needs you.';
    var bad = steps[current].querySelector('.has-error');
    if (!bad) return;
    bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var field = bad.querySelector('input[type="text"], input[type="email"], input[type="url"], textarea');
    if (field) { try { field.focus({ preventScroll: true }); } catch (e) { field.focus(); } }
  }
  next.addEventListener('click', function () { if (checks[current + 1]()) show(current + 1, true); else pointAtError(); });
  back.addEventListener('click', function () { show(current - 1, true); });

  // Back to where they were after a refresh; if an earlier step is somehow incomplete, start there.
  var startStep = restoreDraft();
  for (var s = 1; s <= startStep; s++) if (!checks[s]()) { startStep = s - 1; break; }
  show(startStep, false);

  // ---- sending
  var done = document.getElementById('amDone'), doneTitle = document.getElementById('amDoneTitle'), doneOk = document.getElementById('amDoneOk');
  var saveState = document.getElementById('amSaveState'), retry = document.getElementById('amRetry');
  var lastPayload = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';
    for (var n = 1; n <= steps.length; n++) {
      if (!checks[n]()) { if (n - 1 !== current) show(n - 1, false); pointAtError(); return; }
    }
    var payload = {
      round: (AM.round && AM.round.key) || '',
      website: value('amHp'),
      startedAt: startedAt,
      fullName: value('fullName'),
      email: value('email'),
      linkedin: value('linkedin'),
      jobFunction: checked('jobFunction')[0],
      jobTitle: value('jobTitle'),
      company: value('company'),
      industry: checked('industry')[0],
      seniority: checked('seniority')[0],
      city: city(),
      cityOther: city() === OTHER ? value('cityOther') : '',
      areas: city() === HELSINKI ? checked('areas') : [],
      travelHelsinki: needsHelsinki() ? checked('travelHelsinki')[0] : '',
      travelTampere: needsTampere() ? checked('travelTampere')[0] : '',
      format: checked('format')[0],
      activities: checked('activities'),
      meetingCriteria: checked('meetingCriteria'),
      feedback: value('feedback'),
      agreeData: true,
      consentVersion: AM.consentVersion
    };
    if (!ENDPOINT) {
      statusEl.style.color = 'var(--gray-700)';
      statusEl.textContent = 'Test mode, nothing was sent: ' + JSON.stringify(payload);
      return;
    }
    keep(PENDING, payload);
    startSaving(payload);
  });

  function startSaving(payload) {
    lastPayload = payload;
    form.hidden = true;
    done.hidden = false;
    doneTitle.textContent = 'You\'re in! 🧡';
    doneOk.hidden = false;
    retry.hidden = true;
    saveState.textContent = 'Saving your answers…';
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    send(payload, 1);
  }
  function saved() {
    keep(PENDING, null);
    keep(DRAFT, null);
    saveState.textContent = 'Your answers are saved.';
  }
  function notSaved() {
    doneTitle.textContent = 'Almost there';
    doneOk.hidden = true;
    saveState.textContent = 'Your answers didn\'t save, so you\'re not in yet. Check your connection and try again, or email ' + (AM.contactEmail || 'anna@awesomemarketers.fi') + '.';
    retry.hidden = false;
  }
  function closed() {
    keep(PENDING, null);
    keep(DRAFT, null);
    doneTitle.textContent = 'Sign-ups have just closed';
    doneOk.hidden = true;
    saveState.textContent = 'Sorry, you just missed this round. Join the waitlist for the next one on the home page.';
  }
  function rejected(error) {
    keep(PENDING, null);
    done.hidden = true;
    form.hidden = false;
    statusEl.style.color = '';
    statusEl.textContent = 'Some answers could not be accepted (' + error + '). Please check them and try again.';
  }
  retry.addEventListener('click', function () { startSaving(kept(PENDING) || lastPayload); });

  // Three tries. Each gives up after 15 seconds; the last one doesn't wait to read Google's reply, which is the part
  // that can hang. keepalive: the request still reaches Google if the page is closed right after "You're in!".
  function send(payload, attempt) {
    var opts = { method: 'POST', body: JSON.stringify(payload), keepalive: true };
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
        if (res.ok) return saved();
        if (res.error === 'server') throw new Error('server');
        if (res.error === 'closed') return closed();
        rejected(res.error);
      })
      .catch(function () {
        clearTimeout(timer);
        if (attempt < 3) setTimeout(function () { send(payload, attempt + 1); }, 1500 * attempt);
        else notSaved();
      });
  }

  // Sent before a refresh but not confirmed saved: send again (the script ignores a repeat within 10 minutes).
  var pending = kept(PENDING);
  if (pending) startSaving(pending);
})();
