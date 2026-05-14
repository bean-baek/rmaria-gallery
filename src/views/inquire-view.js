import { works } from '../works.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseQuery(hashOrSearch) {
  // The router uses hash routing. The inquire view may receive ?work=slug
  // either through location.search or appended to the hash like '#/inquire?work=foo'.
  // Try both.
  const out = {};
  const fromLocation = new URLSearchParams(location.search);
  for (const [k, v] of fromLocation) out[k] = v;
  // Hash query: after the '?' in location.hash
  const qIdx = location.hash.indexOf('?');
  if (qIdx !== -1) {
    const fromHash = new URLSearchParams(location.hash.slice(qIdx + 1));
    for (const [k, v] of fromHash) out[k] = v;
  }
  return out;
}

export function render(container, params = {}) {
  const query = parseQuery();
  const preselectedSlug = params.workSlug || query.work || '';

  const section = document.createElement('section');
  section.className = 'inquire';

  const workOptions = works
    .map(w => `<option value="${escapeHtml(w.slug)}"${w.slug === preselectedSlug ? ' selected' : ''}>${escapeHtml(w.title)} · ${escapeHtml(w.titleEn)}</option>`)
    .join('');

  section.innerHTML = `
    <header class="inquire__head">
      <h2 class="inquire__title">INQUIRY</h2>
      <p class="inquire__subtitle">문의</p>
    </header>
    <form class="inquire__form" novalidate>
      <label class="inquire__field">
        <span class="inquire__label">Name</span>
        <input class="inquire__input" name="name" type="text" required maxlength="100" autocomplete="name" />
      </label>
      <label class="inquire__field">
        <span class="inquire__label">Email</span>
        <input class="inquire__input" name="email" type="email" required maxlength="200" autocomplete="email" />
      </label>
      <label class="inquire__field">
        <span class="inquire__label">Kind</span>
        <select class="inquire__input" name="kind" required>
          <option value="print">Print</option>
          <option value="commission">Commission</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label class="inquire__field">
        <span class="inquire__label">Work of interest</span>
        <select class="inquire__input" name="workSlug">
          <option value="">— general —</option>
          ${workOptions}
        </select>
      </label>
      <label class="inquire__field">
        <span class="inquire__label">Message</span>
        <textarea class="inquire__textarea" name="message" required rows="6" maxlength="2000"></textarea>
      </label>
      <label class="inquire__honeypot" aria-hidden="true">
        <input type="text" name="company" tabindex="-1" autocomplete="off" />
      </label>
      <div class="inquire__status" role="status" aria-live="polite"></div>
      <button class="inquire__submit" type="submit">SEND</button>
    </form>
  `;

  // Add back link to index (mono small)
  const back = document.createElement('a');
  back.href = '#/';
  back.className = 'mono';
  back.style.cssText = 'display:inline-block;margin-bottom:var(--space-4);color:var(--mute);';
  back.textContent = '← INDEX';

  container.replaceChildren(back, section);

  const form = section.querySelector('.inquire__form');
  const status = section.querySelector('.inquire__status');
  const submit = section.querySelector('.inquire__submit');

  async function onSubmit(e) {
    e.preventDefault();
    status.textContent = 'Sending…';
    status.dataset.state = 'pending';
    submit.disabled = true;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to send.');
      }
      // Replace form with success block
      const success = document.createElement('div');
      success.className = 'inquire__success';
      success.innerHTML = `
        <p>감사합니다. 메시지가 전달되었습니다.</p>
        <p>영업일 기준 2일 내 회신드리겠습니다.</p>
        <p style="margin-top:var(--space-4);">— r.maria</p>
      `;
      form.replaceWith(success);
    } catch (err) {
      status.textContent = err.message || 'Failed to send. Please try again.';
      status.dataset.state = 'error';
      submit.disabled = false;
    }
  }

  form.addEventListener('submit', onSubmit);

  return function dispose() {
    form.removeEventListener('submit', onSubmit);
  };
}
