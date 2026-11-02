/* Awesome Meets: the November group planner (plan/index.html). Anna, 2 Nov 2026.

   People land here from the "Pick your times" button in their own planner email:
       /plan/?g=<personal link code>
   The page asks the backend for the group ("load"): who they are matched with, what everyone has picked so far, the places
   on offer. The person picks the days and times they're free (at least 4 days and 6 times in total, the seven times
   below and no others) and a place (1 or 2 suggestions, a tap on one already suggested, or "Any place works for me"),
   all in one visit, and saves ("save"). When everyone in the group has saved, the backend sets the earliest time they
   all picked and a place, and emails the whole group. "We've already agreed" ("agreed") and, after that, "Open the
   planner again" ("reopen") are the other two calls. Once a time is set there is no button: they reply all instead. All four go to the same Apps Script web app as the forms (AM.endpoint), never
   to the script's own address (Drive error for anyone signed into several Google accounts).

   NOTHING ON THIS PAGE WAITS FOR GOOGLE (the feedback page's lesson, Anna 1 Oct 2026). The days are drawn at once
   and the group fills in a moment later; after "Save" the thank-you shows at once and the line under it follows the
   saving. While the page is open it asks again every 30 seconds, so the others' picks show up without a reload.

   Check the look without sending anything, on this computer only:
       http://localhost:<port>/plan/?preview=trio   (also: pair, need, set, none, agreed, bad, slow, offline) */
