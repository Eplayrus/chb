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
  const METRIKA_COUNTER_ID = 104029197;
  const FUNCTION_URL = 'https://functions.yandexcloud.net/d4e276h8f7o7tvr8akvj';
  const POSTBACK_TOKEN = 'Senri20Akane16';
  const ATTR_STORAGE_KEY = 'chb_metrika_attribution_v1';

  function readAttribution() {
    try {
      const raw = localStorage.getItem(ATTR_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveAttribution(patch) {
    try {
      const current = readAttribution();
      const next = {
        ...current,
        ...patch,
        updated_at: new Date().toISOString()
      };

      localStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(next));
      return next;
    } catch {
      return patch;
    }
  }

  function getUrlParam(name) {
    try {
      return new URL(window.location.href).searchParams.get(name) || '';
    } catch {
      return '';
    }
  }

  function collectUrlAttribution() {
    const yclid = getUrlParam('yclid');
    const utm_source = getUrlParam('utm_source');
    const utm_medium = getUrlParam('utm_medium');
    const utm_campaign = getUrlParam('utm_campaign');
    const utm_content = getUrlParam('utm_content');
    const utm_term = getUrlParam('utm_term');

    const patch = {};

    if (yclid) patch.yclid = yclid;
    if (utm_source) patch.utm_source = utm_source;
    if (utm_medium) patch.utm_medium = utm_medium;
    if (utm_campaign) patch.utm_campaign = utm_campaign;
    if (utm_content) patch.utm_content = utm_content;
    if (utm_term) patch.utm_term = utm_term;

    if (Object.keys(patch).length) saveAttribution(patch);
  }

  function waitForMetrika(timeoutMs = 5000) {
    return new Promise((resolve) => {
      const startedAt = Date.now();

      const timer = setInterval(() => {
        if (typeof window.ym === 'function') {
          clearInterval(timer);
          resolve(true);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, 100);
    });
  }

  async function getMetrikaClientId() {
    const hasMetrika = await waitForMetrika();

    if (!hasMetrika) {
      return readAttribution().client_id || '';
    }

    return new Promise((resolve) => {
      let completed = false;

      const fallback = setTimeout(() => {
        if (completed) return;
        completed = true;
        resolve(readAttribution().client_id || '');
      }, 1500);

      try {
        window.ym(METRIKA_COUNTER_ID, 'getClientID', (clientID) => {
          if (completed) return;
          completed = true;
          clearTimeout(fallback);

          const value = String(clientID || '').trim();
          if (value) saveAttribution({ client_id: value });

          resolve(value || readAttribution().client_id || '');
        });
      } catch {
        if (completed) return;
        completed = true;
        clearTimeout(fallback);
        resolve(readAttribution().client_id || '');
      }
    });
  }

  async function sendMetrikaGoal(target, params = {}) {
    if (!target) return false;

    const hasMetrika = await waitForMetrika(4000);
    if (!hasMetrika) return false;

    return new Promise((resolve) => {
      let completed = false;

      const fallback = setTimeout(() => {
        if (completed) return;
        completed = true;
        resolve(false);
      }, 1000);

      try {
        window.ym(METRIKA_COUNTER_ID, 'reachGoal', target, params, () => {
          if (completed) return;
          completed = true;
          clearTimeout(fallback);
          resolve(true);
        });
      } catch {
        if (completed) return;
        completed = true;
        clearTimeout(fallback);
        resolve(false);
      }
    });
  }

  function buildFunctionUrl({ button, clientID, attribution }) {
    const target = button.dataset.target || 'black_button_click';
    const product = button.dataset.product || 'black';
    const mode = button.dataset.mode || 'redirect';
    const redirect = button.dataset.redirect || button.href || 'https://www.tbank.ru/cards/debit-cards/tinkoff-black/';
    const price = button.dataset.price || '0';
    const currency = button.dataset.currency || 'RUB';

    const url = new URL(FUNCTION_URL);

    url.searchParams.set('token', POSTBACK_TOKEN);
    url.searchParams.set('mode', mode);
    url.searchParams.set('target', target);
    url.searchParams.set('product', product);
    url.searchParams.set('redirect', redirect);
    url.searchParams.set('price', price);
    url.searchParams.set('currency', currency);
    url.searchParams.set('sub_ts', String(Math.floor(Date.now() / 1000) - 60));
    url.searchParams.set('comment', `${product}_${target}`.slice(0, 180));

    if (clientID) {
      url.searchParams.set('client_id', clientID);
    }

    if (attribution.yclid) {
      url.searchParams.set('yclid', attribution.yclid);
    }

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
      if (attribution[key]) url.searchParams.set(key, attribution[key]);
    });

    return url.toString();
  }

  async function handleFunctionClick(event) {
    const button = event.currentTarget;

    event.preventDefault();

    if (button.dataset.loading === 'true') return;
    button.dataset.loading = 'true';
    button.setAttribute('aria-busy', 'true');

    collectUrlAttribution();

    const target = button.dataset.target || 'black_button_click';
    const product = button.dataset.product || 'black';
    const clientID = await getMetrikaClientId();
    const attribution = saveAttribution({
      client_id: clientID || readAttribution().client_id || '',
      last_target: target,
      last_product: product,
      last_click_at: new Date().toISOString()
    });

    await sendMetrikaGoal(target, {
      product,
      client_id: clientID || '',
      yclid: attribution.yclid || ''
    });

    window.location.href = buildFunctionUrl({
      button,
      clientID: clientID || attribution.client_id || '',
      attribution
    });
  }

  function setupMetrikaRedirectButtons() {
    collectUrlAttribution();

    getMetrikaClientId().then((clientID) => {
      if (clientID) saveAttribution({ client_id: clientID });
    });

    const buttons = document.querySelectorAll('[data-function-link="true"]');

    buttons.forEach((button) => {
      button.addEventListener('click', handleFunctionClick);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMetrikaRedirectButtons, { once: true });
  } else {
    setupMetrikaRedirectButtons();
  }
})();

/*
  ============================================================
  ФАЙЛ 2: index.js ДЛЯ YANDEX CLOUD FUNCTION
  ============================================================

  Переменные окружения функции:
  POSTBACK_TOKEN = Senri20Akane16
  METRIKA_COUNTER_ID = 104029197
  METRIKA_TOKEN = OAuth-токен Метрики
  ENABLE_OFFLINE_UPLOAD = 1

  Режимы:
  mode=redirect  -> только редирект, офлайн-конверсию не грузит
  mode=offline   -> пробует загрузить офлайн-конверсию и всё равно редиректит

  Для клика по кнопке используй mode=redirect.
  Для реального банковского postback / подтвержденной заявки — mode=offline.
*/

const https = require('https');

function requestHttps(options, bodyBuffer) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body: Buffer.concat(chunks).toString('utf8')
        });
      });
    });

    req.on('error', (error) => resolve({ status: 0, body: String(error) }));
    req.setTimeout(15000, () => req.destroy(new Error('Request timeout')));

    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

