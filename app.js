/* =====================================================
   FINANCE CONTROL SYSTEM — app.js
   Auth + Storage: Supabase
   ===================================================== */

// ─── Configuração Supabase ────────────────────────────
const SUPABASE_URL  = 'https://dbljvtkfsemexvyyotjl.supabase.co';
const SUPABASE_ANON = 'sb_publishable_G34ZFZbMO8faTziAk11sPw_knlEyQtw';
const TABELA        = 'gastos';

// Token de sessão do usuário logado
let tokenSessao = null;

// Headers base (sem auth — usados só no login/cadastro)
const headersBase = {
  'Content-Type': 'application/json',
  'apikey':       SUPABASE_ANON,
};

// Headers autenticados (usados em todas as operações de dados)
function headersAuth() {
  return {
    ...headersBase,
    'Authorization': `Bearer ${tokenSessao}`,
  };
}

// ─── Estado global ────────────────────────────────────
let historico = [];
let idRemover = null;
let idEditar  = null; // ID do gasto em edição
let limiteMensal = 0;
// ═══════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════

// Troca entre abas Login / Criar Conta
function trocarAba(aba, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('form-' + aba).classList.add('active');
  limparErrosAuth();
}

function limparErrosAuth() {
  ['err-login-email','err-login-senha','err-login-geral',
   'err-reg-email','err-reg-senha','err-reg-confirma','err-reg-geral']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
}

// ── Login ─────────────────────────────────────────────
async function fazerLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  let valido = true;
  if (!email) { setError('err-login-email', 'Informe seu e-mail.'); valido = false; }
  if (!senha)  { setError('err-login-senha', 'Informe sua senha.');  valido = false; }
  if (!valido) return;

  setBloqueadoAuth(true);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:  'POST',
      headers: headersBase,
      body:    JSON.stringify({ email, password: senha }),
    });

    const dados = await res.json();

    if (!res.ok) {
      const msg = dados.error_description || dados.msg || 'E-mail ou senha incorretos.';
      setError('err-login-geral', msg);
      return;
    }

    tokenSessao = dados.access_token;
    entrarNoApp(dados.user.email);

  } catch {
    setError('err-login-geral', 'Erro de conexão. Tente novamente.');
  } finally {
    setBloqueadoAuth(false);
  }
}

// ── Criar Conta ───────────────────────────────────────
async function fazerCadastro() {
  const email    = document.getElementById('reg-email').value.trim();
  const senha    = document.getElementById('reg-senha').value;
  const confirma = document.getElementById('reg-confirma').value;

  let valido = true;
  if (!email)              { setError('err-reg-email',    'Informe um e-mail.');        valido = false; }
  if (senha.length < 6)    { setError('err-reg-senha',    'Mínimo 6 caracteres.');      valido = false; }
  if (senha !== confirma)  { setError('err-reg-confirma', 'As senhas não coincidem.');  valido = false; }
  if (!valido) return;

  setBloqueadoAuth(true);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method:  'POST',
      headers: headersBase,
      body:    JSON.stringify({ email, password: senha }),
    });

    const dados = await res.json();

    if (!res.ok) {
      const msg = dados.error_description || dados.msg || 'Erro ao criar conta.';
      setError('err-reg-geral', msg);
      return;
    }

    // Supabase pode exigir confirmação de e-mail
    if (dados.access_token) {
      tokenSessao = dados.access_token;
      entrarNoApp(dados.user.email);
    } else {
      setError('err-reg-geral', '');
      // Mostra mensagem de confirmação e volta pra aba de login
      document.getElementById('err-reg-geral').style.color = 'var(--success)';
      setError('err-reg-geral', '✔ Conta criada! Verifique seu e-mail para confirmar.');
    }

  } catch {
    setError('err-reg-geral', 'Erro de conexão. Tente novamente.');
  } finally {
    setBloqueadoAuth(false);
  }
}

