# MoneyRadar 구독 시스템 구현 가이드

## 개요
MoneyRadar에 Freemium 구독 모델을 도입하기 위한 기술 구현 로드맵입니다.

---

## 1. 프리미엄 기능 요구사항

### 1.1 Free 플랜 (현재 유지)
- ✅ 5대 계산기 (연봉, 퇴직금, 실업급여, 4대보험, 육아휴직)
- ✅ 계산식 및 기준 요율 표시
- ✅ URL 공유
- ✅ 지원금 검색

### 1.2 Premium 플랜 (₩4,900/월, ₩45,000/년)
- 📊 계산 내역 저장 (최대 50개)
- 📈 시나리오 비교 (다중 계산 결과 나란히 비교)
- 📥 Excel/PDF 내보내기
- 📄 월간 재무 레포트 (자동 생성 및 배송)
- 🤖 AI 재무 조언 (베타)
- 🚫 광고 제거

---

## 2. 아키텍처 설계

### 2.1 데이터 저장 구조

```javascript
// 사용자 계산 내역 스키마 (localStorage 또는 클라우드)
{
  userId: "user_123",
  calculations: [
    {
      id: "calc_001",
      type: "salary",  // salary | severance | unemployment | insurance | parental-leave
      inputs: {
        annualSalary: 50000000,
        yearsOfService: 5,
        ...otherInputs
      },
      results: {
        netSalary: 3500000,
        taxDeduction: 600000,
        insuranceDeduction: 400000,
        ...otherResults
      },
      timestamp: 1693478400000,
      name: "2024년 예상 월급"  // 사용자가 지정 가능
    }
  ],
  scenarios: [
    {
      id: "scenario_001",
      name: "연봉 인상 시뮬레이션",
      calculations: ["calc_001", "calc_002", "calc_003"],
      createdAt: 1693478400000
    }
  ]
}
```

### 2.2 결제 시스템 통합

```javascript
// 추천 결제 게이트웨이: 토스페이먼츠
// 1. 구독 생성
POST /api/subscriptions
{
  userId: "user_123",
  plan: "premium",  // premium | premium-plus
  billingCycle: "monthly",  // monthly | yearly
  paymentMethod: "card"
}

// 2. 구독 상태 확인
GET /api/subscriptions/:userId
Response: {
  status: "active",  // active | expired | cancelled
  plan: "premium",
  expiresAt: 1696156800000,
  autoRenew: true
}
```

---

## 3. 프론트엔드 구현 (HTML/JS)

### 3.1 프리미�엄 게이트 컴포넌트

```html
<!-- moneyradar/components/premium-gate.html -->
<div class="premium-feature" id="premiumGate">
  <div class="feature-lock">
    <svg class="lock-icon" viewBox="0 0 24 24">
      <path d="M12 1c-6.338 0-12 4.226-12 10.007 0 2.05.738 4.063 2.047 5.625.055 4.638 6.859 7.368 9.953 7.368s9.898-2.73 9.953-7.368c1.309-1.562 2.047-3.575 2.047-5.625 0-5.781-5.662-10.007-12-10.007zm0 18c-3.569 0-6.587-1.657-7.778-3.707 1.285 2.059 4.335 3.378 7.778 3.378s6.493-1.319 7.778-3.378c-1.191 2.05-4.209 3.707-7.778 3.707zm6-8c-.552 0-1-.447-1-1s.448-1 1-1 1 .447 1 1-.448 1-1 1zm-12 0c-.552 0-1-.447-1-1s.448-1 1-1 1 .447 1 1-.448 1-1 1zm6-5c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"/>
    </svg>
    <h3>프리미엄 기능입니다</h3>
    <p>계산 내역 저장, 시나리오 비교, 파일 내보내기를 이용하세요.</p>
    <button class="btn btn-primary" id="upgradeToPremium">
      프리미엄으로 업그레이드 (₩4,900/월)
    </button>
  </div>
</div>

<style>
  .premium-feature {
    position: relative;
  }
  
  .premium-feature.locked {
    opacity: 0.5;
    pointer-events: none;
  }
  
  .premium-feature.locked .feature-lock {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background: linear-gradient(135deg, #fbecea 0%, #e3efea 100%);
    border-radius: 12px;
    text-align: center;
  }
  
  .lock-icon {
    width: 48px;
    height: 48px;
    color: #b43a2c;
    margin-bottom: 15px;
  }
</style>
```

### 3.2 계산 내역 저장 시스템

