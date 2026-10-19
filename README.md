# SUMI | Dashboard Lima Retail 2026

Dashboard de gasto publicitario en Google Ads de SUMI (Suministros & Proveedores Industriales S.A.C.,
sumiperu.com). La agencia gestiona campanas de la red de busqueda para generar leads. El tablero muestra la
cuenta de Google Ads de **Landing Page 001** (EPP y seguridad industrial, S/ 25 diarios). La campana de
temporada `CE | Search | Canastas Navideñas | Lima` (desde el 7 de setiembre de 2026) esta en otra cuenta y no
entra en el tablero: los informes de Drive tienen que salir de la cuenta de Landing Page 001.

Es una copia adaptada del tablero de Aquarius (`jorgeluis666/objetivos-Aquarius`), con los mismos modulos.

Version actual: `v1.2.0`.

## Acceso

- URL publica: **https://sumi.limaretail.com** (con clave, ver "Publicacion en sumi.limaretail.com").
- La clave no esta en el codigo: es el secret `SUMI_PAGE_PASSWORD` de GitHub.
- Entrada local: `index.html` (sin clave)
- Build publicado: `dist/index.html`

## Versionado

`vMAJOR.MINOR.PATCH`: `MAJOR` para cambios incompatibles, `MINOR` para modulos o funciones nuevas y `PATCH`
para correcciones. La version va en `package.json`, en los `?v=` de `index.html` y en la etiqueta de la barra
lateral.

## Modulo principal

- Titulo: `Gasto Publicitario`
- Subtitulo: `Leads en Google Ads`
- La sincronizacion (boton Sincronizar, ultimo y proximo barrido, carpetas de Drive) esta en la pildora de la barra
  superior derecha (ver Sincronizacion > Manual, desde el tablero).
- Logica en `js/objectives.js`. Sale del informe de campana de Google Ads (un total por mes,
  `data/sumi-lima-retail-2026.json`) y del informe de palabras clave (`data/sumi-palabras-clave-2026.json`, tal
  como lo publica el build).
- **Pestanas de mes**: Enero a Diciembre y **Anual**. Un mes sin informe de campana queda apagado y el punto
  marca el ultimo mes con datos. La eleccion se guarda en `sumi_selected_month` (`anual` incluido). Si falta el
  informe de un mes entre el primero y el ultimo, un aviso lo dice.
- **Periodo** (`Periodo: 1-30 Setiembre 2026`, o `1-4 Octubre 2026 (mes en curso)`) con 8 KPIs: inversion,
  impresiones, clics, CTR, CPC, conversiones, costo por conversion y tasa de conversion (conversiones / clics).
  Los cocientes se recalculan sobre las sumas.
  - Mes cerrado: contra el mes anterior completo. Mes en curso: contra el mes anterior **prorrateado a los
    mismos dias** ("vs Setiembre prorrateado a 4 dias"), porque el informe trae un total por mes; CTR, CPC,
    costo y tasa no cambian al prorratear. Solo el mes calendario anterior: si falta (setiembre, el primer mes),
    "Sin mes anterior para comparar" y no hay columnas de comparacion.
  - Flecha y color segun si subir es bueno: inversion neutra; CPC y costo por conversion, bajar es bueno.
  - Anual: acumulado de los meses con informe; los KPIs sumables muestran el promedio mensual de los meses
    cerrados en lugar de la variacion.
  - Los `*Delta` del JSON no se usan: comparan un mes en curso de pocos dias contra un mes completo.
- Debajo del periodo queda el grafico de la cuenta. En Anual queda en la vista Mes.
- **Distribucion de inversion por campana**: estado, presupuesto diario, inversion y su %, impresiones, clics,
  CTR, CPC, conversiones, costo por conversion y tasa de conversion, con el total del periodo. El nombre tecnico
  de la campana va en chico solo si difiere del corto. En Anual las campanas se suman por nombre y el estado y el
  presupuesto son los del ultimo mes.
