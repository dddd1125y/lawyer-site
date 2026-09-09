/* =========================================================
   머니레이더 — 카카오 애드핏 렌더링
   config.js의 kakaoAdUnit이 비어 있으면 자리 표시자만 두고 아무 것도 불러오지 않습니다.
   ========================================================= */
(function () {
    'use strict';

    var cfg = window.MR_CONFIG && window.MR_CONFIG.ads;
    var isReady = Boolean(cfg && cfg.isReady);
    var PLACEHOLDER = '광고 영역 (심사 승인 후 노출)';

    /* 애드핏 로더는 문서에 붙은 <ins>를 훑어 광고를 채운다.
       나중에 생긴 슬롯(모달 등)은 스크립트를 다시 붙여야 인식된다. */
    function loadScript() {
        var script = document.createElement('script');
        script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
        script.async = true;
        document.body.appendChild(script);
    }

    /* 슬롯 하나를 광고로 채운다. 이미 채웠거나 광고 단위가 없으면 아무 것도 하지 않는다. */
    function fill(el) {
        if (!el || !isReady || el.querySelector('.kakao_ad_area')) return false;
        el.classList.add('is-live');
        el.textContent = '';
        var ins = document.createElement('ins');
        ins.className = 'kakao_ad_area';
        ins.style.display = 'none';
        ins.setAttribute('data-ad-unit', cfg.kakaoAdUnit);
        ins.setAttribute('data-ad-width', '320');
        ins.setAttribute('data-ad-height', '100');
        el.appendChild(ins);
        return true;
    }

    window.MR_ADS = { isReady: isReady, fill: fill };

    var slots = document.querySelectorAll('[data-ad-slot]');
    if (!slots.length) return;

    if (!isReady) {
        slots.forEach(function (el) { el.textContent = PLACEHOLDER; });
        return;
    }

    var filled = 0;
    slots.forEach(function (el) { if (fill(el)) filled++; });
    if (filled) loadScript();

    /* 모달처럼 뒤늦게 채워진 슬롯을 위해 로더를 다시 붙일 수 있게 열어둔다. */
    window.MR_ADS.refresh = loadScript;
})();
