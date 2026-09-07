/* =========================================================
   머니레이더 — 계산 엔진 (순수 함수)

   ▸ 이 파일의 RATES 값만 바꾸면 매년 요율 갱신이 끝납니다.
   ▸ 브라우저에서는 window.MR, Node(테스트)에서는 module.exports 로 노출됩니다.
   ========================================================= */
(function (root, factory) {
    'use strict';
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.MR = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ---------- 요율·기준액 (연 1회 갱신 지점) ---------- */
    var RATES = {
        /* 화면 하단 "기준일"로 노출되는 값 */
        label: '2025년 기준',
        updated: '2025-07-01',

        /* 국민연금: 근로자 4.5% (기준소득월액 상·하한 적용) */
        pension: { rate: 0.045, minBase: 400000, maxBase: 6370000 },

        /* 건강보험: 전체 7.09% 중 근로자 절반 / 장기요양: 건강보험료의 12.95% */
        health: { rate: 0.03545 },
        longTermCare: { rate: 0.1295 },

        /* 고용보험 실업급여분: 근로자 0.9% (사업주는 고용안정분 별도 부담) */
        employment: { employee: 0.009, employerStability: 0.0025 },

        /* 산재보험: 사업주 전액 부담, 업종별 상이 — 기본 예시값 */
        industrialAccident: { employer: 0.007 },

        /* 최저임금 */
        minimumWage: { 2025: 10030, 2026: 10320 },

        /* 실업급여(구직급여) */
        unemployment: {
            replacementRate: 0.6,
            dailyCap: 66000,
            /* 하한 = 최저임금 × 80% × 8시간 (2025년 기준) */
            dailyFloor: Math.floor(10030 * 0.8 * 8)
        },

        /* 육아휴직급여 (2025년 개편 기준, 상한액 인상 반영) */
        parentalLeave: {
            tiers: [
                { fromMonth: 1, toMonth: 3, rate: 1.0, cap: 2500000 },
                { fromMonth: 4, toMonth: 6, rate: 1.0, cap: 2000000 },
                { fromMonth: 7, toMonth: 12, rate: 0.8, cap: 1600000 }
            ],
            floor: 700000
        },

        /* 근로소득공제 구간 */
        earnedIncomeDeduction: [
            { upTo: 5000000, base: 0, rate: 0.7, from: 0 },
            { upTo: 15000000, base: 3500000, rate: 0.4, from: 5000000 },
            { upTo: 45000000, base: 7500000, rate: 0.15, from: 15000000 },
            { upTo: 100000000, base: 12000000, rate: 0.05, from: 45000000 },
            { upTo: Infinity, base: 14750000, rate: 0.02, from: 100000000 }
        ],
        earnedIncomeDeductionCap: 20000000,

        /* 종합소득세 기본세율 (과세표준 기준) */
        incomeTaxBrackets: [
            { upTo: 14000000, rate: 0.06, deduct: 0 },
            { upTo: 50000000, rate: 0.15, deduct: 1260000 },
            { upTo: 88000000, rate: 0.24, deduct: 5760000 },
            { upTo: 150000000, rate: 0.35, deduct: 15440000 },
            { upTo: 300000000, rate: 0.38, deduct: 19940000 },
            { upTo: 500000000, rate: 0.40, deduct: 25940000 },
            { upTo: 1000000000, rate: 0.42, deduct: 35940000 },
            { upTo: Infinity, rate: 0.45, deduct: 65940000 }
        ],

        /* 인적공제 1인당 금액 / 지방소득세율 */
        personalDeduction: 1500000,
        localTaxRate: 0.1
    };

    /* ---------- 공통 유틸 ---------- */
    function toNumber(value) {
        var n = typeof value === 'string' ? Number(String(value).replace(/[^0-9.-]/g, '')) : Number(value);
        return isFinite(n) ? n : 0;
    }

    function clamp(n, min, max) {
        return Math.min(Math.max(n, min), max);
    }

    /* 보험료는 원 단위 절사가 관행 (10원 미만 절사하는 곳도 있으나 1원 절사로 통일) */
    function won(n) {
        return Math.floor(n);
    }

    function formatWon(n) {
        return Math.round(n).toLocaleString('ko-KR');
    }

    /* "3,250만원" 형태의 읽기 쉬운 한글 금액 */
    function formatKorean(n) {
        var v = Math.round(n);
        if (v === 0) return '0원';
        var eok = Math.floor(v / 100000000);
        var man = Math.floor((v % 100000000) / 10000);
        var rest = v % 10000;
        var out = '';
        if (eok) out += eok + '억 ';
        if (man) out += man.toLocaleString('ko-KR') + '만 ';
        if (rest) out += rest.toLocaleString('ko-KR');
        return out.trim().replace(/\s+$/, '') + '원';
    }

    function daysBetween(startISO, endISO) {
        var s = new Date(startISO + 'T00:00:00');
        var e = new Date(endISO + 'T00:00:00');
        if (isNaN(s) || isNaN(e)) return 0;
        return Math.round((e - s) / 86400000);
    }

    /* ---------- 4대보험 ---------- */
    /**
     * 월 보수월액 기준 4대보험료.
     * @param {number} monthlyWage 비과세를 제외한 과세 대상 월 보수
     * @returns {{employee:Object, employer:Object, employeeTotal:number, employerTotal:number}}
     */
    function calcInsurance(monthlyWage) {
        var wage = Math.max(0, toNumber(monthlyWage));
        var pensionBase = wage === 0 ? 0 : clamp(wage, RATES.pension.minBase, RATES.pension.maxBase);

        var pension = won(pensionBase * RATES.pension.rate);
        var health = won(wage * RATES.health.rate);
        var care = won(health * RATES.longTermCare.rate);
        var employment = won(wage * RATES.employment.employee);

        var employer = {
            pension: pension,
            health: health,
            longTermCare: care,
            employment: won(wage * (RATES.employment.employee + RATES.employment.employerStability)),
            industrialAccident: won(wage * RATES.industrialAccident.employer)
        };

        var employee = {
            pension: pension,
            health: health,
            longTermCare: care,
            employment: employment,
            industrialAccident: 0
        };

        function sum(o) {
            return o.pension + o.health + o.longTermCare + o.employment + o.industrialAccident;
        }

        return {
            wage: wage,
            pensionBase: pensionBase,
            employee: employee,
            employer: employer,
            employeeTotal: sum(employee),
            employerTotal: sum(employer)
        };
    }

    /* ---------- 소득세 (연말정산 방식 추정) ---------- */
    function earnedIncomeDeduction(grossAnnual) {
        var band = RATES.earnedIncomeDeduction.filter(function (b) { return grossAnnual <= b.upTo; })[0];
        if (!band) band = RATES.earnedIncomeDeduction[RATES.earnedIncomeDeduction.length - 1];
        var amount = band.base + (grossAnnual - band.from) * band.rate;
        return Math.min(Math.max(amount, 0), RATES.earnedIncomeDeductionCap);
    }

    function progressiveTax(taxBase) {
        if (taxBase <= 0) return 0;
        var band = RATES.incomeTaxBrackets.filter(function (b) { return taxBase <= b.upTo; })[0];
        return Math.max(0, taxBase * band.rate - band.deduct);
    }

    /* 근로소득세액공제 (산출세액 기준 공제 후 총급여 구간별 한도 적용) */
    function earnedIncomeTaxCredit(computedTax, grossAnnual) {
        var credit = computedTax <= 1300000
            ? computedTax * 0.55
            : 715000 + (computedTax - 1300000) * 0.30;

        var cap;
        if (grossAnnual <= 33000000) cap = 740000;
        else if (grossAnnual <= 70000000) cap = Math.max(660000, 740000 - (grossAnnual - 33000000) * 0.008);
        else if (grossAnnual <= 120000000) cap = Math.max(500000, 660000 - (grossAnnual - 70000000) * 0.5);
        else cap = Math.max(200000, 500000 - (grossAnnual - 120000000) * 0.5);

        return Math.min(credit, cap);
    }

    /* ---------- 연봉 실수령액 ---------- */
    /**
     * @param {Object} opts
     * @param {number} opts.annualSalary  연봉(세전)
     * @param {boolean} opts.severanceIncluded 연봉에 퇴직금이 포함되는지 (true면 13으로 나눔)
     * @param {number} opts.dependents    본인 포함 부양가족 수 (기본 1)
     * @param {number} opts.nonTaxable    월 비과세액 (식대 등, 기본 200,000)
     */
    function calcNetSalary(opts) {
        var o = opts || {};
        var annual = Math.max(0, toNumber(o.annualSalary));
        var severanceIncluded = !!o.severanceIncluded;
        var dependents = Math.max(1, toNumber(o.dependents) || 1);
        var nonTaxableMonthly = Math.max(0, o.nonTaxable === undefined ? 200000 : toNumber(o.nonTaxable));

        var monthsInSalary = severanceIncluded ? 13 : 12;
        var monthlyGross = annual / monthsInSalary;
        var taxableMonthly = Math.max(0, monthlyGross - nonTaxableMonthly);

        var ins = calcInsurance(taxableMonthly);

        /* 연 환산 과세 급여로 결정세액을 구한 뒤 12로 나눠 월 원천징수액을 추정 */
        var taxableAnnual = taxableMonthly * 12;
        var incomeAfterDeduction = Math.max(0, taxableAnnual - earnedIncomeDeduction(taxableAnnual));

        var deductions =
            RATES.personalDeduction * dependents +          /* 인적공제 */
            ins.employee.pension * 12 +                     /* 연금보험료공제 */
            (ins.employee.health + ins.employee.longTermCare + ins.employee.employment) * 12; /* 보험료 특별소득공제 */

        var taxBase = Math.max(0, incomeAfterDeduction - deductions);
        var computedTax = progressiveTax(taxBase);
        var finalTax = Math.max(0, computedTax - earnedIncomeTaxCredit(computedTax, taxableAnnual));

        var incomeTax = won(finalTax / 12);
        var localTax = won(incomeTax * RATES.localTaxRate);

        var totalDeduction = ins.employeeTotal + incomeTax + localTax;
        var monthlyNet = monthlyGross - totalDeduction;

        return {
            annualSalary: annual,
            monthlyGross: monthlyGross,
            taxableMonthly: taxableMonthly,
            nonTaxableMonthly: nonTaxableMonthly,
            insurance: ins.employee,
            insuranceTotal: ins.employeeTotal,
            incomeTax: incomeTax,
            localTax: localTax,
            totalDeduction: totalDeduction,
            monthlyNet: monthlyNet,
            annualNet: monthlyNet * 12,
            taxBase: taxBase,
            effectiveRate: monthlyGross > 0 ? totalDeduction / monthlyGross : 0
        };
    }

    /* ---------- 퇴직금 ---------- */
    /**
     * @param {Object} opts
     * @param {string} opts.joinDate  입사일 (YYYY-MM-DD)
     * @param {string} opts.leaveDate 퇴사일 (마지막 근무일 다음 날, YYYY-MM-DD)
     * @param {number} opts.monthlyWage 퇴직 전 3개월 월 평균 임금(세전)
     * @param {number} opts.annualBonus 연간 상여금
     * @param {number} opts.annualLeavePay 연차수당(퇴직 전 1년간)
     */
    function calcSeverance(opts) {
        var o = opts || {};
        var totalDays = daysBetween(o.joinDate, o.leaveDate);
        var monthlyWage = Math.max(0, toNumber(o.monthlyWage));
        var bonus = Math.max(0, toNumber(o.annualBonus));
        var leavePay = Math.max(0, toNumber(o.annualLeavePay));

        /* 퇴사일 기준 직전 3개월의 실제 일수 */
        var end = new Date(o.leaveDate + 'T00:00:00');
        var periodDays = 91;
        if (!isNaN(end)) {
            var start = new Date(end.getTime());
            start.setMonth(start.getMonth() - 3);
            periodDays = Math.round((end - start) / 86400000);
        }

        var wageSum = monthlyWage * 3;
        var bonusPortion = bonus * 3 / 12;
        var leavePortion = leavePay * 3 / 12;
        var totalPay = wageSum + bonusPortion + leavePortion;

        var averageDailyWage = periodDays > 0 ? totalPay / periodDays : 0;
        var eligible = totalDays >= 365;
        var severance = eligible ? averageDailyWage * 30 * (totalDays / 365) : 0;

        return {
            totalDays: totalDays,
            years: totalDays / 365,
            periodDays: periodDays,
            wageSum: wageSum,
            bonusPortion: bonusPortion,
            leavePortion: leavePortion,
            totalPay: totalPay,
            averageDailyWage: averageDailyWage,
            eligible: eligible,
            severance: severance
        };
    }

    /* ---------- 실업급여(구직급여) ---------- */
    var UNEMPLOYMENT_DAYS = {
        under50: [
            { underYears: 1, days: 120 },
            { underYears: 3, days: 150 },
            { underYears: 5, days: 180 },
            { underYears: 10, days: 210 },
            { underYears: Infinity, days: 240 }
        ],
        over50: [
            { underYears: 1, days: 120 },
            { underYears: 3, days: 180 },
            { underYears: 5, days: 210 },
            { underYears: 10, days: 240 },
            { underYears: Infinity, days: 270 }
        ]
    };

    function unemploymentDays(insuredYears, age, isDisabled) {
        var table = (age >= 50 || isDisabled) ? UNEMPLOYMENT_DAYS.over50 : UNEMPLOYMENT_DAYS.under50;
        for (var i = 0; i < table.length; i++) {
            if (insuredYears < table[i].underYears) return table[i].days;
        }
        return table[table.length - 1].days;
    }

    /**
     * @param {Object} opts
     * @param {number} opts.monthlyWage 이직 전 3개월 평균 월급여(세전)
     * @param {number} opts.age 이직 당시 만 나이
     * @param {number} opts.insuredYears 고용보험 가입기간(년)
     * @param {boolean} opts.isDisabled 장애인 여부
     */
    function calcUnemployment(opts) {
        var o = opts || {};
        var monthlyWage = Math.max(0, toNumber(o.monthlyWage));
        var age = Math.max(0, toNumber(o.age));
        var insuredYears = Math.max(0, toNumber(o.insuredYears));
        var isDisabled = !!o.isDisabled;

        /* 평균임금 = 3개월 임금총액 ÷ 3개월 일수(약 91일) */
        var averageDailyWage = monthlyWage * 3 / 91;
        var raw = averageDailyWage * RATES.unemployment.replacementRate;
        var dailyAmount = clamp(raw, RATES.unemployment.dailyFloor, RATES.unemployment.dailyCap);

        var capped = raw > RATES.unemployment.dailyCap;
        var floored = raw < RATES.unemployment.dailyFloor;
        var days = unemploymentDays(insuredYears, age, isDisabled);
        var eligible = insuredYears >= 0.5; /* 피보험 단위기간 180일 이상 */

        return {
            averageDailyWage: averageDailyWage,
            rawDaily: raw,
            dailyAmount: won(dailyAmount),
            capped: capped,
            floored: floored,
            days: days,
            months: days / 30,
            total: won(dailyAmount) * days,
            eligible: eligible
        };
    }

    /* ---------- 육아휴직급여 ---------- */
    /**
     * @param {Object} opts
     * @param {number} opts.monthlyWage 월 통상임금
     * @param {number} opts.months 사용할 육아휴직 개월 수 (1~12)
     */
    function calcParentalLeave(opts) {
        var o = opts || {};
        var wage = Math.max(0, toNumber(o.monthlyWage));
        var months = clamp(Math.round(toNumber(o.months) || 12), 1, 12);
        var cfg = RATES.parentalLeave;
        var schedule = [];
        var total = 0;

        for (var m = 1; m <= months; m++) {
            var tier = cfg.tiers.filter(function (t) { return m >= t.fromMonth && m <= t.toMonth; })[0];
            if (!tier) tier = cfg.tiers[cfg.tiers.length - 1];
            var raw = wage * tier.rate;
            var amount = Math.min(raw, tier.cap);
            if (wage > 0) amount = Math.max(amount, Math.min(cfg.floor, wage));
            amount = won(amount);
            schedule.push({ month: m, rate: tier.rate, cap: tier.cap, raw: raw, amount: amount });
            total += amount;
        }

        return { months: months, monthlyWage: wage, schedule: schedule, total: total };
    }

    return {
        RATES: RATES,
        toNumber: toNumber,
        formatWon: formatWon,
        formatKorean: formatKorean,
        daysBetween: daysBetween,
        calcInsurance: calcInsurance,
        calcNetSalary: calcNetSalary,
        calcSeverance: calcSeverance,
        calcUnemployment: calcUnemployment,
        calcParentalLeave: calcParentalLeave,
        unemploymentDays: unemploymentDays
    };
});
