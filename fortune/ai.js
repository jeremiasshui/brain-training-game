/* 選用的 AI 撰寫：以 Claude API 依命盤事實與命主的回答，改寫「現狀」與各主題章節。
   金鑰只存在使用者的瀏覽器；排盤資料由本機引擎提供，AI 只負責文字。 */
var ZW = globalThis.ZW = globalThis.ZW || {};
(function () {
  'use strict';
  const MODEL = 'claude-opus-5-5';
  const SYSTEM = `你是「硯山」，一位說話直白的命理師，正在為一個人寫他個人的命書。讀者只有命主本人，他會一邊讀一邊對照自己的命盤與生活。

排盤已經由程式算好，結果在下面的「命盤事實」裡。星曜、宮位、四化、飛化、大限與年份一律以這份資料為準，不要自己重新推算，也不要更動，因為命書旁邊就印著命盤，寫錯一顆星讀者馬上看得出來。每一節開頭程式會另外印出「盤面依據」，所以本文不必重列星曜清單，直接說白話。

怎麼寫：
- 用「你」稱呼命主，口吻像一個看得很清楚、但站在他這邊的長輩。不討好，不恐嚇，不說教。
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

  let sdk;
  async function client(key) {
    sdk = sdk || (await import('https://esm.sh/@anthropic-ai/sdk')).default;
    return new sdk({ apiKey: key, dangerouslyAllowBrowser: true });
  }
  async function ask(c, facts, task, schema) {
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
  }
  function explain(e) {
    if (!sdk) return '無法載入 Anthropic SDK，請確認網路連線。';
    if (e instanceof sdk.AuthenticationError) return '金鑰無效，請確認後重新輸入。';
    if (e instanceof sdk.PermissionDeniedError) return '這把金鑰沒有使用該模型的權限。';
    if (e instanceof sdk.RateLimitError) return '請求太頻繁或額度不足，請稍後再試。';
    if (e instanceof sdk.APIConnectionError) return '連不上 Anthropic，請確認網路連線。';
    if (e instanceof sdk.APIError) return 'API 回傳錯誤（' + e.status + '）：' + e.message;
    return e.message || String(e);
  }

  /* theme: ZW.themeBuild 的結果；onStep(key, data, done, total) 每完成一段呼叫一次 */
  ZW.aiWrite = async function (key, theme, facts, onStep) {
    const total = theme.list.length + 1, out = {};
    let c;
    try {
      c = await client(key);
      out.intro = await ask(c, facts, `請寫命書開頭的「現狀」三樣東西。
一、now：錢、工作、感情、家裡、身體五格，每格一到兩句，寫命主此刻很可能正在經歷的具體生活畫面，要用上他填的工作狀態、感情狀態與心事。
二、faces：四組「表／裏」對照，outer 是別人看到的他（二到四個字），inner 是實際上的他（十二個字以內的具體行為）。要能從命宮、福德宮與生年化忌推得出來，其中至少兩組扣到他填的處境。
三、punch：一組點破句，not 是「你不是……」，is 是「你是……」，各十二個字以內。`, IN_SCHEMA);
      onStep('intro', out.intro, 1, total);
      let n = 1;
      for (const [k, title, sub] of theme.list) {
        const defs = ZW.TH.SEC[k], data = theme.data[k];
        const task = `請寫「${title}」這一章，主題是：${sub}。共 ${defs.length} 節，sections 陣列必須剛好 ${defs.length} 個元素，順序如下。

${defs.map((d, i) => `第${i + 1}節「${d[0]}」：${d[1]}${d[2] ? '（本章核心，寫得最深）' : ''}
盤面依據：${data[i].basis.map(([a, b]) => a + '＝' + strip(b)).join('；')}
${data[i].flies.map(f => '飛化：' + f.head).join('\n')}
推算要點（供你理解盤面，請用自己的話重寫，不要照抄）：${data[i].body.map(strip).join(' ')}`).join('\n\n')}

每一節的欄位：
body：六到八段本文，每段八十到一百六十字。
quote：一句點破這一節的話，二十五字以內。
mirror：五句「自我對照」，每句以「你」開頭，是命主可以拿來檢查自己是否如此的具體行為。
options：剛好兩個選項，choice 是可以採取的做法，cost 是選它要付出的代價。兩個選項都要是真的可以選的路，不要一好一壞。`;
        out[k] = (await ask(c, facts, task, CH_SCHEMA)).sections.slice(0, defs.length);
        onStep(k, out[k], ++n, total);
      }
      return out;
    } catch (e) { const err = new Error(explain(e)); err.partial = out; throw err; }
  };
  ZW.AI_MODEL = MODEL;
})();
