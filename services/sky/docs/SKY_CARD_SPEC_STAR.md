# Sky Card Spec — STAR (v1)

Цель: показать полезную карточку по клику на звезде, работоспособную при частичных данных (минимум: координаты+видимость), с возможностью enrichment из внешних каталогов.

---

## 1. Entity & Contract

### 1.1. Card kind
- `kind`: `"star"`

### 1.2. Required (минимум для отображения)
Эти поля **обязательны** для рендера базовой карточки:
- `id` (string) — стабильный идентификатор в пределах датасета
- `name` (string) — отображаемое имя
- `ra_deg` (number) — прямое восхождение (deg, J2000)
- `dec_deg` (number) — склонение (deg, J2000)

### 1.3. Optional (если доступны из каталога/пайплайна)
- `alt_deg` (number) — высота объекта в момент `context.time_utc`
- `az_deg` (number) — азимут
- `mag` (object)
  - `value` (number)
  - `band` (string, напр. `"V"`, `"G"`, `"B"`)
- `constellation` (string)
- `spectral_type` (string)
- `distance_pc` (number)
- `parallax_mas` (number)
- `pm_ra_masyr` (number)
- `pm_dec_masyr` (number)
- `rv_kms` (number)
- `photometry` (array) — список измерений
  - item: `{ band: string, value: number, err?: number }`
- `variability` (object)
  - `type` (string)
  - `period_days` (number)
  - `amplitude_mag` (number)
- `multiplicity` (object)
  - `type` (string: `"single"|"binary"|"multiple"`)
  - `separation_arcsec` (number)
  - `position_angle_deg` (number)
- `catalog_ids` (object) — удобные “ключи”
  - `gaia` (string)
  - `hip` (string)
  - `hd` (string)
  - `tyc` (string)
  - `simbad_main_id` (string)
- `links` (object) — готовые ссылки, если заранее сформированы
  - `simbad` (string)
  - `gaia` (string)
  - `wikipedia` (string)
  - `aladin` (string)

### 1.4. Context (обязательный контекст рендера)
Карточка не должна вычислять астрономию “из воздуха”. Всё, что зависит от наблюдателя, считается upstream (prepare/data layer) и приходит в `context`:
- `context.time_utc` (ISO string)
- `context.observer`:
  - `lat_deg` (number)
  - `lon_deg` (number)
  - `elev_m` (number, optional)
- `context.night` (object, optional)
  - `is_dark` (bool)
  - `sun_alt_deg` (number)
  - `moon_alt_deg` (number)
  - `moon_sep_deg` (number)
- `context.observability` (object, optional)
  - `visible_now` (bool)
  - `rise_utc` (ISO string | null)
  - `set_utc` (ISO string | null)
  - `transit_utc` (ISO string | null)
  - `max_alt_deg` (number | null)
  - `best_window` (object | null) `{ start_utc, end_utc }`

---

## 2. UI Layout (wireframe → sections)

### 2.1. Header
- Icon: `★`
- Title: `name`
- Subtitle line: `spectral_type` (если есть) + `constellation` (если есть)
- Secondary IDs (small): `catalog_ids` (если есть)

### 2.2. Quick facts row (chips / key-values)
Порядок:
1) RA/Dec (в sexagesimal + J2000 label) + `[Copy]`
2) Alt/Az (если есть) + Airmass (если вы считаете upstream)
3) Mag (если есть) `value + band`
4) Distance (если есть)

### 2.3. Mini-view (optional)
- “Finder thumbnail” (если есть URL) или выключено по умолчанию.
- Если thumbnail недоступен — секция скрывается, без пустых заглушек.

### 2.4. Summary
- Type: `"Star"`
- Variability (если есть)
- Multiplicity (если есть)

### 2.5. Photometry & Motion
- Табличка 2–6 строк: bands из `photometry`
- Parallax/PM/RV — только если поля есть.

### 2.6. Observability (если есть `context.observability`)
- Visible now + altitude threshold (порог задаётся конфигом UI)
- Transit / Max alt
- Rise / Set
- Best window
- Moon separation (если есть)

### 2.7. Actions
Кнопки (минимум v1):
- `Track` — добавляет объект в “tracked list”
- `Pin` — фиксирует на карте
- `Copy coords` — копирует RA/Dec (и alt/az если есть)
- `Share` — генерирует sharable URL (если поддержано)

### 2.8. Links
Показывать только доступные.
Порядок: SIMBAD → Gaia → Aladin → Wikipedia.

---

## 3. Fallback Rules

1) Нет `alt_deg/az_deg` → скрыть текущую видимость “Now”; оставить RA/Dec.
2) Нет `mag` → не показывать mag chip.
3) Нет `context.observability` → не показывать секцию Observability (или показывать кратко: “No observer context”).
4) Любые enrich-секции (photometry, variability, multiplicity) скрывать полностью, если ключевые поля отсутствуют.

---

## 4. Data Preparation Responsibilities (backend/prepare)

1) Конвертация RA/Dec → sexagesimal строка для UI (опционально; иначе UI делает сам).
2) Расчёт alt/az и observability для `context` (в соответствии с текущими lat/lon/time).
3) Формирование `links` (желательно upstream, чтобы UI не собирал URL-ы).

---

## 5. Acceptance Criteria

- При клике на звезде с минимальными полями (`id,name,ra_deg,dec_deg`) карточка корректно рендерится.
- При наличии observer context отображается Observability без ошибок.
- UI устойчив к частично заполненным enrich-полям (нет “undefined”, пустых таблиц, сломанных секций).
