/* =========================================================
   머니레이더 — 공용 스크립트 (모든 페이지)
   ========================================================= */
(function () {
    'use strict';

    /* ---------- 모바일 메뉴 ---------- */
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('mobileMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', function () {
            var open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
            toggle.setAttribute('aria-label', open ? '메뉴 열기' : '메뉴 닫기');
            menu.classList.toggle('is-open', !open);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) {
                menu.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.focus();
            }
        });
    }

    /* ---------- 푸터 연도 ---------- */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- 토스트 ---------- */
    var toastEl = null;
    var toastTimer = null;

    window.mrToast = function (message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        /* 강제 리플로우로 재실행 시에도 트랜지션이 동작하도록 */
        void toastEl.offsetWidth;
        toastEl.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2200);
    };

    /* ---------- 링크 복사 ---------- */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-copy-link]');
        if (!btn) return;
        var url = location.href;

        function fallback() {
            var input = document.createElement('input');
            input.value = url;
            input.setAttribute('readonly', '');
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            try { document.execCommand('copy'); window.mrToast('링크를 복사했습니다'); }
            catch (err) { window.mrToast('복사에 실패했습니다. 주소창의 URL을 사용해 주세요'); }
            document.body.removeChild(input);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                window.mrToast('계산 결과 링크를 복사했습니다');
            }, fallback);
        } else {
            fallback();
        }
    });
})();
