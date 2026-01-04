// COLE SUA CONFIGURAÇÃO DO FIREBASE AQUI:

const firebaseConfig = {
  apiKey: "AIzaSyDURF1Z7S-O0y1mfc0Sf8sjY9KGLJwkYHY",
  authDomain: "projeto-integradora-ii.firebaseapp.com",
  databaseURL: "https://projeto-integradora-ii-default-rtdb.firebaseio.com",
  projectId: "projeto-integradora-ii",
  storageBucket: "projeto-integradora-ii.firebasestorage.app",
  messagingSenderId: "80939508930",
  appId: "1:80939508930:web:9a2d2f9bf97be9eb98075b"
};

// ========== NÃO MEXER DAQUI PARA BAIXO ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Elementos da página
const freqElement = document.getElementById('freq');
const oxiElement = document.getElementById('oxi');
const tempElement = document.getElementById('temp');
const tabelaCorpo = document.getElementById('tabelaCorpo');
const btnAtualizar = document.getElementById('btnAtualizar');
const selectSensor = document.getElementById('selectSensor');

// Variáveis
let pacienteId = null;
let dadosPaciente = null;

// Função principal que carrega tudo
function carregarTudo() {
  const rootRef = ref(database);
  
  onValue(rootRef, (snapshot) => {
    const dados = snapshot.val();
    console.log("📦 Dados brutos do Firebase:", dados);
    
    // Encontra o primeiro paciente na estrutura
    if (dados) {
      for (const key in dados) {
        if (dados[key] && dados[key].sensores_atuais) {
          pacienteId = key;
          dadosPaciente = dados[key];
          console.log("✅ Paciente encontrado:", pacienteId);
          console.log("📊 Dados do paciente:", dadosPaciente);
          break;
        }
      }
    }
    
    if (pacienteId && dadosPaciente) {
      atualizarTempoReal();
      atualizarHistorico();
    } else {
      console.error("❌ Nenhum paciente encontrado no banco!");
      tabelaCorpo.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px; color: #ef4444;">
            ❌ Nenhum paciente encontrado no banco de dados
          </td>
        </tr>
      `;
    }
  });
}

// Atualiza os dados em tempo real
function atualizarTempoReal() {
  const atual = dadosPaciente.sensores_atuais;
  
  if (atual.freq_cardiaca !== undefined) {
    freqElement.textContent = `${atual.freq_cardiaca} bpm`;
    freqElement.style.color = atual.freq_cardiaca > 100 || atual.freq_cardiaca < 60 ? '#ef4444' : '#38bdf8';
  }
  
  if (atual.oximetria !== undefined) {
    oxiElement.textContent = `${atual.oximetria} %`;
    oxiElement.style.color = atual.oximetria < 95 ? '#ef4444' : '#38bdf8';
  }
  
  if (atual.temperatura !== undefined) {
    tempElement.textContent = `${atual.temperatura} °C`;
    tempElement.style.color = atual.temperatura > 37.5 ? '#ef4444' : '#38bdf8';
  }
}

// Atualiza o histórico
function atualizarHistorico() {
  const historico = dadosPaciente.sensores_historico;
  const sensorSelecionado = selectSensor.value;
  
  if (!historico) {
    tabelaCorpo.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          📭 Nenhum histórico disponível
        </td>
      </tr>
    `;
    return;
  }
  
  let todosDados = [];
  
  // Processa frequência cardíaca
  if (historico.freq_cardiaca && (sensorSelecionado === 'todos' || sensorSelecionado === 'freq_cardiaca')) {
    Object.entries(historico.freq_cardiaca).forEach(([timestamp, valor]) => {
      todosDados.push({
        timestamp,
        dataFormatada: formatarData(timestamp),
        freq_cardiaca: valor + ' bpm',
        oximetria: '--',
        temperatura: '--'
      });
    });
  }
  
  // Processa oximetria
  if (historico.oximetria && (sensorSelecionado === 'todos' || sensorSelecionado === 'oximetria')) {
    Object.entries(historico.oximetria).forEach(([timestamp, valor]) => {
      todosDados.push({
        timestamp,
        dataFormatada: formatarData(timestamp),
        freq_cardiaca: '--',
        oximetria: valor + ' %',
        temperatura: '--'
      });
    });
  }
  
  // Processa temperatura
  if (historico.temperatura && (sensorSelecionado === 'todos' || sensorSelecionado === 'temperatura')) {
    Object.entries(historico.temperatura).forEach(([timestamp, valor]) => {
      todosDados.push({
        timestamp,
        dataFormatada: formatarData(timestamp),
        freq_cardiaca: '--',
        oximetria: '--',
        temperatura: valor + ' °C'
      });
    });
  }
  
  // Ordena por timestamp (mais recente primeiro)
  todosDados.sort((a, b) => {
    if (a.timestamp.includes('-') && b.timestamp.includes('-')) {
      return b.timestamp.localeCompare(a.timestamp);
    }
    return b.timestamp.localeCompare(a.timestamp);
  });
  
  // Limita a 100 registros
  const dadosExibidos = todosDados.slice(0, 100);
  
  // Atualiza a tabela
  tabelaCorpo.innerHTML = '';
  
  if (dadosExibidos.length === 0) {
    tabelaCorpo.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          📭 Nenhum dado para o filtro selecionado
        </td>
      </tr>
    `;
    return;
  }
  
  dadosExibidos.forEach(registro => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="data-hora">${registro.dataFormatada}</td>
      <td>${registro.freq_cardiaca}</td>
      <td>${registro.oximetria}</td>
      <td>${registro.temperatura}</td>
    `;
    tabelaCorpo.appendChild(tr);
  });
}

// Formata a data
function formatarData(timestamp) {
  // Se for formato "1969-12-31_21-00-03"
  if (timestamp.includes('-') && timestamp.includes('_')) {
    const [dataParte, horaParte] = timestamp.split('_');
    const [ano, mes, dia] = dataParte.split('-');
    const [hora, minuto, segundo] = horaParte.split('-');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  }
  
  // Se for um ID do Firebase (ex: "-OhjiuV7YZ3hKGrbTh1y")
  return `Registro: ${timestamp.substring(0, 10)}...`;
}

// Event Listeners
btnAtualizar.addEventListener('click', () => {
  console.log("🔄 Atualizando dados...");
  carregarTudo();
});

selectSensor.addEventListener('change', () => {
  if (pacienteId && dadosPaciente) {
    atualizarHistorico();
  }
});

// Carrega tudo quando a página abre
console.log("🚀 Iniciando aplicação...");
carregarTudo();

// Atualiza a cada 10 segundos
setInterval(() => {
  if (pacienteId) {
    const rootRef = ref(database, pacienteId);
    onValue(rootRef, (snapshot) => {
      dadosPaciente = snapshot.val();
      if (dadosPaciente) {
        atualizarTempoReal();
      }
    });
  }
}, 10000);