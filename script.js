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



// Subtle desktop-only hero motion. It automatically disables on touch devices
// and for visitors who prefer reduced motion.
const hero = document.querySelector('.hero');
const canUseHeroMotion =
  hero &&
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canUseHeroMotion) {
  let frameId = null;

  const updateHeroMotion = (event) => {
    if (frameId) cancelAnimationFrame(frameId);

    frameId = requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
      const y = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);
      const normalizedX = x / bounds.width - 0.5;
      const normalizedY = y / bounds.height - 0.5;

      hero.style.setProperty('--hero-mouse-x', `${x}px`);
      hero.style.setProperty('--hero-mouse-y', `${y}px`);
      hero.style.setProperty('--hero-shift-x', `${normalizedX * 14}px`);
      hero.style.setProperty('--hero-shift-y', `${normalizedY * 10}px`);
      hero.style.setProperty('--hero-card-x', `${normalizedX * 7}px`);
      hero.style.setProperty('--hero-card-y', `${normalizedY * 5}px`);
      hero.classList.add('hero--interactive');
    });
  };

  hero.addEventListener('pointermove', updateHeroMotion, { passive: true });
  hero.addEventListener('pointerleave', () => {
    if (frameId) cancelAnimationFrame(frameId);
    hero.classList.remove('hero--interactive');
    hero.style.removeProperty('--hero-shift-x');
    hero.style.removeProperty('--hero-shift-y');
    hero.style.removeProperty('--hero-card-x');
    hero.style.removeProperty('--hero-card-y');
  });
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
