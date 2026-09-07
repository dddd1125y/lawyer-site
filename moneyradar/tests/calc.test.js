/* =========================================================
   머니레이더 — 계산 엔진 검증
   실행: node moneyradar/tests/calc.test.js
   ========================================================= */
'use strict';

const MR = require('../assets/js/calc-core.js');

let passed = 0;
let failed = 0;

function ok(name, condition, detail) {
    if (condition) {
        passed++;
        console.log('  PASS  ' + name);
    } else {
        failed++;
        console.log('  FAIL  ' + name + (detail ? '\n        → ' + detail : ''));
    }
}

function near(name, actual, expected, tolerance) {
    const diff = Math.abs(actual - expected);
    ok(name, diff <= tolerance,
        'actual=' + Math.round(actual).toLocaleString() +
        ' expected=' + Math.round(expected).toLocaleString() +
        ' diff=' + Math.round(diff).toLocaleString());
}

console.log('\n[4대보험]');
{
    const r = MR.calcInsurance(3000000);
    near('국민연금 4.5%', r.employee.pension, 135000, 1);
    near('건강보험 3.545%', r.employee.health, 106350, 1);
    near('장기요양 = 건보료 × 12.95%', r.employee.longTermCare, Math.floor(106350 * 0.1295), 1);
    near('고용보험 0.9%', r.employee.employment, 27000, 1);
    ok('산재보험은 근로자 부담 0원', r.employee.industrialAccident === 0);
    ok('사업주 부담이 근로자보다 큼', r.employerTotal > r.employeeTotal,
        'employer=' + r.employerTotal + ' employee=' + r.employeeTotal);

    const high = MR.calcInsurance(8000000);
    near('국민연금 상한(기준소득월액 637만원) 적용', high.employee.pension, Math.floor(6370000 * 0.045), 1);

    const low = MR.calcInsurance(300000);
    near('국민연금 하한(40만원) 적용', low.employee.pension, Math.floor(400000 * 0.045), 1);

    const zero = MR.calcInsurance(0);
    ok('급여 0원이면 보험료 0원', zero.employeeTotal === 0);
}

console.log('\n[연봉 실수령액]');
{
    const r = MR.calcNetSalary({ annualSalary: 36000000, dependents: 1, nonTaxable: 200000 });
    near('월 세전 = 연봉 ÷ 12', r.monthlyGross, 3000000, 1);
    /* 공개 계산기(사람인·잡코리아) 기준 약 267만원대 — ±2% 이내면 합격 */
    near('연봉 3,600만원 월 실수령액', r.monthlyNet, 2670000, 55000);
    ok('공제 합계 = 4대보험 + 소득세 + 지방소득세',
        Math.abs(r.totalDeduction - (r.insuranceTotal + r.incomeTax + r.localTax)) < 1);
    near('지방소득세 = 소득세 10%', r.localTax, Math.floor(r.incomeTax * 0.1), 1);

    const r2 = MR.calcNetSalary({ annualSalary: 60000000, dependents: 1 });
    near('연봉 6,000만원 월 실수령액', r2.monthlyNet, 4180000, 90000);

    ok('연봉이 오르면 실수령액도 오른다',
        MR.calcNetSalary({ annualSalary: 80000000 }).monthlyNet > r2.monthlyNet);
    ok('연봉이 오르면 실효 공제율도 오른다',
        MR.calcNetSalary({ annualSalary: 80000000 }).effectiveRate > r.effectiveRate);
    ok('부양가족이 많으면 세금이 줄어든다',
        MR.calcNetSalary({ annualSalary: 60000000, dependents: 3 }).incomeTax < r2.incomeTax);
    ok('퇴직금 포함 연봉은 13으로 나눈다',
        Math.abs(MR.calcNetSalary({ annualSalary: 39000000, severanceIncluded: true }).monthlyGross - 3000000) < 1);

    const low = MR.calcNetSalary({ annualSalary: 24000000, dependents: 1 });
    ok('저소득 구간에서 소득세가 음수가 되지 않는다', low.incomeTax >= 0, 'incomeTax=' + low.incomeTax);
    ok('실수령액이 세전보다 클 수 없다', low.monthlyNet < low.monthlyGross);

    const zero = MR.calcNetSalary({ annualSalary: 0 });
    ok('연봉 0원 입력에도 NaN이 없다',
        isFinite(zero.monthlyNet) && isFinite(zero.totalDeduction) && zero.monthlyNet === 0);
}

