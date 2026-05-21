<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png'; 
import 'leaflet/dist/leaflet.css';
import '../HeatMap/HeatMap.css';

const map = ref(null);
const heatLayer = ref(null); 

// Coordenadas de respaldo de Oficina (Lima), en caso de que ocurra un error
const coordenadasPorDefecto = [-12.06948, -77.03023];

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

      // 2. TELETRANSPORTACIÓN INMEDIATA (Gracias al LEFT JOIN, esto siempre se cumplirá)
      if (infoSedeUsuario) {
        const nuevaLat = parseFloat(infoSedeUsuario.latitud);
        const nuevaLng = parseFloat(infoSedeUsuario.longitud);
        
        console.log(`--> [ÉXITO] Enfocando mapa en: ${infoSedeUsuario.lugar} ([${nuevaLat}, ${nuevaLng}])`);
        map.value.setView([nuevaLat, nuevaLng], 14);
      } else {
        map.value.setView(coordenadasPorDefecto, 12);
      }

      // 3. MAPEO DE PUNTOS DE CALOR
      // Solo mapeamos filas que tengan velocidades reales
      const puntosCalor = datosReales
        .filter(row => row.velocidad !== null)
        .map(row => {
          let intensidad = 0.2;
          if (row.velocidad >= 100) intensidad = 1.0;     // Excelente (Rojo)
          else if (row.velocidad >= 50) intensidad = 0.7;  // Óptima (Naranja)
          else if (row.velocidad >= 20) intensidad = 0.4;  // Moderada (Verde)
          else intensidad = 0.1;                          // Baja (Azul)

          return [parseFloat(row.latitud), parseFloat(row.longitud), intensidad];
        });

      if (heatLayer.value) {
        map.value.removeLayer(heatLayer.value);
      }

      // Renderizamos las manchas si existen registros de velocidad
      if (puntosCalor.length > 0) {
        heatLayer.value = L.heatLayer(puntosCalor, {
          radius: 40,
          blur: 25,
          maxZoom: 15,
          gradient: { 0.2: 'blue', 0.5: 'lime', 0.8: 'orange', 1.0: 'red' }
        }).addTo(map.value);
      }
    }
  } catch (error) {
    console.error("Error al cargar los puntos de calor en el frontend:", error);
  }
};

onMounted(async () => {
  map.value = L.map('map').setView(coordenadasPorDefecto, 12);

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
    
    <div id="map" class="map-container"></div>
  </div>
</template>