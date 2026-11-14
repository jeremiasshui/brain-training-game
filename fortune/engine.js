/* 紫微斗數排盤引擎：農曆換算、安命身、五行局、十四主星、輔星雜曜、四化、大限 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const STEMS = '甲乙丙丁戊己庚辛壬癸', BR = '子丑寅卯辰巳午未申酉戌亥', ZODIAC = '鼠牛虎兔龍蛇馬羊猴雞狗豬';
  const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];
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

  function toLunar(y, m, d) {
    const parts = new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' })
      .formatToParts(new Date(Date.UTC(y, m - 1, d)));
    const get = t => (parts.find(p => p.type === t) || {}).value || '';
    const mRaw = get('month');
    const L = { year: parseInt(get('relatedYear') || get('year'), 10), month: parseInt(mRaw, 10), leap: /bis|閏/.test(mRaw), day: parseInt(get('day'), 10) };
    if (!L.year || !L.month || !L.day) throw new Error('lunar');
    return L;
  }

  function buildChart(y, m, d, h, gender) {
    const L = toLunar(y, m, d);
    let month = L.month; if (L.leap && L.day > 15) month = month % 12 + 1;   // 閏月：上半月歸本月，下半月歸次月
    const ys = mod(L.year - 4, 10), yb = mod(L.year - 4, 12), mi = month - 1;
    const ming = mod(2 + mi - h, 12), shen = mod(2 + mi + h, 12);
    const yinStem = mod((ys % 5) * 2 + 2, 10);                                 // 五虎遁
    const stemOf = b => mod(yinStem + mod(b - 2, 12), 10);
    let idx = 0; while (idx % 10 !== stemOf(ming) || idx % 12 !== ming) idx++;
    const element = NAYIN[(idx >> 1) % 15], ju = JU[element];

    const pos = {};                                                            // 星曜 → 地支
    const q = Math.ceil(L.day / ju), r = q * ju - L.day;
    const zi = mod(2 + (q - 1) + (r % 2 ? -r : r), 12), fu = mod(4 - zi, 12);
    [['紫微', 0], ['天機', -1], ['太陽', -3], ['武曲', -4], ['天同', -5], ['廉貞', -8]].forEach(([n, o]) => pos[n] = mod(zi + o, 12));
    [['天府', 0], ['太陰', 1], ['貪狼', 2], ['巨門', 3], ['天相', 4], ['天梁', 5], ['七殺', 6], ['破軍', 10]].forEach(([n, o]) => pos[n] = mod(fu + o, 12));
    const MAIN_NAMES = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'];

    // 月系、時系
    pos.左輔 = mod(4 + mi, 12); pos.右弼 = mod(10 - mi, 12);
    pos.文昌 = mod(10 - h, 12); pos.文曲 = mod(4 + h, 12);
    pos.地劫 = mod(11 + h, 12); pos.地空 = mod(11 - h, 12);
    pos.天刑 = mod(9 + mi, 12); pos.天姚 = mod(1 + mi, 12);
    // 年干系
    pos.天魁 = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3][ys]; pos.天鉞 = [7, 8, 9, 9, 7, 8, 7, 2, 5, 5][ys];
    pos.祿存 = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][ys]; pos.擎羊 = mod(pos.祿存 + 1, 12); pos.陀羅 = mod(pos.祿存 - 1, 12);
    // 年支系
    const t = tri(yb);
    pos.天馬 = [2, 8, 11, 5][t];
    pos.火星 = mod([2, 1, 3, 9][t] + h, 12); pos.鈴星 = mod([10, 3, 10, 10][t] + h, 12);
    pos.華蓋 = [4, 10, 1, 7][t]; pos.咸池 = [9, 3, 6, 0][t];
    pos.紅鸞 = mod(3 - yb, 12); pos.天喜 = mod(pos.紅鸞 + 6, 12);
    pos.天哭 = mod(6 - yb, 12); pos.天虛 = mod(6 + yb, 12);
    const g = [11, 0, 1].includes(yb) ? 0 : [2, 3, 4].includes(yb) ? 1 : [5, 6, 7].includes(yb) ? 2 : 3;   // 亥子丑/寅卯辰/巳午未/申酉戌
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
      lunar: L, month, ys, yb, yearGZ: STEMS[ys] + BR[yb], zodiac: ZODIAC[yb], ming, shen, element, ju, gender, dir, yang,
      cells, pos, hua, huaOf, decades, mingZhu: MINGZHU[ming], shenZhu: SHENZHU[yb],
      byPalace: p => cells[mod(ming - p, 12)]
    };
  }

  Object.assign(ZW, { STEMS, BR, ZODIAC, PALACES, HUA, HUA_NAMES, mod, toLunar, buildChart });
})();