- **Un cuadro por campana** (hoy una sola, `Landing Page 001`; la estructura aguanta mas):
  - KPIs con variacion: inversion, clics, CTR, CPC, conversiones, costo por conversion y presupuesto diario.
    El subtitulo dice contra que se compara, "Nueva: no corria en ..." o, en Anual, en que meses corrio.
  - Grafico **por mes** del ano, con hueco donde la campana no corrio. Indicadores: inversion y conversiones
    (por defecto), clics e impresiones; con varios, cada uno en su panel con su escala sobre el mismo eje.
    Acumulado del mes y Por dia no se ofrecen (no hay serie diaria por campana): quedan listos para cuando
    llegue un informe por dia y campana en `months[].detail`.
  - **Palabras clave de la campana** del mes: conversiones, conversiones del mes anterior y variacion ("Nuevo"
    si no estaba), costo por conversion, inversion y su % de la campana, impresiones, clics y CPC. Una palabra
    clave es su texto mas su concordancia, como en el modulo Palabras Clave. Solo se compara con el mes anterior
    si los dos informes son de mes completo o cubren los mismos dias; si no, las columnas de comparacion se
    ocultan. Si las palabras clave suman menos que la campana (palabras quitadas o con pocas impresiones), una
    linea lo dice.
  - Se minimiza con la flecha. Indicadores, vista y minimizado se recuerdan por campana
    (`sumi_gasto_campaign_charts`).
- **Ranking de palabras clave del periodo**: por conversiones dentro de cada campana, con la lider marcada
  con una estrella, conversiones del mes anterior y variacion. Cabecera fija, Campana y Palabra clave
  ancladas, filtro por campana, Compacto (`sumi_gasto_kw_compact`) y Pantalla completa (las pestanas
  de mes entran al panel; `Esc` sale). "Ver analisis completo" abre el modulo Palabras Clave, que sigue
  siendo el analisis a fondo.
- Solo aparece lo que tuvo actividad: campanas y palabras clave sin inversion, impresiones ni clics en el
  periodo no salen en ninguna tabla, cuadro ni grafico (`isActive`).
- Las palabras clave respetan `keywords.excludeCampaigns` de `data/drive-config.json`.
- Grafico de la cuenta con tres detalles, que se eligen con los botones del panel y
  quedan guardados en `localStorage`:
  - **Dia** (por defecto): un punto por dia del mes elegido.
  - **Semana**: bloques de siete dias contados desde el 1 del mes (1-7, 8-14,
    ...). Solo el ultimo bloque puede quedar corto y el tooltip avisa cuantos
    dias trae.
  - **Mes**: un punto por mes con todo lo que va del ano. El mes elegido se
    marca con un punto mas grande y un clic en cualquier punto cambia la pestana
    a ese mes.
- Dia y Semana necesitan la serie diaria del mes. Si el mes no la tiene, esos dos
  botones quedan apagados y el grafico muestra la vista Mes sin perder la
  eleccion anterior. Hoy ningun mes de SUMI tiene serie diaria: se puede cargar
  con `scripts/import-sumi-data.py` (ver "Importar archivos sueltos").
- Las lineas de inversion y resultados salen punteadas y marcadas `(est.)`
  cuando el mes solo tiene impresiones diarias: son el total del mes repartido
  entre los dias segun las impresiones, no cifras diarias reales.

## Proyecciones

El modulo Proyecciones (pestana del panel lateral) proyecta el cierre del mes con los datos reales de
Gasto Publicitario. No lee el JSON ni Drive por su cuenta: consume el snapshot de solo lectura
`window.SumiDashboard.snapshot()`:

```js
{ cutoff: '2026-10-04', source: 'SUMI octubre 2026', year: 2026, lastSync: '...',
  months: [{ id, name, label, cost, clicks, conversions, impressions, dailyBudget, budgetTotal, period, campaigns }] }
```

- **Fecha de corte**: fin del rango del informe de Google Ads (`period.end`, la linea
  "1 de octubre de 2026 - 4 de octubre de 2026" del informe), nunca posterior a hoy en Lima. El mes proyectado
  es el del corte; si no tiene inversion, el ultimo mes con datos.
