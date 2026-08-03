/* ═══════════════════════════════════════════════════════════
   RTTL Unified Form Handler & Notification System 🌿
   
   1. Captures form submits for contact, newsletter, booking & partner apps
   2. Writes to Firebase Firestore (analytics/forms/submissions) for instant backup
   3. Sends to Netlify Forms (for Netlify native store)
   4. Triggers instant notification to rethinkingtheleaf@gmail.com
   5. Shows smooth in-page success feedback without page breaks
   ═══════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyCRyApudx5cz6-2FjNc8iGkjruWGuJJjA8",
    authDomain: "rttl-6b7ea.firebaseapp.com",
    projectId: "rttl-6b7ea",
    storageBucket: "rttl-6b7ea.firebasestorage.app",
    messagingSenderId: "1027932994740",
    appId: "1:1027932994740:web:d74a1f4651e8107c9cabe1"
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function getDb() {
    try {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js');

      let app;
      try {
        app = firebase.app('rttl-forms');
      } catch (e) {
        app = firebase.initializeApp(firebaseConfig, 'rttl-forms');
      }
      return firebase.firestore(app);
    } catch (e) {
      console.warn('[RTTL Forms] Firebase init warning:', e);
      return null;
    }
  }

  async function handleFormSubmit(form) {
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending...</span>';
    }

    const formData = new FormData(form);
    const formName = form.getAttribute('name') || form.querySelector('input[name="form-name"]')?.value || 'general-contact';
    
    // Convert FormData to plain object
    const dataObj = {};
    formData.forEach((value, key) => {
      if (key !== 'bot-field') {
        dataObj[key] = value;
      }
    });

    // Check honeypot
    const botField = formData.get('bot-field');
    if (botField) {
      console.warn('[RTTL Forms] Spam detected');
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const timestampIso = new Date().toISOString();

    // 1. Save to Firestore
    try {
      const db = await getDb();
      if (db) {
        await db.collection('analytics').doc('forms').collection('submissions').add({
          formType: formName,
          data: dataObj,
          page: window.location.pathname,
          submittedAt: timestampIso,
          status: 'new'
        });
      }
    } catch (err) {
      console.warn('[RTTL Forms] Firestore save notice:', err.message);
    }

    // 2. Submit to Netlify Forms
    try {
      if (!formData.has('form-name')) {
        formData.append('form-name', formName);
      }
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });
    } catch (err) {
      console.warn('[RTTL Forms] Netlify submit notice:', err.message);
    }

    // 3. Trigger serverless notification / email API
    try {
      await fetch('/api/submit-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: formName,
          data: dataObj,
          page: window.location.pathname,
          submittedAt: timestampIso
        })
      });
    } catch (err) {
      // Non-blocking notification request
    }

    // 4. Display elegant success message
    const parentCard = form.closest('.form-card') || form.parentElement;
    const successDiv = document.getElementById('form-success');

    if (successDiv) {
      form.style.display = 'none';
      successDiv.classList.add('visible');
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      form.innerHTML = `
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 2rem; text-align: center; margin: 1rem 0;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌾</div>
          <h3 style="color: #22c55e; margin-bottom: 0.5rem; font-family: var(--font-display, serif);">Message Received!</h3>
          <p style="color: var(--text-secondary, #cbd5e1); font-size: 0.95rem; max-width: 440px; margin: 0 auto 1rem;">
            Thank you for reaching out to Re-Thinking The Leaf! Shardell and the team have received your note and will be in touch shortly.
          </p>
          <span style="font-size: 0.8rem; color: var(--text-muted, #94a3b8);">A copy has been sent to rethinkingtheleaf@gmail.com</span>
        </div>
      `;
    }
  }

  function initForms() {
    const forms = document.querySelectorAll('form[data-netlify="true"], form[name="contact"], form[name="newsletter"], form[name="event-booking"], form[name="partner-application"], #contact-form, #partner-form');
    
    forms.forEach(form => {
      if (form.dataset.rttlBound) return;
      form.dataset.rttlBound = 'true';

      // Ensure hidden form-name field exists
      const formName = form.getAttribute('name') || 'contact';
      if (!form.querySelector('input[name="form-name"]')) {
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'form-name';
        hidden.value = formName;
        form.appendChild(hidden);
      }

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit(form);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
})();
