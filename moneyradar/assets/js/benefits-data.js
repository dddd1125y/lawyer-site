/* =========================================================
   머니레이더 — 혜택 데이터셋
   ▸ 정리 기준: 2025년 공고 기준 / 금액·자격은 매년 변동됨
   ▸ 항목을 추가할 때는 아래 형식을 그대로 복사해서 쓰면 됩니다.
   ========================================================= */
window.MR_BENEFITS_UPDATED = '2025-07-01';

window.MR_BENEFITS = [
    {
        title: '근로장려금',
        category: '세금·환급',
        ages: ['20대', '30대', '40대', '50대+'],
        amount: '최대 330만원',
        period: '매년 5월 정기신청',
        summary: '소득과 재산이 일정 기준 이하인 근로·사업·종교인 가구에 현금으로 지급하는 대표적인 환급 제도입니다.',
        condition: '단독가구 최대 165만원 / 홑벌이 285만원 / 맞벌이 330만원',
        agency: '국세청 홈택스',
        link: 'https://www.hometax.go.kr'
    },
    {
        title: '자녀장려금',
        category: '세금·환급',
        ages: ['30대', '40대'],
        amount: '자녀 1인당 최대 100만원',
        period: '매년 5월 정기신청',
        summary: '18세 미만 부양자녀가 있는 저소득 가구에 자녀 수에 따라 지급합니다. 근로장려금과 중복 신청이 가능합니다.',
        condition: '부양자녀 1인당 최대 100만원',
        agency: '국세청 홈택스',
        link: 'https://www.hometax.go.kr'
    },
    {
        title: '청년내일저축계좌',
        category: '청년',
        ages: ['20대', '30대'],
        amount: '3년 만기 최대 1,440만원',
        period: '매년 상반기 모집',
        summary: '매월 10만원을 저축하면 정부가 10~30만원을 추가로 적립해 주는 자산형성 지원 사업입니다.',
        condition: '만 19~34세, 근로·사업소득이 있는 기준 중위소득 100% 이하 가구',
        agency: '복지로',
        link: 'https://www.bokjiro.go.kr'
    },
    {
        title: '청년월세 한시 특별지원',
        category: '주거',
        ages: ['20대', '30대'],
        amount: '월 최대 20만원 × 12개월',
        period: '지자체별 상시·기간 모집',
        summary: '무주택 청년의 월세를 최대 12개월간 지원합니다. 지자체별 자체 월세 지원과 중복 여부를 확인해야 합니다.',
        condition: '만 19~34세 무주택 청년, 보증금·월세 기준 충족',
        agency: '마이홈포털',
        link: 'https://www.myhome.go.kr'
    },
    {
        title: '국민취업지원제도',
        category: '고용',
        ages: ['20대', '30대', '40대', '50대+'],
        amount: '구직촉진수당 월 50만원 × 6개월',
        period: '상시 신청',
        summary: '실업급여를 받지 못하는 구직자에게 취업지원 서비스와 생계비를 함께 지원하는 제도입니다.',
        condition: '15~69세 구직자 중 소득·재산 요건 충족 (I유형/II유형)',
        agency: '고용24',
        link: 'https://www.work24.go.kr'
    },
    {
        title: '실업크레딧',
        category: '고용',
        ages: ['30대', '40대', '50대+'],
        amount: '연금보험료 75% 지원',
        period: '실업급여 수급 중 신청',
        summary: '구직급여 수급 기간에도 국민연금 가입 기간을 이어갈 수 있도록 보험료의 75%를 국가가 지원합니다.',
        condition: '구직급여 수급자, 최대 12개월까지 지원',
        agency: '국민연금공단',
        link: 'https://www.nps.or.kr'
    },
    {
        title: '부모급여',
        category: '육아',
        ages: ['20대', '30대', '40대'],
        amount: '0세 월 100만원 / 1세 월 50만원',
        period: '출생 후 60일 이내 신청',
        summary: '만 2세 미만 아동을 양육하는 가정에 매월 현금으로 지급합니다. 어린이집 이용 시 보육료 바우처로 전환됩니다.',
        condition: '소득 기준 없음, 출생신고와 함께 신청 가능',
        agency: '복지로',
        link: 'https://www.bokjiro.go.kr'
    },
    {
        title: '첫만남이용권',
        category: '육아',
        ages: ['20대', '30대', '40대'],
        amount: '첫째 200만원 / 둘째 이상 300만원',
        period: '출생 후 1년 이내 사용',
        summary: '출생 아동에게 지급되는 일시금 바우처로, 국민행복카드에 포인트로 지급됩니다.',
        condition: '소득 기준 없음, 출생신고 시 함께 신청',
        agency: '복지로',
        link: 'https://www.bokjiro.go.kr'
    },
    {
        title: '아동수당',
        category: '육아',
        ages: ['20대', '30대', '40대'],
        amount: '월 10만원',
        period: '상시 신청',
        summary: '만 8세 미만(95개월까지) 모든 아동에게 매월 지급되는 보편 수당입니다.',
        condition: '소득·재산 기준 없음',
        agency: '복지로',
        link: 'https://www.bokjiro.go.kr'
    },
    {
        title: '에너지바우처',
        category: '생활',
        ages: ['40대', '50대+'],
        amount: '연 30만원 안팎 (가구원 수별)',
        period: '여름·겨울 각각 신청',
        summary: '냉방·난방비를 지원하는 바우처로, 전기·도시가스·연탄 등에서 선택해 사용할 수 있습니다.',
        condition: '생계·의료·주거·교육급여 수급자 중 더위·추위 민감계층',
        agency: '한국에너지공단',
        link: 'https://www.energyv.or.kr'
    },
    {
        title: '문화누리카드',
        category: '생활',
        ages: ['20대', '30대', '40대', '50대+'],
        amount: '연 13만원',
        period: '매년 2월~11월 발급',
        summary: '공연·영화·도서·여행·체육 활동에 사용할 수 있는 통합문화이용권입니다.',
        condition: '6세 이상 기초생활수급자 및 차상위계층',
        agency: '문화누리',
        link: 'https://www.mnuri.kr'
    },
    {
        title: '숨은 보험금 찾기',
        category: '세금·환급',
        ages: ['20대', '30대', '40대', '50대+'],
        amount: '조회 후 확인',
        period: '상시 조회',
        summary: '만기가 지났거나 청구하지 않아 잠자고 있는 보험금을 주민등록번호 조회 한 번으로 찾을 수 있습니다.',
        condition: '본인 인증만으로 전 보험사 조회 가능',
        agency: '내보험 찾아줌',
        link: 'https://cont.insure.or.kr'
    },
    {
        title: '휴면예금·미수령 환급금 조회',
        category: '세금·환급',
        ages: ['20대', '30대', '40대', '50대+'],
        amount: '조회 후 확인',
        period: '상시 조회',
        summary: '오래 거래하지 않아 잠자고 있는 예금과 보험금, 미수령 주식 배당금까지 한 번에 확인할 수 있습니다.',
        condition: '본인 명의 계좌 통합 조회',
        agency: '금융감독원 파인',
        link: 'https://fine.fss.or.kr'
    },
    {
        title: '국민내일배움카드',
        category: '고용',
        ages: ['20대', '30대', '40대', '50대+'],
        amount: '5년간 300~500만원',
        period: '상시 신청',
        summary: '직업훈련비를 지원하는 카드로, 재직자·구직자 모두 신청할 수 있습니다.',
        condition: '일부 고소득자·공무원 등 제외',
        agency: '고용24',
        link: 'https://www.work24.go.kr'
    }
];
