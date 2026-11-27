/* OLC · Aplicativo do Agente (app.html): entrar, criar conta, quiz e painel. Nenhuma senha, PIN ou chave fica neste arquivo. */
(function () {
'use strict';
const API = 'https://n8n.187.53.124.11.sslip.io/webhook/olc-cliente-api';
const CHECKOUT = window.OLC_CONFIG.checkout;
const PLAN_NAME = { semanal: 'Teste de 7 Dias · R$ 47', mensal: 'Plano Mensal · R$ 197/mês' };

/* aviso de instalação do Android: pode chegar antes de a tela de instalar aparecer */
let installPrompt = null, onInstallPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (onInstallPrompt) onInstallPrompt(); });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
const TABS = [
  ['bot', 'Meu Agente', 'Agente', 'M12 3v3M7 6h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM9 12h.01M15 12h.01M9.5 16h5M2 11v3M22 11v3'],
  ['chat', 'Testar ao Vivo', 'Testar', 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5A8.4 8.4 0 1 1 21 11.5z'],
  ['agenda', 'Agenda', 'Agenda', 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8.5 14.5l2.3 2.3 4.7-4.6'],
  ['convs', 'Conversas', 'Conversas', 'M4 5h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM19 9h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1v3l-4-3h-3']
];
const I = {
  x: 'M6 6l12 12M18 6L6 18', trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10', send: 'M4 12l16-8-6 17-3-7z', refresh: 'M20 11a8 8 0 1 0-2.3 6M20 4v7h-7',
  check: 'M5 12.5l4.500 4.500L19 7.500', crown: 'M4 17l-1-9 5 4 4-7 4 7 5-4-1 9zM5 20h14',
  spark: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z'
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const digits = v => String(v ?? '').replace(/\D/g, '');
const list = v => Array.isArray(v) ? v : [];
const when = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const waLink = v => { if (S.demo) return ''; let n = digits(v); if (n.length === 10 || n.length === 11) n = '55' + n; return n.length >= 12 ? 'https://wa.me/' + n : ''; };
const store = {
  get(a, k) { try { return JSON.parse(window[a].getItem(k)); } catch (e) { return null; } },
  set(a, k, v) { try { window[a].setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(a, k) { try { window[a].removeItem(k); } catch (e) {} }
};
const sessKey = slug => 'olc.pin.' + slug;
const quizKey = slug => 'olc.quiz.' + slug;
const savedPin = slug => store.get('localStorage', sessKey(slug)) || store.get('sessionStorage', sessKey(slug)) || '';
const ADMIN = 'olc.mestre';

const S = { demo: false, local: '', slug: '', pin: '', client: null, wa: null, tab: 'bot', admin: store.get('sessionStorage', ADMIN) || '', chats: {}, agFilter: 'todos', convFilter: 'todas', convQuery: '', convSel: '', busyChat: false, linkMode: false };

/* ---------- conta de teste guardada neste aparelho ---------- */
const localKey = slug => 'olc.local.' + slug;
const DEMO = 'demonstracao-olc';
let demoRec = null;
const localGet = slug => slug === DEMO ? demoRec : store.get('localStorage', localKey(slug));
const localSave = (slug, rec) => { if (slug === DEMO) demoRec = rec; else store.set('localStorage', localKey(slug), rec); };
const LAST = 'olc.last';
const slugify = v => String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '|' + pin));
  return [...new Uint8Array(buf)].map(n => n.toString(16).padStart(2, '0')).join('');
}
function localApi(body) {
  const rec = localGet(body.slug);
  if (!rec) throw new Error('Não achei esta conta neste aparelho.');
  const c = rec.client, a = body.action;
  if (a === 'save_bot_settings') ['botAtivo', 'contextoCliente', 'contextoAdminOLC', 'tomDeVoz', 'horarioInicio', 'horarioFim', 'telefoneDono', 'servicosCatalogo', 'nicho', 'cidade'].forEach(k => { if (body[k] !== undefined) c[k] = body[k]; });
  if (a === 'add_context') c.notasContexto = [{ id: 'ctx-' + Date.now(), autor: body.autor || c.nomeEmpresa, origem: body.origem || 'Painel do Cliente', texto: body.texto, criadoEm: new Date().toISOString() }, ...list(c.notasContexto)];
  if (a === 'delete_context') c.notasContexto = list(c.notasContexto).filter(n => n.id !== body.notaId);
  if (a === 'update_booking') {
    if (body.novoAgendamento) c.agendamentos = [Object.assign({ id: 'ag-' + Date.now(), status: 'confirmado' }, body.novoAgendamento), ...list(c.agendamentos)];
    else c.agendamentos = list(c.agendamentos).map(g => g.id === body.agendamentoId ? Object.assign(g, { status: body.status }) : g);
  }
  if (a === 'toggle_pause_contact') { const p = list(c.contatosPausados); c.contatosPausados = p.includes(body.telefone) ? p.filter(x => x !== body.telefone) : [...p, body.telefone]; }
  localSave(body.slug, rec);
  const out = { ok: true, client: JSON.parse(JSON.stringify(c)), whatsappStatus: { state: 'close' } };
  if (a === 'test_chat') out.reply = body.slug === DEMO ? demoReply(body.mensagem) : 'Modo de teste: o Agente desta conta ainda não está ligado. O que você ensinou ficou salvo neste aparelho.';
  if (a === 'connect_whatsapp') out.qr = {};
  return out;
}

/* ---------- rede ---------- */
async function api(body, ms = 60000) {
  if (body && body.slug && S.local && body.slug === S.local && !body.adminKey) return localApi(body);
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  let data;
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal, cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error('rede');
    data = await r.json();
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Demorou demais para responder. Tente de novo.' : 'Não consegui falar com o sistema. Confira a internet e tente de novo.');
  } finally { clearTimeout(t); }
  if (Array.isArray(data)) data = data[0];
  if (!data || data.ok !== true) {
    const m = String(data && data.error || ''), code = Number(data && data.code) || 0;
    const err = new Error(code === 429 || /código|PIN|Chave|Autentica|Credenciais|não encontrado|Digite|Informe|inválid/i.test(m) ? m : 'Não deu certo agora. Tente de novo em instantes.');
    err.code = code; throw err;
  }
  return data;
}
const call = (action, extra, ms) => api(Object.assign({ action, slug: S.slug, pin: S.pin }, extra), ms);

/* ---------- utilidades de tela ---------- */
let toastT;
function toast(msg, bad) { const el = $('#toast'); el.textContent = msg; el.className = 'toast on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => el.className = 'toast', bad ? 5200 : 2800); }
async function busy(btn, fn) {
  if (btn && btn.getAttribute('aria-busy') === 'true') return;
  if (btn) { btn.setAttribute('aria-busy', 'true'); btn.disabled = true; }
  try { return await fn(); }
  catch (e) { toast(e.message, true); }
  finally { if (btn && btn.isConnected) { btn.removeAttribute('aria-busy'); btn.disabled = false; } }
}
const modal = $('#modal');
let onModalClose = null;
/* o teclado só abre quando a pessoa toca num campo: solta o campo antes de abrir janela ou trocar de tela
   (senão, ao fechar uma janela, o navegador devolve o foco ao campo e o teclado reaparece) */
function releaseField() { const el = document.activeElement; if (el && el.matches('input,textarea,select')) el.blur(); }
function openModal(title, html, wide) {
  releaseField();
  modal.className = 'modal' + (wide ? ' wide' : '');
  modal.innerHTML = `<div class="modal-head"><h2 id="modalTitle" tabindex="-1" autofocus>${esc(title)}</h2><button type="button" class="iconbtn" data-close aria-label="Fechar">${icon(I.x)}</button></div>${html}`;
  if (!modal.open) modal.showModal();
}
modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) modal.close(); });
modal.addEventListener('close', () => { if (modal.open) return; if (onModalClose) onModalClose(); onModalClose = null; modal.innerHTML = ''; modal.className = 'modal'; });
function confirmBox(title, text, yes) {
  return new Promise(res => {
    openModal(title, `<p class="mute">${esc(text)}</p><div class="acts" data-confirm><button type="button" class="btn danger" data-yes>${esc(yes)}</button><button type="button" class="btn ghost" data-close>Voltar</button></div>`);
    $('[data-confirm]', modal).style.marginTop = '18px';
    let ok = false; onModalClose = () => res(ok);
    $('[data-yes]', modal).onclick = () => { ok = true; modal.close(); };
  });
}
function applyClient(c) { if (c && c.slug === S.slug) { S.client = c; updateHero(); } }

