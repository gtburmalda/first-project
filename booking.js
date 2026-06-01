// booking.js — Модал записи + сохранение в Google Sheets
// Подключить в index.html: <script src="booking.js"></script> после auth.js
// booking.js — Модал записи + сохранение в Google Sheets
// Подключить в index.html: <script src="booking.js"></script> после auth.js

(function () {
  'use strict';


  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwlA4PEOzrN44Kj_2l8j8UTKMbYEjmCeqXSklP23ZQcGCZwX2acslxftfKUioDBI1aK/exec';
  /* ───────────────────────────────────────────────────────────────────────── */

  const BOOKINGS_KEY = 'bt_bookings';

  const DAY_SLOTS = ['8:00','9:00','10:00','11:00','12:00','13:00','14:00'];
  const EVE_SLOTS = ['17:30','18:30','19:30','20:30'];

  const MONTHS_RU = [
    'Январь','Февраль','Март','Апрель','Май','Июнь',
    'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
  ];
  const DOW_SHORT = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  const DOW_LONG  = [
    'воскресенье','понедельник','вторник','среда',
    'четверг','пятница','суббота'
  ];
  const MON_GEN = [
    'января','февраля','марта','апреля','мая','июня',
    'июля','августа','сентября','октября','ноября','декабря'
  ];

  let viewYear, viewMonth, selectedDate, selectedTime;

  const todayMidnight = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  const isSat   = (y,m,d) => new Date(y,m,d).getDay() === 6;
  const isPast  = (y,m,d) => new Date(y,m,d) < todayMidnight();
  const isToday = (y,m,d) => {
    const t = new Date();
    return y === t.getFullYear() && m === t.getMonth() && d === t.getDate();
  };
  const daysInMonth  = (y,m) => new Date(y, m+1, 0).getDate();
  const firstWeekday = (y,m) => { const w = new Date(y,m,1).getDay(); return w===0?6:w-1; };
  const formatRu     = dt => `${DOW_LONG[dt.getDay()]}, ${dt.getDate()} ${MON_GEN[dt.getMonth()]}`;
  const dateKey      = dt =>
    `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;

  function nearestAvail(fromDt) {
    const d = new Date(fromDt);
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 365; i++) {
      if (d.getDay() !== 6 && d >= todayMidnight()) return d;
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  /* ─── Сохранение ──────────────────────────────────────────────────────────
     1. Всегда сохраняем в localStorage (мгновенно, без сети)
     2. Отправляем в Google Sheets (асинхронно, не блокирует UI)
  ───────────────────────────────────────────────────────────────────────── */
  function getBookings() {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
  }

  function saveBooking(dt, time) {
    const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser() : null;

    const entry = {
      username:  user || 'Гость',
      date:      dateKey(dt),
      time,
      createdAt: new Date().toISOString()
    };

    // 1. localStorage — мгновенно
    const list = getBookings();
    list.push(entry);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));

    // 2. Google Sheets — асинхронно
    if (SHEET_URL && SHEET_URL !== 'ВСТАВЬТЕ_СЮДА_URL_ИЗ_APPS_SCRIPT') {
      fetch(SHEET_URL, {
        method:  'POST',
        mode:    'no-cors',         // Apps Script требует no-cors
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(entry)
      }).catch(err => console.warn('Sheets: не удалось отправить запись', err));
    }
  }

  /* ─── Стили ───────────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('bk-styles')) return;
    const s = document.createElement('style');
    s.id = 'bk-styles';
    s.textContent = `
#bk-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.96);overflow-y:auto;animation:bkFade .22s ease}
@keyframes bkFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
#bk-modal{width:100%;max-width:440px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;padding-bottom:52px}
.bk-back{background:none;border:none;color:#fff;font-size:15px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:20px 16px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;transition:opacity .15s}
.bk-back:hover{opacity:.7}
.bk-card{background:#131619;border:1px solid #2a2a2a;border-radius:16px;margin:0 12px;padding:22px 18px 18px}
.bk-month-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.bk-month-lbl{font-size:17px;font-weight:700;letter-spacing:.3px}
.bk-arrows{display:flex;gap:4px}
.bk-arrows button{background:none;border:none;color:#666;font-size:26px;line-height:1;padding:0 8px;cursor:pointer;border-radius:6px;transition:color .15s,background .15s;font-family:inherit}
.bk-arrows button:hover{color:#fff;background:#222}
.bk-arrows button:disabled{color:#333;cursor:default}
.bk-wdays{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;margin-bottom:8px}
.bk-wd{font-size:12px;font-weight:700;color:#555;padding:4px 0}
.bk-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.bk-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:15px;font-weight:400;cursor:pointer;color:#fff;position:relative;user-select:none;transition:background .15s,color .15s}
.bk-day.empty,.bk-day.past{pointer-events:none}
.bk-day.past{color:#2e2e2e}
.bk-day.today::after{content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--color-green,#008000)}
.bk-day.selected{background:#fff!important;color:#000!important;font-weight:700}
.bk-day.selected::after{display:none}
.bk-day:not(.past):not(.empty):not(.selected):hover{background:#222}
.bk-slots{margin:22px 12px 0}
.bk-no-time{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px}
.bk-no-icon{width:66px;height:66px;background:#1c1c1e;border:1px solid #2a2a2a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:6px}
.bk-no-time h3{font-size:18px;font-weight:700;text-transform:uppercase;line-height:1.35;letter-spacing:.5px}
.bk-sub{font-size:13px;color:#777;margin:10px 0 2px}
.bk-nearest{font-size:15px;color:#fff;font-weight:500;text-transform:none}
.bk-goto{margin-top:20px;width:100%;padding:16px;border-radius:12px;background:#e74c3c;border:none;color:#fff;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer;transition:opacity .2s}
.bk-goto:hover{opacity:.85}
.bk-section{margin-bottom:22px}
.bk-sec-hdr{display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;cursor:pointer}
.bk-toggle{font-size:13px;color:#666;transition:transform .2s;display:inline-block}
.bk-toggle.closed{transform:rotate(180deg)}
.bk-time-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.bk-t{background:#1c1c1e;border:1px solid #2a2a2a;border-radius:10px;color:#fff;font-size:15px;font-weight:500;font-family:inherit;padding:14px 8px;cursor:pointer;text-align:center;transition:background .15s,border-color .15s}
.bk-t:hover{background:#252525;border-color:#3a3a3a}
.bk-t.sel{background:var(--color-green,#008000)!important;border-color:var(--color-green,#008000)!important;font-weight:700}
.bk-confirm-wrap{margin:8px 12px 0}
.bk-confirm{width:100%;padding:16px;background:var(--color-green,#008000);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:inherit;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:opacity .2s;animation:bkFade .2s ease}
.bk-confirm:hover{opacity:.85}
.bk-success{text-align:center;padding:60px 24px 0;animation:bkFade .3s ease}
.bk-ok-ico{font-size:54px;margin-bottom:20px}
.bk-success h2{font-size:22px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px}
.bk-ok-date{font-size:15px;color:#999;margin:4px 0}
.bk-ok-time{font-size:24px;font-weight:700;color:var(--color-green,#008000);margin-top:12px}

/* Auth prompt */
#bk-auth-prompt{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;animation:bkFade .2s ease}
.bk-ap-box{background:#131619;border:1px solid #2a2a2a;border-radius:16px;padding:36px 28px;width:90%;max-width:360px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:0}
.bk-ap-ico{font-size:44px;margin-bottom:14px}
.bk-ap-title{font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;color:#fff}
.bk-ap-text{font-size:14px;color:#888;line-height:1.6;margin-bottom:24px}
.bk-ap-login{width:100%;padding:14px;background:var(--color-green,#008000);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;font-family:inherit;letter-spacing:1px;text-transform:uppercase;cursor:pointer;margin-bottom:10px;transition:opacity .2s}
.bk-ap-login:hover{opacity:.85}
.bk-ap-reg{width:100%;padding:14px;background:transparent;color:#fff;border:1px solid #3a3a3a;border-radius:10px;font-size:15px;font-weight:700;font-family:inherit;letter-spacing:1px;text-transform:uppercase;cursor:pointer;margin-bottom:14px;transition:border-color .2s,color .2s}
.bk-ap-reg:hover{border-color:#666}
.bk-ap-close{background:none;border:none;color:#555;font-size:13px;font-family:inherit;cursor:pointer;transition:color .15s}
.bk-ap-close:hover{color:#aaa}
    `;
    document.head.appendChild(s);
  }

  /* ─── Календарь ───────────────────────────────────────────────────────── */
  function renderCal() {
    const lbl  = document.getElementById('bk-mlbl');
    const grid = document.getElementById('bk-grid');
    const prev = document.getElementById('bk-prev');
    if (!lbl || !grid) return;

    lbl.textContent = `${MONTHS_RU[viewMonth]} ${viewYear}`;
    grid.innerHTML  = '';

    const today0 = todayMidnight();
    if (prev) prev.disabled = (viewYear === today0.getFullYear() && viewMonth === today0.getMonth());

    const skip  = firstWeekday(viewYear, viewMonth);
    const total = daysInMonth(viewYear, viewMonth);

    for (let i = 0; i < skip; i++) {
      const e = document.createElement('div'); e.className = 'bk-day empty'; grid.appendChild(e);
    }
    for (let d = 1; d <= total; d++) {
      const cell = document.createElement('div');
      cell.className  = 'bk-day';
      cell.textContent = d;
      const past = isPast(viewYear, viewMonth, d);
      if (past) cell.classList.add('past');
      if (isToday(viewYear, viewMonth, d)) cell.classList.add('today');
      if (selectedDate &&
          viewYear  === selectedDate.getFullYear() &&
          viewMonth === selectedDate.getMonth()    &&
          d         === selectedDate.getDate()) cell.classList.add('selected');
      if (!past) {
        const cd = d;
        cell.addEventListener('click', () => onSelectDate(new Date(viewYear, viewMonth, cd)));
      }
      grid.appendChild(cell);
    }
  }

  /* ─── Слоты ───────────────────────────────────────────────────────────── */
  function renderSlots() {
    const area = document.getElementById('bk-slots');
    const cw   = document.getElementById('bk-cw');
    if (!area) return;
    area.innerHTML = ''; selectedTime = null;
    if (cw) cw.style.display = 'none';
    if (!selectedDate) return;

    if (selectedDate.getDay() === 6) {
      const near = nearestAvail(selectedDate);
      const wrap = document.createElement('div');
      wrap.className = 'bk-no-time';
      wrap.innerHTML = `
        <div class="bk-no-icon">📅</div>
        <h3>В этот день нет<br>свободного времени</h3>
        <div class="bk-sub">Ближайшая доступная дата:</div>
        <div class="bk-nearest">${near ? formatRu(near) : '—'}</div>
        ${near ? '<button class="bk-goto">Перейти к ближайшей дате</button>' : ''}
      `;
      if (near) wrap.querySelector('.bk-goto').addEventListener('click', () => onSelectDate(near));
      area.appendChild(wrap);
      return;
    }

    function makeSection(title, slots) {
      const sec = document.createElement('div'); sec.className = 'bk-section';
      const hdr = document.createElement('div'); hdr.className = 'bk-sec-hdr';
      hdr.innerHTML = `<span>${title}</span><span class="bk-toggle">^</span>`;
      const tg = document.createElement('div'); tg.className = 'bk-time-grid';
      slots.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'bk-t'; btn.textContent = t;
        btn.addEventListener('click', () => {
          document.querySelectorAll('#bk-overlay .bk-t').forEach(b => b.classList.remove('sel'));
          btn.classList.add('sel');
          selectedTime = t;
          if (cw) cw.style.display = 'block';
        });
        tg.appendChild(btn);
      });
      hdr.addEventListener('click', () => {
        const tog  = hdr.querySelector('.bk-toggle');
        const open = !tog.classList.contains('closed');
        tog.classList.toggle('closed', open);
        tg.style.display = open ? 'none' : 'grid';
      });
      sec.appendChild(hdr); sec.appendChild(tg); return sec;
    }

    area.appendChild(makeSection('День',  DAY_SLOTS));
    area.appendChild(makeSection('Вечер', EVE_SLOTS));
  }

  function onSelectDate(dt) {
    selectedDate = dt;
    viewYear     = dt.getFullYear();
    viewMonth    = dt.getMonth();
    renderCal();
    renderSlots();
  }

  /* ─── Открыть / закрыть ───────────────────────────────────────────────── */
  function openModal() {
    if (document.getElementById('bk-overlay')) return;

    // Проверка авторизации
    const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser() : null;
    if (!user) {
      showAuthPrompt();
      return;
    }

    const now = new Date();
    viewYear = now.getFullYear(); viewMonth = now.getMonth();
    selectedDate = null; selectedTime = null;

    const ov = document.createElement('div');
    ov.id = 'bk-overlay';
    ov.innerHTML = `
      <div id="bk-modal">
        <button class="bk-back">&#8592; Назад</button>
        <div class="bk-card">
          <div class="bk-month-nav">
            <div id="bk-mlbl" class="bk-month-lbl"></div>
            <div class="bk-arrows">
              <button id="bk-prev">&#8249;</button>
              <button id="bk-next">&#8250;</button>
            </div>
          </div>
          <div class="bk-wdays">${DOW_SHORT.map(d => `<div class="bk-wd">${d}</div>`).join('')}</div>
          <div id="bk-grid" class="bk-grid"></div>
        </div>
        <div id="bk-slots" class="bk-slots"></div>
        <div id="bk-cw" class="bk-confirm-wrap" style="display:none">
          <button class="bk-confirm">Подтвердить запись</button>
        </div>
      </div>
    `;

    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    renderCal();

    ov.querySelector('.bk-back').addEventListener('click', closeModal);

    document.getElementById('bk-prev').addEventListener('click', () => {
      const t = todayMidnight();
      if (viewYear === t.getFullYear() && viewMonth === t.getMonth()) return;
      if (--viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCal();
    });
    document.getElementById('bk-next').addEventListener('click', () => {
      if (++viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCal();
    });

    ov.querySelector('.bk-confirm').addEventListener('click', () => {
      if (!selectedDate || !selectedTime) return;
      saveBooking(selectedDate, selectedTime);

      document.getElementById('bk-modal').innerHTML = `
        <button class="bk-back">&#8592; Назад</button>
        <div class="bk-success">
          <div class="bk-ok-ico">✅</div>
          <h2>Запись подтверждена!</h2>
          <p class="bk-ok-date">${formatRu(selectedDate)}</p>
          <p class="bk-ok-time">${selectedTime}</p>
        </div>
      `;
      document.querySelector('#bk-overlay .bk-back').addEventListener('click', closeModal);
    });
  }

  function closeModal() {
    const ov = document.getElementById('bk-overlay');
    if (ov) ov.remove();
    document.body.style.overflow = '';
  }

  /* ─── Окно «нужно войти» ──────────────────────────────────────────────── */
  function showAuthPrompt() {
    if (document.getElementById('bk-auth-prompt')) return;

    const wrap = document.createElement('div');
    wrap.id = 'bk-auth-prompt';
    wrap.innerHTML = `
      <div class="bk-ap-box">
        <div class="bk-ap-ico">🔒</div>
        <h2 class="bk-ap-title">Войдите в профиль</h2>
        <p class="bk-ap-text">Чтобы записаться, необходимо<br>авторизоваться</p>
        <button class="bk-ap-login" onclick="window.location.href='login.html'">Войти</button>
        <button class="bk-ap-reg"   onclick="window.location.href='registration.html'">Создать профиль</button>
        <button class="bk-ap-close">Отмена</button>
      </div>
    `;
    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';

    wrap.querySelector('.bk-ap-close').addEventListener('click', () => {
      wrap.remove(); document.body.style.overflow = '';
    });
    wrap.addEventListener('click', e => {
      if (e.target === wrap) { wrap.remove(); document.body.style.overflow = ''; }
    });
  }

  /* ─── Инициализация ───────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    document.querySelectorAll('.header-record-button').forEach(btn => {
      btn.addEventListener('click', openModal);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();