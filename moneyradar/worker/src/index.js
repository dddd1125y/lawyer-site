/**
 * 머니레이더 결제 승인 서버 (Cloudflare Worker)
 *
 * 정적 사이트(GitHub Pages)만으로는 결제를 끝낼 수 없다.
 * 토스페이먼츠 승인 API 는 시크릿 키를 요구하는데, 그 키를 브라우저에 두면
 * 누구나 남의 결제를 승인하거나 조작할 수 있기 때문이다.
 * 그래서 시크릿 키를 아는 것은 오직 이 서버뿐이다.
 *
 * 엔드포인트
 *   POST /api/payments/confirm     결제 승인 + 이용권 발급
 *   GET  /api/license/status?key=  이용권 유효성 확인
 */

const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

/* 금액은 절대 클라이언트를 믿지 않는다. 주문번호에 박힌 플랜으로 서버가 다시 정한다. */
const PLANS = {
    monthly: { amount: 4900, days: 30, name: '프로 1개월' },
    yearly: { amount: 45000, days: 365, name: '프로 1년' }
};

function corsHeaders(env, request) {
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const allow = allowed.length === 0 ? '*' : (allowed.includes(origin) ? origin : allowed[0]);
    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

function json(data, status, env, request) {
    return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(env, request) }
    });
}

/** MR-XXXX-XXXX-XXXX 형태의 읽기 쉬운 이용권 키 (혼동되는 0/O/1/I 제외) */
function makeLicenseKey() {
    const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]);
    return 'MR-' + chars.slice(0, 4).join('') + '-' + chars.slice(4, 8).join('') + '-' + chars.slice(8, 12).join('');
}

/** 주문번호(mr-<plan>-...)에서 플랜을 뽑아낸다 */
function planFromOrderId(orderId) {
    const m = /^mr-([a-z]+)-/.exec(String(orderId || ''));
    return m && PLANS[m[1]] ? { id: m[1], ...PLANS[m[1]] } : null;
}

async function confirmPayment(request, env) {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return json({ error: 'BAD_REQUEST', message: '요청 형식이 올바르지 않습니다.' }, 400, env, request);
    }

    const { paymentKey, orderId, amount } = body || {};
    if (!paymentKey || !orderId || typeof amount !== 'number') {
        return json({ error: 'BAD_REQUEST', message: '결제 정보가 부족합니다.' }, 400, env, request);
    }

    const plan = planFromOrderId(orderId);
    if (!plan) {
        return json({ error: 'UNKNOWN_PLAN', message: '알 수 없는 주문입니다.' }, 400, env, request);
    }

    /* 클라이언트가 보낸 금액이 그 플랜의 정가와 다르면 승인하지 않는다 */
    if (amount !== plan.amount) {
        return json({ error: 'AMOUNT_MISMATCH', message: '결제 금액이 요금제와 맞지 않습니다.' }, 400, env, request);
    }

    /* 같은 주문을 두 번 승인해도 이용권이 두 개 생기지 않도록 한다 */
    const existing = await env.DB.prepare(
        'SELECT key, expires_at FROM licenses WHERE order_id = ?'
    ).bind(orderId).first();
    if (existing) {
        return json({ licenseKey: existing.key, expiresAt: existing.expires_at, reused: true }, 200, env, request);
    }

    const auth = btoa(env.TOSS_SECRET_KEY + ':');
    let tossRes, tossData;
    try {
        tossRes = await fetch(TOSS_CONFIRM_URL, {
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + auth,
                'Content-Type': 'application/json',
                'Idempotency-Key': orderId
            },
            body: JSON.stringify({ paymentKey, orderId, amount })
        });
        tossData = await tossRes.json();
    } catch (e) {
        return json({ error: 'GATEWAY_ERROR', message: '결제사와 통신하지 못했습니다.' }, 502, env, request);
    }

    if (!tossRes.ok) {
        return json({
            error: tossData.code || 'CONFIRM_FAILED',
            message: tossData.message || '결제 승인에 실패했습니다.'
        }, 400, env, request);
    }

    const now = new Date();
    const expires = new Date(now.getTime() + plan.days * 86400000);
    const licenseKey = makeLicenseKey();

    await env.DB.prepare(
        `INSERT INTO licenses (key, order_id, plan, amount, payment_key, created_at, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
    ).bind(
        licenseKey, orderId, plan.id, amount, paymentKey,
        now.toISOString(), expires.toISOString()
    ).run();

    return json({
        licenseKey,
        plan: plan.id,
        planName: plan.name,
        expiresAt: expires.toISOString(),
        receiptUrl: (tossData.receipt && tossData.receipt.url) || null
    }, 200, env, request);
}

async function licenseStatus(request, env) {
    const key = new URL(request.url).searchParams.get('key');
    if (!key) return json({ active: false }, 200, env, request);

    const row = await env.DB.prepare(
        'SELECT expires_at, status FROM licenses WHERE key = ?'
    ).bind(key).first();

    if (!row || row.status !== 'active') return json({ active: false }, 200, env, request);

    const active = Date.parse(row.expires_at) > Date.now();
    return json({ active, expiresAt: row.expires_at }, 200, env, request);
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(env, request) });
        }

        if (url.pathname === '/api/payments/confirm' && request.method === 'POST') {
            return confirmPayment(request, env);
        }
        if (url.pathname === '/api/license/status' && request.method === 'GET') {
            return licenseStatus(request, env);
        }
        if (url.pathname === '/health') {
            return json({ ok: true }, 200, env, request);
        }

        return json({ error: 'NOT_FOUND' }, 404, env, request);
    }
};
