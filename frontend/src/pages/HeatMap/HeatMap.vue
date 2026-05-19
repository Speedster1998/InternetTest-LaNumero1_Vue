<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png'; 
import 'leaflet/dist/leaflet.css';
import '../HeatMap/HeatMap.css';

const map = ref(null);
const heatLayer = ref(null);

const sedeUsuario = ref(localStorage.getItem('user_base') || 'OFC - Lima'); 

// Coordenadas de respaldo (Lima) por si acaso ocurra un error
const coordenadasPorDefecto = [-12.06948, -77.03023];

const cargarPuntosDeCalor = async () => {
  try {
    const response = await fetch('http://localhost:3000/obtener-coordenadas');
    const datosReales = await response.json();
    
    if (map.value && datosReales.length > 0) {
      // Importamos dinámicamente el plugin si no se ha importado antes
      await import('leaflet.heat');

      // Si ya existía una capa de calor previa, la removemos para no duplicar
      if (heatLayer.value) {
        map.value.removeLayer(heatLayer.value);
      }

      // Dibujamos el mapa de calor con los datos reales de MySQL
      heatLayer.value = L.heatLayer(datosReales, {
        radius: 40,
        blur: 25,
        maxZoom: 15,
        gradient: {
          0.2: 'blue',
          0.5: 'lime',
          0.8: 'orange',
          1.0: 'red'
        }
      }).addTo(map.value);
    }
  } catch (error) {
    console.error("Error al cargar los puntos de calor en el frontend:", error);
  }
};

onMounted(async () => {
  // 1. Inicializar el mapa centrado en Lima con un zoom de 12
  map.value = L.map('map').setView(coordenadasPorDefecto, 12);

  // 2. Cargar las capas de diseño (OpenStreetMap clásico)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value);

  // 3. Ejecutar la carga de datos desde el backend
  await cargarPuntosDeCalor();
});

// Limpieza para evitar fugas de memoria al cambiar de pestaña
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