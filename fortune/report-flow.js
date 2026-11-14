/* 進階章節：格局、雙星、大限疊宮、流年月日時、合盤 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const { mod, BR, STEMS, PALACES, HUA, HUA_NAMES, pad } = ZW;
  const P = s => `<p>${s}</p>`, join = a => a.join('、');
  const palName = p => PALACES[p] + (p === 0 ? '' : '宮');
  const names = c => c.main.map(s => s.name);
  const eff = (chart, c) => c.main.length ? { stars: names(c), borrowed: false } : { stars: names(chart.cells[mod(c.i + 6, 12)]), borrowed: true };
  const tag = l => `<span class="rate r${l}">${l}</span>`;
  const WEEK = '日一二三四五六';

  /* ---------- 格局 ---------- */
  ZW.extraPatterns = function (chart) {
    const { pos, ming, hua } = chart, sf = ZW.sanfang(chart, ming), inSF = n => sf.ids.includes(pos[n]), T = ZW.PATTERN, out = [];
    const bright = n => chart.cells[pos[n]].main.find(s => s.name === n).bright;
    const flank = (a, b) => { const x = [mod(ming + 1, 12), mod(ming - 1, 12)]; return x.includes(pos[a]) && x.includes(pos[b]) && pos[a] !== pos[b]; };
    if (pos.貪狼 === pos.火星 && inSF('貪狼')) out.push(T.火貪);
    if (pos.貪狼 === pos.鈴星 && inSF('貪狼')) out.push(T.鈴貪);
    if (inSF('太陽') && inSF('天梁') && inSF('文昌') && (inSF('祿存') || inSF(hua.祿))) out.push(T.陽梁昌祿);
    if (inSF('太陽') && inSF('太陰')) {
      if ('廟旺'.includes(bright('太陽')) && '廟旺'.includes(bright('太陰'))) out.push(T.日月並明);
      if ('不陷'.includes(bright('太陽')) && '不陷'.includes(bright('太陰'))) out.push(T.日月反背);
    }
    if (pos[hua.忌] === pos.祿存) out.push(T.羊陀夾忌 + `在你的命盤上，這個宮位是${palName(chart.cells[pos.祿存].p)}。`);
    if (flank('地空', '地劫')) out.push(T.空劫夾命);
    if (flank('左輔', '右弼')) out.push(T.左右夾命);
    if (flank('文昌', '文曲')) out.push(T.昌曲夾命);
    if (flank('天魁', '天鉞')) out.push(T.魁鉞夾命);
    if (inSF('祿存') && inSF(hua.祿)) out.push(T.雙祿交流);
    if (inSF(hua.祿) && inSF(hua.權) && inSF(hua.科)) out.push(T.三奇嘉會);
    if (pos.紫微 === ming && inSF('左輔') && inSF('右弼')) out.push(T.君臣慶會);
    if (pos.七殺 === ming && [2, 8].includes(ming)) out.push(T.七殺朝斗);
    if (pos.巨門 === ming && [0, 6].includes(ming)) out.push(T.石中隱玉);
    if (pos.太陰 === ming && ming === 11) out.push(T.月朗天門);
    if (pos.太陽 === ming && ming === 3) out.push(T.日照雷門);
    if (ming === 7 && !chart.cells[7].main.length && pos.太陽 === 3 && pos.太陰 === 11) out.push(T.明珠出海);
    if (pos.擎羊 === ming && ming === 6) out.push(T.馬頭帶箭);
    if (pos.地空 === ming || pos.地劫 === ming) out.push(T.命裡逢空);
    if (inSF('鈴星') && inSF('文昌') && inSF('陀羅') && inSF('武曲')) out.push(T.鈴昌陀武);
    return out.length ? out.map(P).join('') : P('除了上述基本結構之外，你的命盤沒有構成古籍所載的其他特殊格局。這很常見，也不是壞事：沒有特殊格局的命盤，吉凶更直接取決於各宮星曜的組合與大限的走勢，後面的逐宮分析與大限章節會比格局更有參考價值。');
  };
  ZW.pairText = function (chart, c) {
    const src = c.main.length ? c : chart.cells[mod(c.i + 6, 12)];
    if (src.main.length !== 2) return '';
    const t = ZW.PAIR[names(src).join('')];
    return t ? `<h4>雙星組合｜${names(src).join('、')}${c.main.length ? '' : '（借對宮）'}</h4>` + P(t) + P(`以上是這個組合的整體性質；它落在你的${palName(c.p)}，因此這些特質會具體表現在「${ZW.PAL_THEME[c.p]}」這個領域。`) : '';
  };

  /* ---------- 大限疊宮 ---------- */
  ZW.decadeOverlay = function (chart, d) {
    const q = b => mod(d.b - b, 12), s = chart.cells[d.b].stem, fly = HUA[s];
    const map = PALACES.map((n, i) => `大限${n.replace('宮', '')}＝本命${PALACES[chart.cells[mod(d.b - i, 12)].p].replace('宮', '')}`).join('、');
    const at = i => q(chart.pos[fly[i]]);
    let t = `大限疊宮：把這十年的大限命宮當作新的命宮，重新排出十二宮，就能看出這十年各個生活領域是由本命的哪一宮來承擔：${map}。`;
    t += `以大限宮位來看四化：${fly[0]}化祿落入大限${palName(at(0))}，「${ZW.PAL_THEME[at(0)]}」是這十年最有收穫、最值得投入的領域；${fly[1]}化權落入大限${palName(at(1))}、${fly[2]}化科落入大限${palName(at(2))}；${fly[3]}化忌落入大限${palName(at(3))}並沖大限${palName(mod(at(3) + 6, 12))}，因此「${ZW.PAL_THEME[at(3)]}」與「${ZW.PAL_THEME[mod(at(3) + 6, 12)]}」是這十年最需要小心經營的兩個領域。`;
    if (at(3) === 0) t += '大限化忌坐在大限命宮，這十年凡事親力親為、勞心勞力，容易自我設限，宜放寬心、不強求。';
    if (at(3) === 6) t += '大限化忌沖大限命宮，這是變動與壓力較大的十年，外在環境的衝擊直接，重大決定務必保守。';
    if ([0, 4, 8].includes(at(0))) t += '大限化祿落在大限命宮的三合方，這十年在財與事業上有實質的進展機會。';
    if (chart.pos[fly[3]] === chart.pos[chart.hua.忌]) t += `此外，大限化忌與本命化忌同落在本命${palName(chart.cells[chart.pos[fly[3]]].p)}，形成「雙忌」，該領域的課題在這十年會被放大，需要提早準備。`;
    if (chart.pos[fly[0]] === chart.pos[chart.hua.忌]) t += '大限化祿正好落在本命化忌所在的宮位，稱為「祿來解忌」，這十年有機會化解該領域長期以來的困擾。';
    return P(t);
  };

  /* ---------- 時段通用區塊 ---------- */
  function minorShort(c) {
    const ji = c.minor.filter(s => ZW.typeOf(s.name) === '吉').map(s => s.name), sha = c.minor.filter(s => ZW.typeOf(s.name) === '煞').map(s => s.name);
    return (ji.length ? `有${join(ji)}相助。` : '') + (sha.length ? `逢${join(sha)}，多一分波折。` : '');
  }
  function huaLine(chart, b, stem, span) {
    const fly = HUA[STEMS[stem]], c = i => chart.cells[chart.pos[fly[i]]], rel = mod(chart.pos[fly[3]] - b, 12);
    let t = `${STEMS[stem]}干四化：${fly.map((s, i) => `${s}化${HUA_NAMES[i]}入本命${palName(c(i).p)}`).join('、')}。`;
    t += `${span}「${ZW.PAL_THEME[c(0).p]}」方面較有好消息或收穫，「${ZW.PAL_THEME[c(3).p]}」方面容易出狀況，宜多留意。`;
    if (rel === 6) t += '化忌正沖本時段的命宮，變數較大。'; else if (rel === 0) t += '化忌坐入本時段的命宮，容易自尋煩惱。';
    return t;
  }
  function block(chart, b, stem, span, long) {
    const c = chart.cells[b], e = eff(chart, c), r = ZW.rate(chart, b, stem);
    const t = ZW.FLOW_PAL[c.p].replace('〔期〕', span) + `宮內主星 ${join(e.stars)}${e.borrowed ? '（借對宮）' : ''}：${e.stars.map(s => ZW.STAR_FLOW[s]).join('；')}。` + minorShort(c) + huaLine(chart, b, stem, span) + (long ? ZW.RATE_TXT[r.level] : '');
    return { r, c, t };
  }
  const md = dt => `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
  const LM = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

  /* ---------- 流年＋流月 ---------- */
  ZW.yearSection = function (chart, year) {
    const out = [P('流年是每一年的運勢。方法是：以該年地支所在的宮位為「流年命宮」，以該年天干引動流年四化與流年星曜，再配合小限一起看。流月則以「流年斗君」起正月，逐月順行；每個月再以月干引動流月四化。以下推算近五年，其中今明兩年細分到每個月。年齡皆為虛歲，流年與流月都以農曆為準。')];
    for (let y = year; y < year + 5; y++) {
      const yi = ZW.yearInfo(chart, y), c = chart.cells[yi.b], e = eff(chart, c), r = ZW.rate(chart, yi.b, yi.s), fs = yi.stars;
      const np = n => palName(chart.cells[fs[n]].p);
      out.push(`<h4>${y} 年（${STEMS[yi.s]}${BR[yi.b]}年）｜${yi.age} 歲｜流年命宮在本命${palName(c.p)} ${tag(r.level)}</h4>`);
      out.push(P(ZW.YEAR_PAL[c.p].replace(/今年/g, y + ' 年')));
      out.push(P(`流年命宮內的主星為 ${join(e.stars)}${e.borrowed ? '（借對宮）' : ''}。` + e.stars.map(n => ZW.STAR_DECADE[n].replace(/這十年/g, '這一年')).join('') + ZW.R.minorNote(c, '這一年')));
      out.push(P(`${y} 年天干為「${STEMS[yi.s]}」，流年四化如下：`) + ZW.R.spanHua(chart, STEMS[yi.s], '這一年'));
      const jiC = chart.cells[chart.pos[HUA[STEMS[yi.s]][3]]];
      if (mod(jiC.i - yi.b, 12) === 6) out.push(P('留意：流年化忌落在流年命宮的對宮，直接沖擊流年命宮，這一年變動與壓力較大，重大決定宜多方求證、放慢腳步。'));
      else if (jiC.i === yi.b) out.push(P('留意：流年化忌就落在流年命宮，這一年容易自尋煩惱、勞心勞力，適合守成與進修，不宜擴張。'));
      if (chart.pos[chart.hua.忌] === jiC.i) out.push(P(`此外，流年化忌與你本命的化忌落在同一宮（本命${palName(jiC.p)}），形成「雙忌」，該領域在這一年的壓力會特別集中，請提前準備。`));
      out.push(P(`流年星曜：流祿在本命${np('流祿')}，是這一年財源與機會的方位；流羊在${np('流羊')}、流陀在${np('流陀')}，這兩個領域容易有衝突、拖延或損耗；流昌在${np('流昌')}、流曲在${np('流曲')}，利於文書、考試與才藝；流魁在${np('流魁')}、流鉞在${np('流鉞')}，是貴人出現的地方；流馬在${np('流馬')}，主這一年的奔波與遷動；流鸞在${np('流鸞')}、流喜在${np('流喜')}，是喜慶與感情機會之所在。${[0, 4, 8].includes(mod(fs.流祿 - yi.b, 12)) ? '流祿進入流年命宮的三合方，這一年的財運有實質的助益。' : ''}${fs.流羊 === yi.b || fs.流陀 === yi.b ? '流年命宮逢流羊或流陀，行事多一分阻力，留意外傷與口角。' : ''}`));
      const xc = chart.cells[yi.xiao];
      out.push(P(`小限：${yi.age} 歲的小限宮在本命${palName(xc.p)}（${join(ZW.R.starList(xc)) || '空宮'}）。小限看的是個人當年的心境與際遇，與流年命宮互相參看：流年是外在環境給你的題目，小限是你自己的狀態。${ZW.sanfang(chart, yi.xiao).score >= 0 ? '這一年小限的三方條件平順，自己的狀態撐得住。' : '這一年小限的三方煞忌較重，個人狀態容易起伏，要把休息與健康排進行程。'}` + (yi.decade ? `這一年位於 ${yi.decade.from}–${yi.decade.to} 歲的大限之中（大限命宮在本命${palName(chart.cells[yi.decade.b].p)}），流年的吉凶要放在大限的背景下看：大限好而流年差，是小波折；大限差而流年好，是喘息的機會。` : '')));
      if (y < year + 2) {
        const ms = ZW.lunarMonths(y).map(m => {
          const mi = ZW.monthInfo(yi, m.month), b = block(chart, mi.b, mi.s, '這個月', true);
          return `<p><b>農曆${m.leap ? '閏' : ''}${LM[m.month]}月</b>（國曆 ${md(m.start)}–${md(m.end)}）｜${STEMS[mi.s]}${BR[mod(m.month + 1, 12)]}月｜流月命宮在本命${palName(b.c.p)} ${tag(b.r.level)}<br>${b.t}</p>`;
        });
        out.push(`<details${y === year ? ' open' : ''}><summary>${y} 年逐月流月（斗君在本命${palName(chart.cells[yi.dou].p)}）</summary>${ms.join('')}</details>`);
      }
    }
    return out.join('');
  };

  /* ---------- 流日 ---------- */
  ZW.daysSection = function (chart, start, n) {
    const out = [P(`流日是每一天的運勢：以流月命宮起初一，每天順行一宮，再以當天的日干引動流日四化。以下列出自 ${start.getUTCFullYear()}/${md(start)} 起 ${n} 天的逐日提示。流日的影響力遠小於大限與流年，適合用來安排行程的輕重緩急，例如把重要會議排在「吉」日、把需要謹慎的事避開「慎」日，而不宜把單日的吉凶看得太重。想查詢其他日期或細到時辰，請使用上方的「擇日擇時查詢」。`)];
    let cur = '', buf = [];
    const flush = () => { if (buf.length) out.push(`<details${out.length === 1 ? ' open' : ''}><summary>${cur}</summary>${buf.join('')}</details>`); buf = []; };
    for (let i = 0; i < n; i++) {
      const dt = new Date(start.getTime() + i * 864e5), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
      const f = ZW.flow(chart, y, m, d), b = block(chart, f.day.b, f.day.s, '這一天', false), key = `${y} 年 ${m} 月`;
      if (key !== cur) { flush(); cur = key; }
      buf.push(`<p><b>${m}/${d}（${WEEK[dt.getUTCDay()]}）</b>農曆${f.lunar.leap ? '閏' : ''}${LM[f.lunar.month]}月${f.lunar.day}日｜${STEMS[f.day.s]}${BR[f.day.gzb]}日｜流日命宮在本命${palName(b.c.p)} ${tag(b.r.level)}<br>${b.t}</p>`);
    }
    flush();
    return out.join('');
  };

  /* ---------- 擇日擇時查詢（細到時辰，並標出分鐘邊界） ---------- */
  ZW.lookup = function (chart, q, loc) {     // q: {y,m,d,hh,mm}
    const rt = ZW.resolveTime(Object.assign({}, q, loc)), f = ZW.flow(chart, rt.y, rt.m, rt.d, rt.h), out = [];
    const tbl = ZW.hourTable(q.y, q.m, q.d, loc.lon, loc.tz, loc.solar), cur = tbl[rt.h];
    const nowMin = q.hh * 60 + q.mm, [th, tm] = cur.to.split(':').map(Number), left = mod(th * 60 + tm + 1 - nowMin, 1440);
    out.push(P(`查詢時間：國曆 ${q.y}/${q.m}/${q.d} ${pad(q.hh)}:${pad(q.mm)}${loc.solar ? `（${loc.name}，真太陽時校正 ${rt.off >= 0 ? '+' : ''}${rt.off} 分 → ${rt.solar}）` : '（未校正真太陽時）'}。農曆${f.lunar.leap ? '閏' : ''}${LM[f.lunar.month]}月${f.lunar.day}日，${STEMS[f.year.s]}${BR[f.year.b]}年 ${STEMS[f.month.s]}${BR[mod(f.lunar.month + 1, 12)]}月 ${STEMS[f.day.s]}${BR[f.day.gzb]}日 ${STEMS[f.hour.s]}${BR[rt.h]}時。此刻屬於${BR[rt.h]}時（鐘錶時間 ${cur.from}–${cur.to}），距離下一個時辰還有 ${left} 分鐘。`));
    const lv = [['流年', f.year.b, f.year.s, '這一年'], ['流月', f.month.b, f.month.s, '這個月'], ['流日', f.day.b, f.day.s, '這一天'], ['流時', f.hour.b, f.hour.s, '這個時辰']];
    lv.forEach(([n, b, s, sp]) => { const k = block(chart, b, s, sp, true); out.push(`<h4>${n}｜命宮在本命${palName(k.c.p)} ${tag(k.r.level)}</h4>` + P(k.t)); });
    const rs = lv.map(([, b, s]) => ZW.rate(chart, b, s).level);
    out.push(`<h4>綜合判斷</h4>` + P(`四個層級由大到小為 流年（${rs[0]}）→ 流月（${rs[1]}）→ 流日（${rs[2]}）→ 流時（${rs[3]}）。影響力以大的層級為主：流年、流月定大方向，流日、流時只用來微調時機。${rs[2] === '慎' && rs[3] === '慎' ? '此刻流日與流時皆為「慎」，重要的事建議改期或改時段。' : rs[2] !== '慎' && rs[3] === '吉' ? '此刻流時為「吉」且流日無礙，是當天適合處理要事的時段。' : rs[3] === '慎' ? '此刻流時為「慎」，若事情重要，可以參考下表改選當天評估較好的時辰。' : '此刻沒有特別需要迴避之處，照常進行即可。'}`));
    out.push(`<h4>${q.m}/${q.d} 十二時辰</h4><div class="hours">` + tbl.map(h => {
      const b = mod(f.day.b + h.h, 12), s = mod((f.day.s % 5) * 2 + h.h, 10), r = ZW.rate(chart, b, s), c = chart.cells[b], e = eff(chart, c);
      return `<div class="hrow${h.h === rt.h ? ' cur' : ''}"><span class="hn">${STEMS[s]}${BR[h.h]}時</span><span class="ht">${h.from}–${h.to}</span>${tag(r.level)}<span class="hd">本命${palName(c.p)}｜${e.stars.map(x => ZW.STAR_FLOW[x].split('，')[0]).join('；')}</span></div>`;
    }).join('') + '</div>');
    out.push(P('說明：紫微斗數最細的時間單位是時辰（兩小時），同一個時辰內的每一分鐘，推算結果相同。這裡做到分鐘的是時辰的邊界：依所在地經度與當日均時差換算後，每個時辰實際從幾點幾分開始、到幾點幾分結束。'));
    return out.join('');
  };

  /* ---------- 合盤 ---------- */
  ZW.synastry = function (A, B, nb) {
    const out = [], em = (ch, p) => join(eff(ch, ch.byPalace(p)).stars);
    const swap = s => s.replace(/你們/g, '\u0002').replace(/你/g, '\u0001').replace(/對方|他/g, '你').replace(/\u0001/g, nb).replace(/\u0002/g, '你們');
    out.push(P(`合盤是把兩張命盤疊在一起看：對方的命宮落在你的哪一宮，代表對方在你生命中扮演的角色；兩人的生年四化飛入對方的哪些宮位，代表彼此給對方帶來什麼。以下的「你」指本命盤的主人，另一方是${nb}。`));
    out.push(`<h4>兩人的基本盤</h4>` + P(`你的命宮主星為 ${em(A, 0)}，夫妻宮主星為 ${em(A, 2)}，福德宮主星為 ${em(A, 10)}。${nb}的命宮主星為 ${em(B, 0)}，夫妻宮主星為 ${em(B, 2)}，福德宮主星為 ${em(B, 10)}。` +
      (eff(A, A.byPalace(2)).stars.some(s => eff(B, B.byPalace(0)).stars.includes(s)) ? `你的夫妻宮主星與${nb}的命宮主星有重疊，代表${nb}的性格正是你在感情中會被吸引的類型。` : `你的夫妻宮主星與${nb}的命宮主星沒有重疊，代表${nb}未必是你直覺上會選的類型，緣分多半來自相處而非第一眼。`) +
      (eff(B, B.byPalace(2)).stars.some(s => eff(A, A.byPalace(0)).stars.includes(s)) ? `反過來，${nb}的夫妻宮主星與你的命宮主星有重疊，你正是對方心目中伴侶的樣子。` : '')));
    const pa = A.cells[B.ming].p, pb = B.cells[A.ming].p;
    out.push(`<h4>命宮互疊</h4>` + P(`${nb}的命宮在${BR[B.ming]}宮，落在你命盤的${palName(pa)}。` + ZW.SYN_PAL[pa].replace(/對方/g, nb)) + P(`你的命宮在${BR[A.ming]}宮，落在${nb}命盤的${palName(pb)}。從${nb}的角度來看：` + swap(ZW.SYN_PAL[pb])));
    let good = [], bad = [];
    const fly = (X, Y, sub, obj) => HUA_NAMES.map(h => { const st = X.hua[h], p = Y.cells[Y.pos[st]].p; (h === '忌' ? bad : h === '祿' ? good : []).push(`${sub}→${obj}的${palName(p)}`); return P(`${sub}的${st}化${h}落入${obj}的${palName(p)}：${sub}為${obj}的「${ZW.PAL_THEME[p]}」${ZW.SYN_HUA[h]}。`); }).join('');
    out.push(`<h4>生年四化互飛</h4>` + fly(A, B, '你', nb) + fly(B, A, nb, '你'));
    const mf = (X, Y, sub, obj) => { const f = HUA[X.cells[X.ming].stem], p0 = Y.cells[Y.pos[f[0]]].p, p3 = Y.cells[Y.pos[f[3]]].p; return P(`${sub}的命宮宮干為「${X.cells[X.ming].stem}」：化祿（${f[0]}）落入${obj}的${palName(p0)}，表示${sub}本人的善意最容易照顧到${obj}的「${ZW.PAL_THEME[p0]}」；化忌（${f[3]}）落入${obj}的${palName(p3)}，表示${sub}的執著最容易讓${obj}在「${ZW.PAL_THEME[p3]}」上感到壓力。`); };
    out.push(`<h4>命宮飛化</h4>` + mf(A, B, '你', nb) + mf(B, A, nb, '你'));
    const core = [0, 2, 10], hitA = core.includes(B.cells[B.pos[A.hua.忌]].p), hitB = core.includes(A.cells[A.pos[B.hua.忌]].p);
    out.push(`<h4>合盤小結</h4>` + P(`助力的流向：${join(good)}。壓力的流向：${join(bad)}。${hitA || hitB ? `其中化忌落入對方的命宮、夫妻宮或福德宮（${[hitA ? '你→' + nb : '', hitB ? nb + '→你' : ''].filter(Boolean).join('、')}），代表這段關係中有一方會讓另一方特別放不下，牽掛深、要求也多，是緣分深但需要磨合的組合。` : '兩人的化忌都沒有落入對方的命宮、夫妻宮或福德宮，相處上的直接壓力較小。'}合盤看的是兩個人互動的模式，而非好壞的判決：化祿的方向是彼此可以多給的，化忌的方向是彼此需要多體諒的。`));
    return out.join('');
  };
})();