/* ---------- movimento ---------- */
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function stagger(els, dx = 0, dy = 16) {
  if (calm()) return;
  els.forEach((el, i) => el.animate([{ opacity: 0, transform: `translate(${dx}px, ${dy}px)` }, { opacity: 1, transform: 'none' }], { duration: 480, delay: Math.min(i, 8) * 55, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
}
const NODE = {
  wa: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5A8.4 8.4 0 1 1 21 11.5z',
  ia: 'M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM10 10h4v4h-4z'
};
function heroState() {
  const on = !!S.client.botAtivo, open = !!(S.wa && S.wa.state === 'open');
  if (!on) return { key: 'paused', seal: 'Agente em pausa', title: 'Em pausa.', text: 'O seu Agente não responde ninguém até você ligar.' };
  if (open) return { key: 'live', seal: 'Agente atendendo ao vivo', title: 'No ar agora.', text: 'Seu Agente está ligado e conectado ao seu WhatsApp.' };
  return { key: 'ready', seal: 'Falta conectar o WhatsApp', title: 'Agente pronto.', text: 'Seu Agente está ligado. Conecte o WhatsApp para ele atender.' };
}
const KPIS = [
  ['notas', 'Regras Ativas no Agente', () => list(S.client.notasContexto).length],
  ['srv', 'Serviços no Catálogo', () => list(S.client.servicosCatalogo).length],
  ['ags', 'Reservas na Agenda', () => list(S.client.agendamentos).filter(a => a.status !== 'cancelado').length]
];
function buildHero() {
  const el = $('#hero');
  el.innerHTML = `<div class="h-top"><span class="h-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M18 8h4v8l6-6 3 3-6 6h7v4h-7l6 6-3 3-6-6v6h-4v-6l-6 6-3-3 6-6H8v-4h7l-6-6 3-3 6 6z" fill="#0a0a09"/></svg></span><div class="h-copy"><span class="seal-live"><i></i><b id="hSeal"></b></span><h2 id="hTitle"></h2><p id="hText"></p></div></div>
  <div class="flow" role="img" id="hFlow">
   <div class="node n-wa">${icon(NODE.wa)}<span>WhatsApp</span></div>
   <div class="link l1"><i></i></div>
   <div class="node n-ia">${icon(NODE.ia)}<span>Agente</span></div>
   <div class="link l2"><i></i></div>
   <div class="node n-ag">${icon(TABS[2][3])}<span>Agenda</span></div>
  </div>
  <div class="h-acts"><div class="power"><button type="button" class="switch" role="switch" id="bBot" aria-label="Ligar ou pausar o Agente"></button><span id="hPower"></span></div><button type="button" class="btn" id="bConn"></button><button type="button" class="btn gold" id="bQuiz">${icon(I.spark)}Personalizar Agente (Refazer Quiz)</button></div>
  <div class="kpis">${KPIS.map(k => `<button type="button" class="kpi" data-kpi="${k[0]}"><b data-n></b><span>${k[1]}</span><em aria-hidden="true">${'<i></i>'.repeat(8)}</em></button>`).join('')}</div>`;
  $('#bBot').onclick = async e => {
    const b = e.currentTarget, next = !S.client.botAtivo;
    if (b.disabled) return; b.disabled = true; b.setAttribute('aria-checked', next);
    try { const d = await call('save_bot_settings', { botAtivo: next }); applyClient(d.client); toast(next ? 'Agente ligado.' : 'Agente em pausa.'); burst(); }
    catch (x) { toast(x.message, true); }
    b.disabled = false; updateHero();
  };
  $('#bConn').onclick = connectModal;
  $('#bQuiz').onclick = () => openQuiz(false);
  el.onclick = e => {
    const k = e.target.closest('[data-kpi]'); if (!k) return;
    const to = k.dataset.kpi, tab = to === 'ags' ? 'agenda' : 'bot';
    if (S.tab !== tab) show(tab);
    const target = $(to === 'notas' ? '#cNotas' : to === 'srv' ? '#cSrv' : '#cAgenda');
    if (target) target.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' });
  };
  updateHero();
}
function updateHero() {
  const el = $('#hero'); if (!el || !S.client || !$('#hSeal')) return;
  const st = heroState(), on = !!S.client.botAtivo, open = !!(S.wa && S.wa.state === 'open');
  el.dataset.state = st.key;
  $('#hSeal').textContent = st.seal; $('#hTitle').textContent = st.title; $('#hText').textContent = st.text;
  $('#bBot').setAttribute('aria-checked', on); $('#hPower').textContent = on ? 'Agente ligado' : 'Agente em pausa';
  const c = $('#bConn'); c.textContent = open ? 'WhatsApp conectado ✓' : 'Conectar WhatsApp (QR / Código)'; c.className = 'btn ' + (open ? '' : 'primary');
  $('#hFlow').setAttribute('aria-label', open ? 'Fluxo ativo entre WhatsApp, seu Agente e sua Agenda' : 'WhatsApp ainda não conectado ao seu Agente');
  KPIS.forEach(([key, label, get]) => {
    const card = $(`[data-kpi="${key}"]`, el), n = get(), prev = card.dataset.v;
    card.dataset.v = n; $('[data-n]', card).textContent = n; card.setAttribute('aria-label', `${label}: ${n}`);
    $$('em i', card).forEach((s, i) => s.classList.toggle('lit', i < n));
    if (prev !== undefined && Number(prev) !== n) pulse(card);
  });
}
function pulse(el) {
  if (!el || calm()) return;
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)', offset: .35 }, { transform: 'scale(1)' }], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
  glow(el);
}
function glow(el) {
  if (!el || calm()) return;
  const g = document.createElement('i'); g.className = 'glow'; el.appendChild(g);
  g.animate([{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'scale(1)', offset: .25 }, { opacity: 0, transform: 'scale(1.01)' }], { duration: 1300, easing: 'ease-out' }).onfinish = () => g.remove();
}
function burst() {
  const r = $('#hero .h-mark'); if (!r || calm()) return;
  r.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22) rotate(45deg)', offset: .4 }, { transform: 'scale(1) rotate(90deg)' }], { duration: 850, easing: 'cubic-bezier(.22,1,.36,1)' });
}

/* ---------- Mini Quiz de Onboarding (6 passos) ---------- */
const TONES = [
  ['Simpático, acolhedor e prestativo', '🤝 Simpático e acolhedor', 'Recebe com simpatia, tira dúvidas com paciência e passa segurança.'],
  ['Direto ao ponto, comercial e focado em fechar reserva', '⚡ Comercial e direto ao ponto', 'Respostas objetivas que conduzem o cliente rapidamente para o agendamento.'],
  ['Sofisticado, consultivo e calmo', '✨ Consultivo e sofisticado', 'Linguagem elegante, ideal para serviços premium, clínicas e passeios exclusivos.'],
  ['Descontraído, leve e natural', '🏖️ Leve e descontraído', 'Conversa natural de WhatsApp, ideal para turismo, lazer e atendimento diário.']
];
function needsInitialQuiz(c) {
  if (!c) return false;
  if (store.get('localStorage', quizKey(c.slug))) return false;
  const hasQuizNote = list(c.notasContexto).some(n => /Quiz Inicial/i.test(String(n.origem || '')));
  if (hasQuizNote) return false;
  // Se a conta acabou de ser criada (sem contextoCliente preenchido), abre na hora
  return !String(c.contextoCliente || '').trim();
}
function openQuiz(isFirstTime) {
  const c = S.client; if (!c) return;
  let step = 1;
  const total = 6;
  let waMode = isPhone() ? 'code' : 'qr', waTimer = null;
  const state = {
    nicho: c.nicho || '',
    resumoServicos: c.contextoCliente || '',
    precosPagamento: '',
    localRegras: '',
    horarioInicio: c.horarioInicio || '07:00',
    horarioFim: c.horarioFim || '22:00',
    tomDeVoz: c.tomDeVoz || TONES[0][0],
    restricoes: '',
    telefoneDono: c.telefoneDono || '',
    zapAgente: c.telefoneDono || ''
  };
  releaseField();
  if (modal.open) { modal.close(); }

  /* o quiz ocupa exatamente a área visível: barras do navegador e teclado */
  const vv = window.visualViewport;
  const keepVisible = () => {
    const el = document.activeElement, body = $('.qz-body', modal);
    if (!body || !el || !body.contains(el) || !el.matches('input,textarea')) return;
    const field = el.closest('[data-field]') || el, q = $('.qz-q', modal);
    const box = body.getBoundingClientRect(), pin = q && getComputedStyle(q).position === 'sticky' ? q.offsetHeight : 0;
    const b = { top: box.top + pin, bottom: box.bottom }, r = field.getBoundingClientRect(), e = el.getBoundingClientRect();
    if (r.bottom > b.bottom - 6) body.scrollTop += Math.min(r.bottom - b.bottom + 6, Math.max(0, r.top - b.top - 6));
    const e2 = el.getBoundingClientRect();
    if (e2.bottom > b.bottom - 6) body.scrollTop += e2.bottom - b.bottom + 6;
    else if (e2.top < b.top + 6) body.scrollTop -= b.top + 6 - e2.top;
  };
  const fit = () => {
    if (!modal.classList.contains('quiz')) return;
    const sheet = innerWidth < 700, zoomed = vv && vv.scale > 1.05;
    const h = vv && !zoomed ? vv.height : innerHeight;
    modal.style.height = sheet && vv && !zoomed ? Math.round(h) + 'px' : '';
    modal.style.top = sheet && vv && !zoomed ? Math.round(vv.offsetTop) + 'px' : '';
    modal.classList.toggle('short', h < 620);
    modal.classList.toggle('tiny', h < 440);
    requestAnimationFrame(keepVisible);
    setTimeout(keepVisible, 280);
  };
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  addEventListener('resize', fit);
  const cleanup = () => {
    if (vv) { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); }
    removeEventListener('resize', fit);
    clearTimeout(waTimer);
    modal.style.height = modal.style.top = ''; modal.onclick = modal.oninput = modal.onfocusin = null;
    document.documentElement.classList.remove('quiz-lock');
  };

  const field = (label, control, main) => `<div class="qz-field${main ? ' qz-main' : ''}" data-field><label for="${control.match(/id="(\w+)"/)[1]}">${label}</label>${control}</div>`;
  function stepHtml() {
    if (step === 1) {
      const chips = ['Passeios de Lancha / Barco', 'Clínica / Massoterapia / Estética', 'Consultório / Saúde', 'Turismo & Experiências', 'Serviços Locais'];
      return [`O que a ${esc(c.nomeEmpresa)} oferece?`, 'Escreva do seu jeito. Uma ou duas frases já ajudam.',
        field('Responda aqui', `<textarea id="qResumo" rows="4" enterkeyhint="done" placeholder="Ex.: passeios privativos de lancha para até 8 pessoas">${esc(state.resumoServicos)}</textarea>`, true) +
        `<div class="qz-extra" data-field><label for="qNicho">Ramo (opcional)</label><div class="qz-chips">${chips.map(ch => `<button type="button" data-qchip="${esc(ch)}" class="${state.nicho.toLowerCase() === ch.toLowerCase() ? 'on' : ''}">${esc(ch)}</button>`).join('')}</div><input id="qNicho" value="${esc(state.nicho)}" placeholder="Ex.: passeio de lancha"></div>`];
    }
    if (step === 2) return ['Quais são os preços e como se paga?', 'O Agente usa isso nos orçamentos. Pode deixar em branco.',
      field('Responda aqui', `<textarea id="qPrecos" rows="6" enterkeyhint="done" placeholder="Ex.: roteiro Norte R$ 1.800 (até 8 pessoas). Sinal de 30% no Pix e o restante no dia.">${esc(state.precosPagamento)}</textarea>`, true)];
    if (step === 3) return ['Quando e onde o Agente atende?', 'Ajuste o horário e conte o local.',
      `<div class="qz-times"><div class="qz-field" data-field><label for="qIni">Atende das</label><input type="time" id="qIni" value="${esc(state.horarioInicio)}"></div><div class="qz-field" data-field><label for="qFim">Até</label><input type="time" id="qFim" value="${esc(state.horarioFim)}"></div></div>` +
      field('Endereço, ponto de encontro ou regras', `<textarea id="qLocal" rows="4" enterkeyhint="done" placeholder="Ex.: saída da Marina às 9h30. Chegar 20 minutos antes.">${esc(state.localRegras)}</textarea>`, true)];
    if (step === 4) return ['Conecte o WhatsApp do Agente', 'É o número em que o Agente vai atender.',
      waMarkup(waMode, state.zapAgente, true, field('Número do WhatsApp com DDD', waInput(state.zapAgente), true))];
    if (step === 5) return ['Como o Agente deve falar?', 'Toque em um estilo.',
      `<div class="qz-tones" data-field>${TONES.map(([val, title, desc]) => `<button type="button" class="qz-tone ${state.tomDeVoz === val ? 'on' : ''}" aria-pressed="${state.tomDeVoz === val}" data-tone="${esc(val)}"><b>${esc(title)}</b><small>${esc(desc)}</small></button>`).join('')}</div>` +
      field('Ou escreva do seu jeito', `<input id="qTom" enterkeyhint="done" value="${esc(state.tomDeVoz)}">`)];
    return ['O que o Agente não pode prometer?', 'Os dois campos são opcionais.',
      field('Cuidados e restrições', `<textarea id="qRestr" rows="3" placeholder="Ex.: não dar desconto sem me consultar.">${esc(state.restricoes)}</textarea>`, true) +
      field('Seu WhatsApp para aviso de agendamento', `<input id="qTel" type="tel" inputmode="tel" enterkeyhint="done" placeholder="55 + DDD + número" value="${esc(state.telefoneDono)}">`)];
  }

  function renderStep(back) {
    const [question, hint, answer] = stepHtml(), last = step === total;
    modal.className = 'modal quiz' + (back ? ' back' : '');
    modal.innerHTML = `<div class="qz-top">
        <button type="button" class="qz-x" data-close aria-label="Fechar o quiz">${icon(I.x)}</button>
        <div class="qz-segs" role="progressbar" aria-label="Passo do quiz" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${step}">${Array.from({ length: total }, (_, k) => `<i class="${k + 1 < step ? 'done' : k + 1 === step ? 'now' : ''}"></i>`).join('')}</div>
        <span class="qz-count">${step} de ${total}</span>
      </div>
      <div class="qz-body"><div class="qz-in"><p class="qz-eyebrow"><svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#d7fb5c"/><path d="M18 8h4v8l6-6 3 3-6 6h7v4h-7l6 6-3 3-6-6v6h-4v-6l-6 6-3-3 6-6H8v-4h7l-6-6 3-3 6 6z" fill="#0a0a09"/></svg>Mini Quiz · passo ${step}</p><h2 id="modalTitle" class="qz-q" tabindex="-1" autofocus>${question}</h2><p class="qz-hint">${hint}</p>${answer}</div></div>
      <div class="qz-foot"><p class="qz-err" role="alert"></p><div class="qz-nav">
        ${step > 1 ? '<button type="button" class="qz-prev" id="qPrev" aria-label="Voltar">←</button>' : ''}
        <button type="button" class="qz-go" id="${last ? 'qFinish' : 'qNext'}">${last ? 'Concluir e ativar ✓' : 'Continuar →'}</button>
      </div></div>`;
    if (!modal.open) modal.showModal();
    const title = $('.qz-q', modal); title.focus({ preventScroll: true });
    $('.qz-body', modal).scrollTop = 0;
    fit();

    const err = $('.qz-err', modal);
    const main = $('.qz-main', modal);
    const mark = () => { if (main) main.classList.toggle('filled', !!$('textarea,input', main).value.trim()); };
    mark();
    modal.oninput = () => { mark(); err.textContent = ''; if (main) main.classList.remove('miss'); };
    modal.onfocusin = () => setTimeout(keepVisible, 120);
    modal.onclick = e => {
      const ch = e.target.closest('[data-qchip]');
      if (ch) {
        state.nicho = ch.dataset.qchip;
        const inp = $('#qNicho', modal); if (inp) inp.value = state.nicho;
        $$('[data-qchip]', modal).forEach(b => b.classList.toggle('on', b === ch));
      }
      const tn = e.target.closest('[data-tone]');
      if (tn) {
        state.tomDeVoz = tn.dataset.tone;
        const inp = $('#qTom', modal); if (inp) inp.value = state.tomDeVoz;
        $$('[data-tone]', modal).forEach(b => { b.classList.toggle('on', b === tn); b.setAttribute('aria-pressed', b === tn); });
      }
    };
    function saveCurrentInputs() {
      if (step === 1) { state.nicho = ($('#qNicho', modal)?.value || '').trim() || state.nicho; state.resumoServicos = ($('#qResumo', modal)?.value || '').trim(); }
      if (step === 2) { state.precosPagamento = ($('#qPrecos', modal)?.value || '').trim(); }
      if (step === 3) { state.horarioInicio = $('#qIni', modal)?.value || '07:00'; state.horarioFim = $('#qFim', modal)?.value || '22:00'; state.localRegras = ($('#qLocal', modal)?.value || '').trim(); }
      if (step === 4) { state.zapAgente = ($('#qZap', modal)?.value || '').trim(); }
      if (step === 5) { state.tomDeVoz = ($('#qTom', modal)?.value || '').trim() || state.tomDeVoz; }
      if (step === 6) { state.restricoes = ($('#qRestr', modal)?.value || '').trim(); state.telefoneDono = ($('#qTel', modal)?.value || '').trim(); }
    }
    const prev = $('#qPrev', modal), next = $('#qNext', modal), fin = $('#qFinish', modal);
    clearTimeout(waTimer);
    if (step === 4) wireWhatsApp($('.qz-wa', modal), {
      alive: () => modal.open && step === 4, error: $('.qz-err', modal), timer: t => { clearTimeout(waTimer); waTimer = t; },
      mode: m => { waMode = m; }, skip: () => { saveCurrentInputs(); step++; renderStep(); } });
    if (prev) prev.onclick = () => { saveCurrentInputs(); step--; renderStep(true); };
    if (next) next.onclick = () => {
      saveCurrentInputs();
      if (step === 1 && !state.resumoServicos) {
        err.textContent = 'Conte rapidinho o que a empresa oferece.';
        main.classList.add('miss'); $('.qz-body', modal).scrollTop = 0; return;
      }
      step++; renderStep();
    };
    if (fin) fin.onclick = e => {
      saveCurrentInputs();
      err.textContent = '';
      busy(e.currentTarget, async () => {
        try {
          const partes = [
            state.resumoServicos ? `Sobre a empresa e serviços: ${state.resumoServicos}` : '',
            state.precosPagamento ? `Valores e pagamento: ${state.precosPagamento}` : '',
            state.localRegras ? `Local, horários e regras: ${state.localRegras}` : '',
            state.restricoes ? `Cuidados e restrições: ${state.restricoes}` : ''
          ].filter(Boolean);
          const contextoFinal = partes.join('\n');
          const d1 = await call('save_bot_settings', {
            contextoCliente: contextoFinal || c.contextoCliente,
            tomDeVoz: state.tomDeVoz || c.tomDeVoz,
            horarioInicio: state.horarioInicio,
            horarioFim: state.horarioFim,
            telefoneDono: state.telefoneDono
          });
          applyClient(d1.client);
          if (partes.length) {
            const d2 = await call('add_context', {
              texto: `Resumo do Quiz Inicial:\n${contextoFinal}`,
              autor: S.client.nomeEmpresa,
              origem: 'Quiz Inicial'
            });
            applyClient(d2.client);
          }
          if (!S.demo) store.set('localStorage', quizKey(S.slug), true);
          modal.close();
          show(S.tab);
          burst();
          toast(S.demo ? 'Demonstração: nada foi gravado de verdade.' : S.local ? 'Respostas salvas neste aparelho (modo de teste).' : 'Pronto! O seu Agente já aprendeu tudo sobre a sua empresa.');
        } catch (x) { err.textContent = x.message; }
      });
    };
  }
  document.documentElement.classList.add('quiz-lock');
  onModalClose = cleanup;
  renderStep();
}

