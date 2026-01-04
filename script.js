// Importa o Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDURF1Z7S-O0y1mfc0Sf8sjY9KGLJwkYHY",
  authDomain: "projeto-integradora-ii.firebaseapp.com",
  databaseURL: "https://projeto-integradora-ii-default-rtdb.firebaseio.com",
  projectId: "projeto-integradora-ii",
  storageBucket: "projeto-integradora-ii.firebasestorage.app",
  messagingSenderId: "80939508930",
  appId: "1:80939508930:web:9a2d2f9bf97be9eb98075b"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elementos da página
const freqElement = document.getElementById('freq');
const oxiElement = document.getElementById('oxi');
const tempElement = document.getElementById('temp');
const tabelaCorpo = document.getElementById('tabelaCorpo');
const btnAtualizar = document.getElementById('btnAtualizar');
const selectSensor = document.getElementById('selectSensor');

// Variáveis
let pacienteNome = null;
let dadosHistorico = null;

// 1. DESCOBRE O PACIENTE E CARREGA TUDO
function iniciarMonitoramento() {
  const rootRef = ref(db);
  
  onValue(rootRef, (snapshot) => {
    const dadosCompletos = snapshot.val();
    console.log("📦 Dados do Firebase:", dadosCompletos);
    
    if (dadosCompletos) {
      // Pega o nome do primeiro paciente
      const chaves = Object.keys(dadosCompletos);
      pacienteNome = chaves[0];
      console.log("✅ Paciente:", pacienteNome);
      
      // Carrega dados em tempo real
      carregarTempoReal();
      
      // Carrega histórico
      carregarHistorico();
      
      // Atualiza títulos
      document.querySelector('.card h1').textContent = `📍 ${pacienteNome} - Tempo Real`;
      document.querySelector('.historico-container h1').textContent = `📊 ${pacienteNome} - Histórico`;
    }
  });
}

// 2. CARREGA DADOS EM TEMPO REAL
function carregarTempoReal() {
  if (!pacienteNome) return;
  
  const sensoresRef = ref(db, `${pacienteNome}/sensores_atuais`);
  
  onValue(sensoresRef, (snapshot) => {
    const dados = snapshot.val();
    console.log("🔄 Dados tempo real:", dados);
    
    if (dados) {
      // Frequência cardíaca
      if (dados.freq_cardiaca !== undefined) {
        freqElement.textContent = `${dados.freq_cardiaca} bpm`;
        freqElement.style.color = dados.freq_cardiaca > 100 || dados.freq_cardiaca < 60 ? '#ef4444' : '#38bdf8';
      }
      
      // Oximetria
      if (dados.oximetria !== undefined) {
        oxiElement.textContent = `${dados.oximetria} %`;
        oxiElement.style.color = dados.oximetria < 95 ? '#ef4444' : '#38bdf8';
      }
      
      // Temperatura
      if (dados.temperatura !== undefined) {
        tempElement.textContent = `${dados.temperatura} °C`;
        tempElement.style.color = dados.temperatura > 37.5 ? '#ef4444' : '#38bdf8';
      }
    }
  });
}