function normalizeUrl(rawUrl, fallbackUrl) {
  const value = String(rawUrl || '').trim();

  try {
    const url = new URL(value || fallbackUrl);

    if (!['https:', 'http:'].includes(url.protocol)) return fallbackUrl;

    return url.toString();
  } catch {
    return fallbackUrl;
  }
}

function redirectResponse(location, debugBody = '') {
  return {
    statusCode: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store'
    },
    body: debugBody
  };
}

function csvEscape(value) {
  const stringValue = String(value ?? '');

  if (/[",\r\n]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

function clampPrice(value) {
  const raw = String(value ?? '0').trim().replace(',', '.');
  const number = Number(raw);

  if (!Number.isFinite(number) || number < 0) return '0';

  return String(Math.round(number * 100) / 100);
}

function chooseTimestampSeconds(query) {
  const now = Math.floor(Date.now() / 1000);
  const raw = String(query.sub_ts || query.ts || query.datetime_ts || '').trim();

  if (/^\d{9,13}$/.test(raw)) {
    const numeric = Number(raw);
    let timestamp = numeric > 2_000_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);

    if (timestamp >= now) timestamp = now - 60;
    return timestamp;
  }

  return now - 60;
}

function detectIdentifier(query) {
  const forcedType = String(query.id_type || '').trim().toUpperCase();

  const clientID = String(query.client_id || query.clientID || query.ClientID || '').trim();
  const yclid = String(query.yclid || '').trim();
  const userID = String(query.user_id || query.userid || '').trim();
  const purchaseID = String(query.purchase_id || query.purchaseid || '').trim();

  if (forcedType === 'YCLID' && yclid) return { column: 'yclid', value: yclid, type: 'YCLID' };
  if ((forcedType === 'USERID' || forcedType === 'USER_ID') && userID) return { column: 'UserID', value: userID, type: 'USER_ID' };
  if ((forcedType === 'PURCHASEID' || forcedType === 'PURCHASE_ID') && purchaseID) return { column: 'PurchaseId', value: purchaseID, type: 'PURCHASE_ID' };
  if ((forcedType === 'CLIENTID' || forcedType === 'CLIENT_ID') && clientID) return { column: 'ClientID', value: clientID, type: 'CLIENT_ID' };

  if (clientID && clientID !== 'CLIENT_ID' && clientID !== 'no_client_id') {
    return { column: 'ClientID', value: clientID, type: 'CLIENT_ID' };
  }

  if (yclid) return { column: 'yclid', value: yclid, type: 'YCLID' };
  if (userID) return { column: 'UserID', value: userID, type: 'USER_ID' };
  if (purchaseID) return { column: 'PurchaseId', value: purchaseID, type: 'PURCHASE_ID' };

  return null;
}

function buildOfflineCsv({ identifier, target, timestamp, price, currency }) {
  const header = [identifier.column, 'Target', 'DateTime', 'Price', 'Currency'].join(',');

  const row = [
    csvEscape(identifier.value),
    csvEscape(target),
    csvEscape(timestamp),
    csvEscape(price),
    csvEscape(currency)
  ].join(',');

  return `${header}\r\n${row}\r\n`;
}

function buildMultipart({ boundary, fileBuffer }) {
  const crlf = '\r\n';

  const head =
    `--${boundary}${crlf}` +
    `Content-Disposition: form-data; name="file"; filename="offline.csv"${crlf}` +
    `Content-Type: text/csv; charset=utf-8${crlf}${crlf}`;

  const tail = `${crlf}--${boundary}--${crlf}`;

  return Buffer.concat([
    Buffer.from(head, 'utf8'),
    fileBuffer,
    Buffer.from(tail, 'utf8')
  ]);
}

async function uploadOfflineConversion(query) {
  const counterId = String(process.env.METRIKA_COUNTER_ID || '').trim();
  const metrikaToken = String(process.env.METRIKA_TOKEN || '').trim();

  if (!counterId || !metrikaToken) {
    return { ok: false, reason: 'missing_metrika_env' };
  }

  const identifier = detectIdentifier(query);

  if (!identifier) {
    return { ok: false, reason: 'no_identifier' };
  }

  const target = String(query.target || '').trim();

  if (!target) {
    return { ok: false, reason: 'no_target' };
  }

  const timestamp = chooseTimestampSeconds(query);
  const price = clampPrice(query.price || '0');
  const currency = String(query.currency || 'RUB').trim().toUpperCase() || 'RUB';

  const csv = buildOfflineCsv({
    identifier,
    target,
    timestamp,
    price,
    currency
  });

  const boundary = '----YandexBoundary' + Math.random().toString(16).slice(2);
  const body = buildMultipart({
    boundary,
    fileBuffer: Buffer.from(csv, 'utf8')
  });

  const comment = String(query.comment || `${query.product || 'product'}_${target}`).slice(0, 255);
  const uploadType = String(query.offline_type || 'BASIC').toUpperCase();

  const options = {
    hostname: 'api-metrica.yandex.net',
    path: `/management/v1/counter/${encodeURIComponent(counterId)}/offline_conversions/upload?comment=${encodeURIComponent(comment)}&type=${encodeURIComponent(uploadType)}`,
    method: 'POST',
    headers: {
      Authorization: `OAuth ${metrikaToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    }
  };

  console.log('Offline CSV:', csv.replace(/\r\n/g, '[CRLF]'));
  console.log('Offline identifier:', identifier);
  console.log('Offline target:', target);
  console.log('Offline timestamp:', timestamp);

  const result = await requestHttps(options, body);

  console.log('Metrika upload response:', result.status, result.body);

  if (result.status < 200 || result.status >= 300) {
    return {
      ok: false,
      reason: 'metrika_error',
      status: result.status,
      body: result.body,
      csv
    };
  }

  return {
    ok: true,
    status: result.status,
    body: result.body,
    csv
  };
}

module.exports.handler = async (event) => {
  const query = event?.queryStringParameters || {};

  const fallbackRedirect = 'https://www.tbank.ru/cards/debit-cards/tinkoff-black/';
  const redirectUrl = normalizeUrl(query.redirect, fallbackRedirect);

  const secret = String(process.env.POSTBACK_TOKEN || '').trim();
  const token = String(query.token || '').trim();

  if (!secret || token !== secret) {
    console.log('Forbidden request');
    return redirectResponse(redirectUrl, 'forbidden');
  }

  const mode = String(query.mode || 'redirect').trim().toLowerCase();
  const offlineEnabled = String(process.env.ENABLE_OFFLINE_UPLOAD || '1') === '1';

  console.log('Incoming mode:', mode);
  console.log('Incoming product:', query.product || '');
  console.log('Incoming target:', query.target || '');
  console.log('Incoming client_id:', query.client_id || '');
  console.log('Incoming yclid:', query.yclid || '');
  console.log('Redirect:', redirectUrl);

  if (mode === 'offline' && offlineEnabled) {
    try {
      const upload = await uploadOfflineConversion(query);
      console.log('Offline upload result:', JSON.stringify(upload));
    } catch (error) {
      console.log('Offline upload fatal error:', String(error));
    }
  }

  return redirectResponse(redirectUrl);
};