/* ---------- demonstração: empresa fictícia, só na memória, nada vai ao servidor ---------- */
function demoData() {
  const ago = h => new Date(Date.now() - h * 3600000).toISOString();
  return { client: {
    slug: DEMO, nomeEmpresa: 'Marina Exemplo', nicho: 'Passeios de lancha', cidade: 'Cidade Exemplo', telefoneDono: '', botAtivo: true,
    horarioInicio: '08:00', horarioFim: '20:00', tomDeVoz: 'Simpático, acolhedor e prestativo',
    contextoCliente: 'Empresa de exemplo. Passeios privativos de lancha, com saída combinada pelo WhatsApp.', contatosPausados: ['5500000000002'],
    notasContexto: [
      { id: 'd1', autor: 'Marina Exemplo', origem: 'Quiz Inicial', texto: 'Passeios privativos de lancha para grupos de até 8 pessoas.', criadoEm: ago(50) },
      { id: 'd2', autor: 'Marina Exemplo', origem: 'Painel do Cliente', texto: 'Pedir para o grupo chegar 20 minutos antes da saída.', criadoEm: ago(5) }],
    servicosCatalogo: [
      { id: 's1', nome: 'Passeio Ilhas (exemplo)', preco: 'Consultar', duracao: 'Meio período', detalhes: 'Roteiro ilustrativo.' },
      { id: 's2', nome: 'Passeio Pôr do Sol (exemplo)', preco: 'Consultar', duracao: 'Fim de tarde', detalhes: 'Roteiro ilustrativo.' },
      { id: 's3', nome: 'Dia Inteiro (exemplo)', preco: 'Consultar', duracao: 'Dia todo', detalhes: 'Roteiro ilustrativo.' }],
    agendamentos: [
      { id: 'g1', clienteNome: 'Cliente Exemplo A', clienteTelefone: '', servico: 'Passeio Ilhas (exemplo)', dataHora: 'Hoje às 10h', detalhes: '6 pessoas. Vão levar uma criança.', status: 'confirmado' },
      { id: 'g2', clienteNome: 'Cliente Exemplo B', clienteTelefone: '', servico: 'Passeio Pôr do Sol (exemplo)', dataHora: 'Hoje às 16h30', detalhes: '2 pessoas. Aniversário de casamento.', status: 'pendente' },
      { id: 'g3', clienteNome: 'Cliente Exemplo E', clienteTelefone: '', servico: 'Passeio Ilhas (exemplo)', dataHora: 'Sábado às 9h', detalhes: '8 pessoas.', status: 'confirmado' },
      { id: 'g4', clienteNome: 'Cliente Exemplo F', clienteTelefone: '', servico: 'Dia Inteiro (exemplo)', dataHora: 'Domingo às 9h', detalhes: 'Aguardando confirmar a quantidade de pessoas.', status: 'pendente' },
      { id: 'g5', clienteNome: 'Cliente Exemplo C', clienteTelefone: '', servico: 'Dia Inteiro (exemplo)', dataHora: 'Quarta passada às 9h', detalhes: '8 pessoas.', status: 'concluido' },
      { id: 'g6', clienteNome: 'Cliente Exemplo G', clienteTelefone: '', servico: 'Passeio Pôr do Sol (exemplo)', dataHora: 'Sexta passada às 16h', detalhes: 'Cliente pediu para remarcar.', status: 'cancelado' }],
    conversas: [
      { telefone: '5500000000001', nome: 'Cliente Exemplo A', atualizadoEm: ago(1), historico: [
        { role: 'user', content: 'Oi! Tem horário no sábado?', hora: '10:02' }, { role: 'assistant', content: 'Tem sim! Qual horário fica melhor para você?', hora: '10:02' },
        { role: 'user', content: 'Às 10h, somos 6 pessoas.', hora: '10:03' }, { role: 'assistant', content: 'Fechado! Já registrei na agenda ✅', hora: '10:03' }] },
      { telefone: '5500000000002', nome: 'Cliente Exemplo D', atualizadoEm: ago(3), historico: [
        { role: 'user', content: 'Vocês fazem passeio para aniversário?', hora: '08:14' }, { role: 'assistant', content: 'Posso anotar o seu pedido. Para qual data você pensa?', hora: '08:14' },
        { role: 'user', content: 'Quero falar com uma pessoa.', hora: '08:20' }] },
      { telefone: '5500000000003', nome: 'Cliente Exemplo B', atualizadoEm: ago(6), historico: [
        { role: 'user', content: 'Qual passeio vocês indicam para um casal?', hora: '18:41' }, { role: 'assistant', content: 'O Passeio Pôr do Sol é uma boa opção. Quer que eu anote um horário?', hora: '18:41' },
        { role: 'user', content: 'Pode ser hoje à tarde.', hora: '18:45' }, { role: 'assistant', content: 'Anotei o pedido para hoje às 16h30. A equipe confirma com você.', hora: '18:45' }] },
      { telefone: '5500000000004', nome: 'Cliente Exemplo F', atualizadoEm: ago(26), historico: [
        { role: 'user', content: 'Queria o passeio de dia inteiro no domingo.', hora: '21:07' }, { role: 'assistant', content: 'Certo! Quantas pessoas vão?', hora: '21:07' }] }]
  } };
}
function demoReply(m) {
  const t = String(m || '').toLowerCase();
  if (/agendar|reservar|marcar|sábado|sabado|horário|horario/.test(t)) return 'Posso reservar para você. Quantas pessoas vão e qual horário prefere?\n\n(Resposta ilustrativa da demonstração.)';
  if (/passeio|roteiro|opç|opc|serviç|servic/.test(t)) return 'Neste exemplo há três opções: Passeio Ilhas, Pôr do Sol e Dia Inteiro. Qual combina mais com você?\n\n(Resposta ilustrativa da demonstração.)';
  if (/preço|preco|valor|quanto/.test(t)) return 'Nesta demonstração não há preços cadastrados. Na sua conta, o Agente responde com os valores que você ensinar.\n\n(Resposta ilustrativa da demonstração.)';
  return 'Na sua conta, o Agente responde com o que você ensinar no quiz.\n\n(Resposta ilustrativa da demonstração.)';
}
function leaveDemo() { S.demo = false; S.local = ''; }
function openDemo(tab) {
  releaseField(); if (modal.open) modal.close();
  if (!demoRec) demoRec = demoData();
  S.demo = true; S.local = DEMO; S.admin = ''; S.slug = DEMO; S.pin = '@demo'; S.wa = null; S.tab = tab || 'bot'; S.agFilter = 'todos';
  S.client = JSON.parse(JSON.stringify(demoRec.client));
  if (!S.chats[DEMO]) S.chats[DEMO] = [{ role: 'user', content: 'Oi! Quais passeios vocês têm?' }, { role: 'assistant', content: demoReply('quais passeios') }];
  history.replaceState(null, '', location.pathname + '?demo=1');
  shell(); window.scrollTo(0, 0);
}

