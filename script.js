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
      carregarAniversariantes();

      setInterval(() => {
        if (usuarioLogado) {
          carregarSolicitacoes();
          carregarCalendario();
          carregarAniversariantes();
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
// ANIVERSARIANTES DO MÊS
// =============================
async function carregarAniversariantes() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();

  const mesAtual = new Date().getMonth() + 1; // 1-12
  const lista = document.getElementById("listaAniversariantes");
  if (!lista) return;

  lista.innerHTML = "";

  usuarios.forEach(u => {
    const userMes = parseInt(u.data_nascimento.split("-")[1]);
    if (userMes === mesAtual) {
      const li = document.createElement("li");
      li.innerText = `${u.nome} - ${u.data_nascimento.split("-")[2]}/${userMes}`;
      lista.appendChild(li);
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
// CALENDÁRIO INTERATIVO COM POPUP MODERNO
// =============================
async function carregarCalendario() {
  const res = await fetch("/api/solicitacoes");
  const dados = await res.json();

  const eventos = dados.map(s => ({
    title: `${s.nome} - ${s.tipo}`,
    date: s.data,
    extendedProps: {
      status: s.status,
      motivo: s.motivo,
      usuario: s.nome
    },
    color: corTipo(s.tipo)
  }));

  const el = document.getElementById("calendar");
  if (!el) return;

  // Cria popup moderno se não existir
  if (!dayDetailsEl) {
    dayDetailsEl = document.createElement("div");
    dayDetailsEl.id = "detalhesDia";
    Object.assign(dayDetailsEl.style, {
      position: "absolute",
      background: "#1e293b",
      padding: "20px",
      borderRadius: "12px",
      display: "none",
      maxWidth: "350px",
      maxHeight: "400px",
      overflowY: "auto",
      boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
      zIndex: 1000,
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
      transition: "opacity 0.2s ease"
    });
    document.body.appendChild(dayDetailsEl);
  }

  if (!calendar) {
    calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'pt-br',
      events: eventos,
      dayCellDidMount: function(arg) {
        arg.el.style.cursor = "pointer";
      },
      dateClick: function(info) {
        mostrarDetalhesDia(info.dateStr, dados, info.jsEvent);
      }
    });
    calendar.render();
  } else {
    calendar.removeAllEvents();
    calendar.addEventSource(eventos);
  }
}

// =============================
// MOSTRAR DETALHES DO DIA - CARD MODERNO
// =============================
function mostrarDetalhesDia(data, dados, eventoClick) {
  const detalhes = dados.filter(s => s.data === data);

  if (detalhes.length === 0) {
    dayDetailsEl.style.display = "none";
    return;
  }

  // Toggle: fecha se já está aberto no mesmo dia
  if (dayDetailsEl.dataset.aberto === data) {
    dayDetailsEl.style.display = "none";
    dayDetailsEl.dataset.aberto = "";
    return;
  }

  dayDetailsEl.dataset.aberto = data;

  // Conteúdo do card moderno
  dayDetailsEl.innerHTML = `
    <h3 style="margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #0f172a; padding-bottom: 5px;">
      ${detalhes.length} Solicitação(s) - ${data}
    </h3>
    ${detalhes.map(s => `
      <div style="padding:8px 0; border-bottom:1px solid #0f172a;">
        <strong>${s.nome}</strong><br>
        Tipo: <span style="color:${corTipo(s.tipo)};">${s.tipo}</span> | Status: ${s.status}<br>
        Motivo: ${s.motivo || "-"}
      </div>
    `).join('')}
  `;

  // Posicionar popup próximo ao clique
  const padding = 10;
  let top = eventoClick.pageY + padding;
  let left = eventoClick.pageX + padding;

  // Evita que ultrapasse a tela
  if (top + dayDetailsEl.offsetHeight > window.innerHeight + window.scrollY) {
    top = window.innerHeight + window.scrollY - dayDetailsEl.offsetHeight - padding;
  }
  if (left + dayDetailsEl.offsetWidth > window.innerWidth + window.scrollX) {
    left = window.innerWidth + window.scrollX - dayDetailsEl.offsetWidth - padding;
  }

  dayDetailsEl.style.top = `${top}px`;
  dayDetailsEl.style.left = `${left}px`;
  dayDetailsEl.style.display = "block";
}

// =============================
// MOSTRAR DETALHES DO DIA
// =============================
function mostrarDetalhesDia(data, dados, eventoClick) {
  const detalhes = dados.filter(s => s.data === data);

  if (detalhes.length === 0) {
    dayDetailsEl.style.display = "none";
    return;
  }

  // Toggle: fecha se já está aberto no mesmo dia
  if (dayDetailsEl.dataset.aberto === data) {
    dayDetailsEl.style.display = "none";
    dayDetailsEl.dataset.aberto = "";
    return;
  }

  dayDetailsEl.dataset.aberto = data;

  // Conteúdo minimalista
  dayDetailsEl.innerHTML = `<h3>${detalhes.length} Solicitação(s) - ${data}</h3>` +
    detalhes.map(s => `
      <div style="padding:5px 0; border-bottom:1px solid #0f172a;">
        <strong>${s.nome}</strong> - ${s.tipo} (${s.status})
      </div>
    `).join('');

  // Posicionar o popup próximo ao clique
  dayDetailsEl.style.top = eventoClick.pageY + 10 + "px";
  dayDetailsEl.style.left = eventoClick.pageX + 10 + "px";
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
