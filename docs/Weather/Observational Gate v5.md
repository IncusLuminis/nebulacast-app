Да. В этом месте сейчас логическая несогласованность интерфейса.

На скриншоте видно:

17:00
Daytime
Score 89
Indicator: OPEN
Sky Darkness 0

Это противоречие. Если Sky Darkness = 0 из-за Daytime, то наблюдение невозможно, независимо от качества атмосферы.

То есть система показывает:

conditions_quality = high
observability = false

но индикатор OPEN говорит обратное.

⸻

Как мы договаривались делать (v5)

В модели v5 должны существовать две независимые сущности:

Observing Quality   (score 0–100)
Observability Gate  (OPEN / MARGINAL / CLOSED)

Score отвечает на вопрос:

Насколько хороши условия?

Gate отвечает на вопрос:

Можно ли вообще наблюдать?

Это принципиально разные вещи.

⸻

Правильная логика Gate

Gate определяется физическими ограничениями, а не скорингом.

Пример правил.

Sun altitude > -6°      → CLOSED (Daytime)
Sun altitude -6..-12°   → MARGINAL (Civil twilight)
Sun altitude < -12°     → OPEN

Дополнительно могут быть условия:

Cloud cover > 95% → CLOSED
Fog detected      → CLOSED


⸻

Что должно происходить на вашем экране

При текущих условиях:

Sun altitude > -6°
Daytime

должно быть:

Gate: CLOSED
Reason: Daytime

Score при этом может оставаться 89, потому что:

Atmosphere good
Dew good
Stability good

Но наблюдение невозможно.

⸻

Как это должно выглядеть в UI

Верхняя часть карточки.

Сейчас:

89
GOOD
OPEN

Должно быть:

89
GOOD
CLOSED — Daytime

или компактнее:

● CLOSED
Daytime


⸻

Почему score при этом не должен обнуляться

Если обнулять score днём, ломается полезная информация:

Сейчас пользователь видит:

Atmosphere excellent
Dew safe
Wind calm

Это говорит:

когда солнце сядет → условия будут отличные

Поэтому правильная модель:

Score = quality
Gate  = observability


⸻

Лучший UX-вариант

Добавить текст прямо под score.

89
GOOD

Observing: CLOSED
Reason: Daytime

или

Closed until civil dusk

Это сразу отвечает на главный вопрос пользователя:

почему нельзя наблюдать?


⸻

Итог

В вашем случае должно быть:

Score: 89
Quality: Good

Observing: CLOSED
Reason: Daytime

При этом категории остаются:

Atmosphere 81
Dew Safety 100
Stability 95
Sky Darkness 0

То есть:

conditions = excellent
sky = too bright


⸻

Маленькая UX-идея

Вместо OPEN / CLOSED можно показывать более астрономический вариант:

OBSERVING WINDOW CLOSED
Sun altitude −2°

или

Daylight — observing unavailable

Это воспринимается намного естественнее.