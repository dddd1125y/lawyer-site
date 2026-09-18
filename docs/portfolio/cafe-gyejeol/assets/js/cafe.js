/* =========================================================
   카페 계절 — 계절 메뉴 전환 + 실시간 영업 상태
   ========================================================= */
(function () {
    'use strict';

    /* ---------- 메뉴 데이터 (사장님이 고치는 유일한 지점) ---------- */
    var SEASONS = {
        spring: {
            ko: '봄', period: '3–5월', months: [3, 4, 5],
            items: [
                { name: '벚꽃 라떼', price: 6000, desc: '벚꽃 시럽을 직접 담가 우유와 섞습니다. 3월 마지막 주에만 생화를 올립니다.' },
                { name: '딸기 크림 라떼', price: 6500, desc: '논산 설향 딸기를 그날 아침에 으깨 넣습니다. 재고가 떨어지면 그날 판매는 종료됩니다.' },
                { name: '쑥 크루아상', price: 4800, desc: '남해에서 올라온 햇쑥을 반죽에 섞어 굽습니다. 하루 스무 개만 만듭니다.' }
            ]
        },
        summer: {
            ko: '여름', period: '6–8월', months: [6, 7, 8],
            items: [
                { name: '자두 에이드', price: 6500, desc: '김천 후무사 자두를 설탕에 절여 두었다가 탄산수에 섞습니다.' },
                { name: '냉침 콜드브루', price: 5500, desc: '찬물에 열여덟 시간 내립니다. 얼음이 녹아도 맛이 흐려지지 않습니다.' },
                { name: '복숭아 아이스티', price: 6000, desc: '황도를 조려 만든 시럽에 홍차를 섞습니다. 시판 제품보다 덜 답니다.' }
            ]
        },
        autumn: {
            ko: '가을', period: '9–11월', months: [9, 10, 11],
            items: [
                { name: '밤 크림 라떼', price: 6500, desc: '공주 알밤을 삶아 체에 내린 크림을 올립니다. 숟가락으로 떠 드세요.' },
                { name: '홍시 에이드', price: 6800, desc: '얼린 홍시를 그대로 갈아 걸쭉합니다. 설탕을 따로 넣지 않습니다.' },
                { name: '무화과 스콘', price: 5200, desc: '생무화과를 반으로 잘라 올려 굽습니다. 오전에 주로 나갑니다.' }
            ]
        },
        winter: {
            ko: '겨울', period: '12–2월', months: [12, 1, 2],
            items: [
                { name: '대추 밀크티', price: 6500, desc: '보은 대추를 세 시간 고아 만든 청에 홍차와 우유를 더합니다.' },
                { name: '생강 라떼', price: 6000, desc: '생강을 직접 갈아 끓여 씁니다. 매운맛이 조금 있습니다.' },
                { name: '군고구마 타르트', price: 5800, desc: '베니하루카 고구마를 구워 으깨 채웁니다. 따뜻하게 데워 드립니다.' }
            ]
        }
    };

    /* ---------- 영업시간 (요일별) ---------- */
    var HOURS = {
        0: { open: 11 * 60, last: 21 * 60 + 30, close: 22 * 60, row: 'sat-sun' }, // 일
        1: null,                                                                  // 월 · 정기 휴무
        2: { open: 11 * 60, last: 20 * 60 + 30, close: 21 * 60, row: 'tue-fri' },
        3: { open: 11 * 60, last: 20 * 60 + 30, close: 21 * 60, row: 'tue-fri' },
        4: { open: 11 * 60, last: 20 * 60 + 30, close: 21 * 60, row: 'tue-fri' },
        5: { open: 11 * 60, last: 20 * 60 + 30, close: 21 * 60, row: 'tue-fri' },
        6: { open: 11 * 60, last: 21 * 60 + 30, close: 22 * 60, row: 'sat-sun' }  // 토
    };

    var DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

    var root = document.documentElement;
    var now = new Date();

    /* ---------- 현재 계절 ---------- */
    function seasonOfMonth(month) {
        for (var key in SEASONS) {
            if (SEASONS[key].months.indexOf(month) !== -1) return key;
        }
        return 'autumn';
    }

    var currentSeason = seasonOfMonth(now.getMonth() + 1);

    /* ---------- 메뉴 렌더링 ---------- */
    var menuEl = document.getElementById('seasonMenu');
    var noteEl = document.getElementById('seasonNote');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));

    function formatWon(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function renderSeason(key) {
        var data = SEASONS[key];
        if (!data || !menuEl) return;

        menuEl.innerHTML = '';
        data.items.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'menu-card';

            var kr = document.createElement('p');
            kr.className = 'kr';
            kr.textContent = item.name;

            var desc = document.createElement('p');
            desc.className = 'desc';
            desc.textContent = item.desc;

            var price = document.createElement('p');
            price.className = 'price';
            price.textContent = formatWon(item.price) + '원';

            var small = document.createElement('small');
            small.textContent = data.period + ' 한정';
            price.appendChild(small);

            li.appendChild(kr);
            li.appendChild(desc);
            li.appendChild(price);
            menuEl.appendChild(li);
        });

        if (noteEl) {
            noteEl.textContent = key === currentSeason
                ? '지금 판매 중인 ' + data.ko + ' 메뉴입니다.'
                : data.ko + ' 메뉴는 ' + data.period + '에 판매합니다. 지금은 ' + SEASONS[currentSeason].ko + ' 메뉴를 드실 수 있어요.';
        }

        root.setAttribute('data-season', key);

        tabs.forEach(function (tab) {
            var on = tab.getAttribute('data-season') === key;
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.setAttribute('tabindex', on ? '0' : '-1');
        });

        var panel = document.getElementById('panel-season');
        if (panel) panel.setAttribute('aria-labelledby', 'tab-' + key);
    }

    tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () {
            renderSeason(tab.getAttribute('data-season'));
        });
        tab.addEventListener('keydown', function (e) {
            var dir = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
            if (!dir) return;
            e.preventDefault();
            var next = tabs[(index + dir + tabs.length) % tabs.length];
            next.focus();
            renderSeason(next.getAttribute('data-season'));
        });
    });

    /* ---------- 히어로 계절 문구 ---------- */
    var seasonWord = document.getElementById('seasonWord');
    if (seasonWord) seasonWord.textContent = SEASONS[currentSeason].ko;

    /* ---------- 실시간 영업 상태 ---------- */
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function hhmm(mins) { return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); }

    function nextOpenDay(fromDay) {
        for (var i = 1; i <= 7; i++) {
            var d = (fromDay + i) % 7;
            if (HOURS[d]) return { day: d, gap: i };
        }
        return null;
    }

    function statusNow(date) {
        var day = date.getDay();
        var mins = date.getHours() * 60 + date.getMinutes();
        var today = HOURS[day];

        if (!today) {
            var nx = nextOpenDay(day);
            return { open: false, text: '오늘은 정기 휴무입니다 · ' + DAY_KO[nx.day] + '요일 ' + hhmm(HOURS[nx.day].open) + ' 오픈' };
        }
        if (mins < today.open) {
            return { open: false, text: '영업 준비 중 · 오늘 ' + hhmm(today.open) + ' 오픈' };
        }
        if (mins >= today.close) {
            var n2 = nextOpenDay(day);
            var when = n2.gap === 1 ? '내일' : DAY_KO[n2.day] + '요일';
            return { open: false, text: '영업 종료 · ' + when + ' ' + hhmm(HOURS[n2.day].open) + ' 오픈' };
        }
        if (mins >= today.last) {
            return { open: true, text: '라스트오더 마감 · ' + hhmm(today.close) + '에 문을 닫습니다' };
        }
        if (today.last - mins <= 30) {
            return { open: true, text: '영업 중 · 라스트오더 ' + hhmm(today.last) + ' (' + (today.last - mins) + '분 남음)' };
        }
        return { open: true, text: '지금 영업 중 · ' + hhmm(today.close) + '까지' };
    }

    function paintStatus() {
        var box = document.getElementById('status');
        var text = document.getElementById('statusText');
        if (!box || !text) return;

        var s = statusNow(new Date());
        text.textContent = s.text;
        box.classList.toggle('is-open', s.open);
        box.classList.toggle('is-closed', !s.open);
    }

    /* ---------- 오늘 요일 강조 ---------- */
    function markToday() {
        var day = new Date().getDay();
        var rowKey = HOURS[day] ? HOURS[day].row : 'mon';
        var row = document.querySelector('.hours tr[data-day="' + rowKey + '"]');
        if (row) row.classList.add('is-today');
    }

    renderSeason(currentSeason);
    paintStatus();
    markToday();
    setInterval(paintStatus, 60 * 1000);
})();
