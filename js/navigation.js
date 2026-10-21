(function () {
  const VIEW_KEY = 'sumi-active-view';
  const VIEW_META = {
    'view-obj': {
      title: 'Gasto Publicitario',
      caption: 'Leads en Google Ads',
      status: 'Fuente pendiente de validar',
      source: 'Fuente: data/sumi-lima-retail-2026.json',
      footer: 'Resultados de pauta digital',
    },
    'view-projections': {
      title: 'Proyecciones',
      caption: 'Cierre de mes y simulador de objetivo',
      status: 'Proyección sobre datos reales',
      source: 'Fuente: Gasto Publicitario / carpeta Google Ads SUMI Campañas',
      footer: 'Proyección lineal según el ritmo del mes',
    },
    'view-keywords': {
      title: 'Análisis de Palabras Clave',
      caption: 'Comportamiento de las palabras clave por campaña',
      status: 'Informe de palabras clave de Google Ads',
      source: 'Fuente: data/sumi-palabras-clave-2026.json (Drive: Google Ads SUMI Keywords)',
      footer: 'Sincronización diaria con Drive y botón Actualizar',
    },
    'view-week': {
      title: 'Generación de Reporte',
      caption: 'Reporte de Publicidad en PDF',
      status: 'Mes elegido de los informes de Google Ads',
      source: 'Fuente: Gasto Publicitario y Palabras Clave (informes de Google Ads)',
      footer: 'El mes elegido, listo para descargar en PDF',
    },
    'view-leads': {
      title: 'Leads',
      caption: 'CRM de feedback del cliente',
      status: 'Leads reales frente a las plataformas',
      source: 'Fuente: hoja privada del CRM y Gasto Publicitario',
      footer: 'Los datos del cliente se guardan en la hoja de Google de la agencia, no en el repositorio',
    },
  };

  function storedView() {
    try {
      const value = window.localStorage.getItem(VIEW_KEY);
      return VIEW_META[value] ? value : 'view-obj';
    } catch {
      return 'view-obj';
    }
  }

  function saveView(viewId) {
    try {
      window.localStorage.setItem(VIEW_KEY, viewId);
    } catch {
      // La navegación sigue funcionando aunque localStorage no esté disponible.
    }
  }

  function showView(viewId) {
    const meta = VIEW_META[viewId] || VIEW_META['view-obj'];
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('visible', view.id === viewId);
    });
    document.querySelectorAll('[data-view-target]').forEach(button => {
      const active = button.dataset.viewTarget === viewId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });

    document.getElementById('topbar-title').textContent = meta.title;
    document.getElementById('topbar-caption').textContent = meta.caption;
    document.getElementById('topbar-status').textContent = meta.status;
    document.getElementById('footer-source').textContent = meta.source;
    document.getElementById('footer-status').textContent = meta.footer;
    // La barra superior adapta lo que muestra a la vista (el boton Sincronizar no va en todas).
    document.body.dataset.view = viewId;
    saveView(viewId);

    if (viewId === 'view-projections') window.SumiProjections?.init();
    if (viewId === 'view-keywords') window.SumiKeywords?.init();
    if (viewId === 'view-week') window.SumiReport?.init();
    if (viewId === 'view-leads') window.SumiLeads?.init();
    // Vuelve a poner el mes en la barra superior, que la vista anterior reemplazo.
    if (viewId === 'view-obj' && window.SumiDashboard?.getData()) window.SumiDashboard.render();
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  function initNavigation() {
    document.querySelectorAll('[data-view-target]').forEach(button => {
      button.addEventListener('click', () => showView(button.dataset.viewTarget));
    });
    showView(storedView());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();
