/* Página de vendas: só vende. Tudo do aplicativo acontece em app.html. */
(function () {
'use strict';
const q = new URLSearchParams(location.search);
/* links antigos (conta do cliente, retorno de pagamento, ícone já instalado) seguem para o aplicativo */
if (['cliente', 'pos_pagamento', 'app', 'demo', 'mestre', 'pin', 'codigo', 'quiz'].some(k => q.has(k))) { location.replace('app.html' + location.search + location.hash); return; }
const checkout = window.OLC_CONFIG.checkout, ready = p => /^https:\/\//.test(String(checkout[p] || '').trim());
window.OLCLanding(document.getElementById('app'), {
  login: () => location.assign('app.html'),
  plan: p => location.assign(ready(p) ? checkout[p].trim() : 'app.html?pos_pagamento=1&plano=' + encodeURIComponent(p)),
  testMode: !ready('semanal') || !ready('mensal')
});
if (location.hash.length > 1) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
})();
