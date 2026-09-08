/* =========================================================
   머니레이더 — 이용권 관리
   로그인이 없으므로, 이용권 키를 넣고 빼는 것이 곧 계정 관리다.
   ========================================================= */
(function () {
    'use strict';

    var box = document.getElementById('licenseState');
    var input = document.getElementById('licenseInput');
    var applyBtn = document.getElementById('licenseApply');
    var clearBtn = document.getElementById('licenseClear');
    if (!box || !window.MRPro) return;

    var Pro = window.MRPro;

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function daysLeft(iso) {
        var ms = Date.parse(iso) - Date.now();
        return ms > 0 ? Math.ceil(ms / 86400000) : 0;
    }

    function paint(state, offline) {
        var key = Pro.getLicense();

        if (state && state.active) {
            var left = state.expiresAt ? daysLeft(state.expiresAt) : null;
            box.innerHTML =
                '<div class="result-hero"><div class="k">이용 상태</div>' +
                '<div class="v" style="font-size:28px">프로 이용 중</div>' +
                '<div class="sub">' +
                (state.expiresAt ? String(state.expiresAt).slice(0, 10) + '까지 · ' + left + '일 남음' : '활성화됨') +
                (offline ? ' (서버 확인 실패 — 마지막 상태 표시)' : '') + '</div></div>' +
                '<div class="rows"><div class="row"><span class="k">이용권 키</span>' +
                '<span class="v" style="word-break:break-all;white-space:normal">' + esc(key) + '</span></div></div>';
        } else if (key) {
            box.innerHTML =
                '<div class="result-hero is-warn"><div class="k">이용 상태</div>' +
                '<div class="v" style="font-size:26px">만료되었거나 확인되지 않는 키</div>' +
                '<div class="sub">키가 만료되었거나 잘못 입력되었습니다</div></div>' +
                '<div class="result-note">키를 다시 확인하시거나, ' +
                '<a href="pricing.html">요금제 페이지</a>에서 새로 시작하실 수 있습니다.</div>';
        } else {
            box.innerHTML =
                '<div class="result-hero" style="background:var(--surface-2);color:var(--ink)">' +
                '<div class="k" style="opacity:1;color:var(--ink-3)">이용 상태</div>' +
                '<div class="v" style="font-size:26px">무료로 이용 중</div>' +
                '<div class="sub" style="opacity:1;color:var(--ink-3)">5가지 계산기를 제한 없이 쓰고 계십니다</div></div>' +
                '<div class="result-note">이미 결제하셨다면 아래에 이용권 키를 넣어 복원하세요. ' +
                '아직이라면 <a href="pricing.html">요금제</a>를 확인해 보세요.</div>';
        }
    }

    function refresh() {
        var s = Pro.state();
        paint(s);
        if (Pro.getLicense()) {
            Pro.verify().then(function (r) {
                paint(Pro.state(), r && r.offline);
            });
        }
    }

    if (applyBtn && input) {
        applyBtn.addEventListener('click', function () {
            var key = input.value.trim();
            if (!key) { window.mrToast && window.mrToast('이용권 키를 입력해 주세요'); return; }
            Pro.setLicense(key);
            applyBtn.disabled = true;
            applyBtn.textContent = '확인 중…';
            Pro.verify().then(function (r) {
                applyBtn.disabled = false;
                applyBtn.textContent = '이용권 적용하기';
                paint(Pro.state(), r && r.offline);
                window.mrToast && window.mrToast(
                    Pro.isActive() ? '프로가 활성화되었습니다' : '확인되지 않는 키입니다');
                if (Pro.isActive()) input.value = '';
            });
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); applyBtn.click(); }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (!Pro.getLicense()) { window.mrToast && window.mrToast('저장된 키가 없습니다'); return; }
            Pro.clear();
            paint(Pro.state());
            window.mrToast && window.mrToast('이 기기에서 이용권을 지웠습니다');
        });
    }

    refresh();
})();
