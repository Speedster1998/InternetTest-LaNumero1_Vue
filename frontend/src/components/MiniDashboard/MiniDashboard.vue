<script setup>
import { computed } from 'vue';

const props = defineProps({
  speed: [Number, String],
  ping: [Number, String],
  statusLabel: String,
  statusClass: String
});

const colorMap = {
  'status-low': { bg: '#f8d7da', text: '#721c24' },
  'status-mod': { bg: '#fff3cd', text: '#856404' },
  'status-opt': { bg: '#d4edda', text: '#155724' },
  'status-exc': { bg: '#d1ecf1', text: '#328df4' }
};

const colors = computed(() => colorMap[props.statusClass] || { bg: '#e2e3e5', text: '#383d41' });
const horaActual = computed(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
</script>

<template>
  <div class="card">
    <img src="https://cdn.shopify.com/s/files/1/0383/1984/9609/files/logo-color-lanumero1.png" width="120" class="logo-header" style="margin-bottom:15px">
    <div class="dashboard-container">
      <div class="speed-section">
        <div class="label">Velocidad Actual</div>
        <div class="value">{{ speed || '--' }} <small style="font-size:1.1rem">Mbps</small></div>
      </div>
      <div class="info-section">
        <div class="label">Latencia (Ping)</div>
        <div class="ping">{{ ping || '--' }} ms</div>
        <div class="status" :style="{ backgroundColor: colors.bg, color: colors.text }">
          {{ statusLabel || 'Sin datos' }}
        </div>
      </div>
    </div>
    <div class="footer">Actualizado: {{ horaActual }}</div>
  </div>
</template>

<script>
import { ref, createApp } from 'vue';
import techImg from '/src/Images/abstract_tech.jpg';
import MiniDashboard from './MiniDashboard.vue'; // Se importa a sí mismo como componente procesado

let miniWindowRef = null;
let miniWindowInstance = null;

// Estados de respaldo para la sincronización rápida
const latestData = ref({
  speed: null,
  ping: null,
  statusLabel: 'Sin datos',
  statusClass: ''
});

export const toggleMiniDashboard = (data) => {
  if (data) {
    latestData.value = data;
    // Si la ventana ya existe y está viva, actualizamos sus props reactivas al vuelo
    if (miniWindowInstance) {
      Object.assign(miniWindowInstance._instance.props, data);
      return;
    }
  }

  const width = 490;
  const height = 170;

  if (miniWindowRef && !miniWindowRef.closed) {
    miniWindowRef.focus();
    return;
  }

  miniWindowRef = window.open("", "MiniDashboard", `width=${width},height=${height},menubar=no,toolbar=no,location=no`);

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

  // Esperamos los 40ms a que el DOM se asiente
  setTimeout(() => {
    try {
      const containerDiv = subDocument.getElementById('mini-app-root');
      if (!containerDiv) return;

      if (miniWindowInstance) miniWindowInstance.unmount();

      // Montamos el componente MiniDashboard compilado de verdad pasándole las variables de inicio
      miniWindowInstance = createApp(MiniDashboard, {
        speed: latestData.value.speed,
        ping: latestData.value.ping,
        statusLabel: latestData.value.statusLabel,
        statusClass: latestData.value.statusClass
      });
      
      miniWindowInstance.mount(containerDiv);
    } catch (error) {
      console.error("Error al montar el MiniDashboard real:", error);
    }
  }, 40);
};
</script>