(function () {
  var AM = window.AM || {};
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var token = params.get('g') || '';
  var isLocal = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) > -1;
  var preview = isLocal ? params.get('preview') : '';

  // Same as PLAN_TIMES, PLAN_MIN_DAYS, PLAN_MIN_SLOTS and PLAN_LAST_DAY in the backend (section 10d).
  var TIMES = ['11AM', '12PM', '1PM', '3PM', '4PM', '5PM', '6PM'];
  var LUNCH = 3;   // the first three are lunchtimes: drawn as their own little row on a phone
  var MIN_DAYS = 4, MIN_SLOTS = 6, LAST_DAY = '2026-11-30';
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var states = ['plForm', 'plDone', 'plError'];
  function show(id) {
    states.forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  // Kamppi, 5th floor is "Default", not Anna's suggestion (Anna, 2 Nov 2026). 'Anna' is what the backend sent before that.
  function isDefault(by) { return by === 'default' || by === 'Anna'; }
  function and(list, word) { return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' ' + (word || 'and') + ' ' + list[list.length - 1]; }

  // ---- days: weekdays from tomorrow (Helsinki) to the end of November
  function today() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function addDays(ymd, n) { var d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dayOf(ymd) { return new Date(ymd + 'T12:00:00Z'); }
  function dayLabel(ymd) { var d = dayOf(ymd); return WD[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()].slice(0, 3); }
  var DAYS = [];
  for (var d = addDays(today(), 1); d <= LAST_DAY; d = addDays(d, 1)) { var w = dayOf(d).getUTCDay(); if (w > 0 && w < 6) DAYS.push(d); }

  // ---- talking to the backend (three tries: Google sometimes answers with an error page for a few minutes)
  function call(payload) {
    if (preview) return fake(payload);
    function attempt(n) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 20000);
      return fetch(AM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ planner: payload }), signal: ctrl.signal, keepalive: payload.step !== 'load' })
        .then(function (r) { return r.json(); })
        .finally(function () { clearTimeout(timer); })
        .catch(function (err) {
          if (n >= 3) throw err;
          return new Promise(function (resolve) { setTimeout(resolve, 1500 * n); }).then(function () { return attempt(n + 1); });
        });
    }
    return attempt(1);
  }

  // ---- what the page knows
  var st = null;          // the backend's last answer
  var picked = {};        // my times: { "2026-11-12 5PM": true }
  var dirty = false;      // I changed something since the last load

  // ---- 1. the days, drawn at once
  function drawDays() {
    var box = $('plDays'), week = '';
    box.textContent = '';
    DAYS.forEach(function (day) {
      var monday = addDays(day, 1 - dayOf(day).getUTCDay());
      if (monday !== week) {
        week = monday;
        var friday = addDays(monday, 4), a = dayOf(monday < DAYS[0] ? DAYS[0] : monday), b = dayOf(friday > LAST_DAY ? LAST_DAY : friday);
        box.appendChild(el('p', 'plan-week', a.getUTCDate() === b.getUTCDate() ? b.getUTCDate() + ' ' + MONTHS[b.getUTCMonth()] : a.getUTCDate() + ' to ' + b.getUTCDate() + ' ' + MONTHS[b.getUTCMonth()]));
      }
      var row = el('div', 'am-day plan-day');
      row.appendChild(el('span', 'am-day__label', dayLabel(day)));
      var chips = el('div', 'plan-day__chips');
      [TIMES.slice(0, LUNCH), TIMES.slice(LUNCH)].forEach(function (part) {
        var half = el('div', 'am-chips plan-times');
        part.forEach(function (t) {
          var slot = day + ' ' + t, label = el('label', 'am-chip plan-slot'), input = el('input');
          input.type = 'checkbox'; input.value = slot; input.checked = !!picked[slot];
          input.setAttribute('aria-label', dayLabel(day) + ', ' + t);
          var span = el('span', '', t);
          span.appendChild(el('i', 'plan-dots'));
          label.appendChild(input); label.appendChild(span);
          half.appendChild(label);
        });
        chips.appendChild(half);
      });
      row.appendChild(chips);
      box.appendChild(row);
    });
    count();
  }
  $('plDays').addEventListener('change', function (e) {
    if (!e.target || e.target.type !== 'checkbox') return;
    if (e.target.checked) picked[e.target.value] = true; else delete picked[e.target.value];
    dirty = true;
    count();
  });
  $('plClear').addEventListener('click', function () {
    picked = {};
    dirty = true;
    Array.prototype.forEach.call($('plDays').querySelectorAll('input'), function (i) { i.checked = false; });
    count();
  });

  // The counter and the Save button: Save only unlocks at 4 days and 6 times (Anna, 2 Nov 2026).
  function mySlots() { return Object.keys(picked).filter(function (s) { return DAYS.indexOf(s.split(' ')[0]) > -1; }); }
  function count() {
    var slots = mySlots(), days = {};
    slots.forEach(function (s) { days[s.split(' ')[0]] = 1; });
    var nd = Object.keys(days).length, needD = Math.max(0, MIN_DAYS - nd), needS = Math.max(0, MIN_SLOTS - slots.length);
    var c = $('plCount');
    if (!needD && !needS) {
      c.textContent = slots.length + ' times on ' + nd + ' days';
      c.classList.add('is-ready');
    } else {
      var bits = [];
      if (needD) bits.push(needD + ' more day' + (needD === 1 ? '' : 's'));
      if (needS) bits.push(needS + ' more time' + (needS === 1 ? '' : 's'));
      c.textContent = slots.length ? and(bits) + ' to go' : 'Pick ' + MIN_DAYS + ' days and ' + MIN_SLOTS + ' times';
      c.classList.remove('is-ready');
    }
    $('plSave').disabled = !!(needD || needS);
    $('plSave').textContent = needD || needS ? 'Save' : 'Save my answers';
  }

  // ---- 2. the group, once it arrives
  function others() { return st ? st.people.filter(function (p) { return !p.me; }) : []; }
  function drawGroup() {
    var o = others(), trio = st.size === 3;
    $('plTest').hidden = !st.test;
    $('plTitle').textContent = 'Hi ' + st.me.first + '!';
    var lead = $('plLead');
    lead.textContent = '';
    lead.appendChild(document.createTextNode(trio ? 'Your matches are ' : 'Your match is '));
    o.forEach(function (p, i) {
      if (i) lead.appendChild(document.createTextNode(' and '));
      lead.appendChild(el('strong', '', p.first));
    });
    lead.appendChild(document.createTextNode('. Pick the times you\'re free, and the page finds one that works for ' + (trio ? 'all three of you.' : 'you both.')));
    var box = $('plPeople');
    box.textContent = '';
    o.forEach(function (p) {
      var card = el('div', 'plan-person');
      card.appendChild(el('strong', '', p.name));
      if (p.work) card.appendChild(el('span', '', p.work));
      if (p.linkedin) {
        var a = el('a', '', 'LinkedIn profile');
        a.href = p.linkedin; a.target = '_blank'; a.rel = 'noopener noreferrer';
        card.appendChild(a);
      }
      box.appendChild(card);
    });
    var meta = $('plMeta');
    meta.textContent = (trio ? 'You all picked ' : 'You both picked ') + (st.activity || 'a meetup') + (st.areas ? ', in ' + st.areas : '') + '.';
    meta.hidden = false;
  }

  // the others' picks: a coloured dot on every time they're free, and who has answered
  function drawDots() {
    var o = others(), key = $('plKey');
    key.textContent = '';
    o.forEach(function (p, i) {
      var item = el('span', 'plan-key__item');
      item.appendChild(el('b', 'plan-dot plan-dot--' + i));
      item.appendChild(document.createTextNode(p.first + (p.answered ? ' is free' : ' hasn\'t answered yet')));
      key.appendChild(item);
    });
    var answered = o.filter(function (p) { return p.answered; });
    if (answered.length) {
      var all = el('span', 'plan-key__item');
      all.appendChild(el('b', 'plan-key__all'));
      all.appendChild(document.createTextNode(answered.length === o.length ? 'Works for ' + (o.length > 1 ? 'both of them' : o[0].first) : 'Works for everyone who has answered'));
      key.appendChild(all);
    }
    key.hidden = !o.length;
    Array.prototype.forEach.call($('plDays').querySelectorAll('.plan-slot'), function (label) {
      var slot = label.querySelector('input').value, dots = label.querySelector('.plan-dots'), names = [];
      dots.textContent = '';
      o.forEach(function (p, i) {
        if (p.times.indexOf(slot) < 0) return;
        dots.appendChild(el('b', 'plan-dot plan-dot--' + i));
        names.push(p.first);
      });
      label.title = names.length ? and(names) + (names.length > 1 ? ' are' : ' is') + ' free' : '';
      var answeredN = o.filter(function (p) { return p.answered; }).length;
      label.classList.toggle('is-all', answeredN > 0 && names.length === answeredN);
      label.classList.toggle('is-some', names.length > 0 && names.length < answeredN);
    });
  }

  // ---- places: what's on offer (Kamppi where it applies, then what the others suggested), my own, or any place
  function chosenWorks() { return Array.prototype.map.call($('plOffer').querySelectorAll('input:checked'), function (i) { return i.value; }); }
  function drawPlaces(keep) {
    var works = keep ? chosenWorks() : (st.mine ? st.mine.works : []);
    var box = $('plOffer');
    box.textContent = '';
    st.offer.forEach(function (o) {
      var label = el('label', 'am-option plan-offer'), input = el('input');
      input.type = 'checkbox'; input.value = o.name; input.checked = works.indexOf(o.name) > -1;
      label.appendChild(input);
      var span = el('span', '', o.name);
      span.appendChild(el('small', 'plan-offer__by', isDefault(o.by) ? 'Default' : o.by + '\'s suggestion'));
      label.appendChild(span);
      box.appendChild(label);
    });
    box.hidden = !st.offer.length;
    if (!keep && st.mine) {
      $('plPlace1').value = st.mine.places[0] || '';
      $('plPlace2').value = st.mine.places[1] || '';
      $('plAny').checked = !!st.mine.any;
    }
    var o = others(), hint = $('plWhereHint'), area = st.areas ? ' You ' + (st.size === 3 ? 'all' : 'both') + ' picked ' + st.areas + '.' : '';
    $('plAnyBox').hidden = !!st.needPlace;
    if (st.needPlace) {
      $('plAny').checked = false;
      hint.textContent = and(o.map(function (p) { return p.first; })) + (o.length > 1 ? ' are' : ' is') + ' happy with any place, so it\'s up to you: suggest a spot you like.' + area;
    } else {
      hint.textContent = (st.offer.length ? 'Tap a place that works for you, suggest one or two of your own, or tick "Any place works for me".' : 'Suggest one or two places, or tick "Any place works for me".') + area;
    }
    anyState();
  }
  function anyState() {
    var any = $('plAny').checked;
    ['plPlace1', 'plPlace2'].forEach(function (id) { $(id).disabled = any; });
    Array.prototype.forEach.call($('plOffer').querySelectorAll('input'), function (i) { i.disabled = any; if (any) i.checked = false; });
    $('plNew').classList.toggle('is-off', any);
  }
  $('plAny').addEventListener('change', function () { dirty = true; if (this.checked) { $('plPlace1').value = ''; $('plPlace2').value = ''; } anyState(); $('plPlaceErr').hidden = true; });
  $('plOffer').addEventListener('change', function () { dirty = true; $('plPlaceErr').hidden = true; });
  ['plPlace1', 'plPlace2'].forEach(function (id) { $(id).addEventListener('input', function () { dirty = true; $('plPlaceErr').hidden = true; }); });
  function placeError(text) {
    var e = $('plPlaceErr');
    e.textContent = text;
    e.hidden = false;
    $('plWhere').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // a line above the form when no time fits everyone yet
  function drawNote() {
    var n = $('plNote'), s = st.status;
    if (s.state === 'none') {
      n.textContent = (st.size === 3 ? 'You\'ve all' : 'You\'ve both') + ' answered, but no time fits ' + (st.size === 3 ? 'all three of you' : 'you both') + ' yet. Could you add a few more?' +
        (s.near && s.near.length ? ' Closest: ' + s.near.map(function (x) { return x.when + ' (' + x.who.join(' and ') + ')'; }).join(', ') + '.' : '');
      n.hidden = false;
    } else n.hidden = true;
  }

  function fillMine() {
    picked = {};
    if (st.mine) st.mine.times.forEach(function (s) { picked[s] = true; });
    Array.prototype.forEach.call($('plDays').querySelectorAll('input'), function (i) { i.checked = !!picked[i.value]; });
    count();
  }

  // ---- 3. after saving, or when it's already set
  function outcome() {
    var s = st.status, set = $('plSet'), lead = $('plDoneLead');
    set.hidden = true; set.textContent = '';
    $('plChange').hidden = true; $('plReopen').hidden = true; $('plResend').hidden = true;
    var trio = st.size === 3;
    if (s.state === 'set') {
      $('plDoneTitle').textContent = s.two ? 'It\'s set 🧡' : 'You all decided on a time to meet 🧡';
      lead.textContent = 'I\'ve emailed ' + (trio ? 'all of you' : 'you both') + ' the details.';
      set.appendChild(el('p', '', '🗓️ ')).appendChild(el('strong', '', s.when));
      var place = el('p', '', '📍 ');
      if (s.place) {
        place.appendChild(el('strong', '', s.place));
        place.appendChild(document.createTextNode(' (' + (isDefault(s.by) ? 'the default' : s.by + '\'s suggestion') + ')'));
      } else place.appendChild(document.createTextNode('No place yet: reply all to the email and agree on a spot.'));
      set.appendChild(place);
      set.hidden = false;
      // no "Something came up" button here (Anna, 2 Nov 2026: "lets not have this here"): they reply all to the email instead
    } else if (s.state === 'agreed') {
      $('plDoneTitle').textContent = 'Lovely, you\'ve agreed by email 🧡';
      lead.textContent = (s.by && s.by !== st.me.first ? s.by + ' let me know your group has agreed on a day. ' : '') + 'Enjoy your meetup!';
      $('plReopen').textContent = 'Open the planner again';
      $('plReopen').hidden = false;
    } else if (s.state === 'none') {
      $('plDoneTitle').textContent = 'No time fits everyone yet';
      lead.textContent = (trio ? 'You\'ve all' : 'You\'ve both') + ' answered, but there isn\'t a time that works for ' + (trio ? 'all three of you' : 'you both') + '. Could you add a few more times?' +
        (s.near && s.near.length ? ' Closest: ' + s.near.map(function (x) { return x.when + ' (' + x.who.join(' and ') + ')'; }).join(', ') + '.' : '');
      $('plChange').textContent = 'Add more times';
      $('plChange').hidden = false;
    } else {
      $('plDoneTitle').textContent = 'Your answers are in 🧡';
      lead.textContent = (s.waiting && s.waiting.length ? 'Waiting for ' + and(s.waiting) + '. ' : '') + 'As soon as everyone has answered, I\'ll email ' + (trio ? 'you all' : 'you both') + ' the time and the place.';
      $('plChange').textContent = 'Change my answers';
      $('plChange').hidden = false;
    }
  }
  function toForm() {
    show('plForm');
    drawGroup(); drawDots(); drawPlaces(false); drawNote(); fillMine();
    dirty = false;
  }
  $('plChange').addEventListener('click', toForm);

  // ---- loading, and asking again every 30 seconds while the page is open
  var linkBad = false;
  function badLink() { linkBad = true; show('plError'); }
  function take(res) {
    if (res && res.error === 'bad_link') { badLink(); return false; }
    if (!res || !res.people) return false;
    st = res;
    return true;
  }
  function load(first) {
    return call({ token: token, step: 'load' }).then(function (res) {
      if (!take(res)) return;
      var closed = st.status.state === 'set' || st.status.state === 'agreed';
      if (first) {
        if (closed || (st.mine && st.mine.answered)) { show('plDone'); outcome(); }
        else { drawGroup(); drawDots(); drawPlaces(false); drawNote(); fillMine(); }
        return;
      }
      if (!$('plForm').hidden) {
        if (closed) { show('plDone'); outcome(); return; }
        drawDots(); drawPlaces(true); drawNote();
        if (!dirty) fillMine();
      } else if (!$('plDone').hidden && !saving) outcome();
    }).catch(function () {
      if (first) $('plLead').textContent = 'Your group is taking a moment to load. You can already pick your times.';
    });
  }
  var polls = 0;
  setInterval(function () {
    if (linkBad || !st || document.visibilityState !== 'visible' || polls >= 40) return;
    polls++;
    load(false);
  }, 30000);

  // ---- saving: the thank-you at once, the outcome a moment later
  var saving = false, payload = null;
  function save() {
    var lead = $('plDoneLead');
    saving = true;
    $('plResend').hidden = true; $('plChange').hidden = true; $('plReopen').hidden = true; $('plSet').hidden = true;
    $('plDoneTitle').textContent = 'Your answers are in 🧡';
    lead.textContent = 'Saving your answers…';
    call(payload).then(function (res) {
      saving = false;
      if (res && res.error === 'bad_link') return badLink();
      if (res && res.people) st = res;
      if (res && res.ok) return outcome();
      if (res && res.error === 'need_place') { toForm(); restore(); return placeError(and(others().map(function (p) { return p.first; })) + ' picked "Any place", so please suggest one.'); }
      if (res && res.error === 'already_set') return outcome();
      if (res && res.error === 'place') { toForm(); restore(); return placeError('Suggest a place, tap one, or tick "Any place works for me".'); }
      if (res && res.error === 'times') { toForm(); restore(); $('plCount').textContent = 'Some of those days have passed: please pick at least 4 days and 6 times again.'; return; }
      throw new Error((res && res.error) || 'server');
    }).catch(function () {
      saving = false;
      lead.textContent = 'That didn\'t save. Please try again, or reply to my email instead.';
      $('plResend').hidden = false;
    });
  }
  // after a refusal: put back what the person had picked
  function restore() {
    picked = {};
    payload.times.forEach(function (s) { picked[s] = true; });
    Array.prototype.forEach.call($('plDays').querySelectorAll('input'), function (i) { i.checked = !!picked[i.value]; });
    $('plPlace1').value = payload.places[0] || ''; $('plPlace2').value = payload.places[1] || '';
    $('plAny').checked = payload.any && !st.needPlace;
    Array.prototype.forEach.call($('plOffer').querySelectorAll('input'), function (i) { i.checked = payload.works.indexOf(i.value) > -1; });
    anyState(); count();
  }
  $('plResend').addEventListener('click', save);

  $('plFormEl').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('plSave').disabled) return;
    var places = [$('plPlace1').value.trim(), $('plPlace2').value.trim()].filter(Boolean);
    var any = $('plAny').checked && !$('plAnyBox').hidden, works = any ? [] : chosenWorks();
    if (!any && !places.length && !works.length) {
      return placeError(st && st.needPlace ? 'Please suggest a place: the others are happy with any.' : 'Suggest a place, tap one, or tick "Any place works for me".');
    }
    payload = { token: token, step: 'save', times: mySlots(), places: any ? [] : places, works: works, any: any };
    show('plDone');
    save();
  });

  // ---- "We've already agreed" and "Open the planner again"
  function simple(step, question) {
    if (!window.confirm(question)) return;
    show('plDone');
    $('plDoneTitle').textContent = step === 'agreed' ? 'Thank you 🧡' : 'Opening the planner again…';
    $('plDoneLead').textContent = 'One moment…';
    $('plSet').hidden = true; $('plChange').hidden = true; $('plReopen').hidden = true; $('plResend').hidden = true;
    call({ token: token, step: step }).then(function (res) {
      if (!take(res)) throw new Error('server');
      if (st.status.state === 'set' || st.status.state === 'agreed') outcome(); else toForm();
    }).catch(function () {
      $('plDoneLead').textContent = 'That didn\'t go through. Please try again, or reply to my email instead.';
    });
  }
  $('plAgreed').addEventListener('click', function () {
    simple('agreed', 'Let Anna know your group has already agreed on a day by email? The planner closes for everyone in your group.');
  });
  // only shown after "We've already agreed", so a tap by mistake can be undone
  $('plReopen').addEventListener('click', function () { simple('reopen', 'Open the planner again for your group?'); });

  // ---- made-up groups for checking the look on this computer (never on the live site)
  var fakeSaved = null;
  function fake(p) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (preview === 'offline') return reject(new Error('offline'));
        if (preview === 'bad') return resolve({ ok: false, error: 'bad_link' });
        var trio = preview !== 'pair', d1 = DAYS[0], d2 = DAYS[1], d3 = DAYS[2], d4 = DAYS[3], d5 = DAYS[4];
        var s = {
          ok: true, test: false, size: trio ? 3 : 2, me: { first: 'Olivia', idx: 0 },
          people: [{ first: 'Olivia', name: 'Olivia Bennett', me: true, answered: false, times: [], any: false },
            { first: 'George', name: 'George Hartley', work: 'Growth Lead at Northwind', linkedin: 'https://www.linkedin.com/', answered: true, times: [d1 + ' 5PM', d1 + ' 6PM', d2 + ' 12PM', d3 + ' 5PM', d4 + ' 4PM', d4 + ' 5PM', d5 + ' 11AM'], any: preview === 'need' }]
            .concat(trio ? [{ first: 'Isla', name: 'Isla Morgan', work: 'Content Marketing Manager at Example Oy', linkedin: 'https://www.linkedin.com/', answered: preview !== 'trio', times: preview === 'trio' ? [] : [d1 + ' 5PM', d3 + ' 5PM', d4 + ' 5PM', d4 + ' 6PM', d5 + ' 12PM', d5 + ' 1PM'], any: preview === 'need' }] : []),
          mine: null, activity: 'an after-work coffee', areas: preview === 'need' ? 'Espoo Keilaniemi' : 'Helsinki centre',
          offer: preview === 'need' ? [] : [{ name: 'Kamppi, 5th floor', by: 'default' }].concat(preview === 'trio' ? [] : [{ name: 'Café Regatta', by: 'George' }]),
          defaultPlace: preview === 'need' ? '' : 'Kamppi, 5th floor', needPlace: preview === 'need',
          status: { state: 'open', waiting: trio && preview === 'trio' ? ['Isla'] : [], near: [] }
        };
        if (preview === 'set') s.status = { state: 'set', when: 'Thursday 12 November at 5PM', place: 'Kamppi, 5th floor', by: 'default' };
        if (preview === 'agreed') s.status = { state: 'agreed', by: 'George' };
        if (preview === 'none') s.status = { state: 'none', waiting: [], near: [{ when: dayLabel(d1) + ', 5PM', who: ['George', 'Isla'] }] };
        if (p.step === 'save') {
          fakeSaved = p;
          s.saved = true;
          s.mine = { times: p.times, places: p.places, works: p.works, any: p.any, answered: true };
          s.people[0].answered = true; s.people[0].times = p.times;
          if (preview === 'pair') s.status = { state: 'set', when: 'Thursday 12 November at 5PM', place: p.works[0] || p.places[0] || 'Kamppi, 5th floor', by: p.works[0] ? 'George' : (p.places[0] ? 'Olivia' : 'default') };
        } else if (fakeSaved) s.mine = { times: fakeSaved.times, places: fakeSaved.places, works: fakeSaved.works, any: fakeSaved.any, answered: true };
        if (p.step === 'reopen') s.status = { state: 'open', waiting: ['Olivia'], near: [] };
        if (p.step === 'agreed') s.status = { state: 'agreed', by: 'Olivia' };
        resolve(s);
      }, preview === 'slow' ? 6000 : 900);
    });
  }

  if (!preview && (!token || !AM.endpoint)) return badLink();
  show('plForm');
  drawDays();
  load(true);
})();
