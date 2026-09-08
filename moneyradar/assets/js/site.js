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


    /* =========================================================
       용어 사전 — 금융 용어를 모르는 사람도 바로 이해할 수 있도록
       <button class="term" data-term="평균임금">평균임금</button>
       ========================================================= */
    var GLOSSARY = {
        '평균임금': {
            d: '퇴직 직전 3개월 동안 받은 임금 총액을 그 기간의 날짜 수로 나눈 하루치 임금입니다. 퇴직금과 실업급여의 기준이 됩니다.',
            ex: '3개월간 900만원을 받고 그 기간이 92일이면 → 900만원 ÷ 92일 = 하루 97,826원'
        },
        '통상임금': {
            d: '정기적·일률적으로 지급하기로 정해진 임금입니다. 기본급과 고정수당은 포함되지만 성과급처럼 들쭉날쭉한 돈은 빠집니다.',
            ex: '퇴직금은 평균임금과 통상임금 중 더 큰 쪽으로 계산합니다.'
        },
        '비과세': {
            d: '세금을 매기지 않는 급여 항목입니다. 식대(월 20만원)·자가운전보조금 등이 여기에 들어가며, 이 금액만큼 세금이 줄어듭니다.',
            ex: '월 300만원 중 식대 20만원이 비과세면 → 280만원에만 세금이 붙습니다.'
        },
        '보수월액': {
            d: '4대보험료를 매길 때 기준이 되는 한 달 급여입니다. 비과세 항목을 뺀 금액을 씁니다.',
            ex: '월 300만원 - 식대 20만원 = 보수월액 280만원'
        },
        '기준소득월액': {
            d: '국민연금 보험료를 계산할 때 쓰는 기준 급여입니다. 아무리 많이 벌어도 상한(637만원)까지만, 적게 벌어도 하한(40만원)만큼은 적용됩니다.',
            ex: '월급이 800만원이어도 국민연금은 637만원 기준으로만 냅니다.'
        },
        '과세표준': {
            d: '실제로 세율을 곱하는 금액입니다. 연봉에서 각종 공제를 모두 빼고 남은 금액이며, 연봉보다 훨씬 작습니다.',
            ex: '연봉 4,000만원 → 각종 공제 후 과세표준은 1,500만원 안팎이 됩니다.'
        },
        '근로소득공제': {
            d: '일하는 데 드는 비용을 인정해 연봉에서 자동으로 빼주는 금액입니다. 따로 신청할 필요가 없습니다.',
            ex: '연봉 4,000만원이면 약 1,125만원이 공제됩니다.'
        },
        '원천징수': {
            d: '회사가 급여를 줄 때 세금을 미리 떼어 나라에 대신 내주는 방식입니다. 그래서 통장에 들어오는 돈이 연봉보다 적습니다.',
            ex: '매달 뗀 세금은 다음 해 연말정산에서 정확히 다시 계산합니다.'
        },
        '소정급여일수': {
            d: '실업급여를 받을 수 있는 총 날짜입니다. 나이와 고용보험 가입기간 두 가지로만 정해집니다.',
            ex: '35세·가입 4년이면 180일 동안 받습니다.'
        },
        '피보험 단위기간': {
            d: '고용보험에 가입한 상태에서 실제로 급여를 받은 날을 센 기간입니다. 이직 전 18개월 안에 180일 이상이어야 실업급여를 받습니다.',
            ex: '주 5일 근무자는 보통 7~8개월 일하면 180일을 채웁니다.'
        },
        '구직급여': {
            d: '흔히 말하는 실업급여의 정확한 이름입니다. 일자리를 찾는 동안 생활을 돕기 위해 지급됩니다.',
            ex: '이직 전 평균임금의 60%를 하루치로 계산해 지급합니다.'
        },
        '계속근로기간': {
            d: '한 회사에서 끊김 없이 일한 전체 기간입니다. 이 기간이 1년 이상이어야 퇴직금이 발생합니다.',
            ex: '수습기간과 계약직 기간도 모두 포함됩니다.'
        },
        '실효세율': {
            d: '연봉 대비 실제로 낸 세금·보험료의 비율입니다. 세율표의 숫자보다 훨씬 낮게 나옵니다.',
            ex: '세율표는 15%여도 각종 공제 때문에 실제 부담은 7~8% 수준입니다.'
        },
        '장기요양보험': {
            d: '나이가 들거나 아파서 혼자 생활하기 어려울 때 돌봄 서비스를 받기 위한 보험입니다. 건강보험료에 얹어서 함께 냅니다.',
            ex: '건강보험료의 12.95%를 추가로 냅니다.'
        },
        '사후지급금': {
            d: '예전에는 육아휴직급여의 25%를 복직 후 6개월이 지나야 줬는데, 이 유보금을 사후지급금이라 불렀습니다. 2025년부터 폐지되어 휴직 중에 전액을 받습니다.',
            ex: '이제는 휴직 기간에 100% 모두 받습니다.'
        }
    };
    window.MR_GLOSSARY = GLOSSARY;

    var pop = null;
    var popOwner = null;

    function closePop() {
        if (!pop) return;
        pop.classList.remove('is-open');
        if (popOwner) popOwner.setAttribute('aria-expanded', 'false');
        popOwner = null;
    }

    function openPop(btn) {
        var key = btn.getAttribute('data-term') || btn.textContent.trim();
        var item = GLOSSARY[key];
        if (!item) return;

        if (!pop) {
            pop = document.createElement('div');
            pop.className = 'term-pop';
            pop.setAttribute('role', 'tooltip');
            document.body.appendChild(pop);
        }

        pop.innerHTML = '<span class="t"></span><span class="dd"></span>' +
            (item.ex ? '<span class="ex"></span>' : '');
        pop.querySelector('.t').textContent = key;
        pop.querySelector('.dd').textContent = item.d;
        if (item.ex) pop.querySelector('.ex').textContent = '예) ' + item.ex;

        /* 화면 밖으로 나가지 않도록 위치를 보정한다 */
        pop.classList.add('is-open');
        var r = btn.getBoundingClientRect();
        var pw = pop.offsetWidth;
        var ph = pop.offsetHeight;
        var left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12);
        var top = r.bottom + 8;
        if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 8);
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';

        popOwner = btn;
        btn.setAttribute('aria-expanded', 'true');
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.term');
        if (btn) {
            e.preventDefault();
            if (popOwner === btn) { closePop(); return; }
            openPop(btn);
            return;
        }
        if (pop && !e.target.closest('.term-pop')) closePop();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closePop();
    });

    window.addEventListener('scroll', closePop, { passive: true });
    window.addEventListener('resize', closePop);

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
