/* 八字命書組合 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const { STEMS, BR, EL, mod, elemOf, brElem } = ZW, D = ZW.BZ;
  const P = s => `<p>${s}</p>`, say = s => `<p class="say">${s}</p>`, join = a => a.join('、');
  const lv = s => s >= 0.6 ? '吉' : s <= -0.6 ? '慎' : '平', tag = l => `<span class="rate r${l}">${l}</span>`;
  const ZOD = '鼠牛虎兔龍蛇馬羊猴雞狗豬', MON = b => mod(b - 1, 12) + 1;            // 寅月≈國曆 2 月
  const TENG = { 比肩: 0, 劫財: 0, 食神: 1, 傷官: 1, 偏財: 2, 正財: 2, 七殺: 3, 正官: 3, 偏印: 4, 正印: 4 };
  const GN = ['比劫', '食傷', '財星', '官殺', '印星'];
  const HE = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];                                   // 六合

  /* 命盤表 */
  ZW.baziTable = function (b) {
    const cols = [['時柱', b.P.hour], ['日柱', b.P.day], ['月柱', b.P.month], ['年柱', b.P.year]];
    const cell = (i, kind) => `<span class="gzc e${kind === 's' ? elemOf(i) : brElem(i)}">${kind === 's' ? STEMS[i] : BR[i]}</span>`;
    const row = (label, f) => `<div class="bzr"><span class="bzl">${label}</span>${cols.map(([, p]) => `<span>${f(p)}</span>`).join('')}</div>`;
    const max = Math.max(...b.w);
    return `<div class="bz"><div class="bzr bzh"><span class="bzl"></span>${cols.map(([n]) => `<span>${n}</span>`).join('')}</div>` +
      row('十神', p => p.ten) + row('天干', p => cell(p.s, 's')) + row('地支', p => cell(p.b, 'b')) + row('十神', p => p.tenB) +
      row('藏干', p => p.hide.map(h => STEMS[h]).join('')) + row('十二運', p => p.stage) + row('神煞', p => p.sha) + '</div>' +
      `<div class="wx">${b.w.map((v, i) => `<div><span>${EL[i]}</span><i class="e${i}" style="width:${Math.round(v / max * 100)}%"></i><em>${Math.round(v / b.total * 100)}%</em></div>`).join('')}</div>`;
  };

  function ch1(b, c) {
    const o = [], dt = b.P.day.tenB;
    o.push(say('我說話直，但都是為你好。先看你這個人。'));
    o.push(P(`${c.who}的八字是 ${b.P.year.gz}年 ${b.P.month.gz}月 ${b.P.day.gz}日 ${b.P.hour.gz}時。八字以日柱的天干為「我」，稱為日主；其餘七個字與日主的生剋關係，就是十神。你的日主是${STEMS[b.ds]}${EL[b.me]}，生在${BR[b.P.month.b]}月。`));
    o.push('<h4>日主｜你的本質</h4>' + P(D.DAY[b.ds]));
    o.push(`<h4>日柱｜${b.P.day.gz}</h4>` + P(`日柱是你自己與另一半的位置。你的日支是${BR[b.db]}，藏${b.P.day.hide.map(h => STEMS[h]).join('、')}，本氣對日主而言是${dt}。${D.TEN[dt].c}這股力量就坐在你的腳下，是你最貼身的習性，也是你在親密關係裡的樣子。`) + P(D.STAGE[b.P.day.stage]));
    o.push(`<h4>格局｜月令${b.P.month.tenB}</h4>` + P(D.GE[b.P.month.tenB]));
    o.push(`<h4>日主強弱｜${b.level}</h4>` + P(`把四柱的五行力量加總，月令加重計算：${b.w.map((v, i) => `${EL[i]} ${Math.round(v / b.total * 100)}%`).join('、')}。幫助日主的力量（${EL[b.me]}與生${EL[b.me]}的${EL[b.rel(4)]}）合計約占 ${Math.round(b.ratio * 100)}%。`) + P(D.STRONG[b.level]) +
      P(`因此你的喜用神是${join(b.favor.map(e => EL[e]))}，其中最關鍵的是${EL[b.primary]}；忌神是${join(b.avoid.map(e => EL[e]))}。之後看大運與流年，凡是走到喜用的五行就順，走到忌神的五行就要收斂。這套喜忌採用的是「扶抑法」，沒有另外考慮調候與特殊格局。`));
    const mx = b.w.indexOf(Math.max(...b.w)), mn = b.w.indexOf(Math.min(...b.w));
    o.push('<h4>五行偏枯</h4>' + (b.w[mx] / b.total >= 0.3 ? P(D.EL_MANY[mx]) : '') + (b.w[mn] / b.total <= 0.1 ? P(D.EL_FEW[mn]) : '') + (b.w[mx] / b.total < 0.3 && b.w[mn] / b.total > 0.1 ? P('你的五行分布相對平均，沒有特別偏旺或偏缺的一行，性格與體質都比較均衡，少走極端。') : ''));
    o.push('<h4>十神分布｜你手上的牌</h4>' + P(`四柱裡除了日主，其餘天干與地支本氣的十神是：${Object.entries(b.tens).map(([k, v]) => `${k} ${v} 個`).join('、')}。依類別統計：${GN.map((n, i) => `${n} ${b.grp(i)}`).join('、')}。`));
    Object.entries(b.tens).sort((x, y) => y[1] - x[1]).forEach(([k, v]) => o.push(P(D.TEN[k].c + (v >= 2 ? D.TEN[k].m : ''))));
    const miss = GN.filter((n, i) => b.grp(i) === 0);
    if (miss.length) o.push(P(`你的命局明面上不見${join(miss)}。缺的十神不是沒有，而是不擅長、不自然：${miss.map(n => ({ 比劫: '比劫不現，你少了同輩的支援，也少了與人爭的心', 食傷: '食傷不現，你不擅表達與展現自己，才華悶在裡面', 財星: '財星不現，你對錢的敏感度低，賺錢要靠後天學', 官殺: '官殺不現，你不喜歡被管，也比較缺少外在的約束與職位運', 印星: '印星不現，你早年少人庇護，凡事得自己摸索' }[n])).join('；')}。`));
    o.push('<h4>四柱的位置</h4>' + P(`年柱看祖上與早年（${b.P.year.ten}、${b.P.year.tenB}，${b.P.year.stage}）；月柱看父母、兄弟與青年事業（${b.P.month.ten}、${b.P.month.tenB}，${b.P.month.stage}）；日柱看自己與配偶（${b.P.day.stage}）；時柱看子女、晚年與內心深處（${b.P.hour.ten}、${b.P.hour.tenB}，${b.P.hour.stage}）。`) +
      P(`你最不想被人發現的那一面，藏在時柱：時干是${b.P.hour.ten}。${D.TEN[b.P.hour.ten].c}這是你對外不太展現、獨處時才浮現的性格，年紀越大越明顯。`));
    o.push('<h4>神煞</h4>' + P(`以年支起十二神煞：年柱${b.P.year.sha}、月柱${b.P.month.sha}、日柱${b.P.day.sha}、時柱${b.P.hour.sha}。`) + [...new Set(b.list.map(p => p.sha))].map(s => P(D.SHA[s])).join('') +
      (b.shen.length ? b.shen.map(s => P(D.SHEN[s])).join('') : P('你的命局沒有帶到天乙貴人、文昌、桃花、驛馬等常用吉凶神煞，吉凶以五行與十神為主。')));
    return o.join('');
  }

  function curve(b, now) {
    const pts = []; for (let a = 16; a <= 80; a++) pts.push(b.yearOf(b.by + a - 1));
    const sm = pts.map((p, i) => (pts.slice(Math.max(0, i - 1), i + 2).reduce((n, x) => n + x.wealth, 0)) / pts.slice(Math.max(0, i - 1), i + 2).length);
    const lo = Math.min(...sm), hi = Math.max(...sm), W = 320, H = 150, x = i => 14 + i * (W - 28) / (pts.length - 1), y = v => 18 + (hi - v) / (hi - lo || 1) * (H - 50);
    let fut = pts.map((p, i) => i).filter(i => pts[i].y >= now); if (!fut.length) fut = pts.map((p, i) => i); const pick = f => fut.reduce((best, i) => f(sm[i], sm[best]) ? i : best, fut[0]);
    const iLo = pick((a, c) => a < c), iHi = pick((a, c) => a > c), iNow = pts.findIndex(p => p.y === now);
    const path = sm.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const dot = (i, cls) => i < 0 ? '' : `<line x1="${x(i)}" x2="${x(i)}" y1="${y(sm[i])}" y2="${H - 22}" class="gl"/><circle cx="${x(i)}" cy="${y(sm[i])}" r="4" class="${cls}"/>`;
    const svg = `<svg class="curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="財運曲線"><path d="${path}L${x(pts.length - 1)},${H - 22}L${x(0)},${H - 22}Z" class="ar"/><path d="${path}" class="ln"/>${dot(iLo, 'dl')}${dot(iHi, 'dh')}${dot(iNow, 'dn')}` +
      [16, 30, 40, 50, 60, 70, 80].map(a => `<text x="${x(a - 16)}" y="${H - 6}" text-anchor="middle">${a}歲</text>`).join('') + '</svg>';
    const rng = i => `${pts[Math.max(0, i - 1)].y}–${pts[Math.min(pts.length - 1, i + 1)].y} 年（${pts[i].age} 歲前後）`;
    return { svg, low: rng(iLo), high: rng(iHi), hiP: pts[iHi], loP: pts[iLo] };
  }

  function ch2(b, c) {
    const o = [], share = b.w[b.rel(2)] / b.total, rich = share >= 0.2, cv = curve(b, c.now);
    o.push(say('接著講錢。錢像水，看的是你這口井有多深、水從哪裡來。'));
    o.push('<h4>財星的狀態</h4>' + P(`對${STEMS[b.ds]}${EL[b.me]}日主來說，財星是${EL[b.rel(2)]}。你的命局裡${EL[b.rel(2)]}的力量約占 ${Math.round(share * 100)}%，明面上有 ${b.grp(2)} 個財星（${['正財', '偏財'].filter(t => b.tens[t]).map(t => t + ' ' + b.tens[t]).join('、') || '不現'}），日主屬於${b.level}。`) +
      P(b.strong && rich ? '身強而財旺：你有力氣，也有財可取，這是能擔大財的結構。你適合主動出擊、經營事業或投資，錢對你是工具而非負擔。只要運走到財與食傷的年份，進帳會很明顯。你的財富層級在同輩之中屬於前段，關鍵是別因為自信過頭而重押。' :
        b.strong ? '身強而財弱：你有的是力氣與本事，缺的是財路。你的錢不會自己來，要靠你的才華與技能去「生」出來，也就是食傷生財這條路。平常收入中等，但只要走到財運或食傷運的年份，收入會突然跳一階。你的財富是「運到才發」型，時機比努力重要。' :
          rich ? '財多身弱：錢與機會其實一直在你眼前，但你拿不動、守不住，賺得越多越累，甚至為財所困。你不適合自己扛全部的風險，要靠團隊、合夥、專業資格或長輩貴人來幫你擔。運走到比劫與印星的年份，你才真正接得住財。你的財富上限不低，但前提是先把自己養壯。' :
            '身弱而財弱：你這個命不以求財為主軸，硬追錢只會把自己耗乾。你的路是先求名、求專業、求穩定，靠資歷與信用換來細水長流的收入。別跟人比暴發，你的財富是慢慢堆起來的，中晚年比早年寬裕。'));
    o.push('<h4>人生財運曲線</h4>' + cv.svg + `<p class="lg"><i class="dl"></i>往後的財運低點：${cv.low}　<i class="dh"></i>往後的財運高點：${cv.high}　<i class="dn"></i>今年</p>` +
      P(`這條曲線是把每一年的大運與流年干支，對照你的喜用神與財星計算出來的相對走勢，16 歲到 80 歲。它顯示的是「哪幾年比較好賺、哪幾年要守」，不是金額。往後看，最需要保守的時段在 ${cv.low}，那幾年不宜擴張、借貸與重押；最有機會翻身的時段在 ${cv.high}，走的是${cv.hiP.dec ? cv.hiP.dec.gz + '大運、' : ''}${cv.hiP.gz}流年，請提前兩三年把本事與資源準備好。`));
    const leaks = [];
    if (b.grp(0) >= 2) leaks.push('比劫'); if (b.grp(1) >= 2) leaks.push('食傷'); if (!b.strong && rich) leaks.push('財多'); if (b.grp(2) === 0) leaks.push('無財');
    if (b.grp(3) >= 2) leaks.push('官殺'); if (b.grp(4) >= 2) leaks.push('印'); if (b.shen.includes('桃花')) leaks.push('桃花'); if (b.shen.includes('羊刃') || b.tens.傷官 || b.tens.七殺) leaks.push('衝動');
    ['衝動', '食傷', '比劫', '印'].forEach(k => { if (leaks.length < 3 && !leaks.includes(k)) leaks.push(k); });
    o.push('<h4>你錢包的三個破洞</h4>' + leaks.slice(0, 3).map((k, i) => P(`${'一二三'[i]}、${D.LEAK[k]}`)).join(''));
    const good = b.noble.map(x => ZOD[x]), bad = ZOD[mod(b.db + 6, 12)];
    o.push('<h4>貴人與該保持距離的人</h4>' + P(`你的天乙貴人在${b.noble.map(x => BR[x]).join('、')}，因此生肖屬${join(good)}的人，以及每年國曆約 ${b.noble.map(MON).join('、')} 月前後，是你比較容易遇到貴人與轉機的對象與時段。五行上，從事${D.MATE[b.primary].job}這類行業的人，氣質多半屬於你喜用的${EL[b.primary]}，與他們往來對你有利。`) +
      P(`相對地，與你日支${BR[b.db]}相沖的是${BR[mod(b.db + 6, 12)]}，生肖屬${bad}的人與你容易立場相左、互相消耗，合夥與金錢往來要多一分謹慎。這不是說對方是壞人，而是你們的節奏天生相反。真正要提防的，是在你走忌神運（${join(b.avoid.map(e => EL[e]))}）的年份突然熱絡起來、又急著跟你談錢的人。`));
    return o.join('');
  }

  const meet = (b, c) => ZW.loveYears(c.chart, b, c.mateEl, c.now, 10).top;
  function ch3(b, c) {
    const o = [], m = D.MATE[c.mateEl], ys = meet(b, c), months = [...new Set([MON(b.peach), MON(HE[b.db])])];
    const n = c.same ? 0 : b.grp(b.spouseTen);
    o.push(say('再來是感情。你在這件事上繞的路，其實每次都是同一條，看懂了就能換一條走。'));
    if (D.REL[c.rel]) o.push(P(D.REL[c.rel]));
    o.push('<h4>配偶星與配偶宮</h4>' + P(c.same ? `傳統八字以「男看財星、女看官殺」定配偶星，這是以異性婚配為前提的規則。你選的是同性取向，所以這裡改以日支「配偶宮」為主來看：你的日支是${BR[b.db]}，五行屬${EL[c.mateEl]}，坐${b.P.day.stage}。配偶宮代表的是你身邊那個位置的氣質，不受對象性別影響。` :
      `${b.gender}命以${b.gender === '男' ? '財星' : '官殺'}為配偶星，對你而言是${EL[c.mateEl]}。你的命局明面上有 ${n} 個配偶星。${n === 0 ? '配偶星不現，代表你對感情比較被動、緣分來得晚，或不太把感情放在人生的第一順位；要等大運或流年把配偶星帶進來，緣分才會動。' : n === 1 ? '配偶星一位，清而不雜，感情的對象明確，適合專一經營。' : '配偶星有兩位以上，代表感情機會多、選擇多，也容易有重疊或反覆，定下來之前會經過幾段。'}你的配偶宮是日支${BR[b.db]}，坐${b.P.day.stage}。`) +
      (b.list.some((p, i) => i !== 2 && mod(p.b - b.db, 12) === 6) ? P('你的日支被命局中其他地支所沖，配偶宮不穩，感情與婚姻容易有變動、聚少離多或分合，晚一點定下來比較好。') : P('你的日支沒有被命局中的其他地支所沖，配偶宮算是穩定，一旦定下來不容易動搖。')));
    o.push('<h4>你的戀愛模式</h4>' + P(D.LOVE[b.P.day.tenB]));
    o.push(`<h4>緣分檔案</h4><div class="card"><div class="ct">${c.who === '你' ? '你' : c.who}的緣分檔案</div>` +
      [['相遇時期', ys.map(x => `${x.y} 年（${x.gz}）`).join('、') + `，尤其是國曆約 ${months.join('、')} 月前後`], ['職業傾向', m.job], ['外貌氣質', m.look], ['性格', m.mind], ['相遇地點', m.place]].map(([k, v]) => `<div class="cr"><b>${k}</b><span>${v}</span></div>`).join('') + '</div>' +
      P(`這張檔案怎麼來的：對象的氣質取自你配偶星（或配偶宮）的五行${EL[c.mateEl]}；相遇時期是把紫微與八字合在一起看：往後十年中，紫微流年走到夫妻宮、紅鸞、天喜或化祿入夫妻宮，八字流年帶入配偶星、引動桃花（${BR[b.peach]}）或與日支${BR[b.db]}相合，兩邊加總最強的三年，全書其他章節講到緣分年也是這三年。它指出的是「緣分比較容易發生的時段與類型」，不是保證在某一天遇到某一個人。那幾年請你多出門、多答應邀約，待在家裡是等不到的。`));
    o.push('<h4>你吸引人的地方</h4>' + P(`你的吸引力來自日主${STEMS[b.ds]}${EL[b.me]}本身的氣質${b.shen.includes('桃花') ? '，加上命帶桃花，你不必刻意做什麼，別人就會注意到你' : b.P.day.stage === '沐浴' ? '，加上日坐沐浴，你有一種不自覺的風情' : '。你沒有帶明顯的桃花星，靠的不是第一眼，而是相處之後才顯出來的份量'}。${['正直與可靠感', '感染力與笑容', '穩重與安全感', '俐落與分寸', '聰明與神祕感'][b.me]}，是你最值錢的武器；別學別人的路線，那不適合你。`) + P(D.INTIMATE[brElem(b.db)]));
    return o.join('');
  }

  function ch4(b, c) {
    const o = [], age = c.now - b.by + 1, L = D.LUCK[b.primary];
    o.push(say('最後講運。命是你這艘船，運是風向。順風時揚帆，逆風時修船，都不算白過。'));
    o.push('<h4>大運</h4>' + P(`大運每十年一換，從月柱順排或逆排而來。你是${b.ys % 2 ? '陰' : '陽'}年生的${b.gender}命，大運${b.dir > 0 ? '順' : '逆'}行，約 ${b.startAge} 歲起運。大運的天干管前五年、地支管後五年，地支的力量較重。`));
    b.decades.forEach(d => {
      const cur = age >= d.from && age <= d.to;
      o.push(`<p><b>${d.from}–${d.to} 歲（${d.y0}–${d.y0 + 9} 年）｜${d.gz}運</b> ${tag(lv(d.score))}${cur ? '<span class="now">目前所在</span>' : ''}<br>天干${STEMS[d.s]}為${d.ten}，地支${BR[d.b]}為${d.tenB}，日主行${d.stage}之地。${D.DEC[d.ten]}後五年轉為${d.tenB}的性質：${D.DEC[d.tenB].split('。')[1]}。${elemOf(d.s) === b.primary || brElem(d.b) === b.primary ? `這步運帶來你最需要的${EL[b.primary]}，是關鍵的好運。` : lv(d.score) === '吉' ? '這步運走的是你的喜用神，順勢而為即可。' : lv(d.score) === '慎' ? '這步運走的是忌神，宜守不宜攻，把重心放在累積而非擴張。' : '這步運喜忌參半，前後五年的感受會不一樣。'}</p>`);
    });
    const fut = b.decades.filter(d => d.to >= age), best = fut.slice().sort((x, y) => y.score - x.score)[0];
    const yrs = Array.from({ length: 10 }, (_, i) => b.yearOf(c.now + i)), top = yrs.slice().sort((x, y) => y.score - x.score)[0], low = yrs.slice().sort((x, y) => x.score - y.score)[0];
    if (best) o.push('<h4>轉運的時間點</h4>' + P(`往後看，你最好的一步大運是 ${best.from}–${best.to} 歲的${best.gz}運（${best.y0}–${best.y0 + 9} 年）${age >= best.from ? '，你現在就走在裡面，這幾年不要浪費' : `，距離現在還有 ${best.from - age} 年，這段時間是用來準備的`}。近十年之中，氣勢最強的一年是 ${top.y} 年（${top.gz}，${top.age} 歲），適合做大的決定與主動爭取；最需要低調的一年是 ${low.y} 年（${low.gz}，${low.age} 歲），那一年以守為主。`));
    o.push('<h4>近十年流年</h4>' + P('這裡是八字單獨的逐年評估。把紫微流年一起合看的結論，在第四章「消長」那一節，兩者不同時以合看的為準。') + yrs.map(y => `<p><b>${y.y} 年｜${y.gz}｜${y.age} 歲</b> ${tag(lv(y.score))}<br>流年天干為${y.ten}，地支為${y.tenB}。${D.YEAR[y.ten]}${y.ten !== y.tenB ? '下半年轉為' + y.tenB + '的性質：' + D.YEAR[y.tenB] : ''}${mod(y.b - b.db, 12) === 6 ? '這一年流年沖日支，你自己與感情、居住環境容易有變動。' : ''}${mod(y.b - b.yb, 12) === 0 ? '這一年是本命年，凡事宜穩。' : ''}${y.b === b.peach ? '這一年引動桃花。' : ''}${y.b === b.horse ? '這一年引動驛馬，多走動、遷移或出國。' : ''}</p>`).join(''));
    o.push('<h4>你的處方</h4>' + P(`你最需要的五行是${EL[b.primary]}。日常可以用這些方式補：顏色用${L.color}；方位取${L.dir}，找工作、搬家、出差往這個方向比較順；數字用${L.num}；隨身或擺設可以選${L.thing}；想轉換心情時去${L.place}。適合你的行業方向是${D.MATE[b.primary].job}。`) +
      P(`這些是依五行生剋推出來的生活習慣建議，作用是提醒你把注意力放在對你有利的方向，不是護身符。真正改運的是在對的年份做對的決定。`));
    return o.join('');
  }

  function ask(b, c) {
    const o = [], t = (D.TOPIC.find(([re]) => re.test(c.concernRaw || '')) || [, ''])[1];
    const yrs = Array.from({ length: 8 }, (_, i) => b.yearOf(c.now + i)), ty = b.yearOf(c.now);
    const ol = ZW.outlook(c.chart, b, c.now, 8), goodY = ol.good.map(y => y.y), badY = ol.bad.map(y => y.y);
    if (D.JOB[c.job]) o.push('<h4>你現在的工作狀態</h4>' + P(D.JOB[c.job]) + P(`對照你的命盤：${D.GE[b.P.month.tenB]}喜用神是${EL[b.primary]}，對應的行業是${D.MATE[b.primary].job}。${c.now} 年的流年是${ty.gz}（${ty.ten}、${ty.tenB}），八字單看評為「${lv(ty.score)}」：${D.YEAR[ty.ten]}往後八年中（紫微與八字合看），相對最適合進取的是 ${goodY.join('、')}；最需要保守的是 ${badY.join('、')}。`));
    if (c.concern) {
      o.push(`<h4>你問的事</h4>` + say(`你說：「${c.concern}」。好，我直接回答。`));
      const m = D.MATE[c.mateEl], ms = meet(b, c);
      const A = {
        感情: `這是感情的問題。先看你自己：${D.LOVE[b.P.day.tenB]}再看時機：往後十年裡，緣分最容易動的年份是 ${ms.map(x => x.y).join('、')}。你命中適合的對象，氣質是「${m.mind}」，外型傾向「${m.look}」。如果你心裡已經有一個具體的條件清單，請拿它跟這個比一比：命盤顯示的是跟你長久合得來的類型，而你想要的與適合你的，未必是同一種人。條件抓得太死，會把真正的緣分擋在門外。`,
        錢財: `這是錢的問題。你的日主${b.level}，財星占 ${Math.round(b.w[b.rel(2)] / b.total * 100)}%。往後幾年適合積極求財的年份是 ${goodY.join('、')}，需要保守的是 ${badY.join('、')}。在保守的年份，不借錢、不擔保、不重押；在進取的年份，把力氣集中在一條最有把握的財路上。你最大的漏財點我在第二章寫了，先把那個洞補起來，比多賺一份更有效。`,
        事業: `這是事業的問題。${D.GE[b.P.month.tenB]}你現在走的是${ty.dec ? ty.dec.gz + '大運（' + ty.dec.ten + '、' + ty.dec.tenB + '）' : '起運前的階段'}，${ty.dec ? D.DEC[ty.dec.ten] : ''}要不要動，看年份：${goodY.length ? goodY[0] + ' 年是最近一個適合轉換或爭取的時機' : '近幾年沒有特別強的轉換時機，宜先累積'}${badY.length ? '；' + badY[0] + ' 年則不宜貿然離開穩定的位置' : ''}。`,
        健康: `這是身體與心理的問題。${D.EL_MANY[b.w.indexOf(Math.max(...b.w))]}${D.EL_FEW[b.w.indexOf(Math.min(...b.w))]}${badY.length ? badY.join('、') + ' 年走忌神，是身心壓力比較大的年份，請提前安排檢查與休息。' : ''}命理只能指出體質的傾向，身體不舒服、睡不好或情緒長期低落，請直接找醫師或心理專業人員，不要用算命代替看診。`,
        家庭: `這是家人的問題。你的年柱是${b.P.year.gz}（${b.P.year.ten}、${b.P.year.tenB}），代表祖上與早年家境；月柱是${b.P.month.gz}（${b.P.month.ten}、${b.P.month.tenB}），代表父母與兄弟。印星看母親與長輩的庇護，你有 ${b.grp(4)} 個；財星在傳統上也看父親，你有 ${b.grp(2)} 個。${b.grp(4) === 0 ? '印星不現，你與長輩之間比較缺少理所當然的依靠，很多事習慣自己扛。' : '印星在局，長輩緣是有的，只是表達方式未必是你想要的。'}家人之間的事，命盤能告訴你的是彼此的節奏差在哪裡，解法還是在開口談。`,
        學業遷移: `這是學業或遷移的問題。${b.shen.includes('文昌') ? '你命帶文昌，讀書與考試有先天的優勢。' : '你沒有帶文昌，考運靠的是準備而非天分，請把時間拉長。'}${b.shen.includes('驛馬') ? '你命帶驛馬，離開出生地發展對你有利。' : '你沒有帶驛馬，遠行不是必要，但走到驛馬年可以動。'}往後幾年中，流年地支走到${BR[b.horse]}（驛馬）的年份是 ${yrs.filter(y => y.b === b.horse).map(y => y.y).join('、') || '近八年沒有'}，適合搬遷與出國；印星旺的年份適合考試與進修：${yrs.filter(y => TENG[y.ten] === 4 || TENG[y.tenB] === 4).map(y => y.y).join('、') || '近八年不明顯'}。`
      };
      o.push(P(A[t] || `你問的事我沒辦法歸到感情、錢財、事業、健康、家庭或學業其中一類，所以我用整體的運勢回答你。${c.now} 年流年${ty.gz}，評估為「${lv(ty.score)}」：${D.YEAR[ty.ten]}往後幾年適合主動的年份是 ${goodY.join('、')}，需要保守的是 ${badY.join('、')}。任何重大的決定，放在適合主動的年份去做。`));
      const q = ZW.readConcern(c.concernRaw, c.now), notes = ZW.concernNotes(c.chart, b, c, q);
      if (notes.length) o.push(`<h4>逐項看你寫的條件</h4>` + notes.map(n => `<p><b>${n.title}</b>　${n.text}</p>`).join(''));
      o.push(P(`說明：這一段會從你寫的句子裡抓出生肖、年齡、地點與年份${q.items.length ? `（這次抓到的是：${join(q.items)}）` : ''}，逐項對照命盤；其餘的文字只用來判斷主題，不是逐字理解。想要逐字回應你的處境，請使用 AI 撰寫。`));
    }
    return o.join('') || P('你沒有填寫工作狀態與煩惱。回到上方重新問診並填寫，這一章就會針對你的處境回答。');
  }

  function cross(b, chart) {
    const rows = chart.decades.filter(d => d.from <= 85).map(d => {
      const mid = d.from + 5, bd = b.decades.find(x => mid >= x.from && mid <= x.to), zs = ZW.sanfang(chart, d.b).score, zl = zs >= 3 ? '吉' : zs < 0 ? '慎' : '平', bl = bd ? lv(bd.score) : '平';
      return { d, bd, zl, bl, agree: zl === bl };
    });
    const both = (l) => rows.filter(r => r.agree && r.zl === l).map(r => `${r.d.from}–${r.d.to} 歲`);
    return P('紫微斗數與八字是兩套獨立的系統，用的資料相同（出生年月日時），推算方法完全不同。把兩者的十年運並排，兩套都說好或都說要小心的時段，可信度比單看一套高；兩套說法相反的時段，代表那十年好壞參半，要看你把力氣放在哪個領域。') +
      `<div class="xt"><div class="xr xh"><span>年齡</span><span>紫微大限</span><span>八字大運</span><span>是否一致</span></div>` + rows.map(r => `<div class="xr"><span>${r.d.from}–${r.d.to}</span><span>本命${ZW.PALACES[chart.cells[r.d.b].p].replace('宮', '')} ${tag(r.zl)}</span><span>${r.bd ? r.bd.gz + '運' : '未起運'} ${tag(r.bl)}</span><span>${r.agree ? '一致' : '不同'}</span></div>`).join('') + '</div>' +
      P(`兩套系統都評為「吉」的時段：${join(both('吉')) || '沒有完全重疊的十年'}。兩套都評為「慎」的時段：${join(both('慎')) || '沒有完全重疊的十年'}。${both('吉').length ? '重疊的好運期是你一生最該放手去做的時段。' : ''}${both('慎').length ? '重疊的保守期請把風險降到最低，以累積實力與照顧身體為主。' : ''}兩套的年齡區間並不完全對齊（紫微以五行局起運，八字以節氣起運），這裡以紫微每個大限的中間年齡去對照當時的八字大運。`);
  }

  ZW.baziReport = function (b, chart, ctx) {
    const c = Object.assign({}, ctx); c.chart = chart; c.same = ctx.orient === '同性'; c.mateEl = c.same ? brElem(b.db) : b.spouseEl;
    return [
      { id: 'bz1', title: '八字一｜你這個人', html: ZW.baziTable(b) + ch1(b, c) },
      { id: 'bz2', title: '八字二｜錢與貴人', html: ch2(b, c) },
      { id: 'bz3', title: '八字三｜感情與緣分', html: ch3(b, c) },
      { id: 'bz4', title: '八字四｜大運與流年', html: ch4(b, c) },
      { id: 'bz5', title: '八字五｜你問的事', html: ask(b, c) },
      { id: 'cross', title: '紫微 × 八字 對照', html: cross(b, chart) }
    ];
  };
})();
