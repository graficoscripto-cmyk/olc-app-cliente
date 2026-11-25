/* Vitrine comercial do Agente OLC (grid arquitetônico). Sem chaves; ilustrações vetoriais próprias. */
(function () {
'use strict';
const WA = 'https://wa.me/5512988685845?text=' + encodeURIComponent('Opa Gustavo! Quero o Agente OLC para a minha empresa.');
const NAV = [['Protection', 'Agente 24h'], ['Solutions', 'Como Funciona'], ['Arguments', 'Diferenciais'], ['Using', 'Simulador']];
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ícones de traço, grade 48x48 */
const D = {
  chat: 'M8 10h32v22H21l-9 8v-8H8zM16 19h16M16 25h10',
  chat2: 'M6 8h26v18H18l-7 6v-6H6zM32 18h10v18h-5v6l-7-6H18v-5',
  cal: 'M8 11h32v29H8zM8 19h32M16 6v9M32 6v9M17 29l5 5 10-10',
  cal2: 'M8 11h32v29H8zM8 19h32M16 6v9M32 6v9M15 26h5v5h-5zM28 26h5v5h-5z',
  quiz: 'M10 6h28v36H10zM16 15h3M23 15h9M16 24h3M23 24h9M16 33h3M23 33h9',
  quiz2: 'M10 6h28v36H10zM15 15l3 3 5-6M15 26l3 3 5-6M28 16h5M28 27h5M16 36h16',
  phone: 'M14 4h20v40H14zM21 9h6M22 38h4',
  phone2: 'M14 4h20v40H14zM19 24l4 4 7-8M22 38h4',
  clock: 'M24 6a18 18 0 1 0 .1 0M24 14v11l8 5',
  clock2: 'M24 6a18 18 0 1 0 .1 0M24 24l-9-7M24 24V10',
  pause: 'M24 6a18 18 0 1 0 .1 0M19 17v14M29 17v14',
  send: 'M6 23L42 7 30 42l-7-14zM23 28L42 7',
  hash: 'M18 7l-5 34M34 7l-5 34M9 18h32M7 31h32',
  list: 'M17 13h24M17 24h24M17 35h24M7 13h3M7 24h3M7 35h3'
};
const ico = (k, cls = '') => `<svg class="lp-ico ${cls}" viewBox="0 0 48 48" aria-hidden="true"><path d="${D[k]}"/></svg>`;
const arrow = (cls = '') => `<svg class="lp-arrow ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18L18 6M8 6h10v10"/></svg>`;
const STAR = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M17.5 1h5v13.5l9.5-9.5 3.500 3.500-9.500 9.500H39v5H26l9.500 9.500-3.500 3.500-9.500-9.500V39h-5V26.500L8 36l-3.500-3.500L14 23H1v-5h13L4.500 8.500 8 5l9.500 9.500z"/></svg>';
const star = cls => `<span class="lp-star ${cls || ''}" data-animate="star">${STAR}</span>`;

/* botão cubo 3D */
const cube = (label, attr) => `<span class="btn-cube-wrap" data-animate="cube-hover"><span class="btn-cube"><button type="button" class="btn-cube__front" ${attr}>${label}</button><i class="btn-cube__side mod--1"></i><i class="btn-cube__side mod--2"></i><i class="btn-cube__side mod--3"></i></span></span>`;

function bubbles(msgs) { return msgs.map(m => `<p class="lp-b ${m[0]}">${m[1]}</p>`).join(''); }

/* composição geométrica do topo */
const heroArt = `<div class="hero__elements-wrap" aria-hidden="true">
 <div class="he he-blob"></div>
 <svg class="he he-disc" viewBox="0 0 240 250"><defs><linearGradient id="cyG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#20c8bf"/><stop offset="1" stop-color="#f8e07c"/></linearGradient></defs><ellipse cx="128" cy="116" rx="84" ry="122" transform="rotate(-38 128 116)" fill="#fff" stroke="#131313" stroke-width="2"/><ellipse cx="112" cy="128" rx="84" ry="122" transform="rotate(-38 112 128)" fill="url(#cyG)" stroke="#131313" stroke-width="2"/></svg>
 <svg class="he he-smile" viewBox="0 0 130 140"><path d="M20 20L116 6v110" fill="#fff" stroke="#131313" stroke-width="2"/><rect x="2" y="20" width="114" height="116" fill="#fff" stroke="#131313" stroke-width="2"/><path d="M32 62V48h14M72 48h14v14M86 94v14H72M46 108H32V94M47 66v9M71 66v9M45 88q14 12 28 0" fill="none" stroke="#131313" stroke-width="3" stroke-linecap="round"/></svg>
 <svg class="he he-cone" viewBox="0 0 90 120"><path d="M6 4l18 98M6 4l76 66" stroke="#131313" stroke-width="2" fill="none"/><ellipse cx="54" cy="88" rx="38" ry="17" transform="rotate(-30 54 88)" fill="url(#cyG)" stroke="#131313" stroke-width="2"/></svg>
 <svg class="he he-wedge" viewBox="0 0 134 134"><path d="M4 4h104l22 26H28v100L4 104z" fill="#fff" stroke="#131313" stroke-width="2"/><path d="M28 30h102L28 130z" fill="url(#cyG)" stroke="#131313" stroke-width="2"/><path d="M42 46h.1M64 46h.1M86 46h.1M42 68h.1M64 68h.1M42 90h.1" stroke="#131313" stroke-width="7" stroke-linecap="round"/></svg>
 <div class="he he-card"><span class="he-dots">✳✳✳</span><div class="he-card__head"><i></i><b>Seu Agente</b><small>exemplo de conversa</small></div>
  <div class="he-card__log">${bubbles([['in', 'Oi! Tem horário no sábado?'], ['out', 'Tenho sim. Qual horário fica melhor?'], ['in', 'Às 10h'], ['out', 'Fechado! Já marquei na agenda.']])}</div>
  <div class="he-card__tele">${ico('cal')}<span>Reserva registrada na Agenda</span></div></div>
</div>`;

/* grade modular: [coluna, linha, tipo, ícone, ícone no hover, texto] */
const CELLS = [
  [3, 1, 'white', 'chat', 'chat2', 'Conversa'], [7, 1, 'dark1', 'send'], [11, 1, 'white', 'quiz', 'quiz2', 'Mini Quiz'],
  [1, 2, 'dark2', 'hash'], [12, 2, 'white', 'cal', 'cal2', 'Agenda'], [1, 3, 'dark2', 'list'],
  [1, 5, 'white', 'phone', 'phone2', 'No celular'], [5, 5, 'grad', 'clock'],
  [12, 4, 'dark3', 'pause'], [12, 5, 'dark3', 'clock2'], [11, 4, 'dark3', 'chat'], [11, 5, 'white', 'clock', 'clock2', 'Horário'],
  [7, 5, 'go', 'g1'], [8, 5, 'go', 'g2'], [9, 5, 'go', 'g3']
];
function grid() {
  const used = new Set(CELLS.map(c => c[0] + '-' + c[1]));
  let html = '';
  for (let r = 1; r <= 5; r++) for (let c = 1; c <= 12; c++) {
    if (r >= 2 && r <= 4 && c >= 2 && c <= 10) continue;
    if (!used.has(c + '-' + r)) html += `<i class="solutions__block r${r} c${c} mod--empty"></i>`;
  }
  CELLS.forEach(([c, r, type, a, b, label]) => {
    const pos = `r${r} c${c}`;
    if (type === 'white') html += `<div class="solutions__block ${pos} mod--wite" tabindex="0" role="img" aria-label="${label}"><span class="solutions__img">${ico(a)}</span><span class="solutions__img mod--hover">${ico(b)}<small>${label}</small></span></div>`;
    else if (type === 'go') html += `<i class="solutions__block ${pos} mod--go ${a}">${arrow()}</i>`;
    else html += `<i class="solutions__block ${pos} mod--${type}"><span class="solutions__par">${ico(a)}</span></i>`;
  });
  return html;
}

const ARGS = [
  ['a1', '01', 'Qualificação de quem chama', 'O Agente entende o que a pessoa quer, pergunta data e quantidade e conduz até a reserva.', 'chat2', 'Prospecção ativa (puxar conversa com novos contatos) não está no painel: consulte a OLC.'],
  ['a2', '02', 'Atendimento no WhatsApp', 'Responde na hora, no horário que você definir.', 'clock'],
  ['a3', '03', 'Agenda automática', 'Reserva confirmada entra na Agenda.', 'cal'],
  ['a4', '04', 'Treino simples', 'Mini Quiz de 5 passos ou comando #treinar no WhatsApp.', 'hash'],
  ['a5', '05', 'Controle no celular', 'Pause o Agente em um contato e assuma a conversa.', 'phone2']
];

const STEPS = [
  ['01.', 'Responda o Mini Quiz', 'Cinco passos: o que você oferece, preços, horários, jeito de falar e cuidados.', [['sys', 'Passo 1 de 5 · Sobre o seu negócio'], ['in', 'O que a sua empresa oferece?'], ['out', 'Passeios privativos de lancha.']]],
  ['02.', 'Conecte o seu WhatsApp', 'Pelo QR Code ou pelo código no celular, em Aparelhos conectados.', [['sys', 'WhatsApp → Aparelhos conectados'], ['in', 'Código de conexão gerado no painel'], ['out', 'Aparelho conectado ✓']]],
  ['03.', 'Teste como se fosse o cliente', 'Converse com o Agente no painel antes de colocar no ar.', [['out', 'Quais passeios vocês têm?'], ['in', 'Temos três roteiros privativos. Quer que eu explique?'], ['out', 'Quero para sábado.']]],
  ['04.', 'Acompanhe a Agenda', 'Veja as reservas, as conversas e assuma quando quiser.', [['sys', 'Novo agendamento'], ['in', 'Sábado às 10h · 6 pessoas'], ['out', 'Status: Confirmado ✓']]]
];

function render(root, on) {
  root.innerHTML = `<div class="lp">
 <header class="header" id="lpHeader"><div class="lp-wrap header__columns">
  <a class="header__logo" href="#Protection" data-scroll>${star('lp-star--logo')}<b>OLC · Agente IA</b></a>
  <nav class="header__nav" id="lpNav" aria-label="Seções">${NAV.map(n => `<a href="#${n[0]}" data-scroll data-animate="link">${n[1]}</a>`).join('')}<a class="only-mobile" href="${WA}" target="_blank" rel="noopener">Falar no WhatsApp</a></nav>
  <div class="header__right"><a class="header__wa" href="${WA}" target="_blank" rel="noopener" data-animate="link">Falar no WhatsApp</a><button type="button" class="header__signin" data-login><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-9 10c0-5 4-8 9-8s9 3 9 8z"/></svg>Entrar no Painel</button><button type="button" class="header__burger" id="lpBurger" aria-expanded="false" aria-controls="lpNav" aria-label="Abrir menu"><i></i><i></i><i></i></button></div>
 </div></header>

 <main>
 <section class="section--hero" id="Protection"><div class="lp-wrap hero__columns">
  <div class="hero__text">
   <div class="hero__over-row"><p class="hero__over-heading">Agente de prospecção, atendimento &amp; agendamento para empresas</p><svg viewBox="0 0 60 90" aria-hidden="true"><path d="M58 90V8q0-4-4-4H8" fill="none" stroke="#131313" stroke-width="2"/><path d="M0 4l12-5v10z" fill="#131313"/></svg></div>
   <h1>Seu WhatsApp atende e agenda ${star('hero__heading-star')}</h1>
   <div class="hero__price-wrap"><div class="hero__price"><b>5<sup>passos</sup></b><span>para ensinar o seu Agente</span></div>${cube('Testar Meu Agente', 'data-login')}</div>
  </div>
  ${heroArt}
 </div></section>

 <section class="section--solutions" id="Solutions" aria-labelledby="solTitle"><div class="solutions__columns">
  ${grid()}
  <div class="solutions__center"><div><h2 id="solTitle">Do primeiro oi à agenda</h2><a class="btn2" href="${WA}" target="_blank" rel="noopener">Falar com um especialista ${arrow()}<i class="line mod--1"></i><i class="line mod--2"></i></a></div>
   <p>Você ensina o que a empresa oferece. O Agente responde no WhatsApp com essas informações, tira dúvidas, conduz a reserva e registra na Agenda. Quando quiser, você pausa o Agente naquele contato e assume a conversa.</p></div>
 </div></section>

 <section class="section--arguments" id="Arguments" aria-labelledby="argTitle"><div class="lp-wrap">
  <h2 id="argTitle">O que o seu Agente faz</h2>
  <div class="argument__grid">
   ${ARGS.map(a => `<article class="argument__card ${a[0]}"><span class="argument__num">${a[1]}</span>${ico(a[4])}<h3>${a[2]}</h3><p>${a[3]}</p>${a[5] ? `<small>${a[5]}</small>` : ''}</article>`).join('')}
   <div class="argument__cube a6" data-animate="cube-hover"><button type="button" class="argument__cube-front" data-login>${arrow()}<span class="argument__cube-title">Testar o meu Agente</span></button><i class="argument__cube-side mod--1"></i><i class="argument__cube-side mod--2"></i><i class="argument__cube-side mod--3"></i></div>
  </div>
 </div></section>

 <section class="section--runline" aria-label="Como as empresas usam o Agente OLC"><div class="runline" data-animate="runline" aria-hidden="true">${[0, 1].map(() => `<div class="runline__set">${['Como as empresas usam o Agente OLC', 'Qualificação de contatos', 'Atendimento no WhatsApp', 'Agenda integrada'].map(t => `<span>${t}</span>${star()}`).join('')}</div>`).join('')}</div></section>

 <section class="section--slider" id="Using" aria-labelledby="useTitle"><h2 id="useTitle" class="sr">Simulador: o passo a passo do Agente</h2><div class="using">
  <div class="using__text" data-swiper="reviews2"><div class="using__track" id="trackX">${STEPS.map((s, i) => `<article class="using__slide" aria-label="Passo ${i + 1} de ${STEPS.length}"><h3>${s[1]}</h3><p>${s[2]}</p></article>`).join('')}</div></div>
  <div class="using__visual" data-swiper="reviews"><div class="using__stack" id="trackY">${STEPS.map(s => `<div class="using__chat"><span>exemplo ilustrativo</span>${bubbles(s[3])}</div>`).join('')}</div></div>
  <div class="using__side"><div class="using__num" id="useNum">01.</div><div class="using__ctl"><button type="button" id="usePrev" aria-label="Passo anterior"><svg viewBox="0 0 40 24" aria-hidden="true"><path d="M39 12H2M12 2L2 12l10 10"/></svg></button><button type="button" id="useNext" aria-label="Próximo passo"><svg viewBox="0 0 40 24" aria-hidden="true"><path d="M1 12h37M28 2l10 10-10 10"/></svg></button></div></div>
 </div></section>
 </main>

 <footer class="footer">
  <a class="footer__get-link" href="${WA}" target="_blank" rel="noopener"><span class="lp-wrap"><h2>Pronto para começar? ${arrow()}</h2></span></a>
  <div class="lp-wrap footer__cols">
   <div><h3>Sobre</h3><p>Agente de atendimento e agendamento no WhatsApp, entregue e acompanhado pela OLC Digital.</p></div>
   <div><h3>Mapa</h3>${NAV.map(n => `<a href="#${n[0]}" data-scroll data-animate="link">${n[1]}</a>`).join('')}</div>
   <div><h3>Contato</h3><a href="${WA}" target="_blank" rel="noopener" data-animate="link">WhatsApp (12) 98868-5845</a></div>
   <div><h3>Acesso</h3><button type="button" data-login>Entrar no Painel</button><button type="button" data-master>👑 Modo Mestre OLC</button></div>
  </div>
  <p class="footer__copy">OLC Digital · 2026</p>
 </footer>
</div>`;

  const lp = root.querySelector('.lp'), burger = lp.querySelector('#lpBurger');
  const setMenu = v => { lp.classList.toggle('menu-open', v); burger.setAttribute('aria-expanded', v); burger.setAttribute('aria-label', v ? 'Fechar menu' : 'Abrir menu'); };
  burger.onclick = () => setMenu(!lp.classList.contains('menu-open'));
  lp.addEventListener('click', e => {
    const s = e.target.closest('[data-scroll]');
    if (s) { e.preventDefault(); setMenu(false); const t = lp.querySelector(s.getAttribute('href')); if (t) t.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' }); return; }
    if (e.target.closest('[data-login]')) { setMenu(false); on.login(); }
    if (e.target.closest('[data-master]')) on.master();
  });

  /* carrossel duplo sincronizado: texto na horizontal, conversas na vertical */
  let i = 0;
  const X = lp.querySelector('#trackX'), Y = lp.querySelector('#trackY'), num = lp.querySelector('#useNum');
  const slides = [...X.children], chats = [...Y.children];
  function go(n) {
    i = (n + STEPS.length) % STEPS.length;
    X.style.transform = `translateX(${-i * 100}%)`; Y.style.transform = `translateY(${-i * 100}%)`;
    num.textContent = STEPS[i][0];
    slides.forEach((el, k) => el.setAttribute('aria-hidden', k !== i));
    chats.forEach((el, k) => el.setAttribute('aria-hidden', k !== i));
  }
  lp.querySelector('#usePrev').onclick = () => go(i - 1);
  lp.querySelector('#useNext').onclick = () => go(i + 1);
  [X.parentElement, Y.parentElement].forEach(box => {
    let x0 = null;
    box.addEventListener('pointerdown', e => x0 = [e.clientX, e.clientY]);
    box.addEventListener('pointerup', e => { if (!x0) return; const dx = e.clientX - x0[0]; x0 = null; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); });
    box.addEventListener('pointercancel', () => x0 = null);
  });
  go(0);

  /* parallax dos ícones e do topo (somente computador) */
  if (!calm() && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const pars = [...lp.querySelectorAll('.solutions__par')], art = [...lp.querySelectorAll('.he')];
    lp.addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      pars.forEach(p => p.style.transform = `translate(${x * 14}px, ${y * 14}px)`);
      art.forEach((a, k) => a.style.translate = `${x * (k % 3 + 1) * -7}px ${y * (k % 3 + 1) * -7}px`);
    });
  }
}
window.OLCLanding = render;
})();
