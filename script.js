const FORM_ENDPOINT = '/api/demo-request';

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

menuToggle?.addEventListener('click', () => {
  const isOpen = primaryNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});

primaryNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    primaryNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('visible'));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();



// Visible desktop-only hero interaction. A soft spotlight follows the cursor,
// the background grid drifts, and the package tilts toward the pointer.
// Touch devices and reduced-motion visitors receive the stable layout.
const hero = document.querySelector('.hero');
const canUseHeroMotion =
  hero &&
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canUseHeroMotion) {
  let animationFrame = null;
  let isInside = false;
  const current = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  const renderHeroMotion = () => {
    // Smoothly ease toward the cursor instead of snapping to it.
    current.x += (target.x - current.x) * 0.11;
    current.y += (target.y - current.y) * 0.11;

    const bounds = hero.getBoundingClientRect();
    const lightX = bounds.width * (0.5 + current.x * 0.48);
    const lightY = bounds.height * (0.5 + current.y * 0.48);

    hero.style.setProperty('--hero-mouse-x', `${lightX}px`);
    hero.style.setProperty('--hero-mouse-y', `${lightY}px`);
    hero.style.setProperty('--hero-shift-x', `${current.x * 28}px`);
    hero.style.setProperty('--hero-shift-y', `${current.y * 20}px`);
    hero.style.setProperty('--hero-card-x', `${current.x * 18}px`);
    hero.style.setProperty('--hero-card-y', `${current.y * 13}px`);
    hero.style.setProperty('--hero-rotate-x', `${current.y * -7}deg`);
    hero.style.setProperty('--hero-rotate-y', `${current.x * 9}deg`);
    hero.style.setProperty('--hero-orb-x', `${current.x * -34}px`);
    hero.style.setProperty('--hero-orb-y', `${current.y * -24}px`);

    const stillMoving =
      Math.abs(target.x - current.x) > 0.001 ||
      Math.abs(target.y - current.y) > 0.001;

    if (isInside || stillMoving) {
      animationFrame = requestAnimationFrame(renderHeroMotion);
    } else {
      animationFrame = null;
    }
  };

  const startAnimation = () => {
    if (!animationFrame) animationFrame = requestAnimationFrame(renderHeroMotion);
  };

  hero.addEventListener('pointerenter', () => {
    isInside = true;
    hero.classList.add('hero--interactive');
    startAnimation();
  });

  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    target.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    target.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    startAnimation();
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    isInside = false;
    target.x = 0;
    target.y = 0;
    hero.classList.remove('hero--interactive');
    startAnimation();
  });
}

// 60-second business-case carousel
const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const track = carousel.querySelector('.carousel-track');
  const slides = [...carousel.querySelectorAll('.case-slide')];
  const dotsWrap = carousel.querySelector('.carousel-controls');
  let index = 0;
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to insight ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });
  function goTo(next) {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }
  carousel.querySelector('.carousel-arrow--prev')?.addEventListener('click', () => goTo(index - 1));
  carousel.querySelector('.carousel-arrow--next')?.addEventListener('click', () => goTo(index + 1));
  let startX = null;
  carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 45) goTo(index + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
}

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';
  formStatus.textContent = '';
  formStatus.className = 'form-status';

  try {
    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || 'Submission failed');

    contactForm.reset();
    formStatus.textContent = 'Thank you—your demo request has been received. Richard will follow up personally.';
    formStatus.className = 'form-status form-status--success';
  } catch (error) {
    formStatus.textContent = 'We could not send your request. Please try again in a moment.';
    formStatus.className = 'form-status form-status--error';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});
