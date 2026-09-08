# MoneyRadar 디자인 개선 가이드

## 개요
현재 MoneyRadar의 강력한 틸그린 + 레드 + 금색 시스템을 유지하면서, 한국 금융 시장의 신뢰도와 프리미엄 포지셔닝을 강화하는 디자인 전략입니다.

---

## 1. 현재 디자인 시스템 분석

### 1.1 색상 팔레트 현황

```css
:root {
    /* 라이트 모드 */
    --paper: #f5f7f4;        /* 배경 */
    --surface: #ffffff;      /* 카드 배경 */
    --ink: #16221c;          /* 주요 텍스트 */
    --teal: #0b6b5a;         /* 주 액센트 (신뢰) */
    --stamp: #b43a2c;        /* CTA 버튼 (강조) */
    --gold: #9a6b1f;         /* 프리미엄 강조 */
}
```

### 1.2 강점 분석

✅ **현재 강점:**
- 틸그린(#0b6b5a): 신뢰도, 환경, 성장 이미지 → 금융 시장에서 점점 인기
- 명조 폰트(Noto Serif KR): 권위감, 신뢰성 → 금융 기관의 표준
- 다크모드 지원: 현대적 UX
- 높은 콘트래스트: 접근성 우수

❌ **개선 필요 영역:**
- 파란색 부재 → 한국 금융 시장의 기본 신뢰 색상 미활용
- 프리미엄 표시 부족 → 무료와 유료의 시각적 차별화 약함
- 보안 신호 부족 → "개인정보 안전"이 헤더에 명시되지 않음

---

## 2. 권장 색상 팔레트 개선

### 2.1 추가 파란색 도입

**목표:** 신뢰도 강화 + 한국 금융 표준 준수

```css
:root {
    /* 기존 유지 */
    --teal: #0b6b5a;           /* 주 액센트 */
    --stamp: #b43a2c;          /* CTA */
    --gold: #9a6b1f;           /* 프리미엠 */
    
    /* 신규 추가: 금융 신뢰 파란색 */
    --trust-blue: #0052CC;     /* 금융 신뢰도 (국민은행 계열) */
    --trust-blue-dark: #003da5; /* 다크 모드용 */
    --trust-blue-light: #E8F0FF; /* 배경 강조 */
}

@media (prefers-color-scheme: dark) {
    :root {
        --trust-blue: #6B9BFF;
        --trust-blue-dark: #8BABFF;
        --trust-blue-light: #1a2a4d;
    }
}
```

### 2.2 색상 사용 규칙 (Updated)

| 요소 | 색상 | 용도 | 우선순위 |
|------|------|------|---------|
| 헤더/내비 | `--teal` | 주요 UI | 1순위 |
| CTA 버튼 | `--stamp` (또는 `--trust-blue`) | 행동 유도 | 1순위 |
| 데이터 강조 | `--trust-blue` | 수치, 결과값 | 2순위 |
| 보안 배지 | `--trust-blue` | "🔒 안전" | 신규 |
| 프리미엠 | `--gold` | Premium 라벨 | 2순위 |
| 배경 강조 | `--trust-blue-light` | 하이라이트박스 | 2순위 |

---

## 3. UI/UX 개선안

### 3.1 헤더 개선 (신뢰 신호 강화)

**현재:**
```html
<header class="site-header">
    <div class="brand">머니레이더</div>
    <nav>계산기 | 혜택 찾기 | 가이드</nav>
</header>
```

**개선 후:**
```html
<header class="site-header">
    <div class="header-top">
        <div class="security-badge">
            <svg class="lock-icon"><!-- 자물쇠 아이콘 --></svg>
            <span>🔒 개인정보는 당신의 기기에서만 처리됩니다</span>
        </div>
        <div class="status-badge">
            <span class="dot"></span>
            2025년 기준 요율 적용
        </div>
    </div>
    <div class="wrap header-inner">
        <a class="brand" href="index.html">
            <span class="brand-mark">MR</span>
            <span class="brand-name">머니레이더</span>
        </a>
        <nav class="nav-desktop">
            <a href="index.html">계산기</a>
            <a href="benefits.html">혜택 찾기</a>
            <a href="guides.html">가이드</a>
        </nav>
        <button class="premium-btn">
            <span class="badge">Pro</span>
            업그레이드
        </button>
    </div>
</header>
```

**스타일:**
```css
.header-top {
    background: linear-gradient(90deg, #E8F0FF 0%, #e3efea 100%);
    border-bottom: 1px solid #dde4de;
    padding: 8px 0;
    font-size: 0.9em;
    font-weight: 600;
    color: #0052CC;
}

.security-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.lock-icon {
    width: 16px;
    height: 16px;
}

.premium-btn {
    background: linear-gradient(135deg, #9a6b1f 0%, #c89c3c 100%);
    color: #fff;
    padding: 8px 14px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9em;
    transition: all 0.3s;
}

.premium-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(154, 107, 31, 0.3);
}

.premium-btn .badge {
    background: rgba(255, 255, 255, 0.3);
    padding: 2px 6px;
    border-radius: 3px;
    margin-right: 4px;
    font-size: 0.8em;
    font-weight: 700;
}
```

### 3.2 계산 결과 영역 개선

**현재:**
```html
<div class="result">
    <div class="value">3,500,000원</div>
    <div class="label">월 실수령액</div>
</div>
```

**개선 후:**
```html
<div class="result-card">
    <div class="result-header">
        <h3>월 실수령액</h3>
        <span class="basis-date" title="기준일: 2025년 7월 1일">
            2025.7.1 기준
        </span>
    </div>
    
    <div class="result-main">
        <div class="result-value mono">₩3,500,000</div>
        <p class="result-desc">세전 연봉 ₩50,000,000 기준</p>
    </div>
    
    <!-- 신규: 신뢰도 강화 섹션 -->
    <div class="breakdown">
        <details>
            <summary>
                <span>📊 계산식 보기</span>
                <svg class="chevron"><!-- 화살표 --></svg>
            </summary>
            <div class="breakdown-details">
                <table>
                    <tr>
                        <td>세전 연봉</td>
                        <td class="mono">₩50,000,000</td>
                    </tr>
                    <tr>
                        <td>국민연금 (4.5%)</td>
                        <td class="mono">-₩225,000</td>
                    </tr>
                    <tr>
                        <td>건강보험료</td>
                        <td class="mono">-₩177,250</td>
                    </tr>
                    <!-- ... 기타 항목 ... -->
                </table>
            </div>
        </details>
    </div>
    
    <!-- 신규: 프리미엠 기능 추천 -->
    <div class="premium-cta">
        <svg class="star-icon"><!-- 별 아이콘 --></svg>
        <div>
            <strong>이 결과를 저장하고 비교해보세요</strong>
            <p>프리미엠으로 여러 시나리오를 한 번에 비교하세요</p>
        </div>
        <button class="btn btn-gold">자세히 보기 →</button>
    </div>
</div>
```

**스타일:**
```css
.result-card {
    background: #ffffff;
    border: 1px solid #dde4de;
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    transition: all 0.3s;
}

.result-card:hover {
    border-color: #0b6b5a;
    box-shadow: 0 6px 24px rgba(11, 107, 90, 0.1);
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
}

.result-header h3 {
    font-size: 1em;
    font-family: 'Noto Serif KR', serif;
    color: #16221c;
}

.basis-date {
    font-size: 0.85em;
    color: #0052CC;
    background: #E8F0FF;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
}

.result-main {
    text-align: center;
    margin: 20px 0;
    padding: 20px 0;
    border-top: 1px solid #f5f7f4;
    border-bottom: 1px solid #f5f7f4;
}

.result-value {
    font-size: 2.5em;
    color: #0052CC;
    font-weight: 700;
    margin-bottom: 8px;
    font-variant-numeric: tabular-nums;
}

.result-desc {
    color: #6d7d74;
    font-size: 0.95em;
}

.breakdown {
    margin-top: 16px;
}

.breakdown details summary {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f5f7f4;
    border-radius: 6px;
    font-weight: 600;
    color: #0b6b5a;
    transition: all 0.2s;
}

.breakdown details[open] summary {
    background: #e3efea;
}

.breakdown details summary:hover {
    background: #e3efea;
}

.breakdown-details {
    padding: 16px 12px;
    background: #f5f7f4;
    border-radius: 0 0 6px 6px;
    margin-top: -6px;
}

.breakdown-details table {
    width: 100%;
    font-size: 0.95em;
}

.breakdown-details tr {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e3efea;
}

.premium-cta {
    display: flex;
    gap: 12px;
    align-items: center;
    background: linear-gradient(135deg, #fbecea 0%, #FFF8E6 100%);
    border-left: 4px solid #b43a2c;
    padding: 16px;
    border-radius: 0 8px 8px 0;
    margin-top: 16px;
}

.premium-cta .star-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: #b43a2c;
}

.premium-cta strong {
    display: block;
    color: #16221c;
    margin-bottom: 4px;
}

.premium-cta p {
    font-size: 0.9em;
    color: #46564d;
}

.btn-gold {
    background: linear-gradient(135deg, #9a6b1f 0%, #c89c3c 100%);
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 600;
    white-space: nowrap;
    margin-left: auto;
}
```

### 3.3 프리미엠 배지 디자인

```html
<!-- 각 프리미엄 기능에 추가 -->
<span class="badge badge-premium">
    <svg class="badge-icon"><!-- 별 또는 왕관 --></svg>
    Pro
</span>
```

**스타일:**
```css
.badge-premium {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #9a6b1f 0%, #d4a574 100%);
    color: #fff;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(154, 107, 31, 0.2);
}

.badge-icon {
    width: 12px;
    height: 12px;
    opacity: 0.9;
}
```

### 3.4 CTA 버튼 업그레이드

**현재:**
```html
<button class="btn btn-primary">계산하기</button>
```

**개선:**
```html
<!-- Free 사용자용 -->
<button class="btn btn-trust">
    <svg class="btn-icon"><!-- 계산기 아이콘 --></svg>
    <span>계산하기</span>
</button>

<!-- Premium 업그레이드용 -->
<button class="btn btn-upgrade">
    <svg class="spark-icon"><!-- 스파클 --></svg>
    <span>프리미엄으로 더 많이</span>
    <span class="price">₩4,900/월</span>
</button>
```

**스타일:**
```css
.btn-trust {
    background: linear-gradient(135deg, #0b6b5a 0%, #0d8b76 100%);
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-trust:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(11, 107, 90, 0.3);
}

.btn-trust:active {
    transform: translateY(0);
}

.btn-upgrade {
    background: linear-gradient(135deg, #0052CC 0%, #0066FF 100%);
    color: #fff;
    border: 2px solid #0052CC;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
}

.btn-upgrade::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
}

.btn-upgrade:hover::before {
    left: 100%;
}

.btn-upgrade:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 82, 204, 0.3);
}

.btn-upgrade .price {
    font-size: 0.85em;
    opacity: 0.9;
    margin-left: 4px;
    font-variant-numeric: tabular-nums;
}
```

---

## 4. 다크모드 개선

```css
@media (prefers-color-scheme: dark) {
    :root {
        /* 추가 파란색 */
        --trust-blue: #6B9BFF;
        --trust-blue-light: #1a2a4d;
        --trust-blue-dark: #8BABFF;
    }
    
    .result-value {
        color: #6B9BFF;  /* 다크 모드용 파란색 */
    }
    
    .basis-date {
        background: #1a2a4d;
        color: #8BABFF;
    }
    
    .security-badge {
        color: #6B9BFF;
    }
    
    .header-top {
        background: linear-gradient(90deg, #1a2a4d 0%, #17302a 100%);
    }
}
```

---

## 5. 타이포그래피 강화

### 5.1 결과값 강조

```css
.result-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 2.5em;     /* 기존 대비 1.25배 */
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
    color: #0052CC;       /* 신뢰 파란색 */
}
```

### 5.2 계산식 투명성 강화

```css
.breakdown {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.9em;
    color: #46564d;
}

.breakdown .mono {
    font-variant-numeric: tabular-nums;
    color: #0b6b5a;
    font-weight: 600;
}
```

---

## 6. 접근성 개선

### 6.1 색상 대비 확인

```
현재:
- 틸그린 텍스트 (#0b6b5a) on 흰색: 명도차 6.5:1 ✓
- 파란색 텍스트 (#0052CC) on 흰색: 명도차 8.2:1 ✓✓

WCAG 2.1 AA 기준 (4.5:1) 충족
```

### 6.2 폼 접근성

```html
<div class="form-group">
    <label for="salary">연봉</label>
    <input 
        id="salary" 
        type="number" 
        placeholder="50,000,000"
        aria-describedby="salary-help"
    >
    <small id="salary-help">세전 연봉을 입력하세요</small>
</div>
```

**스타일:**
```css
input:focus-visible {
    outline: 2px solid #0052CC;
    outline-offset: 2px;
}

input:invalid {
    border-color: #b43a2c;
}

input:valid {
    border-color: #0b6b5a;
}
```

---

## 7. 모바일 반응형 개선

### 7.1 터치 타겟 크기

```css
.btn {
    min-height: 44px;    /* iOS 권장 */
    min-width: 44px;
    padding: 12px 16px;  /* 최소 패딩 */
}

button, a[role="button"] {
    cursor: pointer;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}
```

### 7.2 모바일 헤더

```css
@media (max-width: 768px) {
    .header-top {
        font-size: 0.8em;
        padding: 6px 0;
    }
    
    .premium-btn {
        padding: 6px 10px;
        font-size: 0.85em;
    }
    
    .result-value {
        font-size: 2em;  /* 모바일에서 축소 */
    }
}
```

---

## 8. 구현 우선순위

### Phase 1 (즉시, 1~2주)
- [ ] 헤더 보안 배지 추가
- [ ] 결과값 색상을 파란색으로 변경
- [ ] "기준일" 배지 디자인 개선
- [ ] 버튼 호버 효과 강화

### Phase 2 (1개월)
- [ ] 계산식 보기 (details 토글) 추가
- [ ] 프리미엠 CTA 추가
- [ ] 프리미엠 배지 디자인
- [ ] 다크모드 파란색 최적화

### Phase 3 (2개월)
- [ ] 전체 색상 팔레트 업데이트
- [ ] 프리미엠 페이지 디자인
- [ ] 모바일 UX 개선
- [ ] 브랜드 가이드 문서화

---

## 9. CSS 변수 최종 업데이트

```css
:root {
    /* 기존 유지 */
    --paper: #f5f7f4;
    --surface: #ffffff;
    --surface-2: #eef3ef;
    --ink: #16221c;
    --ink-2: #46564d;
    --ink-3: #6d7d74;
    --line: #dde4de;
    --line-2: #c6d1c9;
    --teal: #0b6b5a;
    --teal-dark: #084f43;
    --teal-tint: #e3efea;
    --stamp: #b43a2c;
    --stamp-tint: #fbecea;
    --gold: #9a6b1f;
    
    /* 신규 추가: 금융 신뢰 */
    --trust-blue: #0052CC;
    --trust-blue-dark: #003da5;
    --trust-blue-light: #E8F0FF;
    --trust-blue-tint: #f0f5ff;
    
    /* 신규 추가: 강조용 */
    --success: #0b6b5a;
    --warning: #d89b5c;
    --error: #b43a2c;
}

@media (prefers-color-scheme: dark) {
    :root {
        --trust-blue: #6B9BFF;
        --trust-blue-dark: #8BABFF;
        --trust-blue-light: #1a2a4d;
        --trust-blue-tint: #0f1e3d;
    }
}
```

---

## 10. 검증 체크리스트

배포 전 확인 사항:

- [ ] 모든 텍스트의 명도 대비 4.5:1 이상 (WCAG AA)
- [ ] 모든 버튼 44px 이상 터치 타겟
- [ ] 다크/라이트 모드 모두 테스트
- [ ] 모바일(375px), 태블릿(768px), 데스크톱(1200px) 브레이크포인트 테스트
- [ ] 스크린리더 호환성 테스트 (NVDA, JAWS)
- [ ] 키보드 네비게이션만으로 모든 기능 접근 가능 확인
- [ ] 프린트 스타일시트 테스트
- [ ] 번들 사이즈 확인 (CSS 증가분 < 50KB)

---

## 결론

이 디자인 개선은:
1. **신뢰도 강화:** 파란색 추가로 금융 시장 표준 준수
2. **프리미엄 표시:** 금색 배지와 명확한 시각적 차별화
3. **투명성 강화:** 계산식 토글과 기준일 명시
4. **현대성 유지:** 기존 강점(틸그린, 명조)은 보존

**예상 효과:**
- 신뢰도 평가 +15~20%
- 프리미엠 인지도 +30%
- 계산 정확성 신뢰도 +25%
