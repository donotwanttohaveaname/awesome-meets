/* Awesome Meets: the 4-step sign-up form. Only runs while a round is open (see config.js).
   November round (Anna, 6 Oct 2026): no topics and no days or times; a job function, a city (with travel questions
   for people outside the Helsinki region), one-to-one or trio, and what they'd like to do.
   Option values must match R2_OPTIONS in networking-app/awesome-meets-backend.gs letter for letter: the script
   refuses any value it does not know. An option is either 'value' or ['value', 'label shown on the page']. */
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
  var SUBMIT_LABEL = 'Count me in';   // no emoji inside a button

  var steps = [].slice.call(form.querySelectorAll('.am-step'));
  var current = 0;
  var startedAt = AM.loadedAt || Date.now();

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
    if (scroll) form.closest('.am-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function focusFirstError() { var n = steps[current].querySelector('.has-error input, .has-error textarea'); if (n) n.focus(); }
  next.addEventListener('click', function () { if (checks[current + 1]()) show(current + 1, true); else focusFirstError(); });
  back.addEventListener('click', function () { show(current - 1, true); });
  show(0, false);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = document.getElementById('amStatus');
    status.textContent = '';
    if (!checks[4]()) { focusFirstError(); return; }
    var payload = {
      round: (AM.round && AM.round.key) || '',
      website: value('amWebsite'),
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
          if (res.error === 'closed') return fail('Sorry, sign-ups for this round have just closed. Join the waitlist for the next one on the home page.');
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
