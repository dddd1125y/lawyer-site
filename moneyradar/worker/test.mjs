/* 결제 승인 서버 테스트 — D1 과 토스 API 를 가짜로 만들어 검증한다 */
import worker from './src/index.js';

let pass = 0, fail = 0;
function ok(name, cond, extra) {
    if (cond) { pass++; console.log('  PASS ' + name); }
    else { fail++; console.log('  FAIL ' + name + (extra ? ' → ' + extra : '')); }
}

/* ---------- 가짜 D1 ---------- */
function makeDB() {
    const rows = [];
    return {
        rows,
        prepare(sql) {
            let args = [];
            const api = {
                bind(...a) { args = a; return api; },
                async first() {
                    if (/FROM licenses WHERE order_id/.test(sql)) {
                        const r = rows.find(r => r.order_id === args[0]);
                        return r ? { key: r.key, expires_at: r.expires_at } : null;
                    }
                    if (/FROM licenses WHERE key/.test(sql)) {
                        const r = rows.find(r => r.key === args[0]);
                        return r ? { expires_at: r.expires_at, status: r.status } : null;
                    }
                    return null;
                },
                async run() {
                    if (/^\s*INSERT INTO licenses/.test(sql)) {
                        const [key, order_id, plan, amount, payment_key, created_at, expires_at] = args;
                        rows.push({ key, order_id, plan, amount, payment_key, created_at, expires_at, status: 'active' });
                    }
                    return { success: true };
                }
            };
            return api;
        }
    };
}

const ENV = () => ({
    DB: makeDB(),
    TOSS_SECRET_KEY: 'test_sk_dummy',
    ALLOWED_ORIGIN: 'https://dddd1125y.github.io'
});

function post(body) {
    return new Request('https://api.example.com/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://dddd1125y.github.io' },
        body: JSON.stringify(body)
    });
}

/* ---------- 가짜 토스 API ---------- */
const realFetch = globalThis.fetch;
function mockToss(okRes, payload) {
    globalThis.fetch = async () => ({
        ok: okRes,
        json: async () => payload
    });
}

console.log('\n────────── 결제 승인 서버 테스트 ──────────');