// ── Logout ────────────────────────────────────────────
async function fazerLogout() {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method:  'POST',
      headers: { ...headersBase, 'Authorization': `Bearer ${tokenSessao}` },
    });
  } catch { /* ignora erros de rede no logout */ }

  tokenSessao = null;
  historico   = [];

  document.getElementById('tela-app').style.display  = 'none';
  document.getElementById('tela-auth').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-senha').value = '';
}

// ── Entrar no app após login bem-sucedido ─────────────
async function entrarNoApp(email) {
  document.getElementById('tela-auth').style.display = 'none';
  document.getElementById('tela-app').style.display  = 'block';
  document.getElementById('user-email-display').textContent = email;
  carregarLimiteSalvo();

  // Carrega os gastos do usuário logado
  ['stat-total', 'stat-max'].forEach(id => {
    document.getElementById(id).textContent = 'R$ ...';
  });
  document.getElementById('stat-count').textContent = '...';

  try {
    historico = await dbBuscarTodos();
    atualizarStats();
  } catch {
    showToast('Erro ao carregar dados.', 'danger');
    atualizarStats();
  }
}

// ═══════════════════════════════════════════════════════
// API SUPABASE — OPERAÇÕES DE DADOS
// ═══════════════════════════════════════════════════════

async function dbBuscarTodos() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABELA}?select=*&order=id.asc`,
    { headers: { ...headersAuth(), 'apikey': SUPABASE_ANON } }
  );
  if (!res.ok) throw new Error('Erro ao buscar gastos.');
  return res.json();
}

async function dbInserir(gasto) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABELA}`,
    {
      method:  'POST',
      headers: { ...headersAuth(), 'apikey': SUPABASE_ANON, 'Prefer': 'return=representation' },
      body:    JSON.stringify(gasto),
    }
  );
  if (!res.ok) throw new Error('Erro ao cadastrar gasto.');
  const dados = await res.json();
  return dados[0];
}

async function dbRemover(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABELA}?id=eq.${id}`,
    { method: 'DELETE', headers: { ...headersAuth(), 'apikey': SUPABASE_ANON } }
  );
  if (!res.ok) throw new Error('Erro ao remover gasto.');
}

async function dbAtualizar(id, gasto) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABELA}?id=eq.${id}`,
    {
      method:  'PATCH',
      headers: { ...headersAuth(), 'apikey': SUPABASE_ANON, 'Prefer': 'return=representation' },
      body:    JSON.stringify(gasto),
    }
  );
  if (!res.ok) throw new Error('Erro ao atualizar gasto.');
  const dados = await res.json();
  return dados[0];
}

// ═══════════════════════════════════════════════════════
// VALIDAÇÃO
// ═══════════════════════════════════════════════════════

function validarNome(v) {
  if (!v || v.trim().length === 0) return 'Informe um nome válido.';
  if (/^\d+$/.test(v.trim()))      return 'O nome não pode ser apenas números.';
  return '';
}

function validarValor(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return 'Informe um número válido (ex: 50.30).';
  if (n <= 0)   return 'O valor precisa ser maior que zero.';
  return '';
}

function validarClasse(v) {
  if (!v || v.trim().length === 0) return 'Informe uma categoria válida.';
  if (/^\d+$/.test(v.trim()))      return 'A categoria não pode ser apenas números.';
  return '';
}

