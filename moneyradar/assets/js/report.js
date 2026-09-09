/* =========================================================
   머니레이더 — 결과 리포트 저장 (보상형)
   계산 결과 자체는 언제나 무료로 보이고, 인쇄용 리포트만 광고와 교환한다.
   광고 단위가 설정되지 않은 동안에는 기다림 없이 바로 저장된다.
   ========================================================= */
(function () {
    'use strict';

    var btn = document.querySelector('[data-report]');
    var result = document.getElementById('result');
    if (!btn || !result) return;

    var WAIT_SECONDS = 5;
    var modal = null;
    var countdownId = 0;

    function adsReady() {
        return Boolean(window.MR_ADS && window.MR_ADS.isReady);
    }

    function hasResult() {
        return Boolean(result.querySelector('.result-hero'));
    }

    /* ---------- 인쇄용 머리말 ---------- */
    function buildPrintHead() {
        if (document.querySelector('.print-head')) return;
        var title = document.querySelector('.panel-head h2');
        var now = new Date();
        var head = document.createElement('div');
        head.className = 'print-head print-only';
        head.innerHTML =
            '<div class="pb">머니레이더</div>' +
            '<h1>' + (title ? title.textContent.trim() : '계산 결과') + '</h1>' +
            '<div class="pd">' + now.getFullYear() + '년 ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일 계산</div>';
        result.parentNode.insertBefore(head, result);

        var foot = document.createElement('div');
        foot.className = 'print-foot print-only';
        foot.textContent = '계산 결과는 참고용 추정치이며 법적 효력이 없습니다. 실제 신청 전에는 관계 기관의 공식 정보를 확인하세요. · dddd1125y.github.io/lawyer-site/moneyradar/';
        result.parentNode.insertBefore(foot, result.nextSibling);
    }

    /* ---------- 인쇄 ---------- */
    /* 접힌 계산 과정을 펼치는 일은 인쇄용 CSS가 맡는다.
       DOM을 건드리지 않으므로 인쇄 후 되돌릴 것이 없다. */
    function print() {
        buildPrintHead();
        window.print();
    }

    /* ---------- 보상 모달 ---------- */
    function buildModal() {
        if (modal) return modal;
        modal = document.createElement('div');
        modal.className = 'reward';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'rewardTitle');
        modal.hidden = true;
        modal.innerHTML =
            '<div class="reward-box">' +
            '<h3 id="rewardTitle">결과 리포트로 저장하기</h3>' +
            '<p class="reward-d">광고를 잠시 보시면 계산 결과를 인쇄·PDF로 저장할 수 있습니다. ' +
            '<b>화면의 계산 결과는 지금도 무료</b>이며 저장 기능만 해당됩니다.</p>' +
            '<div class="ad-slot" data-reward-ad>광고 영역</div>' +
            '<div class="reward-cap">광고</div>' +
            '<div class="reward-actions">' +
            '<button type="button" class="btn btn--ghost btn--sm" data-reward-close>닫기</button>' +
            '<button type="button" class="btn btn--sm" data-reward-go disabled></button>' +
            '</div></div>';
        document.body.appendChild(modal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal || e.target.closest('[data-reward-close]')) close();
        });
        modal.querySelector('[data-reward-go]').addEventListener('click', function () {
            close();
            print();
        });
        return modal;
    }

    function close() {
        if (!modal || modal.hidden) return;
        clearInterval(countdownId);
        modal.hidden = true;
        document.body.style.overflow = '';
        btn.focus();
    }

    function open() {
        buildModal();
        modal.hidden = false;
        document.body.style.overflow = 'hidden';

        var go = modal.querySelector('[data-reward-go]');
        var adBox = modal.querySelector('[data-reward-ad]');
        if (window.MR_ADS && window.MR_ADS.fill(adBox) && window.MR_ADS.refresh) {
            window.MR_ADS.refresh();
        }

        var left = WAIT_SECONDS;
        go.disabled = true;
        go.textContent = left + '초 후 저장할 수 있어요';
        go.focus();

        clearInterval(countdownId);
        countdownId = setInterval(function () {
            left--;
            if (left > 0) {
                go.textContent = left + '초 후 저장할 수 있어요';
                return;
            }
            clearInterval(countdownId);
            go.disabled = false;
            go.textContent = '리포트 저장하기';
        }, 1000);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });

    btn.addEventListener('click', function () {
        if (!hasResult()) {
            if (window.mrToast) window.mrToast('먼저 값을 입력해 결과를 확인해 주세요');
            return;
        }
        /* 광고가 아직 준비되지 않았으면 괜한 기다림을 만들지 않는다 */
        if (adsReady()) open();
        else print();
    });
})();
