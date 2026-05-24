CHB Black + Eva AI module

Куда класть:
1. Папку black/ положить в корень сайта, заменив старую папку black.
2. Папку eva-ai/ положить в корень сайта рядом с index.html, sp/, black/, sim_card/.

Итоговая структура:
cpa/
  index.html
  styles.css
  script.js
  eva-ai/
    eva-ai.css
    eva-ai.js
  sp/
    eva_standing_cup.png
    eva_standing_speak.png
    eva_boring_cup.png
    eva_tea_pot.png
    eva_tea_pot_suprised.png
    evz_normal.png
  black/
    index.html
    styles.css
    script.js

Что изменено:
- Старый встроенный блок Евы удалён из black/index.html.
- Старый код Евы удалён из black/script.js.
- Black подключает общий модуль:
  ../eva-ai/eva-ai.css
  ../eva-ai/eva-ai.js
- Для страницы Black задан window.EVA_AI_CONFIG, чтобы спрайты брались из ../sp/.
