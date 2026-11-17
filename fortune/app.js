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

  const rv = n => (document.querySelector(`[name=${n}]:checked`) || {}).value || '';
  const setR = (n, v) => { const e = [...document.querySelectorAll(`[name=${n}]`)].find(x => x.value === v); if (e) e.checked = true; };
  function readForm() {
    const pl = $('place').value, P = pl === 'x' ? ['自訂地點', +$('lon').value, +$('tz').value] : ZW.PLACES[+pl];
    return { name: $('name').value.trim(), gender: document.querySelector('[name=gender]:checked').value, cal: rv('cal'), leapM: $('leapM').checked, guessed, birth: rv('cal') === 'lunar' ? ($('ly').value ? `${$('ly').value}-${ZW.pad($('lm').value)}-${ZW.pad($('ld').value)}` : '') : $('birth').value, time: $('time').value,
      orient: rv('orient'), rel: rv('rel'), job: rv('job'), concern: $('concern').value.trim(), place: pl, placeName: P[0], lon: P[1], tz: P[2], solar: $('solar').checked, lateZi: $('lateZi').value, leap: $('leap').value };
  }
  function fillForm(p) {
    $('name').value = p.name || ''; $('time').value = p.time;
    setR('cal', p.cal || 'solar'); calSwitch(); $('leapM').checked = !!p.leapM;
    if (p.cal === 'lunar') { const [a, b, c] = p.birth.split('-'); $('ly').value = a; $('lm').value = +b; $('ld').value = +c; } else $('birth').value = p.birth;
    (p.gender === '男' ? $('gm') : $('gf')).checked = true;
    $('place').value = p.place; $('custom').hidden = p.place !== 'x';
    if (p.place === 'x') { $('lon').value = p.lon; $('tz').value = p.tz; }
    setR('orient', p.orient); setR('rel', p.rel); setR('job', p.job); $('concern').value = p.concern || '';
    $('solar').checked = p.solar; $('lateZi').value = p.lateZi; $('leap').value = p.leap;
  }
  function compute(p) {
    let [y, m, d] = p.birth.split('-').map(Number); const [hh, mm] = p.time.split(':').map(Number);
    if (p.cal === 'lunar') { const s = lunarToSolar(y, m, d, p.leapM); if (!s) throw new Error('nolunar'); [y, m, d] = s; }
    const rt = ZW.resolveTime({ y, m, d, hh, mm, lon: p.lon, tz: p.tz, solar: p.solar, lateZi: p.lateZi });
    return { rt, chart: ZW.buildChart(rt.y, rt.m, rt.d, rt.h, p.gender, { leap: p.leap }), bazi: ZW.buildBazi({ y, m, d, hh, mm, tz: p.tz }, rt, p.gender), y, m, d, hh, mm };
  }
  function lunarToSolar(y, m, d, leap) {
    const mo = ZW.lunarMonths(y).find(x => x.month === m && x.leap === !!leap);
    if (!mo) return null;
    const dt = new Date(mo.start.getTime() + (d - 1) * 864e5);
    return dt > mo.end ? null : [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  }
  $('lm').innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1} 月</option>`).join('');
  $('ld').innerHTML = Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">${i + 1} 日</option>`).join('');
  function calSwitch() { const l = rv('cal') === 'lunar'; $('lunarBox').hidden = !l; $('solarBox').hidden = l; }
  document.querySelectorAll('[name=cal]').forEach(e => e.onchange = calSwitch);
  const label = p => `${p.name || '未命名'}（${p.cal === 'lunar' ? '農曆 ' : ''}${p.birth}）`;
  function drawSaved() {
    $('saved').innerHTML = profiles.map((p, i) => `<span><button type="button" data-load="${i}">${esc(label(p))}</button><button type="button" class="del" data-del="${i}" aria-label="刪除 ${esc(label(p))}">✕</button></span>`).join('');
  }
  $('saved').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.load !== undefined) { fillForm(profiles[+b.dataset.load]); run(profiles[+b.dataset.load]); }
    else arm(b, '刪除？', () => { profiles.splice(+b.dataset.del, 1); store.set('ziyuan.profiles', profiles); drawSaved(); drawPartners(); });
  };
  function drawPartners() {
    const keep = $('partner').value, cur = current && pid(current);
    $('partner').innerHTML = '<option value="">不合盤</option>' + profiles.filter(p => pid(p) !== cur).map(p => `<option value="${esc(pid(p))}">${esc(label(p))}</option>`).join('');
    if ([...$('partner').options].some(o => o.value === keep)) $('partner').value = keep;
  }
  $('partner').onchange = () => { if (current) { render(false); const e = document.getElementById('syn'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };

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
    try { compute(p); } catch (e) { return void ($('err').textContent = e.message === 'nolunar' ? '查無這個農曆日期，請確認月份大小與是否為閏月' : '此瀏覽器無法換算農曆，請改用新版 Chrome 或 Safari'); }
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
    const p = current, { rt, chart: c, bazi, y, m, d, hh, mm } = compute(p), who = p.name ? esc(p.name) : '';
    $('resTitle').innerHTML = (who ? who + ' 的' : '') + '命盤';
    $('bazi').innerHTML = ZW.baziTable(bazi);
    $('resSub').textContent = `${p.cal === 'lunar' ? '農曆 ' + p.birth + (p.leapM ? '（閏月）' : '') + ' ＝ ' : ''}國曆 ${y} 年 ${m} 月 ${d} 日 ${ZW.pad(hh)}:${ZW.pad(mm)}｜${p.placeName}｜${p.gender}`;
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
      (p.guessed ? '出生時辰不詳，這個時辰是依性格描述選出來的，屬於推測；若讀起來不像自己，請換相鄰的時辰重排比較。' : '') +
      (c.lunar.leap ? `出生於農曆閏${c.lunar.month}月，依設定以${c.month}月論命。` : '') +
      (Math.abs(((rt.solar.split(' ')[1].slice(0, 2) * 60 + +rt.solar.slice(-2) + 60) % 120) - 0) < 12 || ((rt.solar.split(' ')[1].slice(0, 2) * 60 + +rt.solar.slice(-2) + 60) % 120) > 108 ? '請注意：這個時間距離時辰交界不到十二分鐘，出生時間只要有些微誤差，時辰就可能不同，建議也排一次相鄰時辰的命盤比較看看哪一張更貼近自己。' : '');
    const now = new Date(), today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const pp = profiles.find(x => pid(x) === $('partner').value), extra = { info, bazi, ai: store.get('ziyuan.ai.' + pid(p), null), pid: pid(p), ctx: { who: who || '你', place: p.placeName, lon: p.lon, orient: p.orient, rel: p.rel, job: p.job, concern: esc(p.concern || ''), concernRaw: p.concern || '', now: now.getFullYear() } };
    if (pp) extra.partner = { name: pp.name || '對方', chart: compute(pp).chart };
    const r = ZW.buildReport(c, who, today, extra);
    $('count').textContent = r.count.toLocaleString('en-US');
    $('toc').innerHTML = r.secs.map(s => `<a href="#${s.id}">${esc(s.title)}</a>`).join('');
    $('report').innerHTML = r.secs.map((s, n) => `<article id="${s.id}"><h3><span>${String(n + 1).padStart(2, '0')}</span>${esc(s.title)}</h3>${s.html}</article>`).join('');
    lastTheme = { theme: r.theme, facts: ZW.factSheet(c, bazi, extra.ctx, r.theme.k) };
    const done = store.get('ziyuan.todo.' + pid(p), []);
    document.querySelectorAll('.todo input').forEach(x => { x.checked = done.includes(+x.dataset.i); });
    $('aiclear').hidden = !extra.ai;
    $('result').style.display = 'block';
    if (scroll) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });

  }

  let lastTheme = null, busy = false, guessed = false;
  $('report').addEventListener('change', e => {
    if (!e.target.matches('.todo input') || !current) return;
    store.set('ziyuan.todo.' + pid(current), [...document.querySelectorAll('.todo input:checked')].map(x => +x.dataset.i));
  });
  $('akey').value = store.get('ziyuan.key', '');
  let sampleBackend = null;
  ZW.aiSample().then(b => {
    if (!b) return;
    sampleBackend = b; $('akeyRow').hidden = true;
    $('aidesc').textContent = '按下按鈕後，Claude 會依你的命盤與你填的答案，重寫「現狀」與主題章節，內容會針對你的處境。用的是你自己 claude.ai 帳號的額度，第一次會先問你是否允許。全部分成 11 段，每段約一到三分鐘；中途斷掉的話，再按一次會從斷掉的地方接著寫。';
    $('aigo').textContent = '請 Claude 撰寫';
  });
  if (globalThis.claude) $('print').hidden = true;   // 在 claude.ai 裡無法開啟列印視窗
  $('aigo').onclick = async () => {
    if (!current || busy) return;
    let backend = sampleBackend;
    if (!backend) {
      const key = $('akey').value.trim();
      if (!key) return void ($('aistat').textContent = '請先填入 API 金鑰。');
      store.set('ziyuan.key', key); backend = ZW.aiKey(key);
    }
    busy = true; $('aigo').disabled = true;
    const id = pid(current), prev = store.get('ziyuan.ai.' + id, null);
    $('aistat').textContent = (prev ? '從上次中斷的地方接著寫' : '撰寫中') + '，每段約需一到三分鐘，請不要關閉頁面。';
    try {
      await ZW.aiWrite(backend, lastTheme.theme, lastTheme.facts, prev, (out, n, total) => {
        store.set('ziyuan.ai.' + id, out);
        if (current && pid(current) === id) render(false);
        $('aistat').textContent = n < total ? `已完成 ${n}／${total} 段，繼續撰寫中⋯⋯` : `全部 ${total} 段撰寫完成（${backend.label}）。`;
      });
    } catch (e) { $('aistat').textContent = '撰寫中斷：' + e.message + (store.get('ziyuan.ai.' + id, null) ? ' 已完成的段落已保留。' : ''); }
    busy = false; $('aigo').disabled = false;
  };
  const arm = (btn, label, act) => {   // 兩段式確認：claude.ai 裡的頁面不能跳出確認視窗
    if (btn.dataset.armed) { delete btn.dataset.armed; act(); return; }
    const old = btn.textContent; btn.dataset.armed = '1'; btn.textContent = label;
    setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = old; } }, 3000);
  };
  $('aiclear').onclick = () => { if (current) arm($('aiclear'), '再按一次確認刪除 AI 撰寫的內容', () => { try { localStorage.removeItem('ziyuan.ai.' + pid(current)); } catch (_) { } $('aistat').textContent = ''; $('aiclear').textContent = '改回預寫版本'; render(false); }); };

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

  const steps = [...document.querySelectorAll('.step')]; let si = 0;
  function show(i) {
    si = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, k) => s.classList.toggle('on', k === si));
    $('sayline').textContent = steps[si].dataset.say; $('err').textContent = '';
    $('ava').innerHTML = ZW.avatar(['smile', 'calm', 'calm', 'talk', 'think', 'calm', 'smile', 'smile', 'think'][si] || 'calm');
    $('prev').style.visibility = si ? 'visible' : 'hidden';
    $('next').hidden = si === steps.length - 1; $('go').hidden = si !== steps.length - 1;
    $('prog').textContent = `第 ${si + 1} 題，共 ${steps.length} 題`;
  }
  function stepOk() {
    if (steps[si].contains($('birth')) && !readForm().birth) { $('err').textContent = '請填寫出生日期'; return false; }
    const need = steps[si].querySelector('input[required]');
    if (need && !need.value) { $('err').textContent = '請輸入出生時間'; return false; }
    return true;
  }
  $('next').onclick = () => { if (stepOk()) { show(si + 1); const f = steps[si].querySelector('input:not([type=radio]),select,textarea'); if (f) f.focus(); } };
  $('prev').onclick = () => show(si - 1);
  $('form').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && si < steps.length - 1) { e.preventDefault(); $('next').click(); } });
  $('heroAva').innerHTML = ZW.avatar('smile', true);
  $('noTime').onclick = () => {
    const p = readForm(); let y, m, d;
    try { [y, m, d] = p.birth.split('-').map(Number); if (p.cal === 'lunar') [y, m, d] = lunarToSolar(y, m, d, p.leapM); if (!y) throw 0; } catch (_) { return void ($('err').textContent = '請先回上一題填好出生日期'); }
    $('err').textContent = '';
    $('guess').hidden = false;
    $('guess').innerHTML = '<p class="hint" style="margin:0 0 4px">紫微斗數沒有時辰就定不出命宮，所以沒辦法排「缺時辰的盤」。下面是你生日當天十二個時辰各自的命宮主星與性格，選最像你的那一個；之後可以回來換別的時辰比較。</p>' +
      Array.from({ length: 12 }, (_, h) => {
        const c = ZW.buildChart(y, m, d, h, p.gender, { leap: p.leap }), mc = c.cells[c.ming], st = mc.main.length ? mc.main.map(x => x.name) : c.cells[ZW.mod(c.ming + 6, 12)].main.map(x => x.name);
        return `<button type="button" data-h="${h}"><b>${ZW.BR[h]}時</b><i>${mc.main.length ? '' : '借'}${st.join('、')}</i>${st.map(x => ZW.TH.FACE[x][0][0] + '，但' + ZW.TH.FACE[x][0][1]).join('；')}</button>`;
      }).join('');
  };
  $('guess').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    $('time').value = ZW.pad(+b.dataset.h * 2) + ':00'; $('solar').checked = false; guessed = true;
    $('guess').hidden = true; $('err').textContent = `已選${ZW.BR[+b.dataset.h]}時（以 ${$('time').value} 代入，並關閉真太陽時校正）。`;
  };
  $('time').addEventListener('input', () => { guessed = false; });
  show(0);
  drawSaved(); drawPartners();
  const last = profiles.find(p => pid(p) === store.get('ziyuan.last', ''));
  if (last) fillForm(last);
})();
