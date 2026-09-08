/* =========================================================
   머니레이더 — 프로 구독 상태 관리
   로그인 없이 '이용권 키' 하나로 기기 간 이용을 잇는다.
   결제가 끝나면 서버가 발급한 키를 이 기기에 저장하고,
   다른 기기에서는 같은 키를 입력해 복원한다.
   ========================================================= */
(function () {
    'use strict';

    var KEY_LICENSE = 'mr_license';
    var KEY_CACHE = 'mr_license_state';
    var CACHE_TTL = 6 * 60 * 60 * 1000;   /* 6시간마다 서버에 다시 확인 */

    var cfg = window.MR_CONFIG || {};

    function store(k, v) {
        try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); }
        catch (e) { /* 시크릿 모드 등에서 저장이 막혀도 기능은 계속 동작해야 한다 */ }
    }
    function read(k) {
        try { return localStorage.getItem(k); } catch (e) { return null; }
    }

    function readCache() {
        try {
            var raw = read(KEY_CACHE);
            if (!raw) return null;
            var c = JSON.parse(raw);
            return (c && typeof c.checkedAt === 'number') ? c : null;
        } catch (e) { return null; }
    }

    var Pro = {
        getLicense: function () { return read(KEY_LICENSE) || ''; },

        setLicense: function (key) {
            store(KEY_LICENSE, key || null);
            store(KEY_CACHE, null);
        },

        clear: function () {
            store(KEY_LICENSE, null);
            store(KEY_CACHE, null);
            apply(false, null);
        },

        /** 마지막으로 확인된 상태 (네트워크 없이 즉시 판단) */
        state: function () {
            var c = readCache();
            if (!c) return { active: false, expiresAt: null, stale: true };
            var expired = c.expiresAt && Date.parse(c.expiresAt) < Date.now();
            return {
                active: Boolean(c.active) && !expired,
                expiresAt: c.expiresAt || null,
                stale: Date.now() - c.checkedAt > CACHE_TTL
            };
        },

        isActive: function () { return this.state().active; },

        /** 서버에 이용권을 확인한다. 서버가 없으면 조용히 비활성 처리. */
        verify: function () {
            var license = this.getLicense();
            if (!license || !cfg.apiBase) {
                apply(false, null);
                return Promise.resolve({ active: false });
            }

            return fetch(cfg.apiBase.replace(/\/$/, '') + '/api/license/status?key=' +
                         encodeURIComponent(license), { method: 'GET' })
                .then(function (res) { return res.ok ? res.json() : { active: false }; })
                .then(function (data) {
                    store(KEY_CACHE, JSON.stringify({
                        active: Boolean(data.active),
                        expiresAt: data.expiresAt || null,
                        checkedAt: Date.now()
                    }));
                    apply(Boolean(data.active), data.expiresAt || null);
                    return data;
                })
                .catch(function () {
                    /* 서버 장애 시 마지막으로 확인된 상태를 그대로 유지한다 */
                    var s = Pro.state();
                    apply(s.active, s.expiresAt);
                    return { active: s.active, offline: true };
                });
        }
    };

    /** 상태를 화면에 반영한다 */
    function apply(active, expiresAt) {
        document.documentElement.setAttribute('data-pro', active ? 'active' : 'free');

        var btn = document.querySelector('.btn-pro[href="pricing.html"], .btn-pro[href="./pricing.html"]');
        if (btn && active) {
            btn.innerHTML = '<span class="tag">PRO</span><span class="txt">이용 중</span>';
            btn.setAttribute('href', 'account.html');
            btn.setAttribute('title', expiresAt ? (expiresAt.slice(0, 10) + '까지 이용 가능') : '프로 이용 중');
        }

        document.querySelectorAll('[data-pro-only]').forEach(function (n) { n.hidden = !active; });
        document.querySelectorAll('[data-free-only]').forEach(function (n) { n.hidden = active; });
    }

    /* 저장된 상태로 먼저 그리고, 오래됐으면 서버에 다시 확인한다 */
    var s = Pro.state();
    apply(s.active, s.expiresAt);
    if (Pro.getLicense() && (s.stale || !s.active)) Pro.verify();

    window.MRPro = Pro;
})();