function validarData(v) {
  if (!v) return 'Selecione uma data.';
  return '';
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// ═══════════════════════════════════════════════════════
// GASTOS — CADASTRO
// ═══════════════════════════════════════════════════════

async function salvarGasto() {
  const nome   = document.getElementById('inp-nome').value;
  const valor  = document.getElementById('inp-valor').value;
  const classe = document.getElementById('inp-classe').value;
  const data   = document.getElementById('inp-data').value;

  const eNome   = validarNome(nome);
  const eValor  = validarValor(valor);
  const eClasse = validarClasse(classe);
  const eData   = validarData(data);

  setError('err-nome',   eNome);
  setError('err-valor',  eValor);
  setError('err-classe', eClasse);
  setError('err-data',   eData);

  if (eNome || eValor || eClasse || eData) return;

  const [y, m, d] = data.split('-');
  const dataBR = `${d}/${m}/${y}`;

  // user_id é preenchido automaticamente pelo Supabase via auth.uid()
  const novoGasto = {
    nome:   nome.trim(),
    valor:  parseFloat(parseFloat(valor).toFixed(2)),
    classe: classe.trim(),
    data:   dataBR,
  };

  setBloqueado(true);
  try {
    const registrado = await dbInserir(novoGasto);
    historico.push(registrado);
    atualizarStats();

    document.getElementById('inp-nome').value   = '';
    document.getElementById('inp-valor').value  = '';
    document.getElementById('inp-classe').value = '';
    document.getElementById('inp-data').value   = '';

    showToast(`✔ "${nome.trim()}" cadastrado com sucesso!`, 'success');
  } catch {
    showToast('Erro ao salvar. Verifique sua conexão.', 'danger');
  } finally {
    setBloqueado(false);
  }
}

// ═══════════════════════════════════════════════════════
// GASTOS — REMOÇÃO
// ═══════════════════════════════════════════════════════

function renderListaRemover() {
  const cont = document.getElementById('lista-remover');

  if (!historico.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⬡</div>
        <div class="empty-text">Nenhum gasto para remover</div>
      </div>`;
    return;
  }

  cont.innerHTML = historico.map(g => `
    <div class="report-card">
      <div class="report-row">
        <div>
          <div class="report-name">${escHtml(g.nome)}</div>
          <div class="report-meta">${escHtml(g.classe)} &nbsp;·&nbsp; ${g.data}</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px">
          <span class="val-cell">R$ ${formatVal(Number(g.valor))}</span>
          <button class="btn-remove" onclick="abrirModal(${g.id}, '${escHtml(g.nome)}')">✕ Remover</button>
        </div>
      </div>
    </div>
  `).join('');
}

function abrirModal(id, nome) {
  idRemover = id;
  document.getElementById('modal-nome').textContent = nome;
  document.getElementById('modal-overlay').classList.add('open');
}

function fecharModal() {
  idRemover = null;
  document.getElementById('modal-overlay').classList.remove('open');
}

async function confirmarRemocao() {
  if (idRemover === null) return;

  const gasto = historico.find(g => g.id === idRemover);
  const nome  = gasto?.nome ?? '';

  setBloqueado(true);
  try {
    await dbRemover(idRemover);
    historico = historico.filter(g => g.id !== idRemover);
    fecharModal();
    renderListaRemover();
    atualizarStats();
    showToast(`✔ "${nome}" removido com sucesso!`, 'danger');
  } catch {
    showToast('Erro ao remover. Verifique sua conexão.', 'danger');
    fecharModal();
  } finally {
    setBloqueado(false);
  }
}

// ═══════════════════════════════════════════════════════
// GASTOS — EDIÇÃO
// ═══════════════════════════════════════════════════════

function renderListaEditar() {
  const cont = document.getElementById('lista-editar');

  if (!historico.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⬡</div>
        <div class="empty-text">Nenhum gasto para editar</div>
      </div>`;
    return;
  }

  cont.innerHTML = historico.map(g => `
    <div class="report-card">
      <div class="report-row">
        <div>
          <div class="report-name">${escHtml(g.nome)}</div>
          <div class="report-meta">${escHtml(g.classe)} &nbsp;·&nbsp; ${g.data}</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px">
          <span class="val-cell">R$ ${formatVal(Number(g.valor))}</span>
          <button class="btn-edit" onclick="abrirModalEditar(${g.id})">✎ Editar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function abrirModalEditar(id) {
  const gasto = historico.find(g => g.id === id);
  if (!gasto) return;

  idEditar = id;

  // Converte data de DD/MM/YYYY para YYYY-MM-DD (formato do input[type=date])
  const partes = gasto.data.split('/');
  const dataInput = partes.length === 3
    ? `${partes[2]}-${partes[1]}-${partes[0]}`
    : '';

  document.getElementById('edit-nome').value   = gasto.nome;
  document.getElementById('edit-valor').value  = gasto.valor;
  document.getElementById('edit-classe').value = gasto.classe;
  document.getElementById('edit-data').value   = dataInput;

  // Limpa erros anteriores
  ['err-edit-nome','err-edit-valor','err-edit-classe','err-edit-data']
    .forEach(id => setError(id, ''));

  document.getElementById('modal-editar-overlay').classList.add('open');
}

function fecharModalEditar() {
  idEditar = null;
  document.getElementById('modal-editar-overlay').classList.remove('open');
}

async function confirmarEdicao() {
  const nome   = document.getElementById('edit-nome').value;
  const valor  = document.getElementById('edit-valor').value;
  const classe = document.getElementById('edit-classe').value;
  const data   = document.getElementById('edit-data').value;

  const eNome   = validarNome(nome);
  const eValor  = validarValor(valor);
  const eClasse = validarClasse(classe);
  const eData   = validarData(data);

  setError('err-edit-nome',   eNome);
  setError('err-edit-valor',  eValor);
  setError('err-edit-classe', eClasse);
  setError('err-edit-data',   eData);

  if (eNome || eValor || eClasse || eData) return;

  const [y, m, d] = data.split('-');
  const dataBR = `${d}/${m}/${y}`;

  const gastoAtualizado = {
    nome:   nome.trim(),
    valor:  parseFloat(parseFloat(valor).toFixed(2)),
    classe: classe.trim(),
    data:   dataBR,
  };

  setBloqueado(true);
  try {
    const retorno = await dbAtualizar(idEditar, gastoAtualizado);

    // Atualiza o registro no array local
    const idx = historico.findIndex(g => g.id === idEditar);
    if (idx !== -1) historico[idx] = retorno;

    fecharModalEditar();
    renderListaEditar();
    atualizarStats();
    showToast(`✔ "${gastoAtualizado.nome}" atualizado com sucesso!`, 'success');
  } catch {
    showToast('Erro ao atualizar. Verifique sua conexão.', 'danger');
  } finally {
    setBloqueado(false);
  }
}

// ═══════════════════════════════════════════════════════
// RELATÓRIO E STATS
// ═══════════════════════════════════════════════════════

function renderRelatorio() {
  const tbody  = document.getElementById('tbody-relatorio');
  const empty  = document.getElementById('empty-relatorio');
  const totRow = document.getElementById('total-row-rel');
  const totVal = document.getElementById('total-rel');
  const tabela = document.getElementById('tabela-relatorio');

  if (!historico.length) {
    tbody.innerHTML      = '';
    tabela.style.display = 'none';
    totRow.style.display = 'none';
    empty.style.display  = 'block';
    return;
  }

  tabela.style.display = 'table';
  totRow.style.display = 'flex';
  empty.style.display  = 'none';

  const total = historico.reduce((s, g) => s + Number(g.valor), 0);
  totVal.textContent = `R$ ${formatVal(total)}`;

  tbody.innerHTML = historico.map(g => `
    <tr>
      <td>${escHtml(g.nome)}</td>
      <td><span class="val-cell">R$ ${formatVal(Number(g.valor))}</span></td>
      <td><span class="tag-class">${escHtml(g.classe)}</span></td>
      <td style="color:var(--text-muted); font-size:13px;">${g.data}</td>
    </tr>
  `).join('');
}

function atualizarStats() {
  const total  = historico.reduce((s, g) => s + Number(g.valor), 0);
  const maxVal = historico.length ? Math.max(...historico.map(g => Number(g.valor))) : 0;

  document.getElementById('stat-total').textContent = `R$ ${formatVal(total)}`;
  document.getElementById('stat-count').textContent = historico.length;
  document.getElementById('stat-max').textContent   = `R$ ${formatVal(maxVal)}`;

  // ─── LÓGICA DE ALERTA VISUAL CYBERPUNK ───
  const cardTotal = document.getElementById('stat-total').parentElement; 
  const cardLimite = document.getElementById('card-limite');

  // Remove classes antigas para recalcular
  if (cardTotal) cardTotal.classList.remove('alerta-atencao', 'alerta-critico');
  if (cardLimite) cardLimite.classList.remove('alerta-atencao', 'alerta-critico');

  // Se houver um limite definido maior que zero, testa as regras
  if (limiteMensal > 0) {
    const percentualGasto = (total / limiteMensal) * 100;

    if (percentualGasto >= 100) {
      // Estourou o limite! (Vermelho Pulsante)
      if (cardTotal) cardTotal.classList.add('alerta-critico');
      if (cardLimite) cardLimite.classList.add('alerta-critico');
      showToast('⚠️ ALERTA DE SISTEMA: Limite de gastos excedido!', 'danger');
    } else if (percentualGasto >= 80) {
      // Próximo do limite! (Laranja)
      if (cardTotal) cardTotal.classList.add('alerta-atencao');
      if (cardLimite) cardLimite.classList.add('alerta-atencao');
    }
  }
}

// ═══════════════════════════════════════════════════════
// NAVEGAÇÃO E UI
// ═══════════════════════════════════════════════════════

function showView(view, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  btn.classList.add('active');
  if (view === 'remover')   renderListaRemover();
  if (view === 'relatorio') renderRelatorio();
  if (view === 'editar')    renderListaEditar();
}

function setBloqueado(estado) {
  document.querySelectorAll('#tela-app button, #tela-app input').forEach(el => {
    el.disabled = estado;
  });
  const btn = document.querySelector('.btn-primary');
  if (btn) btn.textContent = estado ? '⟳  Aguarde...' : '⬡   Cadastrar Gasto';
}

function setBloqueadoAuth(estado) {
  document.querySelectorAll('#tela-auth button, #tela-auth input').forEach(el => {
    el.disabled = estado;
  });
}

// ─── Toast ────────────────────────────────────────────
let toastTimer;

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast' + (type ? ' ' + type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── Utilitários ──────────────────────────────────────
function formatVal(n) {
  return Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Carrega o limite salvo no LocalStorage para o e-mail do usuário atual
function carregarLimiteSalvo() {
  const emailAtivo = document.getElementById('user-email-display').textContent;
  const limiteSalvo = localStorage.getItem(`limite_${emailAtivo}`);
  
  if (limiteSalvo) {
    limiteMensal = parseFloat(limiteSalvo);
    document.getElementById('inp-limite').value = limiteMensal;
  } else {
    limiteMensal = 0;
    document.getElementById('inp-limite').value = '';
  }
  const elStat = document.getElementById('stat-limite');
  if (elStat) elStat.textContent = `R$ ${formatVal(limiteMensal)}`;
}

// Salva o limite definido pelo usuário
function salvarLimiteMensal() {
  const valorInput = document.getElementById('inp-limite').value;
  const emailAtivo = document.getElementById('user-email-display').textContent;
  
  if (valorInput === '' || isNaN(valorInput) || parseFloat(valorInput) < 0) {
    showToast('Informe um valor de limite válido.', 'danger');
    return;
  }
  
  limiteMensal = parseFloat(valorInput);
  localStorage.setItem(`limite_${emailAtivo}`, limiteMensal);
  
  const elStat = document.getElementById('stat-limite');
  if (elStat) elStat.textContent = `R$ ${formatVal(limiteMensal)}`;
  
  atualizarStats(); // Revalida as cores dos cards imediatamente
  showToast('✔ Limite atualizado com sucesso!', 'success');
}

// ─── Event Listeners ──────────────────────────────────

// Enter no formulário de gastos
['inp-nome', 'inp-valor', 'inp-classe', 'inp-data'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => {
    if (e.key === 'Enter') salvarGasto();
  });
});

// Enter nos campos de login
document.getElementById('login-senha').addEventListener('keydown', e => {
  if (e.key === 'Enter') fazerLogin();
});

// Enter nos campos de cadastro de conta
document.getElementById('reg-confirma').addEventListener('keydown', e => {
  if (e.key === 'Enter') fazerCadastro();
});

// Fechar modal clicando fora
document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) fecharModal();
});

// Fechar modal de edição clicando fora
document.getElementById('modal-editar-overlay').addEventListener('click', function (e) {
  if (e.target === this) fecharModalEditar();
});