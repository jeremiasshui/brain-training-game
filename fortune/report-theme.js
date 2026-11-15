/* 主題命書：現狀、四章、附錄、行動表。每節＝盤面依據＋飛化＋本文＋金句＋兩個帶代價的選項 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const { mod, BR, STEMS, PALACES, HUA, HUA_NAMES } = ZW, T = ZW.TH, CN = '一二三四五六';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const strip = s => s.replace(/<[^>]+>/g, ''), first = (s, n) => s.split('。').slice(0, n || 1).join('。') + '。';
  const pn = p => PALACES[p] + (p === 0 ? '' : '宮'), th = p => ZW.PAL_THEME[p];

  function ctxOf(chart, bazi, c, today) {
    c = Object.assign({}, c, bazi ? { mateEl: c.orient === '同性' ? ZW.brElem(bazi.db) : bazi.spouseEl } : {});
    const R = ZW.R, cell = p => chart.byPalace(p), eff = p => R.effMain(chart, cell(p));
    const line = p => { const x = cell(p), e = eff(p); return `${x.stem}${x.branch}宮・${x.main.length ? x.main.map(s => s.name + '（' + s.bright + '）' + (s.hua ? '化' + s.hua : '')).join('、') : '空宮，借對宮' + e.stars.join('、')}${x.minor.length ? '・' + x.minor.map(s => s.name + (s.hua ? '化' + s.hua : '')).join('、') : ''}`; };
    const score = p => ZW.sanfang(chart, cell(p).i).score, lv = v => v >= 3 ? '條件充足' : v >= 0 ? '吉凶參半' : '考驗較多';
    const at = n => chart.cells[chart.pos[n]].p;
    const fly = (p, i) => {
      const x = cell(p), star = HUA[x.stem][i], dp = at(star), self = dp === p, h = HUA_NAMES[i];
      const dup = i === 3 && chart.pos[star] === chart.pos[chart.hua.忌];
      const head = `${PALACES[p].replace('宮', '')}宮干${x.stem} → ${star}化${h} → ${self ? '自化（留在本宮）' : pn(dp)}${dup ? '（與生年忌同位，忌疊忌）' : ''}`;
      const text = self ? `${pn(p)}的宮干使本宮的${star}化${h}，稱為自化${h}：${i === 3 ? '這個領域的煩惱多半是自己想出來的，來得快、忘得也快，卻會反覆發生。' : '這個領域的好處容易自己來、也容易自己流走，要懂得留住。'}` :
        `${pn(p)}的宮干「${x.stem}」使${star}化${h}，飛入你的${pn(dp)}。你在「${th(p)}」上的${i === 3 ? '執著與壓力' : i === 0 ? '善緣與資源' : i === 1 ? '主導力' : '好名聲'}，${i === 3 ? ZW.FLY.忌[dp] : i === 0 ? ZW.FLY.祿[dp] : `會展現在「${th(dp)}」這個領域。`}` + (dup ? `而${pn(dp)}本來就坐著你的生年化忌，兩個忌疊在一起：這件事不是偶爾發生，是你一生反覆出現的主題。` : '') + (i === 3 && !self && mod(dp - p, 12) === 6 ? '化忌落在對宮，會回頭沖擊本宮，起伏因此特別明顯。' : '');
      return { head, text, dp, star, self, dup };
    };
    const nowY = today.getUTCFullYear(), ly = ZW.toLunar(nowY, today.getUTCMonth() + 1, today.getUTCDate()).year, age = ly - chart.lunar.year + 1;
    const dec = chart.decades.find(d => age >= d.from && age <= d.to) || chart.decades[0];
    const years = Array.from({ length: 10 }, (_, i) => { const yi = ZW.yearInfo(chart, ly + i), r = ZW.rate(chart, yi.b, yi.s), by = bazi ? bazi.yearOf(ly + i) : null; return { yi, r, by, tot: r.score + (by ? by.score * 3 : 0) }; });
    const rk = years.slice().sort((x, y) => y.tot - x.tot); years.forEach(y => { const i = rk.indexOf(y); y.tag = i < 3 ? '宜進' : i > 6 ? '宜守' : '平'; });   // 十年內的相對排序
    return { R, chart, bazi, c, cell, eff, line, score, lv, at, fly, ly, age, dec, years };
  }

  /* ---------- 各節內容 ---------- */
  function chapters(k) {
    const { chart, bazi, c, cell, eff, line, score, lv, at, fly, dec, years, R } = k, H = chart.hua, M = ZW.MAIN, j = R.join;
    const main = p => eff(p).stars.map(s => M[s][p]).join(''), borrowed = p => eff(p).borrowed ? `你的${pn(p)}沒有主星，這個領域先天沒有固定的模式，容易受環境與身邊的人影響；以下借對宮的星來看，力量約打七折。` : '';
    const pair = p => { const src = cell(p).main.length ? cell(p) : chart.cells[mod(cell(p).i + 6, 12)]; return src.main.length === 2 ? ZW.PAIR[src.main.map(s => s.name).join('')] || '' : ''; };
    const huaAt = h => `${H[h]}化${h}，在${pn(at(H[h]))}`;
    const sf0 = ZW.sanfang(chart, chart.ming), empties = [...Array(12).keys()].filter(p => !cell(p).main.length);
    const types = p => [...new Set(cell(p).minor.map(s => ZW.typeOf(s.name)))];
    const yl = y => `${y.yi.ly} 年（${STEMS[y.yi.s]}${BR[y.yi.b]}，${y.yi.age} 歲）`;
    const best = years.slice().sort((a, b) => b.tot - a.tot)[0], worst = years.slice().sort((a, b) => a.tot - b.tot)[0];
    const luan = years.filter(y => [chart.pos.紅鸞, chart.pos.天喜, cell(2).i].includes(y.yi.b));
    const f = {};
    const S = (basis, flies, body) => ({ basis, flies: flies.filter(Boolean), body: body.filter(Boolean) });
    const jiP = at(H.忌), f03 = fly(0, 3);

    f.c1 = [
      S([['命宮', line(0)], ['身宮', pn(chart.cells[chart.shen].p)]], [], [borrowed(0), main(0), pair(0)]),
      S([['生年化祿', huaAt('祿')], ['生年化科', huaAt('科')], ['命宮三方吉星', j(sf0.ji) || '無']], [], [ZW.HUA_STAR.祿[H.祿] + ZW.HUA_PAL.祿[at(H.祿)], ZW.HUA_STAR.科[H.科] + ZW.HUA_PAL.科[at(H.科)], sf0.ji.length ? `命宮三方四正另有${j(sf0.ji)}會照，這些是你不必爭取就有的助力：有人願意幫你、有資源可用。` : '你的命宮三方沒有吉星會照，福氣不靠別人送，主要落在上面化祿與化科所在的兩個領域。']),
      S([['空宮', empties.length ? j(empties.map(pn)) : '無'], ['命宮三方煞星', j(sf0.sha) || '無']], [], [empties.length ? `你的${j(empties.map(pn))}沒有主星。空宮代表那個領域你出生時沒有帶著現成的做法，別人理所當然會的事，你要到比較晚才摸出自己的方法：${j(empties.map(p => '「' + th(p) + '」'))}。` : '你的十二宮都有主星，沒有空宮，各個生活領域都有先天的模式可循。', ...[0, 4, 8, 6].filter(p => types(p).includes('煞')).map(p => ZW.TYPE_PAL.煞[p]), sf0.sha.length ? '' : `命宮三方沒有煞星，你的缺不在外在的阻力，而在化忌所在的${pn(jiP)}。`]),
      S([['生年化忌', huaAt('忌')], ['命宮宮干', chart.cells[chart.ming].stem]], [f03], [ZW.HUA_GEN.忌 + ZW.HUA_STAR.忌[H.忌], ZW.HUA_PAL.忌[jiP], f03.text, `${T.PUNCH[jiP][0]}，${T.PUNCH[jiP][1]}。這就是你的習氣：不是懲罰，是一個重複太多次、已經變成反射動作的習慣。`]),
      S([['生年化權', huaAt('權')], ['身宮', pn(chart.cells[chart.shen].p)]], [fly(0, 0)], [ZW.HUA_STAR.權[H.權] + ZW.HUA_PAL.權[at(H.權)], ZW.SHEN_PAL[chart.cells[chart.shen].p], fly(0, 0).text + '這是你自己能主動給出去、也最容易有回報的方向。']),
      S([['福德宮', line(10)], ['命主・身主', chart.mingZhu + '・' + chart.shenZhu]], [], [borrowed(10), main(10), (ZW.ZHU[chart.mingZhu] || '') + (ZW.ZHU[chart.shenZhu] || '')])
    ];
    const f43 = fly(4, 3), f103 = fly(10, 3);
    f.c2 = [
      S([['財帛宮', line(4)], ['三方評估', lv(score(4))]], [], [borrowed(4), main(4), pair(4), bazi ? `八字上你的日主屬於${bazi.level}，財星（${ZW.EL[bazi.rel(2)]}）約占 ${Math.round(bazi.w[bazi.rel(2)] / bazi.total * 100)}%。${bazi.strong ? '身強的人擔得起財，重點在找到財路。' : '身弱的人財來了未必接得住，要先靠專業、資歷與夥伴把自己撐起來。'}` : '']),
      S([['生年化祿', huaAt('祿')], ['祿存', pn(at('祿存'))]], [fly(4, 0)], [`你的生年化祿在${pn(at(H.祿))}，祿存在${pn(at('祿存'))}。這兩個宮位代表的「${th(at(H.祿))}」與「${th(at('祿存'))}」，就是你這一生最容易帶來資源的方向：你在這裡做的事，比在別處省力。`, fly(4, 0).text, eff(8).stars.map(s => ZW.STAR_CAREER[s]).join('')]),
      S([['財帛宮干', cell(4).stem], ['地空・地劫', pn(at('地空')) + '・' + pn(at('地劫'))]], [f43], [f43.text, `地空在${pn(at('地空'))}、地劫在${pn(at('地劫'))}。這兩顆星所在的領域，是錢最容易無聲流走的地方：「${th(at('地空'))}」上的計畫容易落空，「${th(at('地劫'))}」上容易有突然的破耗。`, bazi && bazi.grp(0) >= 2 ? ZW.BZ.LEAK.比劫 : bazi && bazi.grp(1) >= 2 ? ZW.BZ.LEAK.食傷 : '']),
      S([['福德宮', line(10)], ['福德宮干', cell(10).stem]], [f103], ['財帛宮的正對面是福德宮。你怎麼看待錢，其實取決於你心裡真正在追的東西。', first(main(10), 3), f103.text, jiP === 4 || jiP === 10 || jiP === 9 ? `你的生年化忌就落在${pn(jiP)}，錢與安全感對你來說是綁在一起的，這是你財業的核心。` : '']),
      S([['官祿宮', line(8)], ['官祿三方評估', lv(score(8))]], [fly(8, 0)], [[...new Set([...eff(8).stars, ...eff(0).stars])].map(s => ZW.STAR_CAREER[s]).join(''), fly(8, 0).text, D(c.job)]),
      S([['田宅宮', line(9)], ['田宅三方評估', lv(score(9))]], [], [borrowed(9), main(9), score(9) >= score(4) ? '你的田宅宮不弱於財帛宮，屬於存得住的類型，適合把收入逐步轉成不動產或長期資產。' : '你的財帛宮強過田宅宮，賺得到但容易花掉。錢要成為你的，得先進到你拿不走的地方：強制儲蓄、長期資產。'])
    ];
    const f23 = fly(2, 3), f20 = fly(2, 0), relKey = c.rel === '已經結婚了' ? 2 : c.rel === '有對象了' ? 1 : 0;
    const sf2 = ZW.sanfang(chart, cell(2).i);
    f.c3 = [
      S([['夫妻宮', line(2)]], [], [borrowed(2), main(2), pair(2), eff(2).stars.map(s => ZW.STAR_LOVE[s]).join('')]),
      S([['夫妻宮干', cell(2).stem], ['生年化忌', huaAt('忌')]], [f23], [f23.text, f23.dp === 0 ? '夫妻宮的忌飛進命宮：關係裡出的問題，會原封不動變成你對自己的判決。而且下判決的是你自己，不是對方。' : f23.dp === 10 ? '夫妻宮的忌飛進福德宮：感情的事會直接佔滿你的腦子，結束之後心還停在那裡，是因為你一直在腦中重演。' : `感情結束之後，你放不下的其實不是那個人，而是它在「${th(f23.dp)}」上留下的那個沒解完的結。`]),
      S([['夫妻宮輔星', j(cell(2).minor.map(s => s.name)) || '無'], ['福德宮', line(10)]], [], [...types(2).map(t => ZW.TYPE_PAL[t][2]), ...cell(2).minor.map(s => ZW.MINOR[s.name].c), cell(2).minor.length ? '' : '你的夫妻宮沒有煞星與桃花星，戀愛中的不安不是對方造成的，多半來自你自己的福德宮：' + first(main(10), 2)]),
      S([['夫妻宮三方四正', `吉星 ${sf2.ji.length}、煞星 ${sf2.sha.length}${sf2.hua.length ? '、' + j(sf2.hua) : ''}`], ['評估', lv(sf2.score)]], [], [`夫妻宮要連同對面的官祿宮、三合的遷移宮與福德宮一起看。你這四個宮位合計${sf2.ji.length ? '有' + j(sf2.ji) + '相助' : '沒有吉星'}${sf2.sha.length ? '，也有' + j(sf2.sha) + '同時作用' : ''}。${sf2.score < 0 ? '感情對你是需要學的事，同樣的問題會換個人再來一次，直到你換一種做法。' : '感情的基本條件不差，重複出現的問題多半不在對象，而在你進入關係後的固定反應。'}`, bazi ? '八字的日支說的是同一件事：' + ZW.BZ.LOVE[bazi.P.day.tenB] : '']),
      S([['紅鸞・天喜', pn(at('紅鸞')) + '・' + pn(at('天喜'))], ['近十年引動的年份', luan.length ? j(luan.map(y => y.yi.ly)) : '無']], [], [['你現在未婚。往後的緣分是新的開始還是舊戲重演，看的不是對方，是你這次有沒有換一種方式開始。', '你現在有交往的對象。這個人能不能從戀愛走進生活，關鍵在你們怎麼處理第一次真正的利害衝突：錢、家人、住哪裡。', '你已經結婚。現在看的不是緣分來不來，而是兩個人還能不能看向同一個地方。'][relKey], luan.length ? `往後十年中，流年走到紅鸞、天喜或你的夫妻宮的年份是 ${j(luan.map(yl))}。${['這幾年是緣分最容易動的時候，請多出門、多答應邀約。', '這幾年適合把關係往下一步推：見家長、同居、訂婚或結婚。', '這幾年夫妻關係容易有新的變化，可以是重新靠近，也可能是外來的誘惑，要有意識地經營。'][relKey]}` : '往後十年沒有明顯引動紅鸞、天喜的年份，緣分的進展靠的是日常的經營而非時機。', bazi && c.mateEl !== undefined ? `八字上配偶星屬${ZW.EL[c.mateEl]}，合得來的對象氣質是「${ZW.BZ.MATE[c.mateEl].mind}」。` : '']),
      S([['夫妻宮干化祿', f20.head]], [f20], [f20.text, `值得你留下的人，是能讓你在「${th(f20.dp)}」上變得更好的人。` + eff(2).stars.map(s => ZW.STAR_LOVE[s]).join('')])
    ];
    const dc = chart.cells[dec.b], fd = HUA[dc.stem], dJ = at(fd[3]), dL = at(fd[0]), f73 = fly(7, 3);
    f.c4 = [
      S([['目前大限', `${dec.from}–${dec.to} 歲，${dc.stem}${dc.branch}宮（本命${pn(dc.p)}）`], ['大限四化', fd.map((s, i) => s + '化' + HUA_NAMES[i]).join('、')]], [], [ZW.DECADE_PAL[dc.p], R.effMain(chart, dc).stars.map(s => ZW.STAR_DECADE[s]).join(''), strip(ZW.decadeOverlay(chart, dec))]),
      S([['最順的一年', yl(best)], ['最需保守的一年', yl(worst)]], [], [`往後十年逐年的評估${bazi ? '（紫微流年與八字流年合看）' : ''}，這是十年之內互相比較的結果，最好的三年標為宜進、最弱的三年標為宜守：` + years.map(y => `${y.yi.ly} 年${y.tag}`).join('、') + '。', `${yl(best)}是這十年裡阻力最小的一年，流年命宮在本命${pn(chart.cells[best.yi.b].p)}：${first(ZW.YEAR_PAL[chart.cells[best.yi.b].p].replace(/今年/g, '這一年'), 1)}重要的開始，盡量放在這一年前後。`, `${yl(worst)}是最需要保守的一年，流年命宮在本命${pn(chart.cells[worst.yi.b].p)}。那一年不借錢、不擔保、不做回不了頭的決定。`]),
      S([['交友宮', line(7)], ['天魁・天鉞', pn(at('天魁')) + '・' + pn(at('天鉞'))]], [fly(7, 0)], [borrowed(7), main(7), `你的天魁在${pn(at('天魁'))}、天鉞在${pn(at('天鉞'))}：貴人多半從「${th(at('天魁'))}」與「${th(at('天鉞'))}」這兩個方向出現。`, bazi ? `八字的天乙貴人在${bazi.noble.map(x => BR[x]).join('、')}，生肖屬${bazi.noble.map(x => ZW.ZODIAC[x]).join('、')}的人對你有助力。` : '']),
      S([['交友宮干', cell(7).stem], ['交友宮煞星', j(cell(7).minor.filter(s => ZW.typeOf(s.name) === '煞').map(s => s.name)) || '無']], [f73], [f73.text, types(7).includes('煞') ? ZW.TYPE_PAL.煞[7] : '你的交友宮沒有煞星，會拖累你的不是明顯的壞人，而是那些讓你不好意思拒絕的人。', bazi ? `八字上與你日支相沖的是${BR[mod(bazi.db + 6, 12)]}，生肖屬${ZW.ZODIAC[mod(bazi.db + 6, 12)]}的人與你節奏相反，合夥與金錢往來要多一分謹慎。` : '']),
      S([['大限化忌', `${fd[3]}化忌，落本命${pn(dJ)}`], ['大限化祿', `${fd[0]}化祿，落本命${pn(dL)}`]], [], [`這個大限的化忌落在本命${pn(dJ)}。這十年你最該放下的，是對「${th(dJ)}」的執著：越想抓緊，它越卡住你。`, `相對地，大限化祿落在本命${pn(dL)}，「${th(dL)}」是這十年最願意回報你的地方。把從前者省下來的力氣，放到後者。`, T.STOP[dJ]]),
      S([['寫信的時間', `${k.ly + 10} 年，你 ${k.age + 10} 歲`]], [], [`給 ${k.ly} 年的我：`, `你現在最煩的那件事，十年後回頭看，只是「${th(jiP)}」這門功課的其中一堂。我沒有變成另一個人，我只是不再用老方法處理它了。`, `${best.yi.ly} 年那個機會，謝謝你沒有因為害怕而放掉；${worst.yi.ly} 年那一次，謝謝你忍住沒有硬衝。`, `你一直以為要先解決「${th(jiP)}」才能開始過日子。其實是反過來：你把力氣放到「${th(at(H.祿))}」之後，那件事才慢慢鬆開。`, '命盤上寫的那些，我都遇到了。但怎麼走過去，是你一步一步選的。'])
    ];
    const pv = chart.decades.filter(d => [9, 11].includes(chart.cells[d.b].p)).map(d => `${d.from}–${d.to} 歲（大限走${pn(chart.cells[d.b].p)}）`), f113 = fly(11, 3), f33 = fly(3, 3);
    f.pa = [
      S([['父母宮', line(11)]], [], [borrowed(11), main(11)]),
      S([['父母宮干化祿', fly(11, 0).head]], [fly(11, 0)], [fly(11, 0).text, `父母給你最實在的東西，落在你的「${th(fly(11, 0).dp)}」。兄弟宮是${line(1)}：${first(main(1), 2)}`]),
      S([['父母宮三方', lv(score(11))], ['父母宮四化', j([...cell(11).main, ...cell(11).minor].filter(s => s.hua).map(s => s.name + '化' + s.hua)) || '無']], [fly(11, 1)], [fly(11, 1).text.replace('主導力', '期待與要求'), ZW.TYPE_PAL[types(11)[0] || '吉'][11], jiP === 11 ? ZW.HUA_PAL.忌[11] : '']),
      S([['父母宮干化忌', f113.head]], [f113], [f113.text, `你們每次爭執，最後都會繞回「${th(f113.dp)}」這件事。那才是真正沒談完的題目。`]),
      S([['田宅宮', line(9)], ['相關大限', j(pv) || '無']], [], [first(main(9), 3), pv.length ? `你的大限走到田宅宮或父母宮的年紀是 ${j(pv)}。這些年是家裡的居住、照顧與財務最需要重新安排的時候，宜提早談。` : '']),
      S([['父母宮評估', lv(score(11))]], [], [ZW.PAL_ADVICE[11][score(11) < 0 ? 1 : 0], '該還的是時間、照顧與一句說出口的感謝；不必交出去的，是你對自己人生的決定權。'])
    ];
    f.ch = [
      S([['子女宮', line(3)]], [], [borrowed(3), main(3)]),
      S([['子女宮干化祿', fly(3, 0).head]], [fly(3, 0)], [fly(3, 0).text, `孩子帶給你的那道光，會照在你的「${th(fly(3, 0).dp)}」上。`]),
      S([['子女宮干化忌', f33.head]], [f33], [f33.text, `你最可能不小心傳下去的，是你自己在「${th(jiP)}」上還沒處理完的東西。先處理自己的，才不會交到孩子手上。`]),
      S([['子女宮輔星', j(cell(3).minor.map(s => s.name)) || '無']], [], [...types(3).map(t => ZW.TYPE_PAL[t][3]), cell(3).minor.length ? '' : '你的子女宮星曜單純，親子之間少有激烈的衝突，要留意的反而是保護過度。']),
      S([['子女宮評估', lv(score(3))]], [fly(3, 2)], [ZW.PAL_ADVICE[3][score(3) < 0 ? 1 : 0], fly(3, 2).text])
    ];
    return f;
  }
  const D = job => (ZW.BZ && ZW.BZ.JOB[job]) || '';

  /* ---------- 版面 ---------- */
  function renderSec(def, data, n, ai) {
    const [t, sub, core, quote, o1, o2, dao, src] = def, a = ai || {};
    const body = (a.body && a.body.length ? a.body.map(esc) : data.body), opts = a.options && a.options.length === 2 ? a.options.map(o => [esc(o.choice), esc(o.cost)]) : [o1, o2];
    return `<div class="ts"><h4><span class="tn">${CN[n]}</span>${t}${core ? '<span class="core">核心</span>' : ''}</h4><p class="tsub">${sub}</p>` +
      `<div class="basis">${data.basis.map(([k2, v]) => `<div><b>${k2}</b><span>${v}</span></div>`).join('')}</div>` +
      data.flies.map(f => `<div class="flyb"><i>飛化</i>${f.head}</div>`).join('') + body.map(p => `<p>${p}</p>`).join('') +
      `<blockquote>「${a.quote ? esc(a.quote) : quote}」</blockquote><p class="dao">道家怎麼看：「${dao}」${src}</p>` + (a.mirror && a.mirror.length ? `<ul class="mirror">${a.mirror.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : '') +
      `<div class="tops">${opts.map((o, i) => `<div><b>選項${'一二'[i]}</b>${o[0]}<i>代價：${o[1]}</i></div>`).join('')}</div></div>`;
  }
  const CH = [['c1', '第一章｜我的稟賦與習氣', '天生帶來的，在哪裡養成了習氣，又能往哪裡修'], ['c2', '第二章｜我的財與庫', '錢從哪裡進來，又會留在哪裡'], ['c3', '第三章｜我的情與緣', '心動從哪裡開始，最後又會成為什麼關係'], ['c4', '第四章｜未來十年，順時而行', '十年的門從哪裡打開，最後又落在哪裡']];
  const appx = c => c.rel === '已經結婚了' ? ['ch', '附錄｜我要傳下去的', '我從父母那裡收到的，會如何流向下一代'] : ['pa', '附錄｜最初養成我的地方', '我收到的一切，該在哪裡停下，又該以什麼方式還回去'];

  function intro(k, ai) {
    const { chart, c, eff, line, at } = k, a = ai || {}, jiP = at(chart.hua.忌);
    const faces = a.faces && a.faces.length ? a.faces.map(f => [esc(f.outer), esc(f.inner)]) : [...eff(0).stars, ...eff(10).stars].flatMap(s => T.FACE[s]).slice(0, 4);
    const punch = a.punch ? [esc(a.punch.not), esc(a.punch.is)] : T.PUNCH[jiP];
    const M = ZW.MAIN, one = p => first(M[eff(p).stars[0]][p], 2);
    const now = a.now ? ['money', 'work', 'love', 'home', 'body'].map(x => esc(a.now[x])) : [one(4), (D(c.job) ? first(D(c.job), 2) : '') + first(M[eff(8).stars[0]][8]), (ZW.BZ.REL[c.rel] ? first(ZW.BZ.REL[c.rel]) : '') + first(M[eff(2).stars[0]][2]), one(9), one(5)];
    return `<div class="card2"><div class="cr"><b>農曆</b><span>${chart.yearGZ}年 ${chart.lunar.leap ? '閏' : ''}${chart.lunar.month}月 ${chart.lunar.day}日</span></div><div class="cr"><b>生時</b><span>${BR[chart.hour]}時・${chart.yang ? '陽' : '陰'}${chart.gender}</span></div><div class="cr"><b>命宮</b><span>${line(0)}</span></div><div class="cr"><b>生年忌</b><span>${chart.hua.忌}，在${pn(jiP)}</span></div></div>` +
      (c.concern ? `<p class="say">你說：「${c.concern}」。這件事我記下了。先從你這個人看起，答案多半在裡面。</p>` : '<p class="say">先別急。我先說你現在的樣子，再說為什麼，最後說往哪裡走。</p>') +
      `<div class="faces"><div class="fh"><span>別人看到的 <b>表</b></span><span><b class="li">裏</b> 實際上的</span></div>${faces.map(f => `<div class="fr"><span>${f[0]}</span><span>${f[1]}</span></div>`).join('')}</div>` +
      `<p class="punch">${punch[0]}<br><strong>${punch[1]}</strong></p>` +
      `<h4>這本命書會講到的</h4><div class="nowg">${['錢', '工作', '感情', '家裡', '身體'].map((n, i) => `<div><b>${n}</b><span>${now[i]}</span></div>`).join('')}</div>` +
      `<p>迷茫不是壞事，它只是在告訴你：原來的走法該換了。你為這些事煩惱是有原因的，原因就在命盤上。紫微斗數是一張十二格的地圖，把你這輩子會碰到的十二件事各分一格，再看哪一顆星落進哪一格。它看的是結構：什麼東西放在哪裡、彼此怎麼拉扯，所以答得出「為什麼每次都這樣」。以下四章，每一節都從你盤上的某一格出發，先列出盤面依據，再說白話，最後給你兩個選項與各自的代價。</p>`;
  }
  function actions(k, pid) {
    const { chart, bazi, at, years, fly } = k, H = chart.hua, jiP = at(H.忌), best = years.slice().sort((a, b) => b.tot - a.tot)[0], worst = years.slice().sort((a, b) => a.tot - b.tot)[0];
    const items = [
      `這個月：把「${th(jiP)}」上拖最久的那一件事寫下來，只寫事實，不寫感覺。`,
      `這個月：在「${th(at(H.祿))}」上多做一件事。這是你化祿所在，力氣花在這裡回報最高。`,
      `三個月內：補上錢包最大的洞。你的財帛宮化忌飛入${pn(fly(4, 3).dp)}，先從「${th(fly(4, 3).dp)}」的支出查起。`,
      `三個月內：對一個你一直不好意思拒絕的人，說一次「不」。`,
      `今年：在「${th(at(H.權))}」上爭取一個由你作主的位置或任務，這是你化權所在。`,
      `${best.yi.ly} 年之前：把想做的那件大事準備到隨時可以開始，那一年是十年裡阻力最小的時候。`,
      `${worst.yi.ly} 年：不借錢、不擔保、不做回不了頭的決定，並安排一次完整的健康檢查。`,
      bazi ? `日常：多用你的喜用五行「${ZW.EL[bazi.primary]}」，顏色${ZW.BZ.LUCK[bazi.primary].color}，方位${ZW.BZ.LUCK[bazi.primary].dir}。` : `日常：每週留一段不為任何人的時間。`
    ];
    return `<p>看懂之後要能走得出去。下面是依你的命盤排出來的行動表，做完一項就勾一項，勾選的狀態會存在這台裝置上。</p><div class="todo" data-pid="${esc(pid)}">${items.map((t, i) => `<label><input type="checkbox" data-i="${i}"><span>${t}</span></label>`).join('')}</div>` +
      `<h4>停損線</h4><p class="stop">${T.STOP[jiP]}</p><p>停損線是事先訂好的。等到事情發生時才決定要不要停，通常已經停不下來了。</p>`;
  }

  ZW.themeBuild = function (chart, bazi, c, today, ai, pid) {
    const k = ctxOf(chart, bazi, c, today), data = chapters(k), list = [...CH, appx(c)]; ai = ai || {};
    const secs = [{ id: 'now', title: '現狀', html: intro(k, ai.intro) }];
    list.forEach(([key, title, sub]) => secs.push({ id: key, title, html: `<p class="chsub">${sub}</p>` + T.SEC[key].map((d, n) => renderSec(d, data[key][n], n, (ai[key] || [])[n])).join(''), ai: !!ai[key] }));
    secs.push({ id: 'act', title: '行動表與停損線', html: actions(k, pid) });
    return { secs, data, list, k };
  };

  /* 給 AI 的命盤事實 */
  ZW.factSheet = function (chart, bazi, c, k) {
    const L = [];
    L.push(`【命主】稱呼：${c.who}；性別：${chart.gender}；取向：${c.orient}；感情狀態：${c.rel}；工作狀態：${c.job}；虛歲：${k.age}；今年：${k.ly}`);
    L.push(`【命主寫下的心事】${c.concernRaw || '（未填）'}`);
    L.push(`【紫微斗數】農曆${chart.yearGZ}年${chart.lunar.month}月${chart.lunar.day}日${BR[chart.hour]}時，${chart.element}${chart.ju}局，命主${chart.mingZhu}，身主${chart.shenZhu}，身宮在${pn(chart.cells[chart.shen].p)}，生年四化：${HUA_NAMES.map(h => chart.hua[h] + '化' + h + '在' + pn(k.at(chart.hua[h]))).join('、')}`);
    for (let p = 0; p < 12; p++) L.push(`${pn(p)}：${k.line(p)}；大限 ${k.cell(p).decade.join('–')} 歲；三方${k.lv(k.score(p))}；宮干化祿入${pn(k.fly(p, 0).dp)}、化忌入${pn(k.fly(p, 3).dp)}${k.fly(p, 3).dup ? '（與生年忌同位）' : ''}`);
    L.push(`【目前大限】${k.dec.from}–${k.dec.to} 歲，在本命${pn(chart.cells[k.dec.b].p)}`);
    L.push('【往後十年】' + k.years.map(y => `${y.yi.ly}${STEMS[y.yi.s]}${BR[y.yi.b]}（流年命宮在本命${pn(chart.cells[y.yi.b].p)}，${y.tag}）`).join('、'));
    if (bazi) L.push(`【八字】${bazi.list.map(p => p.gz).join(' ')}；日主${STEMS[bazi.ds]}${ZW.EL[bazi.me]}，${bazi.level}；月令${bazi.P.month.tenB}；日支${bazi.P.day.tenB}；喜用${bazi.favor.map(e => ZW.EL[e]).join('')}，最喜${ZW.EL[bazi.primary]}；忌${bazi.avoid.map(e => ZW.EL[e]).join('')}；十神：${Object.entries(bazi.tens).map(([a, b]) => a + b).join('、')}；神煞：${bazi.shen.join('、') || '無'}；目前大運：${(bazi.decades.find(d => k.age >= d.from && k.age <= d.to) || {}).gz || '未起運'}`);
    return L.join('\n');
  };
})();
