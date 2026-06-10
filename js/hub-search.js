/* ================================================================
   The Hub — AI-Powered Local Search Engine
   Zero API calls — pure client-side keyword matching
   ================================================================ */

(function() {
  'use strict';

  // ── Partner Knowledge Base (searchable data) ──────────────────
  const PARTNERS = [
    {
      id: 'anointed-acres',
      name: 'Anointed Acres Stables',
      keywords: [
        'trail rides', 'trail', 'rides', 'horses', 'horse', 'horseback', 'riding',
        'equine', 'equine therapy', 'therapy', 'therapeutic', 'farmwork',
        'youth', 'character development', 'at-risk', 'young', 'children', 'kids',
        'birthday', 'birthday parties', 'party', 'parties',
        'family', 'family experiences', 'empowerment',
        'farm tours', 'tours', 'stables', 'animals',
        'outdoor', 'nature', 'healing'
      ]
    },
    {
      id: 'browntown-farms',
      name: 'Browntown Farms',
      keywords: [
        'produce', 'fresh', 'vegetables', 'fruits', 'food', 'organic', 'natural',
        'jams', 'jam', 'jellies', 'jelly', 'preserves',
        'sauces', 'sauce', 'hot sauce', 'bbq', 'barbecue', 'catering',
        'gift baskets', 'gift', 'baskets', 'gifts',
        'farm tours', 'tours', 'farm',
        'seasonal events', 'seasonal', 'harvest', 'pumpkin',
        'custom orders', 'custom', 'orders',
        'century farm', 'heritage', 'history', '1908'
      ]
    },
    {
      id: 'bfg',
      name: 'Brothers Function Group',
      keywords: [
        'event', 'events', 'event planning', 'planning',
        'party', 'parties', 'function', 'functions',
        'membership', 'member', 'voting', 'vote',
        'minority', 'minority business', 'minority-owned', 'black-owned',
        'vendor', 'vendor booths', 'booths', 'booth',
        'catering', 'venue', 'fashion', 'fashionable',
        'networking', 'community', 'culture', 'curating',
        'the hub', 'hub', 'directory', 'business directory'
      ]
    },
    {
      id: 'think-design',
      name: 'Think! Design & Planning',
      keywords: [
        'conservation', 'conservation strategy', 'landscape', 'landscape design',
        'landscape architecture', 'architecture', 'design', 'planning',
        'master plan', 'master planning', 'masterplan',
        'digital twin', 'digital', 'twin', '3d', 'virtual',
        'NRCS', 'TSP', 'USDA', 'technical service', 'service provider',
        'habitat', 'habitat design', 'pollinator', 'wildlife',
        'GIS', 'spatial', 'mapping', 'geospatial',
        'cultural', 'memorial', 'remembrance',
        'apparel', 'clothing', 'tees', 't-shirt', 'graphic',
        'grant', 'grant readiness', 'EQIP', 'funding',
        'soil', 'agroforestry', 'vegetation', 'ecological'
      ]
    },
    {
      id: 'lake-jeanette',
      name: 'Lake Jeanette Family & Implant Dentistry',
      keywords: [
        'dentist', 'dentistry', 'dental', 'teeth', 'tooth',
        'implants', 'dental implants', 'implant',
        'family dentistry', 'family', 'cosmetic', 'cosmetic dentistry',
        'prosthodontist', 'prosthodontics', 'crowns', 'bridges',
        '3d scanning', '3d', 'digital', 'digital dentistry',
        'whitening', 'teeth whitening', 'cleaning',
        'emergency', 'emergency dental',
        'greensboro', 'dr brenes', 'brenes'
      ]
    }
  ];

  // ── DOM References ────────────────────────────────────────────
  const searchInput = document.getElementById('hub-search-input');
  const clearBtn = document.getElementById('hub-search-clear');
  const statusEl = document.getElementById('hub-search-status');
  const tagsContainer = document.getElementById('hub-search-tags');
  const partnerEls = document.querySelectorAll('.hub-partner');
  const allChips = document.querySelectorAll('.hub-chip');

  if (!searchInput) return; // Not on the community page

  // ── Search Logic ──────────────────────────────────────────────
  let debounceTimer = null;

  function performSearch(query) {
    const q = query.toLowerCase().trim();

    // Clear state
    clearBtn.style.display = q ? 'flex' : 'none';
    allChips.forEach(chip => chip.classList.remove('hub-chip--matched'));

    if (!q) {
      // Show all partners
      partnerEls.forEach(el => {
        el.classList.remove('hub-partner--hidden', 'hub-partner--matched');
      });
      statusEl.textContent = '';
      return;
    }

    const matches = [];
    const matchedChipKeywords = new Set();

    PARTNERS.forEach(partner => {
      const el = document.querySelector(`[data-partner="${partner.id}"]`);
      if (!el) return;

      // Check if any keyword matches the query
      const matchedKeywords = partner.keywords.filter(kw => {
        return kw.includes(q) || q.includes(kw) || fuzzyMatch(q, kw);
      });

      if (matchedKeywords.length > 0) {
        el.classList.remove('hub-partner--hidden');
        el.classList.add('hub-partner--matched');
        matches.push(partner.name);
        matchedKeywords.forEach(kw => matchedChipKeywords.add(kw));
      } else {
        el.classList.add('hub-partner--hidden');
        el.classList.remove('hub-partner--matched');
      }
    });

    // Highlight matching chips
    allChips.forEach(chip => {
      const chipKw = chip.dataset.keyword.toLowerCase();
      if (matchedChipKeywords.has(chipKw) || chipKw.includes(q) || q.includes(chipKw)) {
        chip.classList.add('hub-chip--matched');
      }
    });

    // Update status
    if (matches.length === 0) {
      statusEl.innerHTML = `<span class="hub-search__no-results">No matches for "<strong>${escapeHtml(query)}</strong>" — try a different term or <a href="index.html#contact">contact us</a>.</span>`;
    } else {
      statusEl.innerHTML = `<span class="hub-search__results">Found <strong>${matches.length}</strong> partner${matches.length > 1 ? 's' : ''} matching "<strong>${escapeHtml(query)}</strong>"</span>`;
    }
  }

  // Simple fuzzy match — checks if all chars of query appear in keyword in order
  function fuzzyMatch(query, keyword) {
    if (query.length < 3) return false;
    let qi = 0;
    for (let i = 0; i < keyword.length && qi < query.length; i++) {
      if (keyword[i] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Event Listeners ───────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(searchInput.value);
    }, 200);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    performSearch('');
    searchInput.focus();
  });

  // Quick-search tags
  if (tagsContainer) {
    tagsContainer.addEventListener('click', (e) => {
      const tag = e.target.closest('.hub-tag');
      if (!tag) return;

      // Toggle active state
      const wasActive = tag.classList.contains('hub-tag--active');
      document.querySelectorAll('.hub-tag').forEach(t => t.classList.remove('hub-tag--active'));

      if (wasActive) {
        searchInput.value = '';
        performSearch('');
      } else {
        tag.classList.add('hub-tag--active');
        searchInput.value = tag.dataset.query;
        performSearch(tag.dataset.query);
      }
    });
  }

  // Keyboard shortcut: focus search on '/'
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      performSearch('');
      searchInput.blur();
    }
  });

})();
