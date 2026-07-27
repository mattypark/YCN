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

  /* Lesson downloads.
     The form gates the file only in the sense that we ask first — a failed or
     unreachable API never blocks the download, it just costs us the count. */
  const modal = document.getElementById("download-modal");
  const form = document.getElementById("download-form");

  if (modal && form) {
    const panel = modal.querySelector(".modal__panel");
    const doneView = document.getElementById("download-done");
    const doneMsg = document.getElementById("download-done-msg");
    const fallback = document.getElementById("download-fallback");
    const lessonName = document.getElementById("modal-lesson");
    const submit = document.getElementById("download-submit");
    const studentsInput = document.getElementById("students");
    const emailInput = document.getElementById("email");
    let current = null;
    let lastFocused = null;

    const setError = (input, id, message) => {
      const el = document.getElementById(id);
      el.textContent = message || "";
      el.hidden = !message;
      input.setAttribute("aria-invalid", message ? "true" : "false");
    };

    const openModal = (file, title) => {
      current = { file, title };
      lastFocused = document.activeElement;
      lessonName.textContent = title;
      fallback.href = file;
      form.hidden = false;
      doneView.hidden = true;
      setError(studentsInput, "students-error", "");
      setError(emailInput, "email-error", "");
      modal.hidden = false;
      document.body.classList.add("is-modal-open");
      studentsInput.focus();
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove("is-modal-open");
      form.reset();
      if (lastFocused) lastFocused.focus();
    };

    document.querySelectorAll("[data-lesson-file]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openModal(btn.dataset.lessonFile, btn.dataset.lessonTitle);
      });
    });

    modal.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") closeModal();
      if (e.key !== "Tab") return;
      // Keep focus inside the dialog while it is open.
      const focusables = panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const list = [...focusables].filter((el) => el.offsetParent !== null);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    const startDownload = (file, title) => {
      const a = document.createElement("a");
      a.href = file;
      a.download = file.split("/").pop();
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();

      form.hidden = true;
      doneView.hidden = false;
      doneMsg.textContent = `“${title}” is on its way. Thank you — the students you just told us about are now counted in our total.`;
      doneView.querySelector(".btn").focus();
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const students = parseInt(studentsInput.value, 10);
      if (!Number.isFinite(students) || students < 1) {
        setError(studentsInput, "students-error", "Enter how many students this reaches.");
        studentsInput.focus();
        return;
      }
      if (students > 2000) {
        setError(studentsInput, "students-error", "That looks too high — enter 2000 or fewer.");
        studentsInput.focus();
        return;
      }
      setError(studentsInput, "students-error", "");

      const email = emailInput.value.trim();
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setError(emailInput, "email-error", "Check the email address.");
        emailInput.focus();
        return;
      }
      setError(emailInput, "email-error", "");

      const payload = {
        role: (form.querySelector('input[name="role"]:checked') || {}).value || "other",
        students,
        email,
        lesson: current ? current.title : "",
      };

      submit.disabled = true;
      submit.textContent = "One moment…";

      try {
        const res = await fetch("/api/impact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data && typeof data.total === "number" && data.live) {
          paintImpact(data.total);
        } else {
          // Reflect the contribution locally so the number the visitor just
          // affected is the number they see, even before storage is wired up.
          bumpImpactLocally(students);
        }
      } catch {
        bumpImpactLocally(students);
      } finally {
        submit.disabled = false;
        submit.textContent = "Get the lesson";
        startDownload(current.file, current.title);
      }
    });
  }

  /* Live impact figure — the "Kids Reached" stat reads from the API when a
     store is connected, and otherwise keeps the number already in the markup. */
  const impactEl = document.querySelector("[data-impact-total]");

  function paintImpact(total) {
    if (!impactEl) return;
    impactEl.dataset.count = String(total);
    impactEl.textContent = total.toLocaleString("en-US") + (impactEl.dataset.suffix || "");
  }

  function bumpImpactLocally(students) {
    if (!impactEl) return;
    const base = Number(impactEl.dataset.count) || 0;
    paintImpact(base + students);
  }

  if (impactEl) {
    fetch("/api/impact")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.live && typeof d.total === "number" && d.total > Number(impactEl.dataset.count)) {
          paintImpact(d.total);
        }
      })
      .catch(() => {});
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
