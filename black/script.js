'use strict';

/*
  ============================================================
  ФАЙЛ 1: script.js ДЛЯ СТРАНИЦЫ BLACK / PLATINUM / SIM
  ============================================================

  Что делает:
  1. Сохраняет ClientID Метрики и yclid в localStorage.
  2. При клике по кнопке сначала отправляет обычную JS-цель reachGoal.
  3. Потом ведёт пользователя на Yandex Cloud Function.
  4. Функция уже редиректит на официальный сайт.

  В HTML-кнопке нужны data-function-link, data-target, data-product, data-redirect.
  Пример кнопки смотри в конце ответа в чате.
*/

(() => {
  const sprite = document.getElementById('evaSprite');
  const bubble = document.getElementById('bubble');
  const bubbleText = document.getElementById('bubbleText');
  const bubbleSpeaker = document.getElementById('bubbleSpeaker');
  const reactiveItems = document.querySelectorAll('.eva-react');
  const isMobileEva = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 560px)').matches;

  const eva = {
    cup: '../sp/eva_standing_cup.png',
    speak: '../sp/eva_standing_speak.png',
    boring: '../sp/eva_boring_cup.png',
    normal: '../sp/evz_normal.png',
    pot: '../sp/eva_tea_pot.png',
    surprised: '../sp/eva_tea_pot_suprised.png'
  };

  const STORAGE_KEY = 'chb_black_eva_memory_v1';
  const IDLE_DELAY = 11000;
  const MOBILE_BUBBLE_MS = 8500;

  let idleTimer = null;
  let hideTimer = null;
  let textTimer = null;
  let introActive = true;
  let isReacting = false;
  let lastMobileKey = '';
  let mobileLockUntil = 0;
  let lastTouchY = 0;

  const memory = readMemory();
  const returning = memory.visits > 0;

  memory.visits += 1;
  memory.lastSeenAt = new Date().toISOString();
  saveMemory();

  function readMemory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { visits: 0, lastSeenAt: '', lastDialogue: '' };
      return { visits: 0, lastSeenAt: '', lastDialogue: '', ...JSON.parse(raw) };
    } catch {
      return { visits: 0, lastSeenAt: '', lastDialogue: '' };
    }
  }

  function saveMemory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {}
  }

  function setSprite(src) {
    if (!sprite || !src) return;

    sprite.classList.remove('is-active');

    const image = new Image();
    image.onload = () => {
      sprite.src = src;
      requestAnimationFrame(() => sprite.classList.add('is-active'));
    };
    image.onerror = () => sprite.classList.add('is-active');
    image.src = src;
  }

  function showBubble(text, speaker = 'Eva', duration = isMobileEva ? MOBILE_BUBBLE_MS : 0) {
    if (!bubble || !bubbleText || !bubbleSpeaker) return;

    clearTimeout(hideTimer);
    clearTimeout(textTimer);
    bubble.classList.add('is-visible');

    textTimer = setTimeout(() => {
      bubbleText.textContent = text;
      bubbleSpeaker.textContent = speaker;
      memory.lastDialogue = text;
      saveMemory();
    }, 80);

    if (duration) {
      hideTimer = setTimeout(() => {
        if (!isReacting) hideBubble();
      }, duration);
    }
  }

  function hideBubble() {
    if (!bubble) return;
    bubble.classList.remove('is-visible');
  }

  function startIdleTimer() {
    clearTimeout(idleTimer);
    if (introActive || isReacting) return;

    idleTimer = setTimeout(() => {
      setSprite(eva.boring);
      showBubble(
        isMobileEva
          ? 'Я рядом. Листайте страницу или коснитесь блока — я поясню условия.'
          : 'Я всё ещё здесь. Наведите на любой блок, и я поясню условия.',
        'Eva',
        isMobileEva ? MOBILE_BUBBLE_MS : 0
      );
    }, IDLE_DELAY);
  }

  function noteActivity() {
    if (introActive) return;
    startIdleTimer();
  }

  function getDialogue(item) {
    if (!isMobileEva) return item.dataset.dialogue || 'Я здесь. Просто наблюдаю.';

    if (item.classList.contains('card-showcase')) {
      return 'Black — базовая карта для повседневных трат, зарплаты, пособий и переводов.';
    }

    if (item.classList.contains('btn-primary')) {
      return 'Оформляйте только после проверки условий. Особенно обслуживания, лимитов и переводов.';
    }

    if (item.classList.contains('btn-secondary')) {
      return 'Хороший выбор. Сначала условия, потом решение.';
    }

    if (item.classList.contains('benefit-card')) {
      const title = item.querySelector('h3')?.textContent?.trim() || 'условие';
      const text = item.querySelector('p')?.textContent?.trim() || '';
      return `${title}. ${text}`;
    }

    if (item.classList.contains('conditions-card')) {
      return 'Главный блок условий: бесплатное обслуживание, кэшбэк, лимиты и поддержка.';
    }

    if (item.classList.contains('faq-item')) {
      return item.querySelector('p')?.textContent?.trim() || 'Этот пункт стоит прочитать перед оформлением.';
    }

    return item.dataset.dialogue || 'Коснитесь блока — я поясню главное.';
  }

  function reactTo(item, options = {}) {
    clearTimeout(idleTimer);
    clearTimeout(hideTimer);

    introActive = false;
    isReacting = true;

    setSprite(eva.speak);
    showBubble(getDialogue(item), item.dataset.speaker || 'Eva', isMobileEva ? MOBILE_BUBBLE_MS : 0);

    if (isMobileEva || options.autoReset) {
      hideTimer = setTimeout(() => {
        isReacting = false;
        setSprite(eva.cup);
        hideBubble();
        startIdleTimer();
      }, isMobileEva ? MOBILE_BUBBLE_MS : 3600);
    }
  }

  function resetEva() {
    if (introActive) return;

    isReacting = false;
    setSprite(eva.cup);
    hideTimer = setTimeout(hideBubble, 260);
    startIdleTimer();
  }

  function playIntro() {
    if (!sprite) return;

    sprite.classList.add('is-active');
    setSprite(eva.pot);

    showBubble(
      returning
        ? 'С возвращением. Black всё ещё ждёт внимательного взгляда.'
        : 'Чай почти готов. А условия уже можно читать.',
      'Eva',
      0
    );

    setTimeout(() => {
      setSprite(eva.surprised);
      showBubble('О. Вы уже здесь? Тогда разберём Black без лишнего тумана.', 'Eva', 0);
    }, 1500);

    setTimeout(() => {
      introActive = false;
      setSprite(eva.cup);
      hideTimer = setTimeout(hideBubble, isMobileEva ? MOBILE_BUBBLE_MS : 1400);
      startIdleTimer();
    }, 3500);
  }

  function setupDesktop() {
    reactiveItems.forEach((item) => {
      item.addEventListener('pointerenter', () => reactTo(item));
      item.addEventListener('focusin', () => reactTo(item));
      item.addEventListener('pointerleave', resetEva);
      item.addEventListener('focusout', resetEva);
    });
  }

  function setupMobile() {
    reactiveItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        if (item.getAttribute('href') === '#') event.preventDefault();
        reactTo(item);
      });
    });

    if (sprite) {
      sprite.addEventListener('click', () => {
        introActive = false;
        isReacting = true;
        setSprite(eva.speak);
        showBubble('На телефоне просто листайте страницу или касайтесь блоков. Я поясню главное.', 'Eva', MOBILE_BUBBLE_MS);

        hideTimer = setTimeout(() => {
          isReacting = false;
          setSprite(eva.cup);
          hideBubble();
          startIdleTimer();
        }, MOBILE_BUBBLE_MS);
      });
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const now = Date.now();

        if (introActive || isReacting || now < mobileLockUntil) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const item = visible.target;
        const key = item.id || item.dataset.speaker || item.querySelector('h3')?.textContent || item.className;

        if (key === lastMobileKey) return;

        lastMobileKey = key;
        mobileLockUntil = now + 3600;

        setSprite(eva.speak);
        showBubble(getDialogue(item), item.dataset.speaker || 'Eva', MOBILE_BUBBLE_MS);

        hideTimer = setTimeout(() => {
          setSprite(eva.cup);
          hideBubble();
          startIdleTimer();
        }, MOBILE_BUBBLE_MS);
      }, {
        threshold: 0.55,
        rootMargin: '-18% 0px -28% 0px'
      });

      reactiveItems.forEach((item) => observer.observe(item));
    }

    window.addEventListener('touchstart', (event) => {
      lastTouchY = event.touches?.[0]?.clientY || 0;
      noteActivity();
    }, { passive: true });

    window.addEventListener('touchmove', (event) => {
      const currentY = event.touches?.[0]?.clientY || 0;
      const isSwipe = Math.abs(currentY - lastTouchY) > 18;

      if (isSwipe && bubble?.classList.contains('is-visible')) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          if (!isReacting) {
            setSprite(eva.cup);
            hideBubble();
            startIdleTimer();
          }
        }, 6500);
      }

      noteActivity();
    }, { passive: true });
  }

  function setupEvaSpriteClick() {
    if (!sprite) return;

    sprite.addEventListener('click', () => {
      introActive = false;
      isReacting = true;
      clearTimeout(hideTimer);

      setSprite(eva.speak);
      showBubble(
        isMobileEva
          ? 'На телефоне я закреплена у экрана. Листайте страницу или касайтесь блоков — я поясню главное.'
          : 'Я теперь следую за прокруткой. Наведите на блок — и я поясню условия.',
        'Eva',
        isMobileEva ? MOBILE_BUBBLE_MS : 0
      );

      if (isMobileEva) {
        hideTimer = setTimeout(() => {
          isReacting = false;
          setSprite(eva.cup);
          hideBubble();
          startIdleTimer();
        }, MOBILE_BUBBLE_MS);
      }
    });
  }

  if (isMobileEva) setupMobile();
  else setupDesktop();

  setupEvaSpriteClick();

  ['pointermove', 'keydown', 'wheel', 'scroll'].forEach((eventName) => {
    window.addEventListener(eventName, noteActivity, { passive: true });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playIntro, { once: true });
  } else {
    playIntro();
  }
})();