- **Proyeccion**: ritmo diario = acumulado / dias con datos; cierre = ritmo x dias del mes. Si el informe
  ya cubre el mes completo, la proyeccion es igual al acumulado y el simulador se desactiva.
- **Indicadores**: Inversion (referencia = presupuesto), Clics y Conversiones (sin referencia).
- **Presupuesto**: suma de la columna Presupuesto (diario) de las campanas *habilitadas* del informe, por los
  dias del mes. Un presupuesto compartido se cuenta una vez. Es el presupuesto vigente al exportar el informe,
  no el historico: en meses pasados es solo una referencia.
- Cada `applyData` emite `sumi:data-ready` y el modulo se recalcula solo; si se abre antes de que
  carguen los datos muestra "Esperando los datos...".

### Simulador de objetivo

El ultimo punto de la linea proyectada es un nodo arrastrable: al moverlo se define el cierre deseado.

- El estado es un solo numero, `factor = cierre objetivo / cierre proyectado`, comun a los tres
  indicadores: el escenario conserva el CPC, el costo por conversion y la tasa de conversion del mes, asi
  que mover uno mueve los otros dos en la misma proporcion y cambiar de indicador conserva el escenario.
- El cierre objetivo nunca queda por debajo de lo ya realizado (`factor >= dias con datos / dias del mes`).
- Por indicador muestra el cierre objetivo, la diferencia contra la proyeccion, el ritmo diario requerido
  (para inversion, "Presupuesto diario requerido"), el ritmo actual, lo que falta realizar y la brecha contra
  el presupuesto. La cuarta tarjeta resume la inversion adicional o menor y la eficiencia que se conserva.
- Controles: arrastrar el nodo (escritorio), escribir el valor en "<Indicador> al cierre" (obligatorio en
  celular, donde arrastrar desplaza la pagina), "Llevar al presupuesto" y "Restablecer" (o doble clic sobre
  el nodo).
- El simulador se desactiva cuando el informe del mes proyectado ya cubre el mes completo.

### Proyeccion por campana

Un cuadro por campana del mes proyectado (el mismo de la linea de tiempo).

- Cada cuadro tiene inversion, clics y conversiones: real a la fecha de corte, ritmo diario y proyeccion al
  cierre, con el mismo metodo que la proyeccion general (ritmo diario de la campana x dias del mes).
- Presupuesto del mes = presupuesto diario de la campana x dias del mes, con una barra de avance de la
  proyeccion y lo que queda o excede. Es el presupuesto vigente al exportar el informe.
- Una campana con estado distinto de "Habilitada" (por ejemplo, "Detenida") cierra el mes con lo ya gastado.
- Tambien aparecen las campanas con gasto el mes anterior que aun no salen en el informe del mes, y cada
  cuadro muestra el gasto del mes anterior si su informe esta cargado.
- Con pocos dias de datos la proyeccion es muy sensible (un dia en cero proyecta cero): el cuadro lo avisa la
  primera semana del mes.

### Informe del mes en curso fuera de Drive

Un informe de campana descargado de Google Ads se puede cargar sin pasar por Drive, con el mismo parser:

```bash
python scripts/sync-drive.py --file "ruta/Informe de campaña.csv"
```

El mes se toma de la linea de rango del informe. Queda en el JSON como cualquier mes y la sincronizacion con
Drive lo conserva hasta que la carpeta traiga un informe del mismo mes, que entonces lo reemplaza. Lo ideal es
subir el informe a la carpeta como `SUMI <mes> <ano>` y reemplazarlo cada vez que se actualice.

## Analisis de Palabras Clave

Pestana **Palabras Clave** del panel lateral. Lee el informe de palabras clave de busqueda de Google Ads de la
carpeta de Drive **Google Ads SUMI Keywords**, una hoja de calculo por mes (`SUMI KW <mes> <ano>`):

<https://drive.google.com/drive/folders/1VdlVGjWTRItfPHM2TI1mr0RYja5fDPEX>

- **Filtros**: mes, campana (todas o una) e indicador de tendencia (clics, impresiones, costo, conversiones,
  CTR o costo por conversion). Quedan guardados en `localStorage` (`sumi_keywords_prefs`).
