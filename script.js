document.querySelectorAll('.flow-details').forEach((details) => {
  const title = details.querySelector('summary span');
  const rule = title.textContent.match(/R[56]/)?.[0] ?? '';
  details.addEventListener('toggle', () => {
    title.textContent = details.open ? `Cerrar detalle de ${rule}` : `Ver detalle de ${rule}`;
  });
});

const navLinks = [...document.querySelectorAll('.site-header nav a')];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && navSections.length) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${visible.target.id}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, .2, .5] });
  navSections.forEach((section) => observer.observe(section));
}
