/* =========================================================
   머니레이더 — 계산기 페이지 바인딩
   body[data-calc] 값에 따라 입력값을 읽어 결과를 그립니다.
   ========================================================= */
(function () {
    'use strict';

    var kind = document.body.getAttribute('data-calc');
    var form = document.getElementById('calcForm');
    var out = document.getElementById('result');
    if (!kind || !form || !out || !window.MR) return;

    var MR = window.MR;
    var fmt = MR.formatWon;

    /* ---------- 입력 헬퍼 ---------- */
    function el(name) { return form.querySelector('[name="' + name + '"]'); }

    function raw(name) {
        var node = el(name);
        return node ? node.value : '';
    }

    function money(name) { return MR.toNumber(raw(name)); }

    function checked(name) {
        var node = form.querySelector('[name="' + name + '"]:checked');
        return node ? node.value : '';
    }

    /* 천 단위 콤마 입력 포맷 */
    form.addEventListener('input', function (e) {
        var node = e.target;
        if (node.hasAttribute && node.hasAttribute('data-money')) {
            var digits = node.value.replace(/[^0-9]/g, '');
            var formatted = digits ? Number(digits).toLocaleString('ko-KR') : '';
            if (node.value !== formatted) {
                node.value = formatted;
                if (node.setSelectionRange) {
                    var end = node.value.length;
                    node.setSelectionRange(end, end);
                }
            }
        }
        render();
    });

    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

    /* 빠른 입력 칩 */
    form.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        e.preventDefault();
        var target = el(chip.getAttribute('data-target'));
        if (!target) return;
        var value = Number(chip.getAttribute('data-value'));
        target.value = target.hasAttribute('data-money') ? value.toLocaleString('ko-KR') : String(value);
        render();
    });

    /* ---------- URL 파라미터 (결과 공유) ---------- */
    function readParams() {
        var params = new URLSearchParams(location.search);
        var applied = false;
        params.forEach(function (value, key) {
            var node = form.querySelector('[name="' + key + '"]');
            if (!node) return;
            if (node.type === 'radio' || form.querySelectorAll('[name="' + key + '"]').length > 1) {
                var one = form.querySelector('[name="' + key + '"][value="' + value + '"]');
                if (one) { one.checked = true; applied = true; }
                return;
            }
            if (node.type === 'checkbox') { node.checked = value === '1'; applied = true; return; }
            node.value = node.hasAttribute('data-money') && /^[0-9]+$/.test(value)
                ? Number(value).toLocaleString('ko-KR')
                : value;
            applied = true;
        });
        return applied;
    }

    function writeParams() {
        var params = new URLSearchParams();
        Array.prototype.forEach.call(form.elements, function (node) {
            if (!node.name) return;
            if (node.type === 'radio' && !node.checked) return;
            if (node.type === 'checkbox') { params.set(node.name, node.checked ? '1' : '0'); return; }
            var value = node.hasAttribute('data-money') ? String(MR.toNumber(node.value)) : node.value;
            if (value !== '') params.set(node.name, value);
        });
        var next = location.pathname + '?' + params.toString();
        history.replaceState(null, '', next);
    }

    /* ---------- 렌더 유틸 ---------- */
    function hero(label, value, sub, warn) {
        return '<div class="result-hero' + (warn ? ' is-warn' : '') + '">' +
            '<div class="k">' + label + '</div>' +
            '<div class="v">' + value + '</div>' +
            (sub ? '<div class="sub">' + sub + '</div>' : '') +
            '</div>';
    }

    function row(k, v, cls) {
        return '<div class="row' + (cls ? ' ' + cls : '') + '">' +
            '<span class="k">' + k + '</span><span class="v' + (/^-/.test(v) ? ' is-minus' : '') + '">' + v + '</span></div>';
    }

    function note(html) {
        return '<div class="result-note">' + html + '</div>';
    }

    var basis = '기준: ' + MR.RATES.label + ' 요율 · 최종 확인 ' + MR.RATES.updated;

    /* ---------- 계산기별 렌더러 ---------- */
    var renderers = {
        salary: function () {
            var r = MR.calcNetSalary({
                annualSalary: money('annualSalary'),
                dependents: MR.toNumber(raw('dependents')) || 1,
                nonTaxable: money('nonTaxable'),
                severanceIncluded: checked('severanceType') === 'included'
            });

            if (r.annualSalary <= 0) return emptyState('연봉을 입력하면 월 실수령액이 바로 계산됩니다.');

            return hero('월 실수령액', fmt(r.monthlyNet) + '<span style="font-size:0.45em"> 원</span>',
                    '연 환산 ' + MR.formatKorean(r.annualNet) + ' · 공제율 ' + (r.effectiveRate * 100).toFixed(1) + '%') +
                '<div class="rows">' +
                row('월 세전 급여', fmt(r.monthlyGross) + '원') +
                row('비과세 (식대 등)', fmt(r.nonTaxableMonthly) + '원') +
                row('국민연금', '-' + fmt(r.insurance.pension) + '원', 'is-sub') +
                row('건강보험', '-' + fmt(r.insurance.health) + '원', 'is-sub') +
                row('장기요양보험', '-' + fmt(r.insurance.longTermCare) + '원', 'is-sub') +
                row('고용보험', '-' + fmt(r.insurance.employment) + '원', 'is-sub') +
                row('소득세 (추정)', '-' + fmt(r.incomeTax) + '원', 'is-sub') +
                row('지방소득세', '-' + fmt(r.localTax) + '원', 'is-sub') +
                row('공제 합계', '-' + fmt(r.totalDeduction) + '원', 'is-total') +
                row('월 실수령액', fmt(r.monthlyNet) + '원', 'is-total') +
                '</div>' +
                note('<b>소득세는 어떻게 계산했나요?</b><br>' +
                    '연 과세대상급여에서 근로소득공제·인적공제(' + (MR.toNumber(raw('dependents')) || 1) + '명)·' +
                    '4대보험료 공제를 뺀 과세표준 ' + fmt(r.taxBase) + '원에 기본세율을 적용하고, ' +
                    '근로소득세액공제를 반영한 뒤 12로 나눈 추정치입니다. ' +
                    '실제 매월 원천징수액은 국세청 근로소득 간이세액표에 따라 다소 차이가 날 수 있습니다.<br>' + basis);
        },

        insurance: function () {
            var wage = money('monthlyWage');
            var r = MR.calcInsurance(wage);
            if (wage <= 0) return emptyState('월 급여를 입력하면 4대보험료가 계산됩니다.');

            function line(name, a, b) {
                return '<tr><td>' + name + '</td><td class="num">' + fmt(a) + '</td><td class="num">' + fmt(b) + '</td></tr>';
            }

            return hero('근로자 부담 합계 (월)', fmt(r.employeeTotal) + '<span style="font-size:0.45em"> 원</span>',
                    '사업주 부담 ' + fmt(r.employerTotal) + '원 · 총 ' + fmt(r.employeeTotal + r.employerTotal) + '원') +
                '<div style="padding:18px 22px">' +
                '<div class="table-wrap"><table><thead><tr><th>항목</th><th class="num">근로자</th><th class="num">사업주</th></tr></thead><tbody>' +
                line('국민연금 (4.5%)', r.employee.pension, r.employer.pension) +
                line('건강보험 (3.545%)', r.employee.health, r.employer.health) +
                line('장기요양 (건보료 12.95%)', r.employee.longTermCare, r.employer.longTermCare) +
                line('고용보험', r.employee.employment, r.employer.employment) +
                line('산재보험 (업종별)', r.employee.industrialAccident, r.employer.industrialAccident) +
                '<tr><td><b>합계</b></td><td class="num"><b>' + fmt(r.employeeTotal) + '</b></td><td class="num"><b>' + fmt(r.employerTotal) + '</b></td></tr>' +
                '</tbody></table></div>' +
                (r.pensionBase !== r.wage
                    ? '<div class="notice" style="margin-top:14px"><b>국민연금 기준소득월액 ' +
                      (r.wage > r.pensionBase ? '상한' : '하한') + ' 적용</b> — 급여와 무관하게 ' +
                      fmt(r.pensionBase) + '원을 기준으로 부과됩니다.</div>'
                    : '') +
                '</div>' +
                note('산재보험료는 업종별 요율(0.7% 예시)로 계산했으며 전액 사업주가 부담합니다. ' +
                    '고용보험 사업주 부담에는 고용안정·직업능력개발사업분(150인 미만 0.25%)이 포함됩니다.<br>' + basis);
        },

        severance: function () {
            var r = MR.calcSeverance({
                joinDate: raw('joinDate'),
                leaveDate: raw('leaveDate'),
                monthlyWage: money('monthlyWage'),
                annualBonus: money('annualBonus'),
                annualLeavePay: money('annualLeavePay')
            });

            if (!raw('joinDate') || !raw('leaveDate') || money('monthlyWage') <= 0) {
                return emptyState('입사일·퇴사일과 월 급여를 입력하면 퇴직금이 계산됩니다.');
            }

            if (r.totalDays <= 0) {
                return hero('입력을 확인해 주세요', '—', '퇴사일이 입사일보다 빠릅니다', true);
            }

            if (!r.eligible) {
                return hero('퇴직금 지급 대상이 아닙니다', fmt(r.totalDays) + '일 근속',
                    '계속근로기간이 1년(365일) 이상이어야 퇴직금이 발생합니다', true) +
                    note('현재 ' + fmt(365 - r.totalDays) + '일이 부족합니다. 1년을 채운 뒤 퇴사하면 ' +
                        '약 ' + fmt(Math.round(r.averageDailyWage * 30)) + '원의 퇴직금이 발생합니다.<br>' + basis);
            }

            return hero('예상 퇴직금 (세전)', fmt(Math.round(r.severance)) + '<span style="font-size:0.45em"> 원</span>',
                    '근속 ' + r.years.toFixed(2) + '년 (' + fmt(r.totalDays) + '일)') +
                '<div class="rows">' +
                row('퇴직 전 3개월 임금', fmt(r.wageSum) + '원') +
                row('연간 상여금 × 3/12', fmt(Math.round(r.bonusPortion)) + '원', 'is-sub') +
                row('연차수당 × 3/12', fmt(Math.round(r.leavePortion)) + '원', 'is-sub') +
                row('평균임금 산정 기간', fmt(r.periodDays) + '일', 'is-sub') +
                row('1일 평균임금', fmt(Math.round(r.averageDailyWage)) + '원', 'is-total') +
                row('예상 퇴직금', fmt(Math.round(r.severance)) + '원', 'is-total') +
                '</div>' +
                '<div style="padding:0 22px 4px"><div class="formula">' +
                '1일 평균임금 = (3개월 임금 + 상여금×3/12 + 연차수당×3/12) ÷ ' + r.periodDays + '일<br>' +
                '퇴직금 = ' + fmt(Math.round(r.averageDailyWage)) + '원 × 30일 × (' + fmt(r.totalDays) + '일 ÷ 365일)' +
                '</div></div>' +
                note('실제 퇴직금은 평균임금과 통상임금 중 <b>더 큰 금액</b>을 기준으로 지급됩니다. ' +
                    '위 금액은 세전 기준이며 퇴직소득세가 별도로 공제됩니다.<br>' + basis);
        },

        unemployment: function () {
            var r = MR.calcUnemployment({
                monthlyWage: money('monthlyWage'),
                age: MR.toNumber(raw('age')),
                insuredYears: MR.toNumber(raw('insuredYears')),
                isDisabled: form.querySelector('[name="isDisabled"]').checked
            });

            if (money('monthlyWage') <= 0) return emptyState('이직 전 평균 월급여를 입력하면 실업급여가 계산됩니다.');

            var capNote = r.capped
                ? '<b>상한액 적용</b> — 평균임금의 60%가 ' + fmt(Math.round(r.rawDaily)) + '원이지만 1일 상한 66,000원까지만 지급됩니다.'
                : r.floored
                    ? '<b>하한액 적용</b> — 평균임금의 60%가 ' + fmt(Math.round(r.rawDaily)) + '원이지만 최저임금 기반 하한액 ' +
                      fmt(MR.RATES.unemployment.dailyFloor) + '원이 적용됩니다.'
                    : '평균임금의 60%가 그대로 적용됩니다.';

            return hero('예상 총 수령액', fmt(r.total) + '<span style="font-size:0.45em"> 원</span>',
                    '1일 ' + fmt(r.dailyAmount) + '원 × ' + r.days + '일 (약 ' + r.months.toFixed(1) + '개월)') +
                '<div class="rows">' +
                row('1일 평균임금', fmt(Math.round(r.averageDailyWage)) + '원') +
                row('구직급여일액 (60%)', fmt(r.dailyAmount) + '원') +
                row('소정급여일수', r.days + '일') +
                row('월 환산 (30일 기준)', fmt(r.dailyAmount * 30) + '원', 'is-sub') +
                row('총 예상 수령액', fmt(r.total) + '원', 'is-total') +
                '</div>' +
                (!r.eligible
                    ? '<div style="padding:14px 22px 0"><div class="notice"><b>수급 요건 확인 필요</b> — ' +
                      '이직 전 18개월간 피보험 단위기간이 180일 이상이어야 수급 자격이 생깁니다.</div></div>'
                    : '') +
                note(capNote + '<br>소정급여일수는 이직일 기준 만 나이와 고용보험 가입기간으로 정해지며, ' +
                    '자발적 퇴사는 원칙적으로 수급 대상이 아닙니다.<br>' + basis);
        },

        parental: function () {
            var months = MR.toNumber(raw('months')) || 12;
            var r = MR.calcParentalLeave({ monthlyWage: money('monthlyWage'), months: months });

            if (r.monthlyWage <= 0) return emptyState('월 통상임금을 입력하면 육아휴직급여가 계산됩니다.');

            var cappedMonths = 0;
            var rows = r.schedule.map(function (s) {
                var isCapped = s.amount < s.raw;
                if (isCapped) cappedMonths++;
                return '<tr><td>' + s.month + '개월차</td>' +
                    '<td class="num">' + (s.rate * 100) + '%</td>' +
                    '<td class="num">' + fmt(s.cap) + '</td>' +
                    '<td class="num"><b>' + fmt(s.amount) + '</b>' +
                    (isCapped ? ' <span style="color:var(--stamp);font-size:11px">상한</span>' : '') +
                    '</td></tr>';
            }).join('');

            /* 통상임금이 상한을 넘으면 급여를 더 올려도 수령액이 같아지므로 그 사실을 알려준다 */
            var capMessage = cappedMonths === r.months
                ? '통상임금이 모든 구간의 상한액을 넘어, 급여가 더 올라도 수령액은 같습니다.'
                : cappedMonths > 0
                    ? cappedMonths + '개월은 상한액이 적용되어 통상임금보다 적게 지급됩니다.'
                    : '모든 개월에서 통상임금 기준 금액이 그대로 지급됩니다.';

            return hero(r.months + '개월 총 수령액', fmt(r.total) + '<span style="font-size:0.45em"> 원</span>',
                    '월 평균 ' + fmt(Math.round(r.total / r.months)) + '원 · ' + capMessage) +
                '<div style="padding:18px 22px">' +
                '<div class="table-wrap"><table><thead><tr><th>기간</th><th class="num">지급률</th><th class="num">상한</th><th class="num">지급액</th></tr></thead>' +
                '<tbody>' + rows + '</tbody></table></div></div>' +
                note('2025년부터 육아휴직급여 상한액이 인상되고 사후지급금(25% 유보)이 폐지되어 ' +
                    '휴직 기간 중 전액을 받습니다. 부모가 함께 사용하는 경우 <b>6+6 부모육아휴직제</b>로 ' +
                    '첫 6개월간 급여가 더 높아질 수 있습니다(위 계산에는 미반영).<br>' + basis);
        }
    };

    function emptyState(message) {
        return '<div class="empty-state">' + message + '</div>';
    }

    function render() {
        var fn = renderers[kind];
        if (!fn) return;
        out.innerHTML = fn();
        writeParams();
    }

    /* 링크로 들어온 경우 파라미터를 먼저 반영하고, 아니면 기본 예시값으로 첫 화면을 채운다 */
    readParams();
    render();
})();
