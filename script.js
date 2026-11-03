document.querySelectorAll('.flow-details').forEach((details) => {
  const title = details.querySelector('summary span');
  const rule = title.textContent.match(/R[56]/)?.[0] ?? '';
  details.addEventListener('toggle', () => {
    title.textContent = details.open ? `Cerrar detalle de ${rule}` : `Ver detalle de ${rule}`;
  });
});

function highlightPath(section, path, outcomePath) {
  section.querySelectorAll('.is-active').forEach((element) => {
    element.classList.remove('is-active');
  });

  section.querySelector(`.branches > .branch[data-path="${path}"]`)?.classList.add('is-active');
  section.querySelector(`[data-path-label="${path}"]`)?.classList.add('is-active');

  if (outcomePath) {
    section.querySelector(`.mini-outcomes > [data-path="${outcomePath}"]`)?.classList.add('is-active');
  }
}

const moderationForm = document.querySelector('#simulation-r5');
moderationForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const isGrave = form.querySelector('[name="severity"]').value === 'grave';
  const isPending = form.querySelector('[name="review"]').value === 'pending';
  const result = form.querySelector('.simulation-result');
  const message = result.querySelector('[data-result-message]');
  const moderationSection = document.querySelector('#flujo-moderacion');

  result.hidden = false;
  if (isGrave && isPending) {
    highlightPath(moderationSection, 'yes');
    message.textContent = 'Se pausan las nuevas invitaciones e incorporaciones y el reporte se deriva a moderación humana. Una persona revisa el caso; esta simulación no resuelve sanciones.';
    result.dataset.outcome = 'yes';
    return;
  }

  highlightPath(moderationSection, 'no');
  message.textContent = 'No se cumplen ambas condiciones. La sentencia no define este caso; en esta propuesta de diseño, la sesión continúa su recorrido habitual.';
  result.dataset.outcome = 'no';
});

const exampleSessions = [
  { name: 'Equipo Bruma', role: 'Duelista', region: 'LAS', paused: false },
  { name: 'Equipo Prisma', role: 'Iniciador', region: 'LAS', paused: false },
  { name: 'Equipo Nébula', role: 'Controlador', region: 'LAS', paused: false },
  { name: 'Equipo Aurora', role: 'Duelista', region: 'BR', paused: false },
  { name: 'Equipo Eclipse', role: 'Centinela', region: 'LAS', paused: true },
];

const searchForm = document.querySelector('#simulation-r6');
searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const isEnabled = form.querySelector('[name="enabled"]').checked;
  const role = form.querySelector('[name="role"]').value;
  const region = form.querySelector('[name="region"]').value;
  const result = form.querySelector('.simulation-result');
  const message = result.querySelector('[data-result-message]');
  const resultsList = result.querySelector('[data-results-list]');
  const adjustButton = result.querySelector('.simulator-adjust');
  const searchSection = document.querySelector('#flujo-busqueda');

  result.hidden = false;
  resultsList.replaceChildren();
  resultsList.hidden = true;
  adjustButton.hidden = true;

  if (!isEnabled) {
    highlightPath(searchSection, 'no');
    message.textContent = 'La búsqueda no está habilitada. No se consultan sesiones ni se modifican tus filtros.';
    result.dataset.outcome = 'no-search';
    return;
  }

  const matches = exampleSessions.filter((session) => (
    !session.paused
    && (role === 'any' || session.role === role)
    && (region === 'any' || session.region === region)
  ));

  highlightPath(searchSection, 'yes', matches.length ? 'yes' : 'no');
  if (matches.length) {
    message.textContent = `Encontramos ${matches.length} ${matches.length === 1 ? 'opción compatible' : 'opciones compatibles'}:`;
    matches.forEach((session) => {
      const item = document.createElement('li');
      item.textContent = `${session.name} · ${session.role} · ${session.region}`;
      resultsList.append(item);
    });
    resultsList.hidden = false;
    result.dataset.outcome = 'matches';
    return;
  }

  message.textContent = 'No hay resultados compatibles con estos filtros. Podés ajustarlos si querés; no se cambiarán por su cuenta.';
  adjustButton.hidden = false;
  result.dataset.outcome = 'no-matches';
});

searchForm?.querySelector('.simulator-adjust')?.addEventListener('click', () => {
  searchForm.querySelector('[name="role"]').focus();
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