// 3. CARREGA HISTÓRICO
function carregarHistorico() {
  if (!pacienteNome) {
    tabelaCorpo.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          ❌ Nenhum paciente encontrado
        </td>
      </tr>
    `;
    return;
  }
  
  const historicoRef = ref(db, `${pacienteNome}/sensores_historico`);
  
  onValue(historicoRef, (snapshot) => {
    dadosHistorico = snapshot.val();
    console.log("📚 Dados históricos:", dadosHistorico);
    
    atualizarTabelaHistorico();
  });
}

// 4. ATUALIZA A TABELA COM FILTROS
function atualizarTabelaHistorico() {
  if (!dadosHistorico) {
    tabelaCorpo.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          📭 Nenhum histórico disponível
        </td>
      </tr>
    `;
    return;
  }
  
  const sensorSelecionado = selectSensor.value;
  let todosRegistros = [];
  
  // FUNÇÃO PARA ADICIONAR REGISTRO
  const addRegistro = (timestamp, tipo, valor) => {
    todosRegistros.push({
      timestamp: timestamp,
      tipo: tipo,
      valor: valor,
      dataFormatada: formatarTimestamp(timestamp)
    });
  };
  
  // Processa cada sensor
  if (dadosHistorico.freq_cardiaca && (sensorSelecionado === 'todos' || sensorSelecionado === 'freq_cardiaca')) {
    Object.entries(dadosHistorico.freq_cardiaca).forEach(([timestamp, valor]) => {
      addRegistro(timestamp, 'freq_cardiaca', valor);
    });
  }
  
  if (dadosHistorico.oximetria && (sensorSelecionado === 'todos' || sensorSelecionado === 'oximetria')) {
    Object.entries(dadosHistorico.oximetria).forEach(([timestamp, valor]) => {
      addRegistro(timestamp, 'oximetria', valor);
    });
  }
  
  if (dadosHistorico.temperatura && (sensorSelecionado === 'todos' || sensorSelecionado === 'temperatura')) {
    Object.entries(dadosHistorico.temperatura).forEach(([timestamp, valor]) => {
      addRegistro(timestamp, 'temperatura', valor);
    });
  }
  
  // Ordena por timestamp (mais recente primeiro)
  todosRegistros.sort((a, b) => {
    // Para formato "1969-12-31_21-00-03"
    if (a.timestamp.includes('-') && b.timestamp.includes('-')) {
      return b.timestamp.localeCompare(a.timestamp);
    }
    // Para timestamps/IDs
    return b.timestamp.localeCompare(a.timestamp);
  });
  
  // Atualiza tabela
  tabelaCorpo.innerHTML = '';
  
  if (todosRegistros.length === 0) {
    tabelaCorpo.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          📭 Nenhum dado para o filtro selecionado
        </td>
      </tr>
    `;
    return;
  }
  
  // Limita a 50 registros para performance
  const registrosExibir = todosRegistros.slice(0, 50);
  
  registrosExibir.forEach(registro => {
    const tr = document.createElement('tr');
    
    // Preenche os dados de acordo com o tipo
    let freq = '--';
    let oxi = '--';
    let temp = '--';
    
    if (registro.tipo === 'freq_cardiaca') {
      freq = `${registro.valor} bpm`;
    } else if (registro.tipo === 'oximetria') {
      oxi = `${registro.valor} %`;
    } else if (registro.tipo === 'temperatura') {
      temp = `${registro.valor} °C`;
    }
    
    tr.innerHTML = `
      <td class="data-hora">${registro.dataFormatada}</td>
      <td>${freq}</td>
      <td>${oxi}</td>
      <td>${temp}</td>
    `;
    
    tabelaCorpo.appendChild(tr);
  });
}

// 5. FORMATA TIMESTAMP
function formatarTimestamp(timestamp) {
  // Se for formato "1969-12-31_21-00-03"
  if (timestamp.includes('-') && timestamp.includes('_')) {
    const [dataParte, horaParte] = timestamp.split('_');
    const [ano, mes, dia] = dataParte.split('-');
    const [hora, minuto, segundo] = horaParte.split('-');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  }
  
  // Se for um ID do Firebase (ex: "-OhjiuV7YZ3hKGrbTh1y")
  return `Registro ${timestamp.substring(0, 8)}...`;
}

// 6. EVENT LISTENERS
btnAtualizar.addEventListener('click', () => {
  console.log("🔄 Atualizando dados...");
  if (pacienteNome) {
    carregarHistorico();
  }
});

selectSensor.addEventListener('change', () => {
  if (dadosHistorico) {
    atualizarTabelaHistorico();
  }
});

// 7. INICIA TUDO
console.log("🚀 Iniciando monitoramento...");
iniciarMonitoramento();

// Atualiza automático a cada 30 segundos
setInterval(() => {
  if (pacienteNome) {
    console.log("⏰ Atualização automática...");
    carregarTempoReal();
  }
}, 30000);