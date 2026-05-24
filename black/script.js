(()=>{const sprite=document.getElementById("evaSprite"),bubble=document.getElementById("bubble"),bubbleText=document.getElementById("bubbleText"),bubbleSpeaker=document.getElementById("bubbleSpeaker"),reactiveItems=document.querySelectorAll(".eva-react"),isMobileEva=window.matchMedia("(hover: none), (pointer: coarse), (max-width: 560px)").matches;const eva={cup:"../sp/eva_standing_cup.png",speak:"../sp/eva_standing_speak.png",boring:"../sp/eva_boring_cup.png",normal:"../sp/evz_normal.png",pot:"../sp/eva_tea_pot.png",surprised:"../sp/eva_tea_pot_suprised.png"};const STORAGE_KEY="chb_black_eva_memory_v1",IDLE_DELAY=11000,MOBILE_BUBBLE_MS=8500;let idleTimer=null,hideTimer=null,textTimer=null,introActive=true,isReacting=false,lastMobileKey="",mobileLockUntil=0,lastTouchY=0;const memory=readMemory(),returning=memory.visits>0;memory.visits+=1;memory.lastSeenAt=new Date().toISOString();saveMemory();function readMemory(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?{visits:0,lastSeenAt:"",lastDialogue:"",...JSON.parse(raw)}:{visits:0,lastSeenAt:"",lastDialogue:""}}catch{return{visits:0,lastSeenAt:"",lastDialogue:""}}}function saveMemory(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(memory))}catch{}}function setSprite(src){if(!src)return;sprite.classList.remove("is-active");const image=new Image;image.onload=()=>{sprite.src=src;requestAnimationFrame(()=>sprite.classList.add("is-active"))};image.onerror=()=>sprite.classList.add("is-active");image.src=src}function showBubble(text,speaker="Eva",duration=isMobileEva?MOBILE_BUBBLE_MS:0){clearTimeout(hideTimer);clearTimeout(textTimer);bubble.classList.add("is-visible");textTimer=setTimeout(()=>{bubbleText.textContent=text;bubbleSpeaker.textContent=speaker;memory.lastDialogue=text;saveMemory()},80);if(duration){hideTimer=setTimeout(()=>{if(!isReacting)hideBubble()},duration)}}function hideBubble(){bubble.classList.remove("is-visible")}function startIdleTimer(){clearTimeout(idleTimer);if(introActive||isReacting)return;idleTimer=setTimeout(()=>{setSprite(eva.boring);showBubble(isMobileEva?"Я рядом. Листайте страницу или коснитесь блока — я поясню условия.":"Я всё ещё здесь. Наведите на любой блок, и я поясню условия.","Eva",isMobileEva?MOBILE_BUBBLE_MS:0)},IDLE_DELAY)}function noteActivity(){if(introActive)return;startIdleTimer()}function getDialogue(item){if(!isMobileEva)return item.dataset.dialogue||"Я здесь. Просто наблюдаю.";if(item.classList.contains("card-showcase"))return"Black — базовая карта для повседневных трат, зарплаты, пособий и переводов.";if(item.classList.contains("btn-primary"))return"Оформляйте только после проверки условий. Особенно обслуживания, лимитов и переводов.";if(item.classList.contains("btn-secondary"))return"Хороший выбор. Сначала условия, потом решение.";if(item.classList.contains("benefit-card")){const title=item.querySelector("h3")?.textContent?.trim()||"условие";const text=item.querySelector("p")?.textContent?.trim()||"";return`${title}. ${text}`}if(item.classList.contains("conditions-card"))return"Главный блок условий: бесплатное обслуживание, кэшбэк, лимиты и поддержка.";if(item.classList.contains("faq-item"))return item.querySelector("p")?.textContent?.trim()||"Этот пункт стоит прочитать перед оформлением.";return item.dataset.dialogue||"Коснитесь блока — я поясню главное."}function reactTo(item,options={}){clearTimeout(idleTimer);clearTimeout(hideTimer);introActive=false;isReacting=true;setSprite(eva.speak);showBubble(getDialogue(item),item.dataset.speaker||"Eva",isMobileEva?MOBILE_BUBBLE_MS:0);if(isMobileEva||options.autoReset){hideTimer=setTimeout(()=>{isReacting=false;setSprite(eva.cup);hideBubble();startIdleTimer()},isMobileEva?MOBILE_BUBBLE_MS:3600)}}function resetEva(){if(introActive)return;isReacting=false;setSprite(eva.cup);hideTimer=setTimeout(hideBubble,260);startIdleTimer()}function playIntro(){sprite.classList.add("is-active");setSprite(eva.pot);showBubble(returning?"С возвращением. Black всё ещё ждёт внимательного взгляда.":"Чай почти готов. А условия уже можно читать.","Eva",0);setTimeout(()=>{setSprite(eva.surprised);showBubble("О. Вы уже здесь? Тогда разберём Black без лишнего тумана.","Eva",0)},1500);setTimeout(()=>{introActive=false;setSprite(eva.cup);hideTimer=setTimeout(hideBubble,isMobileEva?MOBILE_BUBBLE_MS:1400);startIdleTimer()},3500)}function setupDesktop(){reactiveItems.forEach(item=>{item.addEventListener("pointerenter",()=>reactTo(item));item.addEventListener("focusin",()=>reactTo(item));item.addEventListener("pointerleave",resetEva);item.addEventListener("focusout",resetEva)})}function setupMobile(){reactiveItems.forEach(item=>{item.addEventListener("click",event=>{if(item.getAttribute("href")==="#")event.preventDefault();reactTo(item)})});sprite.addEventListener("click",()=>{introActive=false;isReacting=true;setSprite(eva.speak);showBubble("На телефоне просто листайте страницу или касайтесь блоков. Я поясню главное.","Eva",MOBILE_BUBBLE_MS);hideTimer=setTimeout(()=>{isReacting=false;setSprite(eva.cup);hideBubble();startIdleTimer()},MOBILE_BUBBLE_MS)});if("IntersectionObserver"in window){const observer=new IntersectionObserver(entries=>{const now=Date.now();if(introActive||isReacting||now<mobileLockUntil)return;const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;const item=visible.target,key=item.id||item.dataset.speaker||item.querySelector("h3")?.textContent||item.className;if(key===lastMobileKey)return;lastMobileKey=key;mobileLockUntil=now+3600;setSprite(eva.speak);showBubble(getDialogue(item),item.dataset.speaker||"Eva",MOBILE_BUBBLE_MS);hideTimer=setTimeout(()=>{setSprite(eva.cup);hideBubble();startIdleTimer()},MOBILE_BUBBLE_MS)},{threshold:.55,rootMargin:"-18% 0px -28% 0px"});reactiveItems.forEach(item=>observer.observe(item))}window.addEventListener("touchstart",event=>{lastTouchY=event.touches?.[0]?.clientY||0;noteActivity()},{passive:true});window.addEventListener("touchmove",event=>{const currentY=event.touches?.[0]?.clientY||0,isSwipe=Math.abs(currentY-lastTouchY)>18;if(isSwipe&&bubble.classList.contains("is-visible")){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!isReacting){setSprite(eva.cup);hideBubble();startIdleTimer()}},6500)}noteActivity()},{passive:true})}function setupEvaSpriteClick(){
  sprite.addEventListener("click",()=>{
    introActive=false;
    isReacting=true;
    clearTimeout(hideTimer);
    setSprite(eva.speak);
    showBubble(isMobileEva
      ?"На телефоне я закреплена у экрана. Листайте страницу или касайтесь блоков — я поясню главное."
      :"Я теперь следую за прокруткой. Наведите на блок — и я поясню условия.",
      "Eva",
      isMobileEva?MOBILE_BUBBLE_MS:0
    );
    if(isMobileEva){
      hideTimer=setTimeout(()=>{
        isReacting=false;
        setSprite(eva.cup);
        hideBubble();
        startIdleTimer();
      },MOBILE_BUBBLE_MS)
    }
  })
}
isMobileEva?setupMobile():setupDesktop();setupEvaSpriteClick();["pointermove","keydown","wheel","scroll"].forEach(eventName=>{window.addEventListener(eventName,noteActivity,{passive:true})});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",playIntro,{once:true}):playIntro()})();

