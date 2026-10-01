/* Awesome Meets: the feedback page (feedback/index.html).

   People land here from one of the four buttons in the "how did it go?" email:
       /feedback/?fb=<personal link code>&a=<great | fine | no | none>
   1. On arrival the page tells the backend which button was clicked ("click"). The backend saves that
      answer straight away and returns the person's first name plus the name, job and company to prefill.
   2. The form sends the rest ("form").
   Both go to the same Apps Script web app as the sign-up forms (AM.endpoint in config.js), as a
   background request. Never link people to the script's own address: it shows a Google Drive error
   to anyone signed into several Google accounts.

   NOTHING ON THIS PAGE WAITS FOR GOOGLE (Anna, 1 Oct 2026, on the first version: "after i clicked send
   it's way toooooo long to load the thank you page"). Google's script takes 2 to 20 seconds to answer.
   So the form shows at once and the name arrives a moment later, and the thank-you shows the instant
   "Send feedback" is clicked while the answers are saved in the background. Only if saving fails after
   three tries does the thank-you page say so and offer "Try again".

   Check the look without sending anything, on this computer only:
       http://localhost:<port>/feedback/?preview=form   (also: none, slow, bad, offline) */
(function () {
  var AM = window.AM || {};
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var token = params.get('fb') || '';
  var quick = params.get('a') || '';

  var isLocal = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) > -1;
  var preview = isLocal ? params.get('preview') : '';
  if (preview === 'none') quick = 'none';

  var states = ['fbForm', 'fbDone', 'fbError'];
  function show(id) {
    states.forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }

  // ---- talking to the backend
  function call(payload) {
    if (preview) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (preview === 'offline') return reject(new Error('offline'));
          if (preview === 'bad') return resolve({ ok: false, error: 'bad_link' });
          if (payload.step === 'form') return resolve({ ok: true });
          var none = preview === 'none';
          resolve({ ok: true, firstName: 'Olivia', other: 'George', name: 'Olivia Bennett', jobTitle: 'Brand Manager', company: 'Example Oy',
            quick: none ? '❌ It didn\'t happen' : '🧡 Great', didNotHappen: none });
        }, preview === 'slow' ? 6000 : 1200);
      });
    }
    // Google's script sometimes answers with an error page instead of data (seen for a few minutes after the
    // script was republished on 1 Oct 2026). Saving an answer twice is harmless (same row), so try up to three times.
    // keepalive: the request finishes even if the person closes the page right after the thank-you.
    function attempt(n) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 20000);
      return fetch(AM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ feedback: payload }), signal: ctrl.signal, keepalive: true })
        .then(function (r) { return r.json(); })
        .finally(function () { clearTimeout(timer); })
        .catch(function (err) {
          if (n >= 3) throw err;
          return new Promise(function (resolve) { setTimeout(resolve, 1500 * n); }).then(function () { return attempt(n + 1); });
        });
    }
    return attempt(1);
  }

  // ---- the link is wrong
  var linkBad = false;
  function badLink() {
    linkBad = true;
    show('fbError');
  }

  // ---- the 0 to 10 buttons
  var nps = $('fbNps');
  for (var i = 0; i <= 10; i++) {
    var label = document.createElement('label');
    label.className = 'am-chip';
    label.innerHTML = '<input type="radio" name="nps" value="' + i + '"><span>' + i + '</span>';
    nps.appendChild(label);
  }

  // ---- "share publicly" opens the name, job and company fields
  $('fbShare').addEventListener('change', function () { $('fbPub').hidden = !this.checked; });

  // ---- 1. arriving: the form shows at once, the click is recorded in the background
  var firstName = '';
  var didNotHappen = quick === 'none';
  function thanks() { return 'Thank you' + (firstName ? ', ' + firstName : '') + '!'; }

  $('fbTitle').textContent = didNotHappen ? 'Sorry it didn\'t happen' : thanks();
  $('fbLead').textContent = didNotHappen ? 'Two questions would still help me a lot.' : 'Two more minutes for the questions that really help?';

  // What the backend sends back: the first name for the greeting, and the name, job and company for the "share publicly" box.
  function greet(res) {
    firstName = res.firstName || '';
    if (!didNotHappen) $('fbTitle').textContent = thanks();
    $('fbDoneTitle').textContent = thanks();
    if (res.quick && !$('fbLead').querySelector('strong')) {
      var lead = $('fbLead'), rest = lead.textContent, b = document.createElement('strong');
      b.textContent = res.quick;
      lead.textContent = '';
      lead.appendChild(document.createTextNode('Recorded: '));
      lead.appendChild(b);
      lead.appendChild(document.createTextNode('. ' + rest));
    }
    [['fbPubName', res.name], ['fbPubJob', res.jobTitle], ['fbPubCompany', res.company]].forEach(function (f) {
      if (!$(f[0]).value) $(f[0]).value = f[1] || '';
    });
  }

  // Resolves true when the click is recorded, false when it could not be (never rejects).
  var clickDone;
  function sendClick() {
    clickDone = call({ token: token, step: 'click', quick: quick }).then(function (res) {
      if (res && res.error === 'bad_link') { badLink(); return false; }
      if (!res || !res.ok) return false;
      greet(res);
      return true;
    }).catch(function () { return false; });
    return clickDone;
  }

  // ---- 2. sending the form: thank-you at once, saving in the background
  var answers = null;
  function save() {
    var lead = $('fbDoneLead'), again = $('fbResend');
    again.hidden = true;
    lead.textContent = 'Saving your answers…';
    clickDone
      .then(function (ok) { return ok || linkBad ? ok : sendClick(); })   // the click first, so both land in the same row
      .then(function () {
        if (linkBad) return null;
        return call(answers).then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || 'server');
          lead.textContent = 'Your feedback is in.' + (answers.share ? ' Thank you for letting me share it.' : '');
        });
      })
      .catch(function () {
        lead.textContent = 'That didn\'t save. Please try again, or reply to my email instead.';
        again.hidden = false;
      });
  }
  $('fbResend').addEventListener('click', save);

  $('fbFormEl').addEventListener('submit', function (e) {
    e.preventDefault();
    var picked = document.querySelector('input[name="nps"]:checked');
    answers = { token: token, step: 'form', nps: picked ? picked.value : '', why: $('fbWhy').value, share: $('fbShare').checked,
      pubName: $('fbPubName').value, pubJob: $('fbPubJob').value, pubCompany: $('fbPubCompany').value, note: $('fbNote').value };
    $('fbDoneTitle').textContent = thanks();
    show('fbDone');
    save();
  });

  if (!preview && (!token || !AM.endpoint)) badLink();
  else { show('fbForm'); sendClick(); }
})();
