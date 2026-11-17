/* 跨系統的時間判斷與心事解讀
   一、outlook：紫微流年與八字流年合看，十年內相對排序，全書的「宜進／宜守」都出自這裡
   二、loveYears：紫微與八字各自的緣分引動，合併成同一份年份清單
   三、readConcern／concernNotes：從命主寫下的心事抽出生肖、年齡、地點、年份，逐項對照命盤 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const { mod, BR, STEMS, PALACES, HUA } = ZW;
  const ZOD = '鼠牛虎兔龍蛇馬羊猴雞狗豬', pn = p => PALACES[p] + (p === 0 ? '' : '宮'), join = a => a.join('、');

  /* ---------- 一、十年綜合評估 ---------- */
  ZW.outlook = function (chart, bazi, y0, n) {
    const ys = Array.from({ length: n }, (_, i) => {
      const yi = ZW.yearInfo(chart, y0 + i), r = ZW.rate(chart, yi.b, yi.s), by = bazi ? bazi.yearOf(y0 + i) : null;
      return { y: y0 + i, yi, r, by, tot: r.score + (by ? by.score * 3 : 0) };
    });
    const rk = ys.slice().sort((a, b) => b.tot - a.tot || a.y - b.y), k = Math.max(1, Math.round(n * 0.3));
    ys.forEach(y => { y.rank = rk.indexOf(y); y.tag = y.rank < k ? '宜進' : y.rank >= n - k ? '宜守' : '平'; });
    ys.best = rk[0]; ys.worst = rk[n - 1]; ys.good = ys.filter(y => y.tag === '宜進'); ys.bad = ys.filter(y => y.tag === '宜守');
    return ys;
  };

  /* ---------- 二、緣分年份 ---------- */
  const HE = b => mod(1 - b, 12);
  ZW.loveYears = function (chart, bazi, mateEl, y0, n) {
    const fu = chart.byPalace(2).i, all = [];
    for (let i = 0; i < n; i++) {
      const y = y0 + i, s = mod(y - 4, 10), b = mod(y - 4, 12), zw = [], bz = []; let v = 0;
      if (b === fu) { v += 2; zw.push('流年命宮走到你的夫妻宮'); }
      if (b === chart.pos.紅鸞) { v += 1.5; zw.push('流年命宮走到本命紅鸞'); }
      if (b === chart.pos.天喜) { v += 1.5; zw.push('流年命宮走到本命天喜'); }
      const f = HUA[STEMS[s]];
      if (chart.pos[f[0]] === fu) { v += 1.5; zw.push('流年化祿進夫妻宮'); }
      if (chart.pos[f[3]] === fu) { v += 0.5; zw.push('流年化忌進夫妻宮，緣分會動但帶著拉扯'); }
      const fl = mod(3 - b, 12);
      if (fl === fu) { v += 1; zw.push('流年紅鸞照夫妻宮'); } else if (fl === chart.ming) { v += 1; zw.push('流年紅鸞照命宮'); }
      if (bazi) {
        if (ZW.elemOf(s) === mateEl) { v += 1; bz.push('流年天干帶配偶星'); }
        if (ZW.brElem(b) === mateEl) { v += 1; bz.push('流年地支帶配偶星'); }
        if (b === bazi.peach) { v += 1.5; bz.push('引動桃花'); }
        if (HE(bazi.db) === b) { v += 1.5; bz.push('與日支（配偶宮）六合'); }
        else if ([4, 8].includes(mod(b - bazi.db, 12))) { v += 0.5; bz.push('與日支三合'); }
        if (mod(b - bazi.db, 12) === 6) { v += 0.5; bz.push('沖動配偶宮，感情狀態容易變動'); }
      }
      all.push({ y, gz: STEMS[s] + BR[b], age: y - chart.lunar.year + 1, v: v + (zw.length && bz.length ? 1 : 0), zw, bz, both: !!(zw.length && bz.length) });
    }
    const top = all.slice().sort((a, b) => b.v - a.v || a.y - b.y).slice(0, 3).sort((a, b) => a.y - b.y);
    return { all, top };
  };
  ZW.loveYearText = t => `${t.y} 年（${t.gz}，${t.age} 歲）`;
  ZW.loveYearWhy = t => [t.zw.length ? '紫微：' + join(t.zw) : '', t.bz.length ? '八字：' + join(t.bz) : ''].filter(Boolean).join('；') + (t.both ? '。兩套系統在這一年同時指向緣分。' : '。');

  /* ---------- 三、心事解讀 ---------- */
  const LAT = { 台北: 25.03, 新北: 25.01, 基隆: 25.13, 桃園: 24.99, 新竹: 24.8, 苗栗: 24.56, 台中: 24.15, 彰化: 24.08, 南投: 23.91, 雲林: 23.7, 嘉義: 23.48, 台南: 22.99, 高雄: 22.63, 屏東: 22.67, 宜蘭: 24.75, 花蓮: 23.99, 台東: 22.75, 澎湖: 23.57, 金門: 24.43, 馬祖: 26.16, 香港: 22.32, 澳門: 22.2, 北京: 39.9, 上海: 31.23, 廣州: 23.13, 深圳: 22.54, 成都: 30.66, 新加坡: 1.35, 吉隆坡: 3.14, 東京: 35.68, 首爾: 37.57 };
  const FOREIGN = [['紐西蘭', -41.3, 174.8], ['奧克蘭', -36.85, 174.76], ['澳洲', -33.87, 151.2], ['雪梨', -33.87, 151.2], ['墨爾本', -37.81, 144.96], ['日本', 35.68, 139.7], ['東京', 35.68, 139.7], ['大阪', 34.69, 135.5], ['京都', 35.01, 135.77], ['沖繩', 26.2, 127.7], ['韓國', 37.57, 126.98], ['首爾', 37.57, 126.98], ['釜山', 35.18, 129.08], ['新加坡', 1.35, 103.82], ['馬來西亞', 3.14, 101.69], ['吉隆坡', 3.14, 101.69], ['泰國', 13.75, 100.5], ['曼谷', 13.75, 100.5], ['越南', 21.03, 105.85], ['胡志明', 10.8, 106.7], ['菲律賓', 14.6, 120.98], ['印尼', -6.2, 106.85], ['峇里島', -8.65, 115.2], ['印度', 28.6, 77.2], ['香港', 22.32, 114.17], ['澳門', 22.2, 113.55], ['中國', 39.9, 116.4], ['大陸', 31.23, 121.47], ['北京', 39.9, 116.4], ['上海', 31.23, 121.47], ['美國', 38.9, -77.04], ['紐約', 40.71, -74.0], ['洛杉磯', 34.05, -118.24], ['舊金山', 37.77, -122.42], ['西雅圖', 47.6, -122.33], ['加拿大', 43.65, -79.38], ['溫哥華', 49.28, -123.12], ['多倫多', 43.65, -79.38], ['英國', 51.5, -0.12], ['倫敦', 51.5, -0.12], ['法國', 48.86, 2.35], ['巴黎', 48.86, 2.35], ['德國', 52.52, 13.4], ['荷蘭', 52.37, 4.9], ['瑞士', 46.95, 7.45], ['義大利', 41.9, 12.5], ['西班牙', 40.4, -3.7], ['歐洲', 50.1, 8.7], ['杜拜', 25.2, 55.27]];
  const DIRS = [['北', '坎', 4], ['東北', '艮', 2], ['東', '震', 0], ['東南', '巽', 0], ['南', '離', 1], ['西南', '坤', 2], ['西', '兌', 3], ['西北', '乾', 3]];
  const CNUM = { 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  const cn = s => { if (/^\d+$/.test(s)) return +s; if (!s.includes('十')) return CNUM[s] || 0; const [a, b] = s.split('十'); return (a ? CNUM[a] : 1) * 10 + (b ? CNUM[b] : 0); };

  ZW.readConcern = function (text, now) {
    const t = text || '', out = { zodiac: [], ages: [], places: [], years: [], abroad: false, items: [] };
    for (const m of t.matchAll(/屬(鼠|牛|虎|兔|龍|蛇|馬|羊|猴|雞|狗|豬)/g)) if (!out.zodiac.includes(ZOD.indexOf(m[1]))) { out.zodiac.push(ZOD.indexOf(m[1])); out.items.push('屬' + m[1]); }
    for (const m of t.matchAll(/(\d{1,2}|[一二三四五六七八九十]{1,3})\s*歲/g)) { const a = cn(m[1]); if (a > 0 && a < 100) { out.ages.push(a); out.items.push(a + ' 歲'); } }
    const used = [];
    FOREIGN.forEach(([n, la, lo]) => { if (t.includes(n) && !used.some(u => u.includes(n))) { used.push(n); out.places.push({ name: n, lat: la, lon: lo }); out.items.push(n); } });
    const rel = { 今年: 0, 明年: 1, 後年: 2, 大後年: 3 };
    for (const m of t.matchAll(/大後年|後年|明年|今年/g)) { const y = now + rel[m[0]]; if (!out.years.includes(y)) { out.years.push(y); out.items.push(m[0]); } }
    for (const m of t.matchAll(/(20\d\d)\s*年?/g)) { const y = +m[1]; if (!out.years.includes(y)) { out.years.push(y); out.items.push(y + ' 年'); } }
    for (const m of t.matchAll(/(\d{1,2}|[一二三四五六七八九十]{1,2})\s*年(內|後|之內)/g)) { const y = now + cn(m[1]); if (!out.years.includes(y)) { out.years.push(y); out.items.push(m[0]); } }
    out.abroad = out.places.length > 0 || /出國|國外|海外|移民|留學|外派|遠距離|異國/.test(t);
    if (out.abroad && !out.places.length) out.items.push('海外');
    return out;
  };

  const RELT = { 同: '同類，相處像照鏡子，懂彼此，也容易互不相讓', 六合: '六合，是最容易互相吸引、彼此遷就的組合', 三合: '三合，是想法相近、一起做事很順手的組合', 六沖: '六沖，節奏相反，吸引力強，磨擦也大', 六害: '六害，表面和氣，私下容易有說不出的彆扭', '': '沒有明顯的合或沖，好不好全看相處' };
  const zrel = (a, b) => a === b ? '同' : HE(a) === b ? '六合' : [4, 8].includes(mod(b - a, 12)) ? '三合' : mod(b - a, 12) === 6 ? '六沖' : mod(7 - a, 12) === b ? '六害' : '';
  ZW.zodiacRel = zrel;
  const ROLE = ['像另一個自己', '像手足或並肩的夥伴', '正好落在伴侶的位置', '帶著玩伴與桃花的性質，相處輕鬆，也讓你操心', '和你的錢緊緊連在一起，可能帶來財，也可能讓你為他花錢', '貼身而勞心，日常相處密切、磨合也多', '來自外地，會帶你往外走', '偏向朋友，自在但不一定深', '和你的事業互相牽動', '給你家的感覺', '直接觸動你的內心', '像長輩或老師，照顧你也管你'];
  const AGE_TIP = { 天梁: '你的夫妻宮坐天梁，傳統上配偶年紀較長、或心態老成，會照顧人', 天同: '你的夫妻宮坐天同，傳統上配偶年紀較輕、或個性帶點孩子氣', 天機: '你的夫妻宮坐天機，傳統上兩人年紀有差距、或心思都很細', 天府: '你的夫妻宮坐天府，看重的是穩定與能一起過日子，年紀不是重點', 太陽: '你的夫妻宮坐太陽，傳統上配偶個性外向、有事業心' };
  function bearing(a, b) {   // 恆向線方位：比較符合一般人說的「往東、往南」
    const r = Math.PI / 180, p1 = a.lat * r, p2 = b.lat * r;
    let dl = (b.lon - a.lon) * r; if (dl > Math.PI) dl -= 2 * Math.PI; if (dl < -Math.PI) dl += 2 * Math.PI;
    const dp = Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
    const km = Math.round(Math.acos(Math.min(1, Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos((b.lon - a.lon) * r))) * 6371 / 100) * 100;
    return { deg: (Math.atan2(dl, dp) / r + 360) % 360, km };
  }

  /* c: { now, place, lon, mateEl, orient, gender }；回傳 [{ title, text }] */
  ZW.concernNotes = function (chart, bazi, c, q) {
    const notes = [], EL = ZW.EL, fu = chart.byPalace(2), love = ZW.loveYears(chart, bazi, c.mateEl, c.now, 10), ol = ZW.outlook(chart, bazi, c.now, 10);
    const favTxt = e => !bazi ? '' : e === bazi.primary ? `${EL[e]}正是你八字最需要的五行` : bazi.favor.includes(e) ? `${EL[e]}是你八字的喜用` : `${EL[e]}是你八字的忌神，去那裡要多花力氣適應`;
    q.zodiac.forEach(z => {
      const r1 = zrel(chart.yb, z), r2 = bazi ? zrel(bazi.db, z) : '', cell = chart.cells[z], hs = [...cell.main, ...cell.minor].filter(s => s.hua);
      const sc = [r1, r2].reduce((n, r) => n + (r === '六合' || r === '三合' ? 1 : r === '六沖' || r === '六害' ? -1 : 0), 0);
      const best = bazi ? [...new Set([HE(bazi.db), mod(bazi.db + 4, 12), mod(bazi.db + 8, 12), HE(chart.yb)])].map(x => '屬' + ZOD[x]) : [];
      notes.push({ title: '屬' + ZOD[z], text: `屬${ZOD[z]}的地支是${BR[z]}。和你的生年地支${BR[chart.yb]}是${RELT[r1]}${bazi ? `；和你八字的日支（配偶宮）${BR[bazi.db]}是${RELT[r2]}` : ''}。在你的紫微盤上，${BR[z]}位是${pn(cell.p)}，所以屬${ZOD[z]}的人在你生命中${ROLE[cell.p]}${hs.length ? `，而這一宮坐著${join(hs.map(s => s.name + '化' + s.hua))}，${hs.some(s => s.hua === '忌') ? '關係裡會有放不下的牽掛' : '關係裡帶著好處與善意'}` : ''}。綜合來看，屬${ZOD[z]}對你是${sc > 0 ? '加分的條件' : sc < 0 ? '需要多磨合的條件，不是不行，但不必刻意去找' : '中性的條件，加分減分都不多'}。${best.length ? `如果一定要用生肖來篩，你的命盤上更合的是${join(best.filter(x => x !== '屬' + ZOD[z]))}。` : ''}` });
    });
    const yNow = c.now;
    q.ages.forEach(a => {
      const by = yNow - a, cand = [mod(by - 4, 12), mod(by - 1 - 4, 12)], gap = by - chart.lunar.year;
      let t = `${a} 歲的人大約生於 ${by - 1}–${by} 年，`;
      if (q.zodiac.length) {
        const z = q.zodiac[0], ok = cand.includes(z);
        const Y = yNow - mod(yNow - 4 - z, 12), ages = [0, 12, 24, 36, 48, 60].map(k => yNow - Y + k).filter(x => x >= 18 && x < 70).map(x => x + '');
        t += ok ? `和你寫的屬${ZOD[z]}對得上。` : `那一年出生的人屬${ZOD[cand[1]]}或屬${ZOD[cand[0]]}，和你寫的屬${ZOD[z]}對不上；今年屬${ZOD[z]}的人是 ${join(ages.slice(0, 3))} 歲左右。兩個條件同時要，範圍會窄到幾乎碰不到人。`;
      }
      t += gap > 0 ? `比你小 ${gap} 歲左右。` : gap < 0 ? `比你大 ${-gap} 歲左右。` : '和你差不多年紀。';
      const tip = fu.main.map(s => AGE_TIP[s.name]).find(Boolean) || chart.cells[mod(fu.i + 6, 12)].main.map(s => AGE_TIP[s.name]).find(Boolean);
      if (tip) t += tip + '。' + (gap >= 10 && /天梁|天府/.test(tip) ? '你設定的年齡和命盤顯示的方向正好相反：你想找年輕的，盤上適合你的卻是成熟穩重的人。這個落差值得想一想，你要的是年輕本身，還是年輕帶給你的某種感覺。' : '');
      notes.push({ title: a + ' 歲', text: t });
    });
    if (q.abroad) {
      const mv = chart.byPalace(6), mvs = ZW.sanfang(chart, mv.i).score, eff = ZW.R.effMain(chart, mv);
      const moveYears = ol.filter(y => y.yi.b === mv.i || y.yi.stars.流馬 === chart.ming || y.yi.stars.流馬 === mv.i || (bazi && y.yi.b === bazi.horse)).map(y => y.y);
      const origin = { lat: LAT[c.place] !== undefined ? LAT[c.place] : 24, lon: c.lon };
      const pl = q.places.map(p => {
        const b = bearing(origin, p), d = DIRS[Math.round(b.deg / 45) % 8];
        return b.km < 150 ? '' : `${p.name}在你出生地的${d[0]}方，約 ${b.km.toLocaleString('en-US')} 公里。${d[0]}方在後天八卦屬${d[1]}，五行為${EL[d[2]]}，${favTxt(d[2])}。`;
      }).join('');
      notes.push({ title: q.places.length ? join(q.places.map(p => p.name)) : '海外', text: pl + `紫微看遠方的緣與發展，看的是遷移宮：你的遷移宮是${mv.stem}${mv.branch}宮，${mv.main.length ? '坐' + join(mv.main.map(s => s.name)) : '沒有主星，借對宮' + join(eff.stars)}${mv.minor.length ? '，同宮有' + join(mv.minor.map(s => s.name)) : ''}，三方評估為「${mvs >= 3 ? '條件充足' : mvs >= 0 ? '吉凶參半' : '考驗較多'}」。${chart.pos.天馬 === mv.i ? '天馬就坐在遷移宮，你天生適合往外走。' : `你的天馬在${pn(chart.cells[chart.pos.天馬].p)}。`}${bazi && bazi.shen.includes('驛馬') ? '八字也帶驛馬，離開出生地對你有利。' : ''}往後十年中，流年走到遷移宮或引動驛馬的年份是 ${join(moveYears) || '沒有特別明顯的一年'}；${moveYears.length ? '這幾年出國、遠距離的緣分或移動比較容易成形。' : ''}${fu.main.some(s => s.name === '天梁' || s.name === '天府') ? '另外，遠距離的關係需要大量的信任與耐心，你夫妻宮的星偏重穩定與照顧，最怕的正是見不到面的不確定感。' : ''}` });
    }
    q.years.forEach(y => {
      const e = ol.find(x => x.y === y), lv = love.all.find(x => x.y === y);
      if (!e) { notes.push({ title: y + ' 年', text: `${y} 年超出這份命書推算的十年範圍，請到上方「擇日擇時查詢」查那一年的流年。` }); return; }
      notes.push({ title: y + ' 年', text: `${y} 年（${STEMS[e.yi.s]}${BR[e.yi.b]}，${e.yi.age} 歲），流年命宮走在本命${pn(chart.cells[e.yi.b].p)}，${e.by ? `八字流年是${e.by.ten}、${e.by.tenB}，` : ''}在往後十年中排第 ${e.rank + 1}，評為「${e.tag}」。${ZW.YEAR_PAL[chart.cells[e.yi.b].p].replace(/^今年流年命宮走在本命[^，]+，/, '').replace(/今年/g, '這一年')}${lv && love.top.includes(lv) ? '這一年也是你的緣分年之一。' : ''}` });
    });
    return notes;
  };
})();