const METRIKA_ID = 104029197;
const FUNCTION_URL = "https://functions.yandexcloud.net/ID_ФУНКЦИИ";
const POSTBACK_TOKEN = "Senri20Akane16";

function getMetrikaClientId() {
  return new Promise((resolve) => {
    let attempts = 0;

    const timer = setInterval(() => {
      attempts++;

      if (window.ym) {
        clearInterval(timer);

        ym(METRIKA_ID, "getClientID", function(clientID) {
          resolve(clientID || "");
        });
      }

      if (attempts > 40) {
        clearInterval(timer);
        resolve("");
      }
    }, 250);
  });
}

const METRIKA_ID = 104029197;

function getMetrikaClientId() {
  return new Promise((resolve) => {
    let attempts = 0;

    const timer = setInterval(() => {
      attempts++;

      if (window.ym) {
        clearInterval(timer);
        ym(METRIKA_ID, "getClientID", (clientID) => {
          resolve(clientID || "");
        });
      }

      if (attempts > 40) {
        clearInterval(timer);
        resolve("");
      }
    }, 250);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll('[data-function-link="true"]');

  buttons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      const clientID = await getMetrikaClientId();

      const url = new URL(button.href);
      url.searchParams.set("client_id", clientID || "no_client_id");

      window.location.href = url.toString();
    });
  });
});