/* 1. 정상 승인 */
{
    const env = ENV();
    mockToss(true, { status: 'DONE', receipt: { url: 'https://receipt' } });
    const res = await worker.fetch(post({ paymentKey: 'pk_1', orderId: 'mr-monthly-abc123', amount: 4900 }), env);
    const d = await res.json();
    ok('정상 승인 → 200', res.status === 200, res.status);
    ok('이용권 키 발급', /^MR-[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/.test(d.licenseKey || ''), d.licenseKey);
    const days = Math.round((Date.parse(d.expiresAt) - Date.now()) / 86400000);
    ok('1개월 = 30일 만료', days === 30, days + '일');
    ok('DB 저장됨', env.DB.rows.length === 1);
}

/* 2. 금액 위조 차단 — 가장 중요한 방어선 */
{
    const env = ENV();
    mockToss(true, { status: 'DONE' });
    const res = await worker.fetch(post({ paymentKey: 'pk_2', orderId: 'mr-yearly-abc', amount: 100 }), env);
    const d = await res.json();
    ok('금액 위조 차단 (100원으로 1년권)', res.status === 400 && d.error === 'AMOUNT_MISMATCH', res.status + ' ' + d.error);
    ok('위조 시 DB 미기록', env.DB.rows.length === 0);
}

/* 3. 알 수 없는 플랜 차단 */
{
    const env = ENV();
    mockToss(true, { status: 'DONE' });
    const res = await worker.fetch(post({ paymentKey: 'pk_3', orderId: 'mr-lifetime-x', amount: 4900 }), env);
    ok('알 수 없는 플랜 차단', res.status === 400 && (await res.json()).error === 'UNKNOWN_PLAN');
}

/* 4. 중복 승인 방지 (같은 주문 두 번) */
{
    const env = ENV();
    mockToss(true, { status: 'DONE' });
    const r1 = await worker.fetch(post({ paymentKey: 'pk_4', orderId: 'mr-yearly-dup', amount: 45000 }), env);
    const d1 = await r1.json();
    const r2 = await worker.fetch(post({ paymentKey: 'pk_4', orderId: 'mr-yearly-dup', amount: 45000 }), env);
    const d2 = await r2.json();
    ok('중복 승인 시 같은 키 반환', d1.licenseKey === d2.licenseKey, d1.licenseKey + ' vs ' + d2.licenseKey);
    ok('중복 승인 시 이용권 1개만', env.DB.rows.length === 1, env.DB.rows.length + '개');
    ok('중복 표시', d2.reused === true);
    const days = Math.round((Date.parse(d1.expiresAt) - Date.now()) / 86400000);
    ok('1년 = 365일 만료', days === 365, days + '일');
}

/* 5. 토스 승인 실패 전파 */
{
    const env = ENV();
    mockToss(false, { code: 'REJECT_CARD_COMPANY', message: '카드사 거절' });
    const res = await worker.fetch(post({ paymentKey: 'pk_5', orderId: 'mr-monthly-fail', amount: 4900 }), env);
    const d = await res.json();
    ok('카드사 거절 전파', res.status === 400 && d.error === 'REJECT_CARD_COMPANY', d.error);
    ok('거절 시 이용권 미발급', env.DB.rows.length === 0);
}

/* 6. 잘못된 요청 */
{
    const env = ENV();
    const res = await worker.fetch(post({ orderId: 'mr-monthly-x' }), env);
    ok('필수값 누락 차단', res.status === 400 && (await res.json()).error === 'BAD_REQUEST');
}

/* 7. 이용권 조회 */
{
    const env = ENV();
    mockToss(true, { status: 'DONE' });
    const made = await (await worker.fetch(post({ paymentKey: 'pk_7', orderId: 'mr-monthly-st', amount: 4900 }), env)).json();

    const good = await worker.fetch(new Request('https://api.example.com/api/license/status?key=' + made.licenseKey), env);
    ok('유효한 키 → active', (await good.json()).active === true);

    const bad = await worker.fetch(new Request('https://api.example.com/api/license/status?key=MR-XXXX-XXXX-XXXX'), env);
    ok('없는 키 → 비활성', (await bad.json()).active === false);

    const none = await worker.fetch(new Request('https://api.example.com/api/license/status'), env);
    ok('키 없음 → 비활성', (await none.json()).active === false);

    /* 만료된 키 */
    env.DB.rows[0].expires_at = new Date(Date.now() - 86400000).toISOString();
    const expired = await worker.fetch(new Request('https://api.example.com/api/license/status?key=' + made.licenseKey), env);
    ok('만료된 키 → 비활성', (await expired.json()).active === false);
}

/* 8. CORS */
{
    const env = ENV();
    const res = await worker.fetch(new Request('https://api.example.com/api/payments/confirm', {
        method: 'OPTIONS', headers: { Origin: 'https://dddd1125y.github.io' }
    }), env);
    ok('프리플라이트 204', res.status === 204, res.status);
    ok('허용 출처 반영', res.headers.get('Access-Control-Allow-Origin') === 'https://dddd1125y.github.io');

    const evil = await worker.fetch(new Request('https://api.example.com/api/license/status?key=x', {
        headers: { Origin: 'https://evil.example' }
    }), env);
    ok('허용되지 않은 출처는 반사하지 않음',
        evil.headers.get('Access-Control-Allow-Origin') !== 'https://evil.example',
        evil.headers.get('Access-Control-Allow-Origin'));
}

globalThis.fetch = realFetch;
console.log('────────────────────────────');
console.log(`  통과 ${pass} / 실패 ${fail}`);
console.log('────────────────────────────\n');
process.exit(fail ? 1 : 0);
