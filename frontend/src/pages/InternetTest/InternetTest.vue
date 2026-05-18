<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import Settings from '../Settings/Settings.vue';
import HeatMap from '../HeatMap/HeatMap.vue';
import Header from '../../components/Header/Header.vue';
import '../InternetTest/InternetTest.css';
import techImg from '/src/Images/abstract_tech.jpg';
import { useRegisterSW } from 'virtual:pwa-register/vue'
useRegisterSW()

const emit = defineEmits(['logout']);

// --- ESTADOS (Equivalente a useState) ---
const userName = ref(localStorage.getItem('userName') || '');
const baseNumber = ref(localStorage.getItem('baseNumber') || '');
const isOpen = ref(false);
const isRegistered = ref(!!localStorage.getItem('userName'));
const showModal = ref(false);
const ping = ref(null);
const speed = ref(null);
const loading = ref(false);
const loadingText = ref("");
const tabActual = ref('test');
const isOpenMenu = ref(false);
const menuRef = ref(null);

// --- LÓGICA DE NEGOCIO ---
const getStatus = (val) => {
  if (!val) return { label: "", class: "" };
  if (val < 20) return { label: "Baja", class: "status-low" };
  if (val >= 20 && val < 50) return { label: "Moderada", class: "status-mod" };
  if (val >= 50 && val < 100) return { label: "Óptima", class: "status-opt" };
  if (val >= 100) return { label: "Excelente", class: "status-exc" };
  return { label: "", class: "" };
};

const status = computed(() => getStatus(speed.value));

const closeOnClickOutside = (event) => {
  // Verificamos si el menú está abierto y si el click NO fue en el <ul> (menuRef)
  if (isOpenMenu.value && menuRef.value && !menuRef.value.contains(event.target)) {
    // El truco del 'closest': Si el click NO fue en el botón de la parrilla, cerramos.
    // Esto evita que el menú se cierre y abra al mismo tiempo al darle al botón.
    if (!event.target.closest('.menu-grid-btn')) {
       isOpenMenu.value = false;
    }
  }
};

let autoTestTimer = null;

const setupAutoTest = () => {
  if (autoTestTimer) clearInterval(autoTestTimer);
  
  const mode = localStorage.getItem('testMode') || 'both';
  const intervalMinutes = parseInt(localStorage.getItem('testInterval') || '60');

  if (mode === 'both') {
    console.log(`Cronómetro actualizado: Ejecución cada ${intervalMinutes} min.`);

    autoTestTimer = setInterval(() => {
      // Solo dispara el test automático si el sistema NO está ocupado
      if (!loading.value) { 
        startTest();
      } else {
        console.log("Test automático saltado: ya hay una medición en curso.");
      }
    }, intervalMinutes * 60 * 1000);
  } else {
    console.log("Modo automático desactivado.");
  }
};

const measurePing = async () => {
  const start = performance.now();
  try {
    await fetch("https://www.google.com/favicon.ico?cache-bust=" + start, { 
      method: 'HEAD', mode: 'no-cors', cache: 'no-cache' 
    });
    const end = performance.now();
    const resultPing = Math.round(end - start);
    ping.value = resultPing;
    return resultPing;
  } catch (e) {
    return 0;
  }
};

const enviarReporte = async (mbps, nivel, msPing) => {
  const urlScript = "https://script.google.com/macros/s/AKfycbx7B3S7YniC23kE1XadOO8_L00jHs4UBu31iKYxeiRm3nk4SuROwV0yUcarsddvj6cZIQ/exec";
  try {
    const response = await fetch(urlScript, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, 
      body: JSON.stringify({
        usuario: userName.value,
        base: baseNumber.value,
        velocidad: mbps,
        nivel: nivel,
        ping: msPing,
        fecha: new Date().toLocaleString()
      })
    });
    console.log("Reporte automático enviado con éxito");
  } catch (error) {
    console.error("Error al enviar el reporte:", error);
  }
};

