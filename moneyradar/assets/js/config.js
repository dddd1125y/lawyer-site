/* =========================================================
   머니레이더 — 배포 설정
   실제 결제를 켜려면 아래 두 값을 채우세요. (PAYMENT_SETUP.md 참고)
   값이 비어 있으면 사이트는 "결제 준비 중" 상태로 안전하게 동작합니다.
   ========================================================= */
window.MR_CONFIG = {
    /* 토스페이먼츠 결제위젯 클라이언트 키 (공개 키 — 노출되어도 안전) */
    tossClientKey: '',

    /* 결제 승인을 처리하는 서버 주소 (Cloudflare Worker 등) */
    apiBase: '',

    /* 요금제 — 자동갱신이 아닌 기간제 단건 결제 */
    plans: {
        monthly: { id: 'monthly', name: '프로 1개월', amount: 4900, days: 30 },
        yearly:  { id: 'yearly',  name: '프로 1년',   amount: 45000, days: 365 }
    },

    /* 결제 기능 준비 여부 */
    get isPaymentReady() {
        return Boolean(this.tossClientKey && this.apiBase);
    },

    /* 카카오 애드핏 — 승인 후 발급받은 광고 단위 코드(DAN-로 시작)를 넣으세요. (KAKAO_ADFIT_SETUP.md 참고)
       비어 있으면 자리 표시자만 보이고 아무 스크립트도 불러오지 않습니다. */
    ads: {
        kakaoAdUnit: '',
        get isReady() {
            return Boolean(this.kakaoAdUnit);
        }
    }
};
