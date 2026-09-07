# 머니레이더 (MoneyRadar)

계산기 허브 + 지원금 아카이브로 만든 정적 웹사이트입니다. 빌드 도구 없이 HTML·CSS·바닐라 JS만 사용하므로, 파일을 그대로 올리면 바로 서비스됩니다.

## 구조

```
moneyradar/
├── index.html              계산기 허브(홈)
├── salary.html             연봉 실수령액 계산기
├── severance.html          퇴직금 계산기
├── unemployment.html       실업급여 계산기
├── insurance.html          4대보험 계산기
├── parental-leave.html     육아휴직급여 계산기
├── benefits.html           지원금 아카이브(검색·필터)
├── guides.html             가이드 목록
├── guide-*.html            SEO 아티클 3편
├── privacy.html            개인정보처리방침 (애드센스 심사 필수)
├── robots.txt / sitemap.xml
├── assets/
│   ├── css/moneyradar.css  전체 디자인 시스템 (다크모드 포함)
│   ├── favicon.svg
│   └── js/
│       ├── calc-core.js    ★ 계산 로직 + 요율 상수 (연 1회 갱신 지점)
│       ├── calc-page.js    계산기 폼 ↔ 결과 렌더링
│       ├── benefits-data.js 지원금 데이터셋
│       ├── benefits.js     검색·필터
│       └── site.js         메뉴·토스트·링크 복사
└── tests/calc.test.js      계산 로직 검증 (50 케이스)
```

## 배포

이 저장소는 `main` 브랜치 푸시 시 GitHub Pages로 전체가 배포됩니다(`.github/workflows/deploy.yml`).
배포 후 주소는 `https://<사용자명>.github.io/<저장소명>/moneyradar/` 입니다.

독립 도메인(예: moneyradar.kr)을 연결하면 `moneyradar/` 폴더 안의 파일을 루트로 옮기고,
`robots.txt`와 `sitemap.xml`의 `https://example.com` 부분을 실제 도메인으로 바꾸세요.

## 테스트

```bash
node moneyradar/tests/calc.test.js      # 계산 로직 50개 케이스
```

## 매년 해야 하는 유지보수 (중요)

세율·요율·지원금 기준은 매년 바뀝니다. **`assets/js/calc-core.js` 상단의 `RATES` 객체 한 곳만** 고치면
모든 계산기에 반영됩니다.

| 시기 | 갱신 항목 | 확인처 |
|---|---|---|
| 매년 1월 | 건강보험·장기요양 요율, 소득세 과세표준 구간 | 국민건강보험공단, 국세청 |
| 매년 1월 | 최저임금 → 실업급여 하한액(`unemployment.dailyFloor`) | 최저임금위원회 |
| 매년 7월 | 국민연금 기준소득월액 상·하한 | 국민연금공단 |
| 수시 | 육아휴직급여 상한액, 실업급여 상한액 | 고용노동부 |

갱신 후에는 `RATES.label`과 `RATES.updated`도 함께 바꾸세요. 이 값이 각 계산기 하단의 "기준일" 문구로 노출됩니다.
지원금 정보는 `assets/js/benefits-data.js`와 `benefits.html`의 기준일 문구를 함께 수정합니다.

## 수익화 연결 지점

1. **애드센스** — `index.html` `<head>`의 주석 처리된 스크립트를 해제하고 게시자 ID를 넣은 뒤,
   각 페이지의 `<div class="ad-slot">` 자리에 광고 단위 코드를 붙여넣습니다.
   심사 전에 가이드 글을 20편 이상 채우면 승인 확률이 올라갑니다.
2. **제휴 링크** — 각 계산기 결과 아래 `<a class="affiliate">` 블록이 제휴 배너 자리입니다.
   결과를 확인한 직후가 전환율이 가장 높은 위치이므로 이 자리를 우선 사용하세요.
3. **결과 링크 공유** — 계산기는 입력값을 URL 쿼리스트링에 저장합니다.
   사용자가 공유한 링크로 들어온 방문자도 같은 결과를 보게 되어 자연 유입에 도움이 됩니다.

## 설계 원칙

- **입력값은 서버로 보내지 않습니다.** 모든 계산은 브라우저에서 처리되며, 이 점을 사이트 곳곳에 명시해 신뢰를 확보합니다.
- **근거를 함께 보여줍니다.** 금액만 보여주는 계산기는 "이거 맞나?"라는 의심에서 이탈이 발생하므로,
  계산식·기준 요율·기준일을 결과 옆에 노출합니다.
- **첫 화면부터 결과가 보입니다.** 기본 예시값이 채워진 상태로 열려, 빈 폼을 마주하지 않습니다.
