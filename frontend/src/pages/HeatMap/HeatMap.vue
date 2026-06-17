<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png'; 
import 'leaflet/dist/leaflet.css';
import '../HeatMap/HeatMap.css';

const map = ref(null);
const heatLayer = ref(null); 
const isLegendOpen = ref(true);

const toggleLegend = () => {
  isLegendOpen.value = !isLegendOpen.value;
};

// Vista general de todo Perú
const coordenadasPeru = [-9.19, -75.015];
const zoomPeru = 6;

const cargarPuntosDeCalor = async () => {
  try {
    // Captura fresca del storage
    const sedeActual = localStorage.getItem('baseNumber') || localStorage.getItem('user_base') || 'OFC - Lima';
    console.log("Buscando en el mapa la sede activa:", sedeActual);

    const response = await fetch(`http://localhost:3000/obtener-coordenadas?sede=${encodeURIComponent(sedeActual)}`);
    const datosReales = await response.json();
    
    if (map.value && datosReales.length > 0) {
      await import('leaflet.heat');
      
      // 1. BUSCADOR INTELIGENTE DE SEDE
      const infoSedeUsuario = datosReales.find(row => {
        const nombreLugar = row.lugar ? row.lugar.toLowerCase() : '';
        const codigoUbi = row.cod_ubi ? row.cod_ubi.toLowerCase() : '';
        const sesionUsuario = sedeActual.toLowerCase();

        return sesionUsuario.includes(nombreLugar) || sesionUsuario.includes(codigoUbi);
      });

      // 2. VISTA PANORÁMICA DE PERÚ (muestra todas las sedes a la vez)
      map.value.setView(coordenadasPeru, zoomPeru);

      // 3. MAPEO DE PUNTOS DE CALOR
      // Solo mapeamos filas que tengan velocidades reales
      const puntosCalor = datosReales
        .filter(row => row.velocidad !== null)
        .map(row => {
          let intensidad = 0.1;
          if (row.velocidad < 20) intensidad = 1.0;     // Lenta (Rojo)
          else if (row.velocidad < 50) intensidad = 0.7;  // Moderada (Naranja)
          else if (row.velocidad < 100) intensidad = 0.4;  // Óptima (Verde)
          else intensidad = 0.1;                          // Excelente (Azul)

          return [parseFloat(row.latitud), parseFloat(row.longitud), intensidad];
        });

      if (heatLayer.value) {
        map.value.removeLayer(heatLayer.value);
      }

      // Renderizamos las manchas si existen registros de velocidad
      if (puntosCalor.length > 0) {
        heatLayer.value = L.heatLayer(puntosCalor, {
          radius: 60,
          blur: 40,
          maxZoom: 10,
          minOpacity: 0.4,
          gradient: {
            0.2: 'rgba(0, 0, 255, 0.6)',    // Azul muy suave (Excelente)
            0.4: 'rgba(0, 255, 255, 0.7)',  // Cian (Óptima)
            0.6: 'rgba(0, 255, 0, 0.8)',    // Verde (Moderada)
            0.8: 'rgba(255, 165, 0, 0.85)', // Naranja (Inestable)
            1.0: 'rgba(220, 20, 60, 0.9)'
          }
        }).addTo(map.value);
      }
    }
  } catch (error) {
    console.error("Error al cargar los puntos de calor en el frontend:", error);
  }
};

onMounted(async () => {
  map.value = L.map('map').setView(coordenadasPeru, zoomPeru);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value);

  await cargarPuntosDeCalor();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});
</script>

<template>
  <div class="map-view">
    <h1>Cobertura Geográfica</h1>
    <p class="subtitle">Monitoreo en tiempo real de la calidad de conexión por sedes</p>
    <div class="map-wrapper">
      <div id="map" class="map-container"></div>
      
      <!-- Botón flotante para abrir leyenda -->
      <button 
        v-if="!isLegendOpen" 
        class="legend-fab" 
        @click="toggleLegend" 
        title="Mostrar Leyenda">
        <v-icon name="ai-acclaim" scale="1.1" />
      </button>

      <!-- Panel de Leyenda del Mapa de Calor -->
      <div v-else class="heatmap-legend">
        <div class="legend-header" @click="toggleLegend" title="Minimizar leyenda">
          <h4>Leyenda de Red</h4>
          <button class="toggle-btn">
            <v-icon name="fa-chevron-down" scale="0.9" />
          </button>
        </div>
        <div class="legend-content">
          <div class="legend-item">
            <span class="color-box" style="background: rgba(0, 0, 255, 0.6);"></span>
            <span>Excelente (>100 Mbps)</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background: rgba(0, 250, 250, 0.7);"></span>
            <span>Óptima (50 - 100 Mbps)</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background: rgb(253, 210, 10);"></span>
            <span>Moderada (20 - 50 Mbps)</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background: red;"></span>
            <span>Lenta (&lt;20 Mbps)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>