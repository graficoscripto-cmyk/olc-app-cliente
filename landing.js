/* Vitrine comercial do Agente OLC. Sem chaves; todas as ilustrações são vetoriais e próprias. */
(function () {
'use strict';
const WA = 'https://wa.me/5512988685845?text=' + encodeURIComponent('Opa Gustavo! Quero o Agente OLC para a minha empresa.');
const NAV = [['vComo', 'Como funciona'], ['vFaz', 'O que faz'], ['vFaq', 'Dúvidas']];
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const svg = (box, body, cls) => `<svg class="${cls || ''}" viewBox="${box}" aria-hidden="true">${body}</svg>`;
const ARROW = svg('0 0 24 24', '<path d="M5 12h14M13 6l6 6-6 6"/>', 'v-ico');
const CHECK = svg('0 0 24 24', '<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'v-ico');
const SPARK = '<path d="M20 2c2 11 7 16 18 18-11 2-16 7-18 18-2-11-7-16-18-18C13 18 18 13 20 2z"/>';

/* marca e personagens desenhados para a OLC */
const MARK = svg('0 0 40 40', '<rect width="40" height="40" rx="12" fill="#d7fb5c"/><path d="M18 8h4v8l6-6 3 3-6 6h7v4h-7l6 6-3 3-6-6v6h-4v-6l-6 6-3-3 6-6H8v-4h7l-6-6 3-3 6 6z" fill="#0a0a09"/>', 'v-mark');
const AGENT = svg('0 0 64 64', '<path d="M32 5C16 5 6 15 6 30c0 7 2 12 6 16l-3 13 14-6c3 1 6 1 9 1 16 0 26-10 26-24S48 5 32 5z" fill="#d7fb5c"/><path d="M21 27q3-5 7 0M36 27q3-5 7 0" fill="none" stroke="#0a0a09" stroke-width="3.4" stroke-linecap="round"/><path d="M23 36q9 10 18 0z" fill="#0a0a09"/><circle cx="17" cy="37" r="3" fill="#20c8bf"/><circle cx="47" cy="37" r="3" fill="#20c8bf"/>', 'v-agent');
const CLIENT = svg('0 0 64 64', '<circle cx="32" cy="32" r="30" fill="#1d3a37"/><circle cx="42" cy="22" r="8" fill="#f8e07c"/><path d="M5 42q9-9 18 0t18 0 18 0v6C53 57 44 62 32 62S11 57 5 48z" fill="#20c8bf"/>', 'v-client');

const STK_CAL = svg('0 0 96 100', '<rect x="8" y="14" width="76" height="76" rx="18" fill="#fff"/><path d="M8 32a18 18 0 0 1 18-18h40a18 18 0 0 1 18 18v6H8z" fill="#20c8bf"/><path d="M28 6v18M64 6v18" stroke="#0a0a09" stroke-width="6" stroke-linecap="round"/><circle cx="46" cy="64" r="18" fill="#d7fb5c"/><path d="M37 64l6 6 12-12" fill="none" stroke="#0a0a09" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>');
const STK_CLOCK = svg('0 0 80 80', '<circle cx="40" cy="40" r="34" fill="#f8e07c"/><circle cx="40" cy="40" r="25" fill="#fff"/><path d="M40 24v17l12 8" fill="none" stroke="#0a0a09" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>');
const STK_PLANE = svg('0 0 120 90', '<path d="M4 82q28 6 40-14t26-22" fill="none" stroke="#20c8bf" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/><path d="M60 34l56-30-18 62-16-18z" fill="#d7fb5c"/><path d="M82 48l34-44-44 38 2 22z" fill="#a9d63a"/>');
const ring = (r, c) => `<circle class="${c}" cx="300" cy="300" r="${r}"/>`;
const RINGS = cls => svg('0 0 600 600', [90, 150, 215, 285].map((r, i) => ring(r, 'rg rg' + i)).join('') +
  [0, 1, 2].map(i => ring(285, 'wave wave' + i)).join('') +
  '<g class="spin spin--a">' + ring(182, 'dash') + '<circle class="sat" cx="482" cy="300" r="6"/></g>' +
  '<g class="spin spin--b">' + ring(250, 'arc') + '<circle class="sat sat--b" cx="300" cy="50" r="4.5"/></g>' +
  '<g class="spin spin--c"><path class="sweep" d="M300 300L585 300A285 285 0 0 0 546.8 157.5Z"/></g>' + ring(9, 'bull'), 'v-rings ' + (cls || ''));

const CHAT = [
  ['c', 'Oi! Tem horário no sábado?', '10:02'],
  ['a', 'Tem sim! Qual horário fica melhor para você?', '10:02'],
  ['c', 'Às 10h, somos 6 pessoas.', '10:03'],
  ['a', 'Fechado! Já registrei na agenda ✅', '10:03']
];
const chat = () => `<figure class="v-scene" aria-label="Conversa ilustrativa entre um cliente e o Agente">
  <span class="v-stk v-stk--plane">${STK_PLANE}</span><span class="v-stk v-stk--clock">${STK_CLOCK}</span>
  <div class="v-phone">
   <div class="v-phone__head">${AGENT}<div><b>Seu Agente</b><small id="vStatus">online</small></div><span class="v-tag">Conversa ilustrativa</span></div>
   <div class="v-log" id="vLog">
    ${CHAT.map(m => `<div class="v-msg v-msg--${m[0]}">${m[0] === 'c' ? CLIENT : ''}<p>${m[1]}<time>${m[2]}${m[0] === 'a' ? ' <i>✓✓</i>' : ''}</time></p></div>`).join('')}
    <div class="v-typing" id="vTyping" aria-hidden="true"><i></i><i></i><i></i></div>
   </div>
   <div class="v-booked" id="vBooked"><span>${CHECK}</span><div><b>Reserva na Agenda</b><small>Sábado · 10h · 6 pessoas</small></div></div>
  </div>
  <span class="v-stk v-stk--cal" id="vCal">${STK_CAL}</span>
 </figure>`;

/* ilustrações do passo a passo */
const QR = (() => {
  let s = '';
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
    if ((x < 5 && y < 5) || (x > 7 && y < 5) || (x < 5 && y > 7)) continue;
    if ((x * 7 + y * 11 + x * y) % 3 === 0) s += `<rect x="${x * 10}" y="${y * 10}" width="8" height="8" rx="2"/>`;
  }
  [[0, 0], [90, 0], [0, 90]].forEach(([x, y]) => s += `<path d="M${x + 4} ${y}h30a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H${x + 4}a4 4 0 0 1-4-4V${y + 4}a4 4 0 0 1 4-4zm2 7v24h26V${y + 7}z" fill-rule="evenodd"/><rect x="${x + 12}" y="${y + 12}" width="14" height="14" rx="3"/>`);
  return svg('0 0 128 128', s, 'v-qr__art');
})();
const ART = [
  `<div class="v-mq"><div class="v-mq__segs"><i></i><i></i><i></i><i></i><i></i></div><b>O que a empresa oferece?</b><span class="v-mq__field">Passeios privativos de lancha<em></em></span><span class="v-mq__btn">Continuar →</span></div>`,
  `<div class="v-qr"><div class="v-qr__box">${QR}<i class="v-qr__scan"></i></div><p>WhatsApp → <b>Aparelhos conectados</b></p></div>`,
  `<div class="v-try"><p class="v-try__a">Quero saber dos passeios</p><p class="v-try__b">Temos três roteiros privativos. Quer que eu explique?</p><p class="v-try__a">Quero para sábado</p></div>`,
  `<div class="v-agenda"><div class="v-agenda__week">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => `<span class="${i === 5 ? 'on' : ''}">${d}</span>`).join('')}</div><div class="v-agenda__row"><b>10h</b><span>6 pessoas<small>Sábado</small></span><em>Confirmado</em></div><div class="v-agenda__ghost"></div></div>`
];
const STEPS = [
  ['Responda o Mini Quiz', 'Cinco passos: o que você oferece, preços, horários, jeito de falar e cuidados.'],
  ['Conecte o seu WhatsApp', 'Pelo QR Code ou pelo código no celular, em Aparelhos conectados.'],
  ['Teste como se fosse o cliente', 'Converse com o Agente no painel antes de colocar no ar.'],
  ['Acompanhe a Agenda', 'Veja as reservas, as conversas e assuma quando quiser.']
];
const DOES = [
  ['Qualificação de quem chama', 'Entende o que a pessoa quer, pergunta data e quantidade e conduz até a reserva.', 'Prospecção ativa (puxar conversa com novos contatos) não está no painel: consulte a OLC.'],
  ['Atendimento no WhatsApp', 'Responde na hora, no horário que você definir.'],
  ['Agenda automática', 'Reserva confirmada entra na Agenda.'],
  ['Treino simples', 'Mini Quiz de 5 passos ou comando #treinar no WhatsApp.'],
  ['Controle no celular', 'Pause o Agente em um contato e assuma a conversa.']
];
const PANEL = [
  ['Meu Agente', 'Ensine, ligue ou pause o Agente e conecte o WhatsApp.', `<div class="v-ui__row"><span>Agente ligado</span><i class="v-ui__switch"></i></div><div class="v-ui__big">${AGENT}<b>Agente pronto.</b></div><div class="v-ui__btn">Mini Quiz (5 passos)</div>`],
  ['Testar ao vivo', 'Converse como se fosse um cliente, usando as regras salvas.', `<p class="v-ui__in">Qual o horário de vocês?</p><p class="v-ui__out">Posso te ajudar! Para qual dia você quer?</p><div class="v-ui__compose"><span>Escreva como um cliente…</span><i>${ARROW}</i></div>`],
  ['Agenda', 'Horários marcados e conversas atendidas no mesmo lugar.', `<div class="v-ui__card"><b>Sábado · 10h</b><em>Confirmado</em><small>6 pessoas</small></div><div class="v-ui__card"><b>Conversa</b><em class="alt">Com o Agente</em><small>Contato de exemplo</small></div>`]
];
const FAQ = [
  ['Como o Agente aprende sobre a minha empresa?', 'Pelo Mini Quiz de 5 passos. Depois você pode ensinar mais pelo painel ou com o comando #treinar no WhatsApp.'],
  ['Como eu conecto o meu WhatsApp?', 'Pelo QR Code ou pelo código no celular, em Aparelhos conectados.'],
  ['Posso assumir uma conversa?', 'Sim. Você pausa o Agente naquele contato e continua a conversa.'],
  ['Em que horário ele responde?', 'No horário que você definir.'],
  ['Ele faz prospecção ativa?', 'Puxar conversa com novos contatos não está no painel. Consulte a OLC.']
];

const eyebrow = t => `<p class="v-eyebrow">${t}</p>`;
const btn = (label, attr, cls) => `<button type="button" class="v-btn ${cls || ''}" ${attr}>${label}</button>`;
const waBtn = (label, cls) => `<a class="v-btn ${cls}" href="${WA}" target="_blank" rel="noopener">${label}</a>`;

function render(root, on) {
  root.innerHTML = `<div class="v">
 <header class="v-nav" id="vNav"><div class="v-wrap v-nav__in">
  <a class="v-logo" href="#vTop" data-scroll>${MARK}<b>OLC<span> · Agente</span></b></a>
  <nav aria-label="Seções">${NAV.map(n => `<a href="#${n[0]}" data-scroll>${n[1]}</a>`).join('')}</nav>
  ${btn('Entrar', 'data-login aria-label="Entrar no Painel"', 'v-btn--nav')}
 </div></header>

 <main>
 <section class="v-hero" id="vTop"><div class="v-grid" aria-hidden="true">${[1, 2, 3, 4, 5, 6, 7].map(i => `<i class="v-plus v-plus${i}"></i>`).join('')}<i class="v-beam"></i></div>${RINGS('v-rings--hero')}<div class="v-wrap v-hero__in">
  <div class="v-hero__head">
   <p class="v-over"><b>Novo</b> Agente de atendimento, agendamento e tira-dúvidas para empresas</p>
   <h1 aria-label="Seu WhatsApp atende e agenda"><em aria-hidden="true"><i class="v-w v-w0"><i>Seu</i></i> <i class="v-w v-w1"><i>WhatsApp</i></i></em> <span aria-hidden="true"><i class="v-w v-w2"><i>atende</i></i> <i class="v-w v-w3"><i>e</i></i> <i class="v-w v-w4"><i>agenda</i></i><b class="v-swash"></b></span></h1>
  </div>
  ${chat()}
  <div class="v-hero__cta">${btn('Testar meu Agente ' + ARROW, 'data-login', 'v-btn--lime')}${waBtn('Falar no WhatsApp', 'v-btn--line')}</div>
 </div></section>

 <div class="v-tape" aria-hidden="true"><div class="v-tape__run">${[0, 1].map(() => `<div>${['Atendimento no WhatsApp', 'Tira dúvidas dos clientes', 'Agenda automática', 'Mini Quiz de 5 passos', 'Você assume quando quiser'].map(t => `<span>${t}</span>${svg('0 0 40 40', SPARK, 'v-spark')}`).join('')}</div>`).join('')}</div></div>

 <section class="v-how" id="vComo" aria-labelledby="vComoT"><div class="v-wrap">
  <div class="v-title" data-r>${eyebrow('Como funciona')}<h2 id="vComoT">Do primeiro oi à agenda</h2><p>Você ensina o que a empresa oferece. O Agente atende com essas informações.</p></div>
  <ol class="v-line" id="vLine"><span class="v-line__bar" aria-hidden="true"><i id="vFill"></i></span>
   ${STEPS.map((s, i) => `<li><span class="v-line__num">${i + 1}</span><div class="v-card" data-r><div class="v-art v-art--${i + 1}" aria-hidden="true">${ART[i]}</div></div><div class="v-line__tx" data-r><h3>${s[0]}</h3><p>${s[1]}</p></div></li>`).join('')}
  </ol>
 </div></section>

 <section class="v-does" id="vFaz" aria-labelledby="vFazT"><div class="v-wrap v-does__in">
  <div class="v-title" data-r>${eyebrow('No dia a dia')}<h2 id="vFazT">O que o seu Agente faz</h2></div>
  <ul class="v-checks">${DOES.map(d => `<li data-r><span class="v-check">${CHECK}</span><div><h3>${d[0]}</h3><p>${d[1]}</p>${d[2] ? `<small>${d[2]}</small>` : ''}</div></li>`).join('')}</ul>
  <div class="v-take" data-r>
   <span class="v-take__tag">Exemplo: toque na chave</span>
   <div class="v-take__who"><span class="v-take__face is-agent">${AGENT}</span><span class="v-take__face is-you">${svg('0 0 64 64', '<circle cx="32" cy="32" r="30" fill="#f8e07c"/><path d="M22 34V20a4 4 0 0 1 8 0v9-13a4 4 0 0 1 8 0v13-10a4 4 0 0 1 8 0v18c0 10-6 15-14 15-7 0-10-3-14-9l-5-8c-2-4 3-7 6-4z" fill="#0a0a09"/>')}</span></div>
   <p id="vTakeText" aria-live="polite">O Agente está atendendo este contato.</p>
   <button type="button" class="v-switch" role="switch" aria-checked="false" id="vTake"><i></i><span>Assumir a conversa</span></button>
  </div>
 </div></section>

 <section class="v-panel" aria-labelledby="vPanelT">${RINGS('v-rings--side')}<div class="v-wrap">
  <div class="v-title" data-r>${eyebrow('O seu painel')}<h2 id="vPanelT">Três telas. Tudo no celular.</h2></div>
  <div class="v-tabs" role="tablist" aria-label="Telas do painel">${PANEL.map((p, i) => `<button type="button" role="tab" id="vTab${i}" aria-controls="vPane${i}" aria-selected="${i === 0}" data-pane="${i}">${p[0]}</button>`).join('')}<i class="v-tabs__ink pos0" id="vInk" aria-hidden="true"></i></div>
  <div class="v-panes">${PANEL.map((p, i) => `<div class="v-pane${i === 0 ? ' on' : ''}" role="tabpanel" id="vPane${i}" aria-labelledby="vTab${i}"><p>${p[1]}</p><div class="v-ui" aria-hidden="true">${p[2]}</div></div>`).join('')}</div>
  <p class="v-panel__note">Telas ilustrativas.</p>
 </div></section>

 <section class="v-faq" id="vFaq" aria-labelledby="vFaqT"><div class="v-wrap v-faq__in">
  <div class="v-title" data-r>${eyebrow('Sem enrolação')}<h2 id="vFaqT">Dúvidas diretas</h2></div>
  <div>${FAQ.map(f => `<details data-r><summary><span>${f[0]}</span><i>${ARROW}</i></summary><p>${f[1]}</p></details>`).join('')}</div>
 </div></section>

 <section class="v-end" aria-labelledby="vEndT">${RINGS('v-rings--end')}<div class="v-wrap" data-r>
  <span class="v-end__art">${AGENT}</span>
  <h2 id="vEndT">Pronto para começar?</h2>
  <p>Fale com a OLC ou entre no seu painel.</p>
  <div class="v-end__cta">${waBtn('Falar no WhatsApp ' + ARROW, 'v-btn--lime')}${btn('Entrar no Painel', 'data-login', 'v-btn--line')}</div>
 </div></section>
 </main>

 <footer class="v-foot"><div class="v-wrap">
  <div class="v-logo">${MARK}<b>OLC · Agente</b></div>
  <p>Agente de atendimento e agendamento no WhatsApp, entregue e acompanhado pela OLC Digital.</p>
  <div class="v-foot__links">${NAV.map(n => `<a href="#${n[0]}" data-scroll>${n[1]}</a>`).join('')}<a href="${WA}" target="_blank" rel="noopener">WhatsApp (12) 98868-5845</a><button type="button" data-master>👑 Modo Mestre OLC</button></div>
  <p class="v-foot__copy">OLC Digital · 2026</p>
 </div></footer>
</div>`;

  const v = root.querySelector('.v'), q = s => v.querySelector(s), qa = s => [...v.querySelectorAll(s)];
  v.addEventListener('click', e => {
    const s = e.target.closest('[data-scroll]');
    if (s) { e.preventDefault(); const t = q(s.getAttribute('href')); if (t) t.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' }); return; }
    if (e.target.closest('[data-login]')) on.login();
    if (e.target.closest('[data-master]')) on.master();
    const tab = e.target.closest('[data-pane]');
    if (tab) selectTab(+tab.dataset.pane);
  });

  /* abas do painel */
  function selectTab(n) {
    qa('[data-pane]').forEach((b, i) => { b.setAttribute('aria-selected', i === n); b.tabIndex = i === n ? 0 : -1; });
    qa('.v-pane').forEach((p, i) => p.classList.toggle('on', i === n));
    q('#vInk').className = 'v-tabs__ink pos' + n;
  }
  q('.v-tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const cur = qa('[data-pane]').findIndex(b => b.getAttribute('aria-selected') === 'true');
    const n = (cur + (e.key === 'ArrowRight' ? 1 : 2)) % 3; selectTab(n); q('#vTab' + n).focus();
  });
  selectTab(0);

  /* demonstração: assumir a conversa */
  q('#vTake').onclick = e => {
    const mine = e.currentTarget.getAttribute('aria-checked') !== 'true';
    e.currentTarget.setAttribute('aria-checked', mine);
    q('.v-take').classList.toggle('mine', mine);
    q('#vTakeText').textContent = mine ? 'Agente em pausa neste contato. A conversa está com você.' : 'O Agente está atendendo este contato.';
  };

  /* entrada das seções, barra do topo e linha do tempo */
  if (!calm() && 'IntersectionObserver' in window) {
    v.classList.add('anim');
    const io = new IntersectionObserver(list => list.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    qa('[data-r]').forEach(el => io.observe(el));
  }
  const nav = q('#vNav'), fill = q('#vFill'), line = q('#vLine'), nums = qa('.v-line__num');
  let lastY = scrollY, tick = false;
  const onScroll = () => {
    if (!v.isConnected) { removeEventListener('scroll', onScroll); return; }
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      tick = false;
      const y = scrollY;
      if (Math.abs(y - lastY) > 6) { nav.classList.toggle('hide', y > lastY && y > 120); lastY = y; }
      nav.classList.toggle('solid', y > 12);
      const r = line.getBoundingClientRect(), mark = innerHeight * .62;
      fill.style.transform = `scaleY(${Math.max(0, Math.min(1, (mark - r.top) / r.height))})`;
      nums.forEach(n => n.classList.toggle('lit', n.getBoundingClientRect().top < mark));
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  nav.addEventListener('focusin', () => nav.classList.remove('hide'));

  playChat(v);
}

/* conversa do topo: digita, responde, registra a reserva e recomeça */
function playChat(v) {
  const scene = v.querySelector('.v-scene'), msgs = [...v.querySelectorAll('.v-msg')], typing = v.querySelector('#vTyping');
  const booked = v.querySelector('#vBooked'), cal = v.querySelector('#vCal'), status = v.querySelector('#vStatus');
  if (calm()) { [...msgs, booked, cal].forEach(el => el.classList.add('on')); return; }
  scene.classList.add('play');
  let seen = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(e => seen = e[0].isIntersecting, { threshold: .15 }).observe(scene);
  const wait = ms => new Promise(res => {
    let left = ms;
    const t = setInterval(() => { if (!v.isConnected) { clearInterval(t); return; } if (seen && !document.hidden) left -= 100; if (left <= 0) { clearInterval(t); res(); } }, 100);
  });
  const writing = (m, yes) => {
    typing.classList.toggle('on', yes);
    if (!yes) return;
    typing.classList.toggle('right', m.classList.contains('v-msg--a'));
    typing.style.transform = `translateY(${m.offsetTop}px)`;
    status.textContent = m.classList.contains('v-msg--a') ? 'digitando…' : 'online';
  };
  (async () => {
    msgs[0].classList.add('on');
    await wait(900);
    let first = true;
    for (;;) {
      for (let i = first ? 1 : 0; i < msgs.length; i++) {
        const agent = msgs[i].classList.contains('v-msg--a');
        writing(msgs[i], true); await wait(agent ? 1100 : 650); writing(msgs[i], false);
        status.textContent = 'online'; msgs[i].classList.add('on'); await wait(agent ? 900 : 600);
      }
      first = false;
      booked.classList.add('on'); cal.classList.add('on');
      await wait(5200);
      [...msgs, booked, cal].forEach(el => el.classList.remove('on'));
      await wait(700);
    }
  })();
}
window.OLCLanding = render;
})();
