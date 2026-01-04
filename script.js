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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🟡 PRIMEIRO: Vamos descobrir qual é o nome do seu paciente
const rootRef = ref(db);

onValue(rootRef, (snapshot) => {
  const dados = snapshot.val();
  console.log("📦 Dados completos do Firebase:", dados);
  
  if (dados) {
    // Encontra a primeira chave (nome do paciente)
    const pacienteNome = Object.keys(dados)[0];
    console.log("✅ Paciente encontrado:", pacienteNome);
    
    // Agora sim, acessa os sensores dentro do paciente
    const sensoresRef = ref(db, `${pacienteNome}/sensores_atuais`);
    
    onValue(sensoresRef, (snapshotSensores) => {
      const dadosSensores = snapshotSensores.val();
      console.log("📊 Dados dos sensores:", dadosSensores);
      
      if (dadosSensores) {
        document.getElementById("freq").innerText = 
          (dadosSensores.freq_cardiaca || "--") + " bpm";
        
        document.getElementById("oxi").innerText = 
          (dadosSensores.oximetria || "--") + " %";
        
        document.getElementById("temp").innerText = 
          (dadosSensores.temperatura || "--") + " °C";
      } else {
        console.error("❌ Não há dados em sensores_atuais");
      }
    });
  } else {
    console.error("❌ Banco de dados vazio ou sem permissão!");
  }
});