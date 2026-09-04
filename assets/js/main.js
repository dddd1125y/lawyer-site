/* =========================================================
   WEB·BUILD — 공용 스크립트
   ========================================================= */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var body = document.body;

    /* ---------- Header state + scroll progress ---------- */
    var header = document.getElementById('siteHeader');
    var progress = document.getElementById('progress');

    function onScroll() {
        var y = window.scrollY;
        if (header) header.classList.toggle('is-scrolled', y > 8);
        if (progress && !body.classList.contains('is-leaving')) {
            var scrollable = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = (scrollable > 0 ? (y / scrollable) * 100 : 0) + '%';
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Scroll reveal ---------- */
    var revealEls = document.querySelectorAll('[data-reveal]');

    if ('IntersectionObserver' in window && !reduceMotion) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- Counters ---------- */
    function animateCount(el) {
        var target = parseFloat(el.dataset.count);
        var duration = 1200;
        var start = performance.now();

        function tick(now) {
            var p = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target);
            if (p < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    var counters = document.querySelectorAll('[data-count]');

    if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    countObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });

        counters.forEach(function (el) { countObserver.observe(el); });
    } else {
        counters.forEach(function (el) { el.textContent = el.dataset.count; });
    }

    /* ---------- Mobile menu (opaque panel, no page dimming) ---------- */
    var menuToggle = document.getElementById('menuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    var lastFocused = null;

    function openMenu() {
        if (!mobileMenu || !menuToggle) return;
        lastFocused = document.activeElement;
        mobileMenu.classList.add('is-open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', '메뉴 닫기');
        body.style.overflow = 'hidden';
        var first = mobileMenu.querySelector('a');
        if (first) first.focus({ preventScroll: true });
    }

    function closeMenu(skipFocus) {
        if (!mobileMenu || !menuToggle) return;
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', '메뉴 열기');
        body.style.overflow = '';
        if (!skipFocus && lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            if (menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
            else openMenu();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) closeMenu();
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 900 && mobileMenu && mobileMenu.classList.contains('is-open')) closeMenu(true);
    });

    /* ---------- Page transition on internal navigation ---------- */
    document.addEventListener('click', function (e) {
        if (reduceMotion || e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var link = e.target.closest('a[href]');
        if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

        var url;
        try { url = new URL(link.href, location.href); } catch (err) { return; }

        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname) return;

        e.preventDefault();
        closeMenu(true);
        body.classList.add('is-leaving');

        if (progress) {
            progress.style.transition = 'width 0.3s ease';
            progress.style.width = '100%';
        }

        window.setTimeout(function () { location.href = url.href; }, 300);
    });

    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            body.classList.remove('is-leaving');
            if (progress) { progress.style.transition = ''; progress.style.width = '0%'; }
        }
    });

    /* ---------- Contact form → mailto ---------- */
    var form = document.getElementById('contactForm');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = form.querySelector('#name').value.trim();
            var email = form.querySelector('#email').value.trim();
            var message = form.querySelector('#message').value.trim();
            var subject = '웹사이트 제작 문의: ' + name;
            var lines = ['이름: ' + name, '회신 이메일: ' + email, '', '문의 내용:', message];
            location.href = 'mailto:fkfyddk0822@gmail.com?subject=' +
                encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
        });
    }
})();
