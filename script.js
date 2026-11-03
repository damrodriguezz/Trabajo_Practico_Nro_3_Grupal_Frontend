document.querySelectorAll('.flow-details').forEach((details) => {
  const title = details.querySelector('summary span');
  const rule = title.textContent.match(/R[56]/)?.[0] ?? '';
  details.addEventListener('toggle', () => {
    title.textContent = details.open ? `Cerrar detalle de ${rule}` : `Ver detalle de ${rule}`;
  });
});

const customSelects = [...document.querySelectorAll('.simulator-fields select')].map((select) => {
  const label = select.closest('label');
  const control = document.createElement('span');
  const trigger = document.createElement('button');
  const menu = document.createElement('span');
  const listId = `${select.name}-options`;
  const labelText = label.firstChild.textContent.trim();
  let typeahead = '';
  let typeaheadTimer;

  control.className = 'select-control';
  trigger.className = 'select-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-label', `${labelText}: ${select.selectedOptions[0].textContent}`);
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', listId);

  menu.className = 'select-options';
  menu.id = listId;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', labelText);
  menu.hidden = true;

  const selectedText = document.createElement('span');
  selectedText.className = 'select-value';
  trigger.append(selectedText);
  const chevron = document.createElement('span');
  chevron.className = 'select-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(chevron);

  const syncValue = () => {
    const selectedOption = select.selectedOptions[0];
    selectedText.textContent = selectedOption.textContent;
    trigger.setAttribute('aria-label', `${labelText}: ${selectedOption.textContent}`);
    menu.querySelectorAll('[role="option"]').forEach((option) => {
      option.setAttribute('aria-selected', String(option.dataset.value === select.value));
    });
  };

  const close = (returnFocus = false) => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    control.classList.remove('is-open', 'opens-up');
    if (returnFocus) trigger.focus();
  };

  const open = () => {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    control.classList.add('is-open');
    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = Math.min(menu.scrollHeight, 240);
    const spaceBelow = window.innerHeight - triggerRect.bottom - 12;
    const spaceAbove = triggerRect.top - 12;
    const opensUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const availableSpace = Math.max(0, Math.min(240, opensUp ? spaceAbove : spaceBelow));

    control.classList.toggle('opens-up', opensUp);
    menu.style.left = `${Math.max(8, Math.min(triggerRect.left, window.innerWidth - triggerRect.width - 8))}px`;
    menu.style.width = `${Math.min(triggerRect.width, window.innerWidth - 16)}px`;
    menu.style.maxHeight = `${availableSpace}px`;
    menu.style.top = opensUp ? 'auto' : `${triggerRect.bottom + 4}px`;
    menu.style.bottom = opensUp ? `${window.innerHeight - triggerRect.top + 4}px` : 'auto';
  };

  select.parentNode.insertBefore(control, select);
  control.append(select, trigger, menu);
  select.classList.add('select-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  [...select.options].forEach((option) => {
    const item = document.createElement('button');
    item.className = 'select-option';
    item.type = 'button';
    item.setAttribute('role', 'option');
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    });
    menu.append(item);
  });

  trigger.addEventListener('click', () => {
    if (menu.hidden) open();
    else close();
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      open();
      const selectedOption = menu.querySelector('[aria-selected="true"]');
      (selectedOption || menu.querySelector('.select-option'))?.focus();
    }
  });

  menu.addEventListener('keydown', (event) => {
    const options = [...menu.querySelectorAll('.select-option')];
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      typeahead += event.key.toLocaleLowerCase();
      window.clearTimeout(typeaheadTimer);
      typeaheadTimer = window.setTimeout(() => { typeahead = ''; }, 500);
      const match = options.find((option) => option.textContent.toLocaleLowerCase().startsWith(typeahead));
      if (match) {
        event.preventDefault();
        match.focus();
      }
      return;
    } else {
      return;
    }

    event.preventDefault();
    options[nextIndex]?.focus();
  });

  menu.addEventListener('focusout', (event) => {
    if (!control.contains(event.relatedTarget) && !menu.hidden) close();
  });

  select.addEventListener('change', syncValue);
  syncValue();
  return { control, trigger, menu, close };
});

document.addEventListener('pointerdown', (event) => {
  customSelects.forEach(({ control, close }) => {
    if (!control.contains(event.target)) close();
  });
});

window.addEventListener('scroll', (event) => {
  if (customSelects.some(({ menu }) => menu === event.target)) return;
  customSelects.forEach(({ close }) => close());
}, true);

window.addEventListener('resize', () => {
  customSelects.forEach(({ close }) => close());
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
  searchForm.querySelector('[name="role"]').closest('.select-control')?.querySelector('.select-trigger').focus();
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
