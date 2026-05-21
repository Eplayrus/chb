(() => {
        const spriteA = document.getElementById("evaSpriteA");
        const spriteB = document.getElementById("evaSpriteB");
        const bubble = document.getElementById("speechBubble");
        const bubbleText = document.getElementById("bubbleText");
        const bubbleSpeaker = document.getElementById("bubbleSpeaker");
        const reactiveItems = document.querySelectorAll(".eva-react");

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
          hideTimer = window.setTimeout(() => {
            bubble.classList.remove("is-visible");
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
            showBubble("я скучаю", "Eva");
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

        function setEvaReaction(item) {
          clearIntroTimers();
          clearIdleTimer();
          isIdle = false;
          isReacting = true;
          memory.interactions += 1;
          setSprite(eva.speak);
          showBubble(item.dataset.dialogue || "Я здесь. Просто наблюдаю.", item.dataset.speaker || "Eva", { item });
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
            hideBubble(1200);
            startIdleTimer();
          }, 3450);
        }

        reactiveItems.forEach((item) => {
          item.addEventListener("pointerenter", () => setEvaReaction(item));
          item.addEventListener("focusin", () => setEvaReaction(item));
          item.addEventListener("pointerleave", resetEva);
          item.addEventListener("focusout", resetEva);
        });

        ["pointermove", "keydown", "wheel", "scroll", "touchstart"].forEach((eventName) => {
          window.addEventListener(eventName, noteUserActivity, { passive: true });
        });

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
