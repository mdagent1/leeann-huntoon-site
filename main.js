/* LeeAnn Huntoon portfolio: menu, "More work" filter, contact form.
   Plain JS, no dependencies. Bump ?v= in index.html after any change. */
(() => {
  'use strict';

  /* ---------- Menu (button + dropdown; Esc / outside click / link click close it) ---------- */
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('site-menu');
  if (toggle && menu) {
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
    };
    toggle.addEventListener('click', () => {
      const open = !isOpen();
      setOpen(open);
      if (open) {
        const first = menu.querySelector('a');
        if (first) first.focus();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (isOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    // Tabbing out of the open menu closes it.
    menu.addEventListener('focusout', (e) => {
      if (isOpen() && e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== toggle) setOpen(false);
    });
  }

  /* ---------- "Filter more work" (touches only the More work cards, never Featured) ---------- */
  const grid = document.getElementById('more-grid');
  const buttons = Array.from(document.querySelectorAll('.filter-btn'));
  const status = document.getElementById('filter-status');
  if (grid && buttons.length) {
    const cards = Array.from(grid.querySelectorAll('.card'));
    const countFor = (c) => (c === 'all' ? cards.length : cards.filter((x) => x.dataset.category === c).length);
    buttons.forEach((b) => {
      const n = countFor(b.dataset.filter);
      const span = b.querySelector('.count');
      if (span) span.textContent = String(n);
      if (n === 0 && b.dataset.filter !== 'all') b.hidden = true;
    });
    buttons.forEach((b) => {
      b.addEventListener('click', () => {
        const c = b.dataset.filter;
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        let shown = 0;
        cards.forEach((card) => {
          const on = c === 'all' || card.dataset.category === c;
          card.hidden = !on;
          if (on) shown += 1;
        });
        if (status) {
          status.textContent = 'Showing ' + shown + (shown === 1 ? ' story' : ' stories') +
            (c === 'all' ? '.' : ' in ' + b.dataset.label + '.');
        }
      });
    });
  }

  /* ---------- Contact form (Web3Forms) ----------
     Review state: the HTML ships data-state="review" with a disabled fieldset, so nothing can be sent.
     Live state (at launch): data-state="live", fieldset enabled, LeeAnn's access key filled in.
     Success shows the thank-you panel; ANY failure (service down, network error, rejected
     submission, 20 s timeout) shows the inline error instead of losing the message silently.
     Pattern from Ryan Dundas's site (live since 2026-11-10). */
  const form = document.getElementById('contact-form');
  const successEl = document.getElementById('contact-success');
  const errorEl = document.getElementById('form-error');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  const FORM_ENDPOINT = 'https://api.web3forms.com/submit';

  if (form && submitBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const key = form.querySelector('[name="access_key"]');
      if (form.dataset.state !== 'live' || !key || !key.value) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      if (errorEl) errorEl.hidden = true;
      if (formStatus) formStatus.textContent = 'Sending your message…';

      const data = {};
      new FormData(form).forEach((v, k) => { data[k] = v; });

      const showError = () => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        if (formStatus) formStatus.textContent = '';
        if (errorEl) errorEl.hidden = false;
      };

      const controller = 'AbortController' in window ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 20000) : null;

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: controller ? controller.signal : undefined,
      })
        .then(async (res) => {
          let json = {};
          try { json = await res.json(); } catch (err) { /* non-JSON error page */ }
          if (res.ok && json && (json.success === true || json.success === 'true')) {
            form.hidden = true;
            if (successEl) { successEl.hidden = false; successEl.focus(); }
            if (formStatus) formStatus.textContent = 'Thanks, your message is on its way.';
          } else {
            showError();
          }
        })
        .catch(showError)
        .finally(() => { if (timer) clearTimeout(timer); });
    });
  }
})();
