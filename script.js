/* ============================================================
   THE DIGITAL INVITE — Main JavaScript
   ============================================================ */

// ---- Navbar scroll effect ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ---- Mobile hamburger menu ----
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('open');
  spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity   = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '1';
    });
  });
});

// ---- Live countdown to demo event date ----
const eventDate = new Date('2026-09-20T17:00:00');

function updateCountdown() {
  const now  = new Date();
  const diff = eventDate - now;

  if (diff <= 0) {
    document.getElementById('cDays').textContent  = '00';
    document.getElementById('cHours').textContent = '00';
    document.getElementById('cMins').textContent  = '00';
    document.getElementById('cSecs').textContent  = '00';
    return;
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('cDays').textContent  = String(days).padStart(2, '0');
  document.getElementById('cHours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cMins').textContent  = String(mins).padStart(2, '0');
  document.getElementById('cSecs').textContent  = String(secs).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ---- RSVP demo interaction ----
function handleRsvp(type) {
  const msg = document.getElementById('rsvpMessage');
  if (type === 'yes') {
    msg.textContent = '🎉 Thank you! Your RSVP has been confirmed.';
    msg.className = 'rsvp-message yes';
  } else {
    msg.textContent = '💌 We\'re sorry you can\'t make it. Thank you for letting us know.';
    msg.className = 'rsvp-message no';
  }
  setTimeout(() => {
    msg.textContent = '';
    msg.className = 'rsvp-message';
  }, 4000);
}

// ---- Scroll-triggered fade-in animations ----
function initScrollAnimations() {
  const elements = document.querySelectorAll(
    '.step-card, .theme-card, .review-card, .price-card, .pro-card, .demo-feature, .db-card, .pro-text, .lang-text, .dashboard-text'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el    = entry.target;
          const delay = el.dataset.delay || 0;
          setTimeout(() => {
            el.style.opacity   = '1';
            el.style.transform = el.style.transform.replace('translateY(24px)', '').replace('translateY(-4px)', '') + '';
            el.classList.add('visible');
          }, Number(delay));
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

initScrollAnimations();

// ---- Smooth active nav link highlight on scroll ----
const sections = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top    = section.offsetTop;
    const height = section.offsetHeight;
    const id     = section.getAttribute('id');
    const link   = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (link) {
      if (scrollY >= top && scrollY < top + height) {
        allNavLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}, { passive: true });

// Apply active link style
const styleEl = document.createElement('style');
styleEl.textContent = `.nav-links a.active { color: var(--rose); background: var(--rose-light); }`;
document.head.appendChild(styleEl);

// ---- Comparison table row hover enhancement ----
document.querySelectorAll('.comparison-table tbody tr').forEach(row => {
  row.addEventListener('mouseenter', () => {
    row.style.transition = 'background 0.2s';
  });
});

// ---- Dashboard bar animation on scroll ----
const dbSection = document.querySelector('.dashboard-section');
if (dbSection) {
  const barObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      document.querySelectorAll('.db-bar-fill').forEach(bar => {
        const target = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => { bar.style.width = target; }, 200);
      });
      barObserver.disconnect();
    }
  }, { threshold: 0.3 });
  barObserver.observe(dbSection);
}

// ---- Theme card tilt effect ----
document.querySelectorAll('.theme-card, .price-card, .review-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / rect.width  - 0.5;
    const y    = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ---- Number counter animation ----
function animateCounter(el, target, duration = 1500) {
  const start   = performance.now();
  const initial = 0;

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(initial + (target - initial) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const statsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      document.querySelector('.stat:nth-child(1) strong').textContent = '10,000+';
      statsObserver.disconnect();
    }
  }, { threshold: 0.8 });
  statsObserver.observe(heroStats);
}

// ---- Envelope open animation on demo section scroll ----
const demoSection = document.querySelector('.demo-section');
const demoFlap    = document.querySelector('.demo-flap-top');

if (demoSection && demoFlap) {
  const envelopeObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      demoFlap.style.transition  = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      demoFlap.style.transformOrigin = 'top center';
      demoFlap.style.transform   = 'rotateX(-160deg)';
      envelopeObserver.disconnect();
    }
  }, { threshold: 0.4 });
  envelopeObserver.observe(demoSection);
}

// ---- Pricing toggle (annual/monthly placeholder) ----
// Ready for future implementation

// ---- Flag items staggered entrance ----
const flagCloud = document.querySelector('.flag-cloud');
if (flagCloud) {
  const flagObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      document.querySelectorAll('.flag-item').forEach((item, i) => {
        item.style.animationPlayState = 'running';
      });
      flagObserver.disconnect();
    }
  }, { threshold: 0.2 });
  flagObserver.observe(flagCloud);

  document.querySelectorAll('.flag-item').forEach(item => {
    item.style.animationPlayState = 'paused';
  });
}