const enviarResultados = async (velocidad, latencia, nivel) => {
    const datos = {
        usuario: userName.value,
        base: baseNumber.value,
        velocidad: velocidad,
        ping: latencia,
        nivelConexion: nivel
    };

    const response = await fetch('http://localhost:3000/registrar-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    
    const result = await response.json();
};

const startTest = async () => {
  if (loading.value) return;
  loading.value = true;
  speed.value = null;

  try {
    // --- PASO 1: CALENTAMIENTO (TEST INVISIBLE) ---
    // Hacemos un ping y una descarga rápida para "despertar" la conexión
    loadingText.value = "Estabilizando conexión..."; 
    await new Promise(resolve => setTimeout(resolve, 50));
    await measurePing(); 
    await runSingleSpeedTest(); 

    // Pequeña pausa de 500ms para evitar colisiones de paquetes
    await new Promise(resolve => setTimeout(resolve, 500));

    // --- PASO 2: TEST REAL (EL QUE SE MUESTRA) ---
    loadingText.value = "Midiendo velocidad real...";
    await new Promise(resolve => setTimeout(resolve, 50));
    const msPing = await measurePing();
    const speedMbps = await runSingleSpeedTest();

    // --- PASO 3: RESULTADOS Y REPORTE ---
    speed.value = speedMbps;
    ping.value = msPing;
    
    enviarReporte(speedMbps, getStatus(speedMbps).label, msPing);
    enviarResultados(speedMbps, msPing, getStatus(speedMbps).label);

    updateMiniDashboard();

  } catch (err) {
    console.error("Error en la medición:", err);
  } finally {
    loading.value = false;
    loadingText.value = "Test Finalizado";
  }
};

// --- FUNCIÓN DE APOYO: LA MEDICIÓN PURA ---
const runSingleSpeedTest = async () => {
  const testImage = "https://source.unsplash.com/random/4000x4000?" + Date.now();
  const estimatedSizeInMbits = 16; 
  const startTime = performance.now();
  
  await fetch(testImage, { mode: 'no-cors', cache: 'no-store' });
  
  const endTime = performance.now();
  const durationInSeconds = (endTime - startTime) / 1000;
  return (estimatedSizeInMbits / durationInSeconds).toFixed(2);
};

/*
// --- AUTOMATIZACIÓN (CADA HORA) ---
onMounted(() => {
  // Intervalo de 1 hora (3,600,000 ms)
  setInterval(() => {
    if (isRegistered.value) {
      console.log("Iniciando test automático por hora...");
      startTest();
    }
  }, 3600000);

  document.addEventListener('click', closeOnClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', closeOnClickOutside);
});
*/

onMounted(() => {
  setupAutoTest();
  window.addEventListener('config-updated', setupAutoTest);
  document.addEventListener('click', closeOnClickOutside);

  if (!localStorage.getItem('testMode')) {
    localStorage.setItem('testMode', 'both');
    console.log("Configuración inicial establecida: Manual y Automático");
  }
  
  if (!localStorage.getItem('testInterval')) {
    localStorage.setItem('testInterval', '60');
    console.log("Configuración inicial establecida: Cada hora");
  }
});

onUnmounted(() => {
  if (autoTestTimer) clearInterval(autoTestTimer);
  window.removeEventListener('config-updated', setupAutoTest);
});

const confirmLogout = () => {
  localStorage.clear();
  userName.value = '';
  baseNumber.value = '';
  speed.value = null;
  ping.value = null;
  showModal.value = false;
  emit('logout');
};

watch(isRegistered, (newValue) => {
  if (newValue) {
    document.body.classList.add('dashboard-active');
  } else {
    document.body.classList.remove('dashboard-active');
  }
}, { immediate: true });

/* --- VENTANA RESUMEN --- */
let miniWindowRef = null; // Guardará la referencia a la ventana emergente

const colorMap = {
  'status-low': { bg: '#f8d7da', text: '#721c24' }, // Rojo (Baja)
  'status-mod': { bg: '#fff3cd', text: '#856404' }, // Amarillo (Moderada)
  'status-opt': { bg: '#d4edda', text: '#155724' }, // Verde (Óptima)
  'status-exc': { bg: '#d1ecf1', text: '#328df4' } // Celeste (Excelente)
};

const updateMiniDashboard = () => {
  if (!miniWindowRef || miniWindowRef.closed) return;

  const colors = colorMap[status.value.class] || { bg: '#e2e3e5', text: '#383d41' };
  const base64Earth = "data:image/jpeg;base64,...(aquí pegas el código gigante)...";

  const htmlContent = `
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
            background-color: ${colors.bg};
            color: ${colors.text};
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
        <div class="card">
          <img src="https://cdn.shopify.com/s/files/1/0383/1984/9609/files/logo-color-lanumero1.png" width="120" class="logo-header" style="margin-bottom:15px">
          <div class="dashboard-container">
            <div class="speed-section">
              <div class="label">Velocidad Actual</div>
              <div class="value">${speed.value || '--'} <small style="font-size:1.1rem">Mbps</small></div>
            </div>
            <div class="info-section">
              <div class="label">Latencia (Ping)</div>
              <div class="ping">${ping.value || '--'} ms</div>
              <div class="status">${status.value.label || 'Sin datos'}</div>
            </div>
          </div>
          <div class="footer">Actualizado: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
      </body>
    </html>
  `;

  miniWindowRef.document.open();
  miniWindowRef.document.write(htmlContent);
  miniWindowRef.document.close();
};

const openMiniDashboard = () => {
  const width = 490;
  const height = 170;
  
  // Si ya está abierta, solo le damos foco
  if (miniWindowRef && !miniWindowRef.closed) {
    miniWindowRef.focus();
    return;
  }

  miniWindowRef = window.open(
    "",
    "MiniDashboard",
    `width=${width},height=${height},menubar=no,toolbar=no,location=no`
  );
  
  updateMiniDashboard();
};

</script>

<template>
  <Header 
    v-model:tabActual="tabActual"
    :isRegistered="isRegistered"
    :speed="speed"
    :ping="ping"
    :status="status"
    @openMiniDashboard="openMiniDashboard"
    @triggerLogout="showModal = true"
  />

  <div class="container" :class="{ 'dashboard-mode': isRegistered }">
    <div class="dashboard-view">
      <div v-if="tabActual === 'test'" class="test-screen">
        <h1>Test de Internet</h1>
        <p><strong>Hola {{ userName }}</strong></p>
        <p>Haga click en el botón para verificar tu conexión actual.</p>
        
        <div class="card">
          <button @click="startTest" :disabled="loading">
            {{ loading ? "Midiendo..." : "Iniciar Test de Velocidad" }}
          </button>
          
          <div v-if="loading" class="spinner-container">
            <div class="loader"></div>
            <p class="loading-text">{{ loadingText }}</p>
          </div>
          
          <div v-if="!loading && speed" class="result">
            <div class="metrics-row">
              <p>Latencia (Ping): <strong>{{ ping }} ms</strong></p>
            </div>
            <div class="gauge-container">
              <div class="gauge-body">
                <div class="gauge-needle" :style="{ transform: `rotate(${Math.min(speed * 0.9, 180) - 90}deg)` }"></div>
              </div>
            </div>
            <h2 class="speed-value">{{ speed }} Mbps</h2>
            <p class="status-label-static">
              Conexión: <span :class="status.class"><strong>{{ status.label }}</strong></span>
            </p>
          </div>
        </div>
      </div>

      <div v-if="tabActual === 'mapa'" class="map-view">
        <HeatMap />
      </div>

      <div v-if="tabActual === 'config'" class="settings-view">
        <Settings />
      </div>
    </div>
  </div>

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