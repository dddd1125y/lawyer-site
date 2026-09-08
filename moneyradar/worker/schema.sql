-- 머니레이더 이용권 테이블
-- 적용:  npx wrangler d1 execute moneyradar --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS licenses (
    key         TEXT PRIMARY KEY,        -- MR-XXXX-XXXX-XXXX
    order_id    TEXT UNIQUE NOT NULL,    -- 같은 주문을 두 번 승인하지 못하게 한다
    plan        TEXT NOT NULL,           -- monthly | yearly
    amount      INTEGER NOT NULL,
    payment_key TEXT,                    -- 토스페이먼츠 결제 식별자 (환불 시 필요)
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active'   -- active | refunded | revoked
);

CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_status  ON licenses(status);