/* ---------- depois do plano: instalar (só celular) → criar conta → quiz ---------- */
function isPhone() {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function sampleQr() {
  let s = '';
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
    if ((x * 5 + y * 9 + x * y) % 3 === 0) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  [[0, 0], [14, 0], [0, 14]].forEach(([x, y]) => s += `<path d="M${x} ${y}h7v7h-7zm1 1v5h5v-5z" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`);
  return `<svg viewBox="-1 -1 23 23" role="img" aria-label="Desenho de exemplo de um QR Code" shape-rendering="crispEdges">${s}</svg>`;
}
const OLC_MARK = '<svg class="ent-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#d7fb5c"/><path d="M18 8h4v8l6-6 3 3-6 6h7v4h-7l6 6-3 3-6-6v6h-4v-6l-6 6-3-3 6-6H8v-4h7l-6-6 3-3 6 6z" fill="#0a0a09"/></svg>';
function startPlan(plan) {
  const url = String(CHECKOUT[plan] || '').trim();
  if (/^https:\/\//.test(url)) { location.assign(url); return; }
  afterPayment(plan);
}
function afterPayment(plan) {
  leaveDemo();
  const p = CHECKOUT[plan] !== undefined ? plan : 'mensal';
  history.replaceState(null, '', location.pathname + '?pos_pagamento=1&plano=' + p);
  if (isPhone() && !isInstalled()) screenInstall(p); else screenSignup(p);
}
function stepsBar(now) {
  const names = isPhone() && !isInstalled() ? ['Aplicativo', 'Conta', 'Agente'] : ['Conta', 'Agente'];
  return `<ol class="ent-steps" aria-label="Etapas">${names.map(n => `<li${n === now ? ' aria-current="step"' : ''}>${n}</li>`).join('')}</ol>`;
}
function onboardScreen(plan, now, inner) {
  releaseField(); if (modal.open) modal.close();
  const fromDemo = S.demo;
  S.client = null; S.wa = null; leaveDemo(); document.title = 'OLC · Meu Agente';
  const paid = plan && /^https:\/\//.test(CHECKOUT[plan] || '');
  $('#app').innerHTML = `<main class="ent ent--onb">
   <div class="ent-top">${fromDemo ? '<button type="button" class="ent-btn" data-demo><span aria-hidden="true">←</span> Voltar à demonstração</button>' : '<button type="button" class="ent-btn" data-signin>Já tenho conta · Entrar</button>'}</div>
   <section class="ent-box">
    ${plan && !paid ? '<p class="ent-test"><b>Modo de teste:</b> nenhum pagamento foi cobrado.</p>' : ''}
    ${stepsBar(now)}${plan ? `<p class="ent-plan">${PLAN_NAME[plan]}</p>` : ''}${inner}
   </section></main>`;
  const demo = $('[data-demo]'), signin = $('[data-signin]');
  if (demo) demo.onclick = () => { onInstallPrompt = null; openDemo(); };
  if (signin) signin.onclick = () => { onInstallPrompt = null; gate(); };
  window.scrollTo(0, 0);
  stagger($$('.ent-box>*'), 0, 18);
}
function screenInstall(plan) {
  const ios = isIOS();
  const share = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v9h14v-9h-1"/></svg>';
  const plus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM12 8v8M8 12h8"/></svg>';
  onboardScreen(plan, 'Aplicativo', `<div class="ent-head"><h1 class="ent-h">Coloque o app no celular</h1><p class="ent-sub">Um toque no ícone da OLC abre o seu painel.</p></div>
    <div class="pwa-home" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><span class="pwa-app">${OLC_MARK}<b>Meu Agente</b></span><i></i><i></i></div>
    <div class="ent-form pwa-how">
     ${ios ? `<ol class="pwa-list"><li><span>${share}</span><p>Toque em <b>Compartilhar</b> no navegador</p></li><li><span>${plus}</span><p>Escolha <b>Adicionar à Tela de Início</b></p></li></ol>`
           : `<button type="button" class="ent-go pwa-install" id="pwaBtn" hidden>Instalar Aplicativo no Celular</button><p class="pwa-tip" id="pwaTip">No navegador, toque no menu <b>⋮</b> e em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p>`}
     <button type="button" class="ent-alt" id="pwaNext">Já adicionei / Continuar para criar minha conta <span aria-hidden="true">→</span></button>
    </div>`);
  const wasDemo = $('[data-demo]') !== null;
  $('#pwaNext').onclick = () => { onInstallPrompt = null; if (wasDemo) S.demo = true; screenSignup(plan); };
  if (ios) return;
  const offer = () => {
    const b = $('#pwaBtn'); if (!b || !installPrompt) return;
    b.hidden = false;
    b.onclick = async () => {
      const ev = installPrompt; if (!ev) return;
      installPrompt = null; ev.prompt();
      const choice = await ev.userChoice.catch(() => null);
      b.hidden = true;
      if ($('#pwaTip')) $('#pwaTip').textContent = choice && choice.outcome === 'accepted' ? 'Instalação iniciada. Toque em continuar.' : 'Sem problema. Você pode instalar depois pelo menu do navegador.';
    };
  };
  onInstallPrompt = offer; offer();
}
function screenSignup(plan) {
  onboardScreen(plan, 'Conta', `<div class="ent-head"><h1 class="ent-h">Criar minha conta</h1><p class="ent-sub">Três campos e o seu Agente começa a aprender.</p></div>
   <form id="signup" class="ent-form" novalidate>
    <label>Nome da empresa<input name="nome" maxlength="80" autocomplete="organization" enterkeyhint="next" placeholder="ex.: Pousada Mar Azul"></label>
    <p class="ent-slug" id="slugView" hidden>Seu identificador para entrar: <b></b></p>
    <label>Seu WhatsApp<input name="zap" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="next" placeholder="DDD + número"></label>
    <label>Criar código de acesso<span class="ent-pw"><input name="pin" type="password" autocomplete="new-password" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" enterkeyhint="go" placeholder="6 ou mais caracteres"><button type="button" class="ent-eye" aria-pressed="false">Ver</button></span></label>
    <p class="err" role="alert"></p>
    <button class="ent-go" type="submit">Criar conta e configurar meu Agente <span aria-hidden="true">→</span></button>
    <p class="ent-hint">Nesta fase de teste, a conta fica salva só neste aparelho.</p>
   </form>`);
  const f = $('#signup'), view = $('#slugView');
  f.nome.oninput = () => { const s = slugify(f.nome.value); view.hidden = !s; $('b', view).textContent = s; };
  $('.ent-eye', f).onclick = e => { const on = f.pin.type === 'password'; f.pin.type = on ? 'text' : 'password'; e.currentTarget.textContent = on ? 'Ocultar' : 'Ver'; e.currentTarget.setAttribute('aria-pressed', on); };
  f.onsubmit = e => {
    e.preventDefault();
    const nome = f.nome.value.trim(), slug = slugify(nome), pin = f.pin.value.trim(), err = $('.err', f);
    let zap = digits(f.zap.value);
    if (!slug) { err.textContent = 'Digite o nome da empresa.'; return; }
    if (zap.length < 10 || zap.length > 13) { err.textContent = 'Digite o seu WhatsApp com DDD.'; return; }
    if (pin.length < 6 || /\s/.test(pin)) { err.textContent = 'Crie um código com 6 ou mais caracteres, sem espaços.'; return; }
    if (localGet(slug)) { err.textContent = 'Já existe uma conta com este nome neste aparelho. Volte e toque em Entrar.'; return; }
    if (zap.length <= 11) zap = '55' + zap;
    releaseField(); err.textContent = '';
    busy($('.ent-go', f), async () => {
      const salt = randomCode(), client = { slug, nomeEmpresa: nome, nicho: '', cidade: '', telefoneDono: zap, contextoCliente: '', notasContexto: [], servicosCatalogo: [], agendamentos: [], conversas: [], contatosPausados: [], botAtivo: true, tomDeVoz: '', horarioInicio: '08:00', horarioFim: '18:00' };
      localSave(slug, { salt, hash: await hashPin(pin, salt), plano: plan, client });
      if (!localGet(slug)) { err.textContent = 'O navegador bloqueou o armazenamento. Saia do modo anônimo e tente de novo.'; return; }
      store.del('localStorage', quizKey(slug));
      enterLocal(slug, true, true);
    });
  };
  keyboardRoom($('.ent'));
}
function enterLocal(slug, keep, forceQuiz) {
  S.demo = false;
  const rec = localGet(slug); if (!rec) { gate(slug); return; }
  releaseField(); if (modal.open) modal.close();
  S.local = slug; S.slug = slug; S.pin = '@local'; S.wa = null; S.tab = 'bot';
  S.client = JSON.parse(JSON.stringify(rec.client));
  if (keep !== null) store.set(keep ? 'localStorage' : 'sessionStorage', sessKey(slug), '@local');
  store.set('localStorage', LAST, slug);
  history.replaceState(null, '', location.pathname + '?cliente=' + encodeURIComponent(slug));
  shell(); window.scrollTo(0, 0);
  if (forceQuiz || needsInitialQuiz(S.client)) openQuiz(true);
}

/* ---------- entrada (sem lista pública de empresas) ---------- */
/* com o teclado aberto: tela enxuta, com o campo tocado e o botão Entrar visíveis */
function keyboardRoom(screen) {
  const vv = window.visualViewport;
  const fit = () => {
    if (!screen.isConnected) { if (vv) vv.removeEventListener('resize', fit); removeEventListener('resize', fit); return; }
    const el = document.activeElement, typing = !!(el && screen.contains(el) && el.matches('input:not([type=checkbox])'));
    const h = vv ? vv.height : innerHeight, kb = typing && h < 620;
    screen.classList.toggle('kb', kb);
    if (!kb) return;
    requestAnimationFrame(() => {
      const go = $('.ent-go', screen).getBoundingClientRect(), field = (el.closest('label') || el).getBoundingClientRect();
      const top = vv ? vv.offsetTop : 0, hidden = go.bottom + 10 - (top + h);
      if (hidden > 0) scrollBy(0, Math.min(hidden, Math.max(0, field.top - top - 8)));
      else if (field.top < top + 8) scrollBy(0, field.top - top - 8);
    });
    setTimeout(() => {
      if (document.activeElement !== el || !screen.classList.contains('kb')) return;
      const r = el.getBoundingClientRect(), top = vv ? vv.offsetTop : 0;
      if (r.top < top + 30) scrollBy(0, r.top - top - 30);
    }, 260);
  };
  if (vv) vv.addEventListener('resize', fit);
  addEventListener('resize', fit);
  screen.addEventListener('focusin', () => setTimeout(fit, 150));
  screen.addEventListener('focusout', () => setTimeout(fit, 150));
}
function gate(prefill = '', error = '') {
  releaseField(); if (modal.open) modal.close();
  leaveDemo(); S.client = null; S.wa = null; document.title = 'OLC · Meu Agente';
  $('#app').innerHTML = `<main class="ent">
    <section class="ent-box" aria-labelledby="entT">
   <div class="ent-head"><svg class="ent-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#d7fb5c"/><path d="M18 8h4v8l6-6 3 3-6 6h7v4h-7l6 6-3 3-6-6v6h-4v-6l-6 6-3-3 6-6H8v-4h7l-6-6 3-3 6 6z" fill="#0a0a09"/></svg>
    <p class="ent-eyebrow">Para quem já tem conta</p>
    <h1 id="entT">Entrar</h1>
    <p class="ent-sub">Use o identificador da empresa e o código de acesso recebidos no seu WhatsApp.</p></div>
   <form id="login" class="ent-form" novalidate>
    <label>Identificador da empresa<input name="slug" autocomplete="username" autocapitalize="none" spellcheck="false" enterkeyhint="next" placeholder="ex.: minha-empresa" value="${esc(prefill)}" required></label>
    <label>Código de acesso<input name="pin" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Digite seu código de acesso" required></label>
    <label class="ent-keep"><input type="checkbox" name="keep" checked><span>Manter conectado neste aparelho</span></label>
    <p class="err" role="alert">${esc(error)}</p>
    <button class="ent-go" type="submit">Entrar <span aria-hidden="true">→</span></button>
   </form>
   <div class="ent-more">
    <button type="button" class="ent-demo" data-opendemo>Ver painel por dentro (Demonstração) <span aria-hidden="true">→</span></button>
    <button type="button" class="ent-link" data-signup>Criar nova conta</button>
   </div>
  </section></main>`;
  stagger($$('.ent-head>*,#login'), 0, 18);
  keyboardRoom($('.ent'));
  const f = $('#login');
  f.onsubmit = e => {
    e.preventDefault();
    const slug = f.slug.value.trim().toLowerCase().replace(/\s+/g, '-'), pin = f.pin.value.trim();
    if (!slug || !pin) { $('.err', f).textContent = 'Preencha o identificador da empresa e o código de acesso.'; return; }
    busy($('button[type=submit]', f), async () => {
      try {
        const rec = localGet(slug);
        if (rec && await hashPin(pin, rec.salt) === rec.hash) { enterLocal(slug, f.keep.checked); return; }
        S.local = '';
        await enter(slug, pin, f.keep.checked);
      } catch (x) { $('.err', f).textContent = x.message; }
    });
  };
  $('[data-opendemo]').onclick = () => openDemo();
  $('[data-signup]').onclick = () => { history.replaceState(null, '', location.pathname); screenSignup(''); };
}
async function enter(slug, pin, keep, viaAdmin, forceQuiz) {
  S.local = ''; S.demo = false;
  const d = await api(viaAdmin ? { action: 'get_client', slug, adminKey: S.admin } : { action: 'get_client', slug, pin });
  S.slug = slug; S.client = d.client; S.wa = d.whatsappStatus || null;
  S.pin = viaAdmin ? String(d.client.pinAcesso || '') : pin;
  if (!viaAdmin && keep !== null) store.set(keep ? 'localStorage' : 'sessionStorage', sessKey(slug), pin);
  S.tab = 'bot';
  releaseField();
  history.replaceState(null, '', location.pathname + '?cliente=' + encodeURIComponent(slug));
  if (modal.open) modal.close();
  store.set('localStorage', LAST, slug);
  shell();
  const askQuiz = forceQuiz || S.wantQuiz === slug;
  S.wantQuiz = '';
  if (askQuiz || needsInitialQuiz(S.client)) openQuiz(true);
}
function logout() {
  if (S.demo) { leaveDemo(); delete S.chats[DEMO]; demoRec = null; S.slug = S.pin = ''; }
  else {
    store.del('localStorage', sessKey(S.slug)); store.del('sessionStorage', sessKey(S.slug));
    if (store.get('localStorage', LAST) === S.slug) store.del('localStorage', LAST);
    delete S.chats[S.slug]; S.local = ''; S.slug = S.pin = ''; S.admin = ''; store.del('sessionStorage', ADMIN);
  }
  history.replaceState(null, '', location.pathname); S.linkMode = false; gate(); window.scrollTo(0, 0);
}

/* ---------- Modo Mestre ---------- */
function master() {
  if (S.admin) return masterList();
  openModal('Acesso da equipe OLC', `<form class="stack" id="mk"><p class="mute small">Exclusivo da equipe OLC. A chave vale só até fechar a aba.</p><label>Chave da equipe<input type="password" name="key" autocomplete="off" required></label><p class="err" role="alert"></p><button class="btn primary block">Entrar</button></form>`);
  const f = $('#mk', modal);
  f.onsubmit = e => {
    e.preventDefault(); const key = f.key.value.trim(); if (!key) return;
    busy($('button', f), async () => {
      try {
        const d = await api({ action: 'list_clients', adminKey: key });
        S.admin = key; store.set('sessionStorage', ADMIN, key); masterList(d.clients);
      } catch (x) { $('.err', f).textContent = x.code === 401 ? 'Chave incorreta.' : x.message; }
    });
  };
}
async function masterList(pre) {
  openModal('Clientes da OLC', '<p class="mute">Carregando clientes…</p>');
  let clients = pre;
  try { if (!clients) clients = (await api({ action: 'list_clients', adminKey: S.admin })).clients; }
  catch (e) { openModal('Clientes da OLC', `<p class="err">${esc(e.message)}</p>`); return; }
  openModal('Clientes da OLC', `<div class="acts"><button type="button" class="btn primary" data-new>+ Criar novo cliente (abre com Quiz)</button><button type="button" class="btn ghost" data-leave>Sair do acesso da equipe</button></div>
  <ul class="list">${list(clients).map(c => `<li class="item"><h3>${esc(c.nomeEmpresa)}</h3><p class="small mute">${esc(c.nicho)}${c.cidade ? ' · ' + esc(c.cidade) : ''}</p><div class="acts"><button type="button" class="btn primary" data-open="${esc(c.slug)}">Abrir painel</button><button type="button" class="btn gold" data-quiz="${esc(c.slug)}">Abrir no Mini Quiz</button><button type="button" class="btn" data-copy="${esc(c.slug)}">Copiar link + código</button></div></li>`).join('') || '<li class="empty">Nenhum cliente ainda.</li>'}</ul>`);
  modal.onclick = e => {
    const o = e.target.closest('[data-open]'), qz = e.target.closest('[data-quiz]'), c = e.target.closest('[data-copy]');
    if (o) busy(o, () => enter(o.dataset.open, '', null, true, false));
    if (qz) busy(qz, () => enter(qz.dataset.quiz, '', null, true, true));
    if (c) busy(c, () => copyAccess(c.dataset.copy));
    if (e.target.closest('[data-new]')) newClient();
    if (e.target.closest('[data-leave]')) { S.admin = ''; store.del('sessionStorage', ADMIN); modal.close(); if (S.client) { logout(); } toast('Modo mestre encerrado.'); }
  };
}
const clientLink = (slug, pin) => location.origin + location.pathname + '?cliente=' + encodeURIComponent(slug) + (pin ? '&codigo=' + encodeURIComponent(pin) : '');
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) { return false; }
}
async function showAccess(slug, pin, nome) {
  const direct = clientLink(slug, pin);
  const text = `${nome}: o painel do seu Agente está pronto!\nAcesse direto por este link (ao abrir, responda o Mini Quiz rápido para personalizar o seu Agente):\n${direct}\n\nIdentificador: ${slug}\nCódigo de acesso: ${pin}`;
  const ok = await copyText(text);
  openModal(ok ? 'Acesso copiado ✓' : 'Acesso do cliente', `<p class="mute small">${ok ? 'Já copiado! Cole no WhatsApp do cliente. Quando ele abrir o link, o Mini Quiz de 5 passos abre automaticamente.' : 'Selecione e copie o texto abaixo.'}</p><textarea readonly rows="6" aria-label="Link e código do cliente">${esc(text)}</textarea><div class="acts" data-back><button type="button" class="btn primary" data-openquiz>Abrir painel com Mini Quiz agora</button><button type="button" class="btn" data-list>Voltar aos clientes</button></div>`);
  $('[data-back]', modal).style.marginTop = '14px';
  modal.onclick = e => {
    if (e.target.closest('[data-list]')) masterList();
    if (e.target.closest('[data-openquiz]')) enter(slug, '', null, true, true);
  };
}
async function copyAccess(slug) {
  const d = await api({ action: 'get_client', slug, adminKey: S.admin });
  await showAccess(slug, d.client.pinAcesso, d.client.nomeEmpresa);
}
function randomCode() { const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', a = new Uint32Array(8); crypto.getRandomValues(a); return 'OLC-' + [...a].map(n => abc[n % abc.length]).join(''); }
function newClient() {
  modal.onclick = null;
  openModal('Criar conta de novo cliente', `<form class="stack" id="nc"><p class="mute small">Assim que o cliente abrir o link da conta, ele responderá o <b>Mini Quiz de 5 passos</b> para ensinar o Agente.</p><label>Nome da empresa<input name="nomeEmpresa" required maxlength="80" placeholder="Ex.: Lancha Mar Azul"></label><label>Nicho / Ramo<input name="nicho" required placeholder="Ex.: Passeio de lancha, Clínica de estética" maxlength="80"></label><div class="row"><label>Cidade<input name="cidade" maxlength="60" placeholder="Ex.: Ilhabela - SP"></label><label>WhatsApp do proprietário<input name="telefoneDono" inputmode="tel" placeholder="55 DDD número"></label></div><div class="row"><label>Código de acesso<input name="pinAcesso" minlength="6" required autocomplete="off" autocapitalize="none" spellcheck="false" value="${randomCode()}"></label></div><label>Observação interna da OLC (opcional)<textarea name="contextoAdminOLC" rows="3" placeholder="Instruções extras configuradas pela equipe OLC"></textarea></label><p class="err" role="alert"></p><button class="btn primary block">Criar conta e gerar link do Mini Quiz</button></form>`);
  const f = $('#nc', modal);
  f.onsubmit = e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f).entries());
    Object.keys(v).forEach(k => v[k] = v[k].trim());
    if (!v.nomeEmpresa || !v.nicho) { $('.err', f).textContent = 'Preencha o nome e o nicho.'; return; }
    if (v.pinAcesso.length < 6 || /\s/.test(v.pinAcesso)) { $('.err', f).textContent = 'Use um código com pelo menos 6 caracteres, sem espaços.'; return; }
    busy($('button.primary', f), async () => {
      const cur = (await api({ action: 'list_clients', adminKey: S.admin })).clients;
      const slug = v.nomeEmpresa.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (list(cur).some(c => c.slug === slug)) { $('.err', f).textContent = 'Já existe um cliente com esse nome.'; return; }
      const d = await api(Object.assign({ action: 'create_client', adminKey: S.admin, contextoCliente: '' }, v));
      store.del('localStorage', quizKey(d.client.slug));
      await showAccess(d.client.slug, d.client.pinAcesso, d.client.nomeEmpresa);
    });
  };
}

