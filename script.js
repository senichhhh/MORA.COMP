"use strict";

const $=(selector,root=document)=>root?.querySelector(selector);
const $$=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[];

const body=document.body;
const header=$(".site-header");
const intro=$("#cinematicIntro");

const menuButton=$(".menu-button");
const mobileMenu=$(".mobile-menu");

const navLinks=$$(".nav-link");
const sections=$$("main > section[id]");
const stages=$$(".stage");

const projectTrack=$(".project-track");
const projectPrev=$(".project-prev");
const projectNext=$(".project-next");

const projectCase=$("#projectCase");
const projectCaseClose=$(".project-case__close",projectCase);

const contactForm=$(".contact-form");
const formStatus=$(".form-status");
const submitButton=$(".pill-cta--button");

const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)");

let mainRAF=0;


/* =========================================================
   YEAR
   ========================================================= */

$$(".js-year").forEach(el=>{
  el.textContent=new Date().getFullYear();
});


/* =========================================================
   INTRO
   ========================================================= */

function finishIntro(){

  if(!intro||intro.classList.contains("is-done")) return;

  intro.classList.add("is-done");

  body.classList.remove("intro-playing");
  body.classList.add("is-ready");

  $$("#home .reveal").forEach(el=>{
    el.classList.add("is-visible");
  });

}

