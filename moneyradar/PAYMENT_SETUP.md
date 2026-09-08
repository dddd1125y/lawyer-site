# 결제 켜는 방법

지금 사이트는 **결제 코드가 다 들어가 있지만 꺼져 있는 상태**입니다.
`assets/js/config.js` 의 두 값이 비어 있으면 결제 페이지는 "준비 중"이라고만 안내하고,
계산기는 평소처럼 무료로 동작합니다. 아래 순서대로 채우면 결제가 켜집니다.

---

## 먼저 알아야 할 것 두 가지

**1. 사업자등록이 필요합니다.**
토스페이먼츠는 개인 명의로 가입할 수 없고 사업자등록이 있어야 합니다.
간이과세 개인사업자로도 됩니다. 홈택스에서 온라인으로 신청하면 보통 1~3일 걸립니다.

**2. GitHub Pages만으로는 결제를 끝낼 수 없습니다.**
결제를 최종 승인하려면 **시크릿 키**로 토스페이먼츠 서버를 호출해야 하는데,
그 키를 브라우저에 두면 누구나 결제를 조작할 수 있습니다.
그래서 `worker/` 폴더에 작은 서버를 만들어 두었습니다. Cloudflare에 무료로 올리면 됩니다.

---

## 왜 자동결제(구독)가 아니라 기간제인가

자동결제(빌링)는 토스페이먼츠의 **별도 계약과 리스크 심사**를 통과해야 쓸 수 있고,
심사에 시간이 걸립니다. 그래서 처음에는 **30일 / 365일짜리 이용권을 한 번 결제**하는 방식으로 만들었습니다.

- 심사 없이 일반 결제만으로 바로 시작할 수 있습니다
- "해지를 깜빡해서 돈이 빠져나갔다"는 불만이 아예 생기지 않습니다
- 나중에 매출이 붙으면 그때 빌링 계약을 추가하면 됩니다

---

## 1단계 — 토스페이먼츠 가입하고 키 받기

1. https://www.tosspayments.com 에서 가입 (사업자등록증 필요)
2. 심사가 끝나면 개발자센터 → **API 키** 메뉴로 이동
3. 두 개의 키를 복사해 둡니다
   - **클라이언트 키** (`live_ck_...` 또는 `test_ck_...`) — 공개되어도 안전, 브라우저에서 씁니다
   - **시크릿 키** (`live_sk_...` 또는 `test_sk_...`) — **절대 공개 금지**, 서버에서만 씁니다

> 처음에는 반드시 **테스트 키(`test_`)로 먼저** 연동해 보세요.
> 실제 카드 승인 없이 전체 흐름을 확인할 수 있습니다.

---

## 2단계 — 결제 서버 올리기 (Cloudflare, 무료)

```bash
cd moneyradar/worker

# Cloudflare 로그인 (브라우저가 열립니다)
npx wrangler login

# 이용권을 저장할 데이터베이스 생성
npx wrangler d1 create moneyradar
# → 출력된 database_id 를 wrangler.toml 의 database_id 자리에 붙여넣으세요

# 테이블 만들기
npx wrangler d1 execute moneyradar --remote --file=schema.sql

# 시크릿 키 넣기 (파일에 저장되지 않고 Cloudflare에만 보관됩니다)
npx wrangler secret put TOSS_SECRET_KEY
# → 1단계에서 받은 시크릿 키를 붙여넣고 엔터

# 배포
npx wrangler deploy
```

배포가 끝나면 `https://moneyradar-pay.<계정이름>.workers.dev` 같은 주소가 나옵니다. 이 주소를 복사해 두세요.

잘 올라갔는지 확인:

```bash
curl https://moneyradar-pay.<계정이름>.workers.dev/health
# {"ok":true} 가 나오면 성공
```

---

## 3단계 — 사이트에 연결하기

`moneyradar/assets/js/config.js` 를 열어 두 줄을 채웁니다.

```js
window.MR_CONFIG = {
    tossClientKey: 'test_ck_여기에_클라이언트_키',
    apiBase: 'https://moneyradar-pay.여러분계정.workers.dev',
    ...
};
```

