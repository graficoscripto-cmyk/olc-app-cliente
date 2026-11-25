/* OLC · App Único do Cliente. Nenhuma senha, PIN ou chave fica neste arquivo. */
(function () {
'use strict';
const API = 'https://n8n.187.53.124.11.sslip.io/webhook/olc-cliente-api';
const QUICK = [
  { slug: 'lancha-refugio', nome: 'Lancha Refúgio Ilhabela', nicho: 'Passeio de lancha', sigla: 'LR' },
  { slug: 'evo-care', nome: 'Evo Care Massoterapia', nicho: 'Massoterapia', sigla: 'EC' },
  { slug: 'marevia-turismo', nome: 'Marevia Turismo', nicho: 'Turismo náutico', sigla: 'MT' }
];
const TABS = [
  ['bot', 'Meu Atendente IA', 'Atendente', 'M12 3v3M7 6h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM9 12h.01M15 12h.01M9.5 16h5M2 11v3M22 11v3'],
  ['chat', 'Testar ao Vivo', 'Testar ao Vivo', 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5A8.4 8.4 0 1 1 21 11.5z'],
  ['agenda', 'Agenda & Conversas', 'Agenda', 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8.5 14.5l2.3 2.3 4.7-4.6']
];
const I = {
  x: 'M6 6l12 12M18 6L6 18', trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10', send: 'M4 12l16-8-6 17-3-7z', refresh: 'M20 11a8 8 0 1 0-2.3 6M20 4v7h-7',
  check: 'M5 12.5l4.500 4.500L19 7.500', crown: 'M4 17l-1-9 5 4 4-7 4 7 5-4-1 9zM5 20h14'
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const digits = v => String(v ?? '').replace(/\D/g, '');
const list = v => Array.isArray(v) ? v : [];
const when = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const waLink = v => { let n = digits(v); if (n.length === 10 || n.length === 11) n = '55' + n; return n.length >= 12 ? 'https://wa.me/' + n : ''; };
const store = {
  get(a, k) { try { return JSON.parse(window[a].getItem(k)); } catch (e) { return null; } },
  set(a, k, v) { try { window[a].setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(a, k) { try { window[a].removeItem(k); } catch (e) {} }
};
const sessKey = slug => 'olc.pin.' + slug;
const savedPin = slug => store.get('localStorage', sessKey(slug)) || store.get('sessionStorage', sessKey(slug)) || '';
const ADMIN = 'olc.mestre';

const S = { slug: '', pin: '', client: null, wa: null, tab: 'bot', admin: store.get('sessionStorage', ADMIN) || '', chats: {}, agFilter: 'todos', busyChat: false, linkMode: false };

/* ---------- rede ---------- */
async function api(body, ms = 60000) {
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
    // só repassa mensagens conhecidas; erros técnicos não aparecem para o cliente
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
function openModal(title, html) {
  modal.innerHTML = `<div class="modal-head"><h2 id="modalTitle">${esc(title)}</h2><button type="button" class="iconbtn" data-close aria-label="Fechar">${icon(I.x)}</button></div>${html}`;
  if (!modal.open) modal.showModal();
}
modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) modal.close(); });
modal.addEventListener('close', () => { if (onModalClose) onModalClose(); onModalClose = null; modal.innerHTML = ''; });
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
  els.forEach((el, i) => el.animate([{ opacity: 0, transform: `translate(${dx}px, ${dy}px)` }, { opacity: 1, transform: 'none' }], { duration: 520, delay: Math.min(i, 8) * 65, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
}
function radar(cls) {
  return `<div class="radar ${cls || ''}" aria-hidden="true"><i class="wave"></i><i class="wave"></i><i class="wave"></i><i class="sweep"></i>
  <svg viewBox="0 0 200 200">
   <g class="rings"><circle cx="100" cy="100" r="94"/><circle cx="100" cy="100" r="72"/><circle cx="100" cy="100" r="49"/><path d="M100 6v188M6 100h188"/></g>
   <g class="orbit o1"><path d="M100 28L153 66M100 28L47 70"/><circle cx="100" cy="28" r="4.5"/><circle cx="153" cy="66" r="3"/><circle cx="47" cy="70" r="3"/></g>
   <g class="orbit o2"><path d="M100 172l-44-24M100 172l50-31"/><circle class="gold" cx="100" cy="172" r="4.5"/><circle class="gold" cx="56" cy="148" r="3"/><circle class="gold" cx="150" cy="141" r="3"/></g>
   <g class="core"><circle class="halo" cx="100" cy="100" r="33"/><path class="hex" d="M100 72l24 14v28l-24 14-24-14V86z"/><path class="face" d="M89 96h.1M111 96h.1M90 109q10 8 20 0"/></g>
  </svg></div>`;
}
const NODE = {
  wa: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5A8.4 8.4 0 1 1 21 11.5z',
  ia: 'M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM10 10h4v4h-4z'
};
function heroState() {
  const on = !!S.client.botAtivo, open = !!(S.wa && S.wa.state === 'open');
  if (!on) return { key: 'paused', seal: 'Atendente pausado', title: 'Em pausa.', text: 'Não responde ninguém até você ligar.' };
  if (open) return { key: 'live', seal: 'Atendendo ao vivo', title: 'No ar agora.', text: 'Ligado e conectado ao seu WhatsApp.' };
  return { key: 'ready', seal: 'Falta conectar o WhatsApp', title: 'Quase lá.', text: 'Robô ligado. Conecte o WhatsApp para atender.' };
}
const KPIS = [
  ['notas', 'Regras Ativas', () => list(S.client.notasContexto).length],
  ['srv', 'Serviços no Catálogo', () => list(S.client.servicosCatalogo).length],
  ['ags', 'Reservas na Agenda', () => list(S.client.agendamentos).filter(a => a.status !== 'cancelado').length]
];
function buildHero() {
  const el = $('#hero');
  el.innerHTML = `<div class="h-grid"></div>
  <div class="h-top">${radar()}<div class="h-copy"><span class="seal-live"><i></i><b id="hSeal"></b></span><h2 id="hTitle"></h2><p id="hText"></p></div></div>
  <div class="flow" role="img" id="hFlow">
   <div class="node n-wa">${icon(NODE.wa)}<span>WhatsApp</span></div>
   <div class="link l1"><u><i></i></u><u class="back"><i></i></u></div>
   <div class="node n-ia">${icon(NODE.ia)}<span>Motor IA</span></div>
   <div class="link l2"><u><i></i></u><u class="back"><i></i></u></div>
   <div class="node n-ag">${icon(TABS[2][3])}<span>Agenda</span></div>
  </div>
  <div class="h-acts"><div class="power"><button type="button" class="switch" role="switch" id="bBot" aria-label="Ligar ou pausar o atendente"></button><span id="hPower"></span></div><button type="button" class="btn" id="bConn"></button></div>
  <div class="kpis">${KPIS.map(k => `<button type="button" class="kpi" data-kpi="${k[0]}"><b data-n></b><span>${k[1]}</span><em aria-hidden="true">${'<i></i>'.repeat(8)}</em></button>`).join('')}</div>`;
  $('#bBot').onclick = async e => {
    const b = e.currentTarget, next = !S.client.botAtivo;
    if (b.disabled) return; b.disabled = true; b.setAttribute('aria-checked', next);
    try { const d = await call('save_bot_settings', { botAtivo: next }); applyClient(d.client); toast(next ? 'Atendente ligado.' : 'Atendente pausado.'); burst(); }
    catch (x) { toast(x.message, true); }
    b.disabled = false; updateHero();
  };
  $('#bConn').onclick = connectModal;
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
  $('#bBot').setAttribute('aria-checked', on); $('#hPower').textContent = on ? 'Atendente ligado' : 'Atendente pausado';
  const c = $('#bConn'); c.textContent = open ? 'WhatsApp conectado ✓' : 'Conectar meu WhatsApp (QR Code / Código)'; c.className = 'btn ' + (open ? '' : 'gold');
  $('#hFlow').setAttribute('aria-label', open ? 'Fluxo ativo entre WhatsApp, motor de inteligência artificial e agenda' : 'WhatsApp ainda não conectado ao motor de inteligência artificial');
  KPIS.forEach(([key, label, get]) => {
    const card = $(`[data-kpi="${key}"]`, el), n = get(), prev = card.dataset.v;
    card.dataset.v = n; $('[data-n]', card).textContent = n; card.setAttribute('aria-label', `${label}: ${n}`);
    $$('em i', card).forEach((s, i) => s.classList.toggle('lit', i < n));
    if (prev !== undefined && Number(prev) !== n) pulse(card);
  });
}
function pulse(el) {
  if (!el || calm()) return;
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: .35 }, { transform: 'scale(1)' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
  glow(el);
}
function glow(el) {
  if (!el || calm()) return;
  const g = document.createElement('i'); g.className = 'glow'; el.appendChild(g);
  g.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)', offset: .25 }, { opacity: 0, transform: 'scale(1.02)' }], { duration: 1500, easing: 'ease-out' }).onfinish = () => g.remove();
}
function burst() {
  const r = $('#hero .radar'); if (!r || calm()) return;
  const g = document.createElement('i'); g.className = 'burst'; r.appendChild(g);
  g.animate([{ opacity: .9, transform: 'scale(.3)' }, { opacity: 0, transform: 'scale(1.35)' }], { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => g.remove();
}

/* ---------- entrada ---------- */
function gate(prefill = '', error = '') {
  S.client = null; S.wa = null; document.title = 'OLC · Seu atendimento';
  const quick = S.linkMode ? '' : '<div class="picker"><h2>Escolha a empresa</h2><div class="quick" data-quick></div></div>';
  $('#app').innerHTML = `<main class="gate">
  <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="gate-top"><div class="logo"><img src="icon.svg" alt="" width="38" height="38"><span>OLC Digital</span></div><button type="button" class="master-btn" data-master>👑 Modo Mestre OLC (Gustavo)</button></div>
  <div class="gate-body">
   <div class="gate-copy">${radar('gate-radar')}<h1>Seu atendente no WhatsApp, <em>sempre por perto.</em></h1><p>Ensine, teste ao vivo e acompanhe o que foi marcado.</p></div>
   <div class="stack">
    ${quick}
    <form class="card stack" id="login" novalidate>
     <h2>Entrar no meu painel</h2>
     <label>Código da empresa<input name="slug" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="nome-da-empresa" value="${esc(prefill)}" required></label>
     <label>Código de acesso<input name="pin" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required></label>
     <label class="check"><input type="checkbox" name="keep" checked>Lembrar neste aparelho</label>
     <p class="err" role="alert">${esc(error)}</p>
     <button class="btn primary block" type="submit">Entrar</button>
    </form>
   </div>
  </div></main>`;
  stagger($$('.gate-copy>*,.picker,#login'), 0, 18);
  const box = $('[data-quick]');
  if (box) box.innerHTML = QUICK.map(q => `<button type="button" data-q="${q.slug}" aria-pressed="${q.slug === prefill}"><span class="ava" aria-hidden="true">${q.sigla}</span><span class="tx"><b>${esc(q.nome)}</b><small>${esc(q.nicho)} · ${savedPin(q.slug) ? 'abre com 1 toque' : 'pede o código na 1ª vez'}</small></span></button>`).join('');
  const f = $('#login');
  f.onsubmit = e => {
    e.preventDefault();
    const slug = f.slug.value.trim().toLowerCase().replace(/\s+/g, '-'), pin = f.pin.value.trim();
    if (!slug || !pin) { $('.err', f).textContent = 'Preencha o código da empresa e o código de acesso.'; return; }
    busy($('button[type=submit]', f), async () => { try { await enter(slug, pin, f.keep.checked); } catch (x) { $('.err', f).textContent = x.message; } });
  };
  if (box) box.onclick = e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const slug = b.dataset.q, pin = savedPin(slug);
    f.slug.value = slug; $$('[data-q]', box).forEach(x => x.setAttribute('aria-pressed', x === b));
    if (pin) busy(b, async () => { try { await enter(slug, pin, null); } catch (x) { if (x.code === 401) { store.del('localStorage', sessKey(slug)); store.del('sessionStorage', sessKey(slug)); } $('.err', f).textContent = x.message; } });
    else { $('.err', f).textContent = ''; f.pin.focus({ preventScroll: true }); f.scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' }); toast('Digite o código de acesso. Depois é só 1 toque neste aparelho.'); }
  };
  $('[data-master]').onclick = master;
}
async function enter(slug, pin, keep, viaAdmin) {
  const d = await api(viaAdmin ? { action: 'get_client', slug, adminKey: S.admin } : { action: 'get_client', slug, pin });
  S.slug = slug; S.client = d.client; S.wa = d.whatsappStatus || null;
  S.pin = viaAdmin ? String(d.client.pinAcesso || '') : pin;
  if (!viaAdmin && keep !== null) store.set(keep ? 'localStorage' : 'sessionStorage', sessKey(slug), pin);
  S.tab = 'bot';
  history.replaceState(null, '', location.pathname + '?cliente=' + encodeURIComponent(slug));
  if (modal.open) modal.close();
  shell();
}
function logout() {
  store.del('localStorage', sessKey(S.slug)); store.del('sessionStorage', sessKey(S.slug));
  delete S.chats[S.slug]; S.slug = S.pin = ''; S.admin = ''; store.del('sessionStorage', ADMIN);
  history.replaceState(null, '', location.pathname); S.linkMode = false; gate();
}

/* ---------- Modo Mestre ---------- */
function master() {
  if (S.admin) return masterList();
  openModal('👑 Modo Mestre OLC', `<form class="stack" id="mk"><p class="mute small">Acesso exclusivo da equipe OLC. A chave não fica salva no aparelho: vale só até fechar a aba.</p><label>Chave mestre<input type="password" name="key" autocomplete="off" required></label><p class="err" role="alert"></p><button class="btn gold block">Entrar como mestre</button></form>`);
  const f = $('#mk', modal); f.key.focus();
  f.onsubmit = e => {
    e.preventDefault(); const key = f.key.value.trim(); if (!key) return;
    busy($('button', f), async () => {
      try {
        const d = await api({ action: 'list_clients', adminKey: key });
        S.admin = key; store.set('sessionStorage', ADMIN, key); masterList(d.clients);
      } catch (x) { $('.err', f).textContent = x.code === 401 ? 'Chave mestre incorreta.' : x.message; }
    });
  };
}
async function masterList(pre) {
  openModal('👑 Clientes OLC', '<p class="mute">Carregando clientes…</p>');
  let clients = pre;
  try { if (!clients) clients = (await api({ action: 'list_clients', adminKey: S.admin })).clients; }
  catch (e) { openModal('👑 Clientes OLC', `<p class="err">${esc(e.message)}</p>`); return; }
  openModal('👑 Clientes OLC', `<div class="acts"><button type="button" class="btn gold" data-new>+ Novo cliente</button><button type="button" class="btn ghost" data-leave>Sair do modo mestre</button></div>
  <ul class="list">${list(clients).map(c => `<li class="item"><h3>${esc(c.nomeEmpresa)}</h3><p class="small mute">${esc(c.nicho)}${c.cidade ? ' · ' + esc(c.cidade) : ''}</p><div class="acts"><button type="button" class="btn primary" data-open="${esc(c.slug)}">Abrir painel</button><button type="button" class="btn" data-copy="${esc(c.slug)}">Copiar link + código</button></div></li>`).join('') || '<li class="empty">Nenhum cliente ainda.</li>'}</ul>`);
  modal.onclick = e => {
    const o = e.target.closest('[data-open]'), c = e.target.closest('[data-copy]');
    if (o) busy(o, () => enter(o.dataset.open, '', null, true));
    if (c) busy(c, () => copyAccess(c.dataset.copy));
    if (e.target.closest('[data-new]')) newClient();
    if (e.target.closest('[data-leave]')) { S.admin = ''; store.del('sessionStorage', ADMIN); modal.close(); if (S.client) { logout(); } toast('Modo mestre encerrado.'); }
  };
}
const clientLink = slug => location.origin + location.pathname + '?cliente=' + encodeURIComponent(slug);
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) { return false; }
}
async function showAccess(slug, pin, nome) {
  const text = `${nome}: o seu painel está pronto.\nLink: ${clientLink(slug)}\nCódigo de acesso: ${pin}`;
  const ok = await copyText(text);
  openModal(ok ? 'Acesso copiado' : 'Acesso do cliente', `<p class="mute small">${ok ? 'Cole na conversa com o cliente.' : 'Selecione e copie o texto abaixo.'}</p><textarea readonly rows="5" aria-label="Link e código do cliente">${esc(text)}</textarea><div class="acts" data-back><button type="button" class="btn" data-list>Voltar aos clientes</button></div>`);
  $('[data-back]', modal).style.marginTop = '14px';
  modal.onclick = e => { if (e.target.closest('[data-list]')) masterList(); };
}
async function copyAccess(slug) {
  const d = await api({ action: 'get_client', slug, adminKey: S.admin });
  await showAccess(slug, d.client.pinAcesso, d.client.nomeEmpresa);
}
function randomCode() { const abc = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', a = new Uint32Array(12); crypto.getRandomValues(a); return [...a].map(n => abc[n % abc.length]).join(''); }
function newClient() {
  modal.onclick = null;
  openModal('Novo cliente', `<form class="stack" id="nc"><label>Nome da empresa<input name="nomeEmpresa" required maxlength="80"></label><label>Nicho<input name="nicho" required placeholder="Ex.: clínica de estética" maxlength="80"></label><div class="row"><label>Cidade<input name="cidade" maxlength="60"></label><label>WhatsApp do dono<input name="telefoneDono" inputmode="tel" placeholder="55 DDD número"></label></div><div class="row"><label>Código de acesso<input name="pinAcesso" minlength="10" required autocomplete="off" autocapitalize="none" spellcheck="false" value="${randomCode()}"></label></div><label>Contexto base da OLC<textarea name="contextoAdminOLC" rows="4" placeholder="O que o atendente precisa saber sobre a empresa"></textarea></label><p class="err" role="alert"></p><button class="btn gold block">Criar cliente</button></form>`);
  const f = $('#nc', modal);
  f.onsubmit = e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f).entries());
    Object.keys(v).forEach(k => v[k] = v[k].trim());
    if (!v.nomeEmpresa || !v.nicho) { $('.err', f).textContent = 'Preencha o nome e o nicho.'; return; }
    if (v.pinAcesso.length < 10 || /\s/.test(v.pinAcesso)) { $('.err', f).textContent = 'Use um código com pelo menos 10 caracteres, sem espaços.'; return; }
    busy($('button.gold', f), async () => {
      const cur = (await api({ action: 'list_clients', adminKey: S.admin })).clients;
      const slug = v.nomeEmpresa.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (list(cur).some(c => c.slug === slug)) { $('.err', f).textContent = 'Já existe um cliente com esse nome. Criar de novo apagaria a ficha dele.'; return; }
      const d = await api(Object.assign({ action: 'create_client', adminKey: S.admin }, v));
      await showAccess(d.client.slug, d.client.pinAcesso, d.client.nomeEmpresa);
    });
  };
}

/* ---------- estrutura do painel ---------- */
function shell() {
  const c = S.client; document.title = c.nomeEmpresa + ' · OLC';
  $('#app').innerHTML = `<div class="shell">
  <nav class="side" aria-label="Seções do painel">
   <div class="logo"><img src="icon.svg" alt="" width="38" height="38"><span>OLC Digital</span></div>
   <div class="tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" class="tab" id="tab-${t[0]}" data-tab="${t[0]}" aria-controls="view">${icon(t[3])}<span class="long">${t[1]}</span><span class="short">${t[2]}</span></button>`).join('')}</div>
   <div class="side-foot">${S.admin ? '<button type="button" class="btn gold" data-master>👑 Clientes</button>' : '<button type="button" class="btn ghost" data-master>👑 Modo Mestre OLC</button>'}<button type="button" class="btn ghost" data-logout>${icon(I.out)}Sair</button></div>
  </nav>
  <div class="main">
   <header class="top"><div class="who"><b>${esc(c.nomeEmpresa)}</b><small>${S.admin ? '👑 Modo mestre · ' : ''}${esc(c.nicho)}${c.cidade ? ' · ' + esc(c.cidade) : ''}</small></div>
    <button type="button" class="iconbtn mobile-only" data-master aria-label="Modo Mestre OLC">👑</button>
    <button type="button" class="iconbtn" data-reload aria-label="Atualizar dados">${icon(I.refresh)}</button>
    <button type="button" class="iconbtn mobile-only" data-logout aria-label="Sair">${icon(I.out)}</button></header>
   <div class="hero-wrap"><section class="hero" id="hero" aria-label="Estado do atendente"></section></div>
   <main class="view" id="view" role="tabpanel" tabindex="-1"></main>
  </div></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => show(b.dataset.tab));
  $$('[data-master]').forEach(b => b.onclick = master);
  $$('[data-logout]').forEach(b => b.onclick = async () => { if (await confirmBox('Sair do painel?', 'O código de acesso deixa de ficar lembrado neste aparelho.', 'Sair')) logout(); });
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
  ({ bot: viewBot, chat: viewChat, agenda: viewAgenda })[tab](v);
  window.scrollTo(0, 0);
  const dx = Math.sign(dir) * 26;
  stagger(tab === 'chat' ? [$('.chat', v)] : $$('.view-head,.cols .card', v), dx, dx ? 0 : 18);
}
const head = (t, p) => `<div class="view-head"><h1>${t}</h1><p>${p}</p></div>`;

/* ---------- aba 1: atendente ---------- */
function waInfo() {
  const st = S.wa && S.wa.state;
  if (st === 'open') return ['ok', 'Conectado', 'O atendente está ligado ao seu número.'];
  if (st === 'connecting') return ['warn', 'Aguardando leitura', 'Falta ler o código no celular.'];
  return ['off', 'Desconectado', 'Conecte para o atendente responder seus clientes.'];
}
function viewBot(v) {
  const c = S.client;
  v.innerHTML = head('Meu Atendente IA', 'Ligue, conecte e ensine. O que você salvar aqui vale nas próximas respostas.') + `<div class="cols">
  <div class="stack">
   <section class="card hi"><h2>Ensinar o Robô Agora</h2>
    <form class="stack" id="fNota"><label>Aviso do dia, regra, preço ou resposta<textarea name="texto" rows="3" maxlength="1500" placeholder="Ex.: neste sábado não temos horário pela manhã."></textarea></label><button class="btn primary block">Adicionar ao Bot</button></form>
    <p class="tip">💡 Você também pode ensinar pelo WhatsApp. Envie <code>#treinar sua regra</code> ou <code>#aviso seu aviso</code>. Mande sempre na conversa <b>com o seu próprio número</b>: se enviar na conversa de um cliente, ele recebe a confirmação.</p></section>
   <section class="card" id="cNotas"><header><h2>Regras e Contextos Ativos</h2><span class="badge" id="nCount"></span></header><ul class="list" id="notas"></ul></section>
  </div>
  <div class="stack">
   ${S.admin ? `<section class="card admin"><h2>👑 Contexto base da OLC</h2><form class="stack" id="fAdmin"><label>Visível só no modo mestre<textarea name="contextoAdminOLC" rows="7">${esc(c.contextoAdminOLC)}</textarea></label><div class="acts"><button class="btn gold">Salvar contexto base</button><button type="button" class="btn" id="bAccess">Copiar link + código</button></div></form></section>` : ''}
   <section class="card" id="cSrv"><header><h2>Serviços &amp; Preços</h2></header><p class="mute small">Roteiros, procedimentos ou produtos que o robô pode oferecer.</p><div class="list" id="catalogo"></div><div class="acts" id="catActs"><button type="button" class="btn" id="bAddSrv">+ Adicionar serviço</button><button type="button" class="btn primary" id="bSaveSrv">Salvar catálogo</button></div></section>
   <section class="card"><h2>Jeito de Atender</h2><form class="stack" id="fAj">
    <label>Orientações do dono<textarea name="contextoCliente" rows="4">${esc(c.contextoCliente)}</textarea></label>
    <label>Tom de voz<textarea name="tomDeVoz" rows="2">${esc(c.tomDeVoz)}</textarea></label>
    <div class="row"><label>Atende das<input type="time" name="horarioInicio" value="${esc(c.horarioInicio)}"></label><label>Até<input type="time" name="horarioFim" value="${esc(c.horarioFim)}"></label></div>
    <p class="mute small">Por enquanto o horário fica só registrado: o robô responde a qualquer hora.</p>
    <label>WhatsApp do dono (recebe os avisos)<input name="telefoneDono" inputmode="tel" value="${esc(c.telefoneDono)}"></label>
    <button class="btn block">Salvar jeito de atender</button></form></section>
  </div></div>`;
  $('#catActs').style.marginTop = '14px';
  drawNotes(); drawCatalog(list(c.servicosCatalogo));

  $('#fNota').onsubmit = e => {
    e.preventDefault(); const f = e.target, texto = f.texto.value.trim(); if (!texto) { toast('Escreva o que o robô deve aprender.', true); return; }
    busy($('button', f), async () => {
      const slug = S.slug;
      const d = await call('add_context', { texto, autor: S.admin ? 'Equipe OLC' : S.client.nomeEmpresa, origem: S.admin ? 'Admin OLC' : 'App do Cliente' });
      if (slug !== S.slug) return; applyClient(d.client); f.reset(); drawNotes(); const first = $('#notas>li'); if (first) { stagger([first], -30, 0); glow(first); } burst(); toast('O robô já aprendeu.');
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
    const label = olc ? 'Equipe OLC' : /whats/i.test(o) ? 'Você, pelo WhatsApp' : 'Você, pelo app';
    return `<li class="item note"><div><span class="badge ${olc ? 'warn' : 'ok'}">${label}</span> <span class="small mute">${esc(n.autor)} · ${esc(when(n.criadoEm))}</span><p>${esc(n.texto)}</p></div><button type="button" class="iconbtn" data-del="${esc(n.id)}" aria-label="Excluir esta regra">${icon(I.trash)}</button></li>`;
  }).join('') || '<li class="empty">Nenhuma regra extra ainda. Escreva a primeira acima.</li>';
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
  el.onclick = e => { const r = e.target.closest('[data-rm]'); if (r) { r.closest('details').remove(); toast('Removido. Toque em Salvar catálogo para valer.'); } };
}
function readCatalog() { return $$('#catalogo details').map(d => { const o = { id: d.dataset.id }; $$('[data-k]', d).forEach(i => o[i.dataset.k] = i.value.trim()); return o; }); }

function connectModal() {
  let timer = null, alive = true, tries = 0;
  const slug = S.slug;
  openModal('Conectar meu WhatsApp', `<p class="mute small">No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho.</p>
  <form class="stack" id="fConn"><label>Usar código em vez de QR (opcional)<input name="phone" inputmode="tel" placeholder="Seu número com 55 e DDD"></label><button class="btn primary block">Gerar código de conexão</button></form><div id="qr" aria-live="polite"></div>`);
  $('#fConn', modal).style.marginTop = '12px';
  onModalClose = () => { alive = false; clearTimeout(timer); };
  modal.onclick = null;
  async function poll() {
    if (!alive || slug !== S.slug) return;
    try { const d = await call('get_client', {}, 20000); S.wa = d.whatsappStatus || S.wa; applyClient(d.client); updateHero(); } catch (e) {}
    if (!alive) return;
    if (S.wa && S.wa.state === 'open') { $('#qr', modal).innerHTML = '<div class="qrbox"><h2>WhatsApp conectado ✓</h2></div>'; return; }
    if (++tries < 24) timer = setTimeout(poll, 5000);
  }
  if (S.wa && S.wa.state === 'open') { $('#fConn', modal).remove(); $('#qr', modal).innerHTML = '<div class="qrbox"><h2>WhatsApp conectado ✓</h2></div>'; return; }
  $('#fConn', modal).onsubmit = e => {
    e.preventDefault(); const f = e.target, phone = digits(f.phone.value);
    busy($('button', f), async () => {
      clearTimeout(timer);
      const d = await call('connect_whatsapp', phone ? { phone } : {}, 90000);
      if (!alive || slug !== S.slug) return;
      S.wa = d.whatsappStatus || S.wa; updateHero();
      const q = d.qr || {}, img = typeof q.base64 === 'string' && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(q.base64) ? q.base64 : '';
      const box = $('#qr', modal);
      if (phone && q.pairingCode) box.innerHTML = `<div class="qrbox"><div><p>No WhatsApp, escolha “Conectar com número de telefone” e digite:</p><p class="pair">${esc(q.pairingCode)}</p></div></div>`;
      else if (img) box.innerHTML = `<div class="qrbox"><img src="${img}" alt="QR Code para conectar o WhatsApp" width="270" height="270"></div><p class="mute small">O código vence em pouco tempo. Se não ler, gere outro.</p>`;
      else if (S.wa && S.wa.state !== 'open') box.innerHTML = '<p class="err">O código ainda não ficou pronto. Espere alguns segundos e gere de novo.</p>';
      $('button', f).textContent = 'Gerar novo código';
      tries = 0; timer = setTimeout(poll, 4000);
    });
  };
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
  v.innerHTML = head('Testar ao Vivo', 'Respostas de verdade, usando o que está salvo. Se você confirmar uma reserva aqui, ela entra na sua Agenda.') + `<section class="chat" aria-label="Conversa de teste">
  <div class="chat-head"><span class="ava" aria-hidden="true">${esc(S.client.nomeEmpresa.slice(0, 2).toUpperCase())}</span><div class="tx"><b>${esc(S.client.nomeEmpresa)}</b><small id="chatSub"></small></div><button type="button" class="iconbtn" id="bClear" aria-label="Limpar conversa de teste">${icon(I.trash)}</button></div>
  <div class="msgs" id="msgs" aria-live="polite"></div>
  <div class="chips" id="chips">${chipsFor().map(t => `<button type="button">${esc(t)}</button>`).join('')}</div>
  <form class="compose" id="fMsg"><input name="m" placeholder="Escreva como se fosse um cliente" autocomplete="off" maxlength="600" aria-label="Mensagem de teste"><button class="send" aria-label="Enviar">${icon(I.send)}</button></form></section>`;
  drawMsgs();
  $('#chips').onclick = e => { const b = e.target.closest('button'); if (b) send(b.textContent); };
  $('#fMsg').onsubmit = e => { e.preventDefault(); const i = e.target.m, t = i.value.trim(); if (t && !S.busyChat) { i.value = ''; send(t); } };
  $('#bClear').onclick = () => { if (S.busyChat) return; S.chats[S.slug] = []; drawMsgs(); };
}
function drawMsgs() {
  const el = $('#msgs'); if (!el) return;
  const m = chatOf();
  const typing = S.busyChat === S.slug, sub = $('#chatSub');
  if (sub) { sub.textContent = typing ? 'digitando...' : 'Teste: reserva confirmada entra na Agenda'; sub.classList.toggle('is-typing', typing); }
  el.innerHTML = (m.length ? m.map(x => x.role === 'sys'
    ? `<div class="sys">${esc(x.content)}${x.booking ? '<button type="button" class="btn" data-goagenda>Ver na Agenda</button>' : ''}</div>`
    : x.content.split(/\n{2,}/).map(b => `<div class="bubble ${x.role === 'user' ? 'out' : 'in'}">${esc(b)}</div>`).join('')).join('')
    : '<div class="sys">Mande uma pergunta ou toque numa sugestão abaixo.</div>') + (typing ? '<div class="typing" aria-label="Digitando"><i></i><i></i><i></i></div>' : '');
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
    // às vezes a resposta chega com "\n" escrito como texto: vira quebra de linha e no máximo 2 balões
    const raw = list(d.baloes).length ? d.baloes.join('\n\n') : String(d.reply || '');
    const parts = raw.replace(/\\r/g, '').replace(/\\n/g, '\n').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
    const reply = parts.length > 2 ? [parts[0], parts.slice(1).join('\n')].join('\n\n') : parts.join('\n\n');
    if (reply) chat.push({ role: 'assistant', content: reply });
    if (d.novoAgendamento) chat.push({ role: 'sys', booking: true, content: `Agendamento criado na Agenda: ${d.novoAgendamento.servico}, ${d.novoAgendamento.dataHora}.` });
    if (slug === S.slug) { applyClient(d.client); if (d.novoAgendamento) burst(); }
  } catch (e) { chat.push({ role: 'sys', content: e.message }); }
  S.busyChat = false; if (slug === S.slug) drawMsgs();
}

/* ---------- aba 3: agenda e conversas ---------- */
const STATUS = { confirmado: ['ok', 'Confirmado'], concluido: ['', 'Concluído'], cancelado: ['off', 'Cancelado'] };
function viewAgenda(v) {
  v.innerHTML = head('Agenda &amp; Conversas', 'O que foi marcado e quem falou com o seu atendente.') + `<div class="cols">
  <section class="card" id="cAgenda"><header><h2>Agendamentos</h2><button type="button" class="btn primary" id="bNewAg">+ Marcar</button></header><div class="filterbar" id="agF" role="group" aria-label="Filtrar agendamentos"></div><ul class="list" id="ags"></ul></section>
  <section class="card"><h2>Conversas do WhatsApp</h2><div class="list" id="convs"></div></section></div>`;
  drawBookings(); drawConvs();
  $('#bNewAg').onclick = bookingModal;
}
function drawBookings() {
  const el = $('#ags'); if (!el) return;
  const all = list(S.client.agendamentos), f = S.agFilter, items = all.filter(a => f === 'todos' || a.status === f);
  $('#agF').innerHTML = [['todos', 'Todos'], ['confirmado', 'Confirmados'], ['concluido', 'Concluídos'], ['cancelado', 'Cancelados']].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${f === k}">${l} (${k === 'todos' ? all.length : all.filter(a => a.status === k).length})</button>`).join('');
  $('#agF').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { S.agFilter = b.dataset.f; drawBookings(); } };
  el.innerHTML = items.map(a => {
    const [cls, lbl] = STATUS[a.status] || ['', a.status || 'Sem status'], wa = waLink(a.clienteTelefone);
    return `<li class="item"><div class="item-top"><h3>${esc(a.dataHora)}</h3><span class="badge dot ${cls}">${esc(lbl)}</span></div><p class="kv"><b>${esc(a.clienteNome)}</b> · ${esc(a.servico)}</p>${a.detalhes ? `<p class="small mute">${esc(a.detalhes)}</p>` : ''}
    <div class="acts">${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a>` : ''}${Object.entries(STATUS).filter(([k]) => k !== a.status).map(([k, s]) => `<button type="button" class="btn ${k === 'cancelado' ? 'danger' : 'ghost'}" data-st="${k}" data-ag="${esc(a.id)}">${k === 'confirmado' ? 'Confirmar' : k === 'concluido' ? 'Concluir' : 'Cancelar'}</button>`).join('')}</div></li>`;
  }).join('') || '<li class="empty">Nada por aqui neste filtro.</li>';
  el.onclick = async e => {
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
    busy($('button.primary', f), async () => { if (slug !== S.slug) return; const d = await call('update_booking', { novoAgendamento: n }); applyClient(d.client); S.agFilter = 'todos'; modal.close(); drawBookings(); const first = $('#ags>li'); if (first) { stagger([first], -30, 0); glow(first); } burst(); toast('Agendamento salvo.'); });
  };
}
function drawConvs() {
  const el = $('#convs'); if (!el) return;
  const paused = list(S.client.contatosPausados).map(digits);
  const isPaused = t => paused.some(p => p && p.slice(-8) === digits(t).slice(-8));
  const open = $$('details[open]', el).map(d => d.dataset.tel);
  el.innerHTML = list(S.client.conversas).map(c => {
    const p = isPaused(c.telefone), wa = waLink(c.telefone);
    return `<details class="item" data-tel="${esc(c.telefone)}" ${open.includes(String(c.telefone)) ? 'open' : ''}><summary><span>${esc(c.nome || c.telefone)}</span>${p ? '<span class="badge warn">Com você</span>' : '<span class="badge ok">Com o robô</span>'}</summary><div class="body"><p class="small mute">${esc(c.telefone)} · ${esc(when(c.atualizadoEm))}</p><div class="log">${list(c.historico).map(h => `<div class="bubble ${h.role === 'assistant' ? 'out' : 'in'}">${esc(h.content)}</div>`).join('') || `<div class="bubble in">${esc(c.ultimaMensagem)}</div>`}</div><div class="acts"><button type="button" class="btn ${p ? 'primary' : ''}" data-pause="${esc(c.telefone)}">${p ? 'Devolver para a IA' : 'Pausar IA neste contato / Assumir conversa'}</button>${wa ? `<a class="btn ghost" href="${wa}" target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a>` : ''}</div></div></details>`;
  }).join('') || '<p class="empty">Nenhuma conversa ainda. Elas aparecem quando o WhatsApp estiver conectado e alguém escrever.</p>';
  el.onclick = e => {
    const b = e.target.closest('[data-pause]'); if (!b) return;
    // usa o número já salvo na lista de pausados, para reativar o mesmo registro
    const tel = digits(b.dataset.pause), match = paused.find(p => p.slice(-8) === tel.slice(-8));
    busy(b, async () => { const d = await call('toggle_pause_contact', { telefone: match || tel }); applyClient(d.client); drawConvs(); toast(match ? 'A IA voltou a atender este contato.' : 'IA pausada. A conversa é sua.'); });
  };
}

/* ---------- início ---------- */
(async function boot() {
  const q = new URLSearchParams(location.search);
  const slug = (q.get('cliente') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const linkPin = q.get('pin') || q.get('codigo') || '';
  S.linkMode = !!slug;
  // o código sai da barra de endereço assim que é lido
  if (q.has('pin') || q.has('codigo')) history.replaceState(null, '', location.pathname + (slug ? '?cliente=' + slug : ''));
  const pin = linkPin || (slug ? savedPin(slug) : '');
  if (slug && pin) {
    try { await enter(slug, pin, linkPin ? true : null); return; }
    catch (e) { gate(slug, e.message); return; }
  }
  gate(slug);
})();
})();
