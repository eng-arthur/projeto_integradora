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

// 3. CARREGA HISTÓRICO (VERSÃO CORRIGIDA PARA SUA ESTRUTURA)
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
    console.log("📚 HISTÓRICO BRUTO:", dadosHistorico);
    
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
    
    // Processa o histórico
    processarHistorico();
  });
}

// 4. PROCESSADOR DE HISTÓRICO - ESPECÍFICO PARA SUA ESTRUTURA
function processarHistorico() {
  const sensorSelecionado = selectSensor.value;
  let todosRegistros = [];
  
  // ========== FREQUÊNCIA CARDÍACA ==========
  if (dadosHistorico.freq_cardiaca && (sensorSelecionado === 'todos' || sensorSelecionado === 'freq_cardiaca')) {
    // Para cada data (ex: "1969-12-31_21-00-03")
    Object.entries(dadosHistorico.freq_cardiaca).forEach(([data, registrosDaData]) => {
      // Para cada registro dentro da data
      Object.entries(registrosDaData).forEach(([id, valor]) => {
        todosRegistros.push({
          data: data,
          id: id,
          tipo: 'freq_cardiaca',
          valor: valor,
          hora: extrairHoraDoId(id) // Tenta extrair hora do ID
        });
      });
    });
  }
  
  // ========== OXIMETRIA ==========
  if (dadosHistorico.oximetria && (sensorSelecionado === 'todos' || sensorSelecionado === 'oximetria')) {
    Object.entries(dadosHistorico.oximetria).forEach(([data, registrosDaData]) => {
      Object.entries(registrosDaData).forEach(([id, valor]) => {
        todosRegistros.push({
          data: data,
          id: id,
          tipo: 'oximetria',
          valor: valor,
          hora: extrairHoraDoId(id)
        });
      });
    });
  }
  
  // ========== TEMPERATURA ==========
  if (dadosHistorico.temperatura && (sensorSelecionado === 'todos' || sensorSelecionado === 'temperatura')) {
    Object.entries(dadosHistorico.temperatura).forEach(([data, registrosDaData]) => {
      Object.entries(registrosDaData).forEach(([id, valor]) => {
        todosRegistros.push({
          data: data,
          id: id,
          tipo: 'temperatura',
          valor: valor,
          hora: extrairHoraDoId(id)
        });
      });
    });
  }
  
  console.log(`📊 Total de registros encontrados: ${todosRegistros.length}`);
  
  // Ordena: primeiro por data, depois por hora estimada
  todosRegistros.sort((a, b) => {
    // Ordena por data (mais recente primeiro)
    const dataCompare = b.data.localeCompare(a.data);
    if (dataCompare !== 0) return dataCompare;
    
    // Se mesma data, ordena por hora estimada
    return (b.hora || '').localeCompare(a.hora || '');
  });
  
  // Atualiza tabela
  atualizarTabela(todosRegistros);
}

// 5. ATUALIZA TABELA COM OS REGISTROS PROCESSADOS
function atualizarTabela(registros) {
  tabelaCorpo.innerHTML = '';
  
  if (registros.length === 0) {
    tabelaCorpo.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          📭 Nenhum dado para o filtro selecionado
        </td>
      </tr>
    `;
    return;
  }
  
  // Limita a 100 registros
  const registrosExibir = registros.slice(0, 100);
  
  registrosExibir.forEach(registro => {
    const tr = document.createElement('tr');
    
    // Formata data: "1969-12-31_21-00-03" → "31/12/1969 21:00:03"
    const dataFormatada = formatarDataString(registro.data);
    
    // Formata hora se disponível
    const horaFormatada = registro.hora ? ` ${registro.hora}` : '';
    
    // Preenche os valores
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
      <td class="data-hora">${dataFormatada}${horaFormatada}</td>
      <td>${freq}</td>
      <td>${oxi}</td>
      <td>${temp}</td>
    `;
    
    tabelaCorpo.appendChild(tr);
  });
  
  console.log(`✅ ${registrosExibir.length} registros exibidos na tabela`);
}

// 6. FUNÇÕES AUXILIARES
function formatarDataString(dataString) {
  // "1969-12-31_21-00-03" → "31/12/1969 21:00:03"
  if (dataString.includes('_')) {
    const [dataPart, horaPart] = dataString.split('_');
    const [ano, mes, dia] = dataPart.split('-');
    const [hora, minuto, segundo] = horaPart.split('-');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  }
  return dataString;
}

function extrairHoraDoId(id) {
  // Tenta extrair algo útil do ID do Firebase
  // IDs como "-OhjiuV7YZ3hKGrbIh1y" não têm hora, mas podemos mostrar parte do ID
  if (id && id.length > 8) {
    return `ID: ${id.substring(1, 8)}...`;
  }
  return '';
}

// 7. EVENT LISTENERS
btnAtualizar.addEventListener('click', () => {
  console.log("🔄 Atualizando histórico...");
  if (dadosHistorico) {
    processarHistorico();
  }
});

selectSensor.addEventListener('change', () => {
  if (dadosHistorico) {
    processarHistorico();
  }
});

// 8. INICIA TUDO
console.log("🚀 Iniciando monitoramento...");
iniciarMonitoramento();

// Atualiza automático a cada 30 segundos
setInterval(() => {
  if (pacienteNome) {
    console.log("⏰ Atualização automática...");
    carregarTempoReal();
    carregarHistorico();
  }
}, 30000);