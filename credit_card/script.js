(() => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav a");
  const reveals = document.querySelectorAll(".reveal");
  const tiltCards = document.querySelectorAll(".benefit-card, .step, .tariff-panel, .help-card, .trust-card");

  burger?.addEventListener("click", () => {
    const opened = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(opened));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav?.classList.remove("is-open");
      burger?.setAttribute("aria-expanded", "false");
    });
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    reveals.forEach((item) => revealObserver.observe(item));

    const sections = [...navLinks]
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    }, { threshold: 0.35, rootMargin: "-16% 0px -58% 0px" });

    sections.forEach((section) => navObserver.observe(section));
  } else {
    reveals.forEach((item) => item.classList.add("is-visible"));
  }

  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canTilt) {
    tiltCards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        if (card.classList.contains("is-eva-talking")) return;
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
        card.style.transform = `translateY(-4px) rotateX(${y}deg) rotateY(${x}deg)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  const sprite = document.getElementById("evaSprite");
  const bubble = document.getElementById("bubble");
  const bubbleText = document.getElementById("bubbleText");
  const bubbleSpeaker = document.getElementById("bubbleSpeaker");
  const reactiveItems = document.querySelectorAll(".eva-react");
  const isMobileEva = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 560px)").matches;

  if (!sprite || !bubble || !bubbleText || !bubbleSpeaker) return;

  const eva = {
    cup: "../sp/eva_standing_cup.png",
    speak: "../sp/eva_standing_speak.png",
    boring: "../sp/eva_boring_cup.png",
    normal: "../sp/evz_normal.png",
    pot: "../sp/eva_tea_pot.png",
    surprised: "../sp/eva_tea_pot_suprised.png"
  };

  const STORAGE_KEY = "chb_platinum_eva_memory_v1";
  const IDLE_DELAY = 11000;
  const MOBILE_BUBBLE_MS = 8500;

  let idleTimer = null;
  let hideTimer = null;
  let textTimer = null;
  let introActive = true;
  let isReacting = false;
  let lastMobileKey = "";
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
      return raw ? { visits: 0, lastSeenAt: "", lastDialogue: "", ...JSON.parse(raw) } : { visits: 0, lastSeenAt: "", lastDialogue: "" };
    } catch {
      return { visits: 0, lastSeenAt: "", lastDialogue: "" };
    }
  }

  function saveMemory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {}
  }

  function setSprite(src) {
    if (!src) return;
    sprite.classList.remove("is-active");
    const image = new Image();
    image.onload = () => {
      sprite.src = src;
      requestAnimationFrame(() => sprite.classList.add("is-active"));
    };
    image.onerror = () => sprite.classList.add("is-active");
    image.src = src;
  }

  function showBubble(text, speaker = "Eva", duration = isMobileEva ? MOBILE_BUBBLE_MS : 0) {
    clearTimeout(hideTimer);
    clearTimeout(textTimer);
    bubble.classList.add("is-visible");
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
    bubble.classList.remove("is-visible");
  }

  function startIdleTimer() {
    clearTimeout(idleTimer);
    if (introActive || isReacting) return;

    idleTimer = setTimeout(() => {
      setSprite(eva.boring);
      showBubble(
        isMobileEva
          ? "Я рядом. Листайте страницу или коснитесь блока — я поясню условия."
          : "Я всё ещё здесь. Наведите на любой блок, и я поясню условия.",
        "Eva",
        isMobileEva ? MOBILE_BUBBLE_MS : 0
      );
    }, IDLE_DELAY);
  }

  function noteActivity() {
    if (introActive) return;
    startIdleTimer();
  }

  function getDialogue(item) {
    if (!isMobileEva) return item.dataset.dialogue || "Я здесь. Просто наблюдаю.";

    if (item.classList.contains("hero-visual")) {
      return "Platinum — кредитка с дизайнами на выбор. Смотрится красиво, но сроки платежей важнее картинки.";
    }

    if (item.classList.contains("btn-primary") || item.classList.contains("top-action")) {
      return "Оформляйте только после проверки условий: лимит, льготный период, рассрочка и дата платежа.";
    }

    if (item.classList.contains("btn-secondary")) {
      return "Да, сначала подробности. Кредитные продукты не стоит оформлять на автопилоте.";
    }

    if (item.classList.contains("benefit-card") || item.classList.contains("step")) {
      const title = item.querySelector("h3")?.textContent?.trim() || "условие";
      const text = item.querySelector("p")?.textContent?.trim() || "";
      return `${title}. ${text}`;
    }

    if (item.classList.contains("tariff-panel")) {
      return "Здесь собрана короткая выжимка условий: лимит, 55 дней, обслуживание и рассрочка.";
    }

    if (item.classList.contains("help-card")) {
      return "Перед оформлением проверьте льготный период, дату платежа и условия рассрочки. Это реально важно.";
    }

    if (item.classList.contains("trust-card")) {
      return "Без справок и поручителей — удобно. Но решение по лимиту всё равно остаётся за банком.";
    }

    return item.dataset.dialogue || "Коснитесь блока — я поясню главное.";
  }

  function reactTo(item, options = {}) {
    clearTimeout(idleTimer);
    clearTimeout(hideTimer);
    introActive = false;
    isReacting = true;
    item.classList.add("is-eva-talking");
    setSprite(eva.speak);
    showBubble(getDialogue(item), item.dataset.speaker || "Eva", isMobileEva ? MOBILE_BUBBLE_MS : 0);

    if (isMobileEva || options.autoReset) {
      hideTimer = setTimeout(() => {
        isReacting = false;
        item.classList.remove("is-eva-talking");
        setSprite(eva.cup);
        hideBubble();
        startIdleTimer();
      }, isMobileEva ? MOBILE_BUBBLE_MS : 3600);
    }
  }

  function resetEva() {
    if (introActive) return;
    isReacting = false;
    reactiveItems.forEach((item) => item.classList.remove("is-eva-talking"));
    setSprite(eva.cup);
    hideTimer = setTimeout(hideBubble, 260);
    startIdleTimer();
  }

  function playIntro() {
    sprite.classList.add("is-active");
    setSprite(eva.pot);
    showBubble(
      returning
        ? "С возвращением. Platinum всё ещё ждёт внимательного взгляда."
        : "Чай почти готов. А условия Platinum уже можно разобрать.",
      "Eva",
      0
    );

    setTimeout(() => {
      setSprite(eva.surprised);
      showBubble("О. Вы уже здесь? Тогда разберём кредитку без лишнего тумана.", "Eva", 0);
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
      item.addEventListener("pointerenter", () => reactTo(item));
      item.addEventListener("focusin", () => reactTo(item));
      item.addEventListener("pointerleave", resetEva);
      item.addEventListener("focusout", resetEva);
    });
  }

  function setupMobile() {
    reactiveItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        if (item.getAttribute("href") === "#") event.preventDefault();
        reactTo(item);
      });
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const now = Date.now();
        if (introActive || isReacting || now < mobileLockUntil) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const item = visible.target;
        const key = item.id || item.dataset.speaker || item.querySelector("h3")?.textContent || item.className;
        if (key === lastMobileKey) return;

        lastMobileKey = key;
        mobileLockUntil = now + 3600;
        setSprite(eva.speak);
        showBubble(getDialogue(item), item.dataset.speaker || "Eva", MOBILE_BUBBLE_MS);
        hideTimer = setTimeout(() => {
          setSprite(eva.cup);
          hideBubble();
          startIdleTimer();
        }, MOBILE_BUBBLE_MS);
      }, { threshold: 0.55, rootMargin: "-18% 0px -28% 0px" });

      reactiveItems.forEach((item) => observer.observe(item));
    }

    window.addEventListener("touchstart", (event) => {
      lastTouchY = event.touches?.[0]?.clientY || 0;
      noteActivity();
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
      const currentY = event.touches?.[0]?.clientY || 0;
      const isSwipe = Math.abs(currentY - lastTouchY) > 18;
      if (isSwipe && bubble.classList.contains("is-visible")) {
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
    sprite.addEventListener("click", () => {
      introActive = false;
      isReacting = true;
      clearTimeout(hideTimer);
      setSprite(eva.speak);
      showBubble(
        isMobileEva
          ? "На телефоне я закреплена у экрана. Листайте или касайтесь блоков — я поясню главное."
          : "Я следую за прокруткой. Наведите на блок — и я поясню условия.",
        "Eva",
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

  isMobileEva ? setupMobile() : setupDesktop();
  setupEvaSpriteClick();

  ["pointermove", "keydown", "wheel", "scroll"].forEach((eventName) => {
    window.addEventListener(eventName, noteActivity, { passive: true });
  });

  playIntro();
})();
