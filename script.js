// =============================
// VARIÁVEL GLOBAL
// =============================
let usuarioLogado = null;
let calendar;

// =============================
// LOGIN
// =============================
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
      document.getElementById("infoUsuario").innerText = data.usuario.nome;

      carregarUsuarios();
      carregarSolicitacoes();
      carregarCalendario();
      carregarAniversariantes();

      setInterval(() => {
        if (usuarioLogado) {
          carregarSolicitacoes();
          carregarCalendario();
        }
      }, 5000);

    } else {
      document.getElementById("loginErro").innerText = data.erro;
    }

  } catch (error) {
    document.getElementById("loginErro").innerText = "Erro ao conectar";
  }
}

// =============================
// USUÁRIOS
// =============================
async function carregarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const lista = document.getElementById("listaUsuarios");
  if (!lista) return;
  lista.innerHTML = "";
  usuarios.forEach(u => {
    const li = document.createElement("li");
    li.innerText = `${u.nome} (${u.username}) - ${u.role}`;
    lista.appendChild(li);
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

// =============================
// SOLICITAÇÕES
// =============================
async function criarSolicitacao() {
  const tipo = document.getElementById("tipo").value;
  const data = document.getElementById("data").value;
  const motivo = document.getElementById("motivo").value;

  await fetch("/api/criar-solicitacao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario_id: usuarioLogado.id,
      tipo,
      data,
      motivo
    })
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

// =============================
// ANIVERSARIANTES
// =============================
async function carregarAniversariantes() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const mesAtual = new Date().getMonth() + 1;
  const ul = document.getElementById("listaAniversariantes");
  if (!ul) return;
  ul.innerHTML = "";
  usuarios
    .filter(u => new Date(u.nascimento).getMonth() + 1 === mesAtual)
    .forEach(u => {
      const li = document.createElement("li");
      li.innerText = `${u.nome} - ${new Date(u.nascimento).toLocaleDateString('pt-BR', { day: '2-digit' })}`;
      ul.appendChild(li);
    });
}

// =============================
// NAVEGAÇÃO ENTRE TELAS
// =============================
function mostrarTela(tela) {
  document.querySelectorAll(".tela").forEach(t => t.style.display = "none");
  document.getElementById(tela).style.display = "block";
  document.getElementById("titulo").innerText = tela;
}

// =============================
// LOGOUT
// =============================
function logout() {
  location.reload();
}

// =============================
// CALENDÁRIO
// =============================
async function carregarCalendario() {
  const res = await fetch("/api/solicitacoes");
  const dados = await res.json();

  const eventos = dados.map(s => ({
    title: `${s.nome} - ${s.tipo}`,
    date: s.data,
    extendedProps: { status: s.status, motivo: s.motivo, usuario: s.nome },
    color: corTipo(s.tipo)
  }));

  const el = document.getElementById("calendar");
  const detalhesEl = document.getElementById("detalhesDia");
  if (!el || !detalhesEl) return;

  if (!calendar) {
    calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'pt-br',
      events: eventos,
      dayCellDidMount: arg => arg.el.style.cursor = "pointer",
      dateClick: info => mostrarDetalhesDia(info.dateStr, dados)
    });
    calendar.render();
  } else {
    calendar.removeAllEvents();
    calendar.addEventSource(eventos);
  }
}

// =============================
// DETALHES DO DIA
// =============================
function mostrarDetalhesDia(data, dados) {
  const detalhesEl = document.getElementById("detalhesDia");
  const detalhes = dados.filter(s => s.data === data);

  if (detalhes.length === 0 || detalhesEl.dataset.aberto === data) {
    detalhesEl.style.display = "none";
    detalhesEl.dataset.aberto = "";
    return;
  }

  detalhesEl.dataset.aberto = data;

  detalhesEl.innerHTML = `<h3 style="margin-bottom:10px;">${detalhes.length} Solicitação(s) - ${data}</h3>` +
    detalhes.map(s => `
      <div style="padding:5px 0; border-bottom:1px solid #0f172a;">
        <strong>${s.nome}</strong> - <span style="color:${corTipo(s.tipo)};">${s.tipo}</span> (${s.status})<br>
        <small>${s.motivo || "-"}</small>
      </div>
    `).join('');

  detalhesEl.style.display = "block";
}

// =============================
// CORES POR TIPO
// =============================
function corTipo(tipo) {
  if (tipo === "falta") return "red";
  if (tipo === "atraso") return "orange";
  if (tipo === "ferias") return "green";
  return "blue";
}
