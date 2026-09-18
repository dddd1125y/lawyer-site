/* =========================================================
   스튜디오 정렬 — 주간 시간표 + 실시간 수업 상태
   ========================================================= */
(function () {
    'use strict';

    /* ---------- 수업 1회 길이(분). 여기만 바꾸면 종료 시각이 전부 따라옵니다 ---------- */
    var DURATION = 50;

    /* ---------- 레벨 ---------- */
    var LEVELS = {
        1: '입문',
        2: '중급',
        3: '상급',
        4: '개인'
    };

    /* ---------- 시간표 (원장님이 고치는 유일한 지점) ----------
       키 0=일 1=월 2=화 3=수 4=목 5=금 6=토
       s: 시작 시각, n: 수업명, lv: 레벨(1~4), t: 강사
    ------------------------------------------------------------ */
    var SCHEDULE = {
        1: [
            { s: '07:00', n: '모닝 매트',   lv: 1, t: '지원' },
            { s: '08:00', n: '리포머',      lv: 2, t: '세영' },
            { s: '10:00', n: '리포머',      lv: 1, t: '지원' },
            { s: '11:00', n: '매트 코어',   lv: 2, t: '세영' },
            { s: '18:30', n: '리포머',      lv: 2, t: '하람' },
            { s: '19:30', n: '리포머',      lv: 3, t: '하람' },
            { s: '20:30', n: '이브닝 매트', lv: 1, t: '지원' }
        ],
        2: [
            { s: '07:00', n: '리포머',        lv: 1, t: '세영' },
            { s: '08:00', n: '매트 코어',     lv: 2, t: '지원' },
            { s: '10:00', n: '리포머',        lv: 2, t: '세영' },
            { s: '11:00', n: '체어 & 바렐',   lv: 2, t: '하람' },
            { s: '14:00', n: '개인레슨',      lv: 4, t: '하람' },
            { s: '18:30', n: '리포머',        lv: 1, t: '지원' },
            { s: '19:30', n: '리포머',        lv: 2, t: '세영' },
            { s: '20:30', n: '매트 릴랙스',   lv: 1, t: '지원' }
        ],
        3: [
            { s: '07:00', n: '모닝 매트',   lv: 1, t: '지원' },
            { s: '08:00', n: '리포머',      lv: 2, t: '세영' },
            { s: '10:00', n: '리포머',      lv: 1, t: '지원' },
            { s: '11:00', n: '매트 코어',   lv: 2, t: '세영' },
            { s: '13:00', n: '개인레슨',    lv: 4, t: '세영' },
            { s: '18:30', n: '리포머',      lv: 2, t: '하람' },
            { s: '19:30', n: '리포머',      lv: 3, t: '하람' },
            { s: '20:30', n: '이브닝 매트', lv: 1, t: '지원' }
        ],
        4: [
            { s: '07:00', n: '리포머',      lv: 1, t: '세영' },
            { s: '08:00', n: '매트 코어',   lv: 2, t: '지원' },
            { s: '10:00', n: '리포머',      lv: 2, t: '세영' },
            { s: '11:00', n: '산전산후',    lv: 1, t: '지원' },
            { s: '18:30', n: '리포머',      lv: 1, t: '지원' },
            { s: '19:30', n: '리포머',      lv: 2, t: '세영' },
            { s: '20:30', n: '매트 릴랙스', lv: 1, t: '지원' }
        ],
        5: [
            { s: '07:00', n: '모닝 매트', lv: 1, t: '지원' },
            { s: '08:00', n: '리포머',    lv: 2, t: '세영' },
            { s: '10:00', n: '리포머',    lv: 1, t: '지원' },
            { s: '11:00', n: '캐딜락',    lv: 2, t: '하람' },
            { s: '18:30', n: '리포머',    lv: 2, t: '하람' },
            { s: '19:30', n: '리포머',    lv: 3, t: '하람' }
        ],
        6: [
            { s: '09:00', n: '리포머',    lv: 1, t: '지원' },
            { s: '10:10', n: '리포머',    lv: 2, t: '세영' },
            { s: '11:20', n: '매트 코어', lv: 2, t: '세영' },
            { s: '12:30', n: '리포머',    lv: 3, t: '하람' },
            { s: '13:40', n: '개인레슨',  lv: 4, t: '하람' }
        ],
        0: []
    };

    var DAY_KO  = ['일', '월', '화', '수', '목', '금', '토'];
    var DAY_EN  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var ORDER   = [1, 2, 3, 4, 5, 6, 0];   // 월요일 시작

    /* ---------- 시간 유틸 ---------- */
    function toMin(hhmm) {
        var p = hhmm.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function fromMin(m) {
        m = ((m % 1440) + 1440) % 1440;
        return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
    }
    function endOf(item) { return toMin(item.s) + DURATION; }

    // 개인레슨은 이름에 이미 레벨이 들어 있어 레벨명을 덧붙이지 않는다
    function label(item) {
        return item.lv === 4 ? item.n : item.n + ' ' + LEVELS[item.lv];
    }

    /* ---------- 상태 계산 ---------- */
    function classNow(date) {
        var list = SCHEDULE[date.getDay()] || [];
        var mins = date.getHours() * 60 + date.getMinutes();
        for (var i = 0; i < list.length; i++) {
            if (mins >= toMin(list[i].s) && mins < endOf(list[i])) {
                return { item: list[i], endsAt: endOf(list[i]) };
            }
        }
        return null;
    }

    function classNext(date) {
        var mins = date.getHours() * 60 + date.getMinutes();

        for (var offset = 0; offset < 8; offset++) {
            var day = (date.getDay() + offset) % 7;
            var list = SCHEDULE[day] || [];
            for (var i = 0; i < list.length; i++) {
                var start = toMin(list[i].s);
                if (offset === 0 && start <= mins) continue;
                return {
                    item: list[i],
                    day: day,
                    offset: offset,
                    inMin: start - mins + offset * 1440
                };
            }
        }
        return null;
    }

    function whenWord(offset, day) {
        if (offset === 0) return '오늘';
        if (offset === 1) return '내일';
        return DAY_KO[day] + '요일';
    }

    function statusText(date) {
        var now = classNow(date);
        if (now) {
            return {
                mode: 'live',
                text: '지금 「' + label(now.item) + '」 수업 중 · '
                    + fromMin(now.endsAt) + '에 끝납니다'
            };
        }

        var next = classNext(date);
        if (!next) return { mode: 'off', text: '예정된 수업이 없습니다' };

        var head;
        if (next.offset === 0) {
            head = next.inMin <= 60
                ? '다음 수업까지 ' + next.inMin + '분'
                : '오늘 다음 수업 ' + next.item.s;
        } else if (SCHEDULE[date.getDay()].length === 0) {
            head = '오늘은 휴무입니다';
        } else {
            head = '오늘 수업이 모두 끝났습니다';
        }

        return {
            mode: next.offset === 0 && next.inMin <= 60 ? 'soon' : 'off',
            text: head + ' · ' + whenWord(next.offset, next.day) + ' '
                + next.item.s + ' ' + label(next.item)
        };
    }

    /* ---------- 시간표 렌더링 ---------- */
    var gridEl  = document.getElementById('grid');
    var daysEl  = document.getElementById('days');
    var slotEls = [];

    function buildGrid() {
        if (!gridEl) return;
        gridEl.innerHTML = '';
        slotEls = [];

        ORDER.forEach(function (day) {
            var col = document.createElement('div');
            col.className = 'col';
            col.setAttribute('data-day', String(day));

            var head = document.createElement('div');
            head.className = 'col-head';
            head.innerHTML = '<span class="d">' + DAY_KO[day] + '</span>'
                           + '<span class="t">' + DAY_EN[day] + '</span>';
            col.appendChild(head);

            var body = document.createElement('div');
            body.className = 'col-body';

            var list = SCHEDULE[day] || [];
            if (!list.length) {
                var off = document.createElement('p');
                off.className = 'col-empty';
                off.textContent = '휴무';
                body.appendChild(off);
            } else {
                list.forEach(function (item) {
                    var slot = document.createElement('div');
                    slot.className = 'slot';
                    slot.setAttribute('data-level', String(item.lv));
                    slot.setAttribute('data-day', String(day));
                    slot.setAttribute('data-start', item.s);

                    var hm = document.createElement('span');
                    hm.className = 'hm';
                    hm.textContent = item.s + '–' + fromMin(endOf(item));

                    var nm = document.createElement('span');
                    nm.className = 'nm';
                    nm.textContent = label(item);

                    var mt = document.createElement('span');
                    mt.className = 'mt';
                    mt.textContent = item.t + ' 강사';

                    var live = document.createElement('span');
                    live.className = 'live';
                    live.textContent = 'NOW';

                    slot.appendChild(hm);
                    slot.appendChild(nm);
                    slot.appendChild(mt);
                    slot.appendChild(live);
                    body.appendChild(slot);
                    slotEls.push(slot);
                });

                var none = document.createElement('p');
                none.className = 'col-empty';
                none.textContent = '해당 레벨 없음';
                none.hidden = true;
                body.appendChild(none);
            }

            col.appendChild(body);
            gridEl.appendChild(col);
        });
    }

    function buildDayButtons() {
        if (!daysEl) return;
        daysEl.innerHTML = '';
        ORDER.forEach(function (day) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'day-btn';
            b.setAttribute('data-day', String(day));
            b.setAttribute('aria-pressed', 'false');
            b.innerHTML = DAY_KO[day] + '<i>' + DAY_EN[day] + '</i>';
            b.addEventListener('click', function () { showDay(day); });
            daysEl.appendChild(b);
        });
    }

    /* ---------- 요일 선택 (모바일) ---------- */
    function showDay(day) {
        var cols = gridEl ? gridEl.querySelectorAll('.col') : [];
        Array.prototype.forEach.call(cols, function (col) {
            col.classList.toggle('is-shown', col.getAttribute('data-day') === String(day));
        });
        if (daysEl) {
            Array.prototype.forEach.call(daysEl.querySelectorAll('.day-btn'), function (b) {
                b.setAttribute('aria-pressed', b.getAttribute('data-day') === String(day) ? 'true' : 'false');
            });
        }
    }

    /* ---------- 레벨 필터 ---------- */
    var activeLevel = 'all';

    function applyFilter() {
        slotEls.forEach(function (slot) {
            var on = activeLevel === 'all' || slot.getAttribute('data-level') === activeLevel;
            slot.hidden = !on;
        });

        // 필터 결과가 비어 버린 요일에는 안내 문구를 띄운다 (휴무일은 그대로 둔다)
        var cols = gridEl ? gridEl.querySelectorAll('.col') : [];
        Array.prototype.forEach.call(cols, function (col) {
            if (!(SCHEDULE[col.getAttribute('data-day')] || []).length) return;
            var msg = col.querySelector('.col-body > .col-empty');
            if (msg) msg.hidden = col.querySelectorAll('.slot:not([hidden])').length > 0;
        });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
        chip.addEventListener('click', function () {
            activeLevel = chip.getAttribute('data-level');
            Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
                c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
            });
            applyFilter();
        });
    });

    /* ---------- 실시간 표시 ---------- */
    function paint() {
        var date = new Date();
        var today = date.getDay();

        // 히어로 상태
        var box  = document.getElementById('status');
        var text = document.getElementById('statusText');
        if (box && text) {
            var s = statusText(date);
            text.textContent = s.text;
            box.classList.toggle('is-live', s.mode === 'live');
            box.classList.toggle('is-soon', s.mode === 'soon');
        }

        // 시간표 상단 기준 시각
        var nowEl = document.getElementById('boardNow');
        if (nowEl) {
            nowEl.innerHTML = '기준 <b>' + date.getFullYear() + '.' + pad(date.getMonth() + 1)
                + '.' + pad(date.getDate()) + ' (' + DAY_KO[today] + ') '
                + pad(date.getHours()) + ':' + pad(date.getMinutes()) + '</b>';
        }

        // 오늘 열 강조
        var cols = gridEl ? gridEl.querySelectorAll('.col') : [];
        Array.prototype.forEach.call(cols, function (col) {
            col.classList.toggle('is-today', col.getAttribute('data-day') === String(today));
        });

        // 진행 중인 수업
        var live = classNow(date);
        slotEls.forEach(function (slot) {
            var on = !!live
                && slot.getAttribute('data-day') === String(today)
                && slot.getAttribute('data-start') === live.item.s;
            slot.classList.toggle('is-now', on);
        });

        // 운영시간표에서 오늘 줄 강조
        var rowKey = today === 0 ? 'sun' : (today === 6 ? 'sat' : 'weekday');
        Array.prototype.forEach.call(document.querySelectorAll('.hours-table tr'), function (tr) {
            tr.classList.toggle('is-today', tr.getAttribute('data-day') === rowKey);
        });
    }

    /* ---------- 시작 ---------- */
    buildGrid();
    buildDayButtons();
    showDay(new Date().getDay());
    applyFilter();
    paint();
    setInterval(paint, 60 * 1000);
})();