/* ---------- estrutura do painel ---------- */
function shell() {
  const c = S.client; document.title = c.nomeEmpresa + ' · Meu Agente OLC';
  const mark = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#d7fb5c"/><path d="M18 8h4v8l6-6 3 3-6 6h7v4h-7l6 6-3 3-6-6v6h-4v-6l-6 6-3-3 6-6H8v-4h7l-6-6 3-3 6 6z" fill="#0a0a09"/></svg>';
  const exit = S.demo ? 'Sair da demonstração' : 'Sair';
  const bar = S.demo ? `<div class="demobar"><p><b>Demonstração.</b> Empresa e dados fictícios, para conhecer o app por dentro.</p><div class="demo-acts"><button type="button" class="btn primary" data-demoquiz>Abrir Quiz (6 passos)</button><button type="button" class="btn ghost" data-demoinstall>Tela de Instalar</button><button type="button" class="btn ghost" data-demosignup>Tela de Criar Conta</button></div></div>`
    : S.local ? '<p class="testbar"><b>Modo de teste.</b> Conta salva só neste aparelho: o Agente ainda não está ligado a um WhatsApp.</p>' : '';
  $('#app').innerHTML = `<div class="shell${bar ? ' has-bar' : ''}">
  <nav class="side" aria-label="Seções do painel">
   <div class="logo">${mark}<span>Meu Agente</span></div>
   <div class="tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" class="tab" id="tab-${t[0]}" data-tab="${t[0]}" aria-controls="view">${icon(t[3])}<span>${t[1]}</span></button>`).join('')}</div>
   <div class="side-foot"><button type="button" class="btn ghost" data-logout>${icon(I.out)}${exit}</button></div>
  </nav>
  <div class="main">
   <header class="top"><span class="top-mark">${mark}</span><div class="who"><b>${esc(c.nomeEmpresa)}</b><small>${esc(c.nicho || 'Meu Agente')}${c.cidade ? ' · ' + esc(c.cidade) : ''}</small></div>
    <button type="button" class="iconbtn" data-reload aria-label="Atualizar dados">${icon(I.refresh)}</button>
    <button type="button" class="iconbtn mobile-only" data-logout aria-label="${exit}">${icon(I.out)}</button></header>
   ${bar}
   <div class="hero-wrap"><section class="hero" id="hero" aria-label="Estado do seu Agente"></section></div>
   <main class="view" id="view" role="tabpanel" tabindex="-1"></main>
  </div></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => show(b.dataset.tab));
  $$('[data-logout]').forEach(b => b.onclick = async () => { if (S.demo || await confirmBox('Sair do painel?', 'O código de acesso deixa de ficar lembrado neste aparelho.', 'Sair')) logout(); });
  if (S.demo) {
    $('[data-demoquiz]').onclick = () => openQuiz(false);
    $('[data-demoinstall]').onclick = () => screenInstall('');
    $('[data-demosignup]').onclick = () => screenSignup('');
  }
  buildHero();
  $('[data-reload]').onclick = e => busy(e.currentTarget, async () => { await reload(); show(S.tab); toast('Dados atualizados.'); });
  show(S.tab);
}
async function reload() { const slug = S.slug, d = await call('get_client'); if (slug !== S.slug) return; S.client = d.client; S.wa = d.whatsappStatus || null; updateHero(); }
function show(tab) {
  const order = TABS.map(t => t[0]), dir = order.indexOf(tab) - order.indexOf(S.tab);
  S.tab = tab;
  const hero = $('#hero'); hero.className = 'hero m-' + tab; hero.parentElement.className = 'hero-wrap w-' + tab;
  $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  const v = $('#view'); v.className = 'view' + (tab === 'chat' ? ' is-chat' : ''); v.setAttribute('aria-labelledby', 'tab-' + tab);
  ({ bot: viewBot, chat: viewChat, agenda: viewAgenda, convs: viewConvs })[tab](v);
  window.scrollTo(0, 0);
  const dx = Math.sign(dir) * 24;
  stagger(tab === 'chat' ? [$('.chat', v)] : $$('.view-head,.cols .card,.ag-sum,.cv', v), dx, dx ? 0 : 16);
}
const head = (t, p) => `<div class="view-head"><h1>${t}</h1><p>${p}</p></div>`;