```javascript
// assets/js/premium-storage.js
class PremiumStorage {
  constructor(userId) {
    this.userId = userId;
    this.storageKey = `mr_premium_${userId}`;
  }

  // 계산 결과 저장
  saveCalculation(type, inputs, results, name) {
    const data = this.getData();
    
    if (data.calculations.length >= 50) {
      // 가장 오래된 것 삭제
      data.calculations.shift();
    }

    const calculation = {
      id: `calc_${Date.now()}`,
      type,
      inputs,
      results,
      name: name || `${type} - ${new Date().toLocaleDateString('ko-KR')}`,
      timestamp: Date.now()
    };

    data.calculations.push(calculation);
    this.saveData(data);
    return calculation;
  }

  // 계산 내역 조회
  getCalculations(limit = 10) {
    const data = this.getData();
    return data.calculations.slice(-limit).reverse();
  }

  // 시나리오 생성 (다중 계산 비교)
  createScenario(name, calculationIds) {
    const data = this.getData();
    
    const scenario = {
      id: `scenario_${Date.now()}`,
      name,
      calculations: calculationIds,
      createdAt: Date.now()
    };

    data.scenarios.push(scenario);
    this.saveData(data);
    return scenario;
  }

  // 데이터 내보내기 (Excel/PDF)
  exportAsExcel(calculationIds) {
    // xlsx 라이브러리 사용
    const data = this.getData();
    const selectedCalcs = data.calculations.filter(c => 
      calculationIds.includes(c.id)
    );

    // Excel 파일 생성 로직
    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(selectedCalcs);
    XLSX.utils.book_append_sheet(workbook, ws, "계산 결과");
    XLSX.writeFile(workbook, `moneyradar_${Date.now()}.xlsx`);
  }

  // 내부 헬퍼
  getData() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : { calculations: [], scenarios: [] };
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}
```

### 3.3 구독 상태 확인

```javascript
// assets/js/subscription.js
class SubscriptionManager {
  static async checkStatus() {
    try {
      const response = await fetch(`/api/subscriptions/${this.getUserId()}`);
      const subscription = await response.json();
      
      if (subscription.status === 'active') {
        document.body.classList.add('is-premium');
        this.enablePremiumFeatures();
      }
      
      return subscription;
    } catch (error) {
      console.error('구독 상태 조회 실패:', error);
      return { status: 'free' };
    }
  }

  static enablePremiumFeatures() {
    // 프리미엄 기능 UI 활성화
    document.querySelectorAll('[data-premium-only]').forEach(el => {
      el.classList.remove('premium-feature--locked');
      el.addEventListener('click', () => {
        // 프리미엄 기능 실행
      });
    });
  }

  static openUpgradeModal() {
    // 결제 게이트웨이 연결
    window.location.href = '/api/checkout/premium';
  }

  static getUserId() {
    // localStorage 또는 세션에서 사용자 ID 조회
    return localStorage.getItem('mr_userId');
  }
}

// 페이지 로드 시 구독 상태 확인
document.addEventListener('DOMContentLoaded', () => {
  SubscriptionManager.checkStatus();
});
```

### 3.4 시나리오 비교 UI

```html
<!-- moneyradar/scenario-compare.html -->
<div class="scenario-compare" id="scenarioCompare">
  <div class="compare-header">
    <h2>시나리오 비교</h2>
    <p>여러 계산 결과를 나란히 비교하여 최적의 선택을 하세요.</p>
  </div>

  <div class="compare-controls">
    <button id="addCalculation" class="btn btn-secondary">
      + 계산 결과 추가
    </button>
    <select id="scenarioSelect" placeholder="저장된 시나리오...">
      <!-- 동적 로드 -->
    </select>
  </div>

  <div id="compareTable" class="compare-table">
    <!-- 비교 테이블 렌더링 -->
  </div>
</div>

<style>
  .compare-table {
    overflow-x: auto;
    margin-top: 20px;
  }

  .compare-table table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
  }

  .compare-table th {
    background: #0b6b5a;
    color: #fff;
    padding: 12px;
    text-align: left;
    font-weight: 600;
  }

  .compare-table td {
    padding: 12px;
    border-bottom: 1px solid #dde4de;
  }

  .compare-table tr:hover {
    background: #f5f7f4;
  }

  .compare-table .highlight {
    background: #e3efea;
    font-weight: 600;
  }
</style>

<script>
  class ScenarioCompare {
    constructor() {
      this.storage = new PremiumStorage(SubscriptionManager.getUserId());
      this.selectedCalculations = [];
      this.init();
    }

    init() {
      document.getElementById('addCalculation').addEventListener('click', 
        () => this.showCalculationSelector()
      );
      this.renderSavedScenarios();
    }

    showCalculationSelector() {
      const calcs = this.storage.getCalculations(50);
      const modal = this.createModal('계산 결과 선택', calcs.map(c => ({
        id: c.id,
        label: c.name,
        type: c.type
      })));
      
      modal.show();
    }

    renderComparison() {
      const calcs = this.storage.getData().calculations
        .filter(c => this.selectedCalculations.includes(c.id));

      const table = this.createComparisonTable(calcs);
      document.getElementById('compareTable').innerHTML = table;
    }

    createComparisonTable(calculations) {
      if (!calculations.length) {
        return '<p style="text-align: center; color: #999;">비교할 계산을 선택하세요.</p>';
      }

      const headers = ['항목', ...calculations.map(c => c.name)];
      const rows = this.extractCommonFields(calculations);

      let html = '<table><thead><tr>';
      headers.forEach(h => html += `<th>${h}</th>`);
      html += '</tr></thead><tbody>';

      rows.forEach(row => {
        html += '<tr>';
        html += `<td class="highlight">${row.label}</td>`;
        row.values.forEach(v => html += `<td>${this.formatNumber(v)}</td>`);
        html += '</tr>';
      });

      html += '</tbody></table>';
      return html;
    }

    extractCommonFields(calculations) {
      // 공통 필드 추출 및 비교 준비
      return [
        {
          label: '월 실수령액',
          values: calculations.map(c => c.results.netSalary)
        },
        {
          label: '세금 및 보험료',
          values: calculations.map(c => 
            c.results.taxDeduction + c.results.insuranceDeduction
          )
        }
        // ... 더 많은 필드
      ];
    }

    formatNumber(n) {
      return typeof n === 'number' 
        ? `₩${n.toLocaleString('ko-KR')}` 
        : n || '-';
    }
  }

  // 초기화
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('is-premium')) {
      new ScenarioCompare();
    }
  });
</script>
```

