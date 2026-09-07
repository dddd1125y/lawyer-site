/* =========================================================
   머니레이더 — 혜택 아카이브 필터
   ========================================================= */
(function () {
    'use strict';

    var list = document.getElementById('benefitList');
    var countEl = document.getElementById('benefitCount');
    if (!list || !window.MR_BENEFITS) return;

    var data = window.MR_BENEFITS;
    var searchEl = document.getElementById('benefitSearch');
    var categoryEl = document.getElementById('benefitCategory');
    var ageEl = document.getElementById('benefitAge');

    /* 카테고리 옵션을 데이터에서 자동 생성 */
    if (categoryEl) {
        var categories = data.map(function (b) { return b.category; })
            .filter(function (c, i, arr) { return arr.indexOf(c) === i; });
        categories.forEach(function (c) {
            var opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            categoryEl.appendChild(opt);
        });
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function card(b) {
        return '<article class="benefit">' +
            '<div class="body">' +
            '<h3>' + escapeHtml(b.title) + '</h3>' +
            '<div class="meta">' +
            '<span class="pill">' + escapeHtml(b.category) + '</span>' +
            '<span class="pill is-deadline">' + escapeHtml(b.period) + '</span>' +
            '<span class="pill">' + escapeHtml(b.agency) + '</span>' +
            '</div>' +
            '<p>' + escapeHtml(b.summary) + '</p>' +
            '<p style="color:var(--ink-3);font-size:12.5px">지원 조건 · ' + escapeHtml(b.condition) + '</p>' +
            '<a class="link" href="' + encodeURI(b.link) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(b.agency) + '에서 신청하기 →</a>' +
            '</div>' +
            '<div class="amount">' + escapeHtml(b.amount) + '</div>' +
            '</article>';
    }

    function apply() {
        var q = (searchEl && searchEl.value || '').trim().toLowerCase();
        var cat = categoryEl && categoryEl.value || '';
        var age = ageEl && ageEl.value || '';

        var filtered = data.filter(function (b) {
            if (cat && b.category !== cat) return false;
            if (age && b.ages.indexOf(age) === -1) return false;
            if (q) {
                var haystack = (b.title + ' ' + b.summary + ' ' + b.condition + ' ' + b.agency + ' ' + b.category).toLowerCase();
                if (haystack.indexOf(q) === -1) return false;
            }
            return true;
        });

        list.innerHTML = filtered.length
            ? filtered.map(card).join('')
            : '<div class="empty-state">조건에 맞는 혜택이 없습니다. 필터를 바꾸거나 검색어를 지워 보세요.</div>';

        if (countEl) countEl.textContent = filtered.length;
    }

    [searchEl, categoryEl, ageEl].forEach(function (node) {
        if (!node) return;
        node.addEventListener('input', apply);
        node.addEventListener('change', apply);
    });

    /* 홈에서 benefits.html?q=청년 형태로 넘어온 경우 검색어를 채워 준다 */
    var q = new URLSearchParams(location.search).get('q');
    if (q && searchEl) searchEl.value = q;

    apply();
})();