- **KPIs del mes**: palabras clave (y cuantas convierten), impresiones, clics, costo, conversiones, costo por
  conversion y gasto sin conversiones, con la variacion contra el mes anterior.
- **Un cuadro por campana**, ordenadas por costo, con sus totales y dos vistas:
  - **Detalle del mes**: una fila por palabra clave con estado, impresiones, clics, CTR, CPC, costo,
    conversiones, costo por conversion, % de impresiones perdidas por ranking, una linea de tendencia del
    indicador elegido en todos los meses (punto lleno = mes del filtro) con la variacion contra el mes
    anterior, y una **Lectura**: *Eficiente* (costo por conversion igual o menor al de su campana), *CPA alto*
    (mayor), *Gasta sin convertir* (costo sin conversiones), *Sin clics* o *Sin impresiones*.
  - **Evolucion mensual**: una fila por palabra clave y una columna por mes con el indicador elegido, con
    color por intensidad dentro de la fila y el acumulado del periodo.
- Una palabra clave se identifica por texto y concordancia dentro de su campana; si esta en varios grupos de
  anuncios se suma en una fila. CTR, CPC y costo por conversion se calculan sobre las sumas, como Google Ads.
- La campana se marca "Campaña detenida" cuando todas sus palabras clave traen ese motivo de estado.
- **Informe sin columna Campaña.** Un informe exportado desde dentro de una campana no trae la columna Campaña
  (sus totales dicen "Palabras clave de tu campaña"). En ese caso las palabras clave se asignan a la campana del
  informe de Gasto Publicitario del mismo mes, si es una sola; si no, quedan como "Campaña del informe". Lo
  mejor es exportar desde el nivel de cuenta, que trae la columna (asi estan los informes de Landing Page 001).
- Los informes de setiembre y octubre de 2026 no traen las columnas de cuota de impresiones, asi que
  "Perdidas x ranking" sale vacia.
- **Revisar el archivo antes de subirlo**: la primera linea debe decir "Informe de palabras clave de busqueda".
  Un "Informe de campaña" en esta carpeta se descarta.

### Datos y sincronizacion

- `scripts/sync-keywords.py` exporta cada hoja como CSV (`docs.google.com/spreadsheets/d/<id>/export?format=csv`,
  sin credenciales mientras la carpeta siga compartida por enlace) y escribe
  `data/sumi-palabras-clave-2026.json`, `data/keywords-manifest.json` y una copia de cada informe en
  `data/csv-backups/keywords/`. El mes sale de la linea de rango del informe ("1 de septiembre de 2026 - ...")
  y, si no esta, del nombre del archivo. Reusa los helpers de `scripts/sync-drive.py`.
- **Todos los dias**: es un paso mas de `.github/workflows/sync-drive.yml` (10:00 en Lima). Si cambio algo,
  hace commit y publica el tablero. Cada carpeta se sincroniza aunque la otra falle. Si la carpeta no trae
  ningun informe el paso falla (y el workflow queda en rojo), pero los meses ya cargados se conservan.
- **Boton Actualizar** (en el filtro): el navegador vuelve a leer las hojas de Drive y repinta el modulo sin
  recargar. La exportacion CSV de Sheets permite CORS, asi que **no necesita API key**; el resultado queda en
  `localStorage` (`sumi_keywords_cache`) y gana contra la publicacion mientras sea mas reciente. Sin API
  key usa la lista de hojas que dejo la ultima sincronizacion diaria: una hoja de un mes nuevo aparece al dia
  siguiente (o al correr el workflow a mano). Con `SUMI_DRIVE_API_KEY` incrustada en el build, el boton tambien
  lista la carpeta y encuentra los meses nuevos al instante.
- La carpeta y su ID estan en `data/drive-config.json` (`keywords.folderId`).
- **Campanas excluidas**: `keywords.excludeCampaigns` en `data/drive-config.json` lista campanas que no se
  muestran ni se guardan aunque vengan en el informe (hoy ninguna). Se filtran en la sincronizacion diaria, en
  el boton Actualizar y al mostrar. La copia cruda del informe en `data/csv-backups/keywords/` las conserva.
