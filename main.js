/* ================================================
   Youth Civics Network — Main JavaScript
   Lenis smooth scroll + GSAP ScrollTrigger +
   velocity-based skew (SexyScroll-style) +
   hero entrance + counter animation
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(ScrollTrigger);

    /* ==========================================================
       LENIS — Buttery smooth scroll with momentum
       ========================================================== */
    const lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.5,
        infinite: false,
    });

    /* Connect Lenis → GSAP ScrollTrigger so both stay in sync */
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    /* ==========================================================
       GSAP HERO ENTRANCE — Tier 1 (only entrance animation)
       ========================================================== */
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl
        .to('.hero-headline', {
            opacity: 1,
            duration: 1,
            delay: 0.3,
        })
        .to('.hero-sub', {
            opacity: 1,
            duration: 0.8,
        }, '-=0.5')
        .to('.hero-ctas', {
            opacity: 1,
            duration: 0.8,
        }, '-=0.4');

    /* ==========================================================
       STATS COUNTER — Intersection Observer, fires once
       ========================================================== */
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    let statsAnimated = false;

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !statsAnimated) {
                statsAnimated = true;
                animateCounters();
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });

    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) statsObserver.observe(statsBar);

    function animateCounters() {
        statNumbers.forEach((el) => {
            const target = parseInt(el.dataset.target, 10);
            const duration = 2000;
            const start = performance.now();

            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target);
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    /* ==========================================================
       HOW IT WORKS — Title word slide-in + pinned horizontal scroll
       ========================================================== */
    const hiwSection = document.querySelector('.how-it-works');
    const hiwTrack = document.querySelector('.hiw-track');

    if (hiwSection && hiwTrack) {
        /* Title words slide up from bottom, one by one */
        gsap.to('.hiw-word', {
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: hiwSection,
                start: 'top 70%',
                once: true,
            },
        });

        /* Subtitle fades in left-to-right */
        gsap.fromTo('.hiw-sub',
            { opacity: 0, x: -60 },
            {
                opacity: 1,
                x: 0,
                duration: 0.9,
                delay: 0.4,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: hiwSection,
                    start: 'top 70%',
                    once: true,
                },
            }
        );

        /* Pin section — steps appear one at a time as you scroll.
           End state: all three lined up in a row. */
        const hiwSteps = gsap.timeline({
            scrollTrigger: {
                trigger: hiwSection,
                start: 'top top',
                end: '+=200%',
                pin: true,
                scrub: 1,
                anticipatePin: 1,
            },
        });

        hiwSteps
            .to('.hiw-panel:nth-child(1)', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
            .to('.hiw-panel:nth-child(2)', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '+=0.4')
            .to('.hiw-panel:nth-child(3)', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '+=0.4')
            .to({}, { duration: 0.6 }); /* brief hold with all three lined up */
    }

    /* ==========================================================
       SIGNATURE MOMENT — Pinned letter-by-letter scrub
       "D" → "De" → "Dem" ... then sub fades in
       ========================================================== */
    const sigLetters = document.querySelectorAll('.sig-letter');
    const sigSub = document.querySelector('.signature-sub');

    if (sigLetters.length) {
        const sigTl = gsap.timeline({
            scrollTrigger: {
                trigger: '.signature-moment',
                start: 'top top',
                end: '+=150%',
                pin: true,
                scrub: 1,
                anticipatePin: 1,
            },
        });

        sigTl
            .to(sigLetters, {
                opacity: 1,
                y: 0,
                stagger: 0.08,
                ease: 'power2.out',
            })
            .to(sigSub, {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
            }, '-=0.2');
    }

    /* ==========================================================
       MOBILE MENU
       ========================================================== */
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            const spans = menuToggle.querySelectorAll('span');
            const open = mobileMenu.classList.contains('active');
            spans[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : 'none';
            spans[1].style.opacity = open ? '0' : '1';
            spans[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : 'none';
        });

        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    /* ==========================================================
       ANCHOR LINKS — scroll via Lenis (not native)
       ========================================================== */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const id = anchor.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                lenis.scrollTo(target, { offset: -72, duration: 1.6 });
            }
        });
    });

    /* ==========================================================
       NAVBAR — opacity shift on scroll
       ========================================================== */
    const navbar = document.getElementById('navbar');

    lenis.on('scroll', ({ scroll }) => {
        navbar.classList.toggle('scrolled', scroll > 80);
    });

});
