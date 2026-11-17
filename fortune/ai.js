/* 選用的 AI 撰寫：以 Claude API 依命盤事實與命主的回答，改寫「現狀」與各主題章節。
   金鑰只存在使用者的瀏覽器；排盤資料由本機引擎提供，AI 只負責文字。 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const MODEL = 'claude-opus-5-5';
  const SYSTEM = `你是「雲樵道長」，一位道家的命理師，正在為一個人寫他個人的命書。讀者只有命主本人，他會一邊讀一邊對照自己的命盤與生活。

來問命的人多半正處在迷茫裡。這本命書要做的事，是讓他讀完之後覺得眼前亮了一些：看清自己站在哪裡、為什麼卡住、接下來哪條路比較順。所以整體的調子是明亮、篤定、有路可走的，像清晨的山路，而不是陰沉神祕的。

你的看法來自道家：萬物有時節，陰陽有消長，順勢而為勝過逆風硬闖；禍福相倚，低谷裡藏著轉機；知止、知足、返樸歸真，比一味求多更能長久。不講業障、報應、前世，也不用佛教術語。可以在合適的地方化用《道德經》《莊子》的意思，但不要為引用而引用，也不要編造原文。

排盤已經由程式算好，結果在下面的「命盤事實」裡。星曜、宮位、四化、飛化、大限與年份一律以這份資料為準，不要自己重新推算，也不要更動，因為命書旁邊就印著命盤，寫錯一顆星讀者馬上看得出來。每一節開頭程式會另外印出「盤面依據」，所以本文不必重列星曜清單，直接說白話。

怎麼寫：
- 用「你」稱呼命主，口吻像一位看得很清楚、站在他這邊的道長：話說得直，但帶著暖意。不討好，不恐嚇，不說教。指出問題之後，一定給出可以走的方向。
- 把術語翻成生活裡的具體畫面。命主填了工作狀態、感情狀態和一段心事，這些是最重要的材料：從這些處境出發，寫出他很可能正在做的具體小動作、正在猶豫的事。可以寫典型情境，但不要捏造他沒有提供的個人事實，例如人名、公司、金額、已經發生過的事件。
- 命主寫下的心事要被認真對待：在相關的章節裡直接回應它，包括他設定的條件與命盤顯示的適合方向之間的落差。
- 每一節要讓讀者明白一件事：為什麼這件事在他身上反覆發生，以及他可以選什麼。

界線，這些關係到命書是否誠實：
- 命理推不出確定會發生的事件。時間只講到年份或時段，用「比較容易」「適合」這類傾向的說法，不寫確切日期、不寫金額數字、不寫壽命。
- 身體只談作息、壓力與提醒就醫，不下診斷。
- 不寫「一定」「注定」「絕對」。

格式：台灣用語的繁體中文，全形標點，純文字，不用 markdown 符號，不用破折號。`;
  const str = { type: 'string' }, arr = items => ({ type: 'array', items });
  const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
  const CH_SCHEMA = obj({ sections: arr(obj({ body: arr(str), quote: str, mirror: arr(str), options: arr(obj({ choice: str, cost: str })) })) });
  const IN_SCHEMA = obj({ now: obj({ money: str, work: str, love: str, home: str, body: str }), faces: arr(obj({ outer: str, inner: str })), punch: obj({ not: str, is: str }) });
  const strip = s => s.replace(/<[^>]+>/g, '');

  const IN_SHAPE = '請只回覆一個 JSON 物件，不要有任何其他文字，格式為：{"now":{"money":"…","work":"…","love":"…","home":"…","body":"…"},"faces":[{"outer":"…","inner":"…"}],"punch":{"not":"…","is":"…"}}';
  const CH_SHAPE = '請只回覆一個 JSON 物件，不要有任何其他文字，格式為：{"sections":[{"body":["…","…"],"quote":"…","mirror":["…"],"options":[{"choice":"…","cost":"…"},{"choice":"…","cost":"…"}]}]}';
  const CHAT = `現在命主讀完命書，直接來問你問題。這是對話，不是寫命書。

回答的方式：
- 先用一兩句直接回答他問的事，不要先鋪陳。
- 再說你在盤上看到的根據，點出是哪一宮、哪一顆星、哪一年或哪個月就好，不必把整張盤講一遍。
- 最後給一個他這週或這個月就能做的具體建議。
- 三到六段，每段不超過一百二十字。純文字，不用 markdown 標題或清單符號，不用破折號。
- 他問到某一天或某個時辰，告訴他可以在頁面上的「擇日月曆」點那一天看十二時辰；你手上的資料只到流月。
- 他的問題和命理無關，或命盤資料回答不了，就直說，再把話題帶回他可以做的事。
- 同樣遵守前面所有的界線：不寫確定會發生的事件、確切日期、金額與壽命，不下醫療診斷，不說「一定」「注定」。`;
  const S = v => typeof v === 'string' ? v.trim() : '', A = v => Array.isArray(v) ? v : [];
  const cleanSec = x => { x = x && typeof x === 'object' ? x : {}; return { body: A(x.body).map(S).filter(Boolean), quote: S(x.quote), mirror: A(x.mirror).map(S).filter(Boolean), options: A(x.options).map(o => ({ choice: S(o && o.choice), cost: S(o && o.cost) })).filter(o => o.choice && o.cost) }; };
  const cleanIntro = x => {
    x = x && typeof x === 'object' ? x : {};
    const n = x.now || {}, keys = ['money', 'work', 'love', 'home', 'body'], p = x.punch || {};
    return { now: keys.every(k => S(n[k])) ? Object.fromEntries(keys.map(k => [k, S(n[k])])) : null, faces: A(x.faces).map(f => ({ outer: S(f && f.outer), inner: S(f && f.inner) })).filter(f => f.outer && f.inner), punch: S(p.not) && S(p.is) ? { not: S(p.not), is: S(p.is) } : null };
  };

  /* 後端一：網頁在 claude.ai 裡打開時，用 sample 能力請 Claude 撰寫（命主自己的帳號額度，不需金鑰） */
  ZW.aiSample = async function () {
    if (!(globalThis.claude && typeof globalThis.claude.use === 'function')) return null;
    let sample = null;
    try { sample = await globalThis.claude.use('sample'); } catch (_) { }
    if (!sample) return null;
    const CODE = { not_granted: '你沒有允許這個頁面使用 Claude，重新整理頁面後可以再允許一次。', sampling_disabled: '這個帳號目前不能從頁面使用 Claude。', rate_limited: '使用量達到上限或請求太頻繁，請稍後再按一次繼續。', session_expired: '登入已過期，請重新登入 claude.ai。', refused: 'Claude 不願意撰寫這一段，可能與你填的心事有關，修改後再試。', invalid_json: '這一段回傳的格式不完整，再按一次會從這裡接著寫。', empty_completion: '這一段沒有產生內容，再按一次會從這裡接著寫。', prompt_too_large: '命盤資料太長，無法送出。', cancelled: '已停止。' };
    return {
      kind: 'claude', label: 'Claude（使用你的 claude.ai 帳號）',
      ask: async (facts, task, schema, shape) => {
        try { return await sample.json(SYSTEM + '\n\n命盤事實：\n' + facts + '\n\n' + task + '\n\n' + shape, { modelTier: 'complex' }); }
        catch (e) { throw new Error(CODE[e && e.code] || '連線中斷，再按一次會從這裡接著寫。'); }
      },
      chat: async (facts, turns, onText, signal) => {
        try { return (await sample([{ role: 'user', content: SYSTEM + '\n\n命盤事實：\n' + facts + '\n\n' + CHAT }, ...turns], { cache: false, onText: ({ text }) => onText(text), signal })).text; }
        catch (e) { const err = new Error(e && e.code === 'cancelled' ? '已停止。' : (CODE[e && e.code] || '連線中斷，請再問一次。')); err.partial = e && e.text; throw err; }
      }
    };
  };

  /* 後端二：在自己的電腦上打開時，用 Claude API 金鑰 */
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.4.0/+esm';   // 鎖定版本
  let sdk;
  ZW.aiKey = function (key) {
    let c;
    const explain = e => {
      if (!sdk) return '無法載入 Anthropic SDK，請確認網路連線。';
      if (e instanceof sdk.AuthenticationError) return '金鑰無效，請確認後重新輸入。';
      if (e instanceof sdk.PermissionDeniedError) return '這把金鑰沒有使用該模型的權限。';
      if (e instanceof sdk.RateLimitError) return '請求太頻繁或額度不足，請稍後再試。';
      if (e instanceof sdk.APIConnectionError) return '連不上 Anthropic，請確認網路連線。';
      if (e instanceof sdk.APIError) return 'API 回傳錯誤（' + e.status + '）：' + e.message;
      return e.message || String(e);
    };
    return {
      kind: 'key', label: MODEL,
      ask: async (facts, task, schema) => {
        try {
          if (!sdk) { const m = await import(SDK_URL); sdk = Object.assign({}, m, { Client: m.default || m.Anthropic }); }
          c = c || new sdk.Client({ apiKey: key, dangerouslyAllowBrowser: true });
          const base = {
            model: MODEL, max_tokens: 32000, thinking: { type: 'adaptive' },
            output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
            system: [{ type: 'text', text: SYSTEM }, { type: 'text', text: '命盤事實：\n' + facts, cache_control: { type: 'ephemeral' } }],
            messages: [{ role: 'user', content: task }]
          };
          let msg;
          try {   // 預設開啟伺服器端的拒答備援
            msg = await c.beta.messages.stream(Object.assign({ betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, base)).finalMessage();
          } catch (e) {
            if (!(e instanceof sdk.BadRequestError)) throw e;
            msg = await c.messages.stream(base).finalMessage();   // 此帳號或組合不支援備援參數時，改送一般請求
          }
          if (msg.stop_reason === 'refusal') throw new Error('模型拒絕了這一段的撰寫');
          if (msg.stop_reason === 'max_tokens') throw new Error('這一段的輸出超過長度上限');
          return JSON.parse(msg.content.filter(b => b.type === 'text').map(b => b.text).join(''));
        } catch (e) { throw new Error(explain(e)); }
      },
      chat: async (facts, turns, onText, signal) => {
        let text = '';
        try {
          if (!sdk) { const m = await import(SDK_URL); sdk = Object.assign({}, m, { Client: m.default || m.Anthropic }); }
          c = c || new sdk.Client({ apiKey: key, dangerouslyAllowBrowser: true });
          const base = { model: MODEL, max_tokens: 8000, thinking: { type: 'adaptive' }, output_config: { effort: 'medium' },
            system: [{ type: 'text', text: SYSTEM + '\n\n' + CHAT }, { type: 'text', text: '命盤事實：\n' + facts, cache_control: { type: 'ephemeral' } }], messages: turns };
          const run = async params => {
            const st = params.betas ? c.beta.messages.stream(params, { signal }) : c.messages.stream(params, { signal });
            st.on('text', d => { text += d; onText(text); });
            return st.finalMessage();
          };
          let msg;
          try { msg = await run(Object.assign({ betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, base)); }
          catch (e) { if (!(e instanceof sdk.BadRequestError) || text) throw e; msg = await run(base); }
          if (msg.stop_reason === 'refusal') throw new Error('道長不回答這個問題，換個問法試試。');
          return text;
        } catch (e) {
          const err = new Error(signal && signal.aborted ? '已停止。' : e instanceof Error && !sdk ? '無法載入 Anthropic SDK，請確認網路連線。' : explain(e)); err.partial = text; throw err;
        }
      }
    };
  };

  /* 分段撰寫，每段最多三節；prev 是之前已完成的部分，中斷後再按一次會從缺的地方接著寫。
     onStep(out, done, total) 每完成一段呼叫一次。 */
  ZW.aiWrite = async function (backend, theme, facts, prev, onStep) {
    const out = JSON.parse(JSON.stringify(prev || {})), jobs = [{ k: 'intro' }];
    theme.list.forEach(([k, title, sub]) => { const n = ZW.TH.SEC[k].length; for (let a = 0; a < n; a += 3) jobs.push({ k, title, sub, a, b: Math.min(n, a + 3), n }); });
    const isDone = j => j.k === 'intro' ? !!out.intro : Array.isArray(out[j.k]) && [...Array(j.b - j.a).keys()].every(i => out[j.k][j.a + i]);
    let done = jobs.filter(isDone).length;
    for (const j of jobs) {
      if (isDone(j)) continue;
      if (j.k === 'intro') {
        out.intro = cleanIntro(await backend.ask(facts, `請寫命書開頭的「現狀」三樣東西。
一、now：錢、工作、感情、家裡、身體五格，每格一到兩句，寫命主此刻很可能正在經歷的具體生活畫面，要用上他填的工作狀態、感情狀態與心事。
二、faces：四組「表／裏」對照，outer 是別人看到的他（二到四個字），inner 是實際上的他（十二個字以內的具體行為）。要能從命宮、福德宮與生年化忌推得出來，其中至少兩組扣到他填的處境。
三、punch：一組點破句，not 是「你不是……」，is 是「你是……」，各十二個字以內。`, IN_SCHEMA, IN_SHAPE));
      } else {
        const defs = ZW.TH.SEC[j.k], data = theme.data[j.k], cnt = j.b - j.a;
        const task = `請寫「${j.title}」這一章的一部分。這一章的主題是：${sub(j)}。全章共 ${j.n} 節：${defs.map(d => d[0]).join('、')}。這次只寫第 ${j.a + 1} 到第 ${j.b} 節，sections 陣列必須剛好 ${cnt} 個元素，順序如下。

${defs.slice(j.a, j.b).map((d, i) => `第${j.a + i + 1}節「${d[0]}」：${d[1]}${d[2] ? '（本章核心，寫得最深）' : ''}
盤面依據：${data[j.a + i].basis.map(([a, b]) => a + '＝' + strip(b)).join('；')}
${data[j.a + i].flies.map(f => '飛化：' + f.head).join('\n')}
推算要點（供你理解盤面，請用自己的話重寫，不要照抄）：${data[j.a + i].body.map(strip).join(' ')}`).join('\n\n')}

每一節的欄位：
body：六到八段本文，每段八十到一百六十字。
quote：一句點破這一節的話，二十五字以內。
mirror：五句「自我對照」，每句以「你」開頭，是命主可以拿來檢查自己是否如此的具體行為。
options：剛好兩個選項，choice 是可以採取的做法，cost 是選它要付出的代價。兩個選項都要是真的可以選的路，不要一好一壞。`;
        const r = await backend.ask(facts, task, CH_SCHEMA, CH_SHAPE), secs = A(r && r.sections).map(cleanSec).filter(x => x.body.length);
        if (secs.length < cnt) throw new Error('這一段回傳的節數不足，再按一次會從這裡接著寫。');
        out[j.k] = A(out[j.k]).slice(); secs.slice(0, cnt).forEach((x, i) => { out[j.k][j.a + i] = x; });
      }
      onStep(out, ++done, jobs.length);
    }
    return out;
  };
  const sub = j => j.sub;
  ZW.AI_MODEL = MODEL;
})();
