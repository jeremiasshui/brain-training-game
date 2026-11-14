/* 紫微斗數排盤引擎：真太陽時、農曆換算、安命身、五行局、主星、輔星雜曜、四化、大限、小限、流年月日時 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const STEMS = '甲乙丙丁戊己庚辛壬癸', BR = '子丑寅卯辰巳午未申酉戌亥', ZODIAC = '鼠牛虎兔龍蛇馬羊猴雞狗豬';
  const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];
  const MAIN_NAMES = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'];
  const NAYIN = '金火木土金火水土金木水土火木水';   // 六十甲子納音，兩柱一組
  const JU = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };
  const HUA = {  // 祿 權 科 忌
    甲: ['廉貞', '破軍', '武曲', '太陽'], 乙: ['天機', '天梁', '紫微', '太陰'], 丙: ['天同', '天機', '文昌', '廉貞'],
    丁: ['太陰', '天同', '天機', '巨門'], 戊: ['貪狼', '太陰', '右弼', '天機'], 己: ['武曲', '貪狼', '天梁', '文曲'],
    庚: ['太陽', '武曲', '太陰', '天同'], 辛: ['巨門', '太陽', '文曲', '文昌'], 壬: ['天梁', '紫微', '左輔', '武曲'],
    癸: ['破軍', '巨門', '太陰', '貪狼']
  };
  const HUA_NAMES = ['祿', '權', '科', '忌'];
  const mod = (n, m) => ((n % m) + m) % m;
  const tri = b => [8, 0, 4].includes(b) ? 0 : [2, 6, 10].includes(b) ? 1 : [5, 9, 1].includes(b) ? 2 : 3; // 申子辰/寅午戌/巳酉丑/亥卯未
  const pad = n => String(n).padStart(2, '0');

  /* ---------- 時間 ---------- */
  let fmt;
  function toLunar(y, m, d) {
    fmt = fmt || new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
    const parts = fmt.formatToParts(new Date(Date.UTC(y, m - 1, d)));
    const get = t => (parts.find(p => p.type === t) || {}).value || '';
    const mRaw = get('month');
    const L = { year: parseInt(get('relatedYear') || get('year'), 10), month: parseInt(mRaw, 10), leap: /bis|閏/.test(mRaw), day: parseInt(get('day'), 10) };
    if (!L.year || !L.month || !L.day) throw new Error('lunar');
    return L;
  }
  /* 均時差（分鐘） */
  function eot(y, m, d) {
    const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5), B = 2 * Math.PI * (n - 81) / 364;
    return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  }
  /* 鐘錶時間 → 真太陽時。off 為校正的分鐘數 */
  function solarOffset(y, m, d, lon, tz) { return (lon - tz * 15) * 4 + eot(y, m, d); }
  function resolveTime(o) {   // o: {y,m,d,hh,mm,lon,tz,solar,lateZi}
    const off = o.solar ? solarOffset(o.y, o.m, o.d, o.lon, o.tz) : 0;
    const t = new Date(Date.UTC(o.y, o.m - 1, o.d, o.hh, o.mm) + Math.round(off) * 60000);
    const H = t.getUTCHours(), M = t.getUTCMinutes(), h = Math.floor((H + 1) / 2) % 12;
    const late = H === 23, day = new Date(t.getTime() + (late && o.lateZi !== 'same' ? 864e5 : 0));
    return { y: day.getUTCFullYear(), m: day.getUTCMonth() + 1, d: day.getUTCDate(), h, off: Math.round(off), late,
      solar: `${t.getUTCFullYear()}/${t.getUTCMonth() + 1}/${t.getUTCDate()} ${pad(H)}:${pad(M)}` };
  }
  /* 某地某日十二時辰對應的鐘錶時間 */
  function hourTable(y, m, d, lon, tz, solar) {
    const off = solar ? Math.round(solarOffset(y, m, d, lon, tz)) : 0;
    const f = min => { const x = mod(min - off, 1440); return pad(Math.floor(x / 60)) + ':' + pad(x % 60); };
    return Array.from({ length: 12 }, (_, i) => ({ h: i, from: f(i * 120 - 60), to: f(i * 120 + 59) }));
  }
  function dayGZ(y, m, d) {
    const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    const jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    const i = mod(jdn + 49, 60); return { s: i % 10, b: i % 12 };
  }
  /* 某農曆年各月的國曆起訖 */
  function lunarMonths(year) {
    const out = [];
    for (let t = Date.UTC(year, 0, 15); t < Date.UTC(year + 1, 1, 25); t += 864e5) {
      const dt = new Date(t), L = toLunar(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      if (L.year !== year) continue;
      const last = out[out.length - 1];
      if (last && last.month === L.month && last.leap === L.leap) last.end = dt; else out.push({ month: L.month, leap: L.leap, start: dt, end: dt });
    }
    return out;
  }

  /* ---------- 本命盤 ---------- */
  function stemStars(s) {
    const lu = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][s];
    return { 祿存: lu, 擎羊: mod(lu + 1, 12), 陀羅: mod(lu - 1, 12), 天魁: [1, 0, 11, 11, 1, 0, 1, 6, 3, 3][s], 天鉞: [7, 8, 9, 9, 7, 8, 7, 2, 5, 5][s] };
  }
  function buildChart(y, m, d, h, gender, opts) {
    opts = opts || {};
    const L = toLunar(y, m, d);
    let month = L.month;
    if (L.leap) { if (opts.leap === 'next' || (opts.leap !== 'this' && L.day > 15)) month = month % 12 + 1; }
    const ys = mod(L.year - 4, 10), yb = mod(L.year - 4, 12), mi = month - 1;
    const ming = mod(2 + mi - h, 12), shen = mod(2 + mi + h, 12);
    const yinStem = mod((ys % 5) * 2 + 2, 10);                                 // 五虎遁
    const stemOf = b => mod(yinStem + mod(b - 2, 12), 10);
    let idx = 0; while (idx % 10 !== stemOf(ming) || idx % 12 !== ming) idx++;
    const element = NAYIN[(idx >> 1) % 15], ju = JU[element];

    const pos = {};
    const q = Math.ceil(L.day / ju), r = q * ju - L.day;
    const zi = mod(2 + (q - 1) + (r % 2 ? -r : r), 12), fu = mod(4 - zi, 12);
    [['紫微', 0], ['天機', -1], ['太陽', -3], ['武曲', -4], ['天同', -5], ['廉貞', -8]].forEach(([n, o]) => pos[n] = mod(zi + o, 12));
    [['天府', 0], ['太陰', 1], ['貪狼', 2], ['巨門', 3], ['天相', 4], ['天梁', 5], ['七殺', 6], ['破軍', 10]].forEach(([n, o]) => pos[n] = mod(fu + o, 12));
    pos.左輔 = mod(4 + mi, 12); pos.右弼 = mod(10 - mi, 12);
    pos.文昌 = mod(10 - h, 12); pos.文曲 = mod(4 + h, 12);
    pos.地劫 = mod(11 + h, 12); pos.地空 = mod(11 - h, 12);
    pos.天刑 = mod(9 + mi, 12); pos.天姚 = mod(1 + mi, 12);
    Object.assign(pos, stemStars(ys));
    const t = tri(yb);
    pos.天馬 = [2, 8, 11, 5][t];
    pos.火星 = mod([2, 1, 3, 9][t] + h, 12); pos.鈴星 = mod([10, 3, 10, 10][t] + h, 12);
    pos.華蓋 = [4, 10, 1, 7][t]; pos.咸池 = [9, 3, 6, 0][t];
    pos.紅鸞 = mod(3 - yb, 12); pos.天喜 = mod(pos.紅鸞 + 6, 12);
    pos.天哭 = mod(6 - yb, 12); pos.天虛 = mod(6 + yb, 12);
    const g = [11, 0, 1].includes(yb) ? 0 : [2, 3, 4].includes(yb) ? 1 : [5, 6, 7].includes(yb) ? 2 : 3;
    pos.孤辰 = [2, 5, 8, 11][g]; pos.寡宿 = [10, 1, 4, 7][g];

    const hua = {}, huaOf = {};
    HUA[STEMS[ys]].forEach((s, i) => { hua[HUA_NAMES[i]] = s; huaOf[s] = HUA_NAMES[i]; });
    const yang = ys % 2 === 0, dir = (yang === (gender === '男')) ? 1 : -1;
    const cells = Array.from({ length: 12 }, (_, i) => ({
      i, branch: BR[i], stem: STEMS[stemOf(i)], p: mod(ming - i, 12), palace: PALACES[mod(ming - i, 12)],
      main: [], minor: [], isMing: i === ming, isShen: i === shen
    }));
    MAIN_NAMES.forEach(n => cells[pos[n]].main.push({ name: n, bright: ZW.BRIGHT ? ZW.BRIGHT[n][pos[n]] : '', hua: huaOf[n] || '' }));
    Object.keys(pos).filter(n => !MAIN_NAMES.includes(n)).forEach(n => cells[pos[n]].minor.push({ name: n, hua: huaOf[n] || '' }));
    const decades = [];
    for (let k = 0; k < 12; k++) {
      const b = mod(ming + dir * k, 12), from = ju + 10 * k;
      cells[b].decade = [from, from + 9]; decades.push({ k, b, from, to: from + 9 });
    }
    const MINGZHU = ['貪狼', '巨門', '祿存', '文曲', '廉貞', '武曲', '破軍', '武曲', '廉貞', '文曲', '祿存', '巨門'];
    const SHENZHU = ['火星', '天相', '天梁', '天同', '文昌', '天機', '火星', '天相', '天梁', '天同', '文昌', '天機'];
    return {
      lunar: L, month, hour: h, ys, yb, yearGZ: STEMS[ys] + BR[yb], zodiac: ZODIAC[yb], ming, shen, element, ju, gender, dir, yang,
      cells, pos, hua, huaOf, decades, mingZhu: MINGZHU[ming], shenZhu: SHENZHU[yb],
      byPalace: p => cells[mod(ming - p, 12)]
    };
  }

  /* ---------- 吉煞統計與評分 ---------- */
  const typeOf = n => (ZW.MINOR[n] || {}).t;
  function sanfang(chart, b) {
    const ids = [b, mod(b + 6, 12), mod(b + 4, 12), mod(b + 8, 12)], ji = [], sha = [], hua = [];
    ids.forEach(i => {
      const c = chart.cells[i];
      c.minor.forEach(s => { if (typeOf(s.name) === '吉') ji.push(s.name); if (typeOf(s.name) === '煞') sha.push(s.name); });
      [...c.main, ...c.minor].forEach(s => { if (s.hua) hua.push(s.name + '化' + s.hua); });
    });
    const score = ji.length + hua.filter(x => !x.endsWith('忌')).length - sha.length - hua.filter(x => x.endsWith('忌')).length * 1.5;
    return { ids, ji, sha, hua, score };
  }
  /* 以 b 為命宮、stem 引動四化的時段評分 */
  function rate(chart, b, stem) {
    let s = sanfang(chart, b).score * 0.5;
    HUA[STEMS[stem]].forEach((star, i) => {
      const rel = mod(chart.pos[star] - b, 12), sf = [0, 4, 6, 8].includes(rel);
      if (i === 0) s += rel === 0 ? 3 : sf ? 2 : 0;
      else if (i < 3) s += sf ? 1 : 0;
      else s -= rel === 0 || rel === 6 ? 3 : sf ? 1.5 : 0;
    });
    return { score: s, level: s >= 3.5 ? '吉' : s <= -1 ? '慎' : '平' };
  }

  /* ---------- 流運 ---------- */
  function flowStars(s, b) {
    const o = stemStars(s), luan = mod(3 - b, 12);
    return { 流祿: o.祿存, 流羊: o.擎羊, 流陀: o.陀羅, 流魁: o.天魁, 流鉞: o.天鉞,
      流昌: [5, 6, 8, 9, 8, 9, 11, 0, 2, 3][s], 流曲: [9, 8, 6, 5, 6, 5, 3, 2, 0, 11][s],
      流馬: [2, 8, 11, 5][tri(b)], 流鸞: luan, 流喜: mod(luan + 6, 12) };
  }
  function yearInfo(chart, ly) {            // ly：農曆年
    const s = mod(ly - 4, 10), b = mod(ly - 4, 12), age = ly - chart.lunar.year + 1;
    const xiao = mod([10, 4, 7, 1][tri(chart.yb)] + (chart.gender === '男' ? 1 : -1) * (age - 1), 12);
    const dou = mod(b - (chart.month - 1) + chart.hour, 12);                 // 流年斗君＝正月
    return { ly, s, b, age, xiao, dou, stars: flowStars(s, b), decade: chart.decades.find(d => age >= d.from && age <= d.to) };
  }
  const monthInfo = (yi, lm) => ({ lm, b: mod(yi.dou + lm - 1, 12), s: mod((yi.s % 5) * 2 + 2 + lm - 1, 10) });
  function flow(chart, y, m, d, h) {
    const L = toLunar(y, m, d), yi = yearInfo(chart, L.year), mi = monthInfo(yi, L.month), gz = dayGZ(y, m, d);
    const day = { ld: L.day, b: mod(mi.b + L.day - 1, 12), s: gz.s, gzb: gz.b };
    const out = { lunar: L, year: yi, month: mi, day };
    if (h !== undefined) out.hour = { h, b: mod(day.b + h, 12), s: mod((gz.s % 5) * 2 + h, 10) };
    return out;
  }

  Object.assign(ZW, { STEMS, BR, ZODIAC, PALACES, MAIN_NAMES, HUA, HUA_NAMES, mod, pad, toLunar, eot, solarOffset, resolveTime, hourTable, dayGZ,
    lunarMonths, buildChart, sanfang, rate, flowStars, yearInfo, monthInfo, flow, typeOf });
})();
