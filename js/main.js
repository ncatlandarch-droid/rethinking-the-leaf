/* ================================================================
   ReThinking The Leaf — Interactive Behaviors
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Set current year ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Navigation scroll effect ---
  const nav = document.getElementById('nav');
  const onNavScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onNavScroll, { passive: true });

  // --- Parallax Lavender Field Scroll ---
  const parallaxLayers = document.querySelectorAll('.hero__parallax-layer');
  if (parallaxLayers.length) {
    let ticking = false;
    const onParallaxScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroH = document.querySelector('.hero--parallax')?.offsetHeight || window.innerHeight;
          // Only animate while hero is visible
          if (scrollY < heroH * 1.2) {
            parallaxLayers.forEach(layer => {
              const speed = parseFloat(layer.dataset.speed) || 0.3;
              const yOffset = -(scrollY * speed);
              // Scale up slightly as you scroll for depth
              const scale = 1 + (scrollY / heroH) * 0.08 * speed;
              layer.style.transform = `translate3d(0, ${yOffset}px, 0) scale(${scale})`;
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
  }
  onNavScroll();

  // --- Mobile nav toggle ---
  const burger = document.getElementById('nav-burger');
  const navLinks = document.getElementById('nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    // Close on link click (includes dropdown links)
    navLinks.querySelectorAll('.nav__link, .nav__cta, .nav__dropdown-menu a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // --- Scroll reveal (Intersection Observer) ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });
  revealElements.forEach(el => revealObserver.observe(el));

  // --- Parallax hero background ---
  const heroBg = document.getElementById('hero-bg-img');
  if (heroBg) {
    let ticking = false;
    const onParallax = () => {
      if (window.scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${window.scrollY * 0.35}px) scale(1.05)`;
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // --- Animated counter for acres ---
  const statAcres = document.getElementById('stat-acres');
  if (statAcres) {
    let counted = false;
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counted) {
          counted = true;
          animateCounter(statAcres, 0, 66, 2000);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    countObserver.observe(statAcres);
  }

  function animateCounter(el, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Active nav link highlighting ---
  const sections = document.querySelectorAll('.section, .hero');
  const navLinkEls = document.querySelectorAll('.nav__link');

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinkEls.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${id}`) {
            link.style.color = 'var(--accent-gold)';
          }
        });
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '-80px 0px -50% 0px'
  });
  sections.forEach(section => activeObserver.observe(section));

  // --- Zone card touch support for mobile ---
  if ('ontouchstart' in window) {
    document.querySelectorAll('.zone-card').forEach(card => {
      card.addEventListener('touchstart', () => {
        document.querySelectorAll('.zone-card').forEach(c => c.classList.remove('touched'));
        card.classList.add('touched');
      });
    });
  }

  // --- Form submission feedback ---
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Sending...';
        btn.style.opacity = '0.7';
      }
    });
  }

  // --- Hero badge entrance animation ---
  const heroBadge = document.getElementById('hero-badge');
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  
  setTimeout(() => {
    if (heroBadge) {
      heroBadge.style.opacity = '0';
      heroBadge.style.transform = 'translateY(20px)';
      heroBadge.style.transition = 'all 0.8s ease';
      requestAnimationFrame(() => {
        heroBadge.style.opacity = '1';
        heroBadge.style.transform = 'translateY(0)';
      });
    }
  }, 300);

  setTimeout(() => {
    if (heroTitle) {
      heroTitle.style.opacity = '0';
      heroTitle.style.transform = 'translateY(30px)';
      heroTitle.style.transition = 'all 1s ease';
      requestAnimationFrame(() => {
        heroTitle.style.opacity = '1';
        heroTitle.style.transform = 'translateY(0)';
      });
    }
  }, 600);

  setTimeout(() => {
    if (heroSubtitle) {
      heroSubtitle.style.opacity = '0';
      heroSubtitle.style.transform = 'translateY(20px)';
      heroSubtitle.style.transition = 'all 0.8s ease';
      requestAnimationFrame(() => {
        heroSubtitle.style.opacity = '1';
        heroSubtitle.style.transform = 'translateY(0)';
      });
    }
  }, 900);

  // --- Back to Top Button ---
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 800) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Lazy-load Sketchfab 3D Viewer ---
  const sketchfabContainer = document.getElementById('sketchfab-container');
  if (sketchfabContainer) {
    const iframe = sketchfabContainer.querySelector('iframe');
    if (iframe) {
      const realSrc = iframe.getAttribute('src');
      iframe.removeAttribute('src');
      iframe.setAttribute('data-src', realSrc);
      
      const sketchfabObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lazySrc = iframe.getAttribute('data-src');
            if (lazySrc) {
              iframe.setAttribute('src', lazySrc);
              iframe.removeAttribute('data-src');
            }
            sketchfabObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '200px' });
      
      sketchfabObserver.observe(sketchfabContainer);
    }
  }

  // --- Animated count-up for stat values ---
  const statEls = document.querySelectorAll('.stat-value[data-count-target]');
  if (statEls.length) {
    const countUp = (el) => {
      const target = parseFloat(el.dataset.countTarget);
      const decimals = parseInt(el.dataset.countDecimals) || 0;
      const suffix = el.dataset.countSuffix || '';
      const duration = 1500;
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        el.textContent = current.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => statObserver.observe(el));
  }

});
