/* =========================================================
   머니레이더 — 카카오 애드핏 렌더링
   config.js의 kakaoAdUnit이 비어 있으면 자리 표시자만 두고 아무 것도 하지 않습니다.
   ========================================================= */
(function () {
    var cfg = window.MR_CONFIG && window.MR_CONFIG.ads;
    var slots = document.querySelectorAll('[data-ad-slot]');
    if (!slots.length) return;

    if (!cfg || !cfg.isReady) {
        slots.forEach(function (el) {
            el.textContent = '광고 영역 (심사 승인 후 노출)';
        });
        return;
    }

    slots.forEach(function (el) {
        el.classList.add('is-live');
        el.textContent = '';
        var ins = document.createElement('ins');
        ins.className = 'kakao_ad_area';
        ins.style.display = 'none';
        ins.setAttribute('data-ad-unit', cfg.kakaoAdUnit);
        ins.setAttribute('data-ad-width', '320');
        ins.setAttribute('data-ad-height', '100');
        el.appendChild(ins);
    });

    var script = document.createElement('script');
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;
    document.body.appendChild(script);
})();
