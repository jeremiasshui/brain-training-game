/* 介面：表單、存檔、命盤繪製、擇日查詢、合盤 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NUM = '〇一二三四五六', GRID = [5, 6, 7, 8, 4, -1, 9, 3, 10, 2, 1, 0, 11];   // 巳午未申／辰‧酉／卯‧戌／寅丑子亥
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } }
  };
  const placeOpts = ZW.PLACES.map((p, i) => `<option value="${i}">${p[0]}（東經 ${p[1].toFixed(2)}°）</option>`).join('');
  $('place').innerHTML = placeOpts + '<option value="x">其他（自訂經度與時區）</option>';
  $('place').onchange = () => { $('custom').hidden = $('place').value !== 'x'; };

  let profiles = store.get('ziyuan.profiles', []), current = null;
  const pid = p => [p.name, p.gender, p.birth, p.time].join('|');
  const label = p => `${p.name || '未命名'}（${p.birth}）`;

  function readForm() {
    const pl = $('place').value, P = pl === 'x' ? ['自訂地點', +$('lon').value, +$('tz').value] : ZW.PLACES[+pl];
    return { name: $('name').value.trim(), gender: document.querySelector('[name=gender]:checked').value, birth: $('birth').value, time: $('time').value,
      place: pl, placeName: P[0], lon: P[1], tz: P[2], solar: $('solar').checked, lateZi: $('lateZi').value, leap: $('leap').value };
  }
  function fillForm(p) {
    $('name').value = p.name || ''; $('birth').value = p.birth; $('time').value = p.time;
    (p.gender === '男' ? $('gm') : $('gf')).checked = true;
    $('place').value = p.place; $('custom').hidden = p.place !== 'x';
    if (p.place === 'x') { $('lon').value = p.lon; $('tz').value = p.tz; }
    $('solar').checked = p.solar; $('lateZi').value = p.lateZi; $('leap').value = p.leap;
  }
  function compute(p) {
    const [y, m, d] = p.birth.split('-').map(Number), [hh, mm] = p.time.split(':').map(Number);
    const rt = ZW.resolveTime({ y, m, d, hh, mm, lon: p.lon, tz: p.tz, solar: p.solar, lateZi: p.lateZi });
    return { rt, chart: ZW.buildChart(rt.y, rt.m, rt.d, rt.h, p.gender, { leap: p.leap }), y, m, d, hh, mm };
  }
  function drawSaved() {
    $('saved').innerHTML = profiles.map((p, i) => `<span><button type="button" data-load="${i}">${esc(label(p))}</button><button type="button" class="del" data-del="${i}" aria-label="刪除 ${esc(label(p))}">✕</button></span>`).join('');
  }
  $('saved').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.load !== undefined) { fillForm(profiles[+b.dataset.load]); run(profiles[+b.dataset.load]); }
    else if (confirm('刪除這張已儲存的命盤？')) { profiles.splice(+b.dataset.del, 1); store.set('ziyuan.profiles', profiles); drawSaved(); drawPartners(); }
  };
  function drawPartners() {
    const keep = $('partner').value, cur = current && pid(current);
    $('partner').innerHTML = '<option value="">不合盤</option>' + profiles.filter(p => pid(p) !== cur).map(p => `<option value="${esc(pid(p))}">${esc(label(p))}</option>`).join('');
    if ([...$('partner').options].some(o => o.value === keep)) $('partner').value = keep;
  }
  $('partner').onchange = () => current && render(false);

  $('form').addEventListener('submit', e => {
    e.preventDefault();
    const p = readForm(), y = +p.birth.slice(0, 4);
    if (!p.birth) return void ($('err').textContent = '請選擇出生日期');
    if (!p.time) return void ($('err').textContent = '請輸入出生時間');
    if (y < 1920 || y > 2099) return void ($('err').textContent = '請輸入 1920–2099 年之間的日期');
    if (p.place === 'x' && !(Math.abs(p.lon) <= 180 && Math.abs(p.tz) <= 14)) return void ($('err').textContent = '請輸入正確的經度與時區');
    run(p);
  });
  function run(p) {
    try { compute(p); } catch (_) { return void ($('err').textContent = '此瀏覽器無法換算農曆，請改用新版 Chrome 或 Safari'); }
    $('err').textContent = '';
    current = p;
    const i = profiles.findIndex(x => pid(x) === pid(p));
    if (i >= 0) profiles[i] = p; else profiles.push(p);
    store.set('ziyuan.profiles', profiles); store.set('ziyuan.last', pid(p));
    drawSaved(); drawPartners();
    $('qp').innerHTML = `<option value="b">同出生地（${esc(p.placeName)}）</option>` + placeOpts;
    render(true); setNow(); lookup();
  }

  const loc = p => ({ name: p.placeName, lon: p.lon, tz: p.tz, solar: p.solar, lateZi: p.lateZi });
  function render(scroll) {
    const p = current, { rt, chart: c, y, m, d, hh, mm } = compute(p), who = p.name ? esc(p.name) : '';
    $('resTitle').innerHTML = (who ? who + ' 的' : '') + '紫微命盤';
    $('resSub').textContent = `國曆 ${y} 年 ${m} 月 ${d} 日 ${ZW.pad(hh)}:${ZW.pad(mm)}｜${p.placeName}｜${p.gender}`;
    const ju = c.element + NUM[c.ju] + '局';
    $('meta').innerHTML = [['農曆', `${c.yearGZ}年 ${c.lunar.leap ? '閏' : ''}${c.lunar.month}月${c.lunar.day}日 ${ZW.BR[c.hour]}時`], ['真太陽時', p.solar ? rt.solar.split(' ')[1] : '未校正'], ['生肖', c.zodiac], ['五行局', ju],
      ['命宮', ZW.BR[c.ming]], ['身宮', ZW.BR[c.shen]], ['命主', c.mingZhu], ['身主', c.shenZhu],
      ['四化', ZW.HUA_NAMES.map(h => c.hua[h] + h).join(' ')]].map(([k, v]) => `<span class="chip">${k} <b>${v}</b></span>`).join('');
    const hua = s => s.hua ? `<span class="hua h${s.hua}">${s.hua}</span>` : '';
    $('chart').innerHTML = GRID.map(i => {
      if (i < 0) return `<div class="center"><strong>${who || '命主'}</strong><span>${c.yearGZ}年生・屬${c.zodiac}・${c.yang ? '陽' : '陰'}${c.gender}</span><span>${ju}・大限${c.dir > 0 ? '順' : '逆'}行</span><span>命主${c.mingZhu}・身主${c.shenZhu}</span></div>`;
      const x = c.cells[i];
      return `<a class="cell${x.isMing ? ' ming' : ''}" href="#pal${x.p}" aria-label="${x.palace}，${x.main.map(s => s.name).join('、') || '無主星'}">
        ${x.main.map(s => `<div class="ms">${s.name}<small>${s.bright}</small>${hua(s)}</div>`).join('') || '<div class="none">無主星</div>'}
        <div class="mn">${x.minor.map(s => `<span class="t${ZW.MINOR[s.name].t}">${s.name}${hua(s)}</span>`).join('')}</div>
        <span class="dec">${x.decade[0]}–${x.decade[1]}</span>
        <span class="pal">${x.palace}${x.isShen ? '<span class="tag">身</span>' : ''}</span><span class="gz">${x.stem}${x.branch}</span></a>`;
    }).join('');
    const info = `出生時間為鐘錶時間 ${y}/${m}/${d} ${ZW.pad(hh)}:${ZW.pad(mm)}，出生地${esc(p.placeName)}（東經 ${p.lon}°，UTC${p.tz >= 0 ? '+' : ''}${p.tz}）。` +
      (p.solar ? `依經度與當日均時差校正 ${rt.off >= 0 ? '+' : ''}${rt.off} 分鐘，真太陽時為 ${rt.solar}，定為${ZW.BR[rt.h]}時。` : `未做真太陽時校正，直接以鐘錶時間定為${ZW.BR[rt.h]}時。`) +
      (rt.late ? (p.lateZi === 'same' ? '出生於晚子時，依設定算作當日的子時。' : '出生於晚子時，依設定算作隔日的子時，排盤日期順延一天。') : '') +
      (c.lunar.leap ? `出生於農曆閏${c.lunar.month}月，依設定以${c.month}月論命。` : '') +
      (Math.abs(((rt.solar.split(' ')[1].slice(0, 2) * 60 + +rt.solar.slice(-2) + 60) % 120) - 0) < 12 || ((rt.solar.split(' ')[1].slice(0, 2) * 60 + +rt.solar.slice(-2) + 60) % 120) > 108 ? '請注意：這個時間距離時辰交界不到十二分鐘，出生時間只要有些微誤差，時辰就可能不同，建議也排一次相鄰時辰的命盤比較看看哪一張更貼近自己。' : '');
    const now = new Date(), today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const pp = profiles.find(x => pid(x) === $('partner').value), extra = { info };
    if (pp) extra.partner = { name: pp.name || '對方', chart: compute(pp).chart };
    const r = ZW.buildReport(c, who, today, extra);
    $('count').textContent = r.count.toLocaleString('en-US');
    $('toc').innerHTML = r.secs.map(s => `<a href="#${s.id}">${esc(s.title)}</a>`).join('');
    $('report').innerHTML = r.secs.map((s, n) => `<article id="${s.id}"><h3><span>${String(n + 1).padStart(2, '0')}</span>${esc(s.title)}</h3>${s.html}</article>`).join('');
    $('result').style.display = 'block';
    if (scroll) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (pp) $('syn').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setNow() {
    const n = new Date();
    $('qd').value = `${n.getFullYear()}-${ZW.pad(n.getMonth() + 1)}-${ZW.pad(n.getDate())}`; $('qt').value = `${ZW.pad(n.getHours())}:${ZW.pad(n.getMinutes())}`;
  }
  function lookup() {
    if (!current || !$('qd').value || !$('qt').value) return;
    const [y, m, d] = $('qd').value.split('-').map(Number), [hh, mm] = $('qt').value.split(':').map(Number);
    const l = loc(current), v = $('qp').value;
    if (v !== 'b') { const P = ZW.PLACES[+v]; l.name = P[0]; l.lon = P[1]; l.tz = P[2]; }
    try { $('lookOut').innerHTML = ZW.lookup(compute(current).chart, { y, m, d, hh, mm }, l); } catch (_) { $('lookOut').innerHTML = '<p>這個日期超出可換算的範圍。</p>'; }
  }
  $('qgo').onclick = lookup; $('qnow').onclick = () => { setNow(); lookup(); };
  $('qp').onchange = lookup;
  $('print').onclick = () => window.print();

  drawSaved(); drawPartners();
  const last = profiles.find(p => pid(p) === store.get('ziyuan.last', ''));
  if (last) fillForm(last);
})();