(() => {
  const METRIKA_ID = 104029197;
  const FUNCTION_URL = "https://functions.yandexcloud.net/d4e276h8f7o7tvr8akvj";
  const POSTBACK_TOKEN = "Senri20Akane16";

  function waitForMetrika() {
    return new Promise((resolve) => {
      let attempts = 0;

      const timer = setInterval(() => {
        attempts++;

        if (typeof window.ym === "function") {
          clearInterval(timer);
          resolve(true);
        }

        if (attempts > 40) {
          clearInterval(timer);
          resolve(false);
        }
      }, 250);
    });
  }

  async function getClientId() {
    const ok = await waitForMetrika();

    if (!ok) return "";

    return new Promise((resolve) => {
      ym(METRIKA_ID, "getClientID", (clientID) => {
        resolve(clientID || "");
      });
    });
  }

  async function handleClick(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const clientID = await getClientId();

    ym(METRIKA_ID, "reachGoal", button.dataset.target || "black_button_click");

    const url = new URL(FUNCTION_URL);
    url.searchParams.set("token", POSTBACK_TOKEN);
    url.searchParams.set("mode", button.dataset.mode || "redirect");
    url.searchParams.set("client_id", clientID);
    url.searchParams.set("target", button.dataset.target || "black_button_click");
    url.searchParams.set("product", button.dataset.product || "black");
    url.searchParams.set("price", button.dataset.price || "0");
    url.searchParams.set("currency", button.dataset.currency || "RUB");
    url.searchParams.set("redirect", button.dataset.redirect || button.href);

    window.location.href = url.toString();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-function-link='true']").forEach((button) => {
      button.addEventListener("click", handleClick);
    });
  });
})();

