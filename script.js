let usuarioLogado = null;
let calendar = null;
let dayDetailsEl = null;

// LOGIN
async function login() {
  const username = document.getElementById("loginUser").value;
  const senha = document.getElementById("loginPass").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, senha })
    });
    const data = await res.json();

    if (res.ok) {
      usuarioLogado = data.usuario;
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("painel").style.display = "block";
     const tipo = data.usuario.role === "admin" ? "Admin" : "Funcionário";
document.getElementById("infoUsuario").innerText = `${data.usuario.nome} (${tipo})`;

      carregarUsuarios();
      carregarSolicitacoes();
      carregarCalendario();
      carregarAniversariantes();

    } else {
      document.getElementById("loginErro").innerText = data.erro;
    }

  } catch (err) {
    document.getElementById("loginErro").innerText = "Erro ao conectar";
  }
}

// USUÁRIOS
async function carregarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const ul = document.getElementById("listaUsuarios");
  if (!ul) return;
  ul.innerHTML = "";
  usuarios.forEach(u => {
    const li = document.createElement("li");
    li.innerText = `${u.nome} (${u.username}) - ${u.role}`;
    ul.appendChild(li);
  });
}

async function criarUsuario() {
  const nome = document.getElementById("nome").value;
  const username = document.getElementById("username").value;
  const senha = document.getElementById("senha").value;
  const role = document.getElementById("role").value;

  await fetch("/api/criar-usuario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, username, senha, role })
  });

  carregarUsuarios();
}

// SOLICITAÇÕES
async function criarSolicitacao() {
  const tipo = document.getElementById("tipo").value;
  const data = document.getElementById("data").value;
  const motivo = document.getElementById("motivo").value;

  await fetch("/api/criar-solicitacao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id: usuarioLogado.id, tipo, data, motivo })
  });

  carregarSolicitacoes();
}

async function carregarSolicitacoes() {
  const res = await fetch("/api/solicitacoes");
  const lista = await res.json();
  const ul = document.getElementById("listaSolicitacoes");
  if (!ul) return;
  ul.innerHTML = "";
  lista.forEach(s => {
    const li = document.createElement("li");
    li.innerText = `${s.nome} - ${s.tipo} - ${s.data} (${s.status})`;
    ul.appendChild(li);
  });
}

// DASHBOARD - Aniversariantes
async function carregarAniversariantes() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const ul = document.getElementById("listaAniversariantes");
  if (!ul) return;

  const mesAtual = new Date().getMonth() + 1;
  ul.innerHTML = "";

  usuarios.forEach(u => {
    const data = new Date(u.dataNascimento);
    if (data.getMonth() + 1 === mesAtual) {
      const li = document.createElement("li");
      li.innerText = `${u.nome} - ${data.getDate()}/${data.getMonth()+1}`;
      ul.appendChild(li);
    }
  });
}

// NAVEGAÇÃO
function mostrarTela(tela) {
  document.querySelectorAll(".tela").forEach(t => t.style.display = "none");
  document.getElementById(tela).style.display = "block";
  document.getElementById("titulo").innerText = tela;
}

// LOGOUT
function logout() { location.reload(); }

// CALENDÁRIO INTERATIVO
async function carregarCalendario() {
  const res = await fetch("/api/solicitacoes");
  const dados = await res.json();
  const el = document.getElementById("calendar");
  if (!el) return;

  const eventos = dados.map(s => ({
    title: `${s.nome} - ${s.tipo}`,
    date: s.data,
    extendedProps: { status: s.status, motivo: s.motivo, usuario: s.nome },
    color: corTipo(s.tipo)
  }));

  if (!calendar) {
    calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'pt-br',
      events: eventos,
      dayCellDidMount: arg => arg.el.style.cursor = "pointer",
      dateClick: info => toggleDetalhes(info.dateStr, dados)
    });
    calendar.render();
    dayDetailsEl = document.getElementById("detalhesDia");
  } else {
    calendar.removeAllEvents();
    calendar.addEventSource(eventos);
  }
}

function toggleDetalhes(data, dados) {
  const detalhes = dados.filter(s => s.data === data);
  if (detalhes.length === 0 || dayDetailsEl.dataset.aberto === data) {
    dayDetailsEl.style.display = "none";
    dayDetailsEl.dataset.aberto = "";
    return;
  }

  dayDetailsEl.dataset.aberto = data;
  dayDetailsEl.innerHTML = `<h3>${detalhes.length} Solicitação(s) - ${data}</h3>` +
    detalhes.map(s => `<div><strong>${s.nome}</strong> - ${s.tipo} (${s.status})<br>Motivo: ${s.motivo}</div>`).join('');
  dayDetailsEl.style.display = "block";
}

// CORES
function corTipo(tipo) {
  if (tipo === "falta") return "red";
  if (tipo === "atraso") return "orange";
  if (tipo === "ferias") return "green";
  return "blue";
}
function abrirTrocaSenha() {
  document.getElementById("popupSenha").style.display = "block";
}

function fecharTrocaSenha() {
  document.getElementById("popupSenha").style.display = "none";
}

async function trocarSenha() {
  const novaSenha = document.getElementById("novaSenha").value;

  if (!novaSenha) {
    alert("Digite uma nova senha");
    return;
  }

  const res = await fetch("/api/trocar-senha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: usuarioLogado.id,
      novaSenha
    })
  });

  if (res.ok) {
    alert("Senha alterada com sucesso!");
    fecharTrocaSenha();
  } else {
    alert("Erro ao trocar senha");
  }
}
