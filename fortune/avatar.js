/* 原創人物：雲樵道長。mood: calm | smile | think | talk */
var ZW = globalThis.ZW = globalThis.ZW || {};
ZW.avatar = function (mood, sun) {
  const ink = '#2b2622', skin = '#f6d3ad', robe = '#3f6fa8', robeD = '#2f5687';
  const eyes = {
    calm: '<ellipse class="eye" cx="86" cy="96" rx="3.4" ry="4.4" fill="' + ink + '"/><ellipse class="eye" cx="114" cy="96" rx="3.4" ry="4.4" fill="' + ink + '"/>',
    talk: '<ellipse class="eye" cx="86" cy="96" rx="3.4" ry="4.4" fill="' + ink + '"/><ellipse class="eye" cx="114" cy="96" rx="3.4" ry="4.4" fill="' + ink + '"/>',
    smile: '<path d="M80 97q6-7 12 0M108 97q6-7 12 0" fill="none" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>',
    think: '<path d="M80 96q6 5 12 0M108 96q6 5 12 0" fill="none" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>'
  }[mood] || '';
  const mouth = {
    calm: '<path d="M93 114q7 5 14 0" fill="none" stroke="#a5553c" stroke-width="2.4" stroke-linecap="round"/>',
    smile: '<path d="M90 112q10 10 20 0" fill="#fff" stroke="#a5553c" stroke-width="2.2" stroke-linejoin="round"/>',
    think: '<path d="M95 115h10" stroke="#a5553c" stroke-width="2.4" stroke-linecap="round"/>',
    talk: '<ellipse cx="100" cy="115" rx="5" ry="4" fill="#8a3f2c"/>'
  }[mood] || '';
  const brows = mood === 'think' ? 'M78 86q8-3 14 1M108 87q6-4 14-1' : 'M78 87q7-5 14-1M108 86q7-4 14 1';
  return `<svg class="ava" viewBox="0 0 200 212" role="img" aria-label="雲樵道長">
${sun ? `<g class="sun"><circle cx="100" cy="104" r="92" fill="#ffd978" opacity=".55"/><circle cx="100" cy="104" r="72" fill="#ffe7a3"/></g>
<path d="M8 150q16-12 30 0q10-10 22 2M140 152q12-12 26-2q10-8 26 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/>` : `<circle cx="100" cy="104" r="76" fill="#ffe7a3"/>`}
<path d="M26 212q2-56 44-70l30 20 30-20q42 14 44 70z" fill="${robe}"/>
<path d="M70 142l30 34 30-34-9-5-21 24-21-24z" fill="#fff"/>
<path d="M100 176v36" stroke="${robeD}" stroke-width="2"/>
<path d="M56 212q0-34 14-58M144 212q0-34-14-58" fill="none" stroke="${robeD}" stroke-width="2" opacity=".6"/>
<rect x="91" y="122" width="18" height="24" rx="6" fill="#eec39a"/>
<ellipse cx="65" cy="98" rx="6" ry="9" fill="${skin}"/><ellipse cx="135" cy="98" rx="6" ry="9" fill="${skin}"/>
<ellipse cx="100" cy="94" rx="35" ry="38" fill="${skin}"/>
<path d="M65 90q-2-40 35-40q37 0 35 40q-8-22-35-22q-27 0-35 22z" fill="${ink}"/>
<circle cx="100" cy="42" r="14" fill="${ink}"/>
<path d="M88 44q12-10 24 0l-3 8h-18z" fill="${robe}"/>
<rect x="74" y="39" width="52" height="4.5" rx="2.2" fill="#c79a3a"/>
<path d="${brows}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
${eyes}
<circle cx="77" cy="108" r="6" fill="#f3a48a" opacity=".45"/><circle cx="123" cy="108" r="6" fill="#f3a48a" opacity=".45"/>
<path d="M100 99v7" stroke="#d9a67c" stroke-width="2" stroke-linecap="round"/>
${mouth}
<path d="M94 124q6 14 12 0q-6 3-12 0z" fill="${ink}"/>
<g transform="translate(100 196)"><circle r="10" fill="#fff" stroke="${robeD}" stroke-width="1.5"/><path d="M0-10a10 10 0 0 1 0 20a5 5 0 0 1 0-10a5 5 0 0 0 0-10z" fill="${ink}"/><circle cy="-5" r="1.6" fill="#fff"/><circle cy="5" r="1.6" fill="${ink}"/></g>
<path d="M156 206l6-62" stroke="#8a5a2b" stroke-width="4.5" stroke-linecap="round"/>
<g class="whisk" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M162 144q20 4 18 46"/><path d="M162 144q26 8 26 40"/><path d="M162 144q14 10 10 50"/><path d="M162 144q30 2 32 30"/></g>
<circle cx="162" cy="144" r="4" fill="#c79a3a"/>
</svg>`;
};
