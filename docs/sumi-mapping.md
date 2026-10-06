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
| `Campaña` | `campaign` | Tabla y eje del grafico |
| `Coste` | `cost` | KPI, grafico y tabla |
| `% Δ` despues de Coste | `costDelta` | Tabla |
| `CTR` | `ctr` | KPI, grafico y tabla |
| `% Δ` despues de CTR | `ctrDelta` | Tabla |
| `Clics` | `clicks` | KPI, grafico y tabla |
| `% Δ` despues de Clics | `clicksDelta` | Tabla |
| `Conv` | `conversions` | KPI, grafico y tabla |
| `% Δ` despues de Conv | `conversionsDelta` | Tabla |
| `Cos/con` | `costPerConversion` | KPI, grafico y tabla |
| `% Δ` despues de Cos/con | `costPerConversionDelta` | Tabla |
| Rango de fechas del informe | `period` (por mes) | Fecha de corte de Proyecciones |
| `Presupuesto` de campanas habilitadas | `dailyBudget` (por mes) | Presupuesto de Proyecciones |
| `Estado de la campaña` | `status` (por campana) | Proyeccion por campana |
| `Presupuesto` (tipo diario) | `dailyBudget` (por campana) | Proyeccion por campana |

## Palabras clave (informe de palabras clave de busqueda)

| Columna del informe | Campo JSON | Uso |
| --- | --- | --- |
| `Palabra clave` | `keyword` | Fila del cuadro de la campana |
| `Tipo de concordancia` | `matchType` | Debajo de la palabra clave; junto con ella identifica la fila mes a mes |
| `Campaña` | `campaign` | Un cuadro por campana; si el informe no la trae, la campana del mes en Gasto Publicitario |
| `Grupo de anuncios` | `adGroup` | Una palabra clave en varios grupos se suma en una fila |
| `Estado de palabras clave` | `state` | Guardado (Habilitado / Detenido) |
| `Estado` / `Motivos del estado` | `status` / `reasons` | Columna Estado; "campaña detenida" en todas = campana detenida |
| `Impr.` / `Clics` / `Costo` / `Conversiones` | `impressions` / `clicks` / `cost` / `conversions` | Base de todos los indicadores |
| `% impr. parte sup. búsqueda` | `topShare` (texto, p. ej. `< 10%`) | Columna Perdidas x ranking |
| `% impr. perdidas de la Búsqueda (ranking)` | `lostRank` (texto) | Columna Perdidas x ranking |

CTR, CPC, tasa y costo por conversion no se guardan: se calculan de las sumas. Las filas `Total: ...` se ignoran.

## Archivos clave

- `js/objectives.js`: logica de gasto publicitario, KPIs, grafico y tabla de resultados.
- `js/projections.js`: proyeccion al cierre y simulador de objetivo; lee `SumiDashboard.snapshot()`.
- `js/keywords.js`: analisis de palabras clave y boton Actualizar (lee las hojas de Drive desde el navegador).
- `data/sumi-lima-retail-2026.json`: fuente normalizada.
- `data/sumi-palabras-clave-2026.json`: informe de palabras clave normalizado (`scripts/sync-keywords.py`).
- `scripts/import-sumi-data.py`: importador CSV/XLSX.
- `scripts/build.js`: build estatico con data SUMI incrustada.
