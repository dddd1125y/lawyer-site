/* =========================================================
   머니레이더 — 결제 페이지
   토스페이먼츠 결제위젯(v2)으로 기간제 이용권을 단건 결제한다.
   자동갱신(빌링)이 아니라 30일 / 365일짜리 이용권을 파는 방식이라
   별도의 빌링 계약 심사 없이 시작할 수 있다.
   ========================================================= */
(function () {
    'use strict';

    var cfg = window.MR_CONFIG || {};
    var planBox = document.getElementById('planChoice');
    var methodEl = document.getElementById('payment-method');
    var agreeEl = document.getElementById('payment-agreement');
    var payBtn = document.getElementById('payBtn');
    var notice = document.getElementById('checkoutNotice');
    var summary = document.getElementById('planSummary');
    if (!planBox || !payBtn) return;

    var plans = cfg.plans || {};
    var current = plans.monthly;
    var widgets = null;
    var ready = false;

    function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }

    /* ---------- 요금제 선택 ---------- */
    function paintSummary() {
        if (!summary || !current) return;
        var perMonth = current.id === 'yearly' ? Math.round(current.amount / 12) : current.amount;
        summary.innerHTML =
            '<div class="row"><span class="k">선택한 이용권</span><span class="v">' + current.name + '</span></div>' +
            '<div class="row"><span class="k">이용 기간</span><span class="v">' + current.days + '일</span></div>' +
            '<div class="row"><span class="k">월 환산</span><span class="v">' + won(perMonth) + '</span></div>' +
            '<div class="row is-total"><span class="k">결제 금액</span><span class="v">' + won(current.amount) + '</span></div>';
    }

    planBox.addEventListener('click', function (e) {
        var card = e.target.closest('[data-plan]');
        if (!card) return;
        var next = plans[card.getAttribute('data-plan')];
        if (!next || next === current) return;
        current = next;
        planBox.querySelectorAll('[data-plan]').forEach(function (n) {
            n.classList.toggle('is-picked', n === card);
            n.setAttribute('aria-pressed', n === card ? 'true' : 'false');
        });
        paintSummary();
        if (widgets) widgets.setAmount({ currency: 'KRW', value: current.amount });
    });

    paintSummary();

    /* ---------- 결제 준비 ---------- */
    function showNotice(html, kind) {
        if (!notice) return;
        notice.className = kind === 'error' ? 'notice' : 'callout';
        notice.innerHTML = html;
        notice.hidden = false;
    }

    if (!cfg.isPaymentReady) {
        /* 결제 키가 아직 없으면 위젯을 띄우지 않고 안내만 한다 */
        payBtn.disabled = true;
        payBtn.textContent = '결제 준비 중입니다';
        payBtn.style.opacity = '0.55';
        payBtn.style.cursor = 'not-allowed';
        showNotice('<b>결제 기능을 준비하고 있습니다.</b><br>' +
            '토스페이먼츠 심사가 끝나는 대로 바로 열립니다. ' +
            '그동안 <a href="index.html">모든 계산기는 무료로</a> 사용하실 수 있습니다.');
        if (methodEl) methodEl.hidden = true;
        if (agreeEl) agreeEl.hidden = true;
        return;
    }

    if (!window.TossPayments) {
        payBtn.disabled = true;
        showNotice('<b>결제 모듈을 불러오지 못했습니다.</b><br>' +
            '광고 차단 확장 프로그램을 끄고 새로고침해 주세요.', 'error');
        return;
    }

    /* 고객 구분용 키 — 개인정보가 아니라 이 브라우저를 가리키는 임의의 값 */
    var customerKey = null;
    try {
        customerKey = localStorage.getItem('mr_customer_key');
        if (!customerKey) {
            customerKey = 'mr_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('mr_customer_key', customerKey);
        }
    } catch (e) {
        customerKey = 'mr_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    payBtn.disabled = true;
    payBtn.textContent = '결제 수단을 불러오는 중…';

    var toss = window.TossPayments(cfg.tossClientKey);
    widgets = toss.widgets({ customerKey: customerKey });

    widgets.setAmount({ currency: 'KRW', value: current.amount })
        .then(function () {
            return Promise.all([
                widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
                widgets.renderAgreement({ selector: '#payment-agreement', variantKey: 'AGREEMENT' })
            ]);
        })
        .then(function () {
            ready = true;
            payBtn.disabled = false;
            payBtn.textContent = '결제하고 바로 시작하기';
        })
        .catch(function (err) {
            payBtn.textContent = '결제 수단을 불러오지 못했습니다';
            showNotice('<b>결제 수단을 불러오지 못했습니다.</b><br>' +
                '잠시 후 다시 시도해 주세요. (' + (err && err.message ? err.message : '알 수 없는 오류') + ')', 'error');
        });

    /* ---------- 결제 요청 ---------- */
    payBtn.addEventListener('click', function () {
        if (!ready || !widgets) return;

        /* 주문번호는 영문/숫자/-/_ 로 6~64자 */
        var orderId = 'mr-' + current.id + '-' + Date.now().toString(36) +
                      '-' + Math.random().toString(36).slice(2, 8);
        try { sessionStorage.setItem('mr_order_plan', current.id); } catch (e) {}

        var origin = location.origin + location.pathname.replace(/[^/]*$/, '');

        widgets.requestPayment({
            orderId: orderId,
            orderName: '머니레이더 ' + current.name,
            successUrl: origin + 'checkout-success.html',
            failUrl: origin + 'checkout-fail.html'
        }).catch(function (err) {
            if (err && err.code === 'USER_CANCEL') return;   /* 사용자가 직접 닫은 경우는 알릴 필요가 없다 */
            showNotice('<b>결제를 시작하지 못했습니다.</b><br>' +
                (err && err.message ? err.message : '잠시 후 다시 시도해 주세요.'), 'error');
        });
    });
})();