- Las hojas tienen que estar en **Google Ads SUMI Keywords**, que es la carpeta compartida por enlace. Una hoja en
  otra carpeta sin compartir (por ejemplo "Términos de Búsqueda SUMI") responde 401 y no se puede leer.

```bash
python scripts/sync-keywords.py          # sincroniza
python scripts/sync-keywords.py --check  # dice si hay cambios, sin escribir
python scripts/sync-keywords.py --file "SUMI KW octubre 2026.csv"  # importa un informe local
```

**Numeros dañados por Sheets.** Al convertir un CSV a hoja de calculo, Sheets puede leer los miles como
decimales y perder los ceros finales: `1,290` impresiones quedan como `1,29` y `1,200` como `1,2`. Como un grupo
de miles siempre tiene tres digitos, los parsers (palabras clave y campanas) los completan (`1,29` -> 1290). Los
valores tipo `08.03` (Sheets los leyo como fechas) se leen como 8.03. No hay que corregir nada a mano. Con eso las
sumas de cada mes cuadran con la fila "Total: Todas las palabras clave, excepto las quitadas" del informe (el
costo puede diferir en centimos por el redondeo por fila). Un CSV subido sin convertir tambien sirve para la
sincronizacion diaria, pero sin API key el boton Actualizar solo lee hojas de Google Sheets.


## Fuente de datos

El tablero se arma desde la carpeta de Google Drive **Google Ads SUMI Campañas**:

<https://drive.google.com/drive/folders/1Bmrx9yRMJCu8l4SCqvBOf0GdPWEMvvL6>

Una hoja de calculo por mes con el informe de campana de Google Ads (`SUMI <mes> <ano>`, con Costo, Impr.,
Clics, CTR, Conversiones, Costo/conv., Presupuesto y Estado de la campaña). Tambien sirve el CSV tal como lo
exporta Google Ads (`SUMI <mes> <ano>.csv`). Para agregar un mes basta con subir su informe a esa carpeta: la
sincronizacion lo detecta por el rango de fechas del archivo y lo suma a las pestanas de mes.

La fuente normalizada que consume el tablero es `data/sumi-lima-retail-2026.json`, agrupada por mes:

```json
{
  "defaultMonth": "2026-10",
  "drive": { "lastSync": "2026-10-06T06:17:40Z", "discovery": "publica", "files": [] },
  "months": [
    {
      "id": "2026-09",
      "label": "Setiembre 2026",
      "sourceFile": "SUMI setiembre 2026",
      "driveFileId": "1yT4b6KNxgU7pGMgOTexnz5wbvpId5-9j5oRRJIeLgQk",
      "records": [ /* una fila por campana, con estado, presupuesto diario y % de variacion */ ],
      "totals": { "cost": 725.33, "impressions": 11636, "clicks": 857, "conversions": 443.5 },
      "period": { "start": "2026-09-01", "end": "2026-09-30" },
      "dailyBudget": 25
    }
  ]
}
```

Los campos `*Delta` de cada campana (variacion contra el mes anterior cargado) los calcula la sincronizacion; el
tablero no los usa: compara con el mes calendario anterior (ver Modulo principal). Cada campana guarda tambien su
`type` (columna `Tipo de campaña`, si el informe la trae).
`period` es el rango de fechas del informe y `dailyBudget` la suma de presupuestos diarios de las campanas
habilitadas (ver Proyecciones); cada campana trae ademas su `status` y su `dailyBudget`. Las series diarias
(`daily`, opcionales) son independientes: la sincronizacion no las toca.

## Sincronizacion

### Automatica, todos los dias

`.github/workflows/sync-drive.yml` corre todos los dias a las **10:00 de Lima**,
baja las dos carpetas, actualiza `data/` y, solo si algo cambio, hace commit y pide la
publicacion del tablero. Tambien se puede lanzar a mano desde
**Actions > Sincronizar Drive > Run workflow**.

