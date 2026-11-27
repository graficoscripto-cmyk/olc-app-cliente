/* =====================  CHECKOUT CAKTO  =====================
   Cole aqui os links do checkout (começando com https://). Vazio = modo de teste: o botão do plano
   abre o passo a passo no aplicativo, sem cobrar. Na Cakto, a página de retorno depois do pagamento é:
     https://graficoscripto-cmyk.github.io/olc-app-cliente/app.html?pos_pagamento=1&plano=semanal
     https://graficoscripto-cmyk.github.io/olc-app-cliente/app.html?pos_pagamento=1&plano=mensal
   Atenção: esse endereço NÃO comprova pagamento. A liberação real precisa ser confirmada no servidor. */
const CAKTO_CHECKOUT_SEMANAL_URL = '';
const CAKTO_CHECKOUT_MENSAL_URL = '';
window.OLC_CONFIG = { checkout: { semanal: CAKTO_CHECKOUT_SEMANAL_URL, mensal: CAKTO_CHECKOUT_MENSAL_URL } };
