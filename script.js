// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Config Firebase (USA SUA CONFIG REAL!)
const firebaseConfig = {
  apiKey: "AIzaSyB...", // SUA API KEY
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com/",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referências aos elementos
const freqElement = document.getElementById('freq');
const oxiElement = document.getElementById('oxi');
const tempElement = document.getElementById('temp');
const tabelaCorpo = document.getElementById('tabelaCorpo');

// Variáveis
let pacienteId = null;

// 1. Primeiro, vamos detectar qual paciente está no seu banco
function detectarPaciente() {
  const rootRef = ref(database);
  
  onValue(rootRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const data = childSnapshot.val();
      
      // Verifica se tem a estrutura de sensores
      if (data && data.sensores_atuais) {
        pacienteId = key;
        console.log("Paciente encontrado:", pacienteId);
        
        // Monitora dados em tempo real
        monitorarTempoReal();
        
        // Carrega histórico
        carregarHistorico();
        
        // Atualiza título se quiser
        document.querySelector('h1').textContent = `Monitoramento - ${pacienteId}`;
        document.querySelector('.historico-container h1').textContent = `📊 Histórico - ${pacienteId}`;
      }
    });
  });
}

// 2. Monitora dados em tempo real
function monitorarTempoReal() {
  if (!pacienteId) return;
  
  const sensoresRef = ref(database, `${pacienteId}/sensores_atuais`);
  
  onValue(sensoresRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      console.log("Dados em tempo real:", data);
      
      // Frequência cardíaca
      if (data.freq_cardiaca !== undefined) {
        freqElement.textContent = `${data.freq_cardiaca} bpm`;
        freqElement.style.color = data.freq_cardiaca > 100 || data.freq_cardiaca < 60 ? '#ef4444' : '#38bdf8';
      }
      
      // Oximetria
      if (data.oximetria !== undefined) {
        oxiElement.textContent = `${data.oximetria} %`;
        oxiElement.style.color = data.oximetria < 95 ? '#ef4444' : '#38bdf8';
      }
      
      // Temperatura
      if (data.temperatura !== undefined) {
        tempElement.textContent = `${data.temperatura} °C`;
        tempElement.style.color = data.temperatura > 37.5 ? '#ef4444' : '#38bdf8';
      }
    }
  });
}

// 3. Carrega histórico
function carregarHistorico() {
  if (!pacienteId) return;
  
  const historicoRef = ref(database, `${pacienteId}/sensores_historico`);
  
  onValue(historicoRef, (snapshot) => {
    tabelaCorpo.innerHTML = '';
    
    if (!snapshot.exists()) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 40px;">
          Nenhum dado histórico encontrado
        </td>
      `;
      tabelaCorpo.appendChild(tr);
      return;
    }
    
    const dados = [];
    const dataAtual = snapshot.val();
    
    console.log("Dados históricos brutos:", dataAtual);
    
    // Processa histórico da frequência cardíaca
    if (dataAtual.freq_cardiaca) {
      Object.entries(dataAtual.freq_cardiaca).forEach(([timestamp, valor]) => {
        dados.push({
          timestamp: timestamp,
          dataFormatada: formatarTimestamp(timestamp),
          freq_cardiaca: valor,
          oximetria: '--',
          temperatura: '--'
        });
      });
    }
    
    // Processa histórico da oximetria
    if (dataAtual.oximetria) {
      Object.entries(dataAtual.oximetria).forEach(([timestamp, valor]) => {
        dados.push({
          timestamp: timestamp,
          dataFormatada: formatarTimestamp(timestamp),
          freq_cardiaca: '--',
          oximetria: valor,
          temperatura: '--'
        });
      });
    }
    
    // Processa histórico da temperatura
    if (dataAtual.temperatura) {
      Object.entries(dataAtual.temperatura).forEach(([timestamp, valor]) => {
        dados.push({
          timestamp: timestamp,
          dataFormatada: formatarTimestamp(timestamp),
          freq_cardiaca: '--',
          oximetria: '--',
          temperatura: valor
        });
      });
    }
    
    // Ordena por timestamp (mais recente primeiro)
    dados.sort((a, b) => {
      // Se for formato "1969-12-31_21-00-03"
      if (a.timestamp.includes('-') && b.timestamp.includes('-')) {
        return b.timestamp.localeCompare(a.timestamp);
      }
      // Se for timestamp numérico
      return parseInt(b.timestamp) - parseInt(a.timestamp);
    });
    
    // Limita a 50 registros
    const dadosExibidos = dados.slice(0, 50);
    
    // Exibe na tabela
    dadosExibidos.forEach(registro => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td class="data-hora">${registro.dataFormatada}</td>
        <td>${registro.freq_cardiaca !== '--' ? registro.freq_cardiaca + ' bpm' : '--'}</td>
        <td>${registro.oximetria !== '--' ? registro.oximetria + ' %' : '--'}</td>
        <td>${registro.temperatura !== '--' ? registro.temperatura + ' °C' : '--'}</td>
      `;
      
      tabelaCorpo.appendChild(tr);
    });
    
    // Se não tiver dados
    if (dadosExibidos.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 40px;">
          Nenhum dado histórico encontrado
        </td>
      `;
      tabelaCorpo.appendChild(tr);
    }
  });
}

// 4. Função para formatar timestamp
function formatarTimestamp(timestamp) {
  // Se for formato "1969-12-31_21-00-03"
  if (timestamp.includes('-') && timestamp.includes('_')) {
    const [datePart, timePart] = timestamp.split('_');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split('-');
    
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }
  
  // Se for timestamp numérico (como "-OhjiuV7YZ3hKGrbTh1y" - parece ser push ID do Firebase)
  // Para push IDs, vamos usar como string
  return timestamp;
}

// 5. Event Listeners para filtros (versão simplificada)
document.getElementById('btnAtualizar')?.addEventListener('click', () => {
  if (pacienteId) {
    carregarHistorico();
  }
});

document.getElementById('selectSensor')?.addEventListener('change', () => {
  // Implementar filtro por sensor se quiser
  if (pacienteId) {
    carregarHistorico();
  }
});

// 6. Inicialização
detectarPaciente();

// 7. Função para debug - mostra toda a estrutura do banco
function debugDatabase() {
  const rootRef = ref(database);
  
  onValue(rootRef, (snapshot) => {
    console.log("ESTRUTURA COMPLETA DO BANCO:");
    console.log(JSON.stringify(snapshot.val(), null, 2));
  });
}

// Descomente a linha abaixo para ver a estrutura completa
 debugDatabase();