/* ---------- aba 1: meu agente ---------- */
function viewBot(v) {
  const c = S.client;
  v.innerHTML = head('Meu Agente', 'Ligue, conecte seu WhatsApp e treine o seu Agente. Tudo o que você salvar aqui já vale nas próximas conversas.') + `<div class="cols">
  <div class="stack">
   <section class="card hi"><header><h2>Treinar Meu Agente Agora</h2><button type="button" class="btn gold" id="bOpenQuizCard">${icon(I.spark)}Mini Quiz (6 passos)</button></header>
    <form class="stack" id="fNota"><label>Aviso do dia, regra, preço ou orientação<textarea name="texto" rows="3" maxlength="1500" placeholder="Ex.: neste sábado não temos horário pela manhã."></textarea></label><button class="btn primary block">Adicionar ao Agente</button></form>
    <p class="tip">💡 Você também pode treinar o seu Agente pelo WhatsApp. Envie <code>#treinar sua regra</code> ou <code>#aviso seu aviso</code> na conversa <b>com o seu próprio número</b>.</p></section>
   <section class="card" id="cNotas"><header><h2>Regras e Informações Ativas</h2><span class="badge ok" id="nCount"></span></header><ul class="list" id="notas"></ul></section>
  </div>
  <div class="stack">
   ${S.admin ? `<section class="card admin"><h2>Contexto base da OLC</h2><form class="stack" id="fAdmin"><label>Visível só para a equipe OLC<textarea name="contextoAdminOLC" rows="7">${esc(c.contextoAdminOLC)}</textarea></label><div class="acts"><button class="btn gold">Salvar contexto base</button><button type="button" class="btn" id="bAccess">Copiar link + código</button></div></form></section>` : ''}
   <section class="card" id="cSrv"><header><h2>Serviços &amp; Preços</h2></header><p class="mute small">Roteiros, procedimentos ou opções que o seu Agente pode apresentar e agendar.</p><div class="list" id="catalogo"></div><div class="acts" id="catActs"><button type="button" class="btn" id="bAddSrv">+ Adicionar serviço</button><button type="button" class="btn primary" id="bSaveSrv">Salvar catálogo</button></div></section>
   <section class="card"><h2>Jeito de Atender do Agente</h2><form class="stack" id="fAj">
    <label>Orientações gerais da empresa<textarea name="contextoCliente" rows="4">${esc(c.contextoCliente)}</textarea></label>
    <label>Tom de voz do Agente<textarea name="tomDeVoz" rows="2">${esc(c.tomDeVoz)}</textarea></label>
    <div class="row"><label>Atende das<input type="time" name="horarioInicio" value="${esc(c.horarioInicio)}"></label><label>Até<input type="time" name="horarioFim" value="${esc(c.horarioFim)}"></label></div>
    <p class="mute small">Dentro desse horário, o seu Agente responde e agenda automaticamente no WhatsApp.</p>
    <label>WhatsApp do proprietário (recebe alertas de reserva)<input name="telefoneDono" inputmode="tel" value="${esc(c.telefoneDono)}"></label>
    <button class="btn primary block">Salvar jeito de atender</button></form></section>
  </div></div>`;
  $('#catActs').style.marginTop = '14px';
  $('#bOpenQuizCard').onclick = () => openQuiz(false);
  drawNotes(); drawCatalog(list(c.servicosCatalogo));

  $('#fNota').onsubmit = e => {
    e.preventDefault(); const f = e.target, texto = f.texto.value.trim(); if (!texto) { toast('Escreva o que o seu Agente deve aprender.', true); return; }
    busy($('button', f), async () => {
      const slug = S.slug;
      const d = await call('add_context', { texto, autor: S.admin ? 'Equipe OLC' : S.client.nomeEmpresa, origem: S.admin ? 'Admin OLC' : 'Painel do Cliente' });
      if (slug !== S.slug) return; applyClient(d.client); f.reset(); drawNotes(); const first = $('#notas>li'); if (first) { stagger([first], -24, 0); glow(first); } burst(); toast('O seu Agente já aprendeu.');
    });
  };
  $('#fAj').onsubmit = e => {
    e.preventDefault(); const f = e.target, now = Object.fromEntries(new FormData(f).entries()), changed = {};
    Object.entries(now).forEach(([k, val]) => { if (val !== String(S.client[k] ?? '')) changed[k] = val; });
    if (!Object.keys(changed).length) { toast('Nada mudou.'); return; }
    busy($('button', f), async () => { const d = await call('save_bot_settings', changed); applyClient(d.client); toast('Jeito de atender salvo.'); });
  };
  const fa = $('#fAdmin');
  if (fa) {
    fa.onsubmit = e => { e.preventDefault(); busy($('button.gold', fa), async () => { const d = await call('save_bot_settings', { contextoAdminOLC: fa.contextoAdminOLC.value }); applyClient(d.client); toast('Contexto base salvo.'); }); };
    $('#bAccess').onclick = () => showAccess(S.slug, S.pin, S.client.nomeEmpresa);
  }
  $('#bAddSrv').onclick = () => { const cur = readCatalog(); cur.push({ id: 'srv-' + Date.now(), nome: '', preco: '', duracao: '', detalhes: '' }); drawCatalog(cur, cur.length - 1); };
  $('#bSaveSrv').onclick = e => {
    const items = readCatalog();
    if (items.some(s => !s.nome)) { toast('Todo serviço precisa de um nome.', true); return; }
    busy(e.currentTarget, async () => { const d = await call('save_bot_settings', { servicosCatalogo: items }); applyClient(d.client); drawCatalog(list(S.client.servicosCatalogo)); toast('Catálogo salvo.'); });
  };
}
function drawNotes() {
  const el = $('#notas'); if (!el) return;
  const notes = list(S.client.notasContexto);
  $('#nCount').textContent = notes.length + (notes.length === 1 ? ' ativa' : ' ativas');
  el.innerHTML = notes.map(n => {
    const o = String(n.origem || ''), olc = /admin|olc/i.test(o + ' ' + (n.autor || ''));
    const label = olc ? 'Equipe OLC' : /quiz/i.test(o) ? 'Mini Quiz Inicial' : /whats/i.test(o) ? 'Você, pelo WhatsApp' : 'Você, pelo painel';
    return `<li class="item note"><div><span class="badge ${olc ? 'warn' : 'ok'}">${label}</span> <span class="small mute">${esc(n.autor)} · ${esc(when(n.criadoEm))}</span><p>${esc(n.texto)}</p></div><button type="button" class="iconbtn" data-del="${esc(n.id)}" aria-label="Excluir esta regra">${icon(I.trash)}</button></li>`;
  }).join('') || '<li class="empty">Nenhuma regra extra ainda. Responda o Mini Quiz ou escreva a primeira acima.</li>';
  el.onclick = async e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const n = notes.find(x => x.id === b.dataset.del);
    if (!await confirmBox('Excluir esta regra?', n ? n.texto : '', 'Excluir')) return;
    busy(b, async () => { const d = await call('delete_context', { notaId: b.dataset.del }); applyClient(d.client); drawNotes(); toast('Regra excluída.'); });
  };
}
const SRV = [['nome', 'Nome'], ['preco', 'Preço'], ['duracao', 'Duração'], ['detalhes', 'Detalhes']];
function drawCatalog(items, openIdx = -1) {
  const el = $('#catalogo'); if (!el) return;
  el.innerHTML = items.map((s, i) => `<details class="item" data-id="${esc(s.id)}" ${i === openIdx ? 'open' : ''}><summary>${esc(s.nome) || 'Novo serviço'}</summary><div class="body stack">${SRV.map(([k, l]) => `<label>${l}<input data-k="${k}" value="${esc(s[k])}" maxlength="300"></label>`).join('')}<button type="button" class="btn danger" data-rm>Remover serviço</button></div></details>`).join('') || '<p class="empty">Nenhum serviço cadastrado.</p>';
  el.onclick = e => { const r = e.target.closest('[data-rm]'); if (r) { r.closest('details').remove(); toast('Removido. Toque em Salvar catálogo para confirmar.'); } };
}
function readCatalog() { return $$('#catalogo details').map(d => { const o = { id: d.dataset.id }; $$('[data-k]', d).forEach(i => o[i.dataset.k] = i.value.trim()); return o; }); }

/* ---------- conexão do WhatsApp (quiz e painel): código de pareamento ou QR ---------- */
const waInput = zap => `<input id="qZap" type="tel" inputmode="tel" enterkeyhint="done" placeholder="DDD + número" value="${esc(zap)}">`;
function waMarkup(mode, zap, canSkip, phoneField) {
  return `<div class="qz-wa">
   <div class="qz-seg" role="tablist" aria-label="Como conectar"><button type="button" role="tab" data-wamode="code" aria-selected="${mode === 'code'}">Código no celular</button><button type="button" role="tab" data-wamode="qr" aria-selected="${mode === 'qr'}">QR Code</button></div>
   <div class="qz-wapane" data-wapane="code"${mode === 'code' ? '' : ' hidden'}>
    ${phoneField}
    <button type="button" class="qz-gen" id="qGenCode">Gerar código de 8 caracteres</button>
    <div class="qz-out" id="qCodeOut" aria-live="polite"></div>
    <p class="qz-how">Abra o WhatsApp &gt; <b>Aparelhos conectados</b> &gt; <b>Conectar com número de telefone</b></p>
   </div>
   <div class="qz-wapane" data-wapane="qr"${mode === 'qr' ? '' : ' hidden'}>
    <button type="button" class="qz-gen" id="qGenQr">Gerar QR Code</button>
    <div class="qz-out" id="qQrOut" aria-live="polite"></div>
    <p class="qz-how">No celular: WhatsApp &gt; <b>Aparelhos conectados</b> &gt; <b>Conectar um aparelho</b></p>
   </div>
   ${canSkip ? '<button type="button" class="qz-skip" id="qSkip">Pular e conectar depois no painel</button>' : ''}
  </div>`;
}
function wireWhatsApp(root, o) {
  const err = o.error, slug = S.slug;
  let tries = 0;
  const alive = () => root.isConnected && o.alive() && slug === S.slug;
  const connected = () => {
    o.timer(null);
    $$('.qz-wapane,.qz-seg,.qz-skip', root).forEach(el => el.hidden = true);
    if (!$('.qz-ok', root)) root.insertAdjacentHTML('afterbegin', '<p class="qz-ok">WhatsApp conectado ao Agente ✓</p>');
    updateHero();
  };
  if (S.wa && S.wa.state === 'open') { connected(); return; }
  const poll = async () => {
    if (!alive()) return;
    try { const d = await call('get_client', {}, 20000); S.wa = d.whatsappStatus || S.wa; applyClient(d.client); } catch (e) {}
    if (!alive()) return;
    if (S.wa && S.wa.state === 'open') { connected(); return; }
    if (++tries < 24) o.timer(setTimeout(poll, 5000));
  };
  const codeBox = (code, sample) => {
    const ch = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return `<div class="qz-code${sample ? ' is-sample' : ''}">${sample ? '<p class="qz-sample">Exemplo · não conecta</p>' : ''}<p class="qz-digits" aria-label="Código de conexão">${[...ch].map((x, i) => `<span${i === 4 ? ' class="gap"' : ''}>${esc(x)}</span>`).join('')}</p><button type="button" class="qz-copy" data-copy="${esc(ch)}">Copiar código</button></div>`;
  };
  const generate = (kind, btn) => {
    let phone = '';
    if (kind === 'code') {
      phone = digits($('#qZap', root).value);
      if (phone.length < 10) { err.textContent = 'Digite o número do WhatsApp com DDD.'; return; }
      if (phone.length <= 11) phone = '55' + phone;
    }
    err.textContent = ''; releaseField();
    const out = $(kind === 'code' ? '#qCodeOut' : '#qQrOut', root);
    busy(btn, async () => {
      if (S.local) {
        out.innerHTML = (kind === 'code' ? codeBox('EXEMPLO0', true) : `<div class="qz-qr is-sample"><p class="qz-sample">Exemplo · não conecta</p>${sampleQr()}</div>`) +
          `<p class="qz-note">${S.demo ? 'Demonstração' : 'Modo de teste'}: o código de verdade aparece aqui quando a conta estiver ativa no sistema.</p>`;
      } else {
        try {
          const d = await call('connect_whatsapp', phone ? { phone } : {}, 90000);
          if (!alive()) return;
          S.wa = d.whatsappStatus || S.wa; updateHero();
          if (S.wa && S.wa.state === 'open') { connected(); return; }
          const q = d.qr || {}, img = typeof q.base64 === 'string' && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(q.base64) ? q.base64 : '';
          if (kind === 'code' && q.pairingCode) out.innerHTML = codeBox(q.pairingCode);
          else if (kind === 'qr' && img) out.innerHTML = `<div class="qz-qr"><img src="${img}" alt="QR Code para conectar o WhatsApp" width="240" height="240"></div><p class="qz-note">Se expirar, gere um novo.</p>`;
          else { err.textContent = 'O código ainda não ficou pronto. Tente de novo em instantes.'; return; }
          tries = 0; o.timer(setTimeout(poll, 4000));
        } catch (x) { err.textContent = x.message; return; }
      }
      btn.textContent = kind === 'code' ? 'Gerar novo código' : 'Gerar novo QR Code';
      setTimeout(() => out.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' }), 80);
    });
  };
  $$('[data-wamode]', root).forEach(b => b.onclick = () => {
    releaseField(); err.textContent = ''; if (o.mode) o.mode(b.dataset.wamode);
    $$('[data-wamode]', root).forEach(x => x.setAttribute('aria-selected', x === b));
    $$('[data-wapane]', root).forEach(p => p.hidden = p.dataset.wapane !== b.dataset.wamode);
  });
  $('#qGenCode', root).onclick = e => generate('code', e.currentTarget);
  $('#qGenQr', root).onclick = e => generate('qr', e.currentTarget);
  const skip = $('.qz-skip', root); if (skip) skip.onclick = o.skip;
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = $('.is-sample', root) ? 'Exemplo copiado (não conecta)' : 'Código copiado ✓'; }
    catch (x) { b.textContent = 'Copie manualmente'; }
  });
}
function connectModal() {
  let timer = null, open = true;
  openModal('Conectar o WhatsApp', `<div class="wa-modal stack">${waMarkup(isPhone() ? 'code' : 'qr', S.client.telefoneDono, false, `<div class="qz-field"><label>Número do WhatsApp com DDD${waInput(S.client.telefoneDono)}</label></div>`)}<p class="err" role="alert"></p></div>`);
  modal.onclick = null;
  onModalClose = () => { open = false; clearTimeout(timer); };
  wireWhatsApp($('.qz-wa', modal), { alive: () => open && modal.open, error: $('.err', modal), timer: t => { clearTimeout(timer); timer = t; } });
}

/* ---------- aba 2: teste ao vivo ---------- */
function chipsFor() {
  const n = (S.client.nicho + ' ' + S.client.nomeEmpresa).toLowerCase();
  if (/massa|estétic|estetic|clínic|clinic|consult|saúde|saude|terap/.test(n)) return ['Quais atendimentos vocês fazem?', 'Atendem em domicílio?', 'Quero agendar para este sábado às 10h'];
  if (/lancha|barco|passeio/.test(n)) return ['Quais passeios vocês têm?', 'De onde vocês saem?', 'Quero agendar para este sábado às 10h'];
  return ['Quais opções vocês têm?', 'Como faço para reservar?', 'Quero agendar para este sábado às 10h'];
}
const chatOf = () => S.chats[S.slug] || (S.chats[S.slug] = []);
function viewChat(v) {
  v.innerHTML = head('Testar Agente ao Vivo', 'Converse como se fosse um cliente. O seu Agente responde com as regras salvas e, se você fechar um horário, já grava na Agenda.') + `<section class="chat" aria-label="Conversa de teste com o Agente">
  <div class="chat-head"><span class="ava" aria-hidden="true">${esc(S.client.nomeEmpresa.slice(0, 2).toUpperCase())}</span><div class="tx"><b>Agente · ${esc(S.client.nomeEmpresa)}</b><small id="chatSub"></small></div><button type="button" class="iconbtn" id="bClear" aria-label="Limpar conversa de teste">${icon(I.trash)}</button></div>
  <div class="msgs" id="msgs" aria-live="polite"></div>
  <div class="chips" id="chips">${chipsFor().map(t => `<button type="button">${esc(t)}</button>`).join('')}</div>
  <form class="compose" id="fMsg"><input name="m" placeholder="Escreva como se fosse um cliente no WhatsApp…" autocomplete="off" maxlength="600" aria-label="Mensagem de teste"><button class="send" aria-label="Enviar">${icon(I.send)}</button></form></section>`;
  drawMsgs();
  $('#chips').onclick = e => { const b = e.target.closest('button'); if (b) send(b.textContent); };
  $('#fMsg').onsubmit = e => { e.preventDefault(); const i = e.target.m, t = i.value.trim(); if (t && !S.busyChat) { i.value = ''; send(t); } };
  $('#bClear').onclick = () => { if (S.busyChat) return; S.chats[S.slug] = []; drawMsgs(); };
}
function drawMsgs() {
  const el = $('#msgs'); if (!el) return;
  const m = chatOf();
  const typing = S.busyChat === S.slug, sub = $('#chatSub');
  if (sub) { sub.textContent = typing ? 'Agente digitando...' : 'Online · reserva confirmada entra direto na Agenda'; sub.classList.toggle('is-typing', typing); }
  el.innerHTML = (m.length ? m.map(x => x.role === 'sys'
    ? `<div class="sys">${esc(x.content)}${x.booking ? '<button type="button" class="btn primary" data-goagenda>Ver na Agenda</button>' : ''}</div>`
    : x.content.split(/\n{2,}/).map(b => `<div class="bubble ${x.role === 'user' ? 'out' : 'in'}">${esc(b)}</div>`).join('')).join('')
    : '<div class="sys">Envie uma pergunta ou toque em uma sugestão abaixo para ver o seu Agente respondendo ao vivo.</div>') + (typing ? '<div class="typing" aria-label="Digitando"><i></i><i></i><i></i></div>' : '');
  const g = $('[data-goagenda]', el); if (g) g.onclick = () => show('agenda');
  el.scrollTop = el.scrollHeight;
}
async function send(text) {
  if (S.busyChat) return;
  const slug = S.slug, chat = chatOf();
  const historico = chat.filter(x => x.role !== 'sys').slice(-8).map(x => ({ role: x.role, content: x.content }));
  chat.push({ role: 'user', content: text }); S.busyChat = slug; drawMsgs();
  try {
    const d = await call('test_chat', { mensagem: text, historico }, 90000);
    const raw = list(d.baloes).length ? d.baloes.join('\n\n') : String(d.reply || '');
    const parts = raw.replace(/\\r/g, '').replace(/\\n/g, '\n').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
    const reply = parts.length > 2 ? [parts[0], parts.slice(1).join('\n')].join('\n\n') : parts.join('\n\n');
    if (reply) chat.push({ role: 'assistant', content: reply });
    if (d.novoAgendamento) chat.push({ role: 'sys', booking: true, content: `Agendamento registrado pelo Agente na Agenda: ${d.novoAgendamento.servico}, ${d.novoAgendamento.dataHora}.` });
    if (slug === S.slug) { applyClient(d.client); if (d.novoAgendamento) burst(); }
  } catch (e) { chat.push({ role: 'sys', content: e.message }); }
  S.busyChat = false; if (slug === S.slug) drawMsgs();
}