if(reduceMotion.matches){

  finishIntro();

}else{

  body.classList.add("intro-playing");

  setTimeout(
    finishIntro,
    4200
  );

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setMenu(open){

  menuButton?.classList.toggle("is-active",open);
  mobileMenu?.classList.toggle("is-open",open);

  body.classList.toggle("menu-open",open);

  menuButton?.setAttribute(
    "aria-expanded",
    String(open)
  );

  mobileMenu?.setAttribute(
    "aria-hidden",
    String(!open)
  );

}

menuButton?.addEventListener("click",()=>{

  setMenu(
    !mobileMenu.classList.contains("is-open")
  );

});

$$(".mobile-menu a").forEach(link=>{

  link.addEventListener("click",()=>{
    setMenu(false);
  });

});


/* =========================================================
   REVEAL
   ========================================================= */

if(
  "IntersectionObserver" in window &&
  !reduceMotion.matches
){

  const revealObserver=new IntersectionObserver(
    (entries,observer)=>{

      entries.forEach(entry=>{

        if(!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");

        observer.unobserve(entry.target);

      });

    },
    {
      threshold:.1,
      rootMargin:"0px 0px -8% 0px"
    }
  );


  $$(".reveal").forEach(el=>{

    if(!el.closest("#home")){
      revealObserver.observe(el);
    }

  });


  const stageObserver=new IntersectionObserver(
    entries=>{

      entries.forEach(entry=>{

        entry.target.classList.toggle(
          "is-near",
          entry.isIntersecting
        );

      });

    },
    {
      rootMargin:"100% 0px"
    }
  );


  stages.forEach(stage=>{
    stageObserver.observe(stage);
  });

}else{

  $$(".reveal").forEach(el=>{
    el.classList.add("is-visible");
  });

  stages.forEach(stage=>{
    stage.classList.add("is-near");
  });

}


/* =========================================================
   NAV
   ========================================================= */

function updateNav(){

  const marker=
    scrollY+
    (header?.offsetHeight||0)+
    innerHeight*.28;

  let active="home";


  sections.forEach(section=>{

    if(section.offsetTop<=marker){
      active=section.id;
    }

  });


  if(active==="concept-flow"){
    active="home";
  }


  navLinks.forEach(link=>{

    link.classList.toggle(
      "is-active",
      link.getAttribute("href")===`#${active}`
    );

  });

}


/* =========================================================
   SCROLL EFFECT
   ========================================================= */

function updateScrollEffects(){

  if(reduceMotion.matches) return;

  const viewportCenter=innerHeight/2;


  stages.forEach(stage=>{

    if(!stage.classList.contains("is-near")) return;


    const rect=stage.getBoundingClientRect();

    const center=
      rect.top+
      rect.height/2;


    const distance=Math.max(
      -1,
      Math.min(
        1,
        (center-viewportCenter)/innerHeight
      )
    );


    const typography=$(".transition-type",stage);


    if(typography){

      typography.style.transform=
        `translate3d(${distance*-160}px,-50%,0)`;

    }

  });

}


/* =========================================================
   SCROLL RAF
   ========================================================= */

function updateFrame(){

  mainRAF=0;

  header?.classList.toggle(
    "is-scrolled",
    scrollY>28
  );

  updateNav();
  updateScrollEffects();

}


function requestUpdate(){

  if(mainRAF) return;

  mainRAF=requestAnimationFrame(updateFrame);

}


addEventListener(
  "scroll",
  requestUpdate,
  {passive:true}
);

addEventListener(
  "resize",
  requestUpdate,
  {passive:true}
);

updateFrame();


/* =========================================================
   PORTFOLIO CAROUSEL
   ========================================================= */

function projectStep(){

  const card=$(".project-card",projectTrack);

  if(!projectTrack||!card) return 340;


  const gap=
    parseFloat(
      getComputedStyle(projectTrack).columnGap
    )||20;


  return(
    card.getBoundingClientRect().width+
    gap
  );

}


function updateProjectButtons(){

  if(
    !projectTrack||
    !projectPrev||
    !projectNext
  ) return;


  const max=
    projectTrack.scrollWidth-
    projectTrack.clientWidth;


  projectPrev.disabled=
    projectTrack.scrollLeft<6;


  projectNext.disabled=
    projectTrack.scrollLeft>max-6;

}


projectNext?.addEventListener("click",()=>{

  projectTrack.scrollBy({
    left:projectStep(),
    behavior:"smooth"
  });

});


projectPrev?.addEventListener("click",()=>{

  projectTrack.scrollBy({
    left:-projectStep(),
    behavior:"smooth"
  });

});


projectTrack?.addEventListener(
  "scroll",
  ()=>requestAnimationFrame(updateProjectButtons),
  {passive:true}
);

updateProjectButtons();


/* =========================================================
   PROJECT MOUSE DRAG
   ========================================================= */

if(projectTrack){

  let dragging=false;
  let startX=0;
  let startScroll=0;
  let distance=0;


  projectTrack.addEventListener(
    "pointerdown",
    event=>{

      if(event.pointerType!=="mouse") return;

      dragging=true;
      distance=0;

      startX=event.clientX;
      startScroll=projectTrack.scrollLeft;

      projectTrack.classList.add("is-dragging");

      projectTrack.setPointerCapture(
        event.pointerId
      );

    }
  );


  projectTrack.addEventListener(
    "pointermove",
    event=>{

      if(!dragging) return;

      distance=
        event.clientX-
        startX;

      projectTrack.scrollLeft=
        startScroll-
        distance;

    }
  );


  function stopDrag(event){

    if(!dragging) return;

    dragging=false;

    projectTrack.classList.remove("is-dragging");


    if(
      event?.pointerId &&
      projectTrack.hasPointerCapture(event.pointerId)
    ){

      projectTrack.releasePointerCapture(
        event.pointerId
      );

    }

  }


  projectTrack.addEventListener(
    "pointerup",
    stopDrag
  );

  projectTrack.addEventListener(
    "pointercancel",
    stopDrag
  );


  projectTrack.addEventListener(
    "click",
    event=>{

      if(Math.abs(distance)>7){

        event.preventDefault();
        event.stopPropagation();

      }

    },
    true
  );

}


/* =========================================================
   PROJECT FULLSCREEN
   ========================================================= */

function openProject(card,visual){

  if(
    !projectCase||
    !card||
    !visual||
    body.classList.contains("case-open")
  ) return;


  const rect=
    visual.getBoundingClientRect();


  const clone=
    visual.cloneNode(true);


  const radius=
    getComputedStyle(visual).borderRadius;


  clone.classList.add(
    "project-transition-clone"
  );


  Object.assign(
    clone.style,
    {
      left:`${rect.left}px`,
      top:`${rect.top}px`,
      width:`${rect.width}px`,
      height:`${rect.height}px`,
      borderRadius:radius
    }
  );


  document.body.appendChild(clone);

  body.classList.add("case-open");


  clone.animate(
    [
      {
        transform:"translate3d(0,0,0) scale(1)",
        borderRadius:radius
      },
      {
        transform:
          `translate3d(${-rect.left}px,${-rect.top}px,0) scale(${innerWidth/rect.width},${innerHeight/rect.height})`,
        borderRadius:"0px"
      }
    ],
    {
      duration:680,
      easing:"cubic-bezier(.22,1,.36,1)",
      fill:"forwards"
    }
  );


  $(".project-case__category",projectCase).textContent=
    card.dataset.category||"";

  $(".project-case__title",projectCase).textContent=
    card.dataset.project||"";

  $(".project-case__description",projectCase).textContent=
    card.dataset.description||"";

  $(".project-case__year",projectCase).textContent=
    card.dataset.year||"";


  setTimeout(
    ()=>{

      projectCase.classList.add("is-open");

      projectCase.setAttribute(
        "aria-hidden",
        "false"
      );

      clone.remove();

    },
    610
  );

}


function closeProject(){

  if(
    !projectCase?.classList.contains("is-open")
  ) return;


  projectCase.classList.remove("is-open");

  projectCase.setAttribute(
    "aria-hidden",
    "true"
  );


  setTimeout(
    ()=>{
      body.classList.remove("case-open");
    },
    360
  );

}


$$(".project-open").forEach(visual=>{

  visual.addEventListener(
    "click",
    event=>{

      event.preventDefault();

      openProject(
        visual.closest(".project-card"),
        visual
      );

    }
  );

});


projectCaseClose?.addEventListener(
  "click",
  closeProject
);


projectCase?.addEventListener(
  "click",
  event=>{

    if(event.target===projectCase){
      closeProject();
    }

  }
);


/* PROJECT TO CONTACT */

$("a[href='#contact']",projectCase)?.addEventListener(
  "click",
  ()=>{

    closeProject();


    setTimeout(
      ()=>{

        $("#contact")?.scrollIntoView({
          behavior:"smooth"
        });

      },
      380
    );

  }
);


/* =========================================================
   ESC
   ========================================================= */

document.addEventListener(
  "keydown",
  event=>{

    if(event.key!=="Escape") return;

    setMenu(false);
    closeProject();

  }
);


/* =========================================================
   CONTACT FORM
   ========================================================= */

contactForm?.addEventListener(
  "submit",
  event=>{

    event.preventDefault();


    if(!formStatus) return;


    if(!contactForm.checkValidity()){

      formStatus.textContent=
        "Будь ласка, заповніть усі обов’язкові поля.";

      formStatus.className=
        "form-status is-error";

      contactForm.reportValidity();

      return;

    }


    submitButton.disabled=true;

    formStatus.textContent=
      "Надсилання...";

    formStatus.className=
      "form-status";


    setTimeout(
      ()=>{

        formStatus.textContent=
          "Дякую! Запит успішно підготовлено.";

        formStatus.className=
          "form-status is-success";

        contactForm.reset();

        submitButton.disabled=false;

      },
      700
    );

  }
);

/* =========================================================
   ACCESSIBILITY + SMALL PERFORMANCE ENHANCEMENTS
   ========================================================= */

// Keep aria-current in sync with the visible navigation state.
const syncAriaCurrent=()=>{
  navLinks.forEach(link=>{
    if(link.classList.contains("is-active")) link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  });
};

const originalUpdateNav=updateNav;
updateNav=function(){
  originalUpdateNav();
  syncAriaCurrent();
};

syncAriaCurrent();

// Pause purely decorative motion while the tab is hidden.
document.addEventListener("visibilitychange",()=>{
  document.documentElement.classList.toggle("page-hidden",document.hidden);
});