그리고 `worker/wrangler.toml` 의 `ALLOWED_ORIGIN` 이 사이트 주소와 맞는지 확인합니다.

```toml
ALLOWED_ORIGIN = "https://dddd1125y.github.io"
```

바꿨다면 `npx wrangler deploy` 를 한 번 더 실행하세요.

커밋하고 푸시하면 GitHub Pages에 반영됩니다.

---

## 4단계 — 테스트 결제 해보기

1. `요금제 → 프로 시작하기` 로 이동
2. 결제 수단이 뜨는지 확인 (안 뜨면 클라이언트 키를 다시 확인)
3. 테스트 카드로 결제 (토스페이먼츠 개발자센터에 테스트 카드번호가 있습니다)
4. 결제 후 **이용권 키(MR-XXXX-XXXX-XXXX)** 가 나오는지 확인
5. `이용권 관리` 페이지에서 그 키를 넣어 "프로 이용 중"으로 바뀌는지 확인
6. 다른 브라우저(시크릿 창)에서도 같은 키로 켜지는지 확인

데이터가 잘 들어갔는지 보려면:

```bash
npx wrangler d1 execute moneyradar --remote --command "SELECT * FROM licenses"
```

---

## 5단계 — 실제 결제로 전환

테스트가 전부 통과하면 키만 바꾸면 됩니다.

1. `config.js` 의 `tossClientKey` 를 `live_ck_...` 로 교체
2. `npx wrangler secret put TOSS_SECRET_KEY` 로 `live_sk_...` 를 다시 넣기
3. `npx wrangler deploy`

---

## 보안에 대해

이 서버는 다음을 막아 둡니다. (`worker/test.mjs` 21개 테스트로 검증)

| 공격 | 막는 방법 |
|------|-----------|
| 100원 내고 1년권 받기 | 주문번호에서 요금제를 읽어 **서버가 금액을 다시 정합니다.** 클라이언트가 보낸 금액이 다르면 거절 |
| 같은 결제로 이용권 여러 개 받기 | 주문번호를 유일 키로 저장해, 두 번째부터는 **같은 이용권을 돌려줍니다** |
| 다른 사이트에서 API 호출 | `ALLOWED_ORIGIN` 에 적힌 주소만 허용 |
| 시크릿 키 유출 | 키는 Cloudflare에만 있고 저장소·브라우저 어디에도 없습니다 |

테스트 실행:

```bash
cd moneyradar/worker && node test.mjs
```

---

## 자주 막히는 곳

**결제 수단이 안 보여요**
→ 클라이언트 키가 잘못되었거나 광고 차단 확장이 토스 스크립트를 막고 있습니다.
   브라우저 콘솔(F12)에 뜬 에러를 확인하세요.

**"승인 서버 미설정" 이라고 나와요**
→ `config.js` 의 `apiBase` 가 비어 있습니다. 2단계에서 받은 Worker 주소를 넣으세요.

**CORS 에러가 나요**
→ `wrangler.toml` 의 `ALLOWED_ORIGIN` 과 실제 사이트 주소가 다릅니다.
   끝에 `/` 를 붙이지 마세요. 바꾼 뒤 재배포해야 반영됩니다.

**결제는 됐는데 이용권이 안 나와요**
→ `npx wrangler tail` 로 서버 로그를 실시간으로 보면 원인이 보입니다.

---

## 환불 처리

지금은 자동 환불 기능이 없습니다. 요청이 오면 이렇게 처리하세요.

1. 토스페이먼츠 상점관리자에서 해당 결제를 취소
2. 이용권을 막습니다

```bash
npx wrangler d1 execute moneyradar --remote \
  --command "UPDATE licenses SET status='refunded' WHERE order_id='주문번호'"
```

---

## 나중에 붙일 것

- **자동갱신** — 매출이 붙으면 토스페이먼츠 빌링 계약을 신청하세요
- **영수증 메일** — 지금은 화면에만 이용권 키가 나옵니다. 키를 잃어버린 사람을 위해 메일 발송을 붙이면 좋습니다
- **만료 전 알림** — 이용권이 3일 남았을 때 알려주면 재결제율이 크게 올라갑니다
