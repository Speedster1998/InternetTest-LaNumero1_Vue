<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import '../InternetTest/InternetTest.css';
import techImg from '/src/Images/abstract_tech.jpg';
import { useRegisterSW } from 'virtual:pwa-register/vue'
useRegisterSW()

const userName = ref(localStorage.getItem('userName') || '');
const baseNumber = ref(localStorage.getItem('baseNumber') || '');
const isOpen = ref(false);
const isRegistered = ref(!!localStorage.getItem('userName'));
const ping = ref(null);
const speed = ref(null);
const loading = ref(false);
const loadingText = ref("");
const isOpenMenu = ref(false);
const menuRef = ref(null);

defineProps({
  tabActual: String
});

const emit = defineEmits(['test-complete']);

// --- LÓGICA DEL TEST DE INTERNET ---
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

/*
// --- ENVÍO DE INFORMACIÓN A UNA HOJA DE GOOGLE SHEETS ---
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
};*/

// --- ENVÍO DE INFORMACIÓN A LA BASE DE DATOS ---
const enviarResultados = async (velocidad, latencia, nivel) => {
  // Funciones para subir la hora de nuestra máquina al DB:
  const ahora = new Date();
  const fechaLocal = ahora.getFullYear() + '-' +
    String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
    String(ahora.getDate()).padStart(2, '0') + ' ' +
    String(ahora.getHours()).padStart(2, '0') + ':' +
    String(ahora.getMinutes()).padStart(2, '0') + ':' +
    String(ahora.getSeconds()).padStart(2, '0');
  
  const datos = {
    id_provincia: parseInt(localStorage.getItem('idProvincia')),
    nom_usuario: userName.value,
    velocidad_bajada_mbps: velocidad,
    ping_ms: latencia,
    nivel_conexion: nivel,
    fecha_test: fechaLocal
  };

  try {
    const response = await fetch('http://localhost:3000/registrar-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    await response.json();
    console.log("Resultados guardados con éxito en MySQL.");
  } catch (error) {
    console.error("Error al guardar en base de datos:", error);
  }
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
    
    // enviarReporte(speedMbps, getStatus(speedMbps).label, msPing);
    enviarResultados(speedMbps, msPing, getStatus(speedMbps).label);

    emit('test-complete', {
      speed: speedMbps,
      ping: msPing,
      statusLabel: getStatus(speedMbps).label,
      statusClass: getStatus(speedMbps).class
    });

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

watch(isRegistered, (newValue) => {
  if (newValue) {
    document.body.classList.add('dashboard-active');
  } else {
    document.body.classList.remove('dashboard-active');
  }
}, { immediate: true });

</script>

<template>
  <div class="container" :class="{ 'dashboard-mode': isRegistered }">
    <div class="dashboard-view">
      <div class="test-screen">
        <h1 class="test-title">
          INTERNET<v-icon name="md-speed" class="test-icon" scale="2.8" /><span>TEST</span>
        </h1>
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
    </div>
  </div>
</template>