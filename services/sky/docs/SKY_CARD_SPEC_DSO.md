# Sky Card Spec — DSO (v1)

Цель: карточка по клику на объекте глубокого неба (галактика/туманность/скопление и т.д.): координаты, угловые размеры, яркость, наблюдаемость, превью (если доступно), ссылки.

---

## 1. Entity & Contract

### 1.1. Card kind
- `kind`: `"dso"`

### 1.2. Required (минимум)
- `id` (string)
- `name` (string)
- `ra_deg` (number, J2000)
- `dec_deg` (number, J2000)
- `dso_type` (string) — напр. `"galaxy"|"nebula"|"cluster"|"pn"|"snr"|"asterism"|...`

### 1.3. Optional
Основные наблюдательные:
- `alt_deg` (number)
- `az_deg` (number)
- `mag` (object) `{ value:number, band?:string }`
- `size` (object)
  - `major_arcmin` (number)
  - `minor_arcmin` (number)
  - `pa_deg` (number, optional)
- `surface_brightness` (number, optional) — mag/arcsec^2 (если есть)
- `constellation` (string)
- `classifications` (object, optional)
  - `messier` (string)
  - `ngc` (string)
  - `ic` (string)
  - `pgc` (string)
  - `other` (array of string)

Галактики (если известны):
- `morphology` (string)
- `redshift_z` (number)
- `distance_mpc` (number)
- `rv_kms` (number)
- `physical_size_kly` (number)

Наблюдательные подсказки:
- `observing_tips` (object, optional)
  - `difficulty` (string: `"easy"|"medium"|"hard"`)
  - `recommended_aperture_mm` (number)
  - `filters` (array of string) — `"UHC"|"OIII"|"Hβ"|...`
  - `notes` (array of string)

Preview:
- `preview` (object, optional)
  - `thumb_url` (string)
  - `source` (string: `"DSS"|"PanSTARRS"|"SDSS"|... )
  - `fov_arcmin` (number)
  - `orientation` (string, optional)

Links:
- `links` (object, optional)
  - `simbad` (string)
  - `ned` (string)
  - `hyperleda` (string)
  - `wikipedia` (string)
  - `aladin` (string)

### 1.4. Context
- `context.time_utc` (ISO)
- `context.observer.{lat_deg,lon_deg,elev_m?}`
- `context.night` (optional)
- `context.observability` (optional) — same schema as STAR

---

## 2. UI Layout (sections)

### 2.1. Header
- Icon: `◎` (или иконка по `dso_type`)
- Title: `name`
- Subtitle: `dso_type` + `constellation` (если есть)
- Secondary IDs row: Messier/NGC/IC/PGC (если есть)

### 2.2. Quick facts row
Порядок:
1) RA/Dec + `[Copy]`
2) Alt/Az (если есть)
3) Size (если есть): `major×minor` + `PA`
4) Mag (если есть) + band
5) Surface brightness (если есть)

### 2.3. Preview
- Если `preview.thumb_url` есть — показываем картинку + controls:
  - `Invert` (CSS filter)
  - `Annotate` (overlay crosshair / scale bar, если реализовано)
- Если нет — секция скрыта.

### 2.4. Summary
- Type + краткие notes (если есть)
- Для galaxy: morphology (если есть)

### 2.5. Observing tips
- Difficulty / aperture / filters / notes — показывать только если `observing_tips` есть.
- В v1 допускается “rules-based” генерация tips на фронте по `dso_type + mag + size`, но предпочтительно готовить upstream.

### 2.6. Physical (если есть distance/z)
- Distance / redshift / RV / physical size.

### 2.7. Observability
- Аналогично STAR.

### 2.8. Actions
Минимум v1:
- `Track`
- `Pin`
- `Copy coords`
- `Share`

### 2.9. Links
Порядок: SIMBAD → NED → HyperLEDA → Aladin → Wikipedia.

---

## 3. Fallback Rules

1) Нет размеров → не показывать Size chip.
2) Нет mag → не показывать mag chip.
3) Нет preview → скрыть секцию Preview.
4) Нет observer context → скрыть Observability.
5) Нет links → скрыть блок Links.

---

## 4. Data Preparation Responsibilities

1) Рассчитать alt/az и observability в `context` (как и STAR).
2) Подготовить `preview.thumb_url` через источник без CORS-проблем (либо proxy/cache).
3) Нормализовать размерности (arcmin, deg) до единых полей.
4) Сформировать ссылки (желательно upstream).

---

## 5. Acceptance Criteria

- Минимальные поля (`id,name,ra_deg,dec_deg,dso_type`) дают корректную карточку без пустых секций.
- Preview (если есть) не ломает layout и имеет graceful fallback при ошибке загрузки.
- Все enrich секции отображаются только при наличии данных.
