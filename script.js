// =============================
// VARIÁVEIS GLOBAIS
// =============================
let usuarioLogado = null;
let calendar = null;
let dayDetailsEl = null;

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

// =============================
// DASHBOARD
// =============================
async function carregarAniversariantes() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const ul = document.getElementById("listaAniversariantes");
  if (!ul) return;

  const mesAtual = new Date().getMonth() + 1; // Janeiro = 0
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
// CALENDÁRIO INTERATIVO
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
  if (!el) return;

  if (!calendar) {
    calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'pt-br',
      events: eventos,
      dayCellDidMount: arg => { arg.el.style.cursor = "pointer"; },
      dateClick: info => mostrarDetalhesDia(info.dateStr, dados)
    });
    calendar.render();

    // container flutuante para detalhes
    dayDetailsEl = document.createElement("div");
    dayDetailsEl.id = "detalhesDia";
    dayDetailsEl.style.position = "absolute";
    dayDetailsEl.style.background = "#1e293b";
    dayDetailsEl.style.padding = "15px";
    dayDetailsEl.style.borderRadius = "10px";
    dayDetailsEl.style.top = "80px";
    dayDetailsEl.style.left = "50%";
    dayDetailsEl.style.transform = "translateX(-50%)";
    dayDetailsEl.style.display = "none";
    dayDetailsEl.style.maxWidth = "400px";
    dayDetailsEl.style.boxShadow = "0 0 15px rgba(0,0,0,0.5)";
    dayDetailsEl.style.zIndex = "1000";
    document.body.appendChild(dayDetailsEl);
  } else {
    calendar.removeAllEvents();
    calendar.addEventSource(eventos);
  }
}

function mostrarDetalhesDia(data, dados) {
  const detalhes = dados.filter(s => s.data === data);

  if (detalhes.length === 0 || dayDetailsEl.dataset.aberto === data) {
    dayDetailsEl.style.display = "none";
    dayDetailsEl.dataset.aberto = "";
    return;
  }

  dayDetailsEl.dataset.aberto = data;

  dayDetailsEl.innerHTML = `<h3>${detalhes.length} Solicitação(s) - ${data}</h3>` +
    detalhes.map(s => `
      <div style="padding:5px 0; border-bottom:1px solid #0f172a;">
        <strong>${s.nome}</strong> - ${s.tipo} (${s.status})
      </div>
    `).join('');

  dayDetailsEl.style.display = "block";
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
