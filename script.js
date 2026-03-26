// =============================
// VARIÁVEL GLOBAL
// =============================
let usuarioLogado = null;


// =============================
// LOGIN
// =============================
async function login() {
  const username = document.getElementById("loginUser").value;
  const senha = document.getElementById("loginPass").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
    headers: {
      "Content-Type": "application/json"
    },
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
    headers: {
      "Content-Type": "application/json"
    },
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
let calendar;

async function carregarCalendario() {
  const res = await fetch("/api/solicitacoes");
  const dados = await res.json();

  const eventos = dados.map(s => ({
    title: `${s.nome} - ${s.tipo}`,
    date: s.data,
    color: corTipo(s.tipo)
  }));

  const el = document.getElementById("calendar");

  if (!el) return;

  if (!calendar) {
    calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'pt-br',
      events: eventos,
      eventClick: function(info) {
        alert(info.event.title);
      }
    });

    calendar.render();
  } else {
    calendar.removeAllEvents();
    calendar.addEventSource(eventos);
  }
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