GitHub atrasa varias horas los workflows programados (en octubre de 2026 el de las
06:20 corria entre las 10:50 y las 15:20), asi que la hora la fija un activador de
**Google Apps Script** que lanza el workflow al momento
(`scripts/apps-script/sincronizar-sumi.gs`; Apps Script lo corre dentro de unos
15 minutos de las 10:00). El cron de las 15:00 UTC (10:00 en Lima) queda de
respaldo: si el activador falla, el barrido igual corre, mas tarde. Instalacion,
una sola vez:

1. En GitHub > Settings > Developer settings > Personal access tokens > Fine-grained
   tokens, crear un token solo para el repositorio `SUMI` con el permiso
   **Actions: Read and write**. Anotar su vencimiento para renovarlo.
2. En <https://script.google.com>, proyecto nuevo: pegar
   `scripts/apps-script/sincronizar-sumi.gs` y poner la zona horaria del proyecto
   en (GMT-05:00) Lima.
3. Configuracion del proyecto > Propiedades del script: `GITHUB_TOKEN` = el token. El
   token no va en el codigo ni en el repo.
4. Ejecutar `instalarActivador` una vez (aceptar los permisos) y luego
   `sincronizarSumi` para probar: en GitHub > Actions aparece la ejecucion.

La pildora de la barra superior muestra el ultimo barrido real (lo lee de la API
publica de GitHub, sin credenciales) y se pone ambar si fallo o si pasaron mas de
30 horas sin uno.

Para correrla en local:

```bash
python scripts/sync-drive.py          # sincroniza
python scripts/sync-drive.py --check  # dice si hay cambios, sin escribir
```

El script encuentra los archivos en este orden: API de Drive (si hay API key),
vista publica de la carpeta (sin credenciales, mientras siga compartida por
enlace) y, como ultimo recurso, `data/drive-manifest.json`. Las hojas de calculo
se exportan como CSV (`docs.google.com/spreadsheets/d/<id>/export?format=csv`).

### Manual, desde el tablero

La sincronizacion vive en la barra superior derecha. La pildora dice hasta que dia
llegan los datos y la hora del ultimo barrido; al pulsarla abre el detalle: datos, de
donde salen (Origen), meses cargados, ultimo y proximo barrido, cuando cambiaron los
datos, las dos carpetas de Drive (con enlace) y lo que falta subir. A su lado va el boton
**Sincronizar** (en Gasto Publicitario y Proyecciones; Palabras Clave tiene su propio
boton Actualizar). Si la sincronizacion falla, la pildora se pone ambar y el detalle
dice por que. Su comportamiento depende de `data/drive-config.json`:

- **Con `apiKey`**: el navegador lee la carpeta y los informes (hojas o CSV)
  directo de Drive, actualiza el tablero sin recargar y guarda el resultado en
  `localStorage`. Ademas se sincroniza solo cuando pasaron `autoSyncHours` horas
  (24 por defecto) desde la ultima vez.
- **Sin `apiKey`** (estado actual del sitio publicado): el boton trae la ultima
  publicacion y el Origen del detalle dice "Ultima publicacion del tablero". La
  carga diaria la sigue haciendo GitHub Actions.

Para habilitar la sincronizacion desde el navegador hace falta una **clave de
API de Google** (Google Cloud > APIs y servicios > Credenciales > Clave de API),
con la **Google Drive API** habilitada y la clave restringida a
`https://sumi.limaretail.com/*`. La clave no va en el repo: se guarda en el
secret **`SUMI_DRIVE_API_KEY`** y `scripts/build.js` la incrusta en el HTML
cifrado al publicar. Para probar en local se puede poner en `apiKey` dentro de
`data/drive-config.json` (sin commitearla).

Las carpetas deben seguir compartidas como "cualquiera con el enlace puede ver":
es lo que permite leerlas sin cuenta de servicio.

## Importar archivos sueltos

`scripts/import-sumi-data.py` sigue disponible para cargar un CSV o Excel
que no este en Drive, por ejemplo las series diarias de impresiones:

