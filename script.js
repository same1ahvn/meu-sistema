// =============================
// VARIÁVEL GLOBAL
// =============================
let usuarioLogado = null;
let calendar;
let dayDetailsEl;

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
// USUÁRIOS
// =============================
async function criarUsuario() {
  const nome = document.getElementById("nome").value;
  const username = document.getElementById("username").value;
  const senha = document.getElementById("senha").value;
  const role = document.getElementById("role").value;
  const nascimento = document.getElementById("nascimento").value;

  if (!nome || !username || !senha || !role || !nascimento) {
    alert("Preencha todos os campos!");
    return;
  }

  await fetch("/api/criar-usuario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, username, senha, role, nascimento })
  });

  document.getElementById("nome").value = "";
  document.getElementById("username").value = "";
  document.getElementById("senha").value = "";
  document.getElementById("role").value = "user";
  document.getElementById("nascimento").value = "";

  carregarUsuarios();
}

async function carregarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const ul = document.getElementById("listaUsuarios");
  if (!ul) return;
  ul.innerHTML = "";
  usuarios.forEach(u => {
    const li = document.createElement("li");
    li.innerText = `${u.nome} (${u.username}) - ${u.role} - ${u.nascimento ? new Date(u.nascimento).toLocaleDateString() : "-"}`;
    ul.appendChild(li);
  });
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
// CALENDÁRIO INTERATIVO
// =============================
let calendar;
let dayDetailsEl;

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
      dayCellDidMount: arg => {
        arg.el.style.cursor = "pointer"; // muda cursor para indicar clicável
      },
      dateClick: info => mostrarDetalhesDia(info.dateStr, dados)
    });
    calendar.render();

    // Cria o container flutuante para detalhes do dia
    dayDetailsEl = document.createElement("div");
    dayDetailsEl.id = "detalhesDia";
    dayDetailsEl.style.position = "absolute";
    dayDetailsEl.style.background = "#1e293b";
    dayDetailsEl.style.padding = "15px";
    dayDetailsEl.style.borderRadius = "10px";
    dayDetailsEl.style.top = "80px"; // distância do topo
    dayDetailsEl.style.left = "50%";
    dayDetailsEl.style.transform = "translateX(-50%)";
    dayDetailsEl.style.display = "none";
    dayDetailsEl.style.maxWidth = "400px";
    dayDetailsEl.style.boxShadow = "0 0 15px rgba(0,0,0,0.5)";
    dayDetailsEl.style.zIndex = "1000"; // garante que fique acima do calendário
    document.body.appendChild(dayDetailsEl);
  } else {
    calendar.removeAllEvents();
    calendar.addEventSource(eventos);
  }
}

// Função que abre/fecha os detalhes do dia
function mostrarDetalhesDia(data, dados) {
  const detalhes = dados.filter(s => s.data === data);

  // Se não houver eventos ou se clicar novamente na mesma data, fecha
  if (detalhes.length === 0 || dayDetailsEl.dataset.aberto === data) {
    dayDetailsEl.style.display = "none";
    dayDetailsEl.dataset.aberto = "";
    return;
  }

  dayDetailsEl.dataset.aberto = data;

  // Conteúdo minimalista do popup
  dayDetailsEl.innerHTML = `<h3>${detalhes.length} Solicitação(s) - ${data}</h3>` +
    detalhes.map(s => `
      <div style="padding:5px 0; border-bottom:1px solid #0f172a;">
        <strong>${s.nome}</strong> - ${s.tipo} (${s.status})
      </div>
    `).join('');

  dayDetailsEl.style.display = "block";
}
// =============================
// ANIVERSARIANTES
// =============================
async function carregarAniversariantes() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const ul = document.getElementById("listaAniversariantes");
  if (!ul) return;
  ul.innerHTML = "";
  const mesAtual = new Date().getMonth() + 1;
  usuarios.filter(u => {
    if (!u.nascimento) return false;
    const mes = new Date(u.nascimento).getMonth() + 1;
    return mes === mesAtual;
  }).forEach(u => {
    const li = document.createElement("li");
    li.innerText = `${u.nome} - ${new Date(u.nascimento).toLocaleDateString()}`;
    ul.appendChild(li);
  });
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
