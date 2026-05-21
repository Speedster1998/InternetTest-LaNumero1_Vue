<script setup>
import { ref, createApp } from 'vue';
import Login from './pages/Login/Login.vue';
import Header from './components/Header/Header.vue';
import InternetTest from './pages/InternetTest/InternetTest.vue';
import HeatMap from './pages/HeatMap/HeatMap.vue';
import Settings from './pages/Settings/Settings.vue';
import MiniDashboard from './components/MiniDashboard/MiniDashboard.vue';
import techImg from '/src/Images/abstract_tech.jpg';

const isRegistered = ref(!!localStorage.getItem('userName'));
const tabActual = ref('test');
const showModal = ref(false);

// Recepción de datos del test de Internet
const testData = ref({
  speed: null,
  ping: null,
  statusLabel: 'Sin datos',
  statusClass: ''
});

const onLoginSuccess = () => {
  isRegistered.value = true;
  tabActual.value = 'test';
};

const confirmLogout = () => {
  localStorage.clear();
  isRegistered.value = false;
  showModal.value = false;
  if (miniWindowRef) miniWindowRef.close();
};

const handleTestComplete = (data) => {
  testData.value = data;
  if (miniWindowInstance) {
    // Sincronizamos las propiedades de la instancia de Vue en la subventana
    Object.assign(miniWindowInstance._instance.props, {
      speed: data.speed,
      ping: data.ping,
      statusLabel: data.statusLabel,
      statusClass: data.statusClass
    });
  }
};

/* --- VENTANA RESUMEN --- */
let miniWindowRef = null;
let miniWindowInstance = null;

const openMiniDashboard = () => {
  const width = 490;
  const height = 170;
  
  if (miniWindowRef && !miniWindowRef.closed) {
    miniWindowRef.focus();
    return;
  }

  miniWindowRef = window.open(
    "",
    "MiniDashboard",
    `width=${width},height=${height},menubar=no,toolbar=no,location=no`
  );
  
  if (!miniWindowRef) {
    console.error("El navegador bloqueó la ventana emergente.");
    return;
  }

  const subDocument = miniWindowRef.document;
  subDocument.open();
  subDocument.write(`
    <html>
      <head>
        <title>Estado de Red | La Número 1</title>
        <style>
          body { 
            font-family: 'Segoe UI', sans-serif;
            background-image: url("${techImg}");
            background-attachment: fixed;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            padding: 5px; 
            color: #333;
            overflow: hidden;
          }
          .card {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 6px solid #0056b3;
            position: relative;
          }
          .logo-header {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 80px;
          }

          /* Disposición Horizontal */
          .dashboard-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
          }

          /* Lado Izquierdo: Velocidad */
          .speed-section {
            flex: 1;
            text-align: center;
            border-right: 1px solid #eee;
          }
          .value {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 10px 0;
            line-height: 1;
          }

          /* Lado Derecho: Ping y Estado */
          .info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
          .label { color: #666; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; }
          .ping { color: #0056b3; font-weight: bold; }
          .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            transition: all 0.3s ease;
            white-space: nowrap;
          }
          .footer {
            margin-top: 10px;
            font-size: 0.7rem;
            color: #777;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div id="mini-app-root"></div>
      </body>
    </html>
  `);
  subDocument.close();

  setTimeout(() => {
    try {
      const containerDiv = subDocument.getElementById('mini-app-root');
      
      if (!containerDiv) {
        console.error("No se encontró el contenedor raíz en la subventana.");
        return;
      }

      // Si por algún motivo quedó una instancia previa colgada, la limpiamos
      if (miniWindowInstance) {
        miniWindowInstance.unmount();
      }

      // 3. Creamos e inyectamos la mini app de Vue de forma limpia
      miniWindowInstance = createApp(MiniDashboard, {
        speed: testData.value.speed,
        ping: testData.value.ping,
        statusLabel: testData.value.statusLabel,
        statusClass: testData.value.statusClass,
        techImg: techImg
      });

      miniWindowInstance.mount(containerDiv);
      console.log("MiniDashboard montado con éxito en la subventana.");
    } catch (error) {
      console.error("Error crítico al montar Vue en la subventana:", error);
    }
  }, 50); // Medido en ms
};
</script>

<template>
  <Login v-if="!isRegistered" @login-success="onLoginSuccess" />

  <template v-else>
    <Header 
      v-model:tabActual="tabActual"
      :isRegistered="isRegistered"
      :speed="testData.speed"
      :ping="testData.ping"
      :status="{ label: testData.statusLabel, class: testData.statusClass }"
      @openMiniDashboard="openMiniDashboard"
      @triggerLogout="showModal = true"
    />
    
    <InternetTest v-if="tabActual === 'test'" @test-complete="handleTestComplete" />
    
    <div v-else-if="tabActual === 'mapa'" class="container" :class="{ 'dashboard-mode': isRegistered }">
      <div class="dashboard-view">
        <HeatMap />
      </div>
    </div>
    
    <div v-else-if="tabActual === 'config'" class="container" :class="{ 'dashboard-mode': isRegistered }">
      <div class="dashboard-view">
        <Settings />
      </div>
    </div>
  </template>

  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>¿Cerrar Sesión?</h2>
        <p>Se borrarán los datos de esta sesión y volverás al registro.</p>
        <div class="modal-buttons">
          <button @click="confirmLogout" class="btn-confirm">Sí, salir</button>
          <button @click="showModal = false" class="btn-cancel">Regresar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>