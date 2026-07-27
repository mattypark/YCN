(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile nav toggle */
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  if (menuToggle && mobileNav) {
    const closeMenu = () => {
      menuToggle.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      mobileNav.classList.toggle("is-open", !isOpen);
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* Sticky header shadow after scroll */
  const header = document.getElementById("site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Stat counters — fire once via Intersection Observer.
     Markup already holds the final value; if this never runs
     (no JS, reduced motion, IO unsupported) the correct number stays visible. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    const statEls = document.querySelectorAll(".stat__number[data-count]");

    const animateCount = (el) => {
      const target = Number(el.dataset.count);
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const duration = 1100;
      const start = performance.now();

      const format = (n) =>
        prefix + n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        el.textContent = format(target);
      };

      const tick = (now) => {
        if (finished) return;
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (progress < 1) {
          el.textContent = format(target * eased);
          requestAnimationFrame(tick);
        } else {
          finish();
        }
      };
      requestAnimationFrame(tick);

      /* A stalled count must never leave a figure lower than the real one on
         screen, so snap to the true value on a timer too — rAF stops firing
         when the tab is backgrounded or frames are throttled. */
      setTimeout(finish, duration + 250);
    };

    const statObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    statEls.forEach((el) => statObserver.observe(el));
  }

  /* Signature moment — subtle scale/color emphasis on the accent word
     as it passes the pinned center. Pure decoration on top of a
     CSS-only sticky pin, so the section works without this script. */
  const signatureSection = document.querySelector(".signature");
  const accentWord = document.querySelector("[data-signature-accent]");

  if (!reduceMotion && signatureSection && accentWord) {
    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = signatureSection.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;

      const progress = Math.min(Math.max(-rect.top / total, 0), 1);
      // Peak emphasis around the midpoint of the pin.
      const emphasis = 1 - Math.abs(progress - 0.5) * 2;
      const scale = 1 + emphasis * 0.12;

      accentWord.style.transform = `scale(${scale.toFixed(3)})`;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  }
})();
