(function () {
  // Generacion de Reporte: el PDF de publicidad con el diseño del modelo de SUMI ("Modelo Reporte SUMI"): laminas
  // 16:9 con portada, resumen del mes (8 KPIs y clics y conversiones por dia), rendimiento por campaña, palabras
  // clave que convierten, conclusiones y cierre.
  //
  // No trae datos nuevos: el periodo, los totales, las campañas y las palabras clave del mes salen de Gasto
  // Publicitario (window.SumiGasto), asi que cada sincronizacion con Drive lo actualiza sola. La lectura del
  // grafico, los analisis y las conclusiones vienen propuestos con lo que dicen los numeros; el equipo los
  // reescribe sobre la misma lamina y quedan guardados por mes en este navegador.
  //
  // El template es propio de SUMI: cada tablero de marca tiene el suyo, adaptado por la marca.
  const BRAND = 'SUMI';
  const NOTES_KEY = 'sumi_report_notes_v1';
  const MAX_ROWS = 7;
  const MAX_BARS = 5;
  const PAGE_WIDTH = 1280;
  const LOGO = 'assets/logo-lima-retail.png';
  const CHANNEL = 'Google Ads · Search';
  const SCOPE = 'Campaña de búsqueda B2B (seguridad industrial / EPP) para contactos';
  const CLICKS_COLOR = '#2563eb';
  const CONV_COLOR = '#16a34a';
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    line: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.pulse}</svg>`;

  const state = { month: '', wired: false };

  const G = () => window.SumiGasto;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const isNum = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

  // ── Formatos del modelo ("S/ 471", "S/ 1.83", "52.1%", "202.5") ──────────
  const integer = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
  const money = value => (isNum(value) ? `S/ ${integer.format(Math.round(value))}` : '—');
  const money2 = value => (isNum(value) ? `S/ ${Number(value).toFixed(2)}` : '—');
  const count = value => (isNum(value) ? integer.format(Math.round(value)) : '—');
  // Google Ads reparte conversiones entre palabras: en la tabla van con su decimal si lo tienen (202.5).
  const conv = value => (!isNum(value) ? '—' : Math.abs(value - Math.round(value)) < 0.005 ? integer.format(Math.round(value)) : Number(value).toFixed(1));
  const rate = value => (isNum(value) ? `${(Number(value) * 100).toFixed(1)}%` : '—');
  const pageNumber = value => String(value).padStart(2, '0');
  const list = items => (items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : items[0] || '');

  // ── El mes del reporte ─────────────────────────────────────────────────
  function months() {
    if (!G()) return [];
    return G().months().slice().reverse().map(month => {
      const period = G().period(month.key);
      if (!period) return null;
      const from = month.firstDay;
      const to = month.lastDay;
      const short = month.shortName.toLowerCase();
      const range = `${from} – ${to}`;
      return {
        id: month.key,
        month,
        period,
        from,
        to,
        days: to - from + 1,
        option: `${month.name} ${month.year}${period.closed ? '' : ` · ${from}–${to} (en curso)`}`,
        labels: {
          cover: period.closed ? `${month.name} ${month.year}` : `${range} ${month.name} ${month.year}`,
          window: period.closed ? `${month.name.toLowerCase()} completo` : `${range} ${short}.`,
          source: `Fuente: Google Ads · ${range} ${short} ${month.year}`,
          analysisSource: `Fuente: análisis Lima Retail sobre Google Ads · ${range} ${short} ${month.year}`,
          footer: `${BRAND} · Reporte Google Ads · ${period.closed ? `${month.name} ${month.year}` : `${from}-${to} ${month.name} ${month.year}`}`,
          note: `**Datos del período ${range} de ${month.name.toLowerCase()}.** Las conversiones son contactos generados por la campaña de búsqueda.`,
          file: `${month.name}${month.year}${period.closed ? '' : `_${from}-${to}`}`,
        },
      };
    }).filter(Boolean);
  }

  // Clics y conversiones por dia: del informe por dia y campaña del mes (month.detail) cuando llega.
  function dailySeries(item) {
    const detail = Array.isArray(item.month.detail) ? item.month.detail : [];
    const byDay = new Map();
    detail.forEach(row => {
      if (row.d < item.from || row.d > item.to) return;
      const day = byDay.get(row.d) || { d: row.d, clicks: 0, conversions: 0 };
      day.clicks += Number(row.clicks) || 0;
      day.conversions += Number(row.conversions) || 0;
      byDay.set(row.d, day);
    });
    return [...byDay.values()].sort((left, right) => left.d - right.d);
  }

  function campaigns(period) {
    return G().campaigns(period).map(campaign => Object.assign({}, campaign, {
      name: campaign.label || G().campaignLabel(campaign.name),
      costPerConversion: Number(campaign.conversions) > 0 ? campaign.cost / campaign.conversions : null,
    }));
  }

  // Palabras clave del mes, de mas a menos conversiones. La misma palabra en varias campañas o con dos
  // concordancias va en una sola fila.
  function keywords(period) {
    const source = G().keywords(period);
    if (!source) return null;
    const byName = new Map();
    source.forEach(row => {
      const name = String(row.keyword || '').trim().toLowerCase();
      if (!byName.has(name)) byName.set(name, { keyword: String(row.keyword || '').trim(), conversions: 0, cost: 0, impressions: 0, clicks: 0 });
      const entry = byName.get(name);
      ['conversions', 'cost', 'impressions', 'clicks'].forEach(field => { entry[field] += Number(row[field]) || 0; });
    });
    const rows = [...byName.values()]
      .map(row => Object.assign(row, { costPerConversion: row.conversions > 0 && row.cost > 0 ? row.cost / row.conversions : null }))
      .filter(row => row.conversions > 0 || row.cost > 0 || row.clicks > 0)
      .sort((left, right) => right.conversions - left.conversions || right.cost - left.cost);
    return { rows, total: rows.reduce((sum, row) => sum + row.conversions, 0) };
  }

  function buildReport(item) {
    const current = G().totals(item.period);
    return {
      item,
      labels: item.labels,
      current,
      days: dailySeries(item),
      campaigns: campaigns(item.period),
      keywords: keywords(item.period),
    };
  }

  // ── Textos propuestos (el equipo los reescribe sobre la lamina) ─────────
  function suggestChartNote(report) {
    const rows = report.days;
    if (rows.length < 3) return '';
    const clicks = rows.map(day => day.clicks);
    const mean = clicks.reduce((sum, value) => sum + value, 0) / clicks.length;
    const spread = Math.sqrt(clicks.reduce((sum, value) => sum + (value - mean) ** 2, 0) / clicks.length);
    const peak = rows.reduce((best, day) => (day.conversions > best.conversions ? day : best), rows[0]);
    const flow = mean > 0 && spread / mean < 0.25 ? 'Flujo muy constante' : mean > 0 && spread / mean < 0.45 ? 'Flujo constante' : 'Flujo irregular';
    return `${flow}; pico de conversiones el día ${peak.d} (${conv(peak.conversions)}).`;
  }

  function suggestKey(report) {
    const { current } = report;
    if (!(current.conversions > 0)) return `${money(current.cost)} de inversión sin contactos registrados en el período: conviene revisar la medición de conversiones y la landing.`;
    const high = current.conversionRate >= 0.3;
    const share = current.conversionRate >= 0.5 ? 'más de la mitad' : 'buena parte';
    const channel = current.costPerConversion < 5 ? 'es muy eficiente para captar' : 'capta';
    return `${count(current.conversions)} contactos a ${money2(current.costPerConversion)} con una tasa de conversión ${high ? 'altísima' : 'de'} (${rate(current.conversionRate)})${high ? `: ${share} de los clics se convierten en contacto` : ''}. El canal de búsqueda ${channel} demanda B2B de seguridad industrial.`;
  }

  function suggestCampaigns(report) {
    const rows = report.campaigns;
    if (!rows.length) return '**Qué funciona:** sin campañas con inversión en el período.';
    if (rows.length === 1) {
      const [only] = rows;
      return `**Qué funciona:** la campaña ${only.conversions > 0 ? `rinde ${only.costPerConversion < 5 ? 'muy bien' : 'bien'} — ${count(only.conversions)} contactos a ${money2(only.costPerConversion)}` : 'todavía no registra contactos'}. **Qué hacemos:** ${only.conversions > 0 ? 'el canal capta demanda B2B de forma eficiente; conviene sostener la inversión y ampliar presupuesto en los términos de mejor conversión para escalar los contactos.' : 'revisar la medición de conversiones y los términos antes de subir la inversión.'}`;
    }
    const converting = rows.filter(row => row.conversions > 0).sort((left, right) => right.conversions - left.conversions);
    const wasted = rows.filter(row => !(row.conversions > 0) && row.cost > 0);
    const top = converting[0];
    return `**Qué funciona:** ${top ? `"${top.name}" lidera con ${count(top.conversions)} contactos a ${money2(top.costPerConversion)}.` : 'ninguna campaña registró contactos.'}${wasted.length ? ` **Qué mejoramos:** ${list(wasted.map(row => `"${row.name}"`))} ${wasted.length > 1 ? 'gastaron' : 'gastó'} ${money(wasted.reduce((sum, row) => sum + row.cost, 0))} sin convertir.` : ''} **Qué hacemos:** concentrar el presupuesto en las campañas que cierran contactos.`;
  }

  function suggestKeywords(report) {
    const { rows, total } = report.keywords;
    const converting = rows.filter(row => row.conversions > 0);
    if (!converting.length) return 'Ningún término cerró contactos en el período: conviene revisar la intención de las palabras clave y la landing.';
    const [top] = converting;
    const parts = [`"${top.keyword}" concentra ${count(top.conversions)} de los ${count(total)} contactos (${Math.round((top.conversions / total) * 100)}%)${isNum(top.costPerConversion) ? ` a ${money2(top.costPerConversion)}` : ''}.`];
    // El mas barato entre los terminos de la tabla, para que el texto hable de lo que se ve en la lamina.
    const cheapest = converting.slice(0, MAX_ROWS).filter(row => isNum(row.costPerConversion) && row !== top).sort((left, right) => left.costPerConversion - right.costPerConversion)[0];
    if (cheapest) parts.push(`"${cheapest.keyword}" es el más barato (${money2(cheapest.costPerConversion)}).`);
    parts.push('El foco de demanda está en calzado de seguridad y EPP.');
    return parts.join(' ');
  }

  function suggestConclusions(report) {
    const { current, keywords: kw } = report;
    const cards = [];
    if (current.conversions > 0) {
      const high = current.conversionRate >= 0.3;
      cards.push({
        icon: 'trend',
        title: high ? 'Tasa de conversión altísima' : 'Tasa de conversión',
        text: `${Math.round(current.conversionRate * 100)}% de los clics se convierten en contacto, a ${money2(current.costPerConversion)} cada uno.${high ? ' La landing y los términos están muy bien alineados con la intención de compra.' : ' Hay espacio para mejorar la landing y los términos.'}`,
      });
    }
    const top = kw && kw.rows.find(row => row.conversions > 0);
    if (top && kw.total > 0) {
      const name = top.keyword.charAt(0).toUpperCase() + top.keyword.slice(1);
      const others = kw.rows.filter(row => row !== top && row.conversions > 0).slice(0, 2).map(row => row.keyword);
      cards.push({
        icon: 'search',
        title: `${name} es el motor`,
        text: `${Math.round((top.conversions / kw.total) * 100)}% de los contactos vienen de este término. Reforzar la puja aquí${others.length ? ` y en ${list(others)}` : ''} para escalar el volumen.`,
      });
    }
    if (current.conversions > 0) {
      const efficient = current.costPerConversion < 5 && current.conversionRate >= 0.2;
      cards.push({
        icon: 'line',
        title: efficient ? 'Ampliar presupuesto' : 'Optimizar antes de escalar',
        text: efficient
          ? `Con un costo por contacto tan bajo (${money2(current.costPerConversion)}) y conversión del ${Math.round(current.conversionRate * 100)}%, hay margen para subir la inversión y captar más demanda sin perder eficiencia.`
          : `El costo por contacto es ${money2(current.costPerConversion)}: conviene ajustar pujas y términos antes de subir la inversión.`,
      });
    }
    return cards.slice(0, 3);
  }

  // ── Textos guardados por mes ───────────────────────────────────────────
  function readNotes() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(NOTES_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function writeNotes(notes) {
    try {
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      // Sin localStorage el texto dura hasta recargar; el PDF se descarga igual.
    }
  }

  function saveNote(monthId, key, value) {
    const notes = readNotes();
    notes[monthId] = Object.assign({}, notes[monthId] || {}, { [key]: value });
    writeNotes(notes);
  }

  function resetNotes(monthId) {
    const notes = readNotes();
    delete notes[monthId];
    writeNotes(notes);
  }

  // **texto** va en negrita, como "Que funciona:" en el modelo.
  const rich = text => esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const editable = (key, text, tag = 'p', className = '') => `<${tag} class="rp-edit ${className}" data-note="${esc(key)}" data-raw="${esc(text)}" title="Clic para editar · **texto** va en negrita">${rich(text)}</${tag}>`;
  const noteOr = (notes, key, suggested) => (notes[key] != null ? notes[key] : suggested);

  // ── Piezas de las laminas ──────────────────────────────────────────────
  const kpi = (label, value, foot) => `
    <div class="rp-card rp-kpi">
      <span class="rp-kpi-label">${esc(label)}</span>
      <strong>${value}</strong>
      <span class="rp-delta muted">${esc(foot)}</span>
    </div>`;

  const head = (title, sub) => `<header class="rp-head"><h2>${esc(title)}</h2><p>${esc(sub)}</p></header>`;

  function footer(left, report, page, total) {
    return `
      <footer class="rp-foot">
        <span>${esc(left)}</span>
        <span class="rp-foot-right"><img src="${LOGO}" alt=""><b>Lima Retail</b>${esc(report.labels.footer)} · ${pageNumber(page)} / ${pageNumber(total)}</span>
      </footer>`;
  }

  const insight = (label, iconName, key, text) => `
    <div class="rp-insight">
      <span class="rp-insight-icon">${icon(iconName)}</span>
      <div>
        <span class="rp-insight-label">${label}</span>
        ${editable(key, text)}
      </div>
    </div>`;

  // Clics y conversiones por dia, con lineas de referencia (como el modelo).
  function dailyChart(report) {
    const rows = report.days;
    if (!rows.length) {
      return '<p class="rp-empty rp-chart-empty">El informe por día de este mes todavía no está en el tablero: la evolución diaria aparece cuando se suba a Drive el informe de campaña por día.</p>';
    }
    const width = 1160;
    const top = 16;
    const bottom = 236;
    const left = 70;
    const right = width - 30;
    const clicks = rows.map(day => day.clicks);
    const conversions = rows.map(day => day.conversions);
    const peak = Math.max(...clicks, ...conversions, 1);
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find(size => peak / size <= 4) || 1000;
    const max = Math.ceil(peak / step) * step;
    const x = index => (rows.length > 1 ? left + ((right - left) * index) / (rows.length - 1) : (left + right) / 2);
    const y = value => bottom - (value / max) * (bottom - top);
    const grid = [];
    for (let value = step; value <= max; value += step) {
      grid.push(`<line x1="${left - 18}" x2="${right + 12}" y1="${y(value)}" y2="${y(value)}" class="rp-grid"/><text x="${left - 40}" y="${y(value) + 4}" text-anchor="end" class="rp-tick big">${integer.format(value)}</text>`);
    }
    const line = (values, color) => `
      <polyline points="${values.map((value, index) => `${x(index)},${y(value)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>
      ${values.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="3.4" fill="#fff" stroke="${color}" stroke-width="1.8"/>`).join('')}`;
    return `
      <svg class="rp-chart rp-chart-daily" viewBox="0 0 ${width} 262" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Clics y conversiones por día">
        ${grid.join('')}
        <line x1="${left - 18}" x2="${right + 12}" y1="${bottom}" y2="${bottom}" class="rp-grid"/>
        ${line(clicks, CLICKS_COLOR)}
        ${line(conversions, CONV_COLOR)}
        ${rows.map((day, index) => (rows.length > 12 && index % 2 ? '' : `<text x="${x(index)}" y="${bottom + 20}" text-anchor="middle" class="rp-axis big">${String(day.d).padStart(2, '0')}</text>`)).join('')}
      </svg>`;
  }

  // Barras horizontales de conversiones por termino: el primero en azul fuerte, el resto en azul claro.
  function keywordBars(rows) {
    const top = rows.filter(row => row.conversions > 0).slice(0, MAX_BARS);
    if (!top.length) return '<p class="rp-empty">Sin conversiones por término en el período.</p>';
    const max = Math.max(...top.map(row => row.conversions));
    return `
      <div class="rp-bars">
        <div class="rp-bars-title">Top keywords por conversión</div>
        ${top.map((row, index) => `
          <div class="rp-bar-row">
            <span class="rp-bar-label" title="${esc(row.keyword)}">${esc(row.keyword)}</span>
            <span class="rp-bar-track"><i class="${index === 0 ? 'lead' : ''}" style="width:${Math.max((row.conversions / max) * 100, 2)}%"></i></span>
            <b>${count(row.conversions)}</b>
          </div>`).join('')}
      </div>`;
  }

  // ── Laminas ────────────────────────────────────────────────────────────
  function coverPage(report) {
    return `
      <section class="rp-page rp-cover">
        <div class="rp-brand"><img src="${LOGO}" alt="Lima Retail"><div><b>Lima Retail</b><span>Data Driven Marketing</span></div></div>
        <div class="rp-cover-body">
          <h1>Reporte de Publicidad</h1>
          <p class="rp-cover-client">Cliente: <b>${BRAND}</b></p>
          <p class="rp-cover-period">${esc(report.labels.cover)}&nbsp; | &nbsp;${esc(CHANNEL)}</p>
        </div>
      </section>`;
  }

  function summaryPage(report, notes, total) {
    const { current, item, keywords: kw } = report;
    const activeTerms = kw ? kw.rows.filter(row => row.clicks > 0 || row.cost > 0).length : null;
    const cards = [
      kpi('Inversión', money(current.cost), 'Coste'),
      kpi('Conversiones', count(current.conversions), 'Contactos'),
      kpi('Costo/conv.', money2(current.costPerConversion), 'Coste÷conv'),
      kpi('Clics', count(current.clicks), 'Al enlace'),
      kpi('CPC medio', money2(current.cpc), 'Costo por clic'),
      kpi('Tasa conv.', rate(current.conversionRate), 'Conv ÷ clics'),
      kpi('Contactos/día', isNum(current.conversions) && item.days > 0 ? (current.conversions / item.days).toFixed(1) : '—', 'Promedio'),
      kpi('Términos activos', activeTerms === null ? '—' : count(activeTerms), 'Keywords'),
    ];
    return `
      <section class="rp-page">
        ${head('Resumen del mes', `${SCOPE} · ${report.labels.window}`)}
        <div class="rp-body">
          <div class="rp-grid-4">${cards.join('')}</div>
          <div class="rp-card rp-chart-card rp-chart-wide">
            <div class="rp-card-row">
              <div>
                <div class="rp-card-title">Clics y conversiones por día</div>
                ${editable('grafico', noteOr(notes, 'grafico', suggestChartNote(report)), 'div', 'rp-card-sub')}
              </div>
              ${report.days.length ? `<span class="rp-legends"><span class="rp-legend"><i style="background:${CLICKS_COLOR}"></i>Clics</span><span class="rp-legend"><i style="background:${CONV_COLOR}"></i>Conversiones</span></span>` : ''}
            </div>
            ${dailyChart(report)}
          </div>
          ${insight('Clave', 'pulse', 'clave', noteOr(notes, 'clave', suggestKey(report)))}
        </div>
        ${footer(report.labels.source, report, 2, total)}
      </section>`;
  }

  function campaignsPage(report, notes, total) {
    const rows = report.campaigns;
    const body = rows.length ? rows.map((row, index) => `
      <tr${index === 0 ? ' class="rp-top"' : ''}>
        <td class="rp-name" title="${esc(row.name)}">${esc(row.name)}</td>
        <td class="num">${money(row.cost)}</td>
        <td class="num">${count(row.clicks)}</td>
        <td class="num">${row.conversions > 0 ? `<b>${count(row.conversions)}</b>` : '<span class="rp-faint">0</span>'}</td>
        <td class="num">${row.conversions > 0 ? money2(row.costPerConversion) : '<span class="rp-faint">—</span>'}</td>
      </tr>`).join('') : '<tr><td colspan="5" class="rp-empty">Sin campañas con inversión en el período.</td></tr>';
    const foot = rows.length === 1
      ? 'Toda la inversión va a una campaña de búsqueda hacia la landing page.'
      : `Total: ${money(report.current.cost)} · ${count(report.current.clicks)} clics · ${count(report.current.conversions)} conversiones · costo por conversión promedio ${money2(report.current.costPerConversion)}.`;
    return `
      <section class="rp-page">
        ${head('Rendimiento por campaña', rows.length === 1 ? 'La campaña de búsqueda activa en el período.' : 'Las campañas de búsqueda activas en el período, por inversión.')}
        <div class="rp-body">
          <div class="rp-card rp-table-card">
            <table class="rp-table">
              <colgroup><col style="width:33%"><col><col><col><col style="width:24%"></colgroup>
              <thead><tr><th>Campaña</th><th class="num">Coste</th><th class="num">Clics</th><th class="num">Conv.</th><th class="num">Costo/conv.</th></tr></thead>
              <tbody>${body}</tbody>
            </table>
            <div class="rp-table-foot">${esc(foot)}</div>
          </div>
          ${insight('Análisis', 'search', 'campanas', noteOr(notes, 'campanas', suggestCampaigns(report)))}
        </div>
        ${footer(report.labels.source, report, 3, total)}
      </section>`;
  }

  function keywordsPage(report, notes, total) {
    const data = report.keywords;
    if (!data) {
      return `
        <section class="rp-page">
          ${head('Palabras clave que convierten', 'Los términos que generan contactos, por conversiones y costo.')}
          <div class="rp-body"><p class="rp-empty rp-chart-empty">Cargando el informe de palabras clave...</p></div>
          ${footer(report.labels.source, report, 4, total)}
        </section>`;
    }
    const rows = data.rows.slice(0, MAX_ROWS);
    const body = rows.length ? rows.map((row, index) => {
      const zero = !(row.conversions > 0);
      return `<tr${index === 0 && !zero ? ' class="rp-top"' : ''}>
        <td class="rp-name" title="${esc(row.keyword)}">${esc(row.keyword)}</td>
        <td class="num">${money(row.cost)}</td>
        <td class="num">${count(row.clicks)}</td>
        <td class="num">${zero ? '<span class="rp-faint">0</span>' : index === 0 ? `<b>${conv(row.conversions)}</b>` : conv(row.conversions)}</td>
        <td class="num">${zero || !isNum(row.costPerConversion) ? '<span class="rp-faint">—</span>' : money2(row.costPerConversion)}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="5" class="rp-empty">Sin palabras clave con actividad en el período.</td></tr>';
    return `
      <section class="rp-page">
        ${head('Palabras clave que convierten', 'Los términos que generan contactos, por conversiones y costo.')}
        <div class="rp-body">
          <div class="rp-split rp-split-even rp-split-top">
            <div class="rp-card rp-table-card">
              <div class="rp-card-title">Desglose por término</div>
              <table class="rp-table rp-keywords">
                <colgroup><col><col style="width:14%"><col style="width:12%"><col style="width:13%"><col style="width:15%"></colgroup>
                <thead><tr><th>Palabra clave</th><th class="num">Coste</th><th class="num">Clics</th><th class="num">Conv.</th><th class="num">C/conv.</th></tr></thead>
                <tbody>${body}</tbody>
              </table>
            </div>
            <div class="rp-card rp-table-card">
              <div class="rp-card-title">Conversiones por término</div>
              ${keywordBars(data.rows)}
            </div>
          </div>
          ${insight('Qué funciona', 'trend', 'palabras', noteOr(notes, 'palabras', suggestKeywords(report)))}
        </div>
        ${footer(report.labels.source, report, 4, total)}
      </section>`;
  }

  function conclusionsPage(report, notes, total) {
    const cards = suggestConclusions(report).map((card, index) => `
      <div class="rp-card rp-conclusion">
        <div class="rp-toc-top"><span class="rp-icon framed">${icon(card.icon)}</span><span class="rp-concl-num">${pageNumber(index + 1)}</span></div>
        ${editable(`concl:${index}:title`, noteOr(notes, `concl:${index}:title`, card.title), 'h3')}
        ${editable(`concl:${index}:text`, noteOr(notes, `concl:${index}:text`, card.text))}
      </div>`).join('');
    return `
      <section class="rp-page">
        ${head('Conclusiones · qué está funcionando', 'Lo que rinde y qué priorizar el próximo período.')}
        <div class="rp-body">
          <div class="rp-grid-3 rp-conclusions">${cards}</div>
          <div class="rp-note">${rich(report.labels.note)}</div>
        </div>
        ${footer(report.labels.analysisSource, report, 5, total)}
      </section>`;
  }

  function closingPage() {
    return `
      <section class="rp-page rp-closing">
        <img src="${LOGO}" alt="Lima Retail">
        <b>Lima Retail</b>
        <span class="rp-closing-tag">Data Driven Marketing</span>
        <span>Power KPI · Digital Analytics</span>
      </section>`;
  }

  // ── Pintado ────────────────────────────────────────────────────────────
  function fitDeck() {
    const host = document.getElementById('week-report');
    if (!host || !host.clientWidth) return;
    host.style.setProperty('--rp-scale', String(Math.min(1, host.clientWidth / PAGE_WIDTH)));
  }

  function wireEditables(host, monthId) {
    host.querySelectorAll('[data-note]').forEach(node => {
      try {
        node.contentEditable = 'plaintext-only';
      } catch (error) {
        node.contentEditable = 'true';
      }
      node.spellcheck = false;
      node.addEventListener('focus', () => { node.textContent = node.dataset.raw; });
      node.addEventListener('input', () => {
        node.dataset.raw = node.innerText.replace(/\n+$/, '');
        saveNote(monthId, node.dataset.note, node.dataset.raw);
      });
      node.addEventListener('blur', () => { node.innerHTML = rich(node.dataset.raw); });
    });
  }

  function render() {
    const host = document.getElementById('week-report');
    if (!host || !G()) return;
    const available = months();
    const select = document.getElementById('week-select');
    if (!available.length) {
      if (select) select.innerHTML = '<option value="">Sin meses con datos</option>';
      host.innerHTML = '<div class="panel"><div class="empty-state"><strong>Todavia no hay datos para el reporte</strong><span>El reporte se arma con los informes de Google Ads. En cuanto haya un mes con inversion, aparece aqui.</span></div></div>';
      return;
    }
    if (!available.some(item => item.id === state.month)) state.month = available[0].id;
    const item = available.find(entry => entry.id === state.month);
    if (select) {
      select.innerHTML = available.map(entry => `<option value="${esc(entry.id)}"${entry.id === state.month ? ' selected' : ''}>${esc(entry.option)}</option>`).join('');
    }
    const report = buildReport(item);
    const notes = readNotes()[item.id] || {};
    const total = 6;
    host.innerHTML = `
      <div class="rp-deck" id="week-doc">
        ${coverPage(report)}
        ${summaryPage(report, notes, total)}
        ${campaignsPage(report, notes, total)}
        ${keywordsPage(report, notes, total)}
        ${conclusionsPage(report, notes, total)}
        ${closingPage()}
      </div>`;
    fitDeck();
    wireEditables(host, item.id);
  }

  // El nombre del PDF lo pone el navegador con el titulo del documento: se cambia solo mientras imprime.
  function printReport() {
    const item = months().find(entry => entry.id === state.month);
    if (!item) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const title = document.title;
    document.title = `Reporte_SUMI_${item.labels.file}`;
    const restore = () => {
      document.title = title;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    window.setTimeout(restore, 2000);
  }

  function init() {
    render();
    if (state.wired) return;
    state.wired = true;
    const select = document.getElementById('week-select');
    if (select) {
      select.addEventListener('change', event => {
        state.month = event.target.value;
        render();
      });
    }
    const print = document.getElementById('week-print');
    if (print) print.addEventListener('click', printReport);
    // Sin dialogo de confirmacion: el boton vuelve directo a los textos propuestos del mes.
    const reset = document.getElementById('week-reset');
    if (reset) {
      reset.addEventListener('click', () => {
        if (!state.month) return;
        resetNotes(state.month);
        render();
      });
    }
    const host = document.getElementById('week-report');
    if (host && typeof window.ResizeObserver === 'function') new window.ResizeObserver(fitDeck).observe(host);
  }

  // Llega al cargar, al sincronizar con Drive y cuando terminan de cargar las palabras clave.
  const refresh = () => {
    if (document.getElementById('view-week')?.classList.contains('visible')) render();
  };
  window.addEventListener('sumi:data-ready', refresh);
  window.addEventListener('sumi:keywords-ready', refresh);

  window.SumiReport = { init, render };
})();
