// Importa o Firebase (SDK Web)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔴 COLE AQUI O firebaseConfig DO SEU PROJETO
const firebaseConfig = {
  apiKey: "AIzaSyDURF1Z7S-O0y1mfc0Sf8sjY9KGLJwkYHY",
  authDomain: "projeto-integradora-ii.firebaseapp.com",
  databaseURL: "https://projeto-integradora-ii-default-rtdb.firebaseio.com",
  projectId: "projeto-integradora-ii",
  storageBucket: "projeto-integradora-ii.firebasestorage.app",
  messagingSenderId: "80939508930",
  appId: "1:80939508930:web:9a2d2f9bf97be9eb98075b"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Conecta ao Realtime Database
const db = getDatabase(app);

// Referência para o caminho do banco
const sensoresRef = ref(db, "sensores_atuais");

// Listener em tempo real
onValue(sensoresRef, (snapshot) => {
  const dados = snapshot.val();

  if (dados) {
    document.getElementById("freq").innerText =
      dados.freq_cardiaca + " bpm";

    document.getElementById("oxi").innerText =
      dados.oximetria + " %";

    document.getElementById("temp").innerText =
      dados.temperatura + " °C";
  }
});
