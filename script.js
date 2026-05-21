(() => {
        const spriteA = document.getElementById("evaSpriteA");
        const spriteB = document.getElementById("evaSpriteB");
        const bubble = document.getElementById("speechBubble");
        const bubbleText = document.getElementById("bubbleText");
        const bubbleSpeaker = document.getElementById("bubbleSpeaker");
        const reactiveItems = document.querySelectorAll(".eva-react");
        const isMobileEva = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 560px)").matches;

        const eva = {
          pouring: "https://90f1661d-2ff4-4f29-b07c-0e47453ca691.selstorage.ru/site1070969/45b76b3c-b395-4add-89e2-48b99f69a73a.png",
          surprised: "https://90f1661d-2ff4-4f29-b07c-0e47453ca691.selstorage.ru/site1070969/e4540d0c-3d57-40c9-a84a-470962e0e0b9.png",
          default: "https://90f1661d-2ff4-4f29-b07c-0e47453ca691.selstorage.ru/site1070969/352d9ed8-ed96-4d50-9998-80ee09a343cb.png",
          speak: "https://90f1661d-2ff4-4f29-b07c-0e47453ca691.selstorage.ru/site1070969/1ead777b-2cf0-47fa-a96b-505e34946b2a.png",
          boring: "https://90f1661d-2ff4-4f29-b07c-0e47453ca691.selstorage.ru/site1070969/a9d4ad36-036b-47d6-b731-d02bb520c172.png"
        };

        const STORAGE_KEY = "chb_eva_memory_v1";
        const IDLE_DELAY = 9000;
        const SPRITE_FADE_MS = 560;
        const spriteCache = new Map();
        const introTimers = new Set();
        let activeSprite = spriteA;
        let inactiveSprite = spriteB;
        let currentSprite = eva.pouring;
        let pendingSprite = null;
        let transitionTimer = null;
        let hideTimer = null;
        let textTimer = null;
        let idleTimer = null;
        let memorySaveTimer = null;
        let introActive = true;
        let isReacting = false;
        let isIdle = false;
        let mobileHideTimer = null;
        let lastTouchY = 0;
        let lastMobileCommentKey = "";
        let mobileCommentLockedUntil = 0;

        const MOBILE_TAP_BUBBLE_MS = 9500;
        const MOBILE_SCROLL_BUBBLE_MS = 8000;
        const MOBILE_HELP_BUBBLE_MS = 9500;
        const MOBILE_SWIPE_EXTEND_MS = 7000;

        const defaultMemory = {
          visits: 0,
          firstSeenAt: null,
          lastSeenAt: null,
          lastDialogue: "",
          lastSpeaker: "Eva",
          lastProductId: "",
          lastProductLabel: "",
          idleCount: 0,
          interactions: 0
        };

        function readMemory() {
          try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...defaultMemory };
            return { ...defaultMemory, ...JSON.parse(raw) };
          } catch (error) {
            console.warn("Не удалось прочитать память Евы:", error);
            return { ...defaultMemory };
          }
        }

        const memory = readMemory();
        const isReturningUser = memory.visits > 0;
        memory.visits += 1;
        memory.firstSeenAt ||= new Date().toISOString();
        memory.lastSeenAt = new Date().toISOString();

        function saveMemory(immediate = false) {
          const commit = () => {
            try {
              memory.lastSeenAt = new Date().toISOString();
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
            } catch (error) {
              console.warn("Не удалось сохранить память Евы:", error);
            }
          };

          window.clearTimeout(memorySaveTimer);
          if (immediate) {
            commit();
          } else {
            memorySaveTimer = window.setTimeout(commit, 220);
          }
        }

        function rememberDialogue(text, speaker = "Eva", item = null) {
          memory.lastDialogue = text || "";
          memory.lastSpeaker = speaker || "Eva";
          if (item) {
            memory.lastProductId = item.id || item.getAttribute("aria-label") || "";
            memory.lastProductLabel =
              item.querySelector("h2")?.textContent?.trim() ||
              item.querySelector("strong")?.textContent?.trim() ||
              item.dataset.speaker ||
              "";
          }
          saveMemory();
        }

        function getReturnPhrase() {
          if (!isReturningUser) {
            return "Одну секунду. Чай важнее любой презентации.";
          }

          if (memory.lastProductLabel) {
            return `С возвращением. В прошлый раз вы задержались на «${memory.lastProductLabel}». Продолжим?`;
          }

          if (memory.lastDialogue) {
            return "С возвращением. Я вас помню. Чай уже почти готов.";
          }

          return "С возвращением. Я не забыла этот визит.";
        }

        saveMemory(true);

        function addIntroTimer(callback, delay) {
          const id = window.setTimeout(() => {
            introTimers.delete(id);
            callback();
          }, delay);
          introTimers.add(id);
          return id;
        }

        function clearIntroTimers() {
          introTimers.forEach((id) => window.clearTimeout(id));
          introTimers.clear();
          introActive = false;
        }

        function preloadSprite(src) {
          if (!src) return Promise.resolve(false);
          if (spriteCache.has(src)) return spriteCache.get(src);

          const promise = new Promise((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => resolve(true);
            img.onerror = () => {
              console.warn("Не удалось загрузить спрайт:", src);
              resolve(false);
            };
            img.src = src;
          });

          spriteCache.set(src, promise);
          return promise;
        }

        function preloadAllSprites() {
          Object.values(eva).forEach(preloadSprite);
        }

        async function setSprite(src) {
          if (!src || src === currentSprite || src === pendingSprite) return;

          pendingSprite = src;
          const loaded = await preloadSprite(src);
          if (pendingSprite !== src) return;

          if (!loaded) {
            pendingSprite = null;
            return;
          }

          window.clearTimeout(transitionTimer);

          inactiveSprite.src = src;
          inactiveSprite.classList.remove("is-leaving");

          window.requestAnimationFrame(() => {
            activeSprite.classList.remove("is-active");
            activeSprite.classList.add("is-leaving");
            inactiveSprite.classList.add("is-active");
          });

          transitionTimer = window.setTimeout(() => {
            activeSprite.classList.remove("is-leaving");
            const previousActive = activeSprite;
            activeSprite = inactiveSprite;
            inactiveSprite = previousActive;
            currentSprite = src;
            pendingSprite = null;
          }, SPRITE_FADE_MS);
        }

        function showBubble(text, speaker = "Eva", options = {}) {
          window.clearTimeout(hideTimer);
          window.clearTimeout(textTimer);

          bubble.classList.add("is-visible");
          bubble.classList.add("is-soft-changing", "is-text-changing");

          textTimer = window.setTimeout(() => {
            bubbleText.textContent = text;
            bubbleSpeaker.textContent = speaker;
            bubble.classList.remove("is-text-changing");
          }, 120);

          window.setTimeout(() => {
            bubble.classList.remove("is-soft-changing");
          }, 260);

          if (!options.skipMemory) {
            rememberDialogue(text, speaker, options.item || null);
          }
        }

        function hideBubble(delay = 260) {
          window.clearTimeout(hideTimer);
          window.clearTimeout(mobileHideTimer);
          hideTimer = window.setTimeout(() => {
            bubble.classList.remove("is-visible");
          }, delay);
        }

        function scheduleMobileBubbleHide(delay = MOBILE_SCROLL_BUBBLE_MS) {
          window.clearTimeout(hideTimer);
          window.clearTimeout(mobileHideTimer);

          mobileHideTimer = window.setTimeout(() => {
            isReacting = false;
            setSprite(eva.default);
            hideBubble(0);
            startIdleTimer();
          }, delay);
        }

        function clearIdleTimer() {
          window.clearTimeout(idleTimer);
          idleTimer = null;
        }

        function startIdleTimer() {
          clearIdleTimer();
          if (introActive || isReacting) return;

          idleTimer = window.setTimeout(() => {
            if (introActive || isReacting) return;
            isIdle = true;
            memory.idleCount += 1;
            setSprite(eva.boring);
            showBubble(isMobileEva ? "Я рядом. Листайте страницу или коснитесь карточки — я поясню главное." : "я скучаю", "Eva");
            if (isMobileEva) scheduleMobileBubbleHide(MOBILE_HELP_BUBBLE_MS);
          }, IDLE_DELAY);
        }

        function noteUserActivity() {
          if (introActive) return;

          if (isIdle && !isReacting) {
            isIdle = false;
            setSprite(eva.default);
            hideBubble(900);
          }

          startIdleTimer();
        }

        function getEvaDialogue(item) {
          if (!isMobileEva) {
            return item.dataset.dialogue || "Я здесь. Просто наблюдаю.";
          }

          if (item.classList.contains("black-card-wrap")) {
            return "Black — карта для повседневных трат. Кэшбэк рублями, остаток работает, условия без тумана.";
          }

          if (item.classList.contains("btn-primary") || item.classList.contains("link-secondary")) {
            return "Нажмите, если хотите перейти к подробностям. Условия лучше читать заранее — особенно когда речь о деньгах.";
          }

          if (item.id === "mobile") {
            return "Т‑Мобайл — связь, тарифы и гигабайты. Главное, чтобы интернет не исчезал в самый странный момент.";
          }

          if (item.id === "credit") {
            return "Platinum — кредитка с льготным периодом. Удобно, если помнить даты и не играть с долгом в азарт.";
          }

          if (item.classList.contains("feature")) {
            const title = item.querySelector("strong")?.textContent?.trim() || "условие";
            const note = item.querySelector("small")?.textContent?.trim() || "";
            return `${title} ${note}. Это один из главных пунктов, который стоит проверить перед оформлением.`;
          }

          if (item.classList.contains("benefit")) {
            const text = item.querySelector("span")?.textContent?.trim();
            return text ? `${text}. Хорошая страница должна объяснять это без лишней магии.` : "Это один из аргументов в пользу продукта.";
          }

          if (item.classList.contains("why")) {
            return "Здесь можно объяснить, почему CHB ведёт к продуктам: спокойно, честно и без копирования официального сайта.";
          }

          return item.dataset.dialogue || "Коснитесь карточки — я объясню, что здесь важно.";
        }

        function setEvaReaction(item, options = {}) {
          clearIntroTimers();
          clearIdleTimer();
          isIdle = false;
          isReacting = true;
          memory.interactions += 1;
          setSprite(eva.speak);
          showBubble(getEvaDialogue(item), item.dataset.speaker || "Eva", { item });

          if (isMobileEva && options.autoHide !== false) {
            scheduleMobileBubbleHide(MOBILE_TAP_BUBBLE_MS);
          }
        }

        function resetEva() {
          if (introActive) return;
          isReacting = false;
          isIdle = false;
          setSprite(eva.default);
          hideBubble(320);
          startIdleTimer();
        }

        async function playIntro() {
          preloadAllSprites();

          await preloadSprite(eva.pouring);
          spriteA.src = eva.pouring;
          spriteB.src = eva.pouring;
          currentSprite = eva.pouring;

          showBubble(getReturnPhrase(), "Eva");

          addIntroTimer(() => {
            setSprite(eva.surprised);
            showBubble(
              isReturningUser
                ? "Хорошо. Я открыла страницу с того же настроения. Осмотритесь ещё раз."
                : "О. Вы уже здесь? Тогда посмотрим, что вам подойдёт.",
              "Eva"
            );
          }, 1550);

          addIntroTimer(() => {
            introActive = false;
            setSprite(eva.default);
            if (isMobileEva) {
              scheduleMobileBubbleHide(MOBILE_HELP_BUBBLE_MS);
            } else {
              hideBubble(1200);
            }
            startIdleTimer();
          }, 3450);
        }

        function setupDesktopEva() {
          reactiveItems.forEach((item) => {
            item.addEventListener("pointerenter", () => setEvaReaction(item));
            item.addEventListener("focusin", () => setEvaReaction(item));
            item.addEventListener("pointerleave", resetEva);
            item.addEventListener("focusout", resetEva);
          });
        }

        function setupMobileEva() {
          reactiveItems.forEach((item) => {
            item.addEventListener("click", (event) => {
              if (item.getAttribute("href") === "#") {
                event.preventDefault();
              }
              setEvaReaction(item);
            });
          });

          [spriteA, spriteB].forEach((sprite) => {
            sprite.addEventListener("click", () => {
              clearIntroTimers();
              isIdle = false;
              isReacting = true;
              setSprite(eva.speak);
              showBubble("На телефоне мыши нет. Просто листайте страницу или коснитесь карточки — я буду пояснять главное.", "Eva");
              scheduleMobileBubbleHide(MOBILE_HELP_BUBBLE_MS);
            });
          });

          if (!("IntersectionObserver" in window)) return;

          const observer = new IntersectionObserver((entries) => {
            const now = Date.now();
            if (introActive || isReacting || now < mobileCommentLockedUntil) return;

            const visible = entries
              .filter((entry) => entry.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visible) return;

            const item = visible.target;
            const key = item.id || item.dataset.speaker || item.className || item.textContent.slice(0, 30);
            if (key === lastMobileCommentKey) return;

            lastMobileCommentKey = key;
            mobileCommentLockedUntil = now + 3000;

            setSprite(eva.speak);
            showBubble(getEvaDialogue(item), item.dataset.speaker || "Eva", { item });
            scheduleMobileBubbleHide(MOBILE_SCROLL_BUBBLE_MS);
          }, {
            threshold: 0.55,
            rootMargin: "-18% 0px -28% 0px"
          });

          reactiveItems.forEach((item) => observer.observe(item));
        }

        if (isMobileEva) {
          setupMobileEva();
        } else {
          setupDesktopEva();
        }

        if (isMobileEva) {
          window.addEventListener("touchstart", (event) => {
            lastTouchY = event.touches?.[0]?.clientY || 0;
            noteUserActivity();
          }, { passive: true });

          window.addEventListener("touchmove", (event) => {
            const currentY = event.touches?.[0]?.clientY || 0;
            const isSwipe = Math.abs(currentY - lastTouchY) > 18;

            if (isSwipe && bubble.classList.contains("is-visible")) {
              scheduleMobileBubbleHide(MOBILE_SWIPE_EXTEND_MS);
            }

            noteUserActivity();
          }, { passive: true });

          ["keydown", "wheel", "scroll"].forEach((eventName) => {
            window.addEventListener(eventName, noteUserActivity, { passive: true });
          });
        } else {
          ["pointermove", "keydown", "wheel", "scroll", "touchstart"].forEach((eventName) => {
            window.addEventListener(eventName, noteUserActivity, { passive: true });
          });
        }

        window.addEventListener("beforeunload", () => saveMemory(true));

        window.evaMemory = {
          read: () => ({ ...memory }),
          clear: () => {
            try {
              window.localStorage.removeItem(STORAGE_KEY);
              Object.assign(memory, { ...defaultMemory });
              console.info("Память Евы очищена.");
            } catch (error) {
              console.warn("Не удалось очистить память Евы:", error);
            }
          }
        };

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", playIntro, { once: true });
        } else {
          playIntro();
        }
      })();