/* ---------- aba 3: agenda ---------- */
const STATUS = { confirmado: ['ok', 'Confirmado'], pendente: ['warn', 'Pendente'], concluido: ['', 'Concluído'], cancelado: ['off', 'Cancelado'] };
const ACTIONS = [['confirmado', 'Confirmar', 'ghost'], ['concluido', 'Concluir', 'ghost'], ['cancelado', 'Cancelar', 'danger']];
const stOf = a => STATUS[a.status] ? a.status : 'pendente';
/* "hoje": a data do agendamento é texto livre; conta quando diz "hoje" ou traz o dia e o mês de hoje */
function isToday(a) {
  const t = String(a.dataHora || ''), d = new Date(), dm = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return /\bhoje\b/i.test(t) || t.includes(dm) || t.startsWith(iso);
}
const waBtn = (tel, label, cls) => {
  if (S.demo) return `<button type="button" class="btn ${cls}" data-demowa>${label}</button>`;
  const wa = waLink(tel);
  return wa ? `<a class="btn ${cls}" href="${wa}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';
};
const demoWa = e => { if (e.target.closest('[data-demowa]')) toast('Demonstração: este contato é fictício.'); };
function viewAgenda(v) {
  v.innerHTML = head('Agenda', 'Todas as reservas do seu Agente, com o que fazer em cada uma.') + `<div class="ag-sum" id="agSum" role="group" aria-label="Resumo da agenda"></div>
  <section class="card" id="cAgenda"><header><h2>Agendamentos</h2><button type="button" class="btn primary" id="bNewAg">+ Marcar agendamento</button></header><div class="filterbar" id="agF" role="group" aria-label="Filtrar agendamentos"></div><ul class="list ag-list" id="ags"></ul></section>`;
  drawBookings();
  $('#bNewAg').onclick = bookingModal;
}
function drawBookings() {
  const el = $('#ags'); if (!el) return;
  const all = list(S.client.agendamentos), f = S.agFilter;
  const count = k => k === 'todos' ? all.length : k === 'hoje' ? all.filter(a => isToday(a) && stOf(a) !== 'cancelado').length : all.filter(a => stOf(a) === k).length;
  const items = all.filter(a => f === 'todos' || (f === 'hoje' ? isToday(a) && stOf(a) !== 'cancelado' : stOf(a) === f));
  $('#agSum').innerHTML = [['hoje', 'Hoje'], ['confirmado', 'Confirmados'], ['pendente', 'Pendentes']].map(([k, l]) => `<button type="button" data-f="${k}" class="ag-stat ag-stat--${k}" aria-pressed="${f === k}"><b>${count(k)}</b><span>${l}</span></button>`).join('');
  const filters = [['todos', 'Todos'], ['confirmado', 'Confirmados'], ['concluido', 'Concluídos'], ['cancelado', 'Cancelados']];
  $('#agF').innerHTML = filters.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${f === k}">${l} (${count(k)})</button>`).join('');
  const pick = e => { const b = e.target.closest('[data-f]'); if (b) { S.agFilter = b.dataset.f; drawBookings(); } };
  $('#agF').onclick = pick; $('#agSum').onclick = pick;
  el.innerHTML = items.map(a => {
    const st = stOf(a), [cls, lbl] = STATUS[st];
    return `<li class="item ag ag--${st}"><div class="item-top"><h3>${esc(a.dataHora)}</h3><span class="badge dot ${cls}">${lbl}</span></div>
    <dl class="ag-data"><div><dt>Cliente</dt><dd>${esc(a.clienteNome || 'Sem nome')}</dd></div><div><dt>Serviço</dt><dd>${esc(a.servico || 'Não informado')}</dd></div><div class="full"><dt>Observações</dt><dd>${esc(a.detalhes || 'Sem observações')}</dd></div></dl>
    <div class="acts">${ACTIONS.filter(x => x[0] !== st).map(([k, l, c]) => `<button type="button" class="btn ${c}" data-st="${k}" data-ag="${esc(a.id)}">${l}</button>`).join('')}${waBtn(a.clienteTelefone, 'Chamar no WhatsApp', 'ag-wa')}</div></li>`;
  }).join('') || '<li class="empty">Nenhum agendamento neste filtro.</li>';
  el.onclick = async e => {
    demoWa(e);
    const b = e.target.closest('[data-st]'); if (!b) return;
    if (b.dataset.st === 'cancelado' && !await confirmBox('Cancelar agendamento?', 'Ele continua na lista como cancelado.', 'Cancelar agendamento')) return;
    busy(b, async () => { const d = await call('update_booking', { agendamentoId: b.dataset.ag, status: b.dataset.st }); applyClient(d.client); drawBookings(); toast('Status atualizado.'); });
  };
}
function bookingModal() {
  openModal('Marcar agendamento', `<form class="stack" id="fAg"><label>Nome do cliente<input name="clienteNome" required maxlength="80"></label><label>WhatsApp<input name="clienteTelefone" inputmode="tel" placeholder="DDD e número" maxlength="20"></label><label>Serviço<input name="servico" required maxlength="120" list="dl"></label><datalist id="dl">${list(S.client.servicosCatalogo).map(s => `<option value="${esc(s.nome)}">`).join('')}</datalist><label>Data e hora<input name="dataHora" type="datetime-local" required></label><label>Detalhes<textarea name="detalhes" rows="2" maxlength="300"></textarea></label><button class="btn primary block">Salvar na Agenda</button></form>`);
  modal.onclick = null;
  const f = $('#fAg', modal), slug = S.slug;
  f.onsubmit = e => {
    e.preventDefault(); if (!f.reportValidity()) return;
    const n = Object.fromEntries(new FormData(f).entries());
    const dt = new Date(n.dataHora);
    n.dataHora = dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' às ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    busy($('button.primary', f), async () => { if (slug !== S.slug) return; const d = await call('update_booking', { novoAgendamento: n }); applyClient(d.client); S.agFilter = 'todos'; modal.close(); drawBookings(); const first = $('#ags>li'); if (first) { stagger([first], -24, 0); glow(first); } burst(); toast('Agendamento salvo.'); });
  };
}
/* ---------- aba 4: conversas ---------- */
const initials = n => String(n || '?').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase();
const pausedList = () => list(S.client.contatosPausados).map(digits);
const isPaused = t => pausedList().some(p => p && p.slice(-8) === digits(t).slice(-8));
const lastText = c => { const h = list(c.historico); return String((h.length ? h[h.length - 1].content : c.ultimaMensagem) || 'Sem mensagens'); };
function viewConvs(v) {
  S.convSel = '';
  v.innerHTML = head('Conversas', 'Acompanhe cada atendimento e assuma quando quiser.') + `<div class="cv">
   <section class="cv-side" aria-label="Lista de conversas">
    <label class="cv-search"><span class="sr">Buscar por nome ou telefone</span><input id="cvQ" type="search" placeholder="Buscar por nome ou telefone" autocomplete="off" enterkeyhint="search" value="${esc(S.convQuery)}"></label>
    <div class="filterbar" id="cvF" role="group" aria-label="Filtrar conversas"></div>
    <ul class="list" id="convs"></ul>
   </section>
   <section class="cv-thread" id="thread" aria-label="Conversa aberta" aria-live="polite"></section>
  </div>`;
  $('#cvQ').oninput = e => { S.convQuery = e.target.value; drawConvs(); };
  $('#cvF').onclick = e => { const b = e.target.closest('[data-cf]'); if (b) { S.convFilter = b.dataset.cf; S.convSel = ''; drawConvs(); } };
  $('#convs').onclick = e => {
    const b = e.target.closest('[data-conv]'); if (!b) return;
    releaseField(); S.convSel = b.dataset.conv; drawConvs();
    if (!matchMedia('(min-width: 900px)').matches) window.scrollTo(0, 0);
  };
  $('#thread').onclick = e => {
    demoWa(e);
    if (e.target.closest('[data-cvback]')) { S.convSel = ''; drawConvs(); return; }
    const b = e.target.closest('[data-pause]'); if (!b) return;
    const tel = digits(b.dataset.pause), match = pausedList().find(p => p.slice(-8) === tel.slice(-8));
    busy(b, async () => { const d = await call('toggle_pause_contact', { telefone: match || tel }); applyClient(d.client); drawConvs(); toast(match ? 'O Agente voltou a atender este contato.' : 'Agente pausado neste contato. A conversa está com você.'); });
  };
  drawConvs();
}
function drawConvs() {
  const el = $('#convs'); if (!el) return;
  const all = list(S.client.conversas), f = S.convFilter, q = S.convQuery.trim().toLowerCase(), qd = digits(q);
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const count = k => all.filter(c => k === 'todas' || isPaused(c.telefone) === (k === 'voce')).length;
  $('#cvF').innerHTML = [['todas', 'Todas'], ['agente', 'Com o Agente'], ['voce', 'Com você']].map(([k, l]) => `<button type="button" data-cf="${k}" aria-pressed="${f === k}">${l} (${count(k)})</button>`).join('');
  const items = all.filter(c => (f === 'todas' || isPaused(c.telefone) === (f === 'voce')) && (!q || norm(c.nome).includes(norm(q)) || (qd.length >= 3 && digits(c.telefone).includes(qd))));
  el.innerHTML = items.map(c => {
    const p = isPaused(c.telefone);
    return `<li><button type="button" class="cv-row${S.convSel === String(c.telefone) ? ' on' : ''}" data-conv="${esc(c.telefone)}"><span class="ava" aria-hidden="true">${esc(initials(c.nome))}</span><span class="cv-row__tx"><span class="cv-row__top"><b>${esc(c.nome || c.telefone)}</b><time>${esc(when(c.atualizadoEm))}</time></span><span class="cv-row__last">${esc(lastText(c))}</span><span class="badge ${p ? 'warn' : 'ok'}">${p ? 'Com você' : 'Com o Agente'}</span></span></button></li>`;
  }).join('') || `<li class="empty">${all.length ? 'Nenhuma conversa neste filtro.' : 'Nenhuma conversa ainda. Elas aparecem quando o WhatsApp estiver conectado e alguém escrever.'}</li>`;
  const box = $('#thread'), c = all.find(x => String(x.telefone) === S.convSel);
  $('.cv').classList.toggle('open', !!c);
  if (!c) { box.innerHTML = '<p class="empty">Toque em uma conversa para ver o histórico.</p>'; return; }
  const p = isPaused(c.telefone);
  box.innerHTML = `<div class="cv-box">
    <header class="cv-head"><button type="button" class="iconbtn cv-back" data-cvback aria-label="Voltar para todas as conversas">←</button><span class="ava" aria-hidden="true">${esc(initials(c.nome))}</span><div class="tx"><b>${esc(c.nome || c.telefone)}</b><small>${S.demo ? 'Contato de exemplo' : esc(c.telefone)} · ${esc(when(c.atualizadoEm))}</small></div></header>
    <p class="cv-state ${p ? 'you' : ''}">${p ? 'Agente em pausa. A conversa está com você.' : 'O Agente está atendendo este contato.'}</p>
    <div class="msgs cv-msgs">${list(c.historico).map(h => `<div class="bubble ${h.role === 'assistant' ? 'out' : 'in'}">${esc(h.content)}${h.hora ? `<time>${esc(h.hora)}</time>` : ''}</div>`).join('') || `<div class="bubble in">${esc(c.ultimaMensagem || 'Sem mensagens')}</div>`}</div>
    <div class="cv-acts"><button type="button" class="btn ${p ? 'ghost' : 'primary'} cv-take" data-pause="${esc(c.telefone)}">${p ? 'Devolver conversa ao Agente' : 'Assumir a conversa / Pausar Agente neste contato'}</button>${waBtn(c.telefone, 'Abrir no WhatsApp', 'ghost')}</div>
  </div>`;
  const msgs = $('.cv-msgs', box); msgs.scrollTop = msgs.scrollHeight;
}

/* ---------- início ---------- */
(async function boot() {
  const q = new URLSearchParams(location.search);
  const slug = (q.get('cliente') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const linkPin = q.get('pin') || q.get('codigo') || '';
  const wantQuiz = q.get('quiz') === '1';
  if (q.get('demo') === '1') { openDemo(); return; }
  if (q.get('mestre') === '1') { history.replaceState(null, '', location.pathname); gate(); master(); return; }
  if (q.get('pos_pagamento') === '1') { afterPayment(q.get('plano') || 'mensal'); return; }
  /* sem conta no endereço: volta para a última conta deste aparelho, ou mostra a tela Entrar */
  if (!slug) {
    const last = String(store.get('localStorage', LAST) || ''), kept = last ? savedPin(last) : '';
    if (kept === '@local' && localGet(last)) { enterLocal(last, null); return; }
    if (kept && kept !== '@local') { try { await enter(last, kept, null); return; } catch (e) { gate(last, e.message); return; } }
    gate(last); return;
  }
  S.linkMode = !!slug;
  S.wantQuiz = wantQuiz ? slug : '';
  if (q.has('pin') || q.has('codigo') || q.has('quiz')) history.replaceState(null, '', location.pathname + (slug ? '?cliente=' + slug : ''));
  const pin = linkPin || (slug ? savedPin(slug) : '');
  if (slug && pin === '@local') { if (localGet(slug)) enterLocal(slug, null); else gate(slug); return; }
  if (slug && pin) {
    try { await enter(slug, pin, linkPin ? true : null, false, wantQuiz); return; }
    catch (e) { gate(slug, e.message); return; }
  }
  gate(slug);
})();
})();
