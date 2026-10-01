/* Awesome Meets: the feedback page (feedback/index.html).

   People land here from one of the four buttons in the "how did it go?" email:
       /feedback/?fb=<personal link code>&a=<great | fine | no | none>
   1. On arrival the page tells the backend which button was clicked ("click"). The backend saves that
      answer straight away and returns the person's first name plus the name, job and company to prefill.
   2. The form sends the rest ("form").
   Both go to the same Apps Script web app as the sign-up forms (AM.endpoint in config.js), as a
   background request. Never link people to the script's own address: it shows a Google Drive error
   to anyone signed into several Google accounts.

   Check the look without sending anything, on this computer only:
       http://localhost:<port>/feedback/?preview=form   (also: none, done, bad, offline) */
(function () {
  var AM = window.AM || {};
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var token = params.get('fb') || '';
  var quick = params.get('a') || '';

  var isLocal = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) > -1;
  var preview = isLocal ? params.get('preview') : '';

  var states = ['fbLoading', 'fbForm', 'fbDone', 'fbError'];
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
        }, 400);
      });
    }
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 25000);
    return fetch(AM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ feedback: payload }), signal: ctrl.signal })
      .then(function (r) { return r.json(); })
      .finally(function () { clearTimeout(timer); });
  }

  // ---- the two error pages
  function badLink() {
    $('fbErrorTitle').textContent = 'That link is not valid';
    $('fbErrorLead').textContent = 'Please reply to my email instead and tell me how it went.';
    $('fbRetry').hidden = true;
    show('fbError');
  }
  function noConnection(retry) {
    $('fbErrorTitle').textContent = 'That didn\'t load';
    $('fbErrorLead').textContent = 'It may be the connection. Try again, or reply to my email instead and tell me how it went.';
    $('fbRetry').hidden = false;
    $('fbRetry').onclick = retry;
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

  // ---- 1. arriving
  var firstName = '';
  function arrive() {
    show('fbLoading');
    call({ token: token, step: 'click', quick: quick }).then(function (res) {
      if (!res || !res.ok) return res && res.error === 'bad_link' ? badLink() : noConnection(arrive);
      firstName = res.firstName || '';
      $('fbTitle').textContent = res.didNotHappen ? 'Sorry it didn\'t happen' : 'Thank you' + (firstName ? ', ' + firstName : '') + '!';
      var lead = $('fbLead');
      lead.textContent = '';
      if (res.quick) {
        lead.appendChild(document.createTextNode('Recorded: '));
        var b = document.createElement('strong');
        b.textContent = res.quick;
        lead.appendChild(b);
        lead.appendChild(document.createTextNode('. '));
      }
      lead.appendChild(document.createTextNode(res.didNotHappen ? 'Two questions would still help me a lot.' : 'Two more minutes for the questions that really help?'));
      $('fbPubName').value = res.name || '';
      $('fbPubJob').value = res.jobTitle || '';
      $('fbPubCompany').value = res.company || '';
      show('fbForm');
    }).catch(function () { noConnection(arrive); });
  }

  // ---- 2. sending the form
  $('fbFormEl').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('fbSend'), status = $('fbStatus');
    var picked = document.querySelector('input[name="nps"]:checked');
    var share = $('fbShare').checked;
    status.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    call({ token: token, step: 'form', nps: picked ? picked.value : '', why: $('fbWhy').value, share: share,
      pubName: $('fbPubName').value, pubJob: $('fbPubJob').value, pubCompany: $('fbPubCompany').value, note: $('fbNote').value })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'server');
        $('fbDoneTitle').textContent = 'Thank you' + (firstName ? ', ' + firstName : '') + '!';
        $('fbDoneLead').textContent = 'Your feedback is in.' + (share ? ' Thank you for letting me share it.' : '');
        show('fbDone');
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Send feedback';
        status.textContent = 'That didn\'t send. Please try again, or reply to my email instead.';
        status.hidden = false;
      });
  });

  if (!preview && (!token || !AM.endpoint)) badLink();
  else arrive();
})();
