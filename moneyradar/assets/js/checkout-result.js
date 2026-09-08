/* =========================================================
   머니레이더 — 결제 결과 처리
   토스페이먼츠가 successUrl 로 돌려준 값을 서버에 넘겨 최종 승인한다.
   승인이 끝나야 실제로 결제가 완료되며, 서버는 이용권 키를 발급한다.
   ========================================================= */
(function () {
    'use strict';

    var box = document.getElementById('payResult');
    if (!box) return;

    var cfg = window.MR_CONFIG || {};
    var q = new URLSearchParams(location.search);
    var mode = document.body.getAttribute('data-result');   /* success | fail */

    function view(html) { box.innerHTML = html; }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* ---------- 실패 ---------- */
    if (mode === 'fail') {
        var code = q.get('code') || '';
        var msg = q.get('message') || '결제가 완료되지 않았습니다.';
        var friendly = {
            PAY_PROCESS_CANCELED: '결제를 취소하셨습니다. 언제든 다시 시도하실 수 있습니다.',
            PAY_PROCESS_ABORTED: '결제가 중단되었습니다. 카드 정보를 다시 확인해 주세요.',
            REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드로 시도해 보세요.'
        }[code];

        view(
            '<div class="result-hero is-warn"><div class="k">결제 결과</div>' +
            '<div class="v" style="font-size:26px">결제가 완료되지 않았습니다</div>' +
            '<div class="sub">' + esc(friendly || msg) + '</div></div>' +
            '<div class="result-note">아무 금액도 청구되지 않았습니다. ' +
            (code ? '오류 코드: <b>' + esc(code) + '</b><br>' : '') +
            '문제가 반복되면 <a href="mailto:fkfyddk0822@gmail.com">fkfyddk0822@gmail.com</a> 으로 알려주세요.</div>' +
            '<div style="padding:18px 22px"><a class="btn" href="checkout.html">다시 시도하기</a> ' +
            '<a class="btn btn--ghost" href="index.html" style="margin-left:8px">무료로 계속 쓰기</a></div>'
        );
        return;
    }

    /* ---------- 성공 (서버 승인 필요) ---------- */
    var paymentKey = q.get('paymentKey');
    var orderId = q.get('orderId');
    var amount = q.get('amount');

    if (!paymentKey || !orderId || !amount) {
        view('<div class="result-hero is-warn"><div class="k">결제 정보 없음</div>' +
             '<div class="v" style="font-size:26px">확인할 결제가 없습니다</div>' +
             '<div class="sub">결제 페이지에서 다시 시작해 주세요</div></div>' +
             '<div style="padding:18px 22px"><a class="btn" href="checkout.html">결제 페이지로</a></div>');
        return;
    }

    if (!cfg.apiBase) {
        view('<div class="result-hero is-warn"><div class="k">승인 서버 미설정</div>' +
             '<div class="v" style="font-size:26px">결제를 확정하지 못했습니다</div>' +
             '<div class="sub">결제 승인 서버가 아직 연결되지 않았습니다</div></div>' +
             '<div class="result-note">이 화면이 보인다면 결제가 <b>승인되지 않은 상태</b>입니다. ' +
             '카드사 승인 전이므로 실제 청구는 발생하지 않지만, ' +
             '주문번호 <b>' + esc(orderId) + '</b> 를 남겨 두었다가 문의해 주세요.</div>');
        return;
    }

    view('<div class="result-hero"><div class="k">결제 확인 중</div>' +
         '<div class="v" style="font-size:26px">잠시만 기다려 주세요…</div>' +
         '<div class="sub">카드사 승인을 확정하고 있습니다. 창을 닫지 마세요.</div></div>');

    fetch(cfg.apiBase.replace(/\/$/, '') + '/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey: paymentKey, orderId: orderId, amount: Number(amount) })
    })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
            if (!r.ok || !r.data || !r.data.licenseKey) {
                throw new Error((r.data && (r.data.message || r.data.error)) || '승인에 실패했습니다');
            }

            if (window.MRPro) window.MRPro.setLicense(r.data.licenseKey);

            var until = r.data.expiresAt ? String(r.data.expiresAt).slice(0, 10) : '';
            view(
                '<div class="result-hero"><div class="k">결제 완료</div>' +
                '<div class="v" style="font-size:30px">프로가 시작됐습니다</div>' +
                '<div class="sub">' + (until ? until + '까지 이용하실 수 있습니다' : '이용권이 활성화되었습니다') + '</div></div>' +
                '<div class="rows">' +
                '<div class="row"><span class="k">주문번호</span><span class="v">' + esc(orderId) + '</span></div>' +
                '<div class="row"><span class="k">결제 금액</span><span class="v">' + Number(amount).toLocaleString('ko-KR') + '원</span></div>' +
                (until ? '<div class="row is-total"><span class="k">이용 만료일</span><span class="v">' + esc(until) + '</span></div>' : '') +
                '</div>' +
                '<div class="plain"><div class="plain-t">이용권 키를 꼭 보관하세요</div>' +
                '<p style="margin-top:6px">다른 기기(휴대폰·회사 PC)에서 프로를 쓰려면 이 키가 필요합니다. ' +
                '이 브라우저에는 이미 저장했습니다.</p>' +
                '<div class="formula" style="margin-top:10px;user-select:all;word-break:break-all">' + esc(r.data.licenseKey) + '</div>' +
                '<div class="btn-row"><button type="button" class="btn btn--sm" id="copyLicense">이용권 키 복사</button>' +
                '<a class="btn btn--ghost btn--sm" href="account.html">이용권 관리</a>' +
                '<a class="btn btn--ghost btn--sm" href="index.html">계산기로 가기</a></div></div>'
            );

            var copy = document.getElementById('copyLicense');
            if (copy) {
                copy.addEventListener('click', function () {
                    var key = r.data.licenseKey;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(key).then(function () {
                            window.mrToast && window.mrToast('이용권 키를 복사했습니다');
                        });
                    } else {
                        window.mrToast && window.mrToast('키를 길게 눌러 복사해 주세요');
                    }
                });
            }
        })
        .catch(function (err) {
            view('<div class="result-hero is-warn"><div class="k">승인 실패</div>' +
                 '<div class="v" style="font-size:26px">결제를 확정하지 못했습니다</div>' +
                 '<div class="sub">' + esc(err.message) + '</div></div>' +
                 '<div class="result-note">카드사 승인이 완료되지 않았으므로 <b>금액은 청구되지 않습니다.</b><br>' +
                 '주문번호 <b>' + esc(orderId) + '</b> 와 함께 ' +
                 '<a href="mailto:fkfyddk0822@gmail.com">fkfyddk0822@gmail.com</a> 으로 알려주시면 바로 확인하겠습니다.</div>' +
                 '<div style="padding:18px 22px"><a class="btn" href="checkout.html">다시 시도하기</a></div>');
        });
})();
