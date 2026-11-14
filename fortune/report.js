/* 命書組合：依命盤把文字庫組成完整報告 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const { mod, BR, STEMS, PALACES, HUA, HUA_NAMES } = ZW;
  const NUM = '〇一二三四五六七八九十';
  const tier = b => '廟旺'.includes(b) ? '強' : '不陷'.includes(b) ? '弱' : '中';
  const P = s => `<p>${s}</p>`;
  const starList = c => [...c.main.map(s => s.name + (s.hua ? '化' + s.hua : '')), ...c.minor.map(s => s.name + (s.hua ? '化' + s.hua : ''))];
  const mainNames = c => c.main.map(s => s.name);
  const typeOf = n => (ZW.MINOR[n] || {}).t;
  const palName = p => PALACES[p] + (p === 0 ? '' : '宮');
  const join = a => a.join('、');

  /* 三方四正的吉煞統計 */
  function sanfang(chart, b) {
    const ids = [b, mod(b + 6, 12), mod(b + 4, 12), mod(b + 8, 12)];
    const ji = [], sha = [], hua = [];
    ids.forEach(i => {
      const c = chart.cells[i];
      c.minor.forEach(s => { if (typeOf(s.name) === '吉') ji.push(s.name); if (typeOf(s.name) === '煞') sha.push(s.name); });
      [...c.main, ...c.minor].forEach(s => { if (s.hua) hua.push(s.name + '化' + s.hua); });
    });
    const score = ji.length + hua.filter(x => !x.endsWith('忌')).length - sha.length - hua.filter(x => x.endsWith('忌')).length * 1.5;
    return { ids, ji, sha, hua, score };
  }
  const effMain = (chart, c) => c.main.length ? { stars: mainNames(c), borrowed: false } : { stars: mainNames(chart.cells[mod(c.i + 6, 12)]), borrowed: true };

  function overview(chart, who, info) {
    const mc = chart.cells[chart.ming], em = effMain(chart, mc), sf = sanfang(chart, chart.ming);
    const out = [];
    out.push(P(`${who}生於農曆${chart.yearGZ}年${chart.lunar.leap ? '閏' : ''}${chart.lunar.month}月${chart.lunar.day}日，生肖屬${chart.zodiac}，${chart.yang ? '陽' : '陰'}${chart.gender}。命宮立於${mc.stem}${mc.branch}宮，身宮在${BR[chart.shen]}宮（${chart.cells[chart.shen].palace}），五行局為${chart.element}${NUM[chart.ju]}局。命主${chart.mingZhu}，身主${chart.shenZhu}。大限${chart.dir > 0 ? '順行' : '逆行'}，${chart.ju}歲（虛歲）起運。`));
    out.push(P(`紫微斗數把人生分成十二個宮位，每個宮位掌管一個生活領域；十四顆主星決定各領域的基本性質，輔星與煞星加以修飾，四化則指出一生中資源、權力、名聲與課題的流向。以下的解讀依「本宮星曜 → 亮度 → 輔星煞星 → 生年四化 → 三方四正 → 宮干飛化」的順序逐宮展開，再綜論事業、財富、感情與健康，最後推演十年大限、近五年流年、逐月流月與逐日流日。`));
    if (info) out.push(P(info));
    out.push(`<h4>命宮格局</h4>`);
    if (em.borrowed) out.push(P(`你的命宮沒有主星，稱為「命無正曜」。這並不是缺陷，而是代表你的性格可塑性高、適應力強，容易受到環境與身邊的人影響，早年方向感較不明確，需要較長的時間找到自己的定位。論命時借對面遷移宮的主星 ${join(em.stars)} 入命宮來看，力量約打七折，也因此你在外的表現、所處的環境，對你一生的影響比一般人更大。`));
    else out.push(P(`你的命宮主星是 ${join(em.stars)}${em.stars.length > 1 ? '，雙星同宮，兩顆星的性質會彼此調和與拉扯，你的個性也因此比單星坐命的人更有層次' : '，單星獨坐，星曜的性質表現得純粹而明顯'}。`));
    const all = new Set(sf.ids.flatMap(i => mainNames(chart.cells[i])));
    const has = (...n) => n.every(x => all.has(x));
    if (em.stars.some(s => ['七殺', '破軍', '貪狼'].includes(s))) out.push(P(`你的命宮坐七殺、破軍、貪狼其中之一，而這三顆星永遠在三方互相會照，稱為「殺破狼」格局。這是一種動態、開創型的命格：人生變動多、起伏大，不適合一成不變的生活，每一次大的轉折都是重新洗牌的機會。穩定對你而言不是常態，學會在變動中累積，才是你的成功之道。`));
    if (has('天機', '太陰', '天同', '天梁')) out.push(P(`你的命宮三方四正會齊天機、太陰、天同、天梁，古稱「機月同梁」格。這是一種穩定、服務型的命格，適合在制度完善的組織中發展，擅長企劃、行政、幕僚與專業服務，以細水長流的方式累積成就，而非大起大落地闖蕩。`));
    if (has('紫微', '天府') && mc.main.length === 2 && em.stars.includes('紫微') && em.stars.includes('天府')) out.push(P(`紫微與天府兩顆帝星同坐命宮，稱為「紫府同宮」，一主開創、一主守成，氣度穩重、衣食無憂，但兩種性質也會互相牽制，容易在進取與保守之間猶豫。`));
    if (has('紫微', '天府', '武曲', '廉貞', '天相') || (has('紫微', '武曲', '廉貞') && (all.has('天府') || all.has('天相')))) out.push(P(`你的命宮三方會見紫微、武曲、廉貞等星，屬於「紫府廉武相」一系的組合，重視秩序、地位與實際成果，適合在組織中擔任管理與承擔責任的角色，穩紮穩打地建立自己的版圖。`));
    if (has('太陽', '巨門') || has('太陽', '天梁') || has('太陽', '太陰')) out.push(P(`你的命宮三方見太陽與${all.has('巨門') ? '巨門' : all.has('天梁') ? '天梁' : '太陰'}相會，屬於重視名聲、表達與公眾事務的組合，人生的成就感多半來自專業受到肯定，而非單純的財富數字。`));
    if (chart.pos.天馬 !== undefined && sf.ids.includes(chart.pos.天馬) && (sf.ids.includes(chart.pos.祿存) || sf.ids.includes(chart.pos[chart.hua.祿]))) out.push(P(`你的命宮三方四正同時見到天馬與祿星，構成「祿馬交馳」，主動中得財，越走動越有機會，適合往外地發展、從事需要奔波或跨地域的事業。`));
    out.push(ZW.extraPatterns(chart));
    out.push(P(`命宮三方四正（命宮、遷移、財帛、官祿）共會見吉星 ${sf.ji.length} 顆${sf.ji.length ? '（' + join(sf.ji) + '）' : ''}、煞星 ${sf.sha.length} 顆${sf.sha.length ? '（' + join(sf.sha) + '）' : ''}${sf.hua.length ? '，並見' + join(sf.hua) : ''}。${sf.score >= 3 ? '整體助力明顯多於阻力，屬於條件不錯的命盤，只要方向正確，付出容易得到回報。' : sf.score >= 0 ? '吉凶互見，助力與考驗大致相當，這是最常見也最真實的命盤結構：成就取決於你如何運用手上的資源。' : '煞忌的力量較重，人生的磨練比較直接，但古人說「煞星有制反為權」，這類命盤往往在專業技術、競爭性強的領域磨出過人的能力。'}`));
    out.push(`<h4>五行局</h4>` + P(ZW.JU[chart.ju]));
    out.push(`<h4>命主與身主</h4>` + P(`${ZW.ZHU[chart.mingZhu] || ''}${ZW.ZHU[chart.shenZhu] || ''}命主看的是先天的驅動力，身主看的是後天行事的習慣，兩者合看，可以理解你「為什麼而動」與「用什麼方式動」。`));
    out.push(`<h4>身宮</h4>` + P(ZW.SHEN_PAL[chart.cells[chart.shen].p] + `身宮代表後天的努力方向，通常在三十五歲以後影響力逐漸超過命宮；身宮內的星曜為 ${join(starList(chart.cells[chart.shen])) || '無主星'}。`));
    return out.join('');
  }

  function huaSection(chart) {
    const out = [P(`四化是紫微斗數的靈魂。你出生於${chart.yearGZ}年，年干為「${STEMS[chart.ys]}」，因此${HUA_NAMES.map(h => chart.hua[h] + '化' + h).join('、')}。這四顆星所在的宮位，就是你一生中資源、權力、名聲與課題最集中的四個地方。`)];
    HUA_NAMES.forEach(h => {
      const star = chart.hua[h], c = chart.cells[chart.pos[star]];
      out.push(`<h4>${star}化${h}｜在${palName(c.p)}</h4>` + P(ZW.HUA_GEN[h]) + P(ZW.HUA_STAR[h][star]) + P(ZW.HUA_PAL[h][c.p]));
    });
    const lu = chart.cells[chart.pos[chart.hua.祿]], ji = chart.cells[chart.pos[chart.hua.忌]];
    out.push(`<h4>祿忌的關係</h4>` + P(lu.i === ji.i ? `你的化祿與化忌落在同一個宮位（${palName(lu.p)}），稱為「祿忌同宮」。這個領域對你而言既是福氣也是課題，得到的同時伴隨著牽掛，吉凶參半、得失相隨，是你一生著力最深的地方。` :
      mod(lu.i - ji.i, 12) === 6 ? `你的化祿在${palName(lu.p)}，化忌在對面的${palName(ji.p)}，祿忌相沖。這條軸線是你命盤上最敏感的地方，${PALACES[lu.p]}得到的好處，容易因${PALACES[ji.p]}的問題而打折，兩個領域需要一起兼顧。` :
        `你的化祿在${palName(lu.p)}，化忌在${palName(ji.p)}。簡單地說，「${ZW.PAL_THEME[lu.p]}」是你這一生比較順、容易得到的領域；「${ZW.PAL_THEME[ji.p]}」則是你最在意、也最需要花力氣學習的功課。把從化祿得到的資源，用來照顧化忌所在的領域，是很實用的人生策略。`));
    return out.join('');
  }

  function palaceSection(chart, p) {
    const c = chart.byPalace(p), out = [], em = effMain(chart, c);
    out.push(`<p class="starsline">宮位：${c.stem}${c.branch}｜星曜：${join(starList(c)) || '無主星、無輔星'}${c.isShen ? '｜身宮在此' : ''}${c.decade ? `｜大限 ${c.decade[0]}–${c.decade[1]} 歲` : ''}</p>`);
    out.push(P(ZW.PAL_INTRO[p]));
    if (em.borrowed) {
      out.push(`<h4>本宮無主星</h4>` + P(`${palName(p)}內沒有主星，稱為「空宮」。空宮代表這個領域先天沒有固定的模式，變化空間大、容易受外在環境影響，也比較需要靠後天的經營。論斷時借對宮${palName(mod(p + 6, 12))}的主星 ${join(em.stars)} 來看，影響力略減，但方向一致。`));
    }
    em.stars.forEach(s => {
      const b = em.borrowed ? chart.cells[mod(c.i + 6, 12)].main.find(x => x.name === s).bright : c.main.find(x => x.name === s).bright;
      out.push(`<h4>${s}${em.borrowed ? '（借對宮）' : ''}｜${b}</h4>` + P(ZW.MAIN[s][p]) + P(`${s}${ZW.BRIGHT_TXT[tier(b)]}`));
    });
    out.push(ZW.pairText(chart, c));
    if (c.minor.length) {
      out.push(`<h4>輔星與雜曜</h4>`);
      c.minor.forEach(s => out.push(P(ZW.MINOR[s.name].c)));
      [...new Set(c.minor.map(s => typeOf(s.name)))].forEach(t => out.push(P(ZW.TYPE_PAL[t][p])));
      const ji = c.minor.filter(s => typeOf(s.name) === '吉').length, sha = c.minor.filter(s => typeOf(s.name) === '煞').length;
      if (ji && sha) out.push(P(`本宮吉星與煞星並見，代表這個領域有助力也有考驗，好事多磨、成中有敗。處理${ZW.PAL_THEME[p]}的事情時，把握貴人與資源的同時，不可掉以輕心。`));
    } else out.push(`<h4>輔星與雜曜</h4>` + P(`本宮沒有重要的輔星或煞星進駐，星曜組合單純，吉凶主要由主星的性質與三方四正會照的星曜來決定。`));
    const hs = [...c.main, ...c.minor].filter(s => s.hua);
    if (hs.length) {
      out.push(`<h4>生年四化</h4>`);
      hs.forEach(s => out.push(P(`${s.name}化${s.hua}在此。${ZW.HUA_STAR[s.hua][s.name]}${ZW.HUA_PAL[s.hua][p]}`)));
    }
    const sf = sanfang(chart, c.i);
    const desc = i => `${palName(chart.cells[i].p)}（${join(starList(chart.cells[i])) || '空宮'}）`;
    out.push(`<h4>三方四正</h4>` + P(`看一個宮位不能只看本宮，還要看對宮與三合宮位的星曜如何會照。${palName(p)}的對宮是${desc(sf.ids[1])}，三合宮位是${desc(sf.ids[2])}與${desc(sf.ids[3])}。四個宮位合計會見吉星 ${sf.ji.length} 顆${sf.ji.length ? '（' + join(sf.ji) + '）' : ''}、煞星 ${sf.sha.length} 顆${sf.sha.length ? '（' + join(sf.sha) + '）' : ''}${sf.hua.length ? '，四化有' + join(sf.hua) : '，沒有生年四化進入'}。${sf.score >= 3 ? `整體來看，「${ZW.PAL_THEME[p]}」這個領域得到的支援相當充足，是你命盤中比較順遂、可以放心發展的部分。` : sf.score >= 0 ? `整體來看，「${ZW.PAL_THEME[p]}」這個領域吉凶參半，有助力也有需要克服的地方，結果好壞與你投入的方式關係很大。` : `整體來看，「${ZW.PAL_THEME[p]}」這個領域受到的沖擊較多，是你命盤中需要多費心、宜守不宜躁進的部分。`}`));
    const fly = HUA[c.stem];
    out.push(`<h4>宮干飛化</h4>`);
    const dst = s => chart.cells[chart.pos[s]];
    const dL = dst(fly[0]), dJ = dst(fly[3]);
    out.push(P(`${palName(p)}的宮干是「${c.stem}」，${c.stem}干使${fly[0]}化祿。` + (dL.i === c.i ? `${fly[0]}就在本宮，形成「自化祿」：代表這個領域的福氣容易自己來、也容易自己流走，得到時要懂得留住，不必強求也別揮霍。` : `${fly[0]}位於你的${palName(dL.p)}，因此${palName(p)}化祿飛入${palName(dL.p)}：你在「${ZW.PAL_THEME[p]}」方面的善緣與資源，${ZW.FLY.祿[dL.p]}`)));
    out.push(P(`同一個宮干使${fly[3]}化忌。` + (dJ.i === c.i ? `${fly[3]}就在本宮，形成「自化忌」：代表這個領域的煩惱常是自己想出來的，事情來得快、忘得也快，卻容易反覆發生，需要提醒自己不要鑽牛角尖。` : `${fly[3]}位於你的${palName(dJ.p)}，因此${palName(p)}化忌飛入${palName(dJ.p)}：你在「${ZW.PAL_THEME[p]}」方面的執著與壓力，${ZW.FLY.忌[dJ.p]}${mod(dJ.i - c.i, 12) === 6 ? '由於化忌落在對宮，會回頭沖擊本宮，這個領域的起伏因此比較明顯。' : ''}`)));
    out.push(P(`另外，${fly[1]}化權飛入${palName(dst(fly[1]).p)}、${fly[2]}化科飛入${palName(dst(fly[2]).p)}，表示你在「${ZW.PAL_THEME[p]}」上的主導力會展現在「${ZW.PAL_THEME[dst(fly[1]).p]}」，而好名聲與化解之力則落在「${ZW.PAL_THEME[dst(fly[2]).p]}」。`));
    out.push(`<h4>小結與建議</h4>` + P(ZW.PAL_ADVICE[p][sf.score < 0 ? 1 : 0]));
    return out.join('');
  }

  function themes(chart) {
    const out = [], eff = p => effMain(chart, chart.byPalace(p)).stars, sc = p => sanfang(chart, chart.byPalace(p).i).score;
    const at = n => palName(chart.cells[chart.pos[n]].p);
    const lv = v => v >= 3 ? '條件充足' : v >= 0 ? '吉凶參半' : '考驗較多';
    out.push(P(`前面逐宮分析之後，這一章把相關的宮位合在一起，回答四個最常被問到的問題。`));
    out.push(`<h4>事業方向</h4>` + P(`看事業以官祿宮為主，命宮看你的本質，財帛宮看報酬的型態。你的命宮主星為 ${join(eff(0))}，官祿宮主星為 ${join(eff(8))}，財帛宮主星為 ${join(eff(4))}。` + [...new Set([...eff(8), ...eff(0)])].map(s => ZW.STAR_CAREER[s]).join('') + `綜合來看，適合你的工作是上述幾類的交集：既符合命宮的天性，又能用上官祿宮的做事方式。官祿宮三方四正的評估是「${lv(sc(8))}」${sc(8) < 0 ? '，事業上宜先累積一技之長，再圖發展' : '，可以放心在本業上深耕'}。`));
    out.push(`<h4>財富格局</h4>` + P(`看財富要分「賺」與「存」：財帛宮看賺錢的方式，田宅宮看能否存下來，福德宮看你對金錢的心態。你的財帛宮評估為「${lv(sc(4))}」，田宅宮評估為「${lv(sc(9))}」。你的財源線索在兩個地方：生年化祿（${chart.hua.祿}）落在${at(chart.hua.祿)}，祿存落在${at('祿存')}，這兩處所代表的領域，就是你一生中最容易帶來資源的地方。相對地，化忌（${chart.hua.忌}）落在${at(chart.hua.忌)}，與此相關的金錢支出或壓力需要預先規劃。${sc(9) >= sc(4) ? '你的田宅宮不弱於財帛宮，屬於存得住的類型，適合把收入逐步轉成不動產或長期資產。' : '你的財帛宮強過田宅宮，屬於賺得到但容易花掉的類型，務必建立強制儲蓄的機制。'}`));
    out.push(`<h4>感情與婚姻</h4>` + P(`看感情以夫妻宮為主，福德宮看你內心對感情的期待，子女宮與桃花星看緣分的多寡。你的夫妻宮主星為 ${join(eff(2))}。` + eff(2).map(s => ZW.STAR_LOVE[s]).join('') + `夫妻宮三方四正的評估是「${lv(sc(2))}」${sc(2) < 0 ? '，感情路上需要較多的磨合，晚一點定下來、慎選對象會比較順' : '，感情上有不錯的基礎，用心經營可以長久'}。桃花星方面，紅鸞在${at('紅鸞')}、天喜在${at('天喜')}、天姚在${at('天姚')}、咸池在${at('咸池')}，這些宮位所代表的場合與人際圈，是你比較容易遇到感情機會的地方；當大限或流年走到紅鸞、天喜所在的宮位時，也是婚戀喜事較容易發生的時間點。`));
    out.push(`<h4>健康與身心</h4>` + P(`看健康以疾厄宮為主，命宮看體質的根本，福德宮看精神壓力。你的疾厄宮主星為 ${join(eff(5))}，評估為「${lv(sc(5))}」；福德宮評估為「${lv(sc(10))}」。${sc(10) < sc(5) ? '你的福德宮比疾厄宮弱，代表身體的問題多半由心理壓力引起，照顧情緒就是照顧健康。' : '你的疾厄宮比福德宮更需要留意，代表生活作息與身體保養是重點，心態上你其實調適得不錯。'}六顆煞星之中，擎羊在${at('擎羊')}、陀羅在${at('陀羅')}、火星在${at('火星')}、鈴星在${at('鈴星')}、地空在${at('地空')}、地劫在${at('地劫')}；當大限或流年命宮走到煞星集中的宮位時，請特別留意安全、避免過勞，並提早安排健康檢查。`));
    return out.join('');
  }

  function minorNote(c, span) {
    const ji = c.minor.filter(s => typeOf(s.name) === '吉').map(s => s.name), sha = c.minor.filter(s => typeOf(s.name) === '煞').map(s => s.name),
      th = c.minor.filter(s => typeOf(s.name) === '桃花').map(s => s.name);
    let s = '';
    if (ji.length) s += `宮內有${join(ji)}同行，${span}貴人與助力明顯，遇事容易有人伸出援手。`;
    if (sha.length) s += `宮內見${join(sha)}，${span}的過程中多一分衝擊與波折，重大決定務必三思，並留意安全與健康。`;
    if (th.length) s += `又見${join(th)}，${span}人緣與感情機會增加。`;
    if (!s) s = `宮內沒有重要的吉星或煞星，${span}的吉凶以主星與四化為主，起伏相對單純。`;
    return s;
  }
  const HUA_SPAN = {
    祿: (th, sp) => `${sp}的機會、人緣與財源，多半從「${th}」而來，值得主動經營。`,
    權: (th, sp) => `${sp}你最需要主導、也最能展現能力的領域是「${th}」。`,
    科: (th, sp) => `${sp}的名聲、貴人與化解之力落在「${th}」，遇到困難可以從這裡找幫助。`,
    忌: (th, sp) => `${sp}最需要守、最容易卡關的地方是「${th}」，凡事宜保守，不要強求。`
  };
  const spanHua = (chart, stem, sp) => HUA[stem].map((s, i) => { const d = chart.cells[chart.pos[s]]; return P(`${s}化${HUA_NAMES[i]}，落在本命${palName(d.p)}：${HUA_SPAN[HUA_NAMES[i]](ZW.PAL_THEME[d.p], sp)}`); }).join('');

  function decadeSection(chart, nowAge) {
    const out = [P(`大限是以十年為單位的運勢。你是${chart.yang ? '陽' : '陰'}${chart.gender}，大限${chart.dir > 0 ? '順行' : '逆行'}，從${chart.ju}歲（虛歲）起，每十年換一個宮位當作「大限命宮」。大限命宮走到哪個本命宮位，那十年的人生主題就與該宮位息息相關；宮內的星曜決定這十年的性質，宮干引動的四化則指出這十年的機會與壓力所在。`)];
    chart.decades.filter(d => d.from <= 95).forEach(d => {
      const c = chart.cells[d.b], em = effMain(chart, c), cur = nowAge >= d.from && nowAge <= d.to;
      out.push(`<h4>第${NUM[d.k + 1] || d.k + 1}大限｜${d.from}–${d.to} 歲｜${c.stem}${c.branch}宮（本命${palName(c.p)}）${cur ? '<span class="now">目前所在</span>' : ''}</h4>`);
      out.push(P(ZW.AGE_STAGE.find(a => d.from <= a[0])[1] + ZW.DECADE_PAL[c.p]));
      out.push(P(`此限宮內主星為 ${join(em.stars)}${em.borrowed ? '（本宮無主星，借對宮）' : ''}。` + em.stars.map(s => ZW.STAR_DECADE[s]).join('') + minorNote(c, '這十年')));
      const hs = [...c.main, ...c.minor].filter(s => s.hua);
      if (hs.length) out.push(P(`本命的${hs.map(s => s.name + '化' + s.hua).join('、')}就在這個宮位，走到這一限時會被引動：${hs.map(s => s.hua === '忌' ? '化忌所代表的課題會浮上檯面，必須正面處理' : s.hua === '祿' ? '化祿帶來的福氣與機會會明顯兌現' : s.hua === '權' ? '化權讓你在這十年握有主導權與實質的責任' : '化科為這十年帶來名聲與貴人').join('；')}。`));
      out.push(P(`大限宮干為「${c.stem}」，引動的大限四化如下：`) + spanHua(chart, c.stem, '這十年'));
      const cai = chart.cells[mod(d.b - 4, 12)], guan = chart.cells[mod(d.b + 4, 12)], sf = sanfang(chart, d.b);
      out.push(P(`這一限的大限財帛宮落在本命${palName(cai.p)}（${join(starList(cai)) || '空宮'}），大限官祿宮落在本命${palName(guan.p)}（${join(starList(guan)) || '空宮'}）。大限三方四正合計見吉星 ${sf.ji.length} 顆、煞星 ${sf.sha.length} 顆。${sf.score >= 3 ? '這是助力充足的十年，適合積極進取、擴大版圖。' : sf.score >= 0 ? '這是平穩中帶有考驗的十年，按部就班、量力而為即可有所成。' : '這是磨練較多的十年，宜守不宜攻，把重心放在累積實力與照顧身心。'}`));
      out.push(ZW.decadeOverlay(chart, d));
    });
    return out.join('');
  }

  function yearSection(chart, year) {
    const out = [P(`流年是每一年的運勢。看流年的方法是：以該年地支所在的宮位為「流年命宮」，再以該年天干引動流年四化，看它們落入你本命的哪些宮位。以下推算近五年，年齡皆為虛歲。`)];
    for (let y = year; y < year + 5; y++) {
      const s = STEMS[mod(y - 4, 10)], b = mod(y - 4, 12), c = chart.cells[b], age = y - chart.lunar.year + 1, em = effMain(chart, c);
      const dec = chart.decades.find(d => age >= d.from && age <= d.to);
      out.push(`<h4>${y} 年（${s}${BR[b]}年）｜${age} 歲｜流年命宮在本命${palName(c.p)}</h4>`);
      out.push(P(ZW.YEAR_PAL[c.p].replace(/今年/g, y + ' 年')));
      out.push(P(`流年命宮內的主星為 ${join(em.stars)}${em.borrowed ? '（借對宮）' : ''}。` + em.stars.map(n => ZW.STAR_DECADE[n].replace(/這十年/g, '這一年')).join('') + minorNote(c, '這一年')));
      out.push(P(`${y} 年天干為「${s}」，流年四化如下：`) + spanHua(chart, s, '這一年'));
      const jiC = chart.cells[chart.pos[HUA[s][3]]];
      if (mod(jiC.i - b, 12) === 6) out.push(P(`留意：流年化忌落在流年命宮的對宮，直接沖擊流年命宮，這一年變動與壓力較大，重大決定宜多方求證、放慢腳步。`));
      else if (jiC.i === b) out.push(P(`留意：流年化忌就落在流年命宮，這一年容易自尋煩惱、勞心勞力，凡事親力親為，適合守成與進修，不宜擴張。`));
      if (chart.pos[chart.hua.忌] === chart.pos[HUA[s][3]] ) out.push(P(`此外，流年化忌與你本命的化忌落在同一宮（本命${palName(jiC.p)}），形成「雙忌」，該領域在這一年的壓力會特別集中，請提前準備。`));
      if (dec) { const dc = chart.cells[dec.b]; out.push(P(`這一年位於你 ${dec.from}–${dec.to} 歲的大限之中（大限命宮在本命${palName(dc.p)}）。流年的吉凶要放在大限的背景下看：大限好而流年差，是小波折；大限差而流年好，是喘息的機會。`)); }
    }
    return out.join('');
  }

  function closing() {
    return P(`命盤呈現的是傾向，而不是定數。同樣的星曜組合，放在不同的家庭背景、教育與選擇之下，會走出很不一樣的人生。讀這份命書最好的方式，是把它當成一面鏡子：對照自己的經驗，哪些描述確實如此、哪些已經透過努力改變了，然後在化忌所在的領域多一分耐心，在化祿所在的領域多一分珍惜。`) +
      P(`本命書採用常見的三合派安星法：以農曆生日與時辰安命身宮、以納音定五行局、依局數與生日安紫微，再布十四主星、六吉六煞、祿存天馬與常用雜曜，四化採「庚干太陽武曲太陰天同」的版本；小限依生年地支三合起宮、男順女逆；流月以流年斗君起正月，流日自流月命宮起初一，流時自流日命宮起子時。出生時間可依出生地經度與均時差校正為真太陽時，晚子時換日與閏月歸屬可在「進階設定」切換。不同門派在這些設定、庚干與壬干四化，以及星曜廟旺的判定上略有差異，若與其他排盤軟體的結果不同，多半是這些設定不同所致。流月、流日、流時的「吉、平、慎」是依三方四正的吉煞與四化落點計算出的相對評估，只供安排行程參考。疾厄宮的內容僅是傳統上對體質傾向的描述，不能取代醫療診斷。`);
  }

  function buildReport(chart, name, today, extra) {
    extra = extra || {};
    const who = name || '你', nowYear = ZW.toLunar(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate()).year, age = nowYear - chart.lunar.year + 1;
    const secs = [
      { id: 'overview', title: '命盤總覽', html: overview(chart, who, extra.info) },
      { id: 'hua', title: '生年四化', html: huaSection(chart) }
    ];
    for (let p = 0; p < 12; p++) secs.push({ id: 'pal' + p, title: palName(p), html: palaceSection(chart, p), palace: true });
    secs.push({ id: 'themes', title: '事業・財富・感情・健康', html: themes(chart) });
    secs.push({ id: 'decade', title: '十年大限', html: decadeSection(chart, age) });
    secs.push({ id: 'year', title: '流年與流月', html: ZW.yearSection(chart, nowYear) });
    secs.push({ id: 'days', title: '逐日流日', html: ZW.daysSection(chart, today, 60) });
    if (extra.partner) secs.push({ id: 'syn', title: '合盤｜' + extra.partner.name, html: ZW.synastry(chart, extra.partner.chart, extra.partner.name) });
    secs.push({ id: 'closing', title: '結語與說明', html: closing() });
    const count = secs.reduce((n, s) => n + (s.title + s.html.replace(/<[^>]+>/g, '')).replace(/\s/g, '').length, 0);
    return { secs, count, age };
  }
  ZW.R = { P, palName, join, starList, effMain, minorNote, spanHua };
  ZW.buildReport = buildReport;
})();
