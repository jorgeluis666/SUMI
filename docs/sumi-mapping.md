# Mapeo SUMI Lima Retail 2026

## Objetivo

Dashboard estatico de SUMI con lectura de gasto publicitario: marca, visual y modelo de datos propios.

## Identidad

- Marca principal: SUMI
- Acceso: clave en el secret `SUMI_PAGE_PASSWORD` (el build cifra el tablero; ver README)
- Titulo: `SUMI | Dashboard Lima Retail 2026`
- Paleta: azul SUMI `#194d9f` y azul marino `#041421` (sumiperu.com); el acceso usa el azul de LR Suite
- Enfoque: gasto publicitario en Google Ads (red de busqueda) para generar leads

## Campos reflejados

| Fuente Excel | Campo JSON | Uso |
| --- | --- | --- |
| `Campaña` | `campaign` | Distribucion por campana, un cuadro por campana (`campaignLabel()`) |
| `Coste` | `cost` | KPIs del periodo, graficos y distribucion |
| `% Δ` despues de Coste | `costDelta` | Guardado; el tablero compara con el mes calendario anterior |
| `CTR` | `ctr` | Guardado; el CTR se recalcula como clics / impresiones |
| `% Δ` despues de CTR | `ctrDelta` | Guardado (no se muestra) |
| `Clics` | `clicks` | KPIs, CTR, CPC, tasa de conversion y graficos |
| `% Δ` despues de Clics | `clicksDelta` | Guardado (no se muestra) |
| `Conv` | `conversions` | KPIs, costo y tasa de conversion, graficos |
| `% Δ` despues de Conv | `conversionsDelta` | Guardado (no se muestra) |
| `Cos/con` | `costPerConversion` | Guardado; se recalcula como inversion / conversiones |
| `% Δ` despues de Cos/con | `costPerConversionDelta` | Guardado (no se muestra) |
| `Tipo de campaña` | `type` (por campana) | Guardado (hoy todas son de Busqueda) |
| Rango de fechas del informe | `period` (por mes) | Titulo del periodo, mes en curso y prorrateo de la comparacion; fecha de corte de Proyecciones |
| `Presupuesto` de campanas habilitadas | `dailyBudget` (por mes) | Total de la distribucion; presupuesto de Proyecciones |
| `Estado de la campaña` | `status` (por campana) | Distribucion y cuadro por campana; proyeccion por campana |
| `Presupuesto` (tipo diario) | `dailyBudget` (por campana) | Distribucion y cuadro por campana; proyeccion por campana |

## Palabras clave (informe de palabras clave de busqueda)

| Columna del informe | Campo JSON | Uso |
| --- | --- | --- |
| `Palabra clave` | `keyword` | Fila del cuadro de la campana (Palabras Clave y Gasto Publicitario) y del ranking |
| `Tipo de concordancia` | `matchType` | Debajo de la palabra clave; junto con ella identifica la fila mes a mes |
| `Campaña` | `campaign` | Un cuadro por campana; si el informe no la trae, la campana del mes en Gasto Publicitario |
| `Grupo de anuncios` | `adGroup` | Una palabra clave en varios grupos se suma en una fila |
| `Estado de palabras clave` | `state` | Guardado (Habilitado / Detenido) |
| `Estado` / `Motivos del estado` | `status` / `reasons` | Columna Estado; "campaña detenida" en todas = campana detenida |
| `Impr.` / `Clics` / `Costo` / `Conversiones` | `impressions` / `clicks` / `cost` / `conversions` | Base de todos los indicadores |
| `% impr. parte sup. búsqueda` | `topShare` (texto, p. ej. `< 10%`) | Columna Perdidas x ranking |
| `% impr. perdidas de la Búsqueda (ranking)` | `lostRank` (texto) | Columna Perdidas x ranking |

CTR, CPC, tasa y costo por conversion no se guardan: se calculan de las sumas. Las filas `Total: ...` se ignoran.
Gasto Publicitario lee este JSON tal como lo publica el build, sin las campanas de `keywords.excludeCampaigns`.

## Leads (CRM de feedback, hoja privada)

Pestana "Leads por campana": una fila por mes y campana con lo que completa el cliente.

| Columna de la hoja | Uso |
| --- | --- |
| `mes` | Mes (AAAA-MM) |
| `plataforma` / `campana` | Google Ads, Meta Ads u Otro; nombre tecnico de la campana del informe |
| `leads` / `calificados` / `ventas` | Conteos enteros que completa el cliente (vacio = sin dato) |
| `monto` | Monto vendido en soles |
| `actualizado` | Marca de tiempo del Web App |

No se guardan en `data/`: viven en la hoja privada (`scripts/apps-script/crm-leads.gs`).

## Archivos clave

- `js/objectives.js`: Gasto Publicitario: pestanas de mes y Anual, periodo con KPIs, grafico de la cuenta,
  distribucion y cuadro por campana y ranking de palabras clave; expone `SumiDashboard` (`snapshot()`).
- `js/projections.js`: proyeccion al cierre y simulador de objetivo; lee `SumiDashboard.snapshot()`.
- `js/leads.js`: CRM de feedback del cliente (pestana Leads): tabla por campana con las columnas del cliente editables.
- `scripts/apps-script/crm-leads.gs`: Web App de la hoja privada donde se guarda lo que completa el cliente.
- `js/keywords.js`: analisis de palabras clave y boton Actualizar (lee las hojas de Drive desde el navegador).
- `data/sumi-lima-retail-2026.json`: fuente normalizada.
- `data/sumi-palabras-clave-2026.json`: informe de palabras clave normalizado (`scripts/sync-keywords.py`).
- `scripts/import-sumi-data.py`: importador CSV/XLSX.
- `scripts/build.js`: build estatico con data SUMI incrustada.
