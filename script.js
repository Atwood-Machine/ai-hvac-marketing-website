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

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.getElementById('year').textContent = new Date().getFullYear();

const contactForm = document.getElementById('contact-form');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const subject = `AI HVAC Marketing Demo Request — ${formData.get('company') || 'New Lead'}`;
  const body = [
    `Name: ${formData.get('name') || ''}`,
    `Company: ${formData.get('company') || ''}`,
    `Email: ${formData.get('email') || ''}`,
    `Phone: ${formData.get('phone') || ''}`,
    `Service Area: ${formData.get('serviceArea') || ''}`,
    '',
    'Message:',
    `${formData.get('message') || ''}`,
  ].join('\n');

  window.location.href = `mailto:richard@aihvacmarketing.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

const modal = document.getElementById('demo-modal');
const openDemo = document.querySelector('[data-demo-trigger]');
const closeDemoControls = document.querySelectorAll('[data-modal-close]');

const closeModal = () => {
  modal.hidden = true;
  document.body.style.overflow = '';
};

openDemo?.addEventListener('click', () => {
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close')?.focus();
});

closeDemoControls.forEach((control) => control.addEventListener('click', closeModal));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) closeModal();
});
