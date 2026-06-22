/* ═══════════════════════════════════════════════════════════
   RTTL Analytics Tracker — Lightweight Firestore pageview tracker
   Writes pageviews to Firestore: analytics/pageviews/{auto-id}
   
   Each pageview records: page, referrer, country, timestamp
   Deduplicates by session (sessionStorage flag per page)
   ═══════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // Firebase config (same as admin)
  const firebaseConfig = {
    apiKey: "AIzaSyCRyApudx5cz6-2FjNc8iGkjruWGuJJjA8",
    authDomain: "rttl-6b7ea.firebaseapp.com",
    projectId: "rttl-6b7ea",
    storageBucket: "rttl-6b7ea.firebasestorage.app",
    messagingSenderId: "1027932994740",
    appId: "1:1027932994740:web:d74a1f4651e8107c9cabe1"
  };

  // Don't track admin pages or bots
  const path = window.location.pathname;
  if (path.includes('admin')) return;
  if (navigator.userAgent.match(/bot|crawl|spider|slurp|Googlebot/i)) return;

  // Session dedup — only count once per page per session
  const sessionKey = 'rttl_pv_' + path;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, '1');

  // Generate a visitor ID (persists across sessions for unique visitor tracking)
  let visitorId = localStorage.getItem('rttl_vid');
  if (!visitorId) {
    visitorId = 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    localStorage.setItem('rttl_vid', visitorId);
  }

  // Load Firebase SDKs dynamically (minimal footprint)
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
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

  async function trackPageview() {
    try {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js');

      // Initialize Firebase (use separate app name to avoid conflicts)
      let app;
      try {
        app = firebase.app('rttl-analytics');
      } catch (e) {
        app = firebase.initializeApp(firebaseConfig, 'rttl-analytics');
      }
      const db = firebase.firestore(app);

      // Get today's date key for aggregation
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0]; // "2026-06-22"

      // Page name (clean path)
      const page = path === '/' ? '/' : path.replace(/\.html$/, '').replace(/\/$/, '') || '/';

      // Referrer domain
      let source = 'Direct';
      if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (refUrl.hostname !== window.location.hostname) {
            source = refUrl.hostname;
          }
        } catch (e) { /* ignore */ }
      }

      // Write individual pageview
      await db.collection('analytics').doc('pageviews').collection('events').add({
        page: page,
        source: source,
        visitorId: visitorId,
        date: dateKey,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent.substring(0, 100),
        screenWidth: window.screen.width,
        language: navigator.language || 'unknown'
      });

      // Increment daily counter (for fast chart queries)
      const dailyRef = db.collection('analytics').doc('daily').collection(dateKey).doc('summary');
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(dailyRef);
        if (doc.exists) {
          transaction.update(dailyRef, {
            pageviews: firebase.firestore.FieldValue.increment(1),
            [`pages.${page.replace(/\//g, '_')}`]: firebase.firestore.FieldValue.increment(1),
            [`sources.${source.replace(/\./g, '_')}`]: firebase.firestore.FieldValue.increment(1)
          });
        } else {
          transaction.set(dailyRef, {
            date: dateKey,
            pageviews: 1,
            pages: { [page.replace(/\//g, '_')]: 1 },
            sources: { [source.replace(/\./g, '_')]: 1 }
          });
        }
      });

    } catch (e) {
      // Silently fail — analytics should never break the site
      console.debug('[RTTL Analytics] Error:', e.message);
    }
  }

  // Run after page loads (don't block rendering)
  if (document.readyState === 'complete') {
    setTimeout(trackPageview, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(trackPageview, 1000));
  }
})();
