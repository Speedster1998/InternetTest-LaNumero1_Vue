<script setup>
import { ref, onMounted } from 'vue';
import './TestsResults.css';

const resultados = ref([]);
const loading = ref(true);

const fetchResultados = async () => {
  try {
    const response = await fetch('http://localhost:3000/resultados');
    const data = await response.json();
    
    // Orden descendente según el ID:
    data.sort((a, b) => a.id_monitoreo - b.id_monitoreo);
    
    resultados.value = data;
  } catch (error) {
    console.error('Error fetching resultados:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchResultados();
});

const getStatusClass = (nivel) => {
  if (!nivel) return '';
  const n = nivel.toLowerCase();
  if (n.includes('excelente')) return 'status-excelent';
  if (n.includes('óptima') || n.includes('optima')) return 'status-optime';
  if (n.includes('moderada')) return 'status-moderate';
  if (n.includes('baja')) return 'status-lower';
  return '';
};

const formatoFecha = (fechaRaw) => {
  if (!fechaRaw) return 'N/A';
  
  const formatoLocal = fechaRaw.replace(" ", "T");
  const fecha = new Date(formatoLocal);
  
  if (isNaN(fecha.getTime())) return fechaRaw;

  return fecha.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};
</script>

<template>
  <div class="resultados-view">
    <h1 class="resultados-title">Resultados de los Test</h1>
    <p class="results-order">Ordenados por tiempo de registro, del más antiguo al más reciente</p>
    
    <div v-if="loading" class="loading-wrapper">
      <div class="spinner"></div>
      <p>Cargando resultados...</p>
    </div>

    <div v-else-if="resultados.length === 0" class="empty-wrapper">
      <p>No hay resultados registrados aún.</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="resultados-table">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Usuario</th>
            <th>Sede</th>
            <th>Velocidad (Mbps)</th>
            <th>Ping (ms)</th>
            <th>Nivel</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, index) in resultados" :key="index">
            <td>{{ formatoFecha(res.fecha_hora) }}</td>
            <td>{{ res.nom_usuario }}</td>
            <td>{{ res.sede || 'N/A' }}</td>
            <td>{{ res.velocidad_bajada_mbps }}</td>
            <td>{{ res.ping_ms }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(res.nivel_conexion)">
                {{ res.nivel_conexion }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