console.log('\n[퇴직금]');
{
    const r = MR.calcSeverance({
        joinDate: '2023-01-01', leaveDate: '2026-01-01',
        monthlyWage: 3000000, annualBonus: 0, annualLeavePay: 0
    });
    ok('재직일수 1,096일 (3년)', r.totalDays === 1096, 'totalDays=' + r.totalDays);
    ok('1년 이상이면 지급 대상', r.eligible === true);
    /* 3년 근속 · 월급 300만원 → 약 900만원 (평균임금 기준 오차 포함) */
    near('3년 근속 퇴직금', r.severance, 9000000, 400000);

    const bonus = MR.calcSeverance({
        joinDate: '2023-01-01', leaveDate: '2026-01-01',
        monthlyWage: 3000000, annualBonus: 6000000, annualLeavePay: 1200000
    });
    ok('상여금·연차수당이 있으면 퇴직금이 늘어난다', bonus.severance > r.severance);

    const short = MR.calcSeverance({
        joinDate: '2025-06-01', leaveDate: '2026-01-01', monthlyWage: 3000000
    });
    ok('1년 미만이면 지급 대상 아님', short.eligible === false && short.severance === 0);
}

console.log('\n[실업급여]');
{
    const r = MR.calcUnemployment({ monthlyWage: 3000000, age: 45, insuredYears: 5 });
    ok('하한액(최저임금 80% × 8시간) 적용', r.floored === true && r.dailyAmount === MR.RATES.unemployment.dailyFloor,
        'daily=' + r.dailyAmount);
    ok('5년 가입 · 50세 미만 → 210일 (5년 이상 구간)', r.days === 210, 'days=' + r.days);
    near('총 수령액 = 일액 × 일수', r.total, r.dailyAmount * 210, 1);
    ok('4년 가입 → 180일 (3년 이상 5년 미만)', MR.unemploymentDays(4, 45, false) === 180);
    ok('경계값 3년 → 180일', MR.unemploymentDays(3, 45, false) === 180);
    ok('경계값 2.9년 → 150일', MR.unemploymentDays(2.9, 45, false) === 150);

    const high = MR.calcUnemployment({ monthlyWage: 6000000, age: 45, insuredYears: 12 });
    ok('상한액 66,000원 적용', high.capped === true && high.dailyAmount === 66000, 'daily=' + high.dailyAmount);
    ok('10년 이상 · 50세 미만 → 240일', high.days === 240);

    const senior = MR.calcUnemployment({ monthlyWage: 6000000, age: 52, insuredYears: 12 });
    ok('10년 이상 · 50세 이상 → 270일', senior.days === 270);
    ok('장애인은 50세 이상과 동일한 일수', MR.unemploymentDays(12, 30, true) === 270);
    ok('1년 미만 가입 → 120일', MR.unemploymentDays(0.7, 30, false) === 120);
    ok('가입 6개월 미만은 수급 요건 미달',
        MR.calcUnemployment({ monthlyWage: 3000000, age: 30, insuredYears: 0.3 }).eligible === false);
}

console.log('\n[육아휴직급여]');
{
    const r = MR.calcParentalLeave({ monthlyWage: 3000000, months: 12 });
    ok('1~3개월 상한 250만원', r.schedule[0].amount === 2500000, 'm1=' + r.schedule[0].amount);
    ok('4~6개월 상한 200만원', r.schedule[3].amount === 2000000, 'm4=' + r.schedule[3].amount);
    ok('7개월 이후 통상임금 80% · 상한 160만원', r.schedule[6].amount === 1600000, 'm7=' + r.schedule[6].amount);
    near('12개월 총 수령액', r.total, 2500000 * 3 + 2000000 * 3 + 1600000 * 6, 1);

    const low = MR.calcParentalLeave({ monthlyWage: 600000, months: 3 });
    ok('통상임금이 하한보다 낮으면 통상임금까지만 지급',
        low.schedule[0].amount === 600000, 'm1=' + low.schedule[0].amount);

    const mid = MR.calcParentalLeave({ monthlyWage: 800000, months: 12 });
    ok('하한 70만원 적용 (7개월차 80% = 64만 → 70만)',
        mid.schedule[6].amount === 700000, 'm7=' + mid.schedule[6].amount);

    ok('개월 수는 1~12로 제한', MR.calcParentalLeave({ monthlyWage: 3000000, months: 24 }).months === 12);
}

console.log('\n[포맷터]');
{
    ok('원 단위 콤마', MR.formatWon(2663139) === '2,663,139');
    ok('한글 금액 — 억/만 단위', MR.formatKorean(123450000) === '1억 2,345만원',
        'got=' + MR.formatKorean(123450000));
    ok('한글 금액 — 만원 미만', MR.formatKorean(9500) === '9,500원', 'got=' + MR.formatKorean(9500));
    ok('한글 금액 — 0원', MR.formatKorean(0) === '0원');
    ok('문자열 입력 파싱', MR.toNumber('3,600만'.replace('만', '0000')) === 36000000);
}

console.log('\n────────────────────────────');
console.log('  통과 ' + passed + ' / 실패 ' + failed);
console.log('────────────────────────────\n');
process.exit(failed === 0 ? 0 : 1);
