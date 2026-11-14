/* 八字排盤引擎：節氣、四柱、十神、藏干、十二運、神煞、五行強弱、喜忌、大運、流年 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const { STEMS, BR, mod, dayGZ } = ZW;
  const EL = '木火土金水', RAD = Math.PI / 180;
  const HIDE = ['癸', '己癸辛', '甲丙戊', '乙', '戊乙癸', '丙庚戊', '丁己', '己丁乙', '庚壬戊', '辛', '戊辛丁', '壬甲'];   // 地支藏干（本氣在前）
  const TEN = [['比肩', '劫財'], ['食神', '傷官'], ['偏財', '正財'], ['七殺', '正官'], ['偏印', '正印']];
  const STAGE = ['長生', '沐浴', '冠帶', '臨官', '帝旺', '衰', '病', '死', '墓', '絕', '胎', '養'];
  const SHA12 = ['劫煞', '災煞', '天煞', '地煞', '年煞', '月煞', '亡身煞', '將星煞', '攀鞍煞', '驛馬煞', '六害煞', '華蓋煞'];
  const elemOf = s => Math.floor(s / 2), brElem = b => elemOf(STEMS.indexOf(HIDE[b][0]));

  /* 太陽視黃經（度） */
  function sunLon(ms) {
    const T = (ms / 864e5 + 2440587.5 - 2451545) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T, M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    return mod(L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD), 360);
  }
  /* 自 ms 起往後（dir=1）或往前（-1）最近的「節」的時刻 */
  function termTime(ms, dir) {
    const k = Math.floor(mod(sunLon(ms) - 315, 360) / 30), target = mod(315 + 30 * (k + (dir > 0 ? 1 : 0)), 360);
    let t = ms + dir * mod(dir * (target - sunLon(ms)), 360) / 0.98565 * 864e5;
    for (let i = 0; i < 4; i++) t += ((target - sunLon(t) + 540) % 360 - 180) / 0.98565 * 864e5;
    return t;
  }
  const tenGod = (ds, s) => TEN[mod(elemOf(s) - elemOf(ds), 5)][(s % 2 === ds % 2) ? 0 : 1];
  const stage = (ds, b) => { const st = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3][ds]; return STAGE[mod(ds % 2 ? st - b : b - st, 12)]; };
  const sha12 = (base, b) => SHA12[mod(b - ([8, 2, 5, 11][[8, 0, 4].includes(base) ? 0 : [2, 6, 10].includes(base) ? 1 : [5, 9, 1].includes(base) ? 2 : 3] - 3), 12)];
  const pillar = (s, b, ds, yb) => ({ s, b, gz: STEMS[s] + BR[b], ten: ds === undefined ? '' : tenGod(ds, s), hide: HIDE[b].split('').map(h => STEMS.indexOf(h)),
    tenB: ds === undefined ? '' : tenGod(ds, STEMS.indexOf(HIDE[b][0])), stage: ds === undefined ? '' : stage(ds, b), sha: yb === undefined ? '' : sha12(yb, b) });

  /* o: {y,m,d,hh,mm,tz} 為鐘錶時間；rt 為 ZW.resolveTime 的結果（真太陽時定日與時辰） */
  function buildBazi(o, rt, gender) {
    const ms = Date.UTC(o.y, o.m - 1, o.d, o.hh, o.mm) - o.tz * 36e5, lon = sunLon(ms), mi = Math.floor(mod(lon - 315, 360) / 30);
    const by = o.y - (mi >= 10 && o.m <= 2 ? 1 : 0), ys = mod(by - 4, 10), yb = mod(by - 4, 12);
    const g = dayGZ(rt.y, rt.m, rt.d), ds = g.s, db = g.b;
    const P = { year: pillar(ys, yb, ds, yb), month: pillar(mod((ys % 5) * 2 + 2 + mi, 10), mod(2 + mi, 12), ds, yb), day: pillar(ds, db, ds, yb), hour: pillar(mod((ds % 5) * 2 + rt.h, 10), rt.h, ds, yb) };
    P.day.ten = '日主';
    const list = [P.year, P.month, P.day, P.hour], me = elemOf(ds);
    // 五行力量：天干 1，地支依藏干分配，月令加重
    const w = [0, 0, 0, 0, 0], add = (e, v) => { w[e] += v; };
    [[P.year, 1, 1], [P.month, 1.2, 3], [P.day, 0, 1.5], [P.hour, 1, 1]].forEach(([p, sw, bw]) => {
      add(elemOf(p.s), sw);
      p.hide.forEach((h, i) => add(elemOf(h), bw * (p.hide.length === 1 ? 1 : i === 0 ? 0.7 : 0.3 / (p.hide.length - 1))));
    });
    const total = w.reduce((a, b) => a + b, 0), support = w[me] + w[mod(me + 4, 5)], ratio = support / total;
    const strong = ratio >= 0.42, level = ratio >= 0.52 ? '身強' : ratio >= 0.42 ? '偏強' : ratio > 0.32 ? '偏弱' : '身弱';   // 幫身的五行占五分之二，以四成上下為中線
    const rel = k => mod(me + k, 5);   // 0 比劫 1 食傷 2 財 3 官殺 4 印
    let favor, avoid, primary;
    if (strong) { favor = [rel(1), rel(2), rel(3)]; avoid = [rel(0), rel(4)]; primary = w[rel(0)] >= w[rel(4)] ? rel(3) : rel(2); }
    else { favor = [rel(4), rel(0)]; avoid = [rel(1), rel(2), rel(3)]; primary = w[rel(3)] + w[rel(1)] >= w[rel(2)] ? rel(4) : rel(0); }
    const fav = e => (e === primary ? 1.5 : favor.includes(e) ? 1 : -1);
    const gzFav = (s, b) => fav(elemOf(s)) * 0.4 + fav(brElem(b)) * 0.6;
    // 十神統計（天干＋地支本氣）
    const tens = {}; [P.year.ten, P.month.ten, P.hour.ten, P.year.tenB, P.month.tenB, P.day.tenB, P.hour.tenB].forEach(t => tens[t] = (tens[t] || 0) + 1);
    const grp = k => TEN[k].reduce((n, t) => n + (tens[t] || 0), 0);
    // 神煞
    const brs = list.map(p => p.b), has = b => brs.includes(b), shen = [];
    const noble = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [3, 5], [3, 5]][ds];
    if (noble.some(has)) shen.push('天乙貴人');
    if (has([5, 6, 8, 9, 8, 9, 11, 0, 2, 3][ds])) shen.push('文昌');
    const tr = b => [8, 0, 4].includes(b) ? 0 : [2, 6, 10].includes(b) ? 1 : [5, 9, 1].includes(b) ? 2 : 3;
    const peach = [9, 3, 6, 0][tr(db)], horse = [2, 8, 11, 5][tr(db)], canopy = [4, 10, 1, 7][tr(db)];
    if (brs.some((b, i) => i !== 2 && b === peach) || has([9, 3, 6, 0][tr(yb)])) shen.push('桃花');
    if (brs.some((b, i) => i !== 2 && b === horse)) shen.push('驛馬');
    if (has(canopy)) shen.push('華蓋');
    if (ds % 2 === 0 && has([3, 0, 6, 0, 6, 0, 9, 0, 0, 0][ds])) shen.push('羊刃');
    const xun = mod(db - ds, 12), voidB = [mod(xun + 10, 12), mod(xun + 11, 12)];
    if (brs.some((b, i) => i !== 2 && voidB.includes(b))) shen.push('空亡');
    // 大運
    const dir = ((ys % 2 === 0) === (gender === '男')) ? 1 : -1;
    const startAge = Math.max(1, Math.round(Math.abs(termTime(ms, dir) - ms) / 864e5 / 3));
    const decades = Array.from({ length: 9 }, (_, i) => {
      const s = mod(P.month.s + dir * (i + 1), 10), b = mod(P.month.b + dir * (i + 1), 12), from = startAge + i * 10;
      return { from, to: from + 9, y0: by + from - 1, s, b, gz: STEMS[s] + BR[b], ten: tenGod(ds, s), tenB: tenGod(ds, STEMS.indexOf(HIDE[b][0])), stage: stage(ds, b), score: gzFav(s, b) };
    });
    const yearOf = y => {   // 流年
      const s = mod(y - 4, 10), b = mod(y - 4, 12), age = y - by + 1, dec = decades.find(d => age >= d.from && age <= d.to);
      const score = gzFav(s, b) * 0.6 + (dec ? dec.score * 0.4 : 0);
      const cnt = e => [s, dec && dec.s].filter(x => x !== undefined && x !== null && elemOf(x) === e).length + [b, dec && dec.b].filter(x => x !== undefined && x !== null && brElem(x) === e).length;
      const wealth = score + cnt(rel(2)) * (strong ? 0.6 : (w[me] > 1.5 ? 0.1 : -0.3)) + cnt(rel(1)) * (strong ? 0.3 : 0) + (!strong ? cnt(rel(0)) * (grp(2) ? 0.3 : 0) : 0);
      return { y, s, b, gz: STEMS[s] + BR[b], age, ten: tenGod(ds, s), tenB: tenGod(ds, STEMS.indexOf(HIDE[b][0])), score, wealth, dec };
    };
    return { P, list, ds, db, me, by, ys, yb, w, total, ratio, strong, level, favor, avoid, primary, rel, fav, tens, grp, shen, noble, peach, horse, voidB, dir, startAge, decades, yearOf, gender,
      spouseEl: gender === '男' ? rel(2) : rel(3), spouseTen: gender === '男' ? 2 : 3 };
  }
  Object.assign(ZW, { EL, HIDE, sunLon, termTime, tenGod, buildBazi, elemOf, brElem });
})();
