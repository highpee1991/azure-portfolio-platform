
(function () {
  'use strict';

  /* ────────────────────────────────────────────────
     1. THEME TOGGLE
  ──────────────────────────────────────────────── */
  const body        = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon   = document.getElementById('themeIcon');

  const DARK_CLASS = 'dark-mode';
  const THEME_KEY  = 'tw-theme';

  function applyTheme(dark) {
    if (dark) {
      body.classList.add(DARK_CLASS);
      body.classList.remove('light-mode');
      themeIcon.textContent = '☀️';
    } else {
      body.classList.remove(DARK_CLASS);
      body.classList.add('light-mode');
      themeIcon.textContent = '🌙';
    }
  }

  // Load saved preference or respect OS preference
  const saved = localStorage.getItem(THEME_KEY);
  if (saved !== null) {
    applyTheme(saved === 'dark');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme(true);
  }

  themeToggle.addEventListener('click', () => {
    const isDark = body.classList.contains(DARK_CLASS);
    applyTheme(!isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'light' : 'dark');
  });

  /* ────────────────────────────────────────────────
     2. NAVBAR — scroll shadow
  ──────────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  function onScroll() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    highlightNavLink();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ────────────────────────────────────────────────
     3. HAMBURGER MENU
  ──────────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    }
  });

  /* ────────────────────────────────────────────────
     4. ACTIVE NAV LINK on scroll
  ──────────────────────────────────────────────── */
  const sections   = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  function highlightNavLink() {
    let current = '';
    const scrollY = window.scrollY + 100;

    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop) {
        current = sec.id;
      }
    });

    navAnchors.forEach(a => {
      a.classList.remove('active-link');
      if (a.getAttribute('href') === '#' + current) {
        a.classList.add('active-link');
      }
    });
  }

  // Add active link style via JS-injected rule
  const styleEl = document.createElement('style');
  styleEl.textContent = `.nav-links a.active-link { color: var(--clr-accent); font-weight: 600; }`;
  document.head.appendChild(styleEl);

  /* ────────────────────────────────────────────────
     5. SCROLL REVEAL — cards & sections
  ──────────────────────────────────────────────── */
  const revealStyle = document.createElement('style');
  revealStyle.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal { opacity: 1; transform: none; transition: none; }
    }
  `;
  document.head.appendChild(revealStyle);

  function addRevealClasses() {
    const targets = document.querySelectorAll(
      '.project-card, .skill-group, .timeline-item, .cert-card, .stat-card, .highlight-item, .contact-link'
    );
    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 6) * 60}ms`;
    });
  }

  function setupRevealObserver() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  /* ────────────────────────────────────────────────
     6. DEV.TO ARTICLES
  ──────────────────────────────────────────────── */
  const articlesGrid    = document.getElementById('articlesGrid');
  const articlesLoading = document.getElementById('articlesLoading');

  // Placeholder articles shown when API is unavailable or username not yet set
  const PLACEHOLDER_ARTICLES = [
    {
      title: 'How I Built a Secure Azure Infrastructure Lab Without Any Public IPs',
      description: 'A walkthrough of deploying Azure Bastion, NSGs, and NAT Gateway to create a production-style secure environment where workload VMs have zero internet-facing exposure.',
      tag: 'Azure',
      date: 'May 2026',
      reactions: 0,
      comments: 0,
      url: 'https://dev.to/highpee1991',
      placeholder: true,
    },
    {
      title: 'Multi-Region VNet Peering on Azure: Hub-and-Spoke Step by Step',
      description: 'Building a hub-and-spoke network topology that connects two Azure regions via global VNet peering, with custom UDR routing and end-to-end connectivity testing.',
      tag: 'Networking',
      date: 'Apr 2026',
      reactions: 0,
      comments: 0,
      url: 'https://dev.to/highpee1991',
      placeholder: true,
    },
    {
      title: 'Automating Azure VM Lifecycle with CLI and Bash Scripts',
      description: 'I built a small toolkit of Bash scripts wrapping azure-cli commands to provision, start, stop, and teardown VMs repeatably — no portal clicks required.',
      tag: 'Automation',
      date: 'Apr 2026',
      reactions: 0,
      comments: 0,
      url: 'https://dev.to/highpee1991',
      placeholder: true,
    },
  ];

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function renderArticles(articles) {
    if (articlesLoading) articlesLoading.remove();

    if (!articles || articles.length === 0) {
      articlesGrid.innerHTML = `
        <div class="articles-error">
          <p>No articles published yet. Check back soon, or <a href="https://dev.to/taiwo" target="_blank" rel="noopener noreferrer">follow on Dev.to</a>.</p>
        </div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    articles.slice(0, 6).forEach(article => {
      const a = document.createElement('a');
      a.className = 'article-card reveal';
      a.href      = article.url || article.canonical_url || 'https://dev.to/taiwo';
      a.target    = '_blank';
      a.rel       = 'noopener noreferrer';
      a.setAttribute('aria-label', article.title);

      const tag     = article.tag || (article.tag_list && article.tag_list[0]) || 'Cloud';
      const dateStr = article.date || formatDate(article.published_at || '');
      const desc    = article.description || article.description || '';
      const reactions = article.public_reactions_count ?? article.reactions ?? 0;
      const comments  = article.comments_count ?? article.comments ?? 0;
      const placeholderNote = article.placeholder
        ? `<span style="font-style:italic;color:var(--clr-text-3)"> (coming soon)</span>` : '';

      a.innerHTML = `
        <span class="article-tag">${escapeHTML(tag)}</span>
        <p class="article-title">${escapeHTML(article.title)}${placeholderNote}</p>
        <p class="article-excerpt">${escapeHTML(desc)}</p>
        <div class="article-meta">
          <span>${escapeHTML(dateStr)}</span>
          <span>&#10084; ${reactions}</span>
          <span>&#128172; ${comments}</span>
          <span style="margin-left:auto;color:var(--clr-accent);font-weight:600;font-size:0.8rem;">Read &rarr;</span>
        </div>`;

      fragment.appendChild(a);
    });

    articlesGrid.appendChild(fragment);
    // Observe new cards
    articlesGrid.querySelectorAll('.reveal').forEach(el => {
      if ('IntersectionObserver' in window) {
        revealObserver && revealObserver.observe(el);
        el.classList.add('visible');
      }
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str || '')));
    return div.innerHTML;
  }

  // Real Dev.to username
  const DEVTO_USERNAME = 'highpee1991';

  async function fetchDevToArticles() {
    try {
      const res = await fetch(
        `https://dev.to/api/articles?username=${DEVTO_USERNAME}&per_page=6`,
        { signal: AbortSignal.timeout(6000) }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        renderArticles(data);
      } else {
        // No articles yet — show placeholder cards
        renderArticles(PLACEHOLDER_ARTICLES);
      }
    } catch {
      // Network error or timeout — show placeholders
      renderArticles(PLACEHOLDER_ARTICLES);
    }
  }

  /* ────────────────────────────────────────────────
     7. INIT
  ──────────────────────────────────────────────── */
  let revealObserver = null;

  function init() {
    addRevealClasses();
    setupRevealObserver();
    fetchDevToArticles();
    onScroll(); // run once on load
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