---

## 4. 백엔드 구현 (Node.js 예시)

### 4.1 기본 API 구조

```javascript
// backend/routes/subscriptions.js
const express = require('express');
const router = express.Router();
const TossPayments = require('@tosspayments/sdk').default;

const client = new TossPayments({
  secretKey: process.env.TOSS_SECRET_KEY
});

// 구독 생성
router.post('/api/subscriptions', async (req, res) => {
  const { userId, plan, billingCycle } = req.body;

  try {
    // 결제 링크 생성
    const paymentLink = await client.createPaymentLink({
      orderId: `${userId}_${Date.now()}`,
      orderName: `MoneyRadar ${plan === 'premium' ? 'Premium' : 'Premium+'}`,
      amount: plan === 'premium' 
        ? (billingCycle === 'yearly' ? 45000 : 4900)
        : (billingCycle === 'yearly' ? 72000 : 7900),
      successUrl: `${process.env.BASE_URL}/premium/success`,
      failUrl: `${process.env.BASE_URL}/premium/fail`,
      metadata: { userId, plan, billingCycle }
    });

    res.json({ paymentUrl: paymentLink.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 구독 상태 조회
router.get('/api/subscriptions/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      return res.json({ status: 'free' });
    }

    const isActive = subscription.expiresAt > new Date();
    
    res.json({
      status: isActive ? 'active' : 'expired',
      plan: subscription.plan,
      expiresAt: subscription.expiresAt,
      autoRenew: subscription.autoRenew
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 구독 취소
router.post('/api/subscriptions/:userId/cancel', async (req, res) => {
  const { userId } = req.params;

  try {
    const subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      return res.status(404).json({ error: '구독을 찾을 수 없습니다.' });
    }

    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    await subscription.save();

    res.json({ message: '구독이 취소되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 4.2 데이터베이스 스키마 (MongoDB)

```javascript
// models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['premium', 'premium-plus'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  paymentId: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  cancelledAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
```

---

## 5. 배포 체크리스트

- [ ] 프리미엘 UI 설계 및 구현
- [ ] 결제 게이트웨이 통합 (토스페이먼츠)
- [ ] 데이터 저장 시스템 구현
- [ ] 계산 내역 저장 기능
- [ ] 시나리오 비교 기능
- [ ] Excel/PDF 내보내기 기능
- [ ] 월간 레포트 자동 생성
- [ ] AI 재무 조언 API 연결
- [ ] 광고 제거 기능
- [ ] 사용자 인증 시스템 (로그인/회원가입)
- [ ] 구독 관리 페이지
- [ ] 취소 정책 및 환불 정책 작성
- [ ] 약관 및 개인정보 처리 방침 업데이트
- [ ] SSL 인증서 적용
- [ ] 스트레스 테스트 (1000+ 동시 사용자)
- [ ] 모니터링 및 로깅 시스템
- [ ] 베타 테스트 (100명 이상)
- [ ] 마케팅 및 홍보 준비

---

## 6. 비용 추정

| 항목 | 월간 예상 비용 | 비고 |
|------|--------------|------|
| 호스팅 (AWS/Vercel) | ₩50,000 | 증가 시 추가 |
| 데이터베이스 (MongoDB Atlas) | ₩30,000 | 무료 티어 초과 시 |
| 결제 게이트웨이 (토스) | 수수료 3.8% | 거래액 기반 |
| 이메일 서비스 (SendGrid) | ₩20,000 | 월간 10,000건 |
| AI API (Claude/GPT) | ₩50,000 | 베타 기간 추정 |
| **총계** | **₩150,000~** | 매출에 따라 조정 |

---

## 7. 성공 지표 (KPI)

- **구독 전환율:** 3~8% (초기 목표 3%)
- **월간 구독자 성장:** 10~15% MoM
- **이탈율:** 5% 이하
- **ARPU:** ₩4,900 (월간)
- **LTV/CAC 비율:** 3:1 이상

---

## 참고 자료

- [토스페이먼츠 API 문서](https://docs.tosspayments.com)
- [한국 SaaS 구독 가격 벤치마크](https://www.revenuecat.com)
- [구독 비즈니스 모델 가이드](https://www.forentrepreneurs.com/subscription-models)