```bash
python scripts/import-sumi-data.py "ruta/al/archivo.csv" --month 2026-09
```

## Build

```bash
npm.cmd run build
```

El resultado se genera en `dist/`: `index.html` (CSS, JS y datos incrustados), `assets/` y `CNAME`.
Nada mas: `data/` (incluido `data/csv-backups`), `scripts/` y `docs/` no se publican.

Con `SUMI_PAGE_PASSWORD=<clave> npm run build` el `index.html` sale cifrado, como en GitHub Pages.

## Publicacion en sumi.limaretail.com (GitHub Pages)

Repositorio: `jorgeluis666/SUMI`. URL publica: **https://sumi.limaretail.com**. Cada push a `main` la actualiza
sola (`.github/workflows/deploy-pages.yml`).

Puesta en marcha (una sola vez):

1. **Settings > Secrets and variables > Actions**: crear `SUMI_PAGE_PASSWORD` (la clave del tablero, larga y
   aleatoria) y `SUMI_USERS_PRIVATE_KEY` (el contenido de `credentials/sumi-usuarios-privada.pem`).
   `SUMI_DRIVE_API_KEY` es opcional (ver "Manual, desde el tablero").
2. **Settings > Pages > Build and deployment > Source**: *GitHub Actions*.
3. **Actions > Publicar en GitHub Pages > Run workflow** (o un push a `main`).
4. **Settings > Pages > Custom domain**: `sumi.limaretail.com`, pulsar *Save* y, cuando el certificado este
   listo, marcar **Enforce HTTPS**.

Detalles:

- Pages publica con Actions (sube `dist/`), asi que el dominio propio se configura en **Settings > Pages >
  Custom domain** y queda guardado en el repo. Ademas `CNAME` (raiz) lleva el dominio y `build.js` lo copia a
  `dist/`, igual que en los demas tableros de la agencia.
- DNS en Banahosting (cPanel > Zone Editor > `limaretail.com`): registro **CNAME** `sumi` ->
  `jorgeluis666.github.io` (ya existe).
- **Clave:** Pages no tiene Basic Auth, asi que `scripts/build.js` cifra el tablero completo (datos y JS) con
  AES-256-GCM y una llave PBKDF2-SHA256 (600 000 iteraciones) derivada del secret **`SUMI_PAGE_PASSWORD`**.
  `deploy/pages-gate.html` pide la clave y lo descifra en el navegador; sin ella el HTML publicado no revela
  nada. Si falta el secret, o si `dist/index.html` sale sin cifrar, el workflow falla en vez de publicar.
  La pantalla usa el mismo diseno y el azul de LR Suite que el acceso de los demas tableros de la agencia
  (fondo `assets/login-bg.jpg`), pero la clave no esta escrita en el codigo.
- Es una sola clave compartida. Como el HTML cifrado es publico, se puede atacar sin limite de intentos: usar
  una clave larga y aleatoria (16+ caracteres). Para cambiarla: editar el secret `SUMI_PAGE_PASSWORD` y volver a
  ejecutar el workflow (Actions > Publicar en GitHub Pages > Run workflow).
- Tras entrar, la llave queda en `sessionStorage` de esa pestana para no pedir la clave al recargar; cada deploy
  genera una sal nueva, asi que despues de publicar se vuelve a pedir. Una pestana nueva tambien la pide.
- Las preferencias (mes elegido, vista y panel minimizado) viven en `localStorage` de cada dominio.
- El repo es publico: lo que esta en `data/` sigue siendo visible en GitHub aunque el sitio vaya con clave. La
  excepcion es el directorio de Usuarios y Claves, que va cifrado (ver "Cifrado del directorio").

## Marca

| Que | Donde |
| --- | --- |
| Isotipo de la barra lateral | `assets/sumi-isotipo.png` (logotipo blanco de sumiperu.com sobre `#041421`) |
| Color de marca (azul SUMI `#194d9f`) | `css/dashboard.css`, variables `--brand*` y colores de los graficos en `js/` |
| Fondo del acceso | `assets/login-bg.jpg` (el mismo de los demas tableros